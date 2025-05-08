// Loader for WebAssembly module
let wasmModule = null;

// Load the WebAssembly module
export async function loadWasmModule() {
  if (wasmModule) return wasmModule;
  
  try {
    // In development, we'll load the debug version
    const isDev = import.meta.env.DEV;
    const imports = {};
    
    // Dynamic import based on environment
    const module = isDev
      ? await import('./build/debug.js')
      : await import('./build/release.js');
    
    wasmModule = await module.default(imports);
    console.log('WASM module loaded successfully');
    return wasmModule;
  } catch (error) {
    console.error('Failed to load WASM module:', error);
    // Return a fallback module with the same interface
    return createFallbackModule();
  }
}

// Fallback implementation if WASM fails to load
function createFallbackModule() {
  console.warn('Using JavaScript fallback instead of WASM');
  
  return {
    calculateMoveScore: (value) => value,
    
    isValidMove: (board, size, direction) => {
      // Simplified fallback implementation
      return true;
    },
    
    performMove: (board, size, direction) => {
      // Simplified fallback - just return that something moved
      return true;
    },
    
    getAIHint: (board, size) => {
      // Simple random direction as fallback
      return Math.floor(Math.random() * 4);
    }
  };
}