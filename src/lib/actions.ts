import type { StatKind } from '../types';

export type ActionTone = 'make' | 'miss' | 'neutral' | 'foul';

export interface ActionDef {
  kind: StatKind;
  label: string;
  sub?: string;
  tone: ActionTone;
  /** ยิงเข้า -> เด้ง popup ถาม assist */
  asksAssist?: boolean;
  /** ยิงพลาด -> เด้ง popup ถาม rebound */
  asksRebound?: boolean;
  /** ปุ่มหลักที่กดบ่อย (ยิง 2P/3P) แสดงใหญ่ แถวละ 2 */
  primary?: boolean;
  /** ปุ่มรองที่เกิดบ่อย (REB/AST/STL/BLK) แสดงเป็นแถบเล็กข้างชื่อใน ActionPad */
  quick?: boolean;
}

/** ปุ่ม action ในหน้า Live (เรียงตามลำดับที่แสดง) */
export const ACTIONS: ActionDef[] = [
  { kind: 'FG2_MAKE', label: '2PT', sub: 'Make', tone: 'make', asksAssist: true, primary: true },
  { kind: 'FG2_MISS', label: '2PT', sub: 'Miss', tone: 'miss', asksRebound: true, primary: true },
  { kind: 'FG3_MAKE', label: '3PT', sub: 'Make', tone: 'make', asksAssist: true, primary: true },
  { kind: 'FG3_MISS', label: '3PT', sub: 'Miss', tone: 'miss', asksRebound: true, primary: true },
  { kind: 'REB', label: 'REB', sub: 'Rebound', tone: 'neutral', quick: true },
  { kind: 'AST', label: 'AST', sub: 'Assist', tone: 'neutral', quick: true },
  { kind: 'STL', label: 'STL', sub: 'Steal', tone: 'neutral', quick: true },
  { kind: 'BLK', label: 'BLK', sub: 'Block', tone: 'neutral', quick: true },
  { kind: 'TO', label: 'TO', sub: 'Turnover', tone: 'neutral' },
  { kind: 'PF', label: 'PF', sub: '+1 opp', tone: 'foul' },
  { kind: 'FT_MAKE', label: 'FT', sub: '+1', tone: 'make' },
];

export const STAT_LABEL: Record<StatKind, string> = {
  FG2_MAKE: '2PT Make',
  FG2_MISS: '2PT Miss',
  FG3_MAKE: '3PT Make',
  FG3_MISS: '3PT Miss',
  FT_MAKE: 'FT +1',
  REB: 'Rebound',
  AST: 'Assist',
  STL: 'Steal',
  BLK: 'Block',
  TO: 'Turnover',
  PF: 'Foul',
  PTS_ADJ: 'Team pts adj',
};
