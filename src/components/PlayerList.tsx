import type { Player } from '../types';
import type { PlayerLine } from '../lib/stats';

interface Props {
  teamName: string;
  players: Player[];
  linesById: Map<string, PlayerLine>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function PlayerList({
  teamName,
  players,
  linesById,
  selectedId,
  onSelect,
}: Props) {
  return (
    <section className="panel">
      <div className="panel__head">
        <span className="panel__label">Team · ทีมเรา</span>
      </div>
      <h2 className="team-name team">{teamName}</h2>
      <div className="player-list" style={{ marginTop: 12 }}>
        {players.map((p) => {
          const line = linesById.get(p.id);
          return (
            <button
              key={p.id}
              className={
                'player-card' + (selectedId === p.id ? ' selected' : '')
              }
              onClick={() => onSelect(p.id)}
            >
              <span className="player-card__num">{p.number}</span>
              <span className="player-card__body">
                <span className="player-card__name">{p.name}</span>
                <span className="player-card__stats">
                  <b>{line?.pts ?? 0}</b> PTS · <b>{line?.reb ?? 0}</b> REB ·{' '}
                  <b>{line?.ast ?? 0}</b> AST · <b>{line?.pf ?? 0}</b> PF
                </span>
              </span>
              {p.isStarter && <span className="player-card__star">★</span>}
            </button>
          );
        })}
      </div>
    </section>
  );
}
