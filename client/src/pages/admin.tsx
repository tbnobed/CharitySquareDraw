import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AdminDashboard } from "@/components/AdminDashboard";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type GameStats, type Participant, type Square, type BoardUpdate } from "@shared/schema";
import { Heart, Store, Wifi, WifiOff } from "lucide-react";

export default function AdminPage() {
  const { toast } = useToast();

  // Fetch game stats
  const { data: stats = { 
    totalRevenue: 0, 
    participantCount: 0, 
    squaresSold: 0, 
    percentFilled: 0, 
    availableCount: 65, 
    currentRound: 1 
  }, refetch: refetchStats } = useQuery<GameStats>({
    queryKey: ['/api/stats'],
  });

  // Fetch game data
  const { data: gameData, refetch: refetchGame } = useQuery({
    queryKey: ['/api/game'],
  });

  // Fetch participants
  const { data: participants = [], refetch: refetchParticipants } = useQuery<Participant[]>({
    queryKey: ['/api/participants'],
  });

  const squares: Square[] = (gameData as any)?.squares || [];

  // WebSocket for real-time updates
  const { isConnected } = useWebSocket((data: BoardUpdate) => {
    console.log('Admin received WebSocket update:', data);
    
    switch (data.type) {
      case 'SQUARE_UPDATE':
        refetchGame();
        refetchParticipants();
        refetchStats();
        
        // Show real-time notifications in admin view
        const { squares: updatedSquares, action } = data.data;
        if (action === 'reserve') {
          toast({
            title: "Squares Reserved",
            description: `Squares ${updatedSquares.join(", ")} were reserved.`,
          });
        } else if (action === 'confirm') {
          toast({
            title: "Payment Confirmed",
            description: `Squares ${updatedSquares.join(", ")} were sold!`,
          });
        }
        break;
        
      case 'PARTICIPANT_ADDED':
        refetchGame();
        refetchParticipants();
        refetchStats();
        break;
        
      case 'STATS_UPDATE':
        refetchStats();
        break;
        
      case 'GAME_RESET':
        refetchGame();
        refetchParticipants();
        refetchStats();
        toast({
          title: "New Round Started",
          description: `Round #${data.data.roundNumber} has begun!`,
        });
        break;
    }
  });

  // Draw winner mutation
  const drawWinnerMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/draw-winner'),
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Winner Drawn!",
        description: `Square #${data.winnerSquare} wins $${(data.totalPot / 2).toFixed(2)}!`,
      });
      refetchGame();
      refetchStats();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to draw winner. Please try again.",
        variant: "destructive",
      });
    },
  });

  // New round mutation
  const newRoundMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/new-round'),
    onSuccess: () => {
      toast({
        title: "New Round Started",
        description: "The board has been reset for a new game!",
      });
      refetchGame();
      refetchParticipants();
      refetchStats();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start new round. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Export data
  const handleExportData = async () => {
    try {
      const response = await fetch('/api/export');
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participants-round-${stats.currentRound}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data Exported",
        description: "Participant data has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isLoading = drawWinnerMutation.isPending || newRoundMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Heart className="text-blue-500 h-8 w-8" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Square Game Manager</h1>
                <p className="text-sm text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <div className="flex items-center text-green-600" title="Real-time updates active">
                    <Wifi className="h-4 w-4" />
                    <span className="text-xs ml-1">Live</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-500" title="Connection lost">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-xs ml-1">Offline</span>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-100 rounded-lg p-1 flex">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-blue-500 text-white"
                  data-testid="admin-view-active"
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Admin
                </Button>
                <Link href="/seller">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-700 hover:text-gray-900"
                    data-testid="link-seller"
                  >
                    <Store className="mr-2 h-4 w-4" />
                    Seller
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AdminDashboard
          stats={stats}
          participants={participants}
          squares={squares}
          onDrawWinner={() => drawWinnerMutation.mutate()}
          onNewRound={() => newRoundMutation.mutate()}
          onExportData={handleExportData}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
