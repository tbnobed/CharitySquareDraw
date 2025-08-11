import { Button } from "@/components/ui/button";
import { type Square } from "@shared/schema";

interface GameBoardProps {
  squares: Square[];
  selectedSquares: number[];
  otherSelections?: number[];
  onSquareSelect?: (squareNumber: number) => void;
  readonly?: boolean;
  layoutMode?: 'real-world' | 'sequential';
}

export function GameBoard({ squares, selectedSquares, otherSelections = [], onSquareSelect, readonly = false, layoutMode = 'real-world' }: GameBoardProps) {
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
  const realWorldLayout = [
    [59, 15, 26, 3, 25, 6, 17, 53, 30, 5, 62],
    [55, 33, 44, 16, 39, 13, 36, 48, 45, 20, 57],
    [61, 46, 9, 51, 58, "BONUS", 64, 19, 12, 10, 60],
    [2, 28, 34, 50, 40, 24, 42, 27, 31, 35, 54],
    [4, 32, 43, 38, 21, 37, 23, 49, 7, 41, 63],
    [65, 8, 1, 11, 52, 47, 18, 29, 22, 14, 56]
  ];

  // Define sequential layout (1-65 in order with BONUS in center)
  const sequentialLayout = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
    [23, 24, 25, 26, 27, "BONUS", 28, 29, 30, 31, 32],
    [33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43],
    [44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54],
    [55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65]
  ];

  const gridLayout = layoutMode === 'sequential' ? sequentialLayout : realWorldLayout;

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      <div 
        className={`grid grid-cols-11 w-full max-w-full overflow-hidden ${
          readonly 
            ? 'gap-0.5 sm:gap-1 md:gap-2 lg:gap-3' 
            : 'gap-0.5 sm:gap-1 md:gap-2'
        }`} 
        style={{
          containerType: 'inline-size'
        }}
        data-testid="game-board"
      >
          {gridLayout.flat().map((cell, index) => {
          if (cell === "BONUS") {
            return (
              <Button
                key="bonus"
                data-testid="bonus-square"
                disabled={true}
                className={`aspect-square flex items-center justify-center ${
                  readonly 
                    ? 'font-medium text-xs sm:text-sm' 
                    : 'font-semibold text-xs sm:text-sm'
                } rounded-md sm:rounded-lg transition-all duration-200 touch-manipulation bg-red-600 text-white cursor-not-allowed hover:bg-red-600 border-0 p-0`}
                style={{ 
                  width: readonly 
                    ? 'calc((100% - 10 * 0.125rem) / 11)' 
                    : 'calc((100% - 10 * 0.125rem) / 11)',
                  height: readonly 
                    ? 'calc((100% - 10 * 0.125rem) / 11)' 
                    : 'calc((100% - 10 * 0.125rem) / 11)',
                  minHeight: '20px',
                  minWidth: '20px',
                  maxHeight: readonly ? '44px' : '52px',
                  maxWidth: readonly ? '44px' : '52px',
                  fontSize: readonly 
                    ? 'clamp(7px, 1.8vw, 15px)' 
                    : 'clamp(8px, 2vw, 17px)'
                }}
              >
                <span className="leading-none text-center whitespace-nowrap overflow-hidden">
                  <span className="hidden sm:inline">BONUS</span>
                  <span className="sm:hidden">BON</span>
                </span>
              </Button>
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
                width: readonly 
                  ? 'calc((100% - 10 * 0.125rem) / 11)' 
                  : 'calc((100% - 10 * 0.125rem) / 11)',
                height: readonly 
                  ? 'calc((100% - 10 * 0.125rem) / 11)' 
                  : 'calc((100% - 10 * 0.125rem) / 11)',
                minHeight: '20px',
                minWidth: '20px',
                maxHeight: readonly ? '44px' : '52px',
                maxWidth: readonly ? '44px' : '52px',
                fontSize: readonly 
                  ? 'clamp(7px, 1.8vw, 15px)' 
                  : 'clamp(8px, 2vw, 17px)'
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
            <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-600 rounded"></div>
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
