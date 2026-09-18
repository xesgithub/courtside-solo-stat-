import { useMemo, useRef } from 'react';
import type { Game } from '../types';
import { computeBoxScore, computeOpponentScore } from '../lib/stats';
import { matchTimeOf, formatMatchDateTime } from '../lib/format';
import { groupHistory } from '../lib/history';

interface Props {
  /** เกมปัจจุบัน (ที่กำลังแก้อยู่) */
  currentGame: Game;
  /** เกมทั้งหมดที่จะแสดงใน History (รวมเกม active) */
  savedGames: Game[];
  /** เปิดเกมไปดู Box Score */
  onOpen: (id: string) => void;
  /** เปิดเกมกลับมาแก้/จดต่อ เป็นเกมปัจจุบัน */
  onResume: (id: string) => void;
  /** ลบเกมออกจากคลัง */
  onDelete: (id: string) => void;
  /** Export เกมทั้งหมดเป็นไฟล์ JSON */
  onExport: () => void;
  /** Import เกมจากไฟล์ JSON */
  onImport: (file: File) => void;
  /** Import เกมจากไฟล์ CSV (สถิติจากโปรแกรมอื่น) พร้อมวัน-เวลาแข่ง */
  onImportCsv: (file: File, scheduledAt: number) => void;
}

function scoreOf(game: Game): { team: number; opp: number } {
  const box = computeBoxScore(game.players, game.events);
  return { team: box.teamScore, opp: computeOpponentScore(game) };
}

export function ReviewPage({
  currentGame,
  savedGames,
  onOpen,
  onResume,
  onDelete,
  onExport,
  onImport,
  onImportCsv,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // จัดกลุ่ม: ยังไม่ End (ongoing) อยู่บน, End แล้ว (finished) อยู่ล่าง
  const groups = useMemo(
    () => groupHistory(savedGames, currentGame.id),
    [savedGames, currentGame.id],
  );

  function renderItem(game: Game) {
    const { team, opp } = scoreOf(game);
    const win = team > opp;
    const loss = team < opp;
    const isActive = game.id === currentGame.id;
    // ลบได้เฉพาะเกมที่ End game (finished) แล้วเท่านั้น
    const canDelete = !!game.finished;
    return (
      <li
        key={game.id}
        className={'history-item' + (isActive ? ' history-item--active' : '')}
      >
        <button
          className="history-item__main"
          onClick={() => onOpen(game.id)}
          title="View box score"
        >
          <span className="history-item__info">
            <span className="history-item__matchup">
              <b className="team">{game.teamName}</b>
              <span className="history-item__vs">vs</span>
              <b className="opp">{game.opponentName}</b>
            </span>
            <span className="history-item__meta">
              {formatMatchDateTime(matchTimeOf(game))}
              {isActive && (
                <span className="history-item__badge editing">🟢 Editing now</span>
              )}
              {game.finished && (
                <span className="history-item__badge">🔒 Finished</span>
              )}
            </span>
          </span>
          <span
            className={
              'history-item__score' + (win ? ' win' : '') + (loss ? ' loss' : '')
            }
          >
            {team} <span className="history-item__dash">–</span> {opp}
          </span>
        </button>
        <button
          className="history-item__resume"
          onClick={() => {
            if (isActive) {
              // เกมที่กำลังแก้อยู่แล้ว — กลับไป Live ทันที ไม่ต้องถาม
              onResume(game.id);
              return;
            }
            if (
              window.confirm(
                `Resume "${game.teamName} vs ${game.opponentName}" (${game.date}) to edit / keep scoring? Your current game will be saved to History first.`,
              )
            )
              onResume(game.id);
          }}
          aria-label={isActive ? 'Back to editing' : 'Resume and edit game'}
          title={isActive ? 'Back to Live (editing now)' : 'Resume / edit'}
        >
          ▶
        </button>
        <button
          className="history-item__del"
          disabled={!canDelete}
          onClick={() => {
            if (!canDelete) return;
            if (
              window.confirm(
                `Delete "${game.teamName} vs ${game.opponentName}" (${game.date}) permanently?`,
              )
            )
              onDelete(game.id);
          }}
          aria-label="Delete saved game"
          title={canDelete ? 'Delete' : 'End game first to delete'}
        >
          🗑
        </button>
      </li>
    );
  }

  const total = savedGames.length;

  return (
    <div className="historypage">
      <section className="panel">
        <div className="panel__head">
          <span className="panel__label">History · Saved games ({total})</span>
          <div className="history-actions">
            <button
              className="btn btn--ghost history-actions__btn"
              onClick={onExport}
              disabled={total === 0}
              title="Export all games to a JSON file"
            >
              ⬇ Export
            </button>
            <button
              className="btn btn--ghost history-actions__btn"
              onClick={() => fileInputRef.current?.click()}
              title="Import games from a JSON file"
            >
              ⬆ Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImport(file);
                // เคลียร์ค่า เพื่อให้เลือกไฟล์เดิมซ้ำได้
                e.target.value = '';
              }}
            />
            <button
              className="btn btn--ghost history-actions__btn"
              onClick={() => csvInputRef.current?.click()}
              title="นำเข้าไฟล์ CSV สถิติจากโปรแกรมอื่น (เข้า History เป็นเกมที่จบแล้ว)"
            >
              ⬆ CSV
            </button>
            <input
              ref={csvInputRef}
              type="file"
              accept="text/csv,.csv"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // ถามวัน-เวลาแข่ง (default = ตอนนี้) รูปแบบ YYYY-MM-DD HH:mm
                  const def = new Date();
                  const pad = (n: number) => String(n).padStart(2, '0');
                  const defStr =
                    `${def.getFullYear()}-${pad(def.getMonth() + 1)}-${pad(def.getDate())} ` +
                    `${pad(def.getHours())}:${pad(def.getMinutes())}`;
                  const input = window.prompt(
                    'วัน-เวลาแข่งของไฟล์นี้ (YYYY-MM-DD HH:mm)',
                    defStr,
                  );
                  if (input !== null) {
                    const ms = new Date(input.replace(' ', 'T')).getTime();
                    onImportCsv(file, Number.isNaN(ms) ? Date.now() : ms);
                  }
                }
                e.target.value = '';
              }}
            />
          </div>
        </div>

        {total === 0 ? (
          <div className="history-empty">
            No saved games yet. Games are archived here when you start a new game.
          </div>
        ) : (
          <>
            {groups.ongoing.length > 0 && (
              <>
                <div className="history-group-head">
                  In progress &amp; Upcoming ({groups.ongoing.length})
                </div>
                <ul className="history-list">{groups.ongoing.map(renderItem)}</ul>
              </>
            )}
            {groups.finished.length > 0 && (
              <>
                <div className="history-group-head history-group-head--finished">
                  Finished ({groups.finished.length})
                </div>
                <ul className="history-list">{groups.finished.map(renderItem)}</ul>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
