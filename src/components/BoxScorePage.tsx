import { useMemo, useRef, useState } from 'react';
import type { Game } from '../types';
import { computeBoxScore, computeOpponentScore, computeLeaders, type PlayerLine } from '../lib/stats';
import { formatPeriod } from '../lib/format';
import { shareBoxScore } from '../lib/share';
import { buildBoxScoreCsv, downloadCsv } from '../lib/export';

interface Props {
  game: Game;
  /** true = กำลังดูเกมเก่าจากคลัง (History) */
  archived?: boolean;
  /** กลับไปเกมปัจจุบัน */
  onBack?: () => void;
  /** เปิดเกมนี้มาแก้/จดต่อ (resume) — มีเฉพาะตอนดูเกมจาก History */
  onResume?: () => void;
}

function pct(made: number, att: number): string {
  if (att <= 0) return '–';
  return Math.round((made / att) * 100) + '%';
}

export function BoxScorePage({ game, archived = false, onBack, onResume }: Props) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  async function handleShare() {
    if (!captureRef.current || sharing) return;
    setSharing(true);
    try {
      const base = `Courtside_${game.teamName}_vs_${game.opponentName}_${game.date}`;
      const result = await shareBoxScore(captureRef.current, base);
      if (result === 'copied') {
        window.alert(
          'คัดลอกรูป Box Score แล้ว ✅\nเปิดแชท LINE แล้ว "วาง" (paste) เพื่อส่งได้เลย',
        );
      } else if (result === 'downloaded') {
        window.alert(
          'บันทึกรูป Box Score ลงเครื่องแล้ว ✅\nเปิดรูปจากอัลบั้ม/ดาวน์โหลด แล้วส่งเข้า LINE ได้เลย',
        );
      }
    } catch (err) {
      console.error('share failed', err);
      window.alert('ขออภัย สร้างรูปไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSharing(false);
    }
  }

  // เวลาที่เซฟล่าสุด (archive) เอาไว้โชว์บน banner
  const savedAt = useMemo(() => {
    const d = new Date(game.updatedAt);
    if (Number.isNaN(d.getTime())) return '';
    const date = d.toLocaleDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  }, [game.updatedAt]);
  const box = useMemo(
    () => computeBoxScore(game.players, game.events),
    [game.players, game.events],
  );
  const opponentScore = useMemo(() => computeOpponentScore(game), [game]);
  const nameById = useMemo(
    () => new Map(game.players.map((p) => [p.id, p])),
    [game.players],
  );

  const showTeamRow = box.teamLine.ast > 0 || box.teamLine.reb > 0;
  // ค่าสูงสุดแต่ละหมวด (เฉพาะผู้เล่นจริง) ไว้ไฮไลต์ leader ในตาราง
  const leaders = useMemo(() => computeLeaders(box.lines), [box.lines]);

  /** Export CSV — กดครั้งเดียวดาวน์โหลด (เปิดใน Excel/Google Sheets) */
  function handleExportCsv() {
    const nameOf = (id: string) => {
      const p = nameById.get(id);
      return p ? `#${p.number} ${p.name}` : 'Player';
    };
    const csv = buildBoxScoreCsv(game, box, opponentScore, nameOf);
    const safe = `${game.teamName}_vs_${game.opponentName}_${game.date}`.replace(
      /[^\w\u0E00-\u0E7F-]+/g,
      '_',
    );
    downloadCsv(csv, `Courtside_${safe}.csv`);
  }

  function renderRow(line: PlayerLine, label: string, extraClass = '') {
    return (
      <tr className={extraClass}>
        <td className="name">{label}</td>
        <td className="col-pts">{line.pts}</td>
        <td>
          {line.fg2m + line.fg3m}/{line.fg2a + line.fg3a}
        </td>
        <td className="pct">{pct(line.fg2m + line.fg3m, line.fg2a + line.fg3a)}</td>
        <td>
          {line.fg3m}/{line.fg3a}
        </td>
        <td className="pct">{pct(line.fg3m, line.fg3a)}</td>
        <td>{line.reb}</td>
        <td>{line.ast}</td>
        <td>{line.stl}</td>
        <td>{line.blk}</td>
        <td>{line.to}</td>
        <td className="col-pf">{line.pf}</td>
      </tr>
    );
  }

  return (
    <div className="boxpage">
      {archived && (
        <div className="archived-banner">
          <span>
            📁 Viewing a saved game: <b>{game.name}</b> ·{' '}
            <span className="archived-banner__time">saved {savedAt}</span>
          </span>
          <div className="archived-banner__actions">
            {onBack && (
              <button className="btn btn--ghost" onClick={onBack}>
                ← Back to current game
              </button>
            )}
            {onResume && (
              <button
                className="btn btn--primary archived-banner__resume"
                onClick={() => {
                  if (
                    window.confirm(
                      `Go to this match "${game.teamName} vs ${game.opponentName}" to edit / keep scoring? Your current game will be saved to History first.`,
                    )
                  )
                    onResume();
                }}
                title="Open this match to edit / keep scoring"
              >
                ▶ Go to this match
              </button>
            )}
          </div>
        </div>
      )}

      <div className="box-toolbar">
        <button
          className="box-csv"
          onClick={handleExportCsv}
          title="Export CSV (เปิดใน Excel / Google Sheets)"
        >
          ⬇ CSV
        </button>
        <button
          className="box-share"
          onClick={handleShare}
          disabled={sharing}
          title="Share / Save image"
        >
          {sharing ? '…' : 'Share'}
        </button>
      </div>

      <div className="box-capture" ref={captureRef}>
      <section className="panel box-summary">
        <div className="box-summary__side team">
          <div className="box-summary__label">Our team</div>
          <div className="box-summary__name team">{game.teamName}</div>
          <div className="box-summary__score team">{box.teamScore}</div>
        </div>
        <div className="box-summary__mid">
          <div className="box-summary__q">
            {formatPeriod(game.clock.quarter, game.config.quarters)}
          </div>
          <div className="box-summary__vs">FINAL SCORE</div>
        </div>
        <div className="box-summary__side opp">
          <div className="box-summary__label">Opponent</div>
          <div className="box-summary__name opp">{game.opponentName}</div>
          <div className="box-summary__score opp">{opponentScore}</div>
        </div>
      </section>

      <section className="panel full-box">
        <div className="panel__head">
          <span className="panel__label">Box Score · Full</span>
        </div>
        <div className="full-box__scroll">
          <table>
            <thead>
              <tr>
                <th className="name">Player</th>
                <th>PTS</th>
                <th>FG</th>
                <th>FG%</th>
                <th>3PT</th>
                <th>3P%</th>
                <th>REB</th>
                <th>AST</th>
                <th>STL</th>
                <th>BLK</th>
                <th>TO</th>
                <th>PF</th>
              </tr>
            </thead>
            <tbody>
              {box.lines.map((line) => {
                const p = nameById.get(line.playerId);
                return (
                  <tr key={line.playerId}>
                    <td className="name">
                      #{p?.number} {p?.name}
                    </td>
                    <td
                      className={
                        'col-pts' +
                        (line.pts > 0 && line.pts === leaders.pts ? ' is-leader' : '')
                      }
                    >
                      {line.pts}
                    </td>
                    <td>
                      {line.fg2m + line.fg3m}/{line.fg2a + line.fg3a}
                    </td>
                    <td className="pct">
                      {pct(line.fg2m + line.fg3m, line.fg2a + line.fg3a)}
                    </td>
                    <td>
                      {line.fg3m}/{line.fg3a}
                    </td>
                    <td className="pct">{pct(line.fg3m, line.fg3a)}</td>
                    <td
                      className={
                        line.reb > 0 && line.reb === leaders.reb ? 'is-leader' : undefined
                      }
                    >
                      {line.reb}
                    </td>
                    <td
                      className={
                        line.ast > 0 && line.ast === leaders.ast ? 'is-leader' : undefined
                      }
                    >
                      {line.ast}
                    </td>
                    <td>{line.stl}</td>
                    <td>{line.blk}</td>
                    <td>{line.to}</td>
                    <td className="col-pf">{line.pf}</td>
                  </tr>
                );
              })}
              {showTeamRow && renderRow(box.teamLine, 'Team (no player)', 'team-row')}
              {renderRow(box.totals, 'Total', 'totals')}
            </tbody>
          </table>
        </div>
      </section>
      </div>
    </div>
  );
}
