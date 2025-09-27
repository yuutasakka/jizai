if ((import.meta as any)?.env?.DEV) {
  console.log('🔍 ENV Debug from App:', {
    url: import.meta.env.VITE_SUPABASE_URL,
    keyPrefix: import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 8),
    mode: import.meta.env.MODE
  });
}
  import { createRoot } from "react-dom/client";
  import { Analytics } from '@vercel/analytics/react';
  import { ErrorBoundary } from './components/error-boundary';
  import RootRouter from "./router";
  // Design tokens and global styles
  import "./styles/globals.css";
  import "./styles/responsive.css";
  import "./index.css";

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <RootRouter />
      <Analytics />
    </ErrorBoundary>
  );
  
