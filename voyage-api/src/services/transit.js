// Linhas, paradas e frota de ônibus (posição em tempo real, simulada).
// Para usar GPS de verdade, substitua o FleetSimulator por um endpoint que RECEBE
// a posição dos veículos (ex.: POST /api/buses/:id/position) e grava na tabela `buses`.

export const NOMINAL_SPEED = 16; // unidades do mapa por minuto simulado
export const TIME_SCALE = 4; // 1 s real = 4 s simulados (igual ao app)

export function loadTransit(db) {
  const stops = db.prepare("SELECT id, name, x, y FROM stops ORDER BY name").all().map((s) => ({ ...s }));
  const lineRows = db.prepare("SELECT id, code, name, kind, color, fare_cents FROM lines ORDER BY code").all();
  const links = db.prepare("SELECT line_id, stop_id FROM line_stops ORDER BY line_id, position").all();
  const lines = lineRows.map((l) => ({
    id: l.id,
    code: l.code,
    name: l.name,
    kind: l.kind,
    color: l.color,
    fare: l.fare_cents / 100,
    stopIds: links.filter((k) => k.line_id === l.id).map((k) => k.stop_id),
  }));
  return { stops, lines };
}

export function buildGeometry(transit) {
  const stopMap = {};
  transit.stops.forEach((s) => (stopMap[s.id] = s));
  const geo = {};
  for (const line of transit.lines) {
    const pts = line.stopIds.map((id) => stopMap[id]);
    const cum = [0];
    for (let i = 1; i < pts.length; i++) {
      cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
    }
    geo[line.id] = { cum, length: cum[cum.length - 1] };
  }
  return geo;
}

export class FleetSimulator {
  constructor(db) {
    this.db = db;
    this.reload();
  }

  reload() {
    this.transit = loadTransit(this.db);
    this.geo = buildGeometry(this.transit);
    this.buses = this.db
      .prepare("SELECT id, line_id, dist, dir, speed FROM buses ORDER BY id")
      .all()
      .map((b) => ({ id: b.id, lineId: b.line_id, dist: b.dist, dir: b.dir, speed: b.speed }));
  }

  // Avança todos os ônibus `dtSec` segundos (ida e volta nas pontas da linha).
  tick(dtSec) {
    for (const b of this.buses) {
      const g = this.geo[b.lineId];
      if (!g) continue;
      let dist = b.dist + b.dir * (b.speed / 60) * dtSec * TIME_SCALE;
      let dir = b.dir;
      if (dist >= g.length) {
        dist = g.length - (dist - g.length);
        dir = -1;
      } else if (dist <= 0) {
        dist = -dist;
        dir = 1;
      }
      b.dist = dist;
      b.dir = dir;
    }
  }

  // Grava a posição atual no banco (histórico/recuperação após reiniciar).
  persist() {
    const update = this.db.prepare("UPDATE buses SET dist = ?, dir = ?, updated_at = ? WHERE id = ?");
    const t = Date.now();
    this.db.transaction(() => {
      for (const b of this.buses) update.run(b.dist, b.dir, t, b.id);
    })();
  }

  list(lineId) {
    const list = lineId ? this.buses.filter((b) => b.lineId === lineId) : this.buses;
    return list.map((b) => ({ ...b }));
  }

  start(intervalMs = 1000) {
    let last = Date.now();
    this.timer = setInterval(() => {
      const t = Date.now();
      this.tick(Math.min((t - last) / 1000, 5));
      last = t;
    }, intervalMs);
    this.persistTimer = setInterval(() => this.persist(), 10000);
    this.timer.unref?.();
    this.persistTimer.unref?.();
  }

  stop() {
    clearInterval(this.timer);
    clearInterval(this.persistTimer);
    this.persist();
  }
}
