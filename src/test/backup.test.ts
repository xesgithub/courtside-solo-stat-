import { describe, it, expect } from 'vitest';
import { buildBackup, parseBackup, mergeGames, isValidGame } from '../lib/backup';
import { createGame } from '../lib/mock';
import type { Game } from '../types';

function makeGame(name: string): Game {
  return createGame({
    teamName: name,
    opponentName: 'Opp',
    minutesPerQuarter: 10,
    quarters: 4,
    players: [{ number: '4', name: 'A' }],
  });
}

describe('backup export/import', () => {
  it('round-trip: buildBackup แล้ว parseBackup ได้เกมเดิมครบ', () => {
    const a = makeGame('A');
    const b = makeGame('B');
    const json = buildBackup([a, b]);
    const parsed = parseBackup(json);
    expect(parsed.map((g) => g.id).sort()).toEqual([a.id, b.id].sort());
    expect(parsed.map((g) => g.teamName).sort()).toEqual(['A', 'B']);
  });

  it('parseBackup รองรับ array เกมล้วน (ไฟล์เก่า)', () => {
    const a = makeGame('A');
    const parsed = parseBackup(JSON.stringify([a]));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe(a.id);
  });

  it('parseBackup โยน error เมื่อไฟล์ไม่ใช่ JSON', () => {
    expect(() => parseBackup('not json {')).toThrow();
  });

  it('parseBackup โยน error เมื่อไม่มีเกมที่ใช้ได้', () => {
    expect(() => parseBackup(JSON.stringify({ games: [{ foo: 1 }] }))).toThrow();
  });

  it('isValidGame คัดกรองโครงที่ไม่ครบ', () => {
    expect(isValidGame(makeGame('X'))).toBe(true);
    expect(isValidGame({ id: 'x' })).toBe(false);
    expect(isValidGame(null)).toBe(false);
  });
});

describe('mergeGames', () => {
  it('id ใหม่ -> เพิ่ม, ไม่ลบของเดิม', () => {
    const a = makeGame('A');
    const b = makeGame('B');
    const { games, added, updated } = mergeGames([a], [b]);
    expect(added).toBe(1);
    expect(updated).toBe(0);
    expect(games.map((g) => g.id).sort()).toEqual([a.id, b.id].sort());
  });

  it('id ซ้ำ -> เก็บตัวที่ updatedAt ใหม่กว่า', () => {
    const a = makeGame('A');
    const aNewer: Game = { ...a, teamName: 'A-new', updatedAt: a.updatedAt + 1000 };
    const { games, added, updated } = mergeGames([a], [aNewer]);
    expect(added).toBe(0);
    expect(updated).toBe(1);
    expect(games).toHaveLength(1);
    expect(games[0].teamName).toBe('A-new');
  });

  it('id ซ้ำ แต่ incoming เก่ากว่า -> คงของเดิม', () => {
    const a = makeGame('A');
    const aOlder: Game = { ...a, teamName: 'A-old', updatedAt: a.updatedAt - 1000 };
    const { games, updated } = mergeGames([a], [aOlder]);
    expect(updated).toBe(0);
    expect(games[0].teamName).toBe(a.teamName);
  });
});
