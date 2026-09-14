import { ACTIONS, type ActionDef } from '../lib/actions';
import type { Player } from '../types';

interface Props {
  player: Player | null;
  onAction: (action: ActionDef) => void;
  onClose: () => void;
}

export function ActionPad({ player, onAction, onClose }: Props) {
  if (!player) {
    return (
      <section className="panel">
        <div className="action-pad__hint">แตะผู้เล่นเพื่อจดสถิติ</div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="action-selected">
        <span className="action-selected__who">
          <span className="num">#{player.number}</span> {player.name}
        </span>
        <button className="btn btn--ghost" onClick={onClose} aria-label="ปิด">
          ✕
        </button>
      </div>
      <div className="action-grid">
        {ACTIONS.map((a) => (
          <button
            key={a.kind}
            className={'action-btn ' + a.tone}
            onClick={() => onAction(a)}
          >
            <span className="action-btn__label">{a.label}</span>
            {a.sub && <span className="action-btn__sub">{a.sub}</span>}
          </button>
        ))}
      </div>
    </section>
  );
}
