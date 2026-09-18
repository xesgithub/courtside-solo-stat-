import { describe, it, expect } from 'vitest';
import { computeLeaders, type PlayerLine } from '../lib/stats';

function line(id: string, pts: number, reb: number, ast: number): PlayerLine {
  return {
    playerId: id,
    pts,
    fg2m: 0,
    fg2a: 0,
    fg3m: 0,
    fg3a: 0,
    ftm: 0,
    reb,
    ast,
    stl: 0,
    blk: 0,
    to: 0,
    pf: 0,
  };
}

describe('computeLeaders', () => {
  it('คืนค่าสูงสุดของแต่ละหมวด', () => {
    const lines = [line('a', 22, 6, 5), line('b', 16, 4, 7), line('c', 13, 11, 2)];
    expect(computeLeaders(lines)).toEqual({ pts: 22, reb: 11, ast: 7 });
  });

  it('ไม่มีผู้เล่น -> ค่าเป็น 0 ทั้งหมด', () => {
    expect(computeLeaders([])).toEqual({ pts: 0, reb: 0, ast: 0 });
  });

  it('ทุกคนเป็น 0 -> leader เป็น 0 (จะได้ไม่ไปเน้นเลข 0)', () => {
    const lines = [line('a', 0, 0, 0), line('b', 0, 0, 0)];
    expect(computeLeaders(lines)).toEqual({ pts: 0, reb: 0, ast: 0 });
  });

  it('เสมอกัน -> คืนค่าที่เท่ากันนั้น (ทั้งคู่ถือเป็นผู้นำ)', () => {
    const lines = [line('a', 10, 5, 3), line('b', 10, 2, 3)];
    const leaders = computeLeaders(lines);
    expect(leaders.pts).toBe(10); // a, b เท่ากัน
    expect(leaders.ast).toBe(3); // a, b เท่ากัน
    expect(leaders.reb).toBe(5); // a สูงกว่า
  });
});
