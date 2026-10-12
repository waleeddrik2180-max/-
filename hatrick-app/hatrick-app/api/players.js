const { af, route, leagueId, season, text } = require('./_lib');

// GET /api/players?search=salah&league=39&season=2026   (API requires at least 4 characters)
module.exports = route(3600, async (q) => {
  const j = await af('/players', {
    search: text(q.search, 4, 30),
    league: leagueId(q.league),
    season: season(q.season),
  });
  const players = (j.response || []).slice(0, 15).map((x) => {
    const s = (x.statistics && x.statistics[0]) || {};
    return {
      id: x.player.id,
      name: x.player.name,
      photo: x.player.photo,
      age: x.player.age,
      team: s.team && s.team.name,
      teamId: s.team && s.team.id,
      pos: s.games && s.games.position,
    };
  });
  return { players };
});
