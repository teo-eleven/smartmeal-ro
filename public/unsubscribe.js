// Loaded by unsubscribe.html. A file of its own, not an inline script, so the page's
// Content-Security-Policy can forbid inline scripts entirely (script-src 'self').
// Wrapped in its own scope: a top-level `var status` is window.status, a legacy string
// property, and the messages never appeared.
(function () {
  'use strict';
  // e.g. https://<ref>.supabase.co/functions/v1/unsubscribe-reminders
  var ENDPOINT = '';

  var button = document.getElementById('confirm');
  var status = document.getElementById('status');
  var params = new URLSearchParams(window.location.search);
  var userId = params.get('u');
  var token = params.get('t');

  function show(message, isError) {
    // textContent, never innerHTML: nothing from the URL is ever parsed as markup.
    status.textContent = message;
    status.className = isError ? 'error' : '';
  }

  if (!ENDPOINT) {
    button.disabled = true;
    show(
      'Pagina nu e configurată încă. Oprește emailurile din aplicație, de la ecranul de cont.',
      true
    );
  } else if (!userId || !token) {
    button.disabled = true;
    show(
      'Linkul e incomplet. Deschide-l din nou din email, sau oprește emailurile din aplicație.',
      true
    );
  }

  button.addEventListener('click', function () {
    button.disabled = true;
    show('Se oprește…', false);

    var url = ENDPOINT + '?u=' + encodeURIComponent(userId) + '&t=' + encodeURIComponent(token);
    fetch(url, { method: 'POST' })
      .then(function (res) {
        if (res.ok) {
          show('Gata. Nu mai primești mementouri pe email.', false);
          return;
        }
        // A bad link stays bad; any other failure is worth another press.
        button.disabled = res.status === 400;
        show(
          res.status === 400
            ? 'Linkul nu e valid. Oprește emailurile din aplicație, de la ecranul de cont.'
            : 'N-a mers de data asta. Încearcă din nou peste un minut.',
          true
        );
      })
      .catch(function () {
        button.disabled = false;
        show('Nu am putut ajunge la server. Verifică conexiunea și încearcă din nou.', true);
      });
  });
})();
