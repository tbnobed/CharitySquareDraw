import { eq, desc, and, sql } from 'drizzle-orm';
import { db, gameRounds, participants, squares } from './db';
import { 
  type GameRound, 
  type Participant, 
  type Square, 
  type InsertGameRound, 
  type InsertParticipant, 
  type InsertSquare, 
  type GameStats 
} from "@shared/schema";
import { randomUUID } from "crypto";
import type { IStorage } from './storage';

export class PostgresStorage implements IStorage {
  constructor() {
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      // Check if we have an active game round, if not create one
      const activeRound = await this.getCurrentGameRound();
      if (!activeRound) {
        const firstRound = await this.createGameRound({
          roundNumber: 1,
          status: "active",
          pricePerSquare: 1000, // $10.00 (stored in cents)
          totalRevenue: 0,
        });
        await this.initializeSquares(firstRound.id);
      }
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  async getCurrentGameRound(): Promise<GameRound | undefined> {
    try {
      const rounds = await db
        .select()
        .from(gameRounds)
        .where(eq(gameRounds.status, 'active'))
        .orderBy(desc(gameRounds.createdAt))
        .limit(1);
      
      return rounds[0];
    } catch (error) {
      console.error('Error getting current game round:', error);
      return undefined;
    }
  }

  async createGameRound(gameRound: InsertGameRound): Promise<GameRound> {
    const id = randomUUID();
    const newGameRound: GameRound = {
      id,
      roundNumber: gameRound.roundNumber,
      status: gameRound.status || 'active',
      pricePerSquare: gameRound.pricePerSquare || 1000,
      totalRevenue: gameRound.totalRevenue || 0,
      winnerSquare: gameRound.winnerSquare || null,
      startedAt: new Date(),
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(gameRounds).values(newGameRound);
    return newGameRound;
  }

  async updateGameRound(id: string, updates: Partial<GameRound>): Promise<GameRound | undefined> {
    try {
      const updatedGameRound = {
        ...updates,
        updatedAt: new Date(),
      };

      await db
        .update(gameRounds)
        .set(updatedGameRound)
        .where(eq(gameRounds.id, id));

      const result = await db
        .select()
        .from(gameRounds)
        .where(eq(gameRounds.id, id))
        .limit(1);

      return result[0];
    } catch (error) {
      console.error('Error updating game round:', error);
      return undefined;
    }
  }

  async updatePricePerSquare(gameRoundId: string, pricePerSquare: number): Promise<GameRound | undefined> {
    return this.updateGameRound(gameRoundId, { pricePerSquare });
  }

  async completeGameRound(id: string, winnerSquare: number): Promise<GameRound | undefined> {
    return this.updateGameRound(id, { 
      status: 'completed',
      winnerSquare,
      completedAt: new Date()
    });
  }

  async getParticipants(gameRoundId: string): Promise<Participant[]> {
    try {
      return await db
        .select()
        .from(participants)
        .where(eq(participants.gameRoundId, gameRoundId))
        .orderBy(desc(participants.createdAt));
    } catch (error) {
      console.error('Error getting participants:', error);
      return [];
    }
  }

  async getParticipant(id: string): Promise<Participant | undefined> {
    try {
      const result = await db
        .select()
        .from(participants)
        .where(eq(participants.id, id))
        .limit(1);

      return result[0];
    } catch (error) {
      console.error('Error getting participant:', error);
      return undefined;
    }
  }

  async createParticipant(participant: InsertParticipant): Promise<Participant> {
    const id = randomUUID();
    const newParticipant: Participant = {
      id,
      name: participant.name,
      email: participant.email,
      phone: participant.phone,
      gameRoundId: participant.gameRoundId,
      squares: participant.squares as number[],
      totalAmount: participant.totalAmount,
      paymentStatus: participant.paymentStatus || 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(participants).values(newParticipant);
    return newParticipant;
  }

  async updateParticipantPaymentStatus(id: string, status: string): Promise<Participant | undefined> {
    try {
      await db
        .update(participants)
        .set({ 
          paymentStatus: status,
          updatedAt: new Date()
        })
        .where(eq(participants.id, id));

      return this.getParticipant(id);
    } catch (error) {
      console.error('Error updating participant payment status:', error);
      return undefined;
    }
  }

  async deleteParticipant(id: string): Promise<void> {
    try {
      await db
        .delete(participants)
        .where(eq(participants.id, id));
    } catch (error) {
      console.error('Error deleting participant:', error);
    }
  }

  async getSquaresByGameRound(gameRoundId: string): Promise<Square[]> {
    try {
      return await db
        .select()
        .from(squares)
        .where(eq(squares.gameRoundId, gameRoundId))
        .orderBy(squares.number);
    } catch (error) {
      console.error('Error getting squares:', error);
      return [];
    }
  }

  async getSquare(number: number, gameRoundId: string): Promise<Square | undefined> {
    try {
      const result = await db
        .select()
        .from(squares)
        .where(
          and(
            eq(squares.number, number),
            eq(squares.gameRoundId, gameRoundId)
          )
        )
        .limit(1);

      return result[0];
    } catch (error) {
      console.error('Error getting square:', error);
      return undefined;
    }
  }

  async reserveSquares(squareNumbers: number[], gameRoundId: string, participantId: string): Promise<Square[]> {
    try {
      const updatedSquares: Square[] = [];

      for (const number of squareNumbers) {
        await db
          .update(squares)
          .set({
            status: 'reserved',
            participantId,
            reservedAt: new Date(),
            updatedAt: new Date()
          })
          .where(
            and(
              eq(squares.number, number),
              eq(squares.gameRoundId, gameRoundId),
              eq(squares.status, 'available')
            )
          );

        const square = await this.getSquare(number, gameRoundId);
        if (square) {
          updatedSquares.push(square);
        }
      }

      return updatedSquares;
    } catch (error) {
      console.error('Error reserving squares:', error);
      return [];
    }
  }

  async markSquaresSold(participantId: string): Promise<Square[]> {
    try {
      await db
        .update(squares)
        .set({
          status: 'sold',
          updatedAt: new Date()
        })
        .where(eq(squares.participantId, participantId));

      // Return the updated squares
      return await db
        .select()
        .from(squares)
        .where(eq(squares.participantId, participantId));
    } catch (error) {
      console.error('Error marking squares as sold:', error);
      return [];
    }
  }

  async releaseSquares(squareNumbers: number[], gameRoundId: string): Promise<Square[]> {
    try {
      const updatedSquares: Square[] = [];

      for (const number of squareNumbers) {
        await db
          .update(squares)
          .set({
            status: 'available',
            participantId: null,
            reservedAt: null,
            soldAt: null,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(squares.number, number),
              eq(squares.gameRoundId, gameRoundId)
            )
          );

        const square = await this.getSquare(number, gameRoundId);
        if (square) {
          updatedSquares.push(square);
        }
      }

      return updatedSquares;
    } catch (error) {
      console.error('Error releasing squares:', error);
      return [];
    }
  }

  async initializeSquares(gameRoundId: string): Promise<Square[]> {
    try {
      const squaresToInsert: Square[] = [];
      
      for (let i = 1; i <= 65; i++) {
        squaresToInsert.push({
          id: randomUUID(),
          number: i,
          gameRoundId,
          status: 'available',
          participantId: null,
          reservedAt: null,
          soldAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      await db.insert(squares).values(squaresToInsert);
      return squaresToInsert;
    } catch (error) {
      console.error('Error initializing squares:', error);
      return [];
    }
  }

  async getGameStats(): Promise<GameStats> {
    try {
      const currentRound = await this.getCurrentGameRound();
      
      if (!currentRound) {
        return {
          totalRevenue: 0,
          participantCount: 0,
          squaresSold: 0,
          percentFilled: 0,
          availableCount: 65,
          currentRound: 1,
        };
      }

      const participantsList = await this.getParticipants(currentRound.id);
      const squaresList = await this.getSquaresByGameRound(currentRound.id);

      const soldSquares = squaresList.filter(s => s.status === "sold");
      const reservedSquares = squaresList.filter(s => s.status === "reserved");
      const totalSold = soldSquares.length + reservedSquares.length;

      return {
        totalRevenue: currentRound.totalRevenue,
        participantCount: participantsList.length,
        squaresSold: totalSold,
        percentFilled: Math.round((totalSold / 65) * 100),
        availableCount: 65 - totalSold,
        currentRound: currentRound.roundNumber,
      };
    } catch (error) {
      console.error('Error getting game stats:', error);
      return {
        totalRevenue: 0,
        participantCount: 0,
        squaresSold: 0,
        percentFilled: 0,
        availableCount: 65,
        currentRound: 1,
      };
    }
  }

  // Additional methods for marketing and historical data
  async getAllParticipants(): Promise<Participant[]> {
    try {
      return await db
        .select()
        .from(participants)
        .orderBy(desc(participants.createdAt));
    } catch (error) {
      console.error('Error getting all participants:', error);
      return [];
    }
  }

  async getCompletedGameRounds(): Promise<GameRound[]> {
    try {
      return await db
        .select()
        .from(gameRounds)
        .where(eq(gameRounds.status, 'completed'))
        .orderBy(desc(gameRounds.completedAt));
    } catch (error) {
      console.error('Error getting completed game rounds:', error);
      return [];
    }
  }

  async getWinners(): Promise<Array<GameRound & { winner?: Participant }>> {
    try {
      const completedRounds = await this.getCompletedGameRounds();
      const winners = [];

      for (const round of completedRounds) {
        if (round.winnerSquare) {
          // Find the participant who owns the winning square
          const winningSquare = await db
            .select()
            .from(squares)
            .where(
              and(
                eq(squares.gameRoundId, round.id),
                eq(squares.number, round.winnerSquare)
              )
            )
            .limit(1);

          if (winningSquare[0]?.participantId) {
            const winner = await this.getParticipant(winningSquare[0].participantId);
            winners.push({ ...round, winner });
          } else {
            winners.push(round);
          }
        }
      }

      return winners;
    } catch (error) {
      console.error('Error getting winners:', error);
      return [];
    }
  }

  async getParticipantsByEmail(email: string): Promise<Participant[]> {
    try {
      return await db
        .select()
        .from(participants)
        .where(eq(participants.email, email))
        .orderBy(desc(participants.createdAt));
    } catch (error) {
      console.error('Error getting participants by email:', error);
      return [];
    }
  }

  async getParticipantsByPhone(phone: string): Promise<Participant[]> {
    try {
      return await db
        .select()
        .from(participants)
        .where(eq(participants.phone, phone))
        .orderBy(desc(participants.createdAt));
    } catch (error) {
      console.error('Error getting participants by phone:', error);
      return [];
    }
  }

  async getSquareByNumber(number: number, gameRoundId: string): Promise<Square | undefined> {
    return this.getSquare(number, gameRoundId);
  }

  async cleanupExpiredReservations(gameRoundId: string): Promise<Square[]> {
    try {
      const RESERVATION_TIMEOUT = 120000; // 2 minutes
      const cutoffTime = new Date(Date.now() - RESERVATION_TIMEOUT);
      
      // Find expired reservations
      const expiredSquares = await db
        .select()
        .from(squares)
        .where(
          and(
            eq(squares.gameRoundId, gameRoundId),
            eq(squares.status, 'reserved'),
            sql`${squares.reservedAt} < ${cutoffTime}`
          )
        );

      // Release expired reservations and clean up participants
      if (expiredSquares.length > 0) {
        // Get unique participant IDs from expired squares
        const participantIds = Array.from(new Set(expiredSquares.map((s: Square) => s.participantId).filter(Boolean)));
        
        // Release the squares
        await db
          .update(squares)
          .set({
            status: 'available',
            participantId: null,
            reservedAt: null,
          })
          .where(
            and(
              eq(squares.gameRoundId, gameRoundId),
              eq(squares.status, 'reserved'),
              sql`${squares.reservedAt} < ${cutoffTime}`
            )
          );

        // Delete participants who only had expired reservations
        for (const participantId of participantIds) {
          if (participantId) {
            // Check if this participant has any remaining squares
            const remainingSquares = await db
              .select()
              .from(squares)
              .where(eq(squares.participantId, participantId));
            
            // If no remaining squares, delete the participant
            if (remainingSquares.length === 0) {
              await db
                .delete(participants)
                .where(eq(participants.id, participantId));
            }
          }
        }

        console.log(`Cleaned up ${expiredSquares.length} expired reservations and ${participantIds.length} participants`);
      }

      return expiredSquares;
    } catch (error) {
      console.error('Error cleaning up expired reservations:', error);
      return [];
    }
  }

  async resetSystem(): Promise<void> {
    try {
      // Delete all data in reverse order to respect foreign key constraints
      await db.delete(squares);
      await db.delete(participants);
      await db.delete(gameRounds);
      
      console.log('System reset complete - all data cleared');
    } catch (error) {
      console.error('Error resetting system:', error);
      throw error;
    }
  }
}