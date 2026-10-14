const http = require('http');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('dawam multiplayer server is running');
});

// ===== WebSocket بسيط بدون مكتبات =====
const clients = new Set();
function frame(op, payload) {
  const len = payload.length; let h;
  if (len < 126) h = Buffer.from([0x80 | op, len]);
  else if (len < 65536) { h = Buffer.alloc(4); h[0] = 0x80 | op; h[1] = 126; h.writeUInt16BE(len, 2); }
  else { h = Buffer.alloc(10); h[0] = 0x80 | op; h[1] = 127; h.writeBigUInt64BE(BigInt(len), 2); }
  return Buffer.concat([h, payload]);
}
class Sock {
  constructor(socket) { this.socket = socket; this.readyState = 1; this.buf = Buffer.alloc(0); this.handlers = {}; this.isAlive = true; }
  on(ev, fn) { this.handlers[ev] = fn; }
  emit(ev, a) { if (this.handlers[ev]) try { this.handlers[ev](a); } catch (e) { console.error(e); } }
  send(str) { if (this.readyState === 1) this.socket.write(frame(1, Buffer.from(str))); }
  ping() { if (this.readyState === 1) this.socket.write(frame(9, Buffer.alloc(0))); }
  terminate() { this.readyState = 3; this.socket.destroy(); }
  feed(chunk) {
    this.buf = Buffer.concat([this.buf, chunk]);
    if (this.buf.length > 65536) return this.terminate();
    for (;;) {
      const b = this.buf; if (b.length < 2) return;
      const op = b[0] & 0x0f, masked = (b[1] & 0x80) !== 0; let len = b[1] & 0x7f, off = 2;
      if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (b.length < 10) return; len = Number(b.readBigUInt64BE(2)); off = 10; }
      if (len > 4096) return this.terminate();
      const need = off + (masked ? 4 : 0) + len; if (b.length < need) return;
      let payload = b.subarray(off + (masked ? 4 : 0), need);
      if (masked) { const k = b.subarray(off, off + 4); payload = Buffer.from(payload.map((x, i) => x ^ k[i % 4])); }
      this.buf = b.subarray(need);
      if (op === 1) this.emit('message', payload.toString('utf8'));
      else if (op === 8) { try { this.socket.write(frame(8, Buffer.alloc(0))); } catch (e) {} this.terminate(); return; }
      else if (op === 9) { this.socket.write(frame(10, payload)); }
      else if (op === 10) { this.isAlive = true; }
    }
  }
}
server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key || String(req.headers.upgrade).toLowerCase() !== 'websocket') { socket.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  socket.setNoDelay(true);
  const ws = new Sock(socket); clients.add(ws);
  socket.on('data', (d) => ws.feed(d));
  socket.on('error', () => {});
  socket.on('close', () => { ws.readyState = 3; clients.delete(ws); ws.emit('close'); });
  onConnection(ws);
});

const rooms = new Map(); // code -> { host, guest, cfg, started, fin: {host, guest}, done }

function send(ws, o) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); }
function other(room, ws) { return room.host === ws ? room.guest : room.host; }
function newCode() {
  for (let i = 0; i < 200; i++) { const c = String(Math.floor(1000 + Math.random() * 9000)); if (!rooms.has(c)) return c; }
  return null;
}
function leave(ws) {
  const room = ws.room; if (!room) return;
  ws.room = null;
  const peer = other(room, ws);
  if (peer) { send(peer, { t: 'left' }); }
  if (room.host === ws) {
    // المضيف طلع: نقفل الغرفة، والضيف يستقبل left
    rooms.delete(room.code); if (room.guest) room.guest.room = null;
  } else { room.guest = null; room.started = false; room.fin = {}; room.done = false; }
}
function cleanName(n) { return String(n || 'لاعب').replace(/[<>&"']/g, '').slice(0, 12) || 'لاعب'; }

function onConnection(ws) {
  ws.isAlive = true; ws.room = null; ws.name = 'لاعب'; ws.lastPos = 0;
  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (!m || typeof m.t !== 'string') return;
    if (m.t === 'create') {
      if (ws.room) leave(ws);
      const code = newCode(); if (!code) return send(ws, { t: 'err', msg: 'السيرفر مشغول، جرّب بعد شوي' });
      const c = m.cfg || {};
      const cfg = { day: Math.max(1, Math.min(1000, parseInt(c.day, 10) || 1)), route: ['long', 'short', 'desert', 'highway', 'night'].includes(c.route) ? c.route : 'long' };
      const room = { code, host: ws, guest: null, cfg, started: false, fin: {}, done: false };
      ws.name = cleanName(m.name); ws.room = room; rooms.set(code, room);
      send(ws, { t: 'created', code, cfg });
    } else if (m.t === 'join') {
      const room = rooms.get(String(m.code));
      if (!room) return send(ws, { t: 'err', msg: 'الكود غلط أو الغرفة انقفلت' });
      if (room.guest) return send(ws, { t: 'err', msg: 'الغرفة ممتلئة' });
      if (ws.room) leave(ws);
      ws.name = cleanName(m.name); ws.room = room; room.guest = ws;
      const names = [room.host.name, ws.name];
      send(room.host, { t: 'ready', names, cfg: room.cfg }); send(ws, { t: 'ready', names, cfg: room.cfg });
    } else if (m.t === 'start') {
      const room = ws.room;
      if (!room || room.host !== ws || !room.guest || room.started) return;
      room.started = true; room.fin = {}; room.done = false;
      send(room.host, { t: 'go' }); send(room.guest, { t: 'go' });
    } else if (m.t === 'pos') {
      const room = ws.room; if (!room || !room.started) return;
      const now = Date.now(); if (now - ws.lastPos < 40) return; ws.lastPos = now;
      send(other(room, ws), { t: 'pos', x: +m.x || 0, v: +m.v || 0, veh: parseInt(m.veh, 10) || 0 });
    } else if (m.t === 'fin') {
      const room = ws.room; if (!room || !room.started || room.done) return;
      const me = room.host === ws ? 'host' : 'guest';
      room.fin[me] = !!m.ok;
      const peer = other(room, ws);
      if (m.ok) { room.done = true; send(ws, { t: 'result', win: true }); send(peer, { t: 'result', win: false }); room.started = false; }
      else if ('host' in room.fin && 'guest' in room.fin) { room.done = true; send(room.host, { t: 'result', win: null }); send(room.guest, { t: 'result', win: null }); room.started = false; }
    }
  });
  ws.on('close', () => leave(ws));
}

// نبض كل 25 ثانية عشان ريندر ما يقطع الاتصال الساكت
setInterval(() => {
  clients.forEach((ws) => { if (!ws.isAlive) return ws.terminate(); ws.isAlive = false; try { ws.ping(); } catch (e) {} });
}, 25000);
server.listen(PORT, () => console.log('listening on ' + PORT));
