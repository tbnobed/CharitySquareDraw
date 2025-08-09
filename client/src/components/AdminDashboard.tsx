import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Users, Grid3x3, Percent, Trophy, RotateCcw, Download } from "lucide-react";
import { type GameStats, type Participant, type Square } from "@shared/schema";
import { GameBoard } from "./GameBoard";

interface AdminDashboardProps {
  stats: GameStats;
  participants: Participant[];
  squares: Square[];
  onDrawWinner: () => void;
  onNewRound: () => void;
  onExportData: () => void;
  isLoading?: boolean;
}

export function AdminDashboard({ 
  stats, 
  participants, 
  squares, 
  onDrawWinner, 
  onNewRound, 
  onExportData,
  isLoading 
}: AdminDashboardProps) {
  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
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
            <div>
              <h2 className="text-xl font-bold text-gray-900">Current Game Round</h2>
              <p className="text-gray-600">
                Round #{stats.currentRound} - {stats.squaresSold} squares sold
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <Button
                onClick={onDrawWinner}
                disabled={isLoading || stats.squaresSold === 0}
                className="bg-green-500 hover:bg-green-600 text-white flex items-center justify-center"
                data-testid="button-draw-winner"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Draw Winner
              </Button>
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
                onClick={onExportData}
                disabled={isLoading}
                variant="outline"
                className="flex items-center justify-center"
                data-testid="button-export"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Game Board Preview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Game Board Status</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="w-full max-w-3xl mx-auto">
                <GameBoard squares={squares} selectedSquares={[]} readonly />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Participants */}
        <div className="lg:col-span-2">
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
    </div>
  );
}
