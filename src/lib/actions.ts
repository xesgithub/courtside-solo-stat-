import type { StatKind } from '../types';

export type ActionTone = 'make' | 'miss' | 'neutral' | 'foul';

export interface ActionDef {
  kind: StatKind;
  label: string;
  sub?: string;
  tone: ActionTone;
  /** ปุ่มหลักที่กดบ่อย (ยิง 2P/3P) แสดงใหญ่ แถวละ 2 */
  primary?: boolean;
  /** ปุ่มระดับกลาง (REB/AST/STL/BLK) แสดงเป็น grid แถวละ 4 ขนาดกลาง */
  mid?: boolean;
  /** ปุ่มรอง (TO/PF/FT) แสดงเป็นแถบเล็กข้างชื่อผู้เล่นใน ActionPad */
  quick?: boolean;
  /** กดแล้วต้องเลือกจำนวนแต้ม (1/2/3) ก่อนบันทึก — ใช้กับฟาวล์ที่ได้/เสียแต้มทันที */
  asksPoints?: boolean;
}

/** ปุ่ม action ในหน้า Live (เรียงตามลำดับที่แสดง) */
export const ACTIONS: ActionDef[] = [
  { kind: 'FG2_MAKE', label: '2PT', sub: 'Make', tone: 'make', primary: true },
  { kind: 'FG2_MISS', label: '2PT', sub: 'Miss', tone: 'miss', primary: true },
  { kind: 'FG3_MAKE', label: '3PT', sub: 'Make', tone: 'make', primary: true },
  { kind: 'FG3_MISS', label: '3PT', sub: 'Miss', tone: 'miss', primary: true },
  { kind: 'REB', label: 'REB', sub: 'Rebound', tone: 'neutral', mid: true },
  { kind: 'AST', label: 'AST', sub: 'Assist', tone: 'neutral', mid: true },
  { kind: 'STL', label: 'STL', sub: 'Steal', tone: 'neutral', mid: true },
  { kind: 'BLK', label: 'BLK', sub: 'Block', tone: 'neutral', mid: true },
  { kind: 'TO', label: 'Turnover', sub: 'Turnover', tone: 'neutral', quick: true },
  { kind: 'FOUL_DRAWN', label: 'Foul +', sub: 'โดนฟาวล์ ได้แต้ม', tone: 'make', asksPoints: true, quick: true },
  { kind: 'PF', label: 'Foul −', sub: 'ทำฟาวล์ เสียแต้ม', tone: 'foul', asksPoints: true, quick: true },
  { kind: 'FT_MAKE', label: 'FT ✓', sub: 'Free throw make', tone: 'make', quick: true },
  { kind: 'FT_MISS', label: 'FT ✗', sub: 'Free throw miss', tone: 'miss', quick: true },
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
