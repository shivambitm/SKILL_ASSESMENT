// src/hooks/useVercelAnalytics.ts
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    vercel?: {
      track: (event: string) => void;
    };
  }
}

export default function useVercelAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (window.vercel && typeof window.vercel.track === "function") {
      window.vercel.track("pageview");
    }
  }, [location]);
}
