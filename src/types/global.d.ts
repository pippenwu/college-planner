// Global type definitions

interface Window {
  LemonSqueezy?: {
    Url: {
      Open: (url: string) => void;
      Close: () => void;
    };
    Setup: (config: {
      eventHandler?: (data: LemonSqueezyEvent) => void;
    }) => void;
  };
}

// Lemon Squeezy event types
type LemonSqueezyEvent = {
  event: string;
  data?: any;
}; 