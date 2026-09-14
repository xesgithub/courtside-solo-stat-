import { ACTIONS, type ActionDef } from '../lib/actions';
import type { Player } from '../types';

interface Props {
  player: Player | null;
  onAction: (action: ActionDef) => void;
  onClose: () => void;
}

const primaryActions = ACTIONS.filter((a) => a.primary);
const quickActions = ACTIONS.filter((a) => a.quick);
const secondaryActions = ACTIONS.filter((a) => !a.primary && !a.quick);

export function ActionPad({ player, onAction, onClose }: Props) {
  const disabled = !player;

  return (
    <div className="action-pad">
      <div className="action-selected">
        {player ? (
          <>
            <span className="action-selected__who">
              <span className="num">#{player.number}</span> {player.name}
            </span>
            <div className="action-quick">
              {quickActions.map((a) => (
                <button
                  key={a.kind}
                  className="action-quick__btn"
                  onClick={() => player && onAction(a)}
                  title={a.sub}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <button className="btn btn--ghost" onClick={onClose} aria-label="Clear selection">
              ✕
            </button>
          </>
        ) : (
          <span className="action-selected__hint">
            Tap a player on the left, then log stats
          </span>
        )}
      </div>

      <div className={'action-groups' + (disabled ? ' action-groups--disabled' : '')}>
        {/* ปุ่มหลัก: ยิง 2P/3P — แถวละ 2 ปุ่มใหญ่ */}
        <div className="action-grid action-grid--primary">
          {primaryActions.map((a) => (
            <button
              key={a.kind}
              className={'action-btn action-btn--primary ' + a.tone}
              onClick={() => player && onAction(a)}
              disabled={disabled}
            >
              <span className="action-btn__label">{a.label}</span>
              {a.sub && <span className="action-btn__sub">{a.sub}</span>}
            </button>
          ))}
        </div>

        {/* ปุ่มรอง: REB/AST/STL/BLK/TO/PF/FT — แถวละ 3 */}
        <div className="action-grid action-grid--secondary">
          {secondaryActions.map((a) => (
            <button
              key={a.kind}
              className={'action-btn ' + a.tone}
              onClick={() => player && onAction(a)}
              disabled={disabled}
            >
              <span className="action-btn__label">{a.label}</span>
              {a.sub && <span className="action-btn__sub">{a.sub}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
