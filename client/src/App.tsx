import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AdminPage from "@/pages/admin";
import SellerPage from "@/pages/seller";
import ReceiptPage from "@/pages/receipt";

function Router() {
  return (
    <Switch>
      <Route path="/" component={SellerPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/seller" component={SellerPage} />
      <Route path="/receipt" component={ReceiptPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
