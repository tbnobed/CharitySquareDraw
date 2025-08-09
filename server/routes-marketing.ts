import type { Express } from "express";
import { storage } from "./storage";
import { PostgresStorage } from "./postgres-storage";

// Marketing and historical data routes
export function registerMarketingRoutes(app: Express) {
  // Get all participants for marketing purposes
  app.get("/api/marketing/participants", async (req, res) => {
    try {
      if (storage instanceof PostgresStorage) {
        const participants = await storage.getAllParticipants();
        res.json({ participants });
      } else {
        res.status(400).json({ error: "Marketing features require PostgreSQL database" });
      }
    } catch (error) {
      console.error('Error getting all participants:', error);
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  // Get completed game rounds and winners
  app.get("/api/marketing/winners", async (req, res) => {
    try {
      if (storage instanceof PostgresStorage) {
        const winners = await storage.getWinners();
        res.json({ winners });
      } else {
        res.status(400).json({ error: "Winner history requires PostgreSQL database" });
      }
    } catch (error) {
      console.error('Error getting winners:', error);
      res.status(500).json({ error: "Failed to fetch winners" });
    }
  });

  // Get completed game rounds
  app.get("/api/marketing/history", async (req, res) => {
    try {
      if (storage instanceof PostgresStorage) {
        const completedRounds = await storage.getCompletedGameRounds();
        res.json({ gameRounds: completedRounds });
      } else {
        res.status(400).json({ error: "Game history requires PostgreSQL database" });
      }
    } catch (error) {
      console.error('Error getting game history:', error);
      res.status(500).json({ error: "Failed to fetch game history" });
    }
  });

  // Get participant by email (for returning customer lookup)
  app.get("/api/marketing/participant/email/:email", async (req, res) => {
    try {
      const { email } = req.params;
      if (storage instanceof PostgresStorage) {
        const participants = await storage.getParticipantsByEmail(email);
        res.json({ participants });
      } else {
        res.status(400).json({ error: "Participant lookup requires PostgreSQL database" });
      }
    } catch (error) {
      console.error('Error getting participant by email:', error);
      res.status(500).json({ error: "Failed to fetch participant" });
    }
  });

  // Get participant by phone (for returning customer lookup)
  app.get("/api/marketing/participant/phone/:phone", async (req, res) => {
    try {
      const { phone } = req.params;
      if (storage instanceof PostgresStorage) {
        const participants = await storage.getParticipantsByPhone(phone);
        res.json({ participants });
      } else {
        res.status(400).json({ error: "Participant lookup requires PostgreSQL database" });
      }
    } catch (error) {
      console.error('Error getting participant by phone:', error);
      res.status(500).json({ error: "Failed to fetch participant" });
    }
  });

  // Mark a game round as completed with winner
  app.post("/api/admin/complete-round", async (req, res) => {
    try {
      const { gameRoundId, winnerSquare } = req.body;
      
      if (!gameRoundId || !winnerSquare) {
        return res.status(400).json({ error: "Game round ID and winner square are required" });
      }

      const completedRound = await storage.completeGameRound(gameRoundId, winnerSquare);
      
      if (!completedRound) {
        return res.status(404).json({ error: "Game round not found" });
      }

      res.json({ gameRound: completedRound });
    } catch (error) {
      console.error('Error completing game round:', error);
      res.status(500).json({ error: "Failed to complete game round" });
    }
  });

  // Start a new game round
  app.post("/api/admin/new-round", async (req, res) => {
    try {
      const { pricePerSquare } = req.body;
      
      // Get the current round number
      const stats = await storage.getGameStats();
      const newRoundNumber = stats.currentRound + 1;

      const newRound = await storage.createGameRound({
        roundNumber: newRoundNumber,
        status: "active",
        pricePerSquare: pricePerSquare || 1000, // Default $10.00
        totalRevenue: 0,
      });

      // Initialize squares for the new round
      await storage.initializeSquares(newRound.id);

      res.json({ gameRound: newRound });
    } catch (error) {
      console.error('Error creating new game round:', error);
      res.status(500).json({ error: "Failed to create new game round" });
    }
  });
}