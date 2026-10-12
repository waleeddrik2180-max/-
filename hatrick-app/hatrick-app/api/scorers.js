const { af, route, leagueId, season } = require('./_lib');

// GET /api/scorers?league=307&season=2026
module.exports = route(10800, async (q) => {
  const j = await af('/players/topscorers', { league: leagueId(q.league), season: season(q.season) });
  const players = (j.response || []).map((x) => {
    const s = (x.statistics && x.statistics[0]) || {};
    return {
      id: x.player.id,
      name: x.player.name,
      photo: x.player.photo,
      age: x.player.age,
      team: s.team && s.team.name,
      teamId: s.team && s.team.id,
      teamLogo: s.team && s.team.logo,
      goals: (s.goals && s.goals.total) || 0,
      assists: (s.goals && s.goals.assists) || 0,
      apps: (s.games && s.games.appearences) || 0,
    };
  });
  return { players };
});
