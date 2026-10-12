const { af, route, text } = require('./_lib');

// GET /api/leagues?search=saudi   -> helper to double-check league ids and which seasons exist.
module.exports = route(86400, async (q) => {
  const j = await af('/leagues', { search: text(q.search, 3, 30) });
  const leagues = (j.response || []).slice(0, 30).map((x) => ({
    id: x.league.id,
    name: x.league.name,
    type: x.league.type,
    country: x.country && x.country.name,
    seasons: (x.seasons || []).map((s) => s.year).slice(-4),
  }));
  return { leagues };
});
