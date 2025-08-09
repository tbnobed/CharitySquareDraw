import { type GameRound, type Participant, type Square, type InsertGameRound, type InsertParticipant, type InsertSquare, type GameStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Game Rounds
  getCurrentGameRound(): Promise<GameRound | undefined>;
  createGameRound(gameRound: InsertGameRound): Promise<GameRound>;
  updateGameRound(id: string, updates: Partial<GameRound>): Promise<GameRound | undefined>;
  updatePricePerSquare(gameRoundId: string, pricePerSquare: number): Promise<GameRound | undefined>;
  completeGameRound(id: string, winnerSquare: number): Promise<GameRound | undefined>;

  // Participants
  getParticipants(gameRoundId: string): Promise<Participant[]>;
  getParticipant(id: string): Promise<Participant | undefined>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  updateParticipantPaymentStatus(id: string, status: string): Promise<Participant | undefined>;
  deleteParticipant(id: string): Promise<void>;

  // Squares
  getSquaresByGameRound(gameRoundId: string): Promise<Square[]>;
  getSquare(number: number, gameRoundId: string): Promise<Square | undefined>;
  getSquareByNumber(number: number, gameRoundId: string): Promise<Square | undefined>;
  reserveSquares(squares: number[], gameRoundId: string, participantId: string): Promise<Square[]>;
  markSquaresSold(participantId: string): Promise<Square[]>;
  releaseSquares(squares: number[], gameRoundId: string): Promise<Square[]>;
  initializeSquares(gameRoundId: string): Promise<Square[]>;

  // Statistics
  getGameStats(): Promise<GameStats>;
  
  // System
  resetSystem(): Promise<void>;
  cleanupExpiredReservations(gameRoundId: string): Promise<Square[]>;
}

export class MemStorage implements IStorage {
  private gameRounds: Map<string, GameRound>;
  private participants: Map<string, Participant>;
  private squares: Map<string, Square>;

  constructor() {
    this.gameRounds = new Map();
    this.participants = new Map();
    this.squares = new Map();
    
    // Initialize first game round
    this.initializeFirstRound();
  }

  private async initializeFirstRound() {
    const firstRound = await this.createGameRound({
      roundNumber: 1,
      status: "active",
      pricePerSquare: 1000, // $10.00 (stored in cents)
      totalRevenue: 0,
    });
    await this.initializeSquares(firstRound.id);
  }

  async getCurrentGameRound(): Promise<GameRound | undefined> {
    const activeRounds = Array.from(this.gameRounds.values()).filter(
      round => round.status === "active"
    );
    return activeRounds[0];
  }

  async createGameRound(insertGameRound: InsertGameRound): Promise<GameRound> {
    const id = randomUUID();
    const gameRound: GameRound = {
      id,
      roundNumber: insertGameRound.roundNumber,
      status: insertGameRound.status || "active",
      pricePerSquare: insertGameRound.pricePerSquare || 1000, // default $10.00 (stored in cents)
      totalRevenue: insertGameRound.totalRevenue || 0,
      startedAt: new Date(),
      completedAt: null,
      winnerSquare: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.gameRounds.set(id, gameRound);
    return gameRound;
  }

  async updateGameRound(id: string, updates: Partial<GameRound>): Promise<GameRound | undefined> {
    const gameRound = this.gameRounds.get(id);
    if (!gameRound) return undefined;
    
    const updated = { ...gameRound, ...updates };
    this.gameRounds.set(id, updated);
    return updated;
  }

  async updatePricePerSquare(gameRoundId: string, pricePerSquare: number): Promise<GameRound | undefined> {
    const gameRound = this.gameRounds.get(gameRoundId);
    if (!gameRound) return undefined;
    
    const updated = { ...gameRound, pricePerSquare };
    this.gameRounds.set(gameRoundId, updated);
    return updated;
  }

  async completeGameRound(id: string, winnerSquare: number): Promise<GameRound | undefined> {
    const gameRound = this.gameRounds.get(id);
    if (!gameRound) return undefined;
    
    const updated = {
      ...gameRound,
      status: "completed" as const,
      completedAt: new Date(),
      winnerSquare,
    };
    this.gameRounds.set(id, updated);
    return updated;
  }

  async getParticipants(gameRoundId: string): Promise<Participant[]> {
    return Array.from(this.participants.values()).filter(
      participant => participant.gameRoundId === gameRoundId
    );
  }

  async getParticipant(id: string): Promise<Participant | undefined> {
    return this.participants.get(id);
  }

  async createParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    const id = randomUUID();
    const participant: Participant = {
      id,
      name: insertParticipant.name,
      email: insertParticipant.email,
      phone: insertParticipant.phone,
      gameRoundId: insertParticipant.gameRoundId,
      squares: insertParticipant.squares as number[],
      totalAmount: insertParticipant.totalAmount,
      paymentStatus: insertParticipant.paymentStatus || "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.participants.set(id, participant);
    return participant;
  }

  async updateParticipantPaymentStatus(id: string, status: string): Promise<Participant | undefined> {
    const participant = this.participants.get(id);
    if (!participant) return undefined;
    
    const updated = { ...participant, paymentStatus: status };
    this.participants.set(id, updated);
    return updated;
  }

  async deleteParticipant(id: string): Promise<void> {
    this.participants.delete(id);
  }

  async getSquaresByGameRound(gameRoundId: string): Promise<Square[]> {
    return Array.from(this.squares.values()).filter(
      square => square.gameRoundId === gameRoundId
    );
  }

  async getSquare(number: number, gameRoundId: string): Promise<Square | undefined> {
    return Array.from(this.squares.values()).find(
      square => square.number === number && square.gameRoundId === gameRoundId
    );
  }

  async reserveSquares(squareNumbers: number[], gameRoundId: string, participantId: string): Promise<Square[]> {
    const updatedSquares: Square[] = [];
    
    for (const number of squareNumbers) {
      const square = await this.getSquare(number, gameRoundId);
      if (square && square.status === "available") {
        const updated = {
          ...square,
          participantId,
          status: "reserved" as const,
          reservedAt: new Date(),
        };
        this.squares.set(square.id, updated);
        updatedSquares.push(updated);
      }
    }
    
    return updatedSquares;
  }

  async markSquaresSold(participantId: string): Promise<Square[]> {
    const updatedSquares: Square[] = [];
    
    const squareValues = Array.from(this.squares.values());
    for (const square of squareValues) {
      if (square.participantId === participantId && square.status === "reserved") {
        const updated = {
          ...square,
          status: "sold" as const,
          soldAt: new Date(),
        };
        this.squares.set(square.id, updated);
        updatedSquares.push(updated);
      }
    }
    
    return updatedSquares;
  }

  async releaseSquares(squareNumbers: number[], gameRoundId: string): Promise<Square[]> {
    const updatedSquares: Square[] = [];
    
    for (const number of squareNumbers) {
      const square = await this.getSquare(number, gameRoundId);
      if (square && (square.status === "reserved" || square.status === "sold")) {
        const updated = {
          ...square,
          participantId: null,
          status: "available" as const,
          reservedAt: null,
          soldAt: null,
        };
        this.squares.set(square.id, updated);
        updatedSquares.push(updated);
      }
    }
    
    return updatedSquares;
  }

  async initializeSquares(gameRoundId: string): Promise<Square[]> {
    const squares: Square[] = [];
    
    for (let i = 1; i <= 65; i++) {
      const id = randomUUID();
      const square: Square = {
        id,
        number: i,
        gameRoundId,
        participantId: null,
        status: "available",
        reservedAt: null,
        soldAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.squares.set(id, square);
      squares.push(square);
    }
    
    return squares;
  }

  async getGameStats(): Promise<GameStats> {
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

    const participants = await this.getParticipants(currentRound.id);
    const squares = await this.getSquaresByGameRound(currentRound.id);
    
    const soldSquares = squares.filter(s => s.status === "sold");
    const reservedSquares = squares.filter(s => s.status === "reserved");
    const totalSold = soldSquares.length + reservedSquares.length;
    
    return {
      totalRevenue: currentRound.totalRevenue,
      participantCount: participants.length,
      squaresSold: totalSold,
      percentFilled: Math.round((totalSold / 65) * 100),
      availableCount: 65 - totalSold,
      currentRound: currentRound.roundNumber,
    };
  }

  async getSquareByNumber(number: number, gameRoundId: string): Promise<Square | undefined> {
    return this.getSquare(number, gameRoundId);
  }

  async cleanupExpiredReservations(gameRoundId: string): Promise<Square[]> {
    const squares = await this.getSquaresByGameRound(gameRoundId);
    const expiredReservations: Square[] = [];
    const RESERVATION_TIMEOUT = 120000; // 2 minutes
    const now = new Date().getTime();
    
    for (const square of squares) {
      if (square.status === "reserved" && square.reservedAt) {
        const reservedTime = new Date(square.reservedAt).getTime();
        if (now - reservedTime > RESERVATION_TIMEOUT) {
          // Release expired reservation
          const updated = {
            ...square,
            participantId: null,
            status: "available" as const,
            reservedAt: null,
          };
          this.squares.set(square.id, updated);
          expiredReservations.push(updated);
        }
      }
    }
    
    return expiredReservations;
  }

  async resetSystem(): Promise<void> {
    // Clear all data
    this.gameRounds.clear();
    this.participants.clear();
    this.squares.clear();
    
    // Reinitialize with Round #1
    await this.initializeFirstRound();
  }
}

import { PostgresStorage } from './postgres-storage';

// Use PostgreSQL storage if DATABASE_URL is available, otherwise fall back to in-memory
export const storage = process.env.DATABASE_URL 
  ? new PostgresStorage() 
  : new MemStorage();
