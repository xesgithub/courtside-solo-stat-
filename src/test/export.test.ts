import { describe, it, expect } from 'vitest';
import { buildBoxScoreCsv } from '../lib/export';
import { computeBoxScore } from '../lib/stats';
import { createGame } from '../lib/mock';
import type { StatEvent } from '../types';

function ev(playerId: string, kind: StatEvent['kind']): StatEvent {
  return { id: Math.random().toString(36).slice(2), kind, playerId, quarter: 1, clockMs: 0, ts: Date.now() };
}

describe('buildBoxScoreCsv', () => {
  it('มี header และแถวผู้เล่น + Total', () => {
    const game = createGame({
      teamName: 'A',
      opponentName: 'B',
      minutesPerQuarter: 10,
      quarters: 4,
      players: [{ number: '7', name: 'Jay' }],
    });
    const pid = game.players[0].id;
    game.events = [ev(pid, 'FG3_MAKE'), ev(pid, 'REB'), ev(pid, 'AST')];
    const box = computeBoxScore(game.players, game.events);

    const csv = buildBoxScoreCsv(game, box, 0, () => '#7 Jay');
    const lines = csv.split('\r\n');

    // มี BOM นำหน้า
    expect(csv.startsWith('\uFEFF')).toBe(true);
    // มีหัวคอลัมน์
    expect(csv).toContain('Player,PTS,FG,FG%,3PT,3P%,REB,AST,STL,BLK,TO,PF');
    // มีแถวผู้เล่น Jay: 3 แต้ม, 3PT 1/1
    const jayRow = lines.find((l) => l.startsWith('#7 Jay'));
    expect(jayRow).toBeTruthy();
    expect(jayRow).toContain('#7 Jay,3,1/1,100%,1/1,100%,1,1,0,0,0,0');
    // มีแถว Total
    expect(lines.some((l) => l.startsWith('Total,'))).toBe(true);
  });

  it('escape ค่าที่มี comma ด้วยเครื่องหมายคำพูด', () => {
    const game = createGame({
      teamName: 'Team, Inc',
      opponentName: 'B',
      minutesPerQuarter: 10,
      quarters: 4,
      players: [{ number: '4', name: 'X' }],
    });
    const box = computeBoxScore(game.players, game.events);
    const csv = buildBoxScoreCsv(game, box, 0, () => 'X');
    // ชื่อทีมมี comma -> ต้องถูกครอบด้วย "
    expect(csv).toContain('"Team, Inc vs B"');
  });

  it('มีแถว Team (no player) เมื่อมีสถิติทีมไม่ระบุตัว', () => {
    const game = createGame({
      teamName: 'A',
      opponentName: 'B',
      minutesPerQuarter: 10,
      quarters: 4,
      players: [{ number: '4', name: 'X' }],
    });
    game.events = [
      { id: 't1', kind: 'REB', isTeam: true, quarter: 1, clockMs: 0, ts: Date.now() },
    ];
    const box = computeBoxScore(game.players, game.events);
    const csv = buildBoxScoreCsv(game, box, 0, () => 'X');
    expect(csv).toContain('Team (no player),');
  });
});
