import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import splashLogo from "../assets/splash-logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [, setLocation] = useLocation();
  const [fadeOut, setFadeOut] = useState(false);

  console.log("SplashScreen component rendered");

  useEffect(() => {
    console.log("SplashScreen useEffect triggered");
    const timer = setTimeout(() => {
      setFadeOut(true);
      // Wait for fade out animation to complete
      setTimeout(() => {
        onComplete();
        setLocation("/seller");
      }, 500);
    }, 2000); // Show splash for 2 seconds

    return () => clearTimeout(timer);
  }, [onComplete, setLocation]);

  return (
    <div 
      className={`fixed inset-0 bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center z-50 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      data-testid="splash-screen"
    >
      <div className="text-center">
        <div className="mb-8 animate-pulse">
          <img 
            src={splashLogo} 
            alt="Chicken Poop Bingo Logo" 
            className="w-80 h-80 mx-auto object-contain"
            data-testid="splash-logo"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-orange-600 text-lg font-medium">Loading...</p>
        </div>
      </div>
    </div>
  );
}