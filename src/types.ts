// โมเดลข้อมูลหลักของ COURTSIDE Solo Stat
// บันทึกสถิติเฉพาะ "ทีมเรา" รายบุคคล ส่วนคู่แข่งเก็บแค่คะแนนรวม

/** ประเภทของสถิติที่บันทึกได้ต่อผู้เล่น 1 คน */
export type StatKind =
  | 'FG2_MAKE' // ยิง 2 แต้ม เข้า (+2)
  | 'FG2_MISS' // ยิง 2 แต้ม พลาด
  | 'FG3_MAKE' // ยิง 3 แต้ม เข้า (+3)
  | 'FG3_MISS' // ยิง 3 แต้ม พลาด
  | 'FT_MAKE' // ฟรีโธรว์/แต้มจุดโทษ (+1) — ทำเผื่อไว้
  | 'REB' // รีบาวด์ (รวม รุก/รับ)
  | 'AST' // แอสซิสต์
  | 'STL' // สตีล
  | 'BLK' // บล็อก
  | 'TO' // เทิร์นโอเวอร์
  | 'PF' // ฟาวล์ (ทีมเราฟาวล์ -> คู่แข่ง +1)
  | 'PTS_ADJ'; // ปรับแต้มทีมเราแบบเร็ว (ไม่ระบุตัว) พก delta ใน points

/** ผู้เล่นทีมเรา */
export interface Player {
  id: string;
  number: string; // หมายเลขเสื้อ (เก็บเป็น string เพื่อคงรูปแบบ เช่น "07")
  name: string;
  isStarter?: boolean; // ปักหมุด (pin) ผู้เล่นเด่น -> ดันขึ้นบน + การ์ดเด่นขึ้น (ไม่ใช้คำนวณ)
}

/**
 * เหตุการณ์สถิติ 1 รายการ
 * - ถ้าเป็นสถิติของผู้เล่น: มี playerId
 * - team = true หมายถึงสถิติของทีม (เช่น Assist/Rebound ที่มองไม่ทันว่าใคร)
 */
export interface StatEvent {
  id: string;
  kind: StatKind;
  playerId?: string; // undefined เมื่อเป็น team stat
  isTeam?: boolean; // true = ให้เครดิตทีม ไม่ระบุตัวผู้เล่น
  quarter: number; // อยู่ควอเตอร์ไหนตอนบันทึก
  clockMs: number; // เวลาในนาฬิกา ณ ตอนบันทึก (ms ที่เหลือ)
  ts: number; // timestamp จริง (Date.now) ไว้เรียงลำดับ
  points?: number; // ใช้กับ PTS_ADJ เท่านั้น: +1 / -1 (ปรับแต้มทีมเราแบบเร็ว)
  note?: string;
}

/** เหตุการณ์ปรับคะแนนคู่แข่ง (+1 / -1) */
export interface OpponentScoreEvent {
  id: string;
  delta: number; // +1 หรือ -1 (หรือค่าอื่นจากการแก้มือ)
  quarter: number;
  clockMs: number;
  ts: number;
}

export interface Clock {
  quarter: number; // ควอเตอร์ปัจจุบัน (เริ่มที่ 1)
  remainingMs: number; // เวลาที่เหลือใน ms
  running: boolean;
}

export interface GameConfig {
  quarters: number; // จำนวนควอเตอร์
  minutesPerQuarter: number; // นาทีต่อควอเตอร์
}

export interface Game {
  id: string;
  name: string;
  date: string; // ISO date (YYYY-MM-DD) — คงไว้เพื่อ backward-compat/ชื่อไฟล์
  /** วัน-เวลาแข่ง (epoch ms) — แหล่งความจริงหลักของเวลาแข่ง ตั้ง/แก้ได้เอง
   *  เกมเก่าที่ไม่มีค่านี้ ให้ fallback ไปใช้ date/createdAt */
  scheduledAt?: number;
  config: GameConfig;
  teamName: string; // ชื่อทีมเรา
  opponentName: string; // ชื่อคู่แข่ง
  players: Player[]; // ผู้เล่นทีมเรา
  events: StatEvent[]; // สถิติทีมเรา
  opponentEvents: OpponentScoreEvent[]; // การปรับคะแนนคู่แข่ง
  clock: Clock;
  createdAt: number;
  updatedAt: number;
  finished?: boolean;
}
