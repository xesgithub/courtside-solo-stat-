import { ACTIONS, type ActionDef } from '../lib/actions';
import type { Player } from '../types';

interface Props {
  /** ผู้เล่นที่เลือกอยู่ (ถ้ามี) */
  player: Player | null;
  onAction: (action: ActionDef) => void;
  onClose: () => void;
  /** action ที่กดค้างไว้ก่อน (ยังไม่ได้เลือกคน) — ใช้ไฮไลต์ปุ่มที่ค้างอยู่ */
  pendingAction: ActionDef | null;
}

const primaryActions = ACTIONS.filter((a) => a.primary);
const midActions = ACTIONS.filter((a) => a.mid);
const quickActions = ACTIONS.filter((a) => a.quick);

export function ActionPad({ player, onAction, onClose, pendingAction }: Props) {
  // ปุ่มกดได้เสมอ แม้ยังไม่เลือกคน (เลือก action ก่อนแล้วค่อยเลือกคนได้)
  const isPending = (a: ActionDef) => pendingAction?.kind === a.kind;

  return (
    <div className="action-pad">
      <div className="action-selected">
        {player ? (
          <>
            <span className="action-selected__who">
              <span className="num">#{player.number}</span> {player.name}
            </span>
            <button className="btn btn--ghost" onClick={onClose} aria-label="Clear selection">
              ✕
            </button>
          </>
        ) : pendingAction ? (
          <span className="action-selected__hint action-selected__hint--pending">
            เลือกแล้ว: <b>{pendingAction.label} {pendingAction.sub}</b> — แตะผู้เล่นเพื่อบันทึก
          </span>
        ) : (
          <span className="action-selected__hint">
            แตะผู้เล่นทางซ้าย หรือกดปุ่มสถิติก่อนก็ได้
          </span>
        )}
      </div>

      <div className="action-groups">
        {/* ปุ่มหลัก: ยิง 2P/3P — แถวละ 2 ปุ่มใหญ่สุด */}
        <div className="action-grid action-grid--primary">
          {primaryActions.map((a) => (
            <button
              key={a.kind}
              className={
                'action-btn action-btn--primary ' + a.tone +
                (isPending(a) ? ' is-pending' : '')
              }
              onClick={() => onAction(a)}
            >
              <span className="action-btn__label">{a.label}</span>
              {a.sub && <span className="action-btn__sub">{a.sub}</span>}
            </button>
          ))}
        </div>

        {/* ปุ่มระดับกลาง: REB/AST/STL/BLK — แถวละ 4 ขนาดกลาง */}
        <div className="action-grid action-grid--mid">
          {midActions.map((a) => (
            <button
              key={a.kind}
              className={
                'action-btn action-btn--mid stat-' + a.kind + ' ' + a.tone +
                (isPending(a) ? ' is-pending' : '')
              }
              onClick={() => onAction(a)}
            >
              <span className="action-btn__label">{a.label}</span>
              {a.sub && <span className="action-btn__sub">{a.sub}</span>}
            </button>
          ))}
        </div>

        {/* ปุ่มรอง (TO/Foul+/Foul−/FT) — อยู่ตำแหน่งเดิมเสมอ ไม่ว่าจะเลือกคนหรือยัง
            (กันปุ่มเด้งสลับที่เวลาเลือก/ยกเลิกการเลือกคน) */}
        <div className="action-grid action-grid--quick">
          {quickActions.map((a) => (
            <button
              key={a.kind}
              className={
                'action-btn action-btn--mid stat-' + a.kind + ' ' + a.tone +
                (isPending(a) ? ' is-pending' : '')
              }
              onClick={() => onAction(a)}
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
