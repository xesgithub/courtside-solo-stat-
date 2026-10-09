import type { Game, Player, StatEvent, StatKind } from '../types';

/** แต้มที่ได้จากสถิติแต่ละชนิด */
export function pointsForKind(kind: StatKind): number {
  switch (kind) {
    case 'FG2_MAKE':
      return 2;
    case 'FG3_MAKE':
      return 3;
    case 'FT_MAKE':
      return 1;
    // FOUL_DRAWN: แต้มผันแปร (1-3) เก็บใน event.points ไม่ใช่ค่าคงที่ -> คืน 0 ที่นี่
    default:
      return 0;
  }
}

/** สถิติสรุปของผู้เล่น 1 คน (1 แถวใน Box Score) */
export interface PlayerLine {
  playerId: string;
  pts: number;
  fg2m: number;
  fg2a: number;
  fg3m: number;
  fg3a: number;
  ftm: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  pf: number;
  /** จำนวนครั้งที่ "โดนฟาวล์แล้วได้แต้ม" (foul drawn) */
  fd: number;
}

function emptyLine(playerId: string): PlayerLine {
  return {
    playerId,
    pts: 0,
    fg2m: 0,
    fg2a: 0,
    fg3m: 0,
    fg3a: 0,
    ftm: 0,
    reb: 0,
    ast: 0,
    stl: 0,
    blk: 0,
    to: 0,
    pf: 0,
    fd: 0,
  };
}

function applyEvent(line: PlayerLine, kind: StatKind, points = 0): void {
  switch (kind) {
    case 'FG2_MAKE':
      line.fg2m += 1;
      line.fg2a += 1;
      line.pts += 2;
      break;
    case 'FG2_MISS':
      line.fg2a += 1;
      break;
    case 'FG3_MAKE':
      line.fg3m += 1;
      line.fg3a += 1;
      line.pts += 3;
      break;
    case 'FG3_MISS':
      line.fg3a += 1;
      break;
    case 'FT_MAKE':
      line.ftm += 1;
      line.pts += 1;
      break;
    case 'REB':
      line.reb += 1;
      break;
    case 'AST':
      line.ast += 1;
      break;
    case 'STL':
      line.stl += 1;
      break;
    case 'BLK':
      line.blk += 1;
      break;
    case 'TO':
      line.to += 1;
      break;
    case 'PF':
      // ทีมเราทำฟาวล์ -> นับจำนวนครั้ง (แต้มที่คู่แข่งได้คิดใน computeOpponentScore)
      line.pf += 1;
      break;
    case 'FOUL_DRAWN':
      // ทีมเราโดนฟาวล์แล้วได้แต้มทันที (กติกาสนาม) -> บวกแต้มเข้าทีมเรา
      // migrate: ถ้าไม่มี points (เผื่ออนาคต) ให้ถือเป็น 1
      line.fd += 1;
      line.pts += points > 0 ? points : 1;
      break;
    case 'PTS_ADJ':
      // ปรับแต้มทีมแบบเร็ว (ไม่ระบุตัว) — บวก/ลบเข้าคะแนนอย่างเดียว
      line.pts += points;
      break;
  }
}

export interface BoxScore {
  /** แถวสถิติของผู้เล่นแต่ละคน (เรียงตามลำดับใน players) */
  lines: PlayerLine[];
  /** แถวสถิติของ "ทีม" (event ที่ไม่ระบุตัวผู้เล่น เช่น team assist/rebound) */
  teamLine: PlayerLine;
  /** ผลรวมทั้งทีม (รายคน + teamLine) */
  totals: PlayerLine;
  /** คะแนนรวมทีมเรา */
  teamScore: number;
}

const TEAM_LINE_ID = '__TEAM__';

/** คำนวณ Box Score ของทีมเราจาก events */
export function computeBoxScore(players: Player[], events: StatEvent[]): BoxScore {
  const byId = new Map<string, PlayerLine>();
  players.forEach((p) => byId.set(p.id, emptyLine(p.id)));
  const teamLine = emptyLine(TEAM_LINE_ID);

  for (const ev of events) {
    if (ev.isTeam || !ev.playerId) {
      applyEvent(teamLine, ev.kind, ev.points ?? 0);
    } else {
      const line = byId.get(ev.playerId);
      // ถ้าผู้เล่นถูกลบออกจากรายชื่อไปแล้ว (orphaned event) ให้ตกไปรวมใน "Team"
      // เพื่อไม่ให้แต้ม/สถิติที่จดไว้หายจากบ็อกซ์สกอร์และคะแนนรวม
      applyEvent(line ?? teamLine, ev.kind, ev.points ?? 0);
    }
  }

  const lines = players.map((p) => byId.get(p.id)!);
  const totals = emptyLine('__TOTALS__');
  [...lines, teamLine].forEach((l) => {
    totals.pts += l.pts;
    totals.fg2m += l.fg2m;
    totals.fg2a += l.fg2a;
    totals.fg3m += l.fg3m;
    totals.fg3a += l.fg3a;
    totals.ftm += l.ftm;
    totals.reb += l.reb;
    totals.ast += l.ast;
    totals.stl += l.stl;
    totals.blk += l.blk;
    totals.to += l.to;
    totals.pf += l.pf;
    totals.fd += l.fd;
  });

  // กันแต้มทีมติดลบ (เช่นกดปรับแต้ม −1 รัวเกิน) — แต้มบาสไม่ควรน้อยกว่า 0
  return { lines, teamLine, totals, teamScore: Math.max(0, totals.pts) };
}

/**
 * คะแนนรวมของคู่แข่ง = ผลรวม delta ของ opponentEvents
 *   + แต้มที่คู่แข่งได้จากการที่ "ทีมเราทำฟาวล์" (PF)
 *     - PF ใหม่: บวกตาม event.points (1-3 แต้มตามจังหวะฟาวล์)
 *     - PF เก่า (ไม่มี points): ถือเป็น 1 แต้ม เพื่อคงคะแนนเกมเก่าไม่ให้เพี้ยน (migrate)
 */
export function computeOpponentScore(game: Game): number {
  const fromEvents = game.opponentEvents.reduce((s, e) => s + e.delta, 0);
  const fromFouls = game.events
    .filter((e) => e.kind === 'PF')
    .reduce((s, e) => s + (e.points && e.points > 0 ? e.points : 1), 0);
  return Math.max(0, fromEvents + fromFouls);
}

/** ค่าสูงสุดของผู้นำแต่ละหมวด (คิดเฉพาะผู้เล่นจริง, ต้อง > 0 ถึงนับ) */
export interface Leaders {
  pts: number;
  reb: number;
  ast: number;
}

/**
 * หาค่าสูงสุดของ PTS / REB / AST จาก "ผู้เล่นจริง" เท่านั้น (ไม่รวมแถว Team)
 * ค่าเป็น 0 หมายถึง "ไม่มีผู้นำ" (จะได้ไม่ไปเน้นเลข 0)
 * ใช้เทียบว่า cell ไหนควรไฮไลต์ leader (เสมอกันหลายคน = เน้นทุกคนที่เท่าค่านี้)
 */
export function computeLeaders(lines: PlayerLine[]): Leaders {
  const max = (sel: (l: PlayerLine) => number) =>
    lines.reduce((m, l) => Math.max(m, sel(l)), 0);
  return {
    pts: max((l) => l.pts),
    reb: max((l) => l.reb),
    ast: max((l) => l.ast),
  };
}
