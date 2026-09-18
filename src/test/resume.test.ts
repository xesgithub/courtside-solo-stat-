import { describe, it, expect, beforeEach } from 'vitest';
import { archiveGame, deleteSavedGame, loadSavedGames } from '../lib/storage';
import { createGame } from '../lib/mock';
import type { Game } from '../types';

/** สร้างเกมเปล่าสำหรับทดสอบ (ยังไม่มี event) */
function makeGame(teamName: string): Game {
  return createGame({
    teamName,
    opponentName: 'Opp',
    minutesPerQuarter: 10,
    quarters: 4,
    players: [{ number: '4', name: 'A' }],
  });
}

/**
 * จำลอง flow ของ resumeSavedGame (ส่วนที่แตะ storage):
 * 1) archive เกม active ปัจจุบันเสมอ
 * 2) ลบเกมเป้าหมายออกจากคลัง
 * คืน { list, target }
 */
function simulateResume(activeGame: Game, targetId: string) {
  archiveGame(activeGame);
  const list = deleteSavedGame(targetId);
  return list;
}

describe('resume saved game flow', () => {
  beforeEach(() => localStorage.clear());

  it('เกม active ไม่หาย แม้ยังไม่มี event (ถูก archive เข้า History)', () => {
    // มีเกมเป้าหมายรออยู่ใน History แล้ว 1 เกม
    const target = makeGame('Target');
    archiveGame(target);

    // เกม active ปัจจุบัน ยังไม่มี event เลย
    const active = makeGame('Active');
    expect(active.events.length).toBe(0);

    // resume เกม target
    const list = simulateResume(active, target.id);

    // เกม active ต้องถูกเก็บเข้า History (ไม่หาย)
    expect(list.some((g) => g.id === active.id)).toBe(true);
    // เกม target ถูกดึงออกจาก History (ไปเป็น active แทน)
    expect(list.some((g) => g.id === target.id)).toBe(false);
  });

  it('ไม่เกิดรายการซ้ำเมื่อ resume แล้วสลับกลับไปมา', () => {
    const gameA = makeGame('A');
    const gameB = makeGame('B');
    archiveGame(gameB); // B รออยู่ใน History

    // active = A, resume B -> A เข้า History, B ออก
    simulateResume(gameA, gameB.id);
    let list = loadSavedGames();
    expect(list.map((g) => g.id).sort()).toEqual([gameA.id].sort());

    // ตอนนี้ active = B, resume A กลับ -> B เข้า History, A ออก
    simulateResume(gameB, gameA.id);
    list = loadSavedGames();
    // ต้องเหลือแค่ B ตัวเดียว ไม่มีซ้ำ
    expect(list.map((g) => g.id)).toEqual([gameB.id]);
    expect(list.filter((g) => g.id === gameB.id).length).toBe(1);
  });
});

describe('history list & delete rules', () => {
  beforeEach(() => localStorage.clear());

  /** รวมเกม active เข้ากับคลังแบบไม่ซ้ำ id (ตรงกับ historyGames ใน App) */
  function mergeHistory(active: Game, saved: Game[]): Game[] {
    return [active, ...saved.filter((g) => g.id !== active.id)];
  }

  it('เกม active ปรากฏใน history เสมอ และไม่ซ้ำแม้อยู่ในคลังด้วย', () => {
    const active = makeGame('Active');
    // จำลองว่า active เคยถูก archive ไว้ในคลังด้วย (id เดียวกัน)
    archiveGame(active);
    const other = makeGame('Other');
    archiveGame(other);

    const merged = mergeHistory(active, loadSavedGames());
    // active อยู่บนสุด
    expect(merged[0].id).toBe(active.id);
    // ไม่ซ้ำ
    expect(merged.filter((g) => g.id === active.id).length).toBe(1);
    // เกมอื่นยังอยู่
    expect(merged.some((g) => g.id === other.id)).toBe(true);
  });

  it('ลบได้เฉพาะเกมที่ finished แล้วเท่านั้น (กติกา canDelete)', () => {
    const notFinished = makeGame('Live');
    const finished = { ...makeGame('Done'), finished: true };
    // กติกาเดียวกับใน ReviewPage: canDelete = !!game.finished
    expect(!!notFinished.finished).toBe(false);
    expect(!!finished.finished).toBe(true);
  });
});
