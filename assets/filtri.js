// Filtro dei lavori per settore, con memoria nell'indirizzo (#istituzioni, #food…)
(function () {
  var bottoni = document.querySelectorAll('.filtro');
  var schede = document.querySelectorAll('.scheda');
  function applica(f) {
    bottoni.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.f === f); });
    schede.forEach(function (s) {
      s.hidden = !(f === 'tutti' || (' ' + s.dataset.cat + ' ').indexOf(' ' + f + ' ') > -1);
    });
  }
  bottoni.forEach(function (b) {
    b.addEventListener('click', function () {
      applica(b.dataset.f);
      history.replaceState(null, '', b.dataset.f === 'tutti' ? location.pathname : '#' + b.dataset.f);
    });
  });
  var h = location.hash.slice(1);
  if (h && document.querySelector('.filtro[data-f="' + h + '"]')) applica(h);
})();
