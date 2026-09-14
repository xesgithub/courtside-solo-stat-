import { formatClock } from '../lib/format';
import type { Clock } from '../types';

interface Props {
  teamName: string;
  opponentName: string;
  teamScore: number;
  opponentScore: number;
  clock: Clock;
  onToggleClock: () => void;
  onNextQuarter: () => void;
  onResetClock: () => void;
}

export function Scoreboard({
  teamName,
  opponentName,
  teamScore,
  opponentScore,
  clock,
  onToggleClock,
  onNextQuarter,
  onResetClock,
}: Props) {
  return (
    <section className="panel">
      <div className="scoreboard">
        <div>
          <div className="scoreboard__team">{teamName}</div>
          <div className="scoreboard__score team">{teamScore}</div>
        </div>
        <div className="scoreboard__vs">VS</div>
        <div>
          <div className="scoreboard__team">{opponentName}</div>
          <div className="scoreboard__score opp">{opponentScore}</div>
        </div>
      </div>

      <div className="clock" style={{ marginTop: 12 }}>
        <div className="clock__q">
          Q{clock.quarter} · {clock.running ? 'กำลังเดิน' : 'หยุด'}
        </div>
        <div className="clock__time">{formatClock(clock.remainingMs)}</div>
        <div className="clock__controls">
          <button className="btn btn--primary" onClick={onToggleClock}>
            {clock.running ? 'PAUSE' : 'START'}
          </button>
          <button className="btn" onClick={onResetClock} title="รีเซ็ตเวลา Quarter">
            ↺
          </button>
          <button className="btn" onClick={onNextQuarter} title="Quarter ถัดไป">
            →
          </button>
        </div>
      </div>
    </section>
  );
}
