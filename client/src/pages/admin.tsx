import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AdminDashboard } from "@/components/AdminDashboard";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type GameStats, type Participant, type Square, type BoardUpdate } from "@shared/schema";
import { Heart, Store, Wifi, WifiOff } from "lucide-react";
import logoImage from "@/assets/logo.png";

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

  // Polling for real-time updates (temporary replacement for WebSocket)
  useEffect(() => {
    const interval = setInterval(() => {
      refetchGame();
      refetchStats();
    }, 3000); // Poll every 3 seconds for admin

    return () => clearInterval(interval);
  }, [refetchGame, refetchStats]);

  // WebSocket for real-time updates (currently disabled)
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

  // Update price mutation
  const updatePriceMutation = useMutation({
    mutationFn: (pricePerSquare: number) => apiRequest('POST', '/api/update-price', { pricePerSquare }),
    onSuccess: () => {
      toast({
        title: "Price Updated",
        description: "Square price has been updated successfully!",
      });
      refetchGame();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update price. Please try again.",
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

  // Reset system mutation
  const resetSystemMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/reset-system'),
    onSuccess: () => {
      toast({
        title: "System Reset Complete",
        description: "System has been reset back to Round #1!",
      });
      refetchGame();
      refetchStats();
      refetchParticipants();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset system. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Manual winner mutation
  const manualWinnerMutation = useMutation({
    mutationFn: (squareNumber: number) => apiRequest('POST', '/api/manual-winner', { squareNumber }),
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Winner Set!",
        description: `Square #${data.winnerSquare} has been set as the winner!`,
      });
      refetchGame();
      refetchStats();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to set winner. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Export data as CSV
  const handleExportData = async () => {
    try {
      const response = await fetch('/api/export');
      const data = await response.json();
      
      // Convert to CSV format
      const csvHeaders = ['Name', 'Email', 'Phone', 'Squares', 'Total Amount', 'Payment Status', 'Date'];
      const csvRows = [csvHeaders.join(',')];
      
      if (data.participants && data.participants.length > 0) {
        data.participants.forEach((participant: Participant) => {
          const row = [
            `"${participant.name}"`,
            `"${participant.email}"`,
            `"${participant.phone}"`,
            `"${participant.squares.map(s => `#${s}`).join('; ')}"`,
            `$${(participant.totalAmount / 100).toFixed(2)}`,
            participant.paymentStatus,
            `"${new Date(participant.createdAt || Date.now()).toLocaleDateString()}"`
          ];
          csvRows.push(row.join(','));
        });
      } else {
        // Add empty row if no participants
        csvRows.push('"No participants yet","","","","","",""');
      }
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `square-game-participants-round-${data.gameRound?.roundNumber || 'current'}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "CSV Exported",
        description: "Participant data has been downloaded as CSV file.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isLoading = drawWinnerMutation.isPending || newRoundMutation.isPending || updatePriceMutation.isPending || resetSystemMutation.isPending || manualWinnerMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src={logoImage} alt="Chicken Poop Bingo Logo" className="h-24 w-24" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Chicken Poop Bingo</h1>
                <p className="text-sm text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status - using polling for updates */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-green-600" title="Real-time updates via polling">
                  <Wifi className="h-4 w-4" />
                  <span className="text-xs ml-1">Live</span>
                </div>
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
          gameRound={(gameData as any)?.gameRound}
          onDrawWinner={() => drawWinnerMutation.mutate()}
          onNewRound={() => newRoundMutation.mutate()}
          onExportData={handleExportData}
          onUpdatePrice={(price) => updatePriceMutation.mutate(price)}
          onResetSystem={() => resetSystemMutation.mutate()}
          onManualWinner={(squareNumber) => manualWinnerMutation.mutate(squareNumber)}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
