import { useState } from 'react';
import { formatPeriod } from '../lib/format';

interface Props {
  quarter: number;
  remainingMs: number;
  totalQuarters: number;
  /** บันทึกเวลา/ควอเตอร์ใหม่ */
  onSave: (quarter: number, remainingMs: number) => void;
  onClose: () => void;
}

export function ClockEditModal({
  quarter,
  remainingMs,
  totalQuarters,
  onSave,
  onClose,
}: Props) {
  const initMin = Math.floor(remainingMs / 60000);
  const initSec = Math.floor((remainingMs % 60000) / 1000);

  const [min, setMin] = useState(String(initMin));
  const [sec, setSec] = useState(String(initSec).padStart(2, '0'));
  const [q, setQ] = useState(quarter);

  function handleSave() {
    const m = Math.max(0, parseInt(min, 10) || 0);
    // จำกัดวินาที 0–59 กันกรอกเกิน
    const s = Math.min(59, Math.max(0, parseInt(sec, 10) || 0));
    onSave(q, (m * 60 + s) * 1000);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--clock" onClick={(e) => e.stopPropagation()}>
        <div className="modal__title">Edit clock</div>

        {/* Quarter */}
        <div className="clockedit-field">
          <span className="clockedit-label">Quarter</span>
          <div className="clockedit-qrow">
            <button
              className="clockedit-step"
              onClick={() => setQ((v) => Math.max(1, v - 1))}
              aria-label="Quarter down"
            >
              −
            </button>
            <span className="clockedit-qval">{formatPeriod(q, totalQuarters)}</span>
            <button
              className="clockedit-step"
              onClick={() => setQ((v) => v + 1)}
              aria-label="Quarter up"
            >
              +
            </button>
            <span className="clockedit-qhint">
              {q > totalQuarters ? 'overtime' : `of ${totalQuarters}`}
            </span>
          </div>
        </div>

        {/* เวลาที่เหลือ */}
        <div className="clockedit-field">
          <span className="clockedit-label">Time remaining</span>
          <div className="clockedit-timerow">
            <input
              className="edit-input clockedit-time"
              value={min}
              onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))}
              inputMode="numeric"
              aria-label="Minutes"
            />
            <span className="clockedit-colon">:</span>
            <input
              className="edit-input clockedit-time"
              value={sec}
              onChange={(e) => setSec(e.target.value.replace(/\D/g, ''))}
              onBlur={() =>
                setSec(
                  String(Math.min(59, Math.max(0, parseInt(sec, 10) || 0))).padStart(
                    2,
                    '0',
                  ),
                )
              }
              inputMode="numeric"
              aria-label="Seconds"
            />
            <span className="clockedit-unit">min : sec</span>
          </div>
        </div>

        <p className="clockedit-note">
          Note: changing the quarter only tags future events. It does not affect the
          score or any stats already recorded.
        </p>

        <div className="modal__actions">
          <button className="btn btn--block btn--primary" onClick={handleSave}>
            Save
          </button>
          <button className="btn btn--block btn--ghost" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
