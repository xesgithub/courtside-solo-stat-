import type { Game } from '../types';

const STORAGE_KEY = 'courtside.currentGame';
const SAVED_KEY = 'courtside.savedGames';

/** โหลดเกมล่าสุดจาก localStorage (คืน null ถ้าไม่มี/พัง) */
export function loadGame(): Game | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Game;
    // ตรวจโครงพื้นฐานกันข้อมูลเก่า/พัง
    if (!parsed || !Array.isArray(parsed.players) || !parsed.clock) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** เซฟเกมลง localStorage */
export function saveGame(game: Game): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  } catch {
    // เต็ม/ปิด storage — เงียบไว้ ไม่ให้แอปล้ม
  }
}

/** ล้างเกมปัจจุบันที่เซฟไว้ (ไม่แตะคลังเกมเก่า) */
export function clearGame(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

/** โหลดคลังเกมที่บันทึกไว้ (ใหม่สุดอยู่บน) */
export function loadSavedGames(): Game[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Game[];
    if (!Array.isArray(parsed)) return [];
    // กรองเฉพาะรายการที่โครงพื้นฐานครบ
    return parsed.filter((g) => g && Array.isArray(g.players) && !!g.clock);
  } catch {
    return [];
  }
}

/** เขียนคลังเกมทั้งก้อนลง localStorage */
function writeSavedGames(games: Game[]): void {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(games));
  } catch {
    /* เต็ม/ปิด storage — เงียบไว้ */
  }
}

/**
 * เก็บเกมเข้าคลัง (archive) — ถ้ามี id ซ้ำจะอัปเดตทับรายการเดิม
 * คืนคลังล่าสุดหลังบันทึก (ใหม่สุดอยู่บน)
 */
export function archiveGame(game: Game): Game[] {
  const list = loadSavedGames();
  const idx = list.findIndex((g) => g.id === game.id);
  if (idx >= 0) {
    list[idx] = game;
  } else {
    list.unshift(game);
  }
  writeSavedGames(list);
  return list;
}

/** ลบเกมออกจากคลัง คืนคลังล่าสุดหลังลบ */
export function deleteSavedGame(id: string): Game[] {
  const list = loadSavedGames().filter((g) => g.id !== id);
  writeSavedGames(list);
  return list;
}
