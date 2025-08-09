import { Switch, Route } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SplashScreen } from "@/components/SplashScreen";
import NotFound from "@/pages/not-found";
import AdminPage from "@/pages/admin";
import SellerPage from "@/pages/seller";
import ReceiptPage from "@/pages/receipt";
import HistoryPage from "@/pages/history";

function Router() {
  return (
    <Switch>
      <Route path="/" component={SellerPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/seller" component={SellerPage} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/receipt" component={ReceiptPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  console.log("App component rendered, showSplash:", showSplash);

  // Check if user has already seen splash screen in this session
  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    console.log("hasSeenSplash from sessionStorage:", hasSeenSplash);
    if (hasSeenSplash) {
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {showSplash ? (
          <SplashScreen onComplete={handleSplashComplete} />
        ) : (
          <Router />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
