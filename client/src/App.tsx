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
  const [showSplash, setShowSplash] = useState(() => {
    // Don't show splash screen for receipt pages or direct links
    const isReceiptPage = window.location.pathname === '/receipt';
    const hasDirectParams = window.location.search.includes('id=');
    return !(isReceiptPage || hasDirectParams);
  });

  const handleSplashComplete = () => {
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
