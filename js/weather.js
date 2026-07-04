// weather.js
// Fetches hourly weather from Open-Meteo and extracts the night-time window
// (from sunset to next sunrise, as computed by visibility.js).
// Uses the forecast API for today/near-future and the archive API for past dates.
// No API key required.

(function (global) {
  "use strict";

  // Capture the browser's native fetch BEFORE the `fetch` function below
  // shadows it inside this IIFE. Without this, fetchJSON() would call our
  // own fetch(dateStr, night) recursively and OOM the page.
  const nativeFetch = global.fetch.bind(global);

  const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
  const ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";
  const LAT = 51.846, LON = 5.491;

  const HOURLY_VARS =
    "cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high," +
    "relative_humidity_2m,wind_speed_10m,precipitation,temperature_2m";

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

  // Convert "YYYY-MM-DD" to the next day's "YYYY-MM-DD".
  function nextDayStr(dateStr) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + 1));
    return dt.getUTCFullYear() + "-" + pad2(dt.getUTCMonth() + 1) + "-" + pad2(dt.getUTCDate());
  }

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
  }

  function isPast(dateStr) { return dateStr < todayStr(); }

  function isTooFarFuture(dateStr) {
    // Open-Meteo forecast reliably covers ~16 days ahead.
    const today = new Date(todayStr() + "T00:00:00Z").getTime();
    const target = new Date(dateStr + "T00:00:00Z").getTime();
    return (target - today) > 16 * 86400000;
  }

  function buildUrl(base, dateStr) {
    const params = [
      "latitude=" + LAT, "longitude=" + LON,
      "hourly=" + HOURLY_VARS,
      "timezone=auto",
      "start_date=" + dateStr,
      "end_date=" + nextDayStr(dateStr),
      "wind_speed_unit=kmh"
    ];
    return base + "?" + params.join("&");
  }

  // Parse an Open-Meteo local time string (no Z) into an absolute UTC instant,
  // using the response's utc_offset_seconds.
  function parseLocalTime(str, utcOffsetSeconds) {
    // str e.g. "2026-07-04T22:00"  (location-local time)
    const asUTCms = Date.parse(str + "Z");        // treat the string as if it were UTC
    return new Date(asUTCms - utcOffsetSeconds * 1000);  // convert to true UTC instant
  }

  function average(arr) {
    if (!arr.length) return 0;
    let s = 0;
    for (let i = 0; i < arr.length; i++) s += arr[i];
    return s / arr.length;
  }

  // Parse an Open-Meteo response object + the night window into night entries + averages.
  // Exposed for testability; called by fetch() after the HTTP request resolves.
  function processResponse(data, night) {
    const sunsetMs = night.sunset.getTime();
    const sunriseMs = night.sunrise.getTime();

    if (!data || !data.hourly || !data.hourly.time) {
      return {
        source: null, night: [], avg: null, hourlyAll: [],
        error: "Er zijn nog geen uurlijkse weergegevens beschikbaar voor deze datum."
      };
    }

    const off = data.utc_offset_seconds || 0;
    const h = data.hourly;
    const entries = [];
    for (let i = 0; i < h.time.length; i++) {
      const t = parseLocalTime(h.time[i], off);
      entries.push({
        time: t,
        cloud: num(h.cloud_cover, i),
        humidity: num(h.relative_humidity_2m, i),
        wind: num(h.wind_speed_10m, i),
        precip: num(h.precipitation, i),
        temp: num(h.temperature_2m, i)
      });
    }

    // Keep only the night window (sunset -> next sunrise).
    const nightEntries = entries.filter(function (e) {
      return e.time.getTime() >= sunsetMs && e.time.getTime() <= sunriseMs;
    });

    const used = nightEntries.length ? nightEntries : entries;
    const avg = {
      cloud: average(used.map(e => e.cloud)),
      humidity: average(used.map(e => e.humidity)),
      wind: average(used.map(e => e.wind)),
      precip: average(used.map(e => e.precip)),
      temp: average(used.map(e => e.temp)),
      precipTotal: used.reduce((s, e) => s + (e.precip || 0), 0)
    };

    return { source: null, night: nightEntries, avg: avg, hourlyAll: entries, error: null };
  }

  async function fetch(dateStr, night) {
    if (isTooFarFuture(dateStr)) {
      return {
        source: null, night: [], avg: null, hourlyAll: [],
        error: "Weersverwachtingen zijn alleen tot ongeveer 16 dagen vooruit beschikbaar. " +
              "De zichtbaarheid van objecten wordt hieronder nog wel getoond."
      };
    }

    let base = FORECAST_URL, source = "forecast";
    if (isPast(dateStr)) { base = ARCHIVE_URL; source = "archive"; }

    let data;
    try {
      data = await fetchJSON(buildUrl(base, dateStr));
    } catch (err) {
      try {
        const alt = base === FORECAST_URL ? ARCHIVE_URL : FORECAST_URL;
        data = await fetchJSON(buildUrl(alt, dateStr));
        source = alt === ARCHIVE_URL ? "archive" : "forecast";
      } catch (err2) {
        return {
          source: null, night: [], avg: null, hourlyAll: [],
          error: "Weergegevens konden niet geladen worden (" + (err2.message || err2) + "). " +
                "De zichtbaarheid van objecten wordt hieronder nog wel getoond."
        };
      }
    }

    const result = processResponse(data, night);
    result.source = source;
    return result;
  }

  function num(arr, i) {
    if (!arr || arr[i] === undefined || arr[i] === null) return 0;
    return Number(arr[i]);
  }

  async function fetchJSON(url) {
    const res = await nativeFetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  }

  global.Weather = { fetch: fetch, processResponse: processResponse };
})(window);
