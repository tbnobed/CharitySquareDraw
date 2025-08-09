import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { GameBoard } from "@/components/GameBoard";
import { ParticipantFormComponent } from "@/components/ParticipantForm";
import { PaymentModal } from "@/components/PaymentModal";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type GameStats, type Square, type ParticipantForm as ParticipantFormData, type BoardUpdate, type Participant } from "@shared/schema";
import { Heart, Store, Check, Info, Wifi, WifiOff } from "lucide-react";
import React from "react";

export default function SellerPage() {
  const [selectedSquares, setSelectedSquares] = useState<number[]>([]);
  const [reservedParticipant, setReservedParticipant] = useState<Participant | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
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
  const { data: gameData, refetch: refetchGame } = useQuery({
    queryKey: ['/api/game'],
  });

  const squares: Square[] = (gameData as any)?.squares || [];

  // WebSocket for real-time updates
  const { isConnected } = useWebSocket((data: BoardUpdate) => {
    console.log('Seller received WebSocket update:', data);
    
    switch (data.type) {
      case 'SQUARE_UPDATE':
        const { squares: updatedSquares, status, action } = data.data;
        
        // If squares were reserved/sold by others, remove them from our selection
        if (action === 'reserve' || action === 'confirm') {
          setSelectedSquares(prev => prev.filter(sq => !updatedSquares.includes(sq)));
        }
        
        refetchGame();
        refetchStats();
        
        // Show toast notification for real-time updates
        if (action === 'reserve') {
          toast({
            title: "Squares Reserved",
            description: `Squares ${updatedSquares.join(", ")} were just reserved by another seller.`,
            variant: "default",
          });
        } else if (action === 'confirm') {
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
        setShowSuccessModal(false);
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
      setShowSuccessModal(true);
      setSelectedSquares([]);
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
      if (prev.includes(squareNumber)) {
        return prev.filter(sq => sq !== squareNumber);
      } else {
        return [...prev, squareNumber];
      }
    });
  };

  const handleRemoveSquare = (squareNumber: number) => {
    setSelectedSquares(prev => prev.filter(sq => sq !== squareNumber));
  };

  const handleFormSubmit = (data: ParticipantFormData) => {
    reserveMutation.mutate(data);
  };

  const handlePaymentConfirm = () => {
    if (reservedParticipant) {
      confirmPaymentMutation.mutate(reservedParticipant.id);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setReservedParticipant(null);
  };

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
                <p className="text-sm text-gray-500">Seller Interface</p>
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
                <Link href="/admin">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-700 hover:text-gray-900"
                    data-testid="link-admin"
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Admin
                  </Button>
                </Link>
                <Button
                  variant="default"
                  size="sm"
                  className="bg-blue-500 text-white"
                  data-testid="seller-view-active"
                >
                  <Store className="mr-2 h-4 w-4" />
                  Seller
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Current Status Banner */}
        <Card className="bg-blue-50 border-blue-200 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Info className="text-blue-500 mr-3 h-5 w-5" />
                <div>
                  <p className="font-medium text-blue-900">
                    Round #{stats.currentRound} Active
                  </p>
                  <p className="text-sm text-blue-700">
                    {stats.availableCount} squares available · $20 each
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-900" data-testid="total-pot">
                  ${stats.totalRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-blue-600">Total Pot</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Game Board */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Select Your Squares</h2>
                  <div className="text-sm text-gray-600">
                    Tap available squares to select
                  </div>
                </div>
                
                <GameBoard
                  squares={squares}
                  selectedSquares={selectedSquares}
                  onSquareSelect={handleSquareSelect}
                />
              </CardContent>
            </Card>
          </div>

          {/* Purchase Form */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <ParticipantFormComponent
              selectedSquares={selectedSquares}
              onRemoveSquare={handleRemoveSquare}
              onSubmit={handleFormSubmit}
              isLoading={reserveMutation.isPending}
            />
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {reservedParticipant && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          amount={reservedParticipant.totalAmount}
          squares={reservedParticipant.squares}
          participantName={reservedParticipant.name}
          onPaymentConfirm={handlePaymentConfirm}
          isConfirming={confirmPaymentMutation.isPending}
        />
      )}

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={handleSuccessClose}>
        <DialogContent className="max-w-md" data-testid="success-modal">
          <DialogHeader>
            <DialogTitle className="text-center">Purchase Complete!</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="text-green-500 h-8 w-8" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Purchase Complete!</h3>
              <p className="text-gray-600 mb-6">Your squares have been reserved and payment confirmed.</p>
              
              {reservedParticipant && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-1">Confirmation Details</p>
                  <p className="font-medium text-gray-900">{reservedParticipant.name}</p>
                  <p className="text-sm text-gray-600">
                    Squares: {reservedParticipant.squares.map(s => `#${s}`).join(", ")}
                  </p>
                  <p className="text-sm text-gray-600">
                    Amount: ${reservedParticipant.totalAmount}
                  </p>
                </div>
              )}
            </div>
            
            <Button
              onClick={handleSuccessClose}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              data-testid="button-continue"
            >
              Continue Selling
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
