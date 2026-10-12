const { af, route, leagueId, season, date } = require('./_lib');

const STATUS = {
  NS: 'ns', TBD: 'ns',
  '1H': 'live', HT: 'live', '2H': 'live', ET: 'live', BT: 'live', P: 'live', LIVE: 'live', INT: 'live',
  FT: 'ft', AET: 'ft', PEN: 'ft',
};

// GET /api/fixtures?league=307&season=2026&from=2026-10-11&to=2026-10-13
// One request covers yesterday, today and tomorrow. Times are returned in Saudi time.
module.exports = route(600, async (q) => {
  const j = await af('/fixtures', {
    league: leagueId(q.league),
    season: season(q.season),
    from: date(q.from),
    to: date(q.to),
    timezone: 'Asia/Riyadh',
  });
  const fixtures = (j.response || [])
    .map((f) => ({
      id: f.fixture.id,
      ts: f.fixture.timestamp,
      st: STATUS[f.fixture.status.short] || 'x', // postponed / cancelled etc. are dropped
      elapsed: f.fixture.status.elapsed,
      home: { id: f.teams.home.id, name: f.teams.home.name, logo: f.teams.home.logo },
      away: { id: f.teams.away.id, name: f.teams.away.name, logo: f.teams.away.logo },
      hs: f.goals.home,
      as: f.goals.away,
    }))
    .filter((x) => x.st !== 'x')
    .sort((a, b) => a.ts - b.ts);
  return { fixtures };
});
