import { useMemo } from 'react';
import type { Game } from '../types';
import { computeBoxScore, computeOpponentScore } from '../lib/stats';

interface Props {
  /** เกมปัจจุบัน (แสดงบนสุดเป็นแถวพิเศษ) */
  currentGame: Game;
  /** คลังเกมที่บันทึกไว้ (ใหม่สุดอยู่บน) */
  savedGames: Game[];
  /** เปิดเกมไปดู Box Score */
  onOpen: (id: string) => void;
  /** เปิดเกมกลับมาแก้/จดต่อ เป็นเกมปัจจุบัน */
  onResume: (id: string) => void;
  /** ลบเกมออกจากคลัง */
  onDelete: (id: string) => void;
}

function scoreOf(game: Game): { team: number; opp: number } {
  const box = computeBoxScore(game.players, game.events);
  return { team: box.teamScore, opp: computeOpponentScore(game) };
}

export function ReviewPage({ currentGame, savedGames, onOpen, onResume, onDelete }: Props) {
  const rows = useMemo(
    () =>
      savedGames.map((g) => ({
        game: g,
        ...scoreOf(g),
      })),
    [savedGames],
  );

  return (
    <div className="historypage">
      <section className="panel">
        <div className="panel__head">
          <span className="panel__label">History · Saved games ({savedGames.length})</span>
        </div>

        {rows.length === 0 ? (
          <div className="history-empty">
            No saved games yet. Games are archived here when you start a new game.
          </div>
        ) : (
          <ul className="history-list">
            {rows.map(({ game, team, opp }) => {
              const win = team > opp;
              const loss = team < opp;
              // แถวที่เป็นเกมที่กำลังแก้อยู่ตอนนี้
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
                        {game.date}
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
                        'history-item__score' +
                        (win ? ' win' : '') +
                        (loss ? ' loss' : '')
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
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
