import type { Game } from '../types';

/** สร้าง id สั้นๆ */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** เกมตัวอย่างสำหรับลองเล่น UI */
export function createMockGame(): Game {
  const minutesPerQuarter = 12;
  return {
    id: uid(),
    name: 'Friendly match',
    date: new Date().toISOString().slice(0, 10),
    config: { quarters: 4, minutesPerQuarter },
    teamName: 'Hoops Vibe',
    opponentName: 'Chillout',
    players: [
      { id: 'p1', number: '9', name: 'JAY', isStarter: true },
      { id: 'p2', number: '12', name: 'โอม', isStarter: true },
      { id: 'p3', number: '15', name: 'แมค', isStarter: true },
      { id: 'p4', number: '4', name: 'ลีด', isStarter: true },
      { id: 'p5', number: '7', name: 'ต่อ', isStarter: true },
      { id: 'p6', number: '23', name: 'บอส' },
      { id: 'p7', number: '8', name: 'นัท' },
    ],
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
