import { useState } from 'react';
import { STAT_LABEL } from '../lib/actions';
import { formatClock, formatPeriod } from '../lib/format';
import type { Game, StatEvent } from '../types';
import { AllEventsModal } from './AllEventsModal';

interface Props {
  game: Game;
  /** จำนวนบรรทัดที่แสดง (ล่าสุดก่อน) */
  limit?: number;
  /** ลบ event ได้ (ไม่ส่ง = ล็อกอยู่ ลบไม่ได้) */
  onDelete?: (id: string) => void;
}

/** ชื่อผู้เล่น/ทีมของ event 1 รายการ */
export function eventWho(game: Game, ev: StatEvent): string {
  if (ev.isTeam || !ev.playerId) return 'Team';
  const p = game.players.find((pl) => pl.id === ev.playerId);
  return p ? `#${p.number} ${p.name}` : 'Unknown';
}

export function EventLog({ game, limit = 3, onDelete }: Props) {
  const [showAll, setShowAll] = useState(false);
  const recent = [...game.events].slice(-limit).reverse();

  return (
    <div className="event-log">
      <div className="event-log__head">
        <span className="panel__label">Event Log</span>
        <div className="event-log__head-right">
          <span className="event-log__count">{game.events.length} events</span>
          <button
            className="event-log__more"
            onClick={() => setShowAll(true)}
            disabled={game.events.length === 0}
          >
            More
          </button>
        </div>
      </div>

      {recent.length === 0 ? (
        <div className="event-log__empty">No events yet</div>
      ) : (
        <ul className="event-log__list">
          {recent.map((ev) => (
            <li key={ev.id} className="event-log__item">
              <span className="event-log__label">{STAT_LABEL[ev.kind]}</span>
              <span className="event-log__who">{eventWho(game, ev)}</span>
              <span className="event-log__time">
                {formatPeriod(ev.quarter, game.config.quarters)} ·{' '}
                {formatClock(ev.clockMs)}
              </span>
              {onDelete && (
                <button
                  className="event-log__del"
                  onClick={() => onDelete(ev.id)}
                  aria-label="Delete event"
                  title="Delete"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {showAll && (
        <AllEventsModal
          game={game}
          onDelete={onDelete}
          onClose={() => setShowAll(false)}
        />
      )}
    </div>
  );
}
