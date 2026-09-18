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

export function ReviewPage({ savedGames, onOpen, onResume, onDelete }: Props) {
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
              return (
                <li key={game.id} className="history-item">
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
                      if (
                        window.confirm(
                          `Resume "${game.teamName} vs ${game.opponentName}" (${game.date}) to edit / keep scoring? Your current game will be saved to History first.`,
                        )
                      )
                        onResume(game.id);
                    }}
                    aria-label="Resume and edit game"
                    title="Resume / edit"
                  >
                    ▶
                  </button>
                  <button
                    className="history-item__del"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete "${game.teamName} vs ${game.opponentName}" (${game.date}) permanently?`,
                        )
                      )
                        onDelete(game.id);
                    }}
                    aria-label="Delete saved game"
                    title="Delete"
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
