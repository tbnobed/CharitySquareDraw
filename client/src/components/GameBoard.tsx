import { Button } from "@/components/ui/button";
import { type Square } from "@shared/schema";

interface GameBoardProps {
  squares: Square[];
  selectedSquares: number[];
  onSquareSelect?: (squareNumber: number) => void;
  readonly?: boolean;
}

export function GameBoard({ squares, selectedSquares, onSquareSelect, readonly = false }: GameBoardProps) {
  const getSquareStatus = (squareNumber: number) => {
    const square = squares.find(s => s.number === squareNumber);
    if (!square) return 'available';
    
    if (selectedSquares.includes(squareNumber)) return 'selected';
    return square.status;
  };

  const getSquareClassName = (status: string) => {
    switch (status) {
      case 'sold':
        return 'bg-red-500 text-white cursor-not-allowed';
      case 'reserved':
        return 'bg-gray-400 text-white cursor-not-allowed';
      case 'selected':
        return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'available':
      default:
        return 'bg-green-500 text-white hover:bg-green-600 active:scale-95';
    }
  };

  const handleSquareClick = (squareNumber: number) => {
    if (readonly) return;
    
    const status = getSquareStatus(squareNumber);
    if (status === 'sold' || status === 'reserved') return;
    
    onSquareSelect?.(squareNumber);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-10 gap-2" data-testid="game-board">
        {Array.from({ length: 65 }, (_, i) => i + 1).map(number => {
          const status = getSquareStatus(number);
          const isDisabled = status === 'sold' || status === 'reserved';
          
          return (
            <Button
              key={number}
              data-testid={`square-${number}`}
              onClick={() => handleSquareClick(number)}
              disabled={isDisabled || readonly}
              className={`aspect-square flex items-center justify-center font-semibold rounded-lg transition-all duration-200 touch-manipulation ${getSquareClassName(status)}`}
              style={{ minHeight: '44px' }}
            >
              {number}
            </Button>
          );
        })}
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600">Sold</span>
          </div>
          {!readonly && (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-gray-600">Selected</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span className="text-gray-600">Reserved</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
