// scoring.js
// Combines the night's averaged weather with the Moon's interference to
// produce a 1..10 stargazing score, a short verdict, an explanation, and a
// per-factor breakdown for the UI.

(function (global) {
  "use strict";

  const WEIGHTS = { cloud: 0.45, humidity: 0.12, wind: 0.10, precip: 0.15, moon: 0.18 };
  // sum = 1.00

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function subScore(kind, raw, precipTotal, moonInterference) {
    switch (kind) {
      case "cloud":
        // 0% cloud -> 10, 100% cloud -> 0
        return clamp(10 * (1 - raw / 100), 0, 10);
      case "humidity":
        // <=50% -> 10, 100% -> 0
        return clamp(10 - Math.max(0, raw - 50) / 5, 0, 10);
      case "wind":
        // 0 km/h -> 10, 30 km/h -> 0
        return clamp(10 - raw / 3, 0, 10);
      case "precip":
        // 0 mm -> 10, >=1 mm -> 0
        return clamp(10 - precipTotal * 10, 0, 10);
      case "moon":
        // 0 interference -> 10, 1 (full moon up all night) -> 0
        return clamp(10 * (1 - moonInterference), 0, 10);
    }
    return 0;
  }

  function verdict(score) {
    if (score >= 8.5) return { label: "Uitstekend", color: "var(--good)" };
    if (score >= 6.5) return { label: "Goed", color: "var(--good)" };
    if (score >= 4.5) return { label: "Matig", color: "var(--warn)" };
    if (score >= 2.5) return { label: "Slecht", color: "var(--bad)" };
    return { label: "Zeer slecht", color: "var(--bad)" };
  }

  function describe(avg, moon) {
    const parts = [];
    const cloud = avg ? avg.cloud : 100;
    const precip = avg ? avg.precipTotal : 0;
    const wind = avg ? avg.wind : 0;
    const hum = avg ? avg.humidity : 0;
    const mi = moon ? moon.interference : 0;

    // Eerst bewolking/regen (dominant)
    if (cloud > 80 || precip > 0.3) {
      parts.push("Bewolkte of natte weersomstandigheden maken sterrenkijken vanavond onpraktisch.");
    } else if (cloud > 50) {
      parts.push("Half bewolkte lucht zal veel van de hemel blokkeren, hoewel heldere objecten door de spleten kunnen glippen.");
    } else if (cloud > 25) {
      parts.push("Enkele wolken, maar in de openingen zouden de helderste sterren en planeten zichtbaar moeten worden.");
    } else {
      parts.push("Heldere of grotendeels heldere lucht - uitstekend om naar buiten te gaan met een telescoop.");
    }

    // Maanschijn
    if (mi > 0.6) {
      parts.push("Een heldere Maan staat het grootste deel van de nacht boven en wast flauwe nevels en sterrenstelsels uit; houd het op heldere sterren, planeten en de Maan zelf.");
    } else if (mi > 0.3) {
      parts.push("Matige maanschijn vermindert het contrast op flauwe deep-sky objecten - het beste te zien als de Maan laag staat of onder is.");
    } else if (mi > 0.08) {
      parts.push("Wat maanschijn laat of vroeg in de nacht, maar een flink deel van de nacht blijft lekker donker.");
    } else {
      parts.push("De hemel blijft donker met weinig of geen maanschijn - ideaal voor sterrenstelsels, nevels en sterrenhopen.");
    }

    // Wind + luchtvochtigheid
    if (wind > 25) parts.push("Flinke wind zal een telescoop laten trillen en het waarnemen ongemakkelijk maken.");
    else if (wind > 12) parts.push("Lichte wind zou de meeste uitrusting niet moeten hinderen.");

    if (hum > 85) parts.push("Zeer vochtige lucht betekent dat er snel dauw op je optica ontstaat - neem een dauwkap of verwarming mee.");
    else if (hum > 70) parts.push("Vochtige lucht kan na verloop van tijd wat dauw op de lenzen veroorzaken.");

    return parts.join(" ");
  }

  function compute(avg, moon) {
    const cloudRaw = avg ? avg.cloud : 100;
    const humRaw = avg ? avg.humidity : 100;
    const windRaw = avg ? avg.wind : 40;
    const precipTotal = avg ? avg.precipTotal : 1;
    const mi = moon ? moon.interference : 1;

    const subs = {
      cloud: subScore("cloud", cloudRaw, 0, 0),
      humidity: subScore("humidity", humRaw, 0, 0),
      wind: subScore("wind", windRaw, 0, 0),
      precip: subScore("precip", 0, precipTotal, 0),
      moon: subScore("moon", 0, 0, mi)
    };

    let score = 0;
    for (const k in WEIGHTS) score += subs[k] * WEIGHTS[k];
    score = clamp(score, 1, 10); // requested 1..10 scale
    score = Math.round(score * 10) / 10;

    const v = verdict(score);

    const factors = [
      {
        key: "cloud", name: "Bewolking",
        value: cloudRaw, display: Math.round(cloudRaw) + "%",
        sub: subs.cloud, pts: subs.cloud * WEIGHTS.cloud
      },
      {
        key: "precip", name: "Neerslag",
        value: precipTotal, display: precipTotal.toFixed(1) + " mm",
        sub: subs.precip, pts: subs.precip * WEIGHTS.precip
      },
      {
        key: "moon", name: "Maanschijn",
        value: mi, display: Math.round((moon ? moon.illumination : 0) * 100) + "% verlicht",
        sub: subs.moon, pts: subs.moon * WEIGHTS.moon
      },
      {
        key: "humidity", name: "Luchtvochtigheid",
        value: humRaw, display: Math.round(humRaw) + "%",
        sub: subs.humidity, pts: subs.humidity * WEIGHTS.humidity
      },
      {
        key: "wind", name: "Wind",
        value: windRaw, display: Math.round(windRaw) + " km/u",
        sub: subs.wind, pts: subs.wind * WEIGHTS.wind
      }
    ];

    return {
      score: score,
      label: v.label,
      color: v.color,
      explanation: describe(avg, moon),
      factors: factors
    };
  }

  global.Scoring = { compute: compute };
})(window);
