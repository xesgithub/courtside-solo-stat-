import { describe, it, expect } from 'vitest';
import { importGameFromCsv } from '../lib/csvImport';
import { computeBoxScore, computeOpponentScore } from '../lib/stats';

const SCHEDULED = new Date('2026-09-12T15:00:00').getTime();

// CSV ตัวอย่างย่อ (โครงเดียวกับไฟล์จริง) เพื่อทดสอบ logic แบบไม่ผูกไฟล์ภายนอก
const SAMPLE = `"GAME","Friendly match","DATE","2026-09-12","STATUS","final"
"TEAM","NUMBER","PLAYER","MIN","PTS","FGM","FGA","FG%","2PM","2PA","2P%","3PM","3PA","3P%","FTM","FTA","FT%","OREB","DREB","REB","AST","STL","BLK","TO","PF","'+/-"
"Hoob vibe","2","โอม","'-","13","5","11","45.5%","2","2","100.0%","3","9","33.3%","0","0","'-","'-","'-","2","0","0","0","0","0","'-"
"Hoob vibe","11","รุน","'-","7","3","4","75.0%","2","2","100.0%","1","2","50.0%","0","0","'-","'-","'-","0","0","2","0","0","0","'-"
"Hoob vibe","","TEAM TOTAL (includes team rebounds)","'-","20","8","15","","4","4","","4","11","","0","0","","","","2","0","2","0","0","0",""
"Hoob vibe","STAT MODE","players"
"Hoob vibe","SCORE CORRECTION","4","SCOREBOARD TOTAL","24","TEAM REB","0"
"Hoob vibe","Q1: 15","Q2: 4","Q3: 5","Q4: 0"
"Chill out","1","เค","'-","10","5","5","100.0%","5","5","100.0%","0","0","'-","0","0","'-","'-","'-","1","0","0","0","0","0","'-"
"Chill out","","TEAM TOTAL (includes team rebounds)","'-","10","5","5","","5","5","","0","0","","0","0","","","","1","0","0","0","0","0",""
"Chill out","SCORE CORRECTION","2","SCOREBOARD TOTAL","12","TEAM REB","0"
"Chill out","Q1: 12"`;

describe('importGameFromCsv (sample)', () => {
  it('ทีมแรก = ทีมเรา, ทีมสอง = คู่แข่ง, finished', () => {
    const g = importGameFromCsv(SAMPLE, SCHEDULED);
    expect(g.teamName).toBe('Hoob vibe');
    expect(g.opponentName).toBe('Chill out');
    expect(g.finished).toBe(true);
    expect(g.scheduledAt).toBe(SCHEDULED);
    expect(g.players.map((p) => p.name)).toEqual(['โอม', 'รุน']);
  });

  it('box score รวม PTS ตรงกับ scoreboard (รวม score correction)', () => {
    const g = importGameFromCsv(SAMPLE, SCHEDULED);
    const box = computeBoxScore(g.players, g.events);
    // ผู้เล่น: โอม 13 + รุน 7 = 20, + correction 4 = 24 (ตรง scoreboard)
    expect(box.teamScore).toBe(24);
  });

  it('REB/AST/STL รวมตรงกับผู้เล่น', () => {
    const g = importGameFromCsv(SAMPLE, SCHEDULED);
    const box = computeBoxScore(g.players, g.events);
    // โอม REB=2, รุน REB=0 -> รวม 2
    expect(box.totals.reb).toBe(2);
    // โอม STL=0, รุน STL=2 -> รวม 2
    expect(box.totals.stl).toBe(2);
    // AST ทั้งคู่ = 0
    expect(box.totals.ast).toBe(0);
  });

  it('คะแนนคู่แข่ง = scoreboard total ของทีมสอง (12)', () => {
    const g = importGameFromCsv(SAMPLE, SCHEDULED);
    expect(computeOpponentScore(g)).toBe(12);
  });

  it('รายผู้เล่น: โอม 3PM=3 -> box คำนวณ 3PT made = 3', () => {
    const g = importGameFromCsv(SAMPLE, SCHEDULED);
    const box = computeBoxScore(g.players, g.events);
    const om = box.lines.find(
      (l) => g.players.find((p) => p.id === l.playerId)?.name === 'โอม',
    )!;
    expect(om.fg3m).toBe(3);
    expect(om.fg2m).toBe(2);
    expect(om.pts).toBe(13);
  });
});

describe('importGameFromCsv (ข้อมูลจริงจากไฟล์ตัวอย่าง)', () => {
  // เนื้อหาจริงจากไฟล์ export (Hoob vibe 41 vs Chill out 74)
  const REAL = `"GAME","Friendly match","DATE","2026-09-12","STATUS","final"
"TEAM","NUMBER","PLAYER","MIN","PTS","FGM","FGA","FG%","2PM","2PA","2P%","3PM","3PA","3P%","FTM","FTA","FT%","OREB","DREB","REB","AST","STL","BLK","TO","PF","'+/-"
"Hoob vibe","27","ต่อ","'-","0","0","4","0.0%","0","0","'-","0","4","0.0%","0","0","'-","'-","'-","1","1","2","0","0","1","'-"
"Hoob vibe","2","โอม","'-","13","5","11","45.5%","2","2","100.0%","3","9","33.3%","0","0","'-","'-","'-","2","0","0","0","0","0","'-"
"Hoob vibe","3","แมค","'-","3","1","4","25.0%","0","3","0.0%","1","1","100.0%","0","0","'-","'-","'-","1","0","1","0","2","0","'-"
"Hoob vibe","4","ลิด","'-","0","0","1","0.0%","0","1","0.0%","0","0","'-","0","0","'-","'-","'-","1","0","0","0","1","0","'-"
"Hoob vibe","5","ปริ้น","'-","4","2","9","22.2%","2","9","22.2%","0","0","'-","0","0","'-","'-","'-","2","1","0","0","0","0","'-"
"Hoob vibe","6","เค","'-","2","1","1","100.0%","1","1","100.0%","0","0","'-","0","0","'-","'-","'-","1","0","0","0","0","0","'-"
"Hoob vibe","7","เร","'-","4","2","3","66.7%","2","2","100.0%","0","1","0.0%","0","0","'-","'-","'-","0","0","0","0","0","0","'-"
"Hoob vibe","8","ท๊อป","'-","0","0","2","0.0%","0","1","0.0%","0","1","0.0%","0","0","'-","'-","'-","2","0","0","2","0","0","'-"
"Hoob vibe","9","ปาล์ม","'-","0","0","2","0.0%","0","2","0.0%","0","0","'-","0","0","'-","'-","'-","4","1","0","3","2","0","'-"
"Hoob vibe","10","พร","'-","2","1","6","16.7%","1","6","16.7%","0","0","'-","0","0","'-","'-","'-","5","0","0","0","0","0","'-"
"Hoob vibe","1","ลูก","'-","2","1","11","9.1%","1","8","12.5%","0","3","0.0%","0","0","'-","'-","'-","0","0","1","0","2","0","'-"
"Hoob vibe","11","รุน","'-","7","3","4","75.0%","2","2","100.0%","1","2","50.0%","0","0","'-","'-","'-","0","0","2","0","0","0","'-"
"Hoob vibe","","TEAM TOTAL (includes team rebounds)","'-","37","16","58","27.6%","11","37","29.7%","5","21","23.8%","0","0","'-","'-","'-","19","3","6","5","7","1","'-"
"Hoob vibe","STAT MODE","players"
"Hoob vibe","SCORE CORRECTION","4","SCOREBOARD TOTAL","41","TEAM REB","0"
"Hoob vibe","Q1: 15","Q2: 4","Q3: 11","Q4: 11"
"Chill out","1","เค","'-","68","32","32","100.0%","28","28","100.0%","4","4","100.0%","0","0","'-","'-","'-","7","0","0","0","0","1","'-"
"Chill out","","TEAM TOTAL (includes team rebounds)","'-","72","34","34","100.0%","30","30","100.0%","4","4","100.0%","0","0","'-","'-","'-","10","0","0","0","0","1","'-"
"Chill out","SCORE CORRECTION","2","SCOREBOARD TOTAL","74","TEAM REB","0"
"Chill out","Q1: 24","Q2: 5","Q3: 20","Q4: 25"`;

  it('box score ทีมเรา = 41 (37 + correction 4)', () => {
    const g = importGameFromCsv(REAL, SCHEDULED);
    const box = computeBoxScore(g.players, g.events);
    expect(g.teamName).toBe('Hoob vibe');
    expect(g.players.length).toBe(12);
    expect(box.teamScore).toBe(41);
  });

  it('คะแนนคู่แข่ง = 74 (หัก PF ทีมเราแล้วบวกกลับ)', () => {
    const g = importGameFromCsv(REAL, SCHEDULED);
    expect(computeOpponentScore(g)).toBe(74);
  });

  it('สถิติทีมรวม: REB=19, AST=3, STL=6', () => {
    const g = importGameFromCsv(REAL, SCHEDULED);
    const box = computeBoxScore(g.players, g.events);
    expect(box.totals.reb).toBe(19);
    expect(box.totals.ast).toBe(3);
    expect(box.totals.stl).toBe(6);
  });
});
