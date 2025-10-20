import { useState, useEffect } from 'react';

export function useMiniapp() {
  const [isMiniapp, setIsMiniapp] = useState(false);
  
  useEffect(() => {
    // Detect if running inside Farcaster/Base app
    const isFramed = window.self !== window.top;
    setIsMiniapp(isFramed);
  }, []);
  
  return { isMiniapp };
}
