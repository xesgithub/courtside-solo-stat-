import { useState } from 'react';
import {
  DEFAULT_NEW_GAME,
  DUMMY_NEW_GAME,
  type NewGameConfig,
} from '../lib/mock';

interface Props {
  onCreate: (config: NewGameConfig) => void;
  onClose: () => void;
}

/** แถวผู้เล่นในฟอร์ม (state ภายใน modal) */
interface PlayerRow {
  key: string;
  number: string;
  name: string;
}

let rowSeq = 0;
function makeRow(number = '', name = ''): PlayerRow {
  rowSeq += 1;
  return { key: `row-${rowSeq}`, number, name };
}

export function NewGameModal({ onCreate, onClose }: Props) {
  const [teamName, setTeamName] = useState(DEFAULT_NEW_GAME.teamName);
  const [opponentName, setOpponentName] = useState(DEFAULT_NEW_GAME.opponentName);
  const [minutes, setMinutes] = useState(String(DEFAULT_NEW_GAME.minutesPerQuarter));
  const [quarters, setQuarters] = useState(String(DEFAULT_NEW_GAME.quarters));
  const [rows, setRows] = useState<PlayerRow[]>(() => [makeRow(), makeRow(), makeRow()]);
  // จำนวนคนที่จะสร้างเร็วๆ (default 8)
  const [genCount, setGenCount] = useState('8');

  /** เบอร์เริ่มต้นตอน generate/dummy (แก้เป็นเบอร์อื่นได้ทีหลัง) */
  const START_NUMBER = 4;

  /** สร้างรายชื่อผู้เล่นเร็วๆ ตามจำนวนที่ระบุ: เบอร์เริ่มที่ 4, ชื่อ "Player N" */
  function generateRows() {
    const n = clampNum(genCount, 8, 1, 30);
    const generated = Array.from({ length: n }, (_, i) =>
      makeRow(String(START_NUMBER + i), `Player ${i + 1}`),
    );
    setRows(generated);
  }

  function fillDummy() {
    setTeamName(DUMMY_NEW_GAME.teamName);
    setOpponentName(DUMMY_NEW_GAME.opponentName);
    setMinutes(String(DUMMY_NEW_GAME.minutesPerQuarter));
    setQuarters(String(DUMMY_NEW_GAME.quarters));
    setRows(DUMMY_NEW_GAME.players.map((p) => makeRow(p.number, p.name)));
  }

  function updateRow(key: string, patch: Partial<Pick<PlayerRow, 'number' | 'name'>>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setRows((rs) => [...rs, makeRow()]);
  }

  function removeRow(key: string) {
    setRows((rs) => rs.filter((r) => r.key !== key));
  }

  function handleCreate() {
    // เก็บเฉพาะแถวที่มีชื่อหรือเบอร์ (ตัดแถวว่างทิ้ง)
    const players = rows
      .map((r) => ({ number: r.number.trim(), name: r.name.trim() }))
      .filter((p) => p.name || p.number);

    onCreate({
      teamName: teamName.trim(),
      opponentName: opponentName.trim(),
      minutesPerQuarter: clampNum(minutes, 12, 1, 60),
      quarters: clampNum(quarters, 4, 1, 12),
      players,
    });
  }

  const playerCount = rows.filter((r) => r.name.trim() || r.number.trim()).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--edit" onClick={(e) => e.stopPropagation()}>
        <div className="modal__title">New game</div>

        {/* Fill dummy — สร้างเร็วๆ */}
        <div className="newgame__dummy">
          <button className="btn btn--ghost" onClick={fillDummy} type="button">
            ⚡ Fill dummy
          </button>
          <span className="newgame__dummy-hint">
            เติมค่าตัวอย่างให้ครบ เพื่อเริ่มเกมได้เร็ว
          </span>
        </div>

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

        {/* Roster */}
        <div className="edit-roster">
          <div className="edit-roster__head">
            <span className="panel__label">Players ({playerCount})</span>
            <div className="newgame__gen">
              <input
                className="edit-input edit-input--num"
                value={genCount}
                onChange={(e) => setGenCount(e.target.value)}
                inputMode="numeric"
                aria-label="Number of players to generate"
                title="How many players to generate"
              />
              <button
                className="btn btn--ghost newgame__gen-btn"
                onClick={generateRows}
                type="button"
                title="Generate players with numbers starting at 4"
              >
                Generate
              </button>
            </div>
          </div>
          <div className="edit-roster__list">
            {rows.map((r) => (
              <div className="edit-row" key={r.key}>
                <input
                  className="edit-input edit-input--num"
                  value={r.number}
                  onChange={(e) => updateRow(r.key, { number: e.target.value })}
                  placeholder="No."
                  inputMode="numeric"
                  aria-label="Player number"
                />
                <input
                  className="edit-input edit-input--name"
                  value={r.name}
                  onChange={(e) => updateRow(r.key, { name: e.target.value })}
                  placeholder="Player name"
                  aria-label="Player name"
                />
                <button
                  className="edit-remove"
                  onClick={() => removeRow(r.key)}
                  aria-label="Remove row"
                  title="Remove row"
                  type="button"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="edit-row edit-row--add">
            <button className="edit-add" onClick={addRow} type="button">
              + Add player
            </button>
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
