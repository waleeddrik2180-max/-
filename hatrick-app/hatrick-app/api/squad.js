const { af, route, num } = require('./_lib');

// GET /api/squad?team=2932   (players with photos)
module.exports = route(86400, async (q) => {
  const j = await af('/players/squads', { team: num(q.team, 'team') });
  const first = (j.response && j.response[0]) || {};
  const players = (first.players || []).map((p) => ({
    id: p.id,
    name: p.name,
    age: p.age,
    number: p.number,
    pos: p.position,
    photo: p.photo,
  }));
  return { players };
});
