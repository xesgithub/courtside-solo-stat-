import { ACTIONS, type ActionDef } from '../lib/actions';
import type { Player } from '../types';

interface Props {
  /** ผู้เล่นที่เลือกอยู่ (ถ้ามี) */
  player: Player | null;
  onAction: (action: ActionDef) => void;
  onClose: () => void;
  /** action ที่กดค้างไว้ก่อน (ยังไม่ได้เลือกคน) — ใช้ไฮไลต์ปุ่มที่ค้างอยู่ */
  pendingAction: ActionDef | null;
  /** kind ของปุ่มที่เพิ่งกดบันทึก — ให้ปุ่มนั้นกระพริบวาบ */
  flashActionKind?: string | null;
  /** bump ทุกครั้งที่กด — ใช้เป็น key re-trigger animation (กดปุ่มเดิมซ้ำได้) */
  flashActionNonce?: number;
}

const primaryActions = ACTIONS.filter((a) => a.group === 'primary');
const wideActions = ACTIONS.filter((a) => a.group === 'wide');
const foulActions = ACTIONS.filter((a) => a.group === 'foul');
const ftActions = ACTIONS.filter((a) => a.group === 'ft');
const quickActions = ACTIONS.filter((a) => a.group === 'quick');

export function ActionPad({
  player,
  onAction,
  onClose,
  pendingAction,
  flashActionKind,
  flashActionNonce = 0,
}: Props) {
  // ปุ่มกดได้เสมอ แม้ยังไม่เลือกคน (เลือก action ก่อนแล้วค่อยเลือกคนได้)
  const isPending = (a: ActionDef) => pendingAction?.kind === a.kind;
  const isFlash = (a: ActionDef) => flashActionKind === a.kind;

  const btnClass = (a: ActionDef, base: string) =>
    base + ' stat-' + a.kind + ' ' + a.tone +
    (isPending(a) ? ' is-pending' : '') +
    (isFlash(a) ? ' is-flash' : '');

  // key ของปุ่ม: ถ้าปุ่มนี้กำลัง flash ให้ผูก nonce เข้าไปด้วย เพื่อ re-mount
  // บังคับ animation เล่นใหม่ แม้กดปุ่มเดิมซ้ำติดๆ กัน
  const btnKey = (a: ActionDef) =>
    isFlash(a) ? a.kind + '-' + flashActionNonce : a.kind;

  return (
    <div className="action-pad">
      <div className="action-selected">
        <div className="action-selected__top">
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

        {/* แถบ quick REB/AST/STL/BLK — อยู่ที่เดิมเสมอ ไม่ว่าจะเลือกคนหรือยัง */}
        <div className="action-quick">
          {quickActions.map((a) => (
            <button
              key={btnKey(a)}
              className={
                'action-quick__btn stat-' + a.kind + ' ' + a.tone +
                (isPending(a) ? ' is-pending' : '') +
                (isFlash(a) ? ' is-flash' : '')
              }
              onClick={() => onAction(a)}
              title={a.sub}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="action-groups">
        {/* ปุ่มยิงหลัก 2PT/3PT — grid 2×2 ใหญ่สุด */}
        <div className="action-grid action-grid--primary">
          {primaryActions.map((a) => (
            <button
              key={btnKey(a)}
              className={btnClass(a, 'action-btn action-btn--primary')}
              onClick={() => onAction(a)}
            >
              <span className="action-btn__label">{a.label}</span>
              {a.sub && <span className="action-btn__sub">{a.sub}</span>}
            </button>
          ))}
        </div>

        {/* Turnover — ปุ่มยาวเต็มแถว */}
        <div className="action-grid action-grid--wide">
          {wideActions.map((a) => (
            <button
              key={btnKey(a)}
              className={btnClass(a, 'action-btn action-btn--wide')}
              onClick={() => onAction(a)}
            >
              <span className="action-btn__label">{a.label}</span>
            </button>
          ))}
        </div>

        {/* Foul +/− — grid 2 ปุ่ม */}
        <div className="action-grid action-grid--foul">
          {foulActions.map((a) => (
            <button
              key={btnKey(a)}
              className={btnClass(a, 'action-btn action-btn--mid')}
              onClick={() => onAction(a)}
            >
              <span className="action-btn__label">{a.label}</span>
              {a.sub && <span className="action-btn__sub">{a.sub}</span>}
            </button>
          ))}
        </div>

        {/* FT ✓/✗ — grid 2 ปุ่ม */}
        <div className="action-grid action-grid--foul">
          {ftActions.map((a) => (
            <button
              key={btnKey(a)}
              className={btnClass(a, 'action-btn action-btn--mid')}
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
