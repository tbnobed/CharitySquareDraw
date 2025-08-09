import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertParticipantSchema, participantFormSchema, type BoardUpdate } from "@shared/schema";
import { z } from "zod";

const clients = new Set<WebSocket>();

// Track temporary square selections across all users
const temporarySelections = new Map<number, { selectedBy: string, timestamp: number }>();

function broadcast(message: BoardUpdate) {
  const data = JSON.stringify(message);
  console.log(`Broadcasting message to ${clients.size} clients:`, message);
  
  // Clean up closed connections first
  const closedClients: WebSocket[] = [];
  clients.forEach(client => {
    if (client.readyState === WebSocket.CLOSED) {
      closedClients.push(client);
    }
  });
  closedClients.forEach(client => clients.delete(client));
  
  // Send to active connections
  let sentCount = 0;
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(data);
        sentCount++;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        clients.delete(client);
      }
    }
  });
  
  console.log(`Message sent to ${sentCount} active clients`);
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
        totalAmount: validatedData.squares.length * currentRound.pricePerSquare, // Use dynamic price
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
        pricePerSquare: currentRound?.pricePerSquare || 1000, // Keep same price or default $10.00
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

  // Update price per square
  app.post("/api/update-price", async (req, res) => {
    try {
      const { pricePerSquare } = req.body;
      
      if (typeof pricePerSquare !== 'number' || pricePerSquare <= 0) {
        return res.status(400).json({ error: "Price per square must be a positive number" });
      }

      const currentRound = await storage.getCurrentGameRound();
      if (!currentRound) {
        return res.status(404).json({ error: "No active game round" });
      }

      const updatedRound = await storage.updatePricePerSquare(currentRound.id, pricePerSquare);
      res.json({ success: true, gameRound: updatedRound });
    } catch (error) {
      res.status(500).json({ error: "Failed to update price" });
    }
  });

  // Get temporary selections
  app.get("/api/selections", async (req, res) => {
    try {
      // Clean up old selections (older than 2 minutes)
      const now = Date.now();
      const entries = Array.from(temporarySelections.entries());
      for (const [square, selection] of entries) {
        if (now - selection.timestamp > 120000) {
          temporarySelections.delete(square);
        }
      }
      
      const selections = Array.from(temporarySelections.entries()).map(([square, data]) => ({
        square,
        selectedBy: data.selectedBy,
        timestamp: data.timestamp
      }));
      
      res.json({ selections });
    } catch (error) {
      res.status(500).json({ error: "Failed to get selections" });
    }
  });

  // Update temporary selections
  app.post("/api/selections", async (req, res) => {
    try {
      const { squares, action, sessionId } = req.body;
      
      if (action === 'select') {
        squares.forEach((square: number) => {
          // Only allow selection if square is not already selected by someone else
          if (!temporarySelections.has(square)) {
            temporarySelections.set(square, {
              selectedBy: sessionId || 'anonymous',
              timestamp: Date.now()
            });
          }
        });
      } else if (action === 'deselect') {
        squares.forEach((square: number) => {
          // Only allow deselection if this session selected the square
          const selection = temporarySelections.get(square);
          if (selection && selection.selectedBy === sessionId) {
            temporarySelections.delete(square);
          }
        });
      } else if (action === 'clear') {
        // Clear all selections for this session
        const entries = Array.from(temporarySelections.entries());
        for (const [square, data] of entries) {
          if (data.selectedBy === sessionId) {
            temporarySelections.delete(square);
          }
        }
      }
      
      res.json({ success: true, totalSelections: temporarySelections.size });
    } catch (error) {
      res.status(500).json({ error: "Failed to update selections" });
    }
  });

  // Export data
  app.get("/api/export", async (req, res) => {
    try {
      const currentRound = await storage.getCurrentGameRound();
      if (!currentRound) {
        // Return empty data instead of error if no game round
        return res.json({ 
          participants: [], 
          gameRound: null,
          message: "No active game round" 
        });
      }

      const participants = await storage.getParticipants(currentRound.id);
      
      res.json({
        participants,
        gameRound: currentRound,
        exportDate: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server temporarily disabled to fix connection loops
  // const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  console.log('WebSocket server disabled - using polling for real-time updates');

  return httpServer;
}
