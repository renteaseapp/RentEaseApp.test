// Error handling utility for browser extension conflicts and connection issues

export const handleBrowserExtensionError = (error: any) => {
  // Check if error is from browser extension
  if (error.message && error.message.includes('Receiving end does not exist')) {
    console.warn('Browser extension error detected, ignoring:', error.message);
    return true; // Error handled
  }
  
  // Check for other common extension-related errors
  if (error.message && (
    error.message.includes('content-script') ||
    error.message.includes('extension') ||
    error.message.includes('chrome.runtime')
  )) {
    console.warn('Browser extension interference detected:', error.message);
    return true; // Error handled
  }
  
  return false; // Not a browser extension error
};

export const safeSocketOperation = async (operation: () => Promise<any> | any) => {
  try {
    return await operation();
  } catch (error) {
    if (handleBrowserExtensionError(error)) {
      // Return a safe default value for extension errors
      return null;
    }
    // Re-throw other errors
    throw error;
  }
};

export const createSafeEventListener = (callback: (...args: any[]) => void) => {
  return (...args: any[]) => {
    try {
      callback(...args);
    } catch (error) {
      if (handleBrowserExtensionError(error)) {
        return; // Silently ignore extension errors
      }
      console.error('Error in event listener:', error);
    }
  };
};

// Global error handler for unhandled promise rejections
export const setupGlobalErrorHandling = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      if (handleBrowserExtensionError(event.reason)) {
        event.preventDefault(); // Prevent the error from being logged
        return;
      }
      console.error('Unhandled promise rejection:', event.reason);
    });

    window.addEventListener('error', (event) => {
      if (handleBrowserExtensionError(event.error)) {
        event.preventDefault(); // Prevent the error from being logged
        return;
      }
      console.error('Global error:', event.error);
    });
  }
}; 