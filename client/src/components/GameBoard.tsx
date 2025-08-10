import { Button } from "@/components/ui/button";
import { type Square } from "@shared/schema";

interface GameBoardProps {
  squares: Square[];
  selectedSquares: number[];
  otherSelections?: number[];
  onSquareSelect?: (squareNumber: number) => void;
  readonly?: boolean;
}

export function GameBoard({ squares, selectedSquares, otherSelections = [], onSquareSelect, readonly = false }: GameBoardProps) {
  const getSquareStatus = (squareNumber: number) => {
    const square = squares.find(s => s.number === squareNumber);
    if (!square) return 'available';
    
    if (selectedSquares.includes(squareNumber)) return 'selected';
    if (otherSelections.includes(squareNumber)) return 'other-selected';
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
      case 'other-selected':
        return 'bg-orange-400 text-white cursor-not-allowed border-2 border-orange-600';
      case 'available':
      default:
        return 'bg-green-500 text-white hover:bg-green-600 active:scale-95';
    }
  };

  const handleSquareClick = (squareNumber: number) => {
    if (readonly) return;
    
    const status = getSquareStatus(squareNumber);
    if (status === 'sold' || status === 'reserved' || status === 'other-selected') return;
    // Block clicks on squares selected by other users
    
    onSquareSelect?.(squareNumber);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div 
        className={`grid grid-cols-10 ${
          readonly 
            ? 'gap-1 sm:gap-2 lg:gap-3' 
            : 'gap-1 sm:gap-2'
        }`} 
        data-testid="game-board"
      >
        {Array.from({ length: 65 }, (_, i) => i + 1).map(number => {
          const status = getSquareStatus(number);
          const isDisabled = status === 'sold' || status === 'reserved';
          
          return (
            <Button
              key={number}
              data-testid={`square-${number}`}
              onClick={() => handleSquareClick(number)}
              disabled={isDisabled || readonly}
              className={`aspect-square flex items-center justify-center ${
                readonly 
                  ? 'font-medium text-xs sm:text-sm' 
                  : 'font-semibold text-xs sm:text-sm'
              } rounded-md sm:rounded-lg transition-all duration-200 touch-manipulation ${getSquareClassName(status)}`}
              style={{ 
                minHeight: readonly 
                  ? 'clamp(28px, 8vw, 40px)' 
                  : 'clamp(32px, 9vw, 48px)',
                minWidth: readonly 
                  ? 'clamp(28px, 8vw, 40px)' 
                  : 'clamp(32px, 9vw, 48px)',
                fontSize: readonly 
                  ? 'clamp(10px, 2.5vw, 14px)' 
                  : 'clamp(11px, 2.8vw, 16px)'
              }}
            >
              {number}
            </Button>
          );
        })}
      </div>
      
      <div className="border-t border-gray-200 pt-3 sm:pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600">Sold</span>
          </div>
          {!readonly && (
            <>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded"></div>
                <span className="text-gray-600">Selected</span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-400 rounded"></div>
                <span className="text-gray-600">Reserved</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
