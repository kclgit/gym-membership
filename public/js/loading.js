// Global loading overlay with a spinner
function setLoading(isLoading) {
  let overlay = document.getElementById('loading-overlay');

  if (isLoading && !overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(overlay);
  }

  if (overlay) overlay.classList.toggle('active', isLoading);
}
