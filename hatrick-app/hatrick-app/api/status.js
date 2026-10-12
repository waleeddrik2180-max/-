const { af, route } = require('./_lib');

// GET /api/status   -> open this in the browser after deploying to check that the key works.
module.exports = route(60, async () => {
  const j = await af('/status', {});
  const r = j.response || {};
  return {
    account: r.account && { firstname: r.account.firstname },
    plan: r.subscription && r.subscription.plan,
    active: r.subscription && r.subscription.active,
    requestsToday: r.requests && r.requests.current,
    requestsLimit: r.requests && r.requests.limit_day,
  };
});
