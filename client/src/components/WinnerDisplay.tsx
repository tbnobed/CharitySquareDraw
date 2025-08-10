import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, DollarSign, Calendar } from "lucide-react";

interface Winner {
  name: string;
  square: number;
  totalPot: number;
  roundNumber: number;
  completedAt: string;
}

interface WinnerDisplayProps {
  className?: string;
}

export function WinnerDisplay({ className }: WinnerDisplayProps) {
  const { data: winnerData, isLoading } = useQuery<{winner: Winner | null}>({
    queryKey: ['/api/winner'],
    refetchInterval: 3000, // Refresh every 3 seconds to catch new winners
  });

  if (isLoading) {
    return null;
  }

  const winner: Winner | null = winnerData?.winner || null;

  if (!winner) {
    return null;
  }

  const formattedPot = (winner.totalPot / 100).toFixed(2);
  const completedDate = new Date(winner.completedAt).toLocaleDateString();

  return (
    <Card className={`bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700 ${className}`} data-testid="winner-display">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <Trophy className="w-5 h-5" />
          Round {winner.roundNumber} Winner!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100" data-testid="winner-name">
              {winner.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400" data-testid="winner-square">
              Square #{winner.square}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <DollarSign className="w-4 h-4" />
              <span className="text-lg font-bold" data-testid="winner-pot">
                ${formattedPot}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3" />
              <span data-testid="winner-date">{completedDate}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}