import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AMA from "./pages/AMA";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import { WalletProvider } from "@/components/WalletProvider";
import { executeMiniappCode } from "@/lib/miniappDetection";

const queryClient = new QueryClient();

const App = () => {
  // Initialize Farcaster miniapp SDK (only in miniapp context)
  useEffect(() => {
    executeMiniappCode(() => {
      import('@farcaster/miniapp-sdk').then(({ sdk }) => {
        // Hide Farcaster loading splash and show our app
        sdk.actions.ready();
        console.log('[Miniapp] SDK ready called');
      }).catch((error) => {
        console.warn('[Miniapp] Failed to load SDK:', error);
      });
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <WalletProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/ama/:id" element={<AMA />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </WalletProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
