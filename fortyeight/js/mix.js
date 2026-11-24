/* rimescola le texture originali a ogni apertura: stessi file, abbinamento e verso diversi */
(function () {
  if (window.matchMedia("(max-width: 767px)").matches) return;   /* il mobile resta com'è */
  var keys = ["menu", "who", "team", "how", "how-2", "how-3", "for", "where"];
  var files = ["assets/thin-pattern.png?v=2"].concat(keys.map(function (k) { return "assets/thin-pattern-" + k + ".png"; }));
  for (var i = files.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1)), t = files[i]; files[i] = files[j]; files[j] = t;
  }
  var u = function (n) { return 'url("' + files[n] + '")'; };
  var flip = function () { return Math.random() < 0.5 ? -1 : 1; };
  var css = ".panel::before,.band{background-image:" + u(0) + "}.portrait{background-image:" + u(3) + "}";
  keys.forEach(function (k, n) {
    css += "#" + k + "::before{background-image:" + u(n + 1) + "}#" + k + "{--fy:" + flip() + "}";
  });
  css += ".panel{--fy:" + flip() + "}";
  var s = document.createElement("style");
  s.textContent = css;
  document.head.appendChild(s);
  document.querySelectorAll(".tex").forEach(function (el) {
    var n = keys.indexOf(el.getAttribute("data-tex"));
    el.style.backgroundImage = u(n < 0 ? 0 : n + 1);
    el.style.setProperty("--fy", flip());
  });
})();
