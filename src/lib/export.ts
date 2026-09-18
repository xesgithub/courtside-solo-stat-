import type { Game } from '../types';
import type { BoxScore, PlayerLine } from './stats';

/** escape ค่า 1 ช่องของ CSV: ครอบด้วย " ถ้ามี , " หรือขึ้นบรรทัดใหม่ */
function csvCell(value: string | number): string {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/** รวม 1 แถวจาก cells เป็นสตริง CSV */
function csvRow(cells: (string | number)[]): string {
  return cells.map(csvCell).join(',');
}

/** ทำ FG แบบ "made/att" */
function madeAtt(made: number, att: number): string {
  return `${made}/${att}`;
}

/**
 * สร้างเนื้อหา CSV ของ Box Score (ทีมเรา) — เปิดใน Excel / Google Sheets ได้
 * มี: หัวเกม, ตารางผู้เล่น, แถว Team (ถ้ามี), แถว Total
 * นำหน้าด้วย BOM (\uFEFF) เพื่อให้ Excel อ่านภาษาไทย/UTF-8 ถูก
 */
export function buildBoxScoreCsv(
  game: Game,
  box: BoxScore,
  opponentScore: number,
  playerName: (id: string) => string,
): string {
  const lines: string[] = [];

  // ส่วนหัว: ข้อมูลเกม
  lines.push(csvRow(['Match', `${game.teamName} vs ${game.opponentName}`]));
  lines.push(csvRow(['Date', game.date]));
  lines.push(csvRow(['Score', `${box.teamScore} - ${opponentScore}`]));
  lines.push(''); // เว้นบรรทัด

  // หัวคอลัมน์ตาราง
  const header = [
    'Player',
    'PTS',
    'FG',
    'FG%',
    '3PT',
    '3P%',
    'REB',
    'AST',
    'STL',
    'BLK',
    'TO',
    'PF',
  ];
  lines.push(csvRow(header));

  const pctStr = (m: number, a: number) =>
    a > 0 ? Math.round((m / a) * 100) + '%' : '';

  const rowFor = (label: string, l: PlayerLine): string =>
    csvRow([
      label,
      l.pts,
      madeAtt(l.fg2m + l.fg3m, l.fg2a + l.fg3a),
      pctStr(l.fg2m + l.fg3m, l.fg2a + l.fg3a),
      madeAtt(l.fg3m, l.fg3a),
      pctStr(l.fg3m, l.fg3a),
      l.reb,
      l.ast,
      l.stl,
      l.blk,
      l.to,
      l.pf,
    ]);

  // แถวผู้เล่น
  for (const l of box.lines) {
    lines.push(rowFor(playerName(l.playerId), l));
  }

  // แถว Team (ถ้ามีสถิติที่ไม่ระบุตัว)
  const t = box.teamLine;
  if (t.pts || t.reb || t.ast || t.stl || t.blk || t.to || t.pf) {
    lines.push(rowFor('Team (no player)', t));
  }

  // แถวรวม
  lines.push(rowFor('Total', box.totals));

  return '\uFEFF' + lines.join('\r\n');
}

/** ดาวน์โหลดสตริงเป็นไฟล์ CSV */
export function downloadCsv(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
