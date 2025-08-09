import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertParticipantSchema, participantFormSchema, type BoardUpdate } from "@shared/schema";
import { z } from "zod";

const clients = new Set<WebSocket>();

function broadcast(message: BoardUpdate) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current game stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getGameStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Get current game round data
  app.get("/api/game", async (req, res) => {
    try {
      const currentRound = await storage.getCurrentGameRound();
      if (!currentRound) {
        return res.status(404).json({ error: "No active game round" });
      }

      const squares = await storage.getSquaresByGameRound(currentRound.id);
      const participants = await storage.getParticipants(currentRound.id);

      res.json({
        gameRound: currentRound,
        squares,
        participants,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch game data" });
    }
  });

  // Get participants for admin view
  app.get("/api/participants", async (req, res) => {
    try {
      const currentRound = await storage.getCurrentGameRound();
      if (!currentRound) {
        return res.status(404).json({ error: "No active game round" });
      }

      const participants = await storage.getParticipants(currentRound.id);
      res.json(participants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  // Reserve squares and create participant
  app.post("/api/reserve", async (req, res) => {
    try {
      const validatedData = participantFormSchema.parse(req.body);
      const currentRound = await storage.getCurrentGameRound();
      
      if (!currentRound) {
        return res.status(400).json({ error: "No active game round" });
      }

      // Check if squares are available
      const squareChecks = await Promise.all(
        validatedData.squares.map(num => storage.getSquare(num, currentRound.id))
      );

      const unavailableSquares = squareChecks
        .map((square, index) => ({ square, number: validatedData.squares[index] }))
        .filter(({ square }) => !square || square.status !== "available")
        .map(({ number }) => number);

      if (unavailableSquares.length > 0) {
        return res.status(400).json({ 
          error: `Squares ${unavailableSquares.join(", ")} are not available` 
        });
      }

      // Create participant
      const participant = await storage.createParticipant({
        name: validatedData.name,
        email: validatedData.email,
        phone: validatedData.phone,
        gameRoundId: currentRound.id,
        squares: validatedData.squares,
        totalAmount: validatedData.squares.length * 20, // $20 per square
        paymentStatus: "pending",
      });

      // Reserve squares
      await storage.reserveSquares(validatedData.squares, currentRound.id, participant.id);

      // Broadcast update to all clients
      broadcast({
        type: 'SQUARE_UPDATE',
        data: { 
          squares: validatedData.squares, 
          status: 'reserved',
          participantId: participant.id,
          action: 'reserve'
        }
      });

      res.json({ participant });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Failed to reserve squares" });
      }
    }
  });

  // Confirm payment
  app.post("/api/confirm-payment/:participantId", async (req, res) => {
    try {
      const { participantId } = req.params;
      
      const participant = await storage.updateParticipantPaymentStatus(participantId, "paid");
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      // Mark squares as sold
      const squares = await storage.markSquaresSold(participantId);
      
      // Update game round revenue
      const currentRound = await storage.getCurrentGameRound();
      if (currentRound) {
        await storage.updateGameRound(currentRound.id, {
          totalRevenue: currentRound.totalRevenue + participant.totalAmount
        });
      }

      // Broadcast updates to all clients
      broadcast({
        type: 'SQUARE_UPDATE',
        data: { 
          squares: participant.squares, 
          status: 'sold',
          participantId: participant.id,
          action: 'confirm'
        }
      });

      broadcast({
        type: 'PARTICIPANT_ADDED',
        data: participant
      });

      broadcast({
        type: 'STATS_UPDATE',
        data: { totalRevenue: (currentRound?.totalRevenue || 0) + participant.totalAmount }
      });

      res.json({ participant, squares });
    } catch (error) {
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // Start new game round
  app.post("/api/new-round", async (req, res) => {
    try {
      const currentRound = await storage.getCurrentGameRound();
      let roundNumber = 1;
      
      if (currentRound) {
        await storage.updateGameRound(currentRound.id, { status: "completed" });
        roundNumber = currentRound.roundNumber + 1;
      }

      const newRound = await storage.createGameRound({
        roundNumber,
        status: "active",
        totalRevenue: 0,
      });

      await storage.initializeSquares(newRound.id);

      // Broadcast reset
      broadcast({
        type: 'GAME_RESET',
        data: { roundNumber }
      });

      res.json({ gameRound: newRound });
    } catch (error) {
      res.status(500).json({ error: "Failed to start new round" });
    }
  });

  // Draw winner
  app.post("/api/draw-winner", async (req, res) => {
    try {
      const currentRound = await storage.getCurrentGameRound();
      if (!currentRound) {
        return res.status(400).json({ error: "No active game round" });
      }

      const squares = await storage.getSquaresByGameRound(currentRound.id);
      const soldSquares = squares.filter(s => s.status === "sold");
      
      if (soldSquares.length === 0) {
        return res.status(400).json({ error: "No sold squares to draw from" });
      }

      const winnerSquare = soldSquares[Math.floor(Math.random() * soldSquares.length)];
      const winner = winnerSquare.participantId;

      await storage.completeGameRound(currentRound.id, winnerSquare.number);

      res.json({ 
        winnerSquare: winnerSquare.number,
        winnerId: winner,
        totalPot: currentRound.totalRevenue 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to draw winner" });
    }
  });

  // Export data
  app.get("/api/export", async (req, res) => {
    try {
      const currentRound = await storage.getCurrentGameRound();
      if (!currentRound) {
        return res.status(404).json({ error: "No active game round" });
      }

      const participants = await storage.getParticipants(currentRound.id);
      
      // Format for CSV export
      const csvData = participants.map(p => ({
        Name: p.name,
        Email: p.email,
        Phone: p.phone,
        Squares: p.squares.join(", "),
        Amount: `$${p.totalAmount}`,
        Status: p.paymentStatus,
        Date: p.createdAt.toISOString(),
      }));

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="participants-round-${currentRound.roundNumber}.json"`);
      res.json(csvData);
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected, total clients:', clients.size + 1);
    clients.add(ws);
    
    // Send welcome message to confirm connection
    ws.send(JSON.stringify({
      type: 'CONNECTION_ESTABLISHED',
      data: { message: 'WebSocket connected successfully' }
    }));
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected, remaining clients:', clients.size);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
    
    // Handle incoming messages from clients
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('WebSocket message received:', data);
        
        // Broadcast to all other clients
        clients.forEach(client => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message.toString());
          }
        });
      } catch (error) {
        console.error('Failed to process WebSocket message:', error);
      }
    });
  });

  return httpServer;
}
