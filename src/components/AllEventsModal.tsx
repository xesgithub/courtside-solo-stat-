import { STAT_LABEL } from '../lib/actions';
import { formatClock, formatPeriod } from '../lib/format';
import type { Game, StatEvent } from '../types';

/** ชื่อผู้เล่น/ทีมของ event 1 รายการ */
export function eventWho(game: Game, ev: StatEvent): string {
  if (ev.isTeam || !ev.playerId) return 'Team';
  const p = game.players.find((pl) => pl.id === ev.playerId);
  return p ? `#${p.number} ${p.name}` : 'Unknown';
}

interface Props {
  game: Game;
  /** ลบ event ได้ (ไม่ส่ง = ล็อกอยู่ ลบไม่ได้) */
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export function AllEventsModal({ game, onDelete, onClose }: Props) {
  // ใหม่สุดอยู่บน
  const events = [...game.events].reverse();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--events" onClick={(e) => e.stopPropagation()}>
        <div className="modal__title">All events ({game.events.length})</div>

        {events.length === 0 ? (
          <div className="event-log__empty">No events yet</div>
        ) : (
          <ul className="allevents-list">
            {events.map((ev) => (
              <li key={ev.id} className="allevents-item">
                <span className="allevents-item__time">
                  {formatPeriod(ev.quarter, game.config.quarters)}{' '}
                  {formatClock(ev.clockMs)}
                </span>
                <span className="allevents-item__label">{STAT_LABEL[ev.kind]}</span>
                <span className="allevents-item__who">{eventWho(game, ev)}</span>
                {onDelete ? (
                  <button
                    className="event-log__del"
                    onClick={() => onDelete(ev.id)}
                    aria-label="Delete event"
                    title="Delete"
                  >
                    ✕
                  </button>
                ) : (
                  <span className="allevents-item__locked" title="Game is locked">
                    🔒
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="modal__actions">
          <button className="btn btn--block btn--primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
