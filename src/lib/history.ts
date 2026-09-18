import type { Game } from '../types';
import { matchTimeOf } from './format';

/** ผลการจัดกลุ่มเกมใน History */
export interface HistoryGroups {
  /** กลุ่มยังไม่ End: active(บนสุด) -> overdue(เพิ่งเลยอยู่บน) -> upcoming(จะถึงก่อนอยู่บน) */
  ongoing: Game[];
  /** กลุ่ม End แล้ว: ใหม่ -> เก่า */
  finished: Game[];
}

/**
 * จัดกลุ่ม + เรียงเกมใน History (ทาง B)
 *
 * กลุ่ม ongoing (ยังไม่ finished) เรียงตามลำดับความสำคัญ:
 *   1) เกมที่กำลังแก้อยู่ (id === activeId) — บนสุดเสมอ
 *   2) overdue: เวลาแข่งเลย now ไปแล้ว — "เพิ่งเลยอยู่บน" (scheduledAt มาก -> น้อย)
 *   3) upcoming: ยังไม่ถึงเวลา — "จะถึงก่อนอยู่บน" (scheduledAt น้อย -> มาก)
 *
 * กลุ่ม finished เรียงใหม่ -> เก่า (scheduledAt มาก -> น้อย)
 *
 * @param games   รายการเกมทั้งหมด (รวมเกม active)
 * @param activeId id ของเกมที่กำลังแก้อยู่
 * @param now     เวลาปัจจุบัน (epoch ms) — ฉีดเข้ามาเพื่อทดสอบง่าย
 */
export function groupHistory(
  games: Game[],
  activeId: string,
  now: number = Date.now(),
): HistoryGroups {
  const ongoing: Game[] = [];
  const finished: Game[] = [];
  for (const g of games) {
    if (g.finished) finished.push(g);
    else ongoing.push(g);
  }

  ongoing.sort((a, b) => {
    // active pin บนสุดเสมอ
    const aActive = a.id === activeId ? 1 : 0;
    const bActive = b.id === activeId ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;

    const ta = matchTimeOf(a);
    const tb = matchTimeOf(b);
    const aOverdue = ta <= now;
    const bOverdue = tb <= now;

    // overdue มาก่อน upcoming เสมอ
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;

    if (aOverdue) {
      // ทั้งคู่ overdue: เพิ่งเลยอยู่บน = เวลามาก -> น้อย
      return tb - ta;
    }
    // ทั้งคู่ upcoming: จะถึงก่อนอยู่บน = เวลาน้อย -> มาก
    return ta - tb;
  });

  // finished: ใหม่ -> เก่า
  finished.sort((a, b) => matchTimeOf(b) - matchTimeOf(a));

  return { ongoing, finished };
}
