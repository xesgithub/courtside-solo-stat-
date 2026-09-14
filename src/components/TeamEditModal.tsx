import { useState } from 'react';
import type { Player } from '../types';

interface Props {
  teamName: string;
  opponentName: string;
  players: Player[];
  onUpdateTeamInfo: (patch: { teamName?: string; opponentName?: string }) => void;
  onUpdatePlayer: (id: string, patch: Partial<Pick<Player, 'name' | 'number'>>) => void;
  onAddPlayer: (name: string, number: string) => void;
  onRemovePlayer: (id: string) => void;
  onClose: () => void;
}

export function TeamEditModal({
  teamName,
  opponentName,
  players,
  onUpdateTeamInfo,
  onUpdatePlayer,
  onAddPlayer,
  onRemovePlayer,
  onClose,
}: Props) {
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');

  function handleAdd() {
    const name = newName.trim();
    const number = newNumber.trim();
    if (!name && !number) return;
    onAddPlayer(name || 'New player', number);
    setNewName('');
    setNewNumber('');
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal modal--edit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__title">Edit team / players</div>

        {/* Team names */}
        <div className="edit-teams">
          <label className="edit-field">
            <span className="edit-field__label team">Our team</span>
            <input
              className="edit-input"
              value={teamName}
              onChange={(e) => onUpdateTeamInfo({ teamName: e.target.value })}
              placeholder="Our team name"
            />
          </label>
          <label className="edit-field">
            <span className="edit-field__label opp">Opponent</span>
            <input
              className="edit-input"
              value={opponentName}
              onChange={(e) => onUpdateTeamInfo({ opponentName: e.target.value })}
              placeholder="Opponent name"
            />
          </label>
        </div>

        {/* Roster */}
        <div className="edit-roster">
          <div className="edit-roster__head">
            <span className="panel__label">Our players ({players.length})</span>
          </div>
          <div className="edit-roster__list">
            {players.map((p) => (
              <div className="edit-row" key={p.id}>
                <input
                  className="edit-input edit-input--num"
                  value={p.number}
                  onChange={(e) => onUpdatePlayer(p.id, { number: e.target.value })}
                  placeholder="No."
                  inputMode="numeric"
                  aria-label={`Number for ${p.name}`}
                />
                <input
                  className="edit-input edit-input--name"
                  value={p.name}
                  onChange={(e) => onUpdatePlayer(p.id, { name: e.target.value })}
                  placeholder="Player name"
                  aria-label={`Name for ${p.name}`}
                />
                <button
                  className="edit-remove"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Remove ${p.name} from the roster? Any stats already logged move to the Team total.`,
                      )
                    )
                      onRemovePlayer(p.id);
                  }}
                  aria-label={`Remove ${p.name}`}
                  title="Remove player"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* เพิ่มผู้เล่นใหม่ */}
          <div className="edit-row edit-row--add">
            <input
              className="edit-input edit-input--num"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              placeholder="No."
              inputMode="numeric"
              aria-label="New player number"
            />
            <input
              className="edit-input edit-input--name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
              placeholder="New player name"
              aria-label="New player name"
            />
            <button className="edit-add" onClick={handleAdd} aria-label="Add player">
              + Add
            </button>
          </div>
        </div>

        <div className="modal__actions">
          <button className="btn btn--block btn--primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
