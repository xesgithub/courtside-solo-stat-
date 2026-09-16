import { useState } from 'react';
import { formatClock, formatPeriod } from '../lib/format';
import { ClockEditModal } from './ClockEditModal';
import type { Clock } from '../types';

export type Tab = 'live' | 'box' | 'review';

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;

  clock: Clock;
  totalQuarters: number;
  onToggleClock: () => void;
  onResetClock: () => void;
  /** ตั้งเวลา/ควอเตอร์เอง (จาก modal แตะที่นาฬิกา) */
  onSetClock: (quarter: number, remainingMs: number) => void;
  onNewGame: () => void;
  /** ล้างทุกอย่างกลับเป็นเกมเริ่มต้น (ไม่เก็บเกมเก่า) */
  onResetAll: () => void;
  /** กดโลโก้เพื่อกลับหน้า Live */
  onLogoClick: () => void;

  /** แสดงป้าย autosaved (Task 6) */
  saved?: boolean;

  /** สถานะจบเกม (ล็อกสถิติ) + สลับล็อก/ปลดล็อก */
  finished?: boolean;
  onToggleFinished: () => void;
}

const TABS: { id: Tab; label: string }[] = [
  { id: 'live', label: 'Live' },
  { id: 'box', label: 'Box Score' },
  { id: 'review', label: 'History' },
];

export function TopBar({
  activeTab,
  onTabChange,
  clock,
  totalQuarters,
  onToggleClock,
  onResetClock,
  onSetClock,
  onNewGame,
  onResetAll,
  onLogoClick,
  saved = false,
  finished = false,
  onToggleFinished,
}: Props) {
  const [editingClock, setEditingClock] = useState(false);
  return (
    <>
    <header className="topbar">
      <button className="brand" onClick={onLogoClick} title="Back to Live" aria-label="Back to Live">
        <div className="brand__logo">◎</div>
        <div>
          <div className="brand__title">COURTSIDE</div>
          <div className="brand__sub">The Solo Stat Desk</div>
        </div>
      </button>

      <div className="topbar__clock">
        <button
          className="topbar__clock-edit"
          onClick={() => setEditingClock(true)}
          disabled={finished}
          title={finished ? 'Game locked' : 'Edit clock / quarter'}
        >
          <span className="topbar__clock-q">
            {formatPeriod(clock.quarter, totalQuarters)}
          </span>
          <span className="topbar__clock-time">{formatClock(clock.remainingMs)}</span>
          {!finished && (
            <span className="topbar__clock-pencil" aria-hidden>
              ✎
            </span>
          )}
        </button>
        <div className="topbar__clock-controls">
          <button
            className={
              'clk-btn clk-btn--primary' + (clock.running ? ' running' : '')
            }
            onClick={onToggleClock}
            disabled={finished}
          >
            {clock.running ? 'PAUSE' : 'START'}
          </button>
          <button
            className="clk-btn"
            onClick={onResetClock}
            disabled={finished}
            title="Reset quarter clock"
          >
            ↺
          </button>
        </div>
      </div>

      <div className="topbar__right">
        <button
          className={'finish-btn' + (finished ? ' finish-btn--reopen' : '')}
          onClick={onToggleFinished}
          title={finished ? 'Reopen / keep editing' : 'End game (lock stats)'}
        >
          {finished ? '🔓 Reopen' : '🏁 End game'}
        </button>
        {saved && <span className="autosaved">● Saved</span>}
        <button className="clk-btn" onClick={onNewGame} title="Start a new game">
          New game
        </button>
        <button
          className="clk-btn clk-btn--danger"
          onClick={onResetAll}
          title="Reset everything (current game will be discarded, not saved)"
        >
          Reset all
        </button>
        <nav className="tabs" role="tablist" aria-label="Views">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={activeTab === t.id}
              className={'tab' + (activeTab === t.id ? ' tab--active' : '')}
              onClick={() => onTabChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </header>

    {editingClock && (
      <ClockEditModal
        quarter={clock.quarter}
        remainingMs={clock.remainingMs}
        totalQuarters={totalQuarters}
        onSave={onSetClock}
        onClose={() => setEditingClock(false)}
      />
    )}
    </>
  );
}
