import type { Game } from '../types';

/** เวอร์ชันของรูปแบบไฟล์สำรอง (เผื่อเปลี่ยนโครงในอนาคต) */
export const BACKUP_FORMAT_VERSION = 1;

export interface BackupFile {
  kind: 'courtside-backup';
  formatVersion: number;
  exportedAt: number;
  games: Game[];
}

/** ตรวจว่า object หน้าตาเป็น Game ที่ใช้ได้ (โครงพื้นฐานครบ) */
export function isValidGame(g: unknown): g is Game {
  if (!g || typeof g !== 'object') return false;
  const o = g as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    Array.isArray(o.players) &&
    Array.isArray(o.events) &&
    !!o.clock &&
    typeof o.clock === 'object'
  );
}

/**
 * สร้างข้อมูลสำรอง (JSON string) จากเกมทั้งหมด
 * @param games รายการเกมทั้งหมด (currentGame + savedGames รวมกัน ไม่ซ้ำ id)
 */
export function buildBackup(games: Game[]): string {
  const payload: BackupFile = {
    kind: 'courtside-backup',
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: Date.now(),
    games,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * แยกเกมออกจากไฟล์สำรอง (รองรับทั้งรูปแบบ BackupFile และ array เกมล้วน)
 * โยน Error ถ้า parse ไม่ได้/โครงไม่ถูก
 */
export function parseBackup(raw: string): Game[] {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error('ไฟล์ไม่ใช่ JSON ที่ถูกต้อง');
  }

  // รูปแบบมาตรฐาน { kind, games: [...] }
  let games: unknown;
  if (Array.isArray(data)) {
    // เผื่อไฟล์เก่า/ที่ export มาเป็น array ล้วน
    games = data;
  } else if (data && typeof data === 'object' && 'games' in data) {
    games = (data as Record<string, unknown>).games;
  } else {
    throw new Error('ไฟล์สำรองไม่ถูกต้อง (ไม่พบรายการเกม)');
  }

  if (!Array.isArray(games)) {
    throw new Error('ไฟล์สำรองไม่ถูกต้อง (games ไม่ใช่ list)');
  }

  const valid = games.filter(isValidGame) as Game[];
  if (valid.length === 0) {
    throw new Error('ไม่พบเกมที่ใช้ได้ในไฟล์สำรอง');
  }
  return valid;
}

export interface MergeResult {
  games: Game[];
  added: number;
  updated: number;
}

/**
 * รวมเกมที่ import เข้ากับเกมเดิม (merge ตาม id)
 * - id ใหม่ -> เพิ่ม
 * - id ซ้ำ -> ใช้ตัวที่ updatedAt ใหม่กว่า (กันเขียนทับข้อมูลที่ใหม่กว่า)
 */
export function mergeGames(existing: Game[], incoming: Game[]): MergeResult {
  const byId = new Map<string, Game>();
  for (const g of existing) byId.set(g.id, g);

  let added = 0;
  let updated = 0;
  for (const g of incoming) {
    const cur = byId.get(g.id);
    if (!cur) {
      byId.set(g.id, g);
      added++;
    } else {
      // เก็บตัวที่ updatedAt ใหม่กว่า
      const curT = cur.updatedAt ?? 0;
      const inT = g.updatedAt ?? 0;
      if (inT > curT) {
        byId.set(g.id, g);
        updated++;
      }
    }
  }

  return { games: [...byId.values()], added, updated };
}
