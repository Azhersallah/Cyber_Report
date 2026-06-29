/**
 * Electron Polyfills for Web APIs
 * 
 * Provides polyfills for web APIs that may not be available in Electron's renderer process
 */

// Check if we're in Electron
const isElectron = typeof window !== 'undefined' && (window as any).process?.type === 'renderer';

/**
 * Ensure fetch and Headers APIs are available
 * These are needed for @google/generative-ai library
 */
export function ensureFetchAPIs(): boolean {
  if (typeof globalThis === 'undefined') {
    return false;
  }

  // In Electron, fetch and Headers should be available from Chromium
  // But they might not be exposed to globalThis properly
  
  // Check if fetch is available
  const hasFetch = typeof globalThis.fetch !== 'undefined' || typeof (window as any).fetch !== 'undefined';
  
  // Check if Headers is available
  const hasHeaders = typeof globalThis.Headers !== 'undefined' || typeof (window as any).Headers !== 'undefined';

  if (!hasFetch) {
    console.error('Fetch API not available');
    return false;
  }

  if (!hasHeaders) {
    console.error('Headers API not available');
    
    // Try to get Headers from window if not in globalThis
    if (typeof (window as any).Headers !== 'undefined') {
      (globalThis as any).Headers = (window as any).Headers;
      console.log('Headers found in window and added to globalThis');
      return true;
    }
    
    // Create a minimal Headers polyfill for Electron
    if (isElectron) {
      console.log('Creating minimal Headers polyfill for Electron');
      
      class HeadersPolyfill {
        private headers: Map<string, string>;
        
        constructor(init?: Record<string, string> | [string, string][]) {
          this.headers = new Map();
          if (init) {
            if (Array.isArray(init)) {
              init.forEach(([key, value]) => this.headers.set(key.toLowerCase(), value));
            } else {
              Object.entries(init).forEach(([key, value]) => this.headers.set(key.toLowerCase(), value));
            }
          }
        }
        
        append(name: string, value: string) {
          const existing = this.headers.get(name.toLowerCase());
          this.headers.set(name.toLowerCase(), existing ? `${existing}, ${value}` : value);
        }
        
        delete(name: string) {
          this.headers.delete(name.toLowerCase());
        }
        
        get(name: string): string | null {
          return this.headers.get(name.toLowerCase()) || null;
        }
        
        has(name: string): boolean {
          return this.headers.has(name.toLowerCase());
        }
        
        set(name: string, value: string) {
          this.headers.set(name.toLowerCase(), value);
        }
        
        forEach(callback: (value: string, key: string, parent: any) => void) {
          this.headers.forEach((value, key) => callback(value, key, this));
        }
        
        entries() {
          return this.headers.entries();
        }
        
        keys() {
          return this.headers.keys();
        }
        
        values() {
          return this.headers.values();
        }
        
        [Symbol.iterator]() {
          return this.headers.entries();
        }
      }
      
      (globalThis as any).Headers = HeadersPolyfill;
      return true;
    }
    
    return false;
  }

  // Ensure fetch is also in globalThis
  if (typeof globalThis.fetch === 'undefined' && typeof (window as any).fetch !== 'undefined') {
    (globalThis as any).fetch = (window as any).fetch.bind(window);
  }

  return true;
}

/**
 * Initialize polyfills on module load
 */
export function initializePolyfills(): boolean {
  const success = ensureFetchAPIs();
  
  if (!success) {
    console.warn('Some Web APIs are not available. Gemini AI features may not work.');
  }
  
  return success;
}

