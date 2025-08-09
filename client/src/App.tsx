import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BackgroundLogo } from "@/components/BackgroundLogo";
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
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <Toaster />
            <Router />
          </div>
          <BackgroundLogo />
        </TooltipProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;
