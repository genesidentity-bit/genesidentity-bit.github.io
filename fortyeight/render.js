/* costruisce l'intera pagina a partire da content.js */
(function () {
  var S = window.SITE, sections = S.sections;
  var LOGO = '<img src="assets/logo.svg" alt="FortyEight Brussels">';
  var ARROW = '<svg class="arrow" width="40" height="16" viewBox="0 0 40 16" fill="none" aria-hidden="true"><path d="M0 8H38M31 1L38 8L31 15" stroke="currentColor" stroke-width="1.5"/></svg>';

  function menu(activeId, chrome) {
    var ti = chrome ? ' tabindex="-1"' : "";
    return '<nav ' + (chrome ? 'aria-hidden="true" ' : "") + 'class="menu" aria-label="Main">' + sections.map(function (s) {
      return '<a' + ti + ' href="#' + s.id + '"' + (s.id === activeId ? ' class="active" aria-current="page"' : "") + ">" + s.label + "</a>";
    }).join("") + "</nav>";
  }
  function footer(chrome) {
    var ti = chrome ? ' tabindex="-1"' : "";
    return "<footer" + (chrome ? ' aria-hidden="true"' : "") + ' class="footer"><p class="copy">' + S.copyright + '</p><p class="legal">' +
      S.legal.map(function (l) { return "<a" + ti + ' href="' + l.href + '">' + l.label + "</a>"; }).join("") + "</p></footer>";
  }
  function logo() { return '<a class="logo" href="#home" aria-label="FortyEight Brussels, home">' + LOGO + "</a>"; }

  function panel(id, sectionId, aria, blueLabel, creamInner) {
    return '<section class="panel" id="' + id + '" data-section="' + sectionId + '" aria-label="' + aria + '">' +
      '<div class="layer blue">' + logo() + '<p class="tagline">' + S.tagline + "</p>" + menu(sectionId, false) + blueLabel + footer(false) + "</div>" +
      '<div class="layer cream"><p aria-hidden="true" class="tagline">' + S.tagline + "</p>" + menu(sectionId, true) +
      '<p aria-hidden="true" class="label">' + creamInner.label + "</p>" + footer(true) + creamInner.body + "</div></section>";
  }
  function pid(sec, n) { return n === 0 ? sec.id : sec.id + "-" + (n + 1); }

  function page(sec, p, n) {
    var b = '<div class="content reveal"><h2>' + sec.heading + "</h2>";
    if (p.lead) b += '<p class="lead"><span>' + p.lead[0] + "</span> <em>" + p.lead[1] + "</em></p>";
    (p.paragraphs || []).forEach(function (t) { b += "<p>" + t + "</p>"; });
    if (p.statement) b += '<p class="statement">' + p.statement + "</p>";
    (p.address || []).forEach(function (t) { b += '<p class="address">' + t + "</p>"; });
    if (p.mail) b += '<p class="address"><a class="mail" href="mailto:' + p.mail + '">' + p.mail + "</a></p>";
    if (p.more) b += '<a class="more" href="#' + p.more.to + '">' + p.more.label + " " + ARROW + "</a>";
    if (sec.pages.length > 1) {
      b += '<div class="dots">' + sec.pages.map(function (_, k) {
        return '<a class="dot' + (k === n ? " on" : "") + '" href="#' + pid(sec, k) + '" aria-label="' + sec.heading + " " + (k + 1) + " of " + sec.pages.length + '"></a>';
      }).join("") + "</div>";
    }
    b += "</div>";
    return panel(pid(sec, n), sec.id, sec.label,
      '<h1 class="label" data-tag="' + sec.tag + '">' + sec.label + "</h1>", { label: sec.label, body: b });
  }

  function team(sec) {
    var ppl = sec.team.people;
    var slides = ppl.map(function (p, k) {
      return '<div class="team-slide"' + (k ? ' inert aria-hidden="true"' : "") + '><div class="content team reveal"><h2>' + p.name + '</h2><p class="role">' + p.role + '</p><p class="bio">' + p.bio +
        '</p></div><div class="team-side reveal"><div class="portrait" role="img" aria-label="' + p.name + '">' + (p.photo ? '<img src="' + p.photo + '" alt="" loading="lazy">' : "<span>" + p.name.split(" ").map(function (w) { return w.charAt(0); }).slice(0, 2).join("") + "</span>") + "</div>" + '<p><a class="mail" href="mailto:' + p.email + '">' + p.email + "</a><br>" + p.phone + "</p></div></div>";
    }).join("");
    var dots = '<div class="dots team-dots reveal">' + ppl.map(function (p, k) {
      return '<a class="dot' + (k === 0 ? " on" : "") + '" href="#' + (k ? "team-" + (k + 1) : "team") + '" aria-label="' + p.name + '"></a>';
    }).join("") + "</div>";
    return panel("team", sec.id, "Our team", '<h1 class="label">team</h1>', { label: "team", body: '<div class="team-slides">' + slides + "</div>" + dots });
  }

  var out = '<section class="panel panel-home" id="home" data-section="home" aria-label="FortyEight Brussels"><div class="hero reveal"><a href="#menu" aria-label="Menu">' + LOGO + "</a><h1>" + S.home + "</h1></div></section>";
  out += '<section class="panel panel-menu" id="menu" data-section="menu" aria-label="Menu">' + logo() + '<p class="tagline tagline-right">' + S.tagline + '</p><nav class="bignav reveal" aria-label="Main">' +
    sections.map(function (s) { return '<a href="#' + s.id + '">' + s.label + '<span class="tag" aria-hidden="true"><span>' + s.tag + "</span></span></a>"; }).join("") + "</nav>" + footer(false) + "</section>";
  sections.forEach(function (sec) {
    sec.pages.forEach(function (p, n) { out += page(sec, p, n); });
    if (sec.team) out += team(sec);
  });
  document.getElementById("track").innerHTML = out;
  document.getElementById("drawer").innerHTML = sections.map(function (s) {
    return '<a href="#' + s.id + '">' + s.label + '<span class="tag" aria-hidden="true"><span>' + s.tag + "</span></span></a>";
  }).join("");
})();
