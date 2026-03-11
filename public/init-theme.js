(function () {
  var themeMode = localStorage.getItem('theme-mode');
  var isDark = themeMode ? themeMode === 'dark' : true;
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  try {
    if (window.fetch) {
      var originalFetch = window.fetch;
      Object.defineProperty(window, 'fetch', {
        value: originalFetch,
        writable: true,
        configurable: true
      });
    }
  } catch (e) {
    console.warn('Could not patch window.fetch:', e);
  }
})();
