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
}

/** ปุ่ม action ในหน้า Live (เรียงตามลำดับที่แสดง) */
export const ACTIONS: ActionDef[] = [
  { kind: 'FG2_MAKE', label: '2PT', sub: 'เข้า', tone: 'make', asksAssist: true },
  { kind: 'FG2_MISS', label: '2PT', sub: 'พลาด', tone: 'miss', asksRebound: true },
  { kind: 'FG3_MAKE', label: '3PT', sub: 'เข้า', tone: 'make', asksAssist: true },
  { kind: 'FG3_MISS', label: '3PT', sub: 'พลาด', tone: 'miss', asksRebound: true },
  { kind: 'REB', label: 'REB', sub: 'รีบาวด์', tone: 'neutral' },
  { kind: 'AST', label: 'AST', sub: 'แอสซิสต์', tone: 'neutral' },
  { kind: 'STL', label: 'STL', sub: 'สตีล', tone: 'neutral' },
  { kind: 'BLK', label: 'BLK', sub: 'บล็อก', tone: 'neutral' },
  { kind: 'TO', label: 'TO', sub: 'เสียบอล', tone: 'neutral' },
  { kind: 'PF', label: 'PF', sub: 'ฟาวล์ (+1 คู่แข่ง)', tone: 'foul' },
  { kind: 'FT_MAKE', label: 'FT', sub: '+1', tone: 'make' },
];

export const STAT_LABEL: Record<StatKind, string> = {
  FG2_MAKE: '2PT เข้า',
  FG2_MISS: '2PT พลาด',
  FG3_MAKE: '3PT เข้า',
  FG3_MISS: '3PT พลาด',
  FT_MAKE: 'FT +1',
  REB: 'รีบาวด์',
  AST: 'แอสซิสต์',
  STL: 'สตีล',
  BLK: 'บล็อก',
  TO: 'เสียบอล',
  PF: 'ฟาวล์',
};
