import { useState } from 'react';
import { STAT_LABEL } from '../lib/actions';
import type { Game } from '../types';
import { AllEventsModal, eventWho } from './AllEventsModal';

interface Props {
  teamName: string;
  teamScore: number;
  opponentName: string;
  opponentScore: number;
  onTeamDelta: (delta: number) => void;
  onOpponentDelta: (delta: number) => void;
  /** เกมสำหรับแสดง event ล่าสุด + เปิด modal ดูทั้งหมด */
  game: Game;
  /** Undo event ล่าสุด (ไม่ส่ง = ล็อกอยู่ undo ไม่ได้) */
  onUndo?: () => void;
  /** ลบ event ตาม id (ใน modal) — ไม่ส่ง = ลบไม่ได้ */
  onDeleteEvent?: (id: string) => void;
}

export function ScorePanel({
  teamName,
  teamScore,
  opponentName,
  opponentScore,
  onTeamDelta,
  onOpponentDelta,
  game,
  onUndo,
  onDeleteEvent,
}: Props) {
  const [showEvents, setShowEvents] = useState(false);
  const recent = game.events.slice(-2).reverse();
  const count = game.events.length;

  return (
    <div className="score-panel">
      <div className="score-panel__row">
        {/* ทีมเรา */}
        <div className="score-panel__side">
          <div className="score-panel__name team">{teamName}</div>
          <div className="score-panel__score-box team">
            <button
              className="adj-btn team"
              onClick={() => onTeamDelta(-1)}
              aria-label="ทีมเรา −1"
            >
              −
            </button>
            <span className="score-panel__score team">{teamScore}</span>
            <button
              className="adj-btn adj-btn--plus team"
              onClick={() => onTeamDelta(1)}
              aria-label="ทีมเรา +1"
            >
              +
            </button>
          </div>
        </div>

        <div className="score-panel__vs">VS</div>

        {/* คู่แข่ง */}
        <div className="score-panel__side">
          <div className="score-panel__name opp">{opponentName}</div>
          <div className="score-panel__score-box opp">
            <button
              className="adj-btn opp"
              onClick={() => onOpponentDelta(-1)}
              aria-label="คู่แข่ง −1"
            >
              −
            </button>
            <span className="score-panel__score opp">{opponentScore}</span>
            <button
              className="adj-btn adj-btn--plus opp"
              onClick={() => onOpponentDelta(1)}
              aria-label="คู่แข่ง +1"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* แถบ event ล่าสุด + Undo + ดูทั้งหมด (กลาง เต็มความกว้าง) */}
      <div className="score-panel__events">
        {onUndo && (
          <button
            className="score-panel__undo"
            onClick={onUndo}
            disabled={count === 0}
            title="Undo last event"
          >
            <span className="score-panel__undo-icon">↩</span> Undo
          </button>
        )}

        <div className="score-panel__last">
          {recent.length > 0 ? (
            recent.map((ev, i) => (
              <span
                key={ev.id}
                className={
                  'score-panel__ev' + (i === 0 ? ' score-panel__ev--latest' : '')
                }
              >
                <span className="score-panel__ev-who">{eventWho(game, ev)}</span>
                <span className="score-panel__ev-label">{STAT_LABEL[ev.kind]}</span>
              </span>
            ))
          ) : (
            <span className="score-panel__last-empty">No events yet</span>
          )}
        </div>

        <button
          className="score-panel__events-btn"
          onClick={() => setShowEvents(true)}
          disabled={count === 0}
        >
          ☰ {count}
        </button>
      </div>

      {showEvents && (
        <AllEventsModal
          game={game}
          onDelete={onDeleteEvent}
          onClose={() => setShowEvents(false)}
        />
      )}
    </div>
  );
}
