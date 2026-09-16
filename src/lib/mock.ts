import type { Game, Player } from '../types';

/** สร้าง id สั้นๆ */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** ค่าตั้งต้นสำหรับสร้างเกมใหม่ (ใช้กับ NewGameModal) */
export interface NewGameConfig {
  teamName: string;
  opponentName: string;
  minutesPerQuarter: number;
  quarters: number;
  /** ชื่อ+เบอร์ผู้เล่น (ไม่ต้องมี id — สร้างให้เอง) */
  players: { number: string; name: string; isStarter?: boolean }[];
}

/** ค่าเริ่มต้นแนะนำสำหรับฟอร์มสร้างเกม */
export const DEFAULT_NEW_GAME: NewGameConfig = {
  teamName: '',
  opponentName: '',
  minutesPerQuarter: 12,
  quarters: 4,
  players: [],
};

/** ค่าตัวอย่าง (Dummy) เติมฟอร์มเร็วๆ เวลาอยากลองเล่น/สร้างไว */
export const DUMMY_NEW_GAME: NewGameConfig = {
  teamName: 'Hoops Vibe',
  opponentName: 'Chillout',
  minutesPerQuarter: 12,
  quarters: 4,
  players: [
    { number: '9', name: 'Jay', isStarter: true },
    { number: '12', name: 'Om', isStarter: true },
    { number: '15', name: 'Mac', isStarter: true },
    { number: '4', name: 'Lead', isStarter: true },
    { number: '7', name: 'Tor', isStarter: true },
    { number: '23', name: 'Boss' },
    { number: '8', name: 'Nut' },
    { number: '3', name: 'Em' },
    { number: '11', name: 'Gun' },
    { number: '21', name: 'Pun' },
  ],
};

/** สร้างเกมใหม่ (ว่างเปล่า) จากค่าที่ตั้งใน NewGameModal */
export function createGame(config: NewGameConfig): Game {
  const minutesPerQuarter = Math.max(1, Math.round(config.minutesPerQuarter));
  const quarters = Math.max(1, Math.round(config.quarters));
  const players: Player[] = config.players.map((p) => ({
    id: uid(),
    number: p.number.trim(),
    name: p.name.trim() || 'Player',
    isStarter: p.isStarter,
  }));
  return {
    id: uid(),
    name: 'Game',
    date: new Date().toISOString().slice(0, 10),
    config: { quarters, minutesPerQuarter },
    teamName: config.teamName.trim() || 'Our team',
    opponentName: config.opponentName.trim() || 'Opponent',
    players,
    events: [],
    opponentEvents: [],
    clock: {
      quarter: 1,
      remainingMs: minutesPerQuarter * 60 * 1000,
      running: false,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/** เกมตัวอย่างสำหรับลองเล่น UI (สร้างจาก dummy preset) */
export function createMockGame(): Game {
  return createGame(DUMMY_NEW_GAME);
}
