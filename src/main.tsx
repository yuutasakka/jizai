
  import { createRoot } from "react-dom/client";
  import { Analytics } from '@vercel/analytics/react';
  import { ErrorBoundary } from './components/error-boundary';
  import RootRouter from "./router";
  // Design tokens and global styles
  import "./styles/globals.css";
  import "./index.css";

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <RootRouter />
      <Analytics />
    </ErrorBoundary>
  );
  
