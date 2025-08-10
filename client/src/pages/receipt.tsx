import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Download, Home, QrCode, Trophy } from "lucide-react";
import { format } from "date-fns";
import { type Participant } from "@shared/schema";

export default function ReceiptPage() {
  const [, setLocation] = useLocation();
  const [participantId, setParticipantId] = useState<string>("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    if (id) {
      setParticipantId(id);
    }
  }, []);

  const { data: participant, isLoading } = useQuery<Participant>({
    queryKey: ['/api/participant', participantId],
    enabled: !!participantId,
  });

  const { data: gameData } = useQuery({
    queryKey: ['/api/game'],
  });

  // Get the winner for this specific round
  const { data: winnerData } = useQuery<{winner: {name: string; square: number; totalPot: number; roundNumber: number; completedAt: string} | null}>({
    queryKey: ['/api/winner', participant?.gameRoundId],
    enabled: !!participant?.gameRoundId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Receipt Not Found</h2>
            <p className="text-gray-600 mb-6">The receipt you're looking for doesn't exist or has expired.</p>
            <Button onClick={() => setLocation('/')}>
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pricePerSquare = ((gameData as any)?.gameRound?.pricePerSquare || 1000);
  const totalAmount = participant.squares.length * (pricePerSquare / 100);
  const currentDate = new Date();

  const handleDownload = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Receipt Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Receipt</h1>
          <p className="text-gray-600">Thank you for your purchase!</p>
        </div>

        {/* Winner Display (if winner exists for this round) */}
        {winnerData?.winner && (
          <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Trophy className="w-6 h-6 text-yellow-600" />
                <h3 className="text-xl font-bold text-yellow-800 dark:text-yellow-200">
                  Round {winnerData.winner.roundNumber} Winner!
                </h3>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  🎉 {winnerData.winner.name} won square #{winnerData.winner.square}
                </p>
                <p className="text-green-600 dark:text-green-400 font-bold text-lg">
                  Total Pot: ${(winnerData.winner.totalPot / 100).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {winnerData.winner.completedAt && format(new Date(winnerData.winner.completedAt), 'MMM dd, yyyy • h:mm a')}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Receipt Card */}
        <Card className="mb-6">
          <CardContent className="p-8">
            {/* Receipt Info */}
            <div className="border-b border-gray-200 pb-6 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Receipt #</p>
                  <p className="font-medium text-gray-900" data-testid="receipt-number">
                    {participant.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">
                    {format(currentDate, 'MMM dd, yyyy • h:mm a')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Game Round</p>
                  <p className="font-medium text-gray-900">
                    #{(gameData as any)?.gameRound?.roundNumber || 1}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <Badge variant={participant.paymentStatus === "paid" ? "default" : "secondary"} className="text-xs">
                    {participant.paymentStatus === "paid" ? "Paid" : "Pending"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Customer Information</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium text-gray-900" data-testid="customer-name">
                      {participant.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900" data-testid="customer-email">
                      {participant.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium text-gray-900" data-testid="customer-phone">
                      {participant.phone}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Selected Squares */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Squares</h3>
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex flex-wrap gap-2 mb-3" data-testid="receipt-squares">
                  {participant.squares.map(square => (
                    <Badge 
                      key={square}
                      variant="outline"
                      className="bg-blue-100 text-blue-800 border-blue-300 font-medium px-3 py-1"
                    >
                      #{square}
                    </Badge>
                  ))}
                </div>
                <div className="text-sm text-blue-700">
                  <p><strong>{participant.squares.length}</strong> squares at <strong>${pricePerSquare.toFixed(2)}</strong> each</p>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total Paid:</span>
                <span className="text-2xl font-bold text-green-600" data-testid="receipt-total">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={handleDownload}
            data-testid="button-download-receipt"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Receipt
          </Button>
          <Button 
            onClick={() => setLocation('/')}
            data-testid="button-back-home"
          >
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* QR Code Info */}
        <div className="mt-8 text-center">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <QrCode className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Save This Receipt</h3>
            <p className="text-sm text-gray-600 mb-4">
              Bookmark this page or take a screenshot to keep your receipt handy. 
              You can always access it with this link.
            </p>
            <div className="bg-gray-50 rounded-lg p-3">
              <code className="text-xs text-gray-700 break-all">
                {window.location.href}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}