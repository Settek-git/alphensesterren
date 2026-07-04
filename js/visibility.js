// visibility.js
// Computes, for a given night at the observer's location:
//  - sunset / sunrise window (using astronomy-engine)
//  - moon phase, illuminated fraction, and how much the Moon interferes that night
//  - for every catalog object + planet: best viewing time, altitude/azimuth, visibility
// All positions are topocentric, computed by astronomy-engine (no API key).

(function (global) {
  "use strict";

  // Alphen, Gelderland (NL). astronomy-engine requires an Observer instance.
  const OBSERVER = new Astronomy.Observer(51.846, 5.491, 0);
  const MIN_ALT = 10;          // degrees above horizon to count as "observable"
  const SAMPLE_MIN = 15;       // sampling resolution in minutes
  const SEARCH_LIMIT_DAYS = 2;

  // ---- small helpers -----------------------------------------------------
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function localNoon(date) {
    // noon local time of the given calendar date => a safe starting point to find that evening's sunset
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  }

  function cardinalFromAz(az) {
    // az: graden met de klok mee vanaf het noorden (0=N,90=O,180=Z,270=W)
    // Nederlandse kompasafkortingen: N=Noord, O=Oost, Z=Zuid, W=West
    const dirs = ["N", "NNO", "NO", "ONO", "O", "OZO", "ZO", "ZZO",
                  "Z", "ZZW", "ZW", "WZW", "W", "WNW", "NW", "NNW"];
    const i = Math.round(az / 22.5) % 16;
    return dirs[(i + 16) % 16];
  }

  function altDescription(alt) {
    if (alt < 5) return "zeer laag aan de horizon";
    if (alt < 20) return "laag aan de hemel";
    if (alt < 45) return "matig hoog";
    if (alt < 70) return "hoog aan de hemel";
    return "vrijwel overhead";
  }

  function equipmentFor(mag) {
    if (mag < 2) return "Blote oog";
    if (mag < 3.5) return "Blote oog / verrekijker";
    if (mag < 5) return "Verrekijker";
    if (mag < 6.5) return "Verrekijker / kleine telescoop";
    if (mag < 8) return "Kleine telescoop";
    if (mag < 9.5) return "Middelgrote telescoop";
    return "Grote telescoop";
  }

  function moonPhaseName(phaseLonDeg) {
    // phaseLonDeg: 0=nieuw, 90=eerste kwartier, 180=vol, 270=laatste kwartier
    const a = ((phaseLonDeg % 360) + 360) % 360;
    if (a < 22.5 || a >= 337.5) return "Nieuwe maan";
    if (a < 67.5) return "Jonge maansikkel";
    if (a < 112.5) return "Eerste kwartier";
    if (a < 157.5) return "Wassende maan";
    if (a < 202.5) return "Volle maan";
    if (a < 247.5) return "Afnemende maan";
    if (a < 292.5) return "Laatste kwartier";
    return "Oude maansikkel";
  }

  // ---- sun window ---------------------------------------------------------
  function sunTimes(date) {
    const noon = localNoon(date);
    let sunset = null, sunrise = null;
    try {
      const s = Astronomy.SearchRiseSet(Astronomy.Body.Sun, OBSERVER, -1, noon, SEARCH_LIMIT_DAYS);
      if (s) sunset = s.date;
    } catch (e) { /* ignore */ }
    const startForRise = sunset || new Date(noon.getTime() + 6 * 3600e3);
    try {
      const r = Astronomy.SearchRiseSet(Astronomy.Body.Sun, OBSERVER, +1, startForRise, SEARCH_LIMIT_DAYS);
      if (r) sunrise = r.date;
    } catch (e) { /* ignore */ }

    // robust fallback if the engine returns nothing (should not happen at 51.8 N)
    if (!sunset) sunset = new Date(new Date(date).setHours(21, 0, 0, 0));
    if (!sunrise) sunrise = new Date(new Date(date).setHours(6, 0, 0, 0) + 24 * 3600e3);
    return { noon: noon, sunset: sunset, sunrise: sunrise };
  }

  // ---- object position at an instant -------------------------------------
  function horizonFor(entry, when) {
    let ra, dec;
    if (entry.body) {
      const eq = Astronomy.Equator(entry._bodyEnum, when, OBSERVER, true, true);
      ra = eq.ra; dec = eq.dec;
    } else {
      ra = entry.ra; dec = entry.dec;
    }
    const h = Astronomy.Horizon(when, OBSERVER, ra, dec, "normal");
    return { alt: h.altitude, az: h.azimuth, ra: ra, dec: dec };
  }

  // Build the list of all trackable bodies for a night.
  function buildBodyList() {
    const bodies = [];
    Catalog.OBJECTS.forEach(function (o) {
      bodies.push({
        source: o, body: null, ra: o.ra, dec: o.dec,
        mag: o.mag, name: o.name, designation: o.designation, type: o.type
      });
    });
    Catalog.PLANETS.forEach(function (p) {
      bodies.push({
        source: p, body: p.body,
        _bodyEnum: Astronomy.Body[p.body],
        mag: p.baseMag, name: p.name, designation: p.name, type: "Planeet",
        gear: p.gear, twilight: p.twilight
      });
    });
    return bodies;
  }

  // ---- main computation for a night -------------------------------------
  function computeAll(date) {
    const night = sunTimes(date);
    const start = night.sunset.getTime();
    const end = night.sunrise.getTime();

    // Moon info (illumination roughly constant across one night; sample at mid-night).
    const midNight = new Date((start + end) / 2);
    let moonIllum = 0, moonPhaseLon = 0, moonName = "Nieuwe maan", moonAltMid = -90;
    try {
      const illum = Astronomy.Illumination(Astronomy.Body.Moon, midNight);
      moonIllum = illum.phase_fraction; // 0..1 (1 = full)
    } catch (e) { /* ignore */ }
    try {
      moonPhaseLon = Astronomy.MoonPhase(midNight); // degrees [0,360)
      moonName = moonPhaseName(moonPhaseLon);
    } catch (e) { /* ignore */ }
    try {
      const mh = horizonFor({ body: "Moon", _bodyEnum: Astronomy.Body.Moon }, midNight);
      moonAltMid = mh.alt;
    } catch (e) { /* ignore */ }

    // Sample through the night.
    const stepMs = SAMPLE_MIN * 60 * 1000;
    const bodies = buildBodyList();
    // Track moon interference = mean over night of (moon above horizon ? illum : 0)
    let moonUpSamples = 0, totalSamples = 0, moonInterference = 0;

    for (let t = start; t <= end; t += stepMs) {
      totalSamples++;
      const when = new Date(t);

      // moon altitude for interference scoring
      try {
        const mh = horizonFor({ body: "Moon", _bodyEnum: Astronomy.Body.Moon }, when);
        if (mh.alt > 0) {
          moonUpSamples++;
          moonInterference += moonIllum;
        }
      } catch (e) { /* ignore */ }

      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (b._skip) continue;
        if (b._best === undefined) {
          b._best = -90; b._bestTime = null; b._bestAz = 0; b._aboveSeconds = 0;
          b._firstUp = null; b._lastUp = null;
        }
        let h;
        try { h = horizonFor(b, when); }
        catch (e) { b._skip = true; continue; }
        if (h.alt > MIN_ALT) {
          b._aboveSeconds += stepMs / 1000;
          if (b._firstUp === null) b._firstUp = when;
          b._lastUp = when;
        }
        if (h.alt > b._best) {
          b._best = h.alt; b._bestTime = when; b._bestAz = h.az;
        }
      }
    }

    moonInterference = totalSamples > 0 ? moonInterference / totalSamples : 0;
    const moonUpFraction = totalSamples > 0 ? moonUpSamples / totalSamples : 0;

    // Assemble visible object list.
    const visible = [];
    for (let i = 0; i < bodies.length; i++) {
      const b = bodies[i];
      if (b._skip) continue;
      if (b._best <= MIN_ALT) continue; // never gets high enough
      const src = b.source;
      const gear = b.gear || equipmentFor(b.mag);
      const durationH = (b._aboveSeconds || 0) / 3600;
      visible.push({
        id: src.id || b.name,
        name: b.name,
        designation: b.designation,
        type: b.type,
        constellation: src.constellation || null,
        mag: b.mag,
        bestTime: b._bestTime,
        bestAlt: b._best,
        bestAz: b._bestAz,
        direction: cardinalFromAz(b._bestAz),
        altLabel: altDescription(b._best),
        visibleHours: durationH,
        firstUp: b._firstUp,
        lastUp: b._lastUp,
        gear: gear,
        howToFind: src.howToFind,
        link: src.link || null,
        twilight: !!b.twilight,
        isPlanet: !!b.body
      });
    }

    // Sort: brightest (lowest mag) first, then highest altitude.
    visible.sort(function (a, b) {
      if (a.mag !== b.mag) return a.mag - b.mag;
      return b.bestAlt - a.bestAlt;
    });

    return {
      night: night,
      moon: {
        illumination: moonIllum,            // 0..1
        phaseLon: moonPhaseLon,             // 0..360
        phaseName: moonName,
        altAtMidnight: moonAltMid,
        upFraction: moonUpFraction,         // 0..1 of night the moon is above horizon
        interference: moonInterference      // 0..1 mean (illum when up)
      },
      objects: visible
    };
  }

  global.Visibility = {
    OBSERVER: OBSERVER,
    sunTimes: sunTimes,
    moonPhaseName: moonPhaseName,
    cardinalFromAz: cardinalFromAz,
    computeAll: computeAll
  };
})(window);
