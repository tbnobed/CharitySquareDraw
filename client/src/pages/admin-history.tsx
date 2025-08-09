import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Trophy, Users, Calendar, DollarSign, Crown, Plus } from "lucide-react";

interface Winner {
  id: string;
  roundNumber: number;
  completedAt: string;
  winnerSquare: number;
  totalRevenue: number;
  winner?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

interface GameRound {
  id: string;
  roundNumber: number;
  status: string;
  pricePerSquare: number;
  totalRevenue: number;
  startedAt: string;
  completedAt?: string;
  winnerSquare?: number;
}

export default function AdminHistory() {
  const { toast } = useToast();
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [isNewRoundDialogOpen, setIsNewRoundDialogOpen] = useState(false);
  const [winnerSquare, setWinnerSquare] = useState("");
  const [newRoundPrice, setNewRoundPrice] = useState("10.00");
  const [selectedRound, setSelectedRound] = useState<GameRound | null>(null);

  const { data: winnersData, isLoading: winnersLoading } = useQuery({
    queryKey: ["/api/marketing/winners"],
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/marketing/history"],
  });

  const { data: currentGameData } = useQuery({
    queryKey: ["/api/game"],
  });

  const winners: Winner[] = (winnersData as any)?.winners || [];
  const gameRounds: GameRound[] = (historyData as any)?.gameRounds || [];
  const currentGame = (currentGameData as any)?.gameRound;

  const completeRoundMutation = useMutation({
    mutationFn: async (data: { gameRoundId: string; winnerSquare: number }) => {
      return apiRequest("POST", "/api/admin/complete-round", data);
    },
    onSuccess: () => {
      toast({
        title: "Round Completed",
        description: "The game round has been marked as completed with the winner.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/winners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game"] });
      setIsCompleteDialogOpen(false);
      setWinnerSquare("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to complete the round. Please try again.",
        variant: "destructive",
      });
    },
  });

  const newRoundMutation = useMutation({
    mutationFn: async (data: { pricePerSquare: number }) => {
      return apiRequest("POST", "/api/admin/new-round", data);
    },
    onSuccess: () => {
      toast({
        title: "New Round Started",
        description: "A new game round has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/game"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketing/history"] });
      setIsNewRoundDialogOpen(false);
      setNewRoundPrice("10.00");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create new round. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCompleteRound = () => {
    if (!selectedRound || !winnerSquare) return;
    
    const square = parseInt(winnerSquare);
    if (square < 1 || square > 65) {
      toast({
        title: "Invalid Square",
        description: "Winner square must be between 1 and 65.",
        variant: "destructive",
      });
      return;
    }

    completeRoundMutation.mutate({
      gameRoundId: selectedRound.id,
      winnerSquare: square,
    });
  };

  const handleNewRound = () => {
    const price = parseFloat(newRoundPrice);
    if (price <= 0) {
      toast({
        title: "Invalid Price",
        description: "Price per square must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    newRoundMutation.mutate({
      pricePerSquare: Math.round(price * 100), // Convert to cents
    });
  };

  const openCompleteDialog = (round: GameRound) => {
    setSelectedRound(round);
    setIsCompleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Admin Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Game Management</h2>
          <p className="text-muted-foreground">Manage game rounds and view historical data</p>
        </div>
        <div className="space-x-2">
          {currentGame && currentGame.status === 'active' && (
            <Button 
              onClick={() => openCompleteDialog(currentGame)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Crown className="h-4 w-4 mr-2" />
              Complete Current Round
            </Button>
          )}
          <Button 
            onClick={() => setIsNewRoundDialogOpen(true)}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Start New Round
          </Button>
        </div>
      </div>

      {/* Current Game Status */}
      {currentGame && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Current Game - Round #{currentGame.roundNumber}
            </CardTitle>
            <CardDescription>
              Active since {new Date(currentGame.startedAt).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Price per Square</div>
                <div className="text-2xl font-bold">${(currentGame.pricePerSquare / 100).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className="text-2xl font-bold">${(currentGame.totalRevenue / 100).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status</div>
                <Badge variant={currentGame.status === 'active' ? 'default' : 'secondary'}>
                  {currentGame.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Winners Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Past Winners
          </CardTitle>
          <CardDescription>
            Complete history of game winners for recognition and marketing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {winnersLoading ? (
            <div className="text-center py-8">Loading winners...</div>
          ) : winners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No completed games yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Round</TableHead>
                  <TableHead>Winner</TableHead>
                  <TableHead>Winning Square</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Prize Pool</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {winners.map((winner) => (
                  <TableRow key={winner.id}>
                    <TableCell className="font-medium">
                      Round #{winner.roundNumber}
                    </TableCell>
                    <TableCell>
                      {winner.winner ? (
                        <div>
                          <div className="font-medium">{winner.winner.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {winner.winner.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">#{winner.winnerSquare}</Badge>
                    </TableCell>
                    <TableCell>
                      {winner.winner?.phone && (
                        <div className="text-sm">{winner.winner.phone}</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${(winner.totalRevenue / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {new Date(winner.completedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* All Game Rounds */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            All Game Rounds
          </CardTitle>
          <CardDescription>
            Complete history of all game rounds
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="text-center py-8">Loading game history...</div>
          ) : gameRounds.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No completed games yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Round</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price per Square</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Winner Square</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gameRounds.map((round) => (
                  <TableRow key={round.id}>
                    <TableCell className="font-medium">
                      Round #{round.roundNumber}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={round.status === 'completed' ? 'default' : 'secondary'}
                      >
                        {round.status}
                      </Badge>
                    </TableCell>
                    <TableCell>${(round.pricePerSquare / 100).toFixed(2)}</TableCell>
                    <TableCell className="font-medium">
                      ${(round.totalRevenue / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {round.winnerSquare ? (
                        <Badge variant="outline">#{round.winnerSquare}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(round.startedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {round.completedAt ? (
                        new Date(round.completedAt).toLocaleDateString()
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {round.status === 'active' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openCompleteDialog(round)}
                        >
                          Complete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Complete Round Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Game Round</DialogTitle>
            <DialogDescription>
              Mark Round #{selectedRound?.roundNumber} as completed by entering the winning square number.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="winner-square">Winning Square (1-65)</Label>
              <Input
                id="winner-square"
                type="number"
                min="1"
                max="65"
                value={winnerSquare}
                onChange={(e) => setWinnerSquare(e.target.value)}
                placeholder="Enter winning square number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCompleteRound}
              disabled={completeRoundMutation.isPending || !winnerSquare}
            >
              {completeRoundMutation.isPending ? "Completing..." : "Complete Round"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Round Dialog */}
      <Dialog open={isNewRoundDialogOpen} onOpenChange={setIsNewRoundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Game Round</DialogTitle>
            <DialogDescription>
              Create a new game round with custom pricing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="round-price">Price per Square ($)</Label>
              <Input
                id="round-price"
                type="number"
                step="0.01"
                min="0.01"
                value={newRoundPrice}
                onChange={(e) => setNewRoundPrice(e.target.value)}
                placeholder="10.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewRoundDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleNewRound}
              disabled={newRoundMutation.isPending || !newRoundPrice}
            >
              {newRoundMutation.isPending ? "Creating..." : "Start New Round"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}