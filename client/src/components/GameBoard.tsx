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

  // Define the exact grid layout from the image
  const gridLayout = [
    [59, 15, 26, 3, 25, 6, 17, 53, 30, 5, 62],
    [55, 33, 44, 16, 39, 13, 36, 48, 45, 20, 57],
    [61, 46, 9, 51, 58, "BONUS", 64, 19, 12, 10, 60],
    [2, 28, 34, 50, 40, 24, 42, 27, 31, 35, 54],
    [4, 32, 43, 38, 21, 37, 23, 49, 7, 41, 63],
    [65, 8, 1, 11, 52, 47, 18, 29, 22, 14, 56]
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div 
        className={`grid grid-cols-11 w-full ${
          readonly 
            ? 'gap-2 sm:gap-3 lg:gap-4' 
            : 'gap-2 sm:gap-3'
        }`} 
        data-testid="game-board"
      >
          {gridLayout.flat().map((cell, index) => {
          if (cell === "BONUS") {
            return (
              <div
                key="bonus"
                className={`aspect-square flex items-center justify-center ${
                  readonly 
                    ? 'font-medium text-xs sm:text-sm' 
                    : 'font-semibold text-xs sm:text-sm'
                } rounded-md sm:rounded-lg bg-purple-600 text-white cursor-not-allowed`}
                style={{ 
                  minHeight: readonly 
                    ? 'clamp(32px, 10vw, 44px)' 
                    : 'clamp(36px, 11vw, 52px)',
                  minWidth: readonly 
                    ? 'clamp(32px, 10vw, 44px)' 
                    : 'clamp(36px, 11vw, 52px)',
                  fontSize: readonly 
                    ? 'clamp(8px, 2.5vw, 12px)' 
                    : 'clamp(9px, 2.8vw, 14px)'
                }}
                data-testid="bonus-square"
              >
                BONUS
              </div>
            );
          }

          const number = cell as number;
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
                  ? 'clamp(32px, 10vw, 44px)' 
                  : 'clamp(36px, 11vw, 52px)',
                minWidth: readonly 
                  ? 'clamp(32px, 10vw, 44px)' 
                  : 'clamp(36px, 11vw, 52px)',
                fontSize: readonly 
                  ? 'clamp(11px, 3vw, 15px)' 
                  : 'clamp(12px, 3.2vw, 17px)'
              }}
            >
              {number}
            </Button>
          );
        })}
      </div>
      
      <div className="border-t border-gray-200 pt-3 sm:pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 text-xs sm:text-sm">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">Available</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600">Sold</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-purple-600 rounded"></div>
            <span className="text-gray-600">Bonus</span>
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
