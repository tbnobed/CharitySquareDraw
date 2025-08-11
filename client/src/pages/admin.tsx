import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AdminDashboard } from "@/components/AdminDashboard";
import { WinnerDisplay } from "@/components/WinnerDisplay";
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
      refetchParticipants(); // Add participants to polling
    }, 3000); // Poll every 3 seconds for admin

    return () => clearInterval(interval);
  }, [refetchGame, refetchStats, refetchParticipants]);

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
        description: `Square #${data.winnerSquare} wins $${(data.totalPot / 100).toFixed(2)}!`,
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

  // Reset system mutation with auto export
  const resetSystemMutation = useMutation({
    mutationFn: async () => {
      // First, automatically export all data before reset
      try {
        await handleExportData();
        // Small delay to ensure export completes
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Export before reset failed:', error);
        // Continue with reset even if export fails
      }
      
      // Then perform the reset
      return apiRequest('POST', '/api/reset-system');
    },
    onSuccess: () => {
      toast({
        title: "System Reset Complete",
        description: "Data exported and system reset back to Round #1!",
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

  // Cleanup reservations mutation
  const cleanupReservationsMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/cleanup-reservations'),
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Cleanup Complete",
        description: data.message,
      });
      // Force refresh all data after cleanup
      refetchGame();
      refetchStats();
      refetchParticipants();
    },
    onError: (error) => {
      console.error('Cleanup error:', error);
      toast({
        title: "Error",
        description: "Failed to cleanup reservations. Please try again.",
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
      
      // Convert to CSV format with all rounds
      const csvHeaders = ['Round #', 'Name', 'Email', 'Phone', 'Squares', 'Total Amount', 'Payment Status', 'Date', 'Winner', 'Round Status'];
      const csvRows = [csvHeaders.join(',')];
      
      if (data.rounds && data.rounds.length > 0) {
        data.rounds.forEach((roundData: any) => {
          const round = roundData.round;
          const participants = roundData.participants || [];
          const winner = roundData.winner;
          
          if (participants.length > 0) {
            participants.forEach((participant: Participant) => {
              const isWinner = winner?.winner?.id === participant.id ? 'YES' : 'NO';
              const row = [
                `"Round ${round.roundNumber}"`,
                `"${participant.name}"`,
                `"${participant.email}"`,
                `"${participant.phone}"`,
                `"${participant.squares.map(s => `#${s}`).join('; ')}"`,
                `$${(participant.totalAmount / 100).toFixed(2)}`,
                participant.paymentStatus,
                `"${new Date(participant.createdAt || Date.now()).toLocaleDateString()}"`,
                isWinner,
                round.status
              ];
              csvRows.push(row.join(','));
            });
          } else {
            // Add empty row for rounds with no participants
            const row = [
              `"Round ${round.roundNumber}"`,
              '"No participants"',
              '""',
              '""',
              '""',
              '$0.00',
              '""',
              `"${new Date(round.createdAt || Date.now()).toLocaleDateString()}"`,
              winner ? 'N/A' : 'NO',
              round.status
            ];
            csvRows.push(row.join(','));
          }
        });
      } else {
        // Add empty row if no rounds
        csvRows.push('"No rounds found","","","","","","","","",""');
      }
      
      // Add summary row
      if (data.summary) {
        csvRows.push(''); // Empty line
        csvRows.push('"SUMMARY"');
        csvRows.push(`"Total Rounds:","${data.summary.totalRounds}"`);
        csvRows.push(`"Completed Rounds:","${data.summary.completedRounds}"`);
        csvRows.push(`"Active Rounds:","${data.summary.activeRounds}"`);
        csvRows.push(`"Total Revenue:","$${(data.summary.totalRevenue / 100).toFixed(2)}"`);
        csvRows.push(`"Export Date:","${new Date(data.exportDate).toLocaleString()}"`);
      }
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `square-game-all-rounds-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "CSV Exported",
        description: `All rounds data exported successfully (${data.summary?.totalRounds || 0} rounds).`,
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile-Optimized Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0 sticky top-0 z-50">
        <div className="px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between items-center h-12 sm:h-14 lg:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              <img src={logoImage} alt="Logo" className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12" />
              <div>
                <h1 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900">Chicken Poop Bingo</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Admin Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4">
              {/* Mobile Connection Status */}
              <div className="flex items-center text-green-600">
                <Wifi className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs ml-1 hidden sm:inline">Live</span>
              </div>
              
              {/* Mobile Navigation */}
              <div className="bg-gray-100 rounded-lg p-1 flex">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-blue-500 text-white text-xs sm:text-sm px-2 sm:px-3"
                  data-testid="admin-view-active"
                >
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
                <Link href="/seller">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-700 hover:text-gray-900 text-xs sm:text-sm px-2 sm:px-3"
                    data-testid="link-seller"
                  >
                    <Store className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Seller</span>
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile-First Layout */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6 w-full">
          {/* Winner Display - Compact for Mobile */}
          <WinnerDisplay className="mb-3 sm:mb-4 lg:mb-6" />
          
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
            onCleanupReservations={() => cleanupReservationsMutation.mutate()}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
