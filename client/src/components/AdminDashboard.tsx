import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Users, Grid3x3, Percent, Trophy, RotateCcw, Download, Settings, RefreshCw, Trash2, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { type GameStats, type Participant, type Square, type RoundWinner } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { GameBoard } from "./GameBoard";
import { useState } from "react";

interface AdminDashboardProps {
  stats: GameStats;
  participants: Participant[];
  squares: Square[];
  gameRound: any;
  onDrawWinner: () => void;
  onNewRound: () => void;
  onExportData: () => void;
  onUpdatePrice: (price: number) => void;
  onResetSystem: () => void;
  onManualWinner: (squareNumber: number) => void;
  onCleanupReservations: () => void;
  isLoading?: boolean;
}

export function AdminDashboard({ 
  stats, 
  participants, 
  squares, 
  gameRound,
  onDrawWinner, 
  onNewRound, 
  onExportData,
  onUpdatePrice,
  onResetSystem,
  onManualWinner,
  onCleanupReservations,
  isLoading 
}: AdminDashboardProps) {
  const formatCurrency = (amount: number) => `$${(amount / 100).toFixed(2)}`;
  const [priceInput, setPriceInput] = useState((gameRound?.pricePerSquare || 1000) / 100);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showManualWinnerDialog, setShowManualWinnerDialog] = useState(false);
  const [manualWinnerSquare, setManualWinnerSquare] = useState("");
  
  const soldSquares = squares.filter(square => square.status === "sold");

  // Fetch winners data
  const { data: winnersData, isLoading: winnersLoading } = useQuery<{winners: RoundWinner[]}>({
    queryKey: ['/api/winners'],
    refetchInterval: 10000, // Refresh every 10 seconds to catch new winners
  });

  const winners = winnersData?.winners || [];

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  const handlePriceUpdate = () => {
    const priceInCents = Math.round(priceInput * 100);
    if (priceInCents > 0) {
      onUpdatePrice(priceInCents);
    }
  };

  const handleResetSystem = () => {
    onResetSystem();
    setShowResetDialog(false);
  };

  const handleManualWinner = () => {
    const squareNumber = parseInt(manualWinnerSquare);
    if (squareNumber >= 1 && squareNumber <= 65) {
      onManualWinner(squareNumber);
      setShowManualWinnerDialog(false);
      setManualWinnerSquare("");
    }
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-green-50 p-3 rounded-lg">
                <DollarSign className="text-green-600 h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-revenue">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-50 p-3 rounded-lg">
                <Users className="text-blue-600 h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Participants</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-participants">
                  {stats.participantCount}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-red-50 p-3 rounded-lg">
                <Grid3x3 className="text-red-600 h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Squares Sold</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-squares">
                  {stats.squaresSold}/65
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="bg-yellow-50 p-3 rounded-lg">
                <Percent className="text-yellow-600 h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Board Filled</p>
                <p className="text-2xl font-bold text-gray-900" data-testid="stat-percent">
                  {stats.percentFilled}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Game Round Info */}
      <Card>
        <CardHeader>
          <CardTitle>Round #{stats.currentRound}</CardTitle>
          <p className="text-gray-600">
            {stats.squaresSold} squares sold
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Settings className="h-4 w-4 text-gray-500" />
            <Label htmlFor="price-input" className="text-sm font-medium">
              Price per Square:
            </Label>
            <div className="flex items-center space-x-2">
              <span className="text-sm">$</span>
              <Input
                id="price-input"
                type="number"
                value={priceInput}
                onChange={(e) => setPriceInput(parseFloat(e.target.value) || 0)}
                onBlur={handlePriceUpdate}
                onKeyDown={(e) => e.key === 'Enter' && handlePriceUpdate()}
                className="w-20 text-sm"
                min="0.01"
                step="0.01"
                data-testid="input-price"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Controls */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Winner Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Winner Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={onDrawWinner}
              disabled={isLoading || stats.squaresSold === 0 || gameRound?.status === 'completed'}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              data-testid="button-draw-winner"
            >
              <Trophy className="mr-2 h-4 w-4" />
              Auto Draw Winner
            </Button>
            <Button
              onClick={() => setShowManualWinnerDialog(true)}
              disabled={isLoading || stats.squaresSold === 0 || gameRound?.status === 'completed'}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              data-testid="button-manual-winner"
            >
              <Trophy className="mr-2 h-4 w-4" />
              Manual Winner
            </Button>
          </CardContent>
        </Card>

        {/* Game Management */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Game Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={onNewRound}
              disabled={isLoading}
              variant="outline"
              className="w-full"
              data-testid="button-new-round"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              New Round
            </Button>
            <Button
              onClick={onCleanupReservations}
              disabled={isLoading}
              variant="outline"
              className="w-full text-orange-600 border-orange-300 hover:bg-orange-50"
              data-testid="button-cleanup-reservations"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Release Reservations
            </Button>
          </CardContent>
        </Card>

        {/* Data & System */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="w-4 h-4" />
              Data & System
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={onExportData}
              disabled={isLoading}
              variant="outline"
              className="w-full"
              data-testid="button-export"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <Button
              onClick={() => setShowResetDialog(true)}
              disabled={isLoading}
              variant="outline"
              className="w-full text-red-600 border-red-300 hover:bg-red-50"
              data-testid="button-reset-system"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset System
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Game Board Preview */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Game Board Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="w-full">
                <GameBoard squares={squares} selectedSquares={[]} readonly />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Participants */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Recent Participants
                <span className="text-sm font-normal text-gray-600">
                  {participants.length} total
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[480px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="px-6 py-3">Name</TableHead>
                      <TableHead className="px-6 py-3">Contact</TableHead>
                      <TableHead className="px-6 py-3">Squares</TableHead>
                      <TableHead className="px-6 py-3">Amount</TableHead>
                      <TableHead className="px-6 py-3">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 px-6 py-8">
                          No participants yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      participants.map((participant) => (
                        <TableRow key={participant.id} data-testid={`participant-row-${participant.id}`}>
                          <TableCell className="px-6 py-3">
                            <div className="font-medium text-gray-900">{participant.name}</div>
                          </TableCell>
                          <TableCell className="px-6 py-3">
                            <div className="text-sm text-gray-600">{participant.email}</div>
                            <div className="text-sm text-gray-500">{formatPhone(participant.phone)}</div>
                          </TableCell>
                          <TableCell className="px-6 py-3">
                            <div className="text-sm text-gray-900">
                              {participant.squares.map(s => `#${s}`).join(", ")}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-3">
                            <div className="font-medium text-gray-900">
                              {formatCurrency(participant.totalAmount)}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-3">
                            <Badge
                              variant={participant.paymentStatus === "paid" ? "default" : "secondary"}
                              className={
                                participant.paymentStatus === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }
                            >
                              {participant.paymentStatus === "paid" ? "Paid" : "Pending"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Round Winners Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Round Winners History
            {winnersLoading && <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {winners.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No completed rounds with winners yet</p>
              <p className="text-sm">Winners will appear here after rounds are completed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {winners.map((roundWinner) => (
                <div
                  key={roundWinner.id}
                  className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4"
                  data-testid={`winner-round-${roundWinner.roundNumber}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                        {roundWinner.roundNumber}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-gray-100" data-testid={`winner-name-${roundWinner.roundNumber}`}>
                          {roundWinner.winner?.name || 'Unknown Winner'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Square #{roundWinner.winnerSquare}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-bold" data-testid={`winner-pot-${roundWinner.roundNumber}`}>
                          {formatCurrency(roundWinner.totalRevenue)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span data-testid={`winner-date-${roundWinner.roundNumber}`}>
                          {roundWinner.completedAt ? new Date(roundWinner.completedAt).toLocaleDateString() : 'Unknown Date'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {roundWinner.winner && (
                    <div className="mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-700">
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <span>📧 {roundWinner.winner.email}</span>
                        <span>📞 {formatPhone(roundWinner.winner.phone)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset System Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset System to Round #1</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              This will completely reset the system back to Round #1 and clear all data including:
            </p>
            <ul className="mt-2 ml-4 list-disc text-gray-600">
              <li>All game rounds and participants</li>
              <li>All square reservations and sales</li>
              <li>Revenue tracking</li>
            </ul>
            <p className="mt-3 text-red-600 font-medium">
              This action cannot be undone!
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleResetSystem}
              data-testid="button-confirm-reset"
            >
              Reset System
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Winner Dialog */}
      <Dialog open={showManualWinnerDialog} onOpenChange={setShowManualWinnerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enter Manual Winner</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-gray-600">
              Enter the square number that the chicken selected as the winner.
            </p>
            <div>
              <Label htmlFor="winner-square">Square Number (1-65)</Label>
              <Input
                id="winner-square"
                type="number"
                min="1"
                max="65"
                value={manualWinnerSquare}
                onChange={(e) => setManualWinnerSquare(e.target.value)}
                placeholder="Enter square number"
                className="mt-1"
                data-testid="input-manual-winner"
              />
            </div>
            {soldSquares.length > 0 && (
              <div className="text-sm text-gray-600">
                <p className="font-medium">Sold squares available:</p>
                <p className="mt-1">
                  {soldSquares.map(s => s.number).sort((a, b) => a - b).join(", ")}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualWinnerDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleManualWinner}
              disabled={!manualWinnerSquare || parseInt(manualWinnerSquare) < 1 || parseInt(manualWinnerSquare) > 65}
              data-testid="button-confirm-manual-winner"
            >
              Set Winner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
