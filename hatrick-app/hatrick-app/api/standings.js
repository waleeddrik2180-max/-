const { af, route, leagueId, season } = require('./_lib');

// GET /api/standings?league=307&season=2026
module.exports = route(10800, async (q) => {
  const j = await af('/standings', { league: leagueId(q.league), season: season(q.season) });
  const lg = j.response && j.response[0] && j.response[0].league;
  const groups = (lg && lg.standings) || [];
  const rows = (groups[0] || []).map((r) => ({
    id: r.team.id,
    name: r.team.name,
    logo: r.team.logo,
    rank: r.rank,
    p: r.all.played,
    w: r.all.win,
    d: r.all.draw,
    l: r.all.lose,
    gf: r.all.goals.for,
    ga: r.all.goals.against,
    gd: r.goalsDiff,
    pts: r.points,
    form: r.form || '',
    desc: r.description || '',
  }));
  return { rows };
});
