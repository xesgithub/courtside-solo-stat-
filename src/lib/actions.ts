import type { StatKind } from '../types';

export type ActionTone = 'make' | 'miss' | 'neutral' | 'foul';

export interface ActionDef {
  kind: StatKind;
  label: string;
  sub?: string;
  tone: ActionTone;
  /** กลุ่มการแสดงผลในหน้า Live:
   *  - primary: ยิง 2P/3P (grid 2×2 ใหญ่สุด)
   *  - wide: ปุ่มยาวเต็มแถว (TO)
   *  - foul: Foul+/Foul− (grid 2 ปุ่ม)
   *  - ft: FT✓/FT✗ (grid 2 ปุ่ม)
   *  - quick: REB/AST/STL/BLK (แถวเล็ก ข้างชื่อตอนเลือกคน) */
  group: 'primary' | 'wide' | 'foul' | 'ft' | 'quick';
  /** กดแล้วต้องเลือกจำนวนแต้ม (1/2/3) ก่อนบันทึก — ใช้กับฟาวล์ที่ได้/เสียแต้มทันที */
  asksPoints?: boolean;
}

/** ปุ่ม action ในหน้า Live (เรียงตามลำดับที่แสดง) */
export const ACTIONS: ActionDef[] = [
  { kind: 'FG2_MAKE', label: '2PT', sub: 'Make', tone: 'make', group: 'primary' },
  { kind: 'FG2_MISS', label: '2PT', sub: 'Miss', tone: 'miss', group: 'primary' },
  { kind: 'FG3_MAKE', label: '3PT', sub: 'Make', tone: 'make', group: 'primary' },
  { kind: 'FG3_MISS', label: '3PT', sub: 'Miss', tone: 'miss', group: 'primary' },
  { kind: 'TO', label: 'Turnover', sub: 'Turnover', tone: 'neutral', group: 'wide' },
  { kind: 'FOUL_DRAWN', label: 'Foul +', sub: 'โดนฟาวล์ ได้แต้ม', tone: 'make', asksPoints: true, group: 'foul' },
  { kind: 'PF', label: 'Foul −', sub: 'ทำฟาวล์ เสียแต้ม', tone: 'foul', asksPoints: true, group: 'foul' },
  { kind: 'FT_MAKE', label: 'FT ✓', sub: 'Free throw make', tone: 'make', group: 'ft' },
  { kind: 'FT_MISS', label: 'FT ✗', sub: 'Free throw miss', tone: 'miss', group: 'ft' },
  { kind: 'REB', label: 'REB', sub: 'Rebound', tone: 'neutral', group: 'quick' },
  { kind: 'AST', label: 'AST', sub: 'Assist', tone: 'neutral', group: 'quick' },
  { kind: 'STL', label: 'STL', sub: 'Steal', tone: 'neutral', group: 'quick' },
  { kind: 'BLK', label: 'BLK', sub: 'Block', tone: 'neutral', group: 'quick' },
];

export const STAT_LABEL: Record<StatKind, string> = {
  FG2_MAKE: '2PT Make',
  FG2_MISS: '2PT Miss',
  FG3_MAKE: '3PT Make',
  FG3_MISS: '3PT Miss',
  FT_MAKE: 'FT Make',
  FT_MISS: 'FT Miss',
  REB: 'Rebound',
  AST: 'Assist',
  STL: 'Steal',
  BLK: 'Block',
  TO: 'Turnover',
  PF: 'Foul (−pts)',
  FOUL_DRAWN: 'Foul (+pts)',
  PTS_ADJ: 'Team pts adj',
};
