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
      { id: 'p1', number: '9', name: 'Jay', isStarter: true },
      { id: 'p2', number: '12', name: 'Om', isStarter: true },
      { id: 'p3', number: '15', name: 'Mac', isStarter: true },
      { id: 'p4', number: '4', name: 'Lead', isStarter: true },
      { id: 'p5', number: '7', name: 'Tor', isStarter: true },
      { id: 'p6', number: '23', name: 'Boss' },
      { id: 'p7', number: '8', name: 'Nut' },
      { id: 'p8', number: '3', name: 'Em' },
      { id: 'p9', number: '11', name: 'Gun' },
      { id: 'p10', number: '21', name: 'Pun' },
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
