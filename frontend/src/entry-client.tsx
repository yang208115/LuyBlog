import "vite/modulepreload-polyfill";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as OriginalBrowserRouter } from "react-router-dom";
import "uno.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppThemeProvider } from "./context/ThemeContextProvider";
import { MusicProvider } from "./context/MusicProvider";
import { SiteConfigProvider } from "./context/SiteConfigProvider";
import { AppRoutes } from "./routes";

// CJS/ESM interop fix for react-router-dom
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BrowserRouter = (OriginalBrowserRouter as any).default ?? OriginalBrowserRouter;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    },
  },
});

const AppComponent = (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SiteConfigProvider>
        <AppThemeProvider>
          <MusicProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </MusicProvider>
        </AppThemeProvider>
      </SiteConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

const rootElement = document.getElementById("root")!;

ReactDOM.createRoot(rootElement).render(AppComponent);
