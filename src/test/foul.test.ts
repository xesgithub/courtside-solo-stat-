import { describe, it, expect } from 'vitest';
import { computeBoxScore, computeOpponentScore } from '../lib/stats';
import { createGame } from '../lib/mock';
import type { Game, StatEvent } from '../types';

function ev(partial: Partial<StatEvent> & Pick<StatEvent, 'kind'>): StatEvent {
  return {
    id: Math.random().toString(36).slice(2),
    quarter: 1,
    clockMs: 0,
    ts: Date.now(),
    ...partial,
  };
}

function makeGame(): Game {
  return createGame({
    teamName: 'Us',
    opponentName: 'Them',
    minutesPerQuarter: 10,
    quarters: 4,
    players: [{ number: '7', name: 'Jay' }],
  });
}

describe('ฟาวล์ได้/เสียแต้ม (กติกาสนาม)', () => {
  it('FOUL_DRAWN บวกแต้มเข้าทีมเราตาม points และนับ fd', () => {
    const game = makeGame();
    const pid = game.players[0].id;
    game.events = [
      ev({ kind: 'FOUL_DRAWN', playerId: pid, points: 2 }),
      ev({ kind: 'FOUL_DRAWN', playerId: pid, points: 1 }),
    ];
    const box = computeBoxScore(game.players, game.events);
    const jay = box.lines[0];
    expect(jay.pts).toBe(3); // 2 + 1
    expect(jay.fd).toBe(2); // โดนฟาวล์ 2 ครั้ง
    expect(box.teamScore).toBe(3);
  });

  it('PF ไม่บวกแต้มทีมเรา แต่บวกแต้มคู่แข่งตาม points', () => {
    const game = makeGame();
    const pid = game.players[0].id;
    game.events = [
      ev({ kind: 'PF', playerId: pid, points: 3 }),
      ev({ kind: 'PF', playerId: pid, points: 1 }),
    ];
    const box = computeBoxScore(game.players, game.events);
    const jay = box.lines[0];
    expect(jay.pts).toBe(0); // ทำฟาวล์ไม่ได้แต้มทีมเรา
    expect(jay.pf).toBe(2); // ทำฟาวล์ 2 ครั้ง
    expect(computeOpponentScore(game)).toBe(4); // 3 + 1 แต้มคู่แข่ง
  });

  it('migrate: PF เก่าที่ไม่มี points ถือเป็น 1 แต้ม (คะแนนคู่แข่งไม่เพี้ยน)', () => {
    const game = makeGame();
    const pid = game.players[0].id;
    game.events = [
      ev({ kind: 'PF', playerId: pid }), // ไม่มี points (เกมเก่า)
      ev({ kind: 'PF', playerId: pid }),
    ];
    expect(computeOpponentScore(game)).toBe(2); // 1 + 1
  });

  it('รวม opponentEvents delta กับแต้มจากฟาวล์', () => {
    const game = makeGame();
    const pid = game.players[0].id;
    game.events = [ev({ kind: 'PF', playerId: pid, points: 2 })];
    game.opponentEvents = [
      { id: 'o1', delta: 3, quarter: 1, clockMs: 0, ts: Date.now() },
    ];
    expect(computeOpponentScore(game)).toBe(5); // 3 (delta) + 2 (foul)
  });
});
