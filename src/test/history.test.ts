import { describe, it, expect } from 'vitest';
import { groupHistory } from '../lib/history';
import { createGame } from '../lib/mock';
import type { Game } from '../types';

const NOW = new Date('2026-09-18T12:00:00').getTime();
const HOUR = 60 * 60 * 1000;

function game(name: string, scheduledAt: number, finished = false): Game {
  const g = createGame({
    teamName: name,
    opponentName: 'X',
    minutesPerQuarter: 10,
    quarters: 4,
    scheduledAt,
    players: [{ number: '4', name: 'A' }],
  });
  g.finished = finished;
  return g;
}

describe('groupHistory (ทาง B)', () => {
  it('แยกกลุ่ม ongoing กับ finished ถูกต้อง', () => {
    const a = game('A', NOW - HOUR);
    const b = game('B', NOW + HOUR, true);
    const { ongoing, finished } = groupHistory([a, b], 'none', NOW);
    expect(ongoing.map((g) => g.teamName)).toEqual(['A']);
    expect(finished.map((g) => g.teamName)).toEqual(['B']);
  });

  it('active ถูก pin บนสุดของกลุ่ม ongoing เสมอ', () => {
    const active = game('Active', NOW + 5 * HOUR); // upcoming ไกลสุด
    const overdue = game('Overdue', NOW - HOUR);
    const upcoming = game('Upcoming', NOW + HOUR);
    const { ongoing } = groupHistory([overdue, upcoming, active], active.id, NOW);
    expect(ongoing[0].teamName).toBe('Active');
  });

  it('overdue มาก่อน upcoming และ overdue เพิ่งเลยอยู่บน', () => {
    const justOverdue = game('JustOverdue', NOW - HOUR); // เพิ่งเลย
    const longOverdue = game('LongOverdue', NOW - 5 * HOUR); // เลยนาน
    const soon = game('Soon', NOW + HOUR);
    const later = game('Later', NOW + 5 * HOUR);
    const { ongoing } = groupHistory(
      [later, longOverdue, soon, justOverdue],
      'none',
      NOW,
    );
    // overdue (เพิ่งเลยก่อน) -> upcoming (ใกล้ก่อน)
    expect(ongoing.map((g) => g.teamName)).toEqual([
      'JustOverdue',
      'LongOverdue',
      'Soon',
      'Later',
    ]);
  });

  it('finished เรียงใหม่ -> เก่า', () => {
    const old = game('Old', NOW - 10 * HOUR, true);
    const recent = game('Recent', NOW - HOUR, true);
    const { finished } = groupHistory([old, recent], 'none', NOW);
    expect(finished.map((g) => g.teamName)).toEqual(['Recent', 'Old']);
  });
});
