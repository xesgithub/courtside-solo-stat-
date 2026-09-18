import type { Game, Player, StatEvent } from '../types';
import { uid } from './mock';

/**
 * แปลงไฟล์ CSV สถิติ (จากโปรแกรม stat อื่น) เป็น Courtside Game
 *
 * รูปแบบ CSV ที่รองรับ (ต่อ 1 ทีม):
 *   GAME,<ชื่อเกม>,DATE,<YYYY-MM-DD>,STATUS,<final>
 *   TEAM,NUMBER,PLAYER,MIN,PTS,FGM,FGA,FG%,2PM,2PA,2P%,3PM,3PA,3P%,FTM,FTA,...REB,AST,STL,BLK,TO,PF,+/-
 *   <rows ผู้เล่นแต่ละคน>
 *   <TEAM TOTAL row>
 *   TEAM,SCORE CORRECTION,<n>,SCOREBOARD TOTAL,<n>,TEAM REB,<n>
 *   TEAM,Q1: n,Q2: n,...
 *
 * ทีมแรกในไฟล์ = ทีมเรา, ทีมที่สอง = คู่แข่ง (เก็บแค่คะแนนรวม)
 */

/** แยกบรรทัด CSV เป็น cells (รองรับค่าใน "..." และ escape "") */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      cells.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  cells.push(cur);
  return cells.map((s) => s.trim());
}

/** อ่านตัวเลขจาก cell แบบปลอดภัย ('-' หรือค่าว่าง = 0) */
function num(cell: string | undefined): number {
  if (!cell) return 0;
  const cleaned = cell.replace(/[^0-9.-]/g, '');
  const n = parseInt(cleaned, 10);
  return Number.isNaN(n) ? 0 : n;
}

interface ParsedPlayer {
  number: string;
  name: string;
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
}

interface ParsedTeam {
  name: string;
  players: ParsedPlayer[];
  scoreCorrection: number;
  scoreboardTotal: number;
}

/** index ของคอลัมน์ตาม header (map ชื่อ -> ตำแหน่ง) */
function headerIndex(cells: string[]): Record<string, number> {
  const idx: Record<string, number> = {};
  cells.forEach((c, i) => {
    idx[c.toUpperCase()] = i;
  });
  return idx;
}

/** แยกข้อมูลทั้งหมดใน CSV ออกเป็นรายทีม + หัวเกม */
function parseTeams(text: string): {
  gameName: string;
  date: string;
  teams: ParsedTeam[];
} {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let gameName = 'Imported game';
  let date = new Date().toISOString().slice(0, 10);
  const teams: ParsedTeam[] = [];
  let col: Record<string, number> | null = null;
  let current: ParsedTeam | null = null;

  for (const line of lines) {
    const cells = parseCsvLine(line);
    const first = (cells[0] || '').toUpperCase();

    // หัวเกม
    if (first === 'GAME') {
      gameName = cells[1] || gameName;
      const dIdx = cells.findIndex((c) => c.toUpperCase() === 'DATE');
      if (dIdx >= 0 && cells[dIdx + 1]) date = cells[dIdx + 1];
      continue;
    }
    // header คอลัมน์ (มี PLAYER และ PTS)
    if (cells.some((c) => c.toUpperCase() === 'PLAYER')) {
      col = headerIndex(cells);
      continue;
    }
    // บรรทัดอื่นที่ไม่มี header ยัง -> ข้าม
    if (!col) continue;

    const teamName = cells[0];
    const label = (cells[2] || '').toUpperCase();

    // แถว SCORE CORRECTION / SCOREBOARD TOTAL
    if ((cells[1] || '').toUpperCase() === 'SCORE CORRECTION') {
      if (current) {
        current.scoreCorrection = num(cells[2]);
        const sbIdx = cells.findIndex(
          (c) => c.toUpperCase() === 'SCOREBOARD TOTAL',
        );
        if (sbIdx >= 0) current.scoreboardTotal = num(cells[sbIdx + 1]);
      }
      continue;
    }
    // แถว STAT MODE / Q1.. / หมายเหตุ -> ข้าม
    if (
      (cells[1] || '').toUpperCase() === 'STAT MODE' ||
      /^Q\d/.test(cells[1] || '') ||
      teamName.startsWith('*')
    ) {
      continue;
    }
    // แถว TEAM TOTAL -> ข้าม (คำนวณเองจากผู้เล่น)
    if (label.includes('TEAM TOTAL')) {
      continue;
    }

    // แถวผู้เล่น: ต้องมีเลข/ชื่อ
    const number = cells[col['NUMBER']] || '';
    const name = cells[col['PLAYER']] || '';
    if (!name) continue;

    // เปลี่ยนทีมใหม่เมื่อชื่อทีมเปลี่ยน
    if (!current || current.name !== teamName) {
      current = {
        name: teamName,
        players: [],
        scoreCorrection: 0,
        scoreboardTotal: 0,
      };
      teams.push(current);
    }

    current.players.push({
      number,
      name,
      pts: num(cells[col['PTS']]),
      fg2m: num(cells[col['2PM']]),
      fg2a: num(cells[col['2PA']]),
      fg3m: num(cells[col['3PM']]),
      fg3a: num(cells[col['3PA']]),
      ftm: num(cells[col['FTM']]),
      reb: num(cells[col['REB']]),
      ast: num(cells[col['AST']]),
      stl: num(cells[col['STL']]),
      blk: num(cells[col['BLK']]),
      to: num(cells[col['TO']]),
      pf: num(cells[col['PF']]),
    });
  }

  return { gameName, date, teams };
}

/** สร้าง StatEvent 1 รายการ (ค่าคงที่ quarter/clock/ts สำหรับเกม import) */
function mkEvent(
  kind: StatEvent['kind'],
  playerId: string | undefined,
  ts: number,
  extra: Partial<StatEvent> = {},
): StatEvent {
  return {
    id: uid(),
    kind,
    playerId,
    quarter: 1,
    clockMs: 0,
    ts,
    ...extra,
  };
}

/** สังเคราะห์ events จากสถิติสรุปของผู้เล่น 1 คน */
function synthPlayerEvents(p: ParsedPlayer, playerId: string, baseTs: number): StatEvent[] {
  const evs: StatEvent[] = [];
  let t = baseTs;
  const push = (kind: StatEvent['kind'], n: number) => {
    for (let i = 0; i < n; i++) evs.push(mkEvent(kind, playerId, t++));
  };
  // 2 แต้ม: เข้า fg2m, พลาด fg2a - fg2m
  push('FG2_MAKE', p.fg2m);
  push('FG2_MISS', Math.max(0, p.fg2a - p.fg2m));
  // 3 แต้ม
  push('FG3_MAKE', p.fg3m);
  push('FG3_MISS', Math.max(0, p.fg3a - p.fg3m));
  // ฟรีโธรว์เข้า
  push('FT_MAKE', p.ftm);
  // สถิติอื่น
  push('REB', p.reb);
  push('AST', p.ast);
  push('STL', p.stl);
  push('BLK', p.blk);
  push('TO', p.to);
  push('PF', p.pf);
  return evs;
}

/**
 * แปลง CSV -> Game (ทีมแรก = ทีมเรา, ทีมสอง = คู่แข่ง)
 * @param text     เนื้อหาไฟล์ CSV
 * @param scheduledAt  วัน-เวลาแข่ง (epoch ms) ที่ต้องการบันทึกใน History
 */
export function importGameFromCsv(text: string, scheduledAt: number): Game {
  const { gameName, date, teams } = parseTeams(text);
  if (teams.length === 0) {
    throw new Error('ไม่พบข้อมูลทีมใน CSV');
  }

  const us = teams[0];
  const opp = teams[1];

  // สร้างผู้เล่นทีมเรา
  const players: Player[] = us.players.map((p) => ({
    id: uid(),
    number: p.number.trim(),
    name: p.name.trim() || 'Player',
  }));

  // สังเคราะห์ events รายผู้เล่น
  const baseTs = scheduledAt;
  let events: StatEvent[] = [];
  us.players.forEach((p, i) => {
    events = events.concat(synthPlayerEvents(p, players[i].id, baseTs + i * 1000));
  });

  // score correction ของทีมเรา -> เพิ่มเป็น PTS_ADJ (team, ไม่ระบุตัว)
  const correction = us.scoreCorrection;
  if (correction !== 0) {
    events.push(
      mkEvent('PTS_ADJ', undefined, baseTs + 999999, {
        isTeam: true,
        points: correction,
        note: 'score correction (imported)',
      }),
    );
  }

  // คะแนนคู่แข่ง = scoreboard total ของทีมสอง (ถ้าไม่มี ใช้ผลรวม pts ผู้เล่น)
  let oppScore = 0;
  if (opp) {
    oppScore =
      opp.scoreboardTotal > 0
        ? opp.scoreboardTotal
        : opp.players.reduce((s, p) => s + p.pts, 0);
  }
  // computeOpponentScore จะบวก "PF ของทีมเรา" เข้าคะแนนคู่แข่งด้วย (ฟาวล์ -> คู่แข่ง +1)
  // จึงต้องหัก PF ออกจาก delta เพื่อให้คะแนนคู่แข่งสุดท้าย = scoreboard จริง
  const ourPfCount = us.players.reduce((s, p) => s + p.pf, 0);
  const oppDelta = oppScore - ourPfCount;
  const opponentEvents =
    oppDelta !== 0
      ? [
          {
            id: uid(),
            delta: oppDelta,
            quarter: 1,
            clockMs: 0,
            ts: baseTs,
          },
        ]
      : [];

  const now = Date.now();
  return {
    id: uid(),
    name: gameName || 'Imported game',
    date: new Date(scheduledAt).toISOString().slice(0, 10) || date,
    scheduledAt,
    config: { quarters: 4, minutesPerQuarter: 12 },
    teamName: us.name || 'Our team',
    opponentName: opp?.name || 'Opponent',
    players,
    events,
    opponentEvents,
    clock: { quarter: 1, remainingMs: 0, running: false },
    createdAt: now,
    updatedAt: now,
    finished: true, // เกมที่ผ่านไปแล้ว
  };
}
