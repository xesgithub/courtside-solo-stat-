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

/**
 * อ่าน "เวลาแข่ง" (epoch ms) จากเกม โดย fallback ตามลำดับ:
 * 1) scheduledAt (ฟิลด์ใหม่)  2) date (YYYY-MM-DD)  3) createdAt
 * รองรับข้อมูลเก่าที่ยังไม่มี scheduledAt
 */
export function matchTimeOf(game: {
  scheduledAt?: number;
  date?: string;
  createdAt?: number;
}): number {
  if (typeof game.scheduledAt === 'number' && !Number.isNaN(game.scheduledAt)) {
    return game.scheduledAt;
  }
  if (game.date) {
    const t = new Date(game.date + 'T00:00:00').getTime();
    if (!Number.isNaN(t)) return t;
  }
  return game.createdAt ?? 0;
}

/** แปลง epoch ms -> "18 Sep 2026 · 09:00" (อ่านง่าย แยกวันเดียวกันหลายแมตช์ด้วยเวลา) */
export function formatMatchDateTime(ms: number): string {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} · ${time}`;
}

/** แปลง epoch ms -> ค่าสำหรับ <input type="datetime-local"> (YYYY-MM-DDTHH:mm) ตามเวลาท้องถิ่น */
export function toDatetimeLocalValue(ms: number): string {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}
