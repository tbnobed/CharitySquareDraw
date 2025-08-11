import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GameBoard } from "@/components/GameBoard";
import { ParticipantFormComponent } from "@/components/ParticipantForm";
import { PaymentModal } from "@/components/PaymentModal";
import { QRReceiptModal } from "@/components/QRReceiptModal";
import { WinnerDisplay } from "@/components/WinnerDisplay";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type GameStats, type Square, type ParticipantForm as ParticipantFormData, type BoardUpdate, type Participant } from "@shared/schema";
import { Heart, Store, Check, Info, Wifi, WifiOff } from "lucide-react";
import logoImage from "@/assets/logo.png";
import React from "react";

export default function SellerPage() {
  const [selectedSquares, setSelectedSquares] = useState<number[]>([]);
  const [reservedParticipant, setReservedParticipant] = useState<Participant | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQRReceiptModal, setShowQRReceiptModal] = useState(false);
  const [shouldResetForm, setShouldResetForm] = useState(false);
  const { toast } = useToast();
  const [wsConnectionStatus, setWsConnectionStatus] = useState<string>('connecting');

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
  const { data: gameData, refetch: refetchGame } = useQuery<{gameRound: any, squares: any[]}>({
    queryKey: ['/api/game'],
  });

  const squares: Square[] = (gameData as any)?.squares || [];

  // Generate a session ID to track this user's selections
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [otherSelections, setOtherSelections] = useState<number[]>([]);

  // Fetch temporary selections from other users
  const { data: selectionsData, refetch: refetchSelections } = useQuery({
    queryKey: ['/api/selections'],
    refetchInterval: 1000, // Poll every 1 second for selections
  });

  // Update selections state
  useEffect(() => {
    if (selectionsData && typeof selectionsData === 'object' && 'selections' in selectionsData && Array.isArray(selectionsData.selections)) {
      // My selections
      const mySelections = selectionsData.selections
        .filter((sel: any) => sel.selectedBy === sessionId)
        .map((sel: any) => sel.square);
      setSelectedSquares(mySelections);
      
      // Others' selections
      const otherUserSelections = selectionsData.selections
        .filter((sel: any) => sel.selectedBy !== sessionId)
        .map((sel: any) => sel.square);
      setOtherSelections(otherUserSelections);
    }
  }, [selectionsData, sessionId]);

  // Polling for real-time updates (temporary replacement for WebSocket)
  useEffect(() => {
    const interval = setInterval(() => {
      refetchGame();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [refetchGame]);

  // WebSocket for real-time updates (currently disabled)
  const { isConnected, sendMessage } = useWebSocket((data: BoardUpdate) => {
    console.log('Seller received WebSocket update:', data);
    
    switch (data.type) {
      case 'CONNECTION_ESTABLISHED':
        console.log('WebSocket connection confirmed:', data.data.message);
        break;
        
      case 'SQUARE_SELECTION':
        // Handle real-time square selection preview from other users
        const { square, action: selectionAction } = data.data;
        console.log('Received square selection from another user:', square, selectionAction);
        // We could add visual indicators here for squares being selected by others
        break;
        
      case 'SQUARE_UPDATE':
        const { squares: updatedSquares, status, action: updateAction } = data.data;
        
        // If squares were reserved/sold by others, remove them from our selection
        if (updateAction === 'reserve' || updateAction === 'confirm') {
          setSelectedSquares(prev => prev.filter(sq => !updatedSquares.includes(sq)));
        }
        
        refetchGame();
        refetchStats();
        
        // Show toast notification for real-time updates
        if (updateAction === 'reserve') {
          toast({
            title: "Squares Reserved",
            description: `Squares ${updatedSquares.join(", ")} were just reserved by another seller.`,
            variant: "default",
          });
        } else if (updateAction === 'confirm') {
          toast({
            title: "Squares Sold",
            description: `Squares ${updatedSquares.join(", ")} were just sold!`,
            variant: "default",
          });
        }
        break;
        
      case 'PARTICIPANT_ADDED':
        refetchGame();
        refetchStats();
        break;
        
      case 'STATS_UPDATE':
        refetchStats();
        break;
        
      case 'GAME_RESET':
        setSelectedSquares([]);
        setReservedParticipant(null);
        setShowPaymentModal(false);
        setShowQRReceiptModal(false);
        refetchGame();
        refetchStats();
        toast({
          title: "New Round Started",
          description: `Round #${data.data.roundNumber} has begun!`,
        });
        break;
    }
  });

  // Update connection status
  React.useEffect(() => {
    setWsConnectionStatus(isConnected ? 'connected' : 'disconnected');
  }, [isConnected]);

  // Reserve squares mutation
  const reserveMutation = useMutation({
    mutationFn: (data: ParticipantFormData) => apiRequest('POST', '/api/reserve', data),
    onSuccess: async (response) => {
      const data = await response.json();
      setReservedParticipant(data.participant);
      setShowPaymentModal(true);
      setSelectedSquares([]); // Clear local selections
      refetchGame(); // Refresh to show reserved squares
      toast({
        title: "Squares Reserved",
        description: "Squares have been reserved. Please complete payment.",
      });
    },
    onError: async (error: any) => {
      const errorData = await error.response?.json();
      toast({
        title: "Reservation Failed",
        description: errorData?.error || "Failed to reserve squares. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Confirm payment mutation
  const confirmPaymentMutation = useMutation({
    mutationFn: (participantId: string) => apiRequest('POST', `/api/confirm-payment/${participantId}`),
    onSuccess: () => {
      setShowPaymentModal(false);
      setShowQRReceiptModal(true);
      setSelectedSquares([]);
      setShouldResetForm(true); // Trigger form reset
      refetchGame();
      refetchStats();
      toast({
        title: "Payment Confirmed",
        description: "Payment has been confirmed and squares are now sold!",
      });
    },
    onError: () => {
      toast({
        title: "Confirmation Failed",
        description: "Failed to confirm payment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSquareSelect = (squareNumber: number) => {
    setSelectedSquares(prev => {
      const isCurrentlySelected = prev.includes(squareNumber);
      const action = isCurrentlySelected ? 'deselect' : 'select';
      
      // Update temporary selections on server first
      apiRequest('POST', '/api/selections', {
        squares: [squareNumber],
        action,
        sessionId
      }).then(async (response) => {
        // Only update local state if server accepted the selection
        const data = await response.json();
        if (data.success) {
          // Refetch selections to get updated state
          refetchSelections();
        }
      }).catch(error => {
        console.error('Failed to update selection on server:', error);
      });
      
      // Return current state - actual update happens via refetch
      return prev;
    });
  };

  const handleRemoveSquare = (squareNumber: number) => {
    // Remove from server selections
    apiRequest('POST', '/api/selections', {
      squares: [squareNumber],
      action: 'deselect',
      sessionId
    }).then(() => {
      refetchSelections(); // Refresh selections from server
    }).catch(error => {
      console.error('Failed to remove selection on server:', error);
    });
  };

  const handleFormSubmit = (data: ParticipantFormData) => {
    // Clear temporary selections when reserving
    apiRequest('POST', '/api/selections', {
      squares: selectedSquares,
      action: 'clear',
      sessionId
    }).catch(error => {
      console.error('Failed to clear selections:', error);
    });
    
    reserveMutation.mutate(data);
  };

  const handlePaymentConfirm = () => {
    if (reservedParticipant) {
      confirmPaymentMutation.mutate(reservedParticipant.id);
    }
  };

  const handlePaymentCancel = async () => {
    if (reservedParticipant) {
      try {
        // Cancel the reservation on the server
        await apiRequest('POST', `/api/cancel-reservation/${reservedParticipant.id}`);
        
        toast({
          title: "Reservation Cancelled",
          description: "The squares have been released and are now available.",
        });
      } catch (error) {
        console.error('Failed to cancel reservation:', error);
        toast({
          title: "Cancellation Failed",
          description: "There was an issue cancelling the reservation. Please try again.",
          variant: "destructive",
        });
      }
    }
    
    // Clean up local state
    setShowPaymentModal(false);
    setReservedParticipant(null);
    setSelectedSquares([]);
    
    // Refresh data to show updated square status
    refetchGame();
    refetchSelections();
  };

  const handleQRReceiptClose = () => {
    setShowQRReceiptModal(false);
    setReservedParticipant(null);
    setSelectedSquares([]);
  };

  const handleFormResetComplete = () => {
    setShouldResetForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-Optimized Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-3 sm:px-4">
          <div className="flex justify-between items-center h-12 sm:h-14">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img src={logoImage} alt="Logo" className="h-8 w-8 sm:h-10 sm:w-10" />
              <div>
                <h1 className="text-sm sm:text-lg font-bold text-gray-900">Chicken Poop Bingo</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Seller Interface</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Mobile Connection Status */}
              <div className="flex items-center text-green-600">
                <Wifi className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs ml-1 hidden sm:inline">Live</span>
              </div>
              
              {/* Mobile Navigation */}
              <div className="bg-gray-100 rounded-lg p-1 flex">
                <Link href="/admin">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-700 hover:text-gray-900 text-xs sm:text-sm px-2 sm:px-3"
                    data-testid="link-admin"
                  >
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                </Link>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-blue-500 text-white text-xs sm:text-sm px-2 sm:px-3"
                  data-testid="seller-view-active"
                >
                  <Store className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Seller</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Mobile-First Layout */}
      <div className="px-3 sm:px-4 py-3 sm:py-4 w-full">
        {/* Winner Display - Compact for Mobile */}
        <WinnerDisplay className="mb-3 sm:mb-4" />
        
        {/* Mobile-Optimized Status Banner */}
        <Card className="bg-blue-50 border-blue-200 mb-3 sm:mb-4">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center">
                <Info className="text-blue-500 mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <div>
                  <p className="font-medium text-blue-900 text-sm sm:text-base">
                    Round #{stats.currentRound} {gameData?.gameRound?.status === 'completed' ? 'Completed' : 'Active'}
                  </p>
                  <p className="text-xs sm:text-sm text-blue-700">
                    {stats.availableCount} squares · ${((gameData?.gameRound?.pricePerSquare || 1000) / 100).toFixed(2)} each
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-lg sm:text-xl font-bold text-blue-900" data-testid="total-pot">
                  ${((gameData?.gameRound?.totalRevenue || 0) / 100).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-blue-600">Total Pot</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile-First: Form First, Then Board */}
        <div className="space-y-4 lg:grid lg:grid-cols-5 lg:gap-6 lg:space-y-0">
          {/* Mobile: Purchase Form First */}
          <div className="lg:col-span-2 lg:order-2">
            <ParticipantFormComponent
              selectedSquares={selectedSquares}
              pricePerSquare={gameData?.gameRound?.pricePerSquare || 1000}
              onRemoveSquare={handleRemoveSquare}
              onSubmit={handleFormSubmit}
              isLoading={reserveMutation.isPending}
              shouldReset={shouldResetForm}
              onResetComplete={handleFormResetComplete}
              disabled={gameData?.gameRound?.status === 'completed'}
            />
          </div>

          {/* Game Board - Mobile Optimized */}
          <div className="lg:col-span-3 lg:order-1">
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 sm:mb-4 space-y-1 sm:space-y-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Select Squares</h2>
                  <div className="text-xs sm:text-sm text-gray-600">
                    {gameData?.gameRound?.status === 'completed' 
                      ? 'Round completed'
                      : 'Tap to select'
                    }
                  </div>
                </div>
                
                {/* Mobile-Optimized Game Board */}
                <div className="w-full">
                  <GameBoard
                    squares={squares}
                    selectedSquares={selectedSquares}
                    otherSelections={otherSelections}
                    onSquareSelect={handleSquareSelect}
                    readonly={gameData?.gameRound?.status === 'completed'}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {reservedParticipant && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={handlePaymentCancel}
          amount={reservedParticipant.totalAmount}
          squares={reservedParticipant.squares}
          participantName={reservedParticipant.name}
          onPaymentConfirm={handlePaymentConfirm}
          isConfirming={confirmPaymentMutation.isPending}
        />
      )}

      {/* QR Receipt Modal */}
      {reservedParticipant && (
        <QRReceiptModal
          isOpen={showQRReceiptModal}
          onClose={handleQRReceiptClose}
          participantId={reservedParticipant.id}
          participantName={reservedParticipant.name}
          squares={reservedParticipant.squares}
          totalAmount={reservedParticipant.totalAmount}
        />
      )}
    </div>
  );
}
