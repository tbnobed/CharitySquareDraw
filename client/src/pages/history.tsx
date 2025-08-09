import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Users, Calendar, DollarSign } from "lucide-react";
import logoImage from "@/assets/logo.png";

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

interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string;
  gameRoundId: string;
  squares: number[];
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
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

export default function History() {
  const { data: winnersData, isLoading: winnersLoading } = useQuery({
    queryKey: ["/api/marketing/winners"],
  });

  const { data: participantsData, isLoading: participantsLoading } = useQuery({
    queryKey: ["/api/marketing/participants"],
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/marketing/history"],
  });

  const winners: Winner[] = (winnersData as any)?.winners || [];
  const participants: Participant[] = (participantsData as any)?.participants || [];
  const gameRounds: GameRound[] = (historyData as any)?.gameRounds || [];

  // Calculate marketing stats
  const totalParticipants = participants.length;
  const uniqueEmails = new Set(participants.map(p => p.email)).size;
  const repeatCustomers = totalParticipants - uniqueEmails;
  const totalRevenue = gameRounds.reduce((sum, round) => sum + round.totalRevenue, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src={logoImage} alt="Chicken Poop Bingo Logo" className="h-24 w-24" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Chicken Poop Bingo</h1>
                <p className="text-sm text-gray-500">History & Marketing</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Marketing Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalParticipants}</div>
              <p className="text-xs text-muted-foreground">
                {uniqueEmails} unique customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Repeat Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{repeatCustomers}</div>
              <p className="text-xs text-muted-foreground">
                {uniqueEmails > 0 ? Math.round((repeatCustomers / uniqueEmails) * 100) : 0}% return rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Across {gameRounds.length} games
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Game Winners</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{winners.length}</div>
              <p className="text-xs text-muted-foreground">
                Completed games
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="winners" className="space-y-6">
          <TabsList>
            <TabsTrigger value="winners">Winners</TabsTrigger>
            <TabsTrigger value="participants">All Participants</TabsTrigger>
            <TabsTrigger value="games">Game History</TabsTrigger>
          </TabsList>

          <TabsContent value="winners">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Game Winners
                </CardTitle>
                <CardDescription>
                  Historical record of all game winners for marketing and recognition
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
          </TabsContent>

          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  All Participants
                </CardTitle>
                <CardDescription>
                  Complete customer database for marketing campaigns and outreach
                </CardDescription>
              </CardHeader>
              <CardContent>
                {participantsLoading ? (
                  <div className="text-center py-8">Loading participants...</div>
                ) : participants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No participants yet
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Squares</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {participants.map((participant) => (
                        <TableRow key={participant.id}>
                          <TableCell className="font-medium">
                            {participant.name}
                          </TableCell>
                          <TableCell>{participant.email}</TableCell>
                          <TableCell>{participant.phone}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {participant.squares.slice(0, 3).map((square) => (
                                <Badge key={square} variant="outline" className="text-xs">
                                  #{square}
                                </Badge>
                              ))}
                              {participant.squares.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{participant.squares.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>${(participant.totalAmount / 100).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={participant.paymentStatus === 'paid' ? 'default' : 'secondary'}
                            >
                              {participant.paymentStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(participant.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Game History
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}