// app.js
// Orchestrates the UI: reads the date, computes object visibility locally,
// fetches weather, computes the stargazing score, and renders everything.

(function (global) {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const state = {
    dateStr: null,     // "YYYY-MM-DD"
    vis: null,          // visibility result
    weather: null,     // weather result
    score: null,       // scoring result
    activeType: "Alle"
  };

  // ---- formatting helpers ------------------------------------------------
  function fmtTime(date) {
    if (!date) return "—";
    const h = date.getHours(), m = date.getMinutes();
    return (h < 10 ? "0" + h : h) + ":" + (m < 10 ? "0" + m : m);
  }
  function fmtNightLength(ms) {
    const totalMin = Math.round(ms / 60000);
    const h = Math.floor(totalMin / 60), m = totalMin % 60;
    return h + "h " + (m < 10 ? "0" + m : m) + "m";
  }
  function fmtDurationH(h) {
    if (h <= 0) return "< 1 h";
    return (Math.round(h * 10) / 10) + " h";
  }
  function todayStr() {
    const d = new Date();
    const p = (n) => (n < 10 ? "0" + n : n);
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  // ---- moon glyph (offset-circle approximation) -------------------------
  function moonGlyph(moon, size) {
    const R = size / 2;
    const k = moon.illumination;                 // 0..1 lit fraction
    const waxing = moon.phaseLon < 180;          // lit on right when waxing
    const dir = waxing ? -1 : +1;
    const dx = (1 - k) * 2 * R * dir;
    const litBg = "radial-gradient(circle at 38% 35%, #fffdf0, #f2eed0 55%, #c9c4a4)";
    const darkBg = "#060914";
    const s = size + "px";
    return (
      '<div class="moon-glyph" style="width:' + s + ";height:" + s + ";" +
      "position:relative;border-radius:50%;overflow:hidden;background:" + darkBg + ";" +
      "border:1px solid rgba(255,255,220,0.35);box-shadow:0 0 12px rgba(255,255,220,0.25);\">" +
        '<div style="position:absolute;inset:0;border-radius:50%;background:' + litBg + ';"></div>' +
        '<div style="position:absolute;width:' + s + ";height:" + s + ";top:0;left:0;" +
        "border-radius:50%;background:" + darkBg + ";transform:translateX(" + dx.toFixed(1) + "px);\"></div>" +
      "</div>"
    );
  }

  // ---- rendering: summary ------------------------------------------------
  function renderSummary() {
    const panel = $("summaryPanel");
    const vis = state.vis;
    if (!vis) { panel.innerHTML = ""; return; }

    const night = vis.night;
    const len = night.sunrise.getTime() - night.sunset.getTime();
    const moon = vis.moon;
    const moonPct = Math.round(moon.illumination * 100);

    const stats = [
      { label: "Astronomische nacht", value: fmtTime(night.sunset) + " – " + fmtTime(night.sunrise), sub: "Lengte " + fmtNightLength(len) },
      { label: "Maanfase", value: moon.phaseName + " (" + moonPct + "% verlicht)", sub: moon.upFraction > 0.5 ? "Maan het grootste deel van de nacht boven" : "Maan meestal onder de horizon", custom: moonGlyph(moon, 40) },
      { label: "Zichtbare objecten", value: vis.objects.length, sub: "boven " + 10 + "° deze nacht" }
    ];

    let html = '<h2><span class="ic">&#9790;</span> Nacht van ' + state.dateStr + " — Alphen (GE)</h2>";
    html += '<div class="summary-grid">';
    stats.forEach(function (s) {
      html += '<div class="stat"><div class="label">' + s.label + "</div>";
      if (s.custom) html += '<div class="moon-row" style="margin-top:.35rem"><div>' + s.custom + "</div><div><div class=\"value\" style=\"font-size:.95rem\">" + s.value + "</div><div class=\"sub\">" + s.sub + "</div></div></div>";
      else html += '<div class="value">' + s.value + '</div><div class="sub">' + s.sub + "</div>";
      html += "</div>";
    });
    html += "</div>";
    panel.innerHTML = html;
  }

  // ---- rendering: weather + score ----------------------------------------
  function renderWeather() {
    const panel = $("weatherPanel");
    if (state.weather && state.weather.error && !state.weather.avg) {
      panel.innerHTML = '<h2><span class="ic">&#9728;</span> Sterrenkijkscore</h2>' +
        '<div class="error">' + state.weather.error + "</div>";
      return;
    }
    if (!state.score) { panel.innerHTML = '<h2><span class="ic">&#9728;</span> Sterrenkijkscore</h2><div class="loader">Beoordelen...</div>'; return; }

    const sc = state.score;
    let html = '<h2><span class="ic">&#9728;</span> Sterrenkijkscore</h2>';
    html += '<div class="score-block">';
    html += '<div class="score-ring" style="color:' + sc.color + ";border-color:" + sc.color + "\">" + sc.score + "</div>";
    const sourceLabel = state.weather && state.weather.source === "archive" ? "archief" : (state.weather && state.weather.source === "forecast" ? "verwachting" : "");
    html += '<div><div class="title">' + sc.label + " nacht</div><div class=\"verdict\">uit 10" + (sourceLabel ? " — via " + sourceLabel : "") + "</div></div>";
    html += "</div>";
    html += '<div class="score-explain">' + sc.explanation + "</div>";
    html += '<div class="breakdown">';
    sc.factors.forEach(function (f) {
      const w = Math.max(0, Math.min(100, (f.sub / 10) * 100));
      const col = f.sub >= 6.5 ? "var(--good)" : (f.sub >= 3.5 ? "var(--warn)" : "var(--bad)");
      html += '<div class="bar-row">';
      html += '<div class="name">' + f.name + "</div>";
      html += '<div class="bar"><span style="width:' + w.toFixed(0) + "%;background:" + col + '"></span></div>';
      html += '<div class="pts">' + f.pts.toFixed(1) + "</div>";
      html += "</div>";
    });
    html += "</div>";
    if (state.weather && state.weather.error) {
      html += '<div class="hint">' + state.weather.error + "</div>";
    }
    panel.innerHTML = html;
  }

  // ---- rendering: objects -------------------------------------------------
  function filteredObjects() {
    if (state.activeType === "Alle") return state.vis.objects;
    return state.vis.objects.filter(function (o) { return o.type === state.activeType; });
  }

  function renderObjects() {
    const panel = $("objectsPanel");
    if (!state.vis) { panel.innerHTML = ""; return; }

    // chips
    const counts = {};
    state.vis.objects.forEach(function (o) { counts[o.type] = (counts[o.type] || 0) + 1; });
    const types = ["Alle"].concat(Catalog.TYPES.filter(function (t) { return t !== "Alle" && counts[t]; }));

    let html = '<h2><span class="ic">&#10026;</span> Zichtbare objecten</h2>';
    html += '<div class="toolbar"><div class="count" id="objCount"></div><div class="chips" id="chips"></div></div>';
    panel.innerHTML = html;

    const chipsEl = $("chips");
    types.forEach(function (t) {
      const c = t === "Alle" ? state.vis.objects.length : counts[t];
      const active = t === state.activeType ? " active" : "";
      const chip = document.createElement("span");
      chip.className = "chip" + active;
      chip.textContent = t + " (" + c + ")";
      chip.onclick = function () { state.activeType = t; renderObjects(); };
      chipsEl.appendChild(chip);
    });

    const list = filteredObjects();
    $("objCount").textContent = list.length + " object" + (list.length === 1 ? "" : "en") + " zichtbaar deze nacht";

    if (!list.length) {
      panel.innerHTML += '<div class="empty">Geen objecten van dit type hoog genoeg om waar te nemen vannacht. Probeer een ander type of een andere datum.</div>';
      return;
    }

    let listHtml = '<div class="obj-list">';
    list.forEach(function (o) {
      const gearTag = o.gear;
      listHtml += '<div class="obj-card">';
      listHtml += '<div class="obj-head"><div class="obj-name">' + escapeHtml(o.name) + '<span class="cat">' + escapeHtml(o.designation) + "</span></div>";
      listHtml += '<div class="obj-mag">mag ' + (o.mag > 0 ? "+" : "") + o.mag.toFixed(1) + "</div></div>";

      listHtml += '<div class="obj-tags">';
      listHtml += '<span class="tag">' + escapeHtml(o.type) + "</span>";
      if (o.constellation) listHtml += '<span class="tag">' + escapeHtml(o.constellation) + "</span>";
      listHtml += '<span class="tag eq">' + escapeHtml(gearTag) + "</span>";
      if (o.twilight) listHtml += '<span class="tag eq">schemering</span>';
      listHtml += "</div>";

      listHtml += '<div class="obj-meta">';
      listHtml += "<div><b>Beste tijd</b><br>" + fmtTime(o.bestTime) + "</div>";
      listHtml += "<div><b>Richting</b><br>" + o.direction + "</div>";
      listHtml += "<div><b>Hoogte</b><br>" + Math.round(o.bestAlt) + "° (" + o.altLabel + ")</div>";
      listHtml += "<div><b>Zichtbaar</b><br>" + fmtDurationH(o.visibleHours) + "</div>";
      listHtml += "</div>";

      listHtml += '<div class="obj-instr"><span class="h">Zo vind je het</span>' + escapeHtml(o.howToFind);
      if (o.link) listHtml += ' <a class="obj-link" href="' + o.link + '" target="_blank" rel="noopener">Meer info &rarr;</a>';
      listHtml += "</div>";
      listHtml += "</div>";
    });
    listHtml += "</div>";
    panel.insertAdjacentHTML("beforeend", listHtml);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---- main update flow --------------------------------------------------
  function setLoading() {
    $("summaryPanel").innerHTML = '<div class="loader">Nacht berekenen...</div>';
    $("weatherPanel").innerHTML = '<div class="loader">Weer laden...</div>';
    $("objectsPanel").innerHTML = '<div class="loader">Zichtbare objecten berekenen...</div>';
  }

  async function update() {
    if (!global.Astronomy) {
      $("summaryPanel").innerHTML = '<div class="error">De astronomie-bibliotheek kon niet laden. Controleer je internetverbinding en herlaad de pagina.</div>';
      return;
    }
    setLoading();

    // 1) Zichtbaarheid berekenen (synchroon, snel).
    let vis;
    try {
      const date = new Date(state.dateStr + "T12:00:00");
      vis = Visibility.computeAll(date);
    } catch (err) {
      $("summaryPanel").innerHTML = '<div class="error">Posities konden niet berekend worden: ' + escapeHtml(err.message || err) + "</div>";
      return;
    }
    state.vis = vis;
    renderSummary();
    renderObjects();

    // 2) Weer ophalen + score (asynchroon).
    state.weather = null; state.score = null; renderWeather();
    try {
      const weather = await Weather.fetch(state.dateStr, vis.night);
      state.weather = weather;
      if (weather && weather.avg) {
        state.score = Scoring.compute(weather.avg, vis.moon);
      } else {
        state.score = null;
      }
      renderWeather();
    } catch (err) {
      state.weather = { error: "Weer niet beschikbaar: " + (err.message || err), avg: null };
      state.score = null;
      renderWeather();
    }
  }

  // ---- init --------------------------------------------------------------
  function init() {
    const picker = $("datePicker");
    picker.value = todayStr();
    state.dateStr = picker.value;
    picker.max = "2099-12-31";
    picker.addEventListener("change", function () {
      if (picker.value) { state.dateStr = picker.value; state.activeType = "Alle"; update(); }
    });
    $("todayBtn").addEventListener("click", function () {
      picker.value = todayStr(); state.dateStr = picker.value; state.activeType = "Alle"; update();
    });
    update();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(window);
