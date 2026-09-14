/** แปลง ms เป็น mm:ss */
export function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * ป้ายชื่อช่วงเวลาแข่ง: ควอเตอร์ปกติ = Q1..Qn, เกินจากนั้น = ต่อเวลา EX1, EX2, ...
 * @param quarter ลำดับช่วงปัจจุบัน (เริ่มที่ 1)
 * @param totalQuarters จำนวนควอเตอร์ปกติของเกม (เช่น 4)
 */
export function formatPeriod(quarter: number, totalQuarters: number): string {
  if (quarter > totalQuarters) return `EX${quarter - totalQuarters}`;
  return `Q${quarter}`;
}
