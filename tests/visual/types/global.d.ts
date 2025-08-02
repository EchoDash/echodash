/**
 * Global type declarations for visual tests
 */

declare global {
  interface Window {
    ecdEventData?: {
      triggers?: Record<string, any>;
      endpoint?: string;
    };
  }
}

export {};