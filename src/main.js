import './style.css'
import { Dashboard } from './components/Dashboard.js'
import { ToastNotification } from './components/ToastNotification.js'

// Global error handler for unhandled exceptions
window.addEventListener('error', (event) => {
  console.error('Unhandled error:', event.error);
  
  // Show user-friendly error notification
  showGlobalErrorNotification('An unexpected error occurred. Please refresh the page.');
});

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Show user-friendly error notification
  showGlobalErrorNotification('A network or data error occurred. Please check your connection and try again.');
  
  // Prevent the default browser behavior (logging to console)
  event.preventDefault();
});

/**
 * Show a global error notification to the user
 * @param {string} message - Error message to display
 */
function showGlobalErrorNotification(message) {
  // Create or update global error notification
  let notification = document.getElementById('global-error-notification');
  
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'global-error-notification';
    notification.className = 'fixed top-4 right-4 z-50 max-w-sm bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg shadow-lg';
    document.body.appendChild(notification);
  }
  
  notification.innerHTML = `
    <div class="flex items-start">
      <div class="flex-shrink-0">
        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
      </div>
      <div class="ml-3 flex-1">
        <p class="text-sm font-medium">${message}</p>
      </div>
      <div class="ml-4 flex-shrink-0">
        <button class="text-red-400 hover:text-red-300 close-notification-btn">
          <span class="sr-only">Close</span>
          <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  `;
  
  // Add event listener for close button
  const closeBtn = notification.querySelector('.close-notification-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      notification.remove();
    });
  }
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification && notification.parentNode) {
      notification.remove();
    }
  }, 10000);
}

// Main application entry point
async function initializeApp() {
  const app = document.querySelector('#app')
  
  try {
    console.log('Starting dashboard initialization...');
    
    // Initialize global toast notification system
    if (!window.toastNotification) {
      window.toastNotification = new ToastNotification();
    }
    
    // Initialize Dashboard component with default 30-day time range
    const dashboard = new Dashboard(app);
    
    // Ensure default time range is set to 30 days (as per requirements)
    dashboard.currentTimeRange = 30;
    
    // Initialize dashboard and trigger initial data load
    await dashboard.initialize();
    
    console.log('Dashboard initialized successfully with 30-day default time range');
    
    // Show success notification
    window.toastNotification.showSuccess('Dashboard loaded successfully!');
    
  } catch (error) {
    console.error('Failed to initialize dashboard:', error);
    
    // Show detailed error message to user
    app.innerHTML = `
      <div class="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center">
        <div class="text-center max-w-2xl mx-auto px-4">
          <div class="mb-6">
            <svg class="h-16 w-16 text-red-400 mx-auto mb-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-red-400 mb-4">Dashboard Failed to Load</h1>
          <p class="text-slate-300 mb-6 text-lg">${error.message}</p>
          <details class="text-left bg-slate-800 p-4 rounded-lg mb-6">
            <summary class="cursor-pointer text-slate-400 mb-2">Technical Details</summary>
            <pre class="text-xs text-slate-400 overflow-auto">${error.stack}</pre>
          </details>
          <div class="space-y-3">
            <button id="retry-btn" class="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors">
              Retry
            </button>
            <p class="text-sm text-slate-400">
              If the problem persists, check the browser console for more details.
            </p>
          </div>
        </div>
      </div>
    `;
    
    // Add event listener for retry button
    const retryBtn = app.querySelector('#retry-btn');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        location.reload();
      });
    }
  }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
