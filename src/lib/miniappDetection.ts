/**
 * Detects if the app is running inside Farcaster miniapp context
 * Returns true only when launched from Base/Farcaster app
 */
export function isMiniappContext(): boolean {
  // Check for Farcaster-specific context markers
  const isFarcasterFrame = window.parent !== window;
  const hasFarcasterReferrer = document.referrer.includes('farcaster') || 
                                document.referrer.includes('warpcast') ||
                                document.referrer.includes('base.org');
  const hasMiniappParam = new URLSearchParams(window.location.search).has('miniapp');
  
  return isFarcasterFrame || hasFarcasterReferrer || hasMiniappParam;
}

/**
 * Safe wrapper to only execute miniapp code in miniapp context
 */
export function executeMiniappCode(fn: () => void): void {
  if (isMiniappContext()) {
    try {
      fn();
    } catch (error) {
      console.warn('[Miniapp] Failed to execute miniapp code:', error);
    }
  }
}
