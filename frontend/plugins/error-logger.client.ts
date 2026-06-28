export default defineNuxtPlugin((nuxtApp) => {
  const reportError = (error: any) => {
    const message = error?.message || String(error);
    const stack = error?.stack || null;
    const url = typeof window !== 'undefined' ? window.location.href : '';

    fetch('/api/log-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        stack,
        url
      })
    }).catch(() => {});
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      reportError(event.error || { message: event.message });
    });

    window.addEventListener('unhandledrejection', (event) => {
      reportError(event.reason || { message: 'Unhandled Promise Rejection' });
    });

    // Capture Vue render errors
    nuxtApp.vueApp.config.errorHandler = (err: any, instance, info) => {
      reportError({
        message: `${err?.message || String(err)} (Vue Info: ${info})`,
        stack: err?.stack
      });
      // Fallback log to browser console
      console.error(err);
    };
  }
});
