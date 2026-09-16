import { useState } from 'react';
import { DEFAULT_NEW_GAME, type NewGameConfig } from '../lib/mock';

interface Props {
  onCreate: (config: NewGameConfig) => void;
  onClose: () => void;
}

/** เบอร์เริ่มต้นของผู้เล่นที่สร้างอัตโนมัติ (แก้ทีหลังได้ที่หน้า Edit team) */
const START_NUMBER = 4;

export function NewGameModal({ onCreate, onClose }: Props) {
  const [teamName, setTeamName] = useState(DEFAULT_NEW_GAME.teamName);
  const [opponentName, setOpponentName] = useState(DEFAULT_NEW_GAME.opponentName);
  const [minutes, setMinutes] = useState(String(DEFAULT_NEW_GAME.minutesPerQuarter));
  const [quarters, setQuarters] = useState(String(DEFAULT_NEW_GAME.quarters));
  // จำนวนผู้เล่นที่จะสร้างอัตโนมัติ (default 8)
  const [playerCount, setPlayerCount] = useState('8');

  function handleCreate() {
    // สร้างผู้เล่นอัตโนมัติตามจำนวน: เบอร์เริ่มที่ 4, ชื่อ "Player N"
    // (ไปแก้ชื่อ/เบอร์จริงได้ที่หน้า Edit team หลังสร้างเกม)
    const n = clampNum(playerCount, 8, 1, 30);
    const players = Array.from({ length: n }, (_, i) => ({
      number: String(START_NUMBER + i),
      name: `Player ${i + 1}`,
    }));

    onCreate({
      teamName: teamName.trim(),
      opponentName: opponentName.trim(),
      minutesPerQuarter: clampNum(minutes, 12, 1, 60),
      quarters: clampNum(quarters, 4, 1, 12),
      players,
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--edit" onClick={(e) => e.stopPropagation()}>
        <div className="modal__title">New game</div>

        {/* Team names */}
        <div className="edit-teams">
          <label className="edit-field">
            <span className="edit-field__label team">Our team</span>
            <input
              className="edit-input"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Our team name"
            />
          </label>
          <label className="edit-field">
            <span className="edit-field__label opp">Opponent</span>
            <input
              className="edit-input"
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              placeholder="Opponent name"
            />
          </label>
        </div>

        {/* Time settings */}
        <div className="edit-teams">
          <label className="edit-field">
            <span className="edit-field__label">Minutes / quarter</span>
            <input
              className="edit-input"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              inputMode="numeric"
              placeholder="12"
            />
          </label>
          <label className="edit-field">
            <span className="edit-field__label">Quarters</span>
            <input
              className="edit-input"
              value={quarters}
              onChange={(e) => setQuarters(e.target.value)}
              inputMode="numeric"
              placeholder="4"
            />
          </label>
        </div>

        {/* Player count */}
        <div className="edit-teams">
          <label className="edit-field">
            <span className="edit-field__label">Players</span>
            <input
              className="edit-input"
              value={playerCount}
              onChange={(e) => setPlayerCount(e.target.value)}
              inputMode="numeric"
              placeholder="8"
            />
          </label>
          <div className="edit-field newgame__note">
            สร้างผู้เล่นให้อัตโนมัติ (เบอร์เริ่มที่ 4) — แก้ชื่อ/เบอร์ได้ที่ Edit team ภายหลัง
          </div>
        </div>

        <div className="modal__actions modal__actions--split">
          <button className="btn btn--ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="btn btn--primary" onClick={handleCreate} type="button">
            Create game
          </button>
        </div>
      </div>
    </div>
  );
}

/** อ่านตัวเลขจาก string แบบปลอดภัย + จำกัดช่วง */
function clampNum(raw: string, fallback: number, min: number, max: number): number {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
