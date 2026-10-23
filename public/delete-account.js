// Loaded by delete-account.html. A file of its own, not an inline script, so the page's
// Content-Security-Policy can forbid inline scripts entirely (script-src 'self').
// Wrapped in its own scope: a top-level `var status` is window.status, a legacy string
// property, and the messages never appeared.
(function () {
  'use strict';
  // One place to fill. The page still explains the in-app route if this is left empty.
  var CONTACT_EMAIL = '';

  var link = document.getElementById('mail');
  var shown = document.getElementById('address');
  if (CONTACT_EMAIL) {
    link.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent('Ștergere cont');
    shown.textContent = 'Adresa: ' + CONTACT_EMAIL;
  } else {
    link.style.display = 'none';
    shown.textContent = 'Adresa de contact nu a fost încă completată.';
  }
})();
