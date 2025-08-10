import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertParticipantSchema, participantFormSchema, gameRounds, participants, type BoardUpdate } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { db } from "./db";
import { z } from "zod";
import { registerMarketingRoutes } from "./routes-marketing";

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
  // Register marketing and historical data routes
  registerMarketingRoutes(app);
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

  // Get specific game round by ID
  app.get("/api/game-round/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const gameRound = await storage.getGameRound(id);
      if (!gameRound) {
        return res.status(404).json({ error: "Game round not found" });
      }
      res.json({ gameRound });
    } catch (error) {
      res.status(500).json({ error: "Failed to get game round" });
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

  // Get individual participant by ID
  app.get("/api/participant/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const participant = await storage.getParticipant(id);
      
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      res.json(participant);
    } catch (error) {
      res.status(500).json({ error: "Failed to get participant" });
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

  // Cancel reservation
  app.post("/api/cancel-reservation/:participantId", async (req, res) => {
    try {
      const { participantId } = req.params;
      
      // Get participant to access their squares
      const participant = await storage.getParticipant(participantId);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      // Only allow cancelling if payment is still pending
      if (participant.paymentStatus !== "pending") {
        return res.status(400).json({ error: "Cannot cancel paid reservation" });
      }

      // Release the squares back to available
      await storage.releaseSquares(participant.squares, participant.gameRoundId);
      
      // Delete the participant record since reservation was cancelled
      await storage.deleteParticipant(participantId);

      // Broadcast updates to all clients
      broadcast({
        type: 'SQUARE_UPDATE',
        data: { 
          squares: participant.squares, 
          status: 'available',
          participantId: null,
          action: 'cancel'
        }
      });

      res.json({ success: true, releasedSquares: participant.squares });
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel reservation" });
    }
  });

  // Start new game round
  app.post("/api/new-round", async (req, res) => {
    try {
      const currentRound = await storage.getCurrentGameRound();
      
      // Get the highest round number to determine next round
      const allRounds = await db
        .select()
        .from(gameRounds)
        .orderBy(desc(gameRounds.roundNumber))
        .limit(1);
      
      let roundNumber = 1;
      if (allRounds.length > 0) {
        roundNumber = allRounds[0].roundNumber + 1;
      }
      
      if (currentRound) {
        await storage.updateGameRound(currentRound.id, { status: "completed" });
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

      // Check if round is already completed
      if (currentRound.status === 'completed') {
        return res.status(400).json({ error: "Round is already completed. Start a new round to draw another winner." });
      }

      const squares = await storage.getSquaresByGameRound(currentRound.id);
      const soldSquares = squares.filter(s => s.status === "sold");
      
      if (soldSquares.length === 0) {
        return res.status(400).json({ error: "No sold squares to draw from" });
      }

      const winnerSquare = soldSquares[Math.floor(Math.random() * soldSquares.length)];
      const winner = winnerSquare.participantId;

      await storage.completeGameRound(currentRound.id, winnerSquare.number);

      // Get winner participant details
      const winnerParticipant = await storage.getParticipant(winner!);
      
      // Broadcast winner information
      broadcast({
        type: 'WINNER_DRAWN',
        data: { 
          winnerSquare: winnerSquare.number,
          winnerId: winner,
          winnerName: winnerParticipant?.name || 'Unknown',
          totalPot: currentRound.totalRevenue,
          roundNumber: currentRound.roundNumber
        }
      });
      
      res.json({ 
        winnerSquare: winnerSquare.number,
        winnerId: winner,
        winnerName: winnerParticipant?.name || 'Unknown',
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

  // Get winner for a specific round (for receipts)
  app.get("/api/winner/:roundId", async (req, res) => {
    try {
      const { roundId } = req.params;
      
      // Get the specific round
      const round = await db
        .select()
        .from(gameRounds)
        .where(eq(gameRounds.id, roundId))
        .limit(1);
      
      const gameRound = round[0];
      
      if (!gameRound || !gameRound.winnerSquare || gameRound.status !== 'completed') {
        return res.json({ winner: null });
      }
      
      // Find the participant who has the winning square
      const gameParticipants = await storage.getParticipants(gameRound.id);
      const winnerParticipant = gameParticipants.find(p => 
        p.squares.includes(gameRound.winnerSquare!)
      );
      
      if (!winnerParticipant) {
        return res.json({ winner: null });
      }
      
      res.json({
        winner: {
          name: winnerParticipant.name,
          square: gameRound.winnerSquare,
          totalPot: gameRound.totalRevenue,
          roundNumber: gameRound.roundNumber,
          completedAt: gameRound.completedAt
        }
      });
    } catch (error) {
      console.error('Error getting round winner:', error);
      res.status(500).json({ error: "Failed to get round winner information" });
    }
  });

  // Get winner information - show winner from completed round until new active round starts
  app.get("/api/winner", async (req, res) => {
    try {
      // Get the current round (most recent)
      const currentRound = await storage.getCurrentGameRound();
      
      // If no round exists, return null
      if (!currentRound) {
        return res.json({ winner: null });
      }
      
      // If the current round is completed and has a winner, show the winner
      if (currentRound.status === 'completed' && currentRound.winnerSquare) {
        // Find the participant who has the winning square
        const gameParticipants = await storage.getParticipants(currentRound.id);
        const winnerParticipant = gameParticipants.find(p => 
          p.squares.includes(currentRound.winnerSquare!)
        );
        
        if (winnerParticipant) {
          return res.json({
            winner: {
              name: winnerParticipant.name,
              square: currentRound.winnerSquare,
              totalPot: currentRound.totalRevenue,
              roundNumber: currentRound.roundNumber,
              completedAt: currentRound.completedAt
            }
          });
        }
      }
      
      // If the current round is active (new round started), don't show winner
      res.json({ winner: null });
    } catch (error) {
      console.error('Error getting winner:', error);
      res.status(500).json({ error: "Failed to get winner information" });
    }
  });

  // Get all round winners
  app.get("/api/winners", async (req, res) => {
    try {
      const winners = await storage.getWinners();
      res.json({ winners });
    } catch (error) {
      console.error('Error getting all winners:', error);
      res.status(500).json({ error: "Failed to get winners information" });
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

  // Reset system back to Round #1
  app.post("/api/reset-system", async (req, res) => {
    try {
      // Reset the entire system back to Round #1
      await storage.resetSystem();
      
      // Create a new Round #1
      const newRound = await storage.createGameRound({
        roundNumber: 1,
        status: "active",
        pricePerSquare: 1000, // Default $10.00
        totalRevenue: 0,
      });

      await storage.initializeSquares(newRound.id);

      broadcast({
        type: 'GAME_RESET',
        data: { roundNumber: 1 }
      });

      res.json({ 
        success: true, 
        gameRound: newRound,
        message: "System reset to Round #1" 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset system" });
    }
  });

  // Set manual winner (for when chicken selects winner)
  app.post("/api/manual-winner", async (req, res) => {
    try {
      const { squareNumber } = req.body;
      
      if (!squareNumber || squareNumber < 1 || squareNumber > 65) {
        return res.status(400).json({ error: "Invalid square number. Must be between 1-65." });
      }

      const currentRound = await storage.getCurrentGameRound();
      if (!currentRound) {
        return res.status(404).json({ error: "No active game round" });
      }

      // Check if square is sold
      const square = await storage.getSquareByNumber(squareNumber, currentRound.id);
      if (!square || square.status !== "sold") {
        return res.status(400).json({ error: "Square must be sold to be selected as winner" });
      }

      // Mark game round as completed with winner
      await storage.updateGameRound(currentRound.id, {
        status: "completed",
        winnerSquare: squareNumber,
        completedAt: new Date()
      });

      // Get winner participant details
      const winnerParticipant = await storage.getParticipant(square.participantId!);

      broadcast({
        type: 'WINNER_DRAWN',
        data: { 
          winnerSquare: squareNumber,
          winnerId: square.participantId!,
          winnerName: winnerParticipant?.name || 'Unknown',
          gameRoundId: currentRound.id,
          totalPot: currentRound.totalRevenue,
          roundNumber: currentRound.roundNumber
        }
      });

      res.json({ 
        success: true, 
        winnerSquare: squareNumber,
        winnerId: square.participantId!,
        winnerName: winnerParticipant?.name || 'Unknown',
        totalPot: currentRound.totalRevenue,
        message: `Square #${squareNumber} selected as winner!` 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to set manual winner" });
    }
  });

  // Cleanup expired reservations endpoint
  app.post("/api/cleanup-reservations", async (req, res) => {
    try {
      const currentRound = await storage.getCurrentGameRound();
      if (!currentRound) {
        return res.status(404).json({ error: "No active game round found" });
      }

      const cleanedSquares = await storage.cleanupExpiredReservations(currentRound.id);
      
      // Broadcast updates to all clients if squares were cleaned
      if (cleanedSquares.length > 0) {
        broadcast({
          type: 'SQUARE_UPDATE',
          data: { 
            squares: cleanedSquares.map(s => s.number), 
            status: 'available',
            participantId: null,
            action: 'cleanup'
          }
        });
      }
      
      res.json({ 
        success: true, 
        message: `Cleaned up ${cleanedSquares.length} expired reservations`,
        cleanedSquares: cleanedSquares.map(s => s.number)
      });
    } catch (error) {
      console.error('Error cleaning up reservations:', error);
      res.status(500).json({ error: "Failed to cleanup reservations" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server temporarily disabled to fix connection loops
  // const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  console.log('WebSocket server disabled - using polling for real-time updates');

  return httpServer;
}
