// Shared helpers for the serverless functions. The API key stays on the server
// (environment variable API_FOOTBALL_KEY) and is never sent to the browser.

const BASE = 'https://v3.football.api-sports.io';

// Only these leagues can be requested, so nobody can burn the daily quota on random ids.
const ALLOWED_LEAGUES = [307, 308, 233, 301, 305, 39, 140, 135, 78, 61, 203, 94, 88];

async function af(path, params) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    const e = new Error('المفتاح API_FOOTBALL_KEY غير مضبوط في إعدادات Vercel');
    e.fatal = true;
    throw e;
  }
  const url = new URL(BASE + path);
  Object.keys(params || {}).forEach((k) => {
    const v = params[k];
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  const r = await fetch(url, { headers: { 'x-apisports-key': key } });
  if (!r.ok) throw new Error('API-Football HTTP ' + r.status);
  const j = await r.json();
  // API-Football answers HTTP 200 even for plan/quota problems and puts them in "errors".
  const errs = j && j.errors ? (Array.isArray(j.errors) ? j.errors : Object.values(j.errors)) : [];
  if (errs.length) throw new Error(errs.join(' | '));
  return j;
}

function num(v, name) {
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n <= 0) throw new Error('قيمة غير صالحة: ' + name);
  return n;
}
function leagueId(v) {
  const n = num(v, 'league');
  if (ALLOWED_LEAGUES.indexOf(n) < 0) throw new Error('دوري غير مدعوم');
  return n;
}
function season(v) {
  const n = num(v || new Date().getFullYear(), 'season');
  if (n < 2015 || n > 2100) throw new Error('موسم غير صالح');
  return n;
}
function date(v) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v))) throw new Error('تاريخ غير صالح');
  return String(v);
}
function text(v, min, max) {
  const s = String(v || '').trim();
  if (s.length < min || s.length > max) throw new Error('نص البحث غير صالح');
  return s;
}

// route(ttlSeconds, build): wraps a handler with caching and error handling.
// Successful answers are cached on Vercel's CDN for ttl seconds, so repeated visits
// do not spend API requests. API-level errors are returned as {ok:false} with a short cache.
function route(ttl, build) {
  return async function (req, res) {
    try {
      const data = await build(req.query || {});
      res.setHeader('Cache-Control', 'public, s-maxage=' + ttl + ', stale-while-revalidate=' + ttl * 3);
      res.status(200).json(Object.assign({ ok: true }, data));
    } catch (e) {
      if (e.fatal) {
        res.status(500).json({ ok: false, error: e.message });
        return;
      }
      res.setHeader('Cache-Control', 'public, s-maxage=300');
      res.status(200).json({ ok: false, error: e.message });
    }
  };
}

module.exports = { af, route, num, leagueId, season, date, text, ALLOWED_LEAGUES };
