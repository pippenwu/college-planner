import { useEffect } from 'react';

export function useLemonSqueezy() {
  // Initialize Lemon.js when the hook is used
  useEffect(() => {
    // Make sure we're in a browser environment
    if (typeof window === 'undefined' || !window.LemonSqueezy) {
      console.warn('Lemon.js is not available');
      return;
    }

    // Initialize Lemon.js with our configuration
    window.LemonSqueezy.Setup({
      // Listen for checkout events
      eventHandler: (data) => {
        console.log('Lemon Squeezy event:', data);
        
        // Handle checkout events
        if (data.event === 'Checkout.Success') {
          // Dispatch a success event to notify components
          window.dispatchEvent(
            new MessageEvent('message', {
              data: 'lemonsqueezy:payment:success'
            })
          );
        }
      }
    });

    console.log('Lemon.js initialized');
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  // Function to open checkout overlay
  const openCheckout = (checkoutUrl: string) => {
    if (typeof window === 'undefined' || !window.LemonSqueezy) {
      console.warn('Lemon.js is not available');
      // Fallback to redirect
      window.location.href = checkoutUrl;
      return;
    }

    // Ensure the URL has the overlay parameter
    let url = new URL(checkoutUrl);
    url.searchParams.set('embed', '1');
    
    // Open the checkout in an overlay
    window.LemonSqueezy.Url.Open(url.toString());
  };

  return { openCheckout };
} 