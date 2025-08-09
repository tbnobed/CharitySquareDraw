import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Users, Grid3x3, Percent, Trophy, RotateCcw, Download, Settings, RefreshCw, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { type GameStats, type Participant, type Square } from "@shared/schema";
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

      {/* Game Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Current Game Round</h2>
                <p className="text-gray-600">
                  Round #{stats.currentRound} - {stats.squaresSold} squares sold
                </p>
              </div>
              
              {/* Price Setting */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-gray-500" />
                  <Label htmlFor="price-input" className="text-sm font-medium">
                    Price per Square:
                  </Label>
                </div>
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
            </div>
            
            {/* Admin Controls - Organized by Function */}
            <div className="space-y-4">
              {/* Winner Selection Group */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="text-sm font-medium text-gray-700 min-w-[120px] flex items-center">
                  Winner Selection:
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={onDrawWinner}
                    disabled={isLoading || stats.squaresSold === 0}
                    className="bg-green-500 hover:bg-green-600 text-white flex items-center justify-center"
                    data-testid="button-draw-winner"
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    Auto Draw
                  </Button>
                  <Button
                    onClick={() => setShowManualWinnerDialog(true)}
                    disabled={isLoading || stats.squaresSold === 0}
                    className="bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
                    data-testid="button-manual-winner"
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    Manual Winner
                  </Button>
                </div>
              </div>

              {/* Game Management Group */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="text-sm font-medium text-gray-700 min-w-[120px] flex items-center">
                  Game Management:
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={onNewRound}
                    disabled={isLoading}
                    variant="outline"
                    className="flex items-center justify-center"
                    data-testid="button-new-round"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    New Round
                  </Button>
                  <Button
                    onClick={onCleanupReservations}
                    disabled={isLoading}
                    variant="outline"
                    className="flex items-center justify-center text-orange-600 border-orange-300 hover:bg-orange-50"
                    data-testid="button-cleanup-reservations"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Release Stuck Reservations
                  </Button>
                </div>
              </div>

              {/* Data & System Group */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="text-sm font-medium text-gray-700 min-w-[120px] flex items-center">
                  Data & System:
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={onExportData}
                    disabled={isLoading}
                    variant="outline"
                    className="flex items-center justify-center"
                    data-testid="button-export"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </Button>
                  <Button
                    onClick={() => setShowResetDialog(true)}
                    disabled={isLoading}
                    variant="outline"
                    className="flex items-center justify-center text-red-600 border-red-300 hover:bg-red-50"
                    data-testid="button-reset-system"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reset to Round #1
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Squares</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500">
                          No participants yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      participants.slice(0, 10).map((participant) => (
                        <TableRow key={participant.id} data-testid={`participant-row-${participant.id}`}>
                          <TableCell>
                            <div className="font-medium text-gray-900">{participant.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">{participant.email}</div>
                            <div className="text-sm text-gray-500">{formatPhone(participant.phone)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-900">
                              {participant.squares.map(s => `#${s}`).join(", ")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900">
                              {formatCurrency(participant.totalAmount)}
                            </div>
                          </TableCell>
                          <TableCell>
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
