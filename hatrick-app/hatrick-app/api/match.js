const { af, route, num } = require('./_lib');

function stat(list, type) {
  const f = (list || []).filter((s) => s.type === type)[0];
  if (!f || f.value === null || f.value === undefined) return 0;
  const n = parseInt(String(f.value).replace('%', ''), 10);
  return Number.isFinite(n) ? n : 0;
}

// GET /api/match?fixture=123456&home=2932   (goals/cards timeline and basic stats)
module.exports = route(120, async (q) => {
  const fixture = num(q.fixture, 'fixture');
  const homeId = q.home ? num(q.home, 'home') : null;
  const [ev, st] = await Promise.all([
    af('/fixtures/events', { fixture }),
    af('/fixtures/statistics', { fixture }),
  ]);
  const events = (ev.response || [])
    .filter((x) => x.type === 'Goal' || x.type === 'Card')
    .map((x) => ({
      min: x.time && x.time.elapsed,
      extra: x.time && x.time.extra,
      team: x.team && x.team.name,
      type: x.type,
      detail: x.detail || '',
      player: x.player && x.player.name,
    }));
  let stats = null;
  const teams = st.response || [];
  if (teams.length === 2) {
    let h = teams[0];
    let a = teams[1];
    if (homeId && teams[1].team && teams[1].team.id === homeId) { h = teams[1]; a = teams[0]; }
    const pick = (t) => ({
      possession: stat(t.statistics, 'Ball Possession'),
      shots: stat(t.statistics, 'Total Shots'),
      onTarget: stat(t.statistics, 'Shots on Goal'),
      corners: stat(t.statistics, 'Corner Kicks'),
    });
    stats = { home: pick(h), away: pick(a) };
  }
  return { events, stats };
});
