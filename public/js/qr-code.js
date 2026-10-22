// Home page check-in: a member QR code opens this page with ?token=<qr_token>.
(function () {
  const statusEl = document.getElementById('checkin-status');
  const resultEl = document.getElementById('member-result');

  // Only run on the page that can show a result.
  if (!statusEl || !resultEl) return;

  const token = new URLSearchParams(window.location.search).get('token');

  // A normal visit has no token, so leave the home page as it is.
  if (!token) return;

  function show(kind, statusText, message) {
    statusEl.textContent = statusText;
    resultEl.textContent = message;
    resultEl.className = kind;
  }

  show('', 'Checking in...', '');

  api.post('qr_checkin_api.php', { qr_token: token })
    .then((res) => {
      const name = res.member_name || 'Member';
      show('success', 'Check-in complete', `${name}: ${res.message || 'Check-in recorded.'}`);
    })
    .catch((err) => {
      show('error', 'Check-in unsuccessful', err.message || 'Please try again.');
    });
})();
