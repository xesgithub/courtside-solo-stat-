import type { Player } from '../types';

export type PromptMode = 'assist' | 'rebound';

interface Props {
  mode: PromptMode;
  players: Player[];
  /** ตัดคนที่เพิ่งยิงออก (แอสซิสต์/รีบาวด์ตัวเองไม่ได้) */
  excludeId?: string;
  onPick: (playerId: string) => void;
  onTeam: () => void;
  onSkip: () => void;
}

const TITLE: Record<PromptMode, string> = {
  assist: 'Who assisted?',
  rebound: 'Who grabbed the rebound?',
};

export function PromptModal({
  mode,
  players,
  excludeId,
  onPick,
  onTeam,
  onSkip,
}: Props) {
  const options = players.filter((p) => p.id !== excludeId);
  return (
    <div className="modal-overlay" onClick={onSkip}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__title">{TITLE[mode]}</div>
        <div className="modal__players">
          {options.map((p) => (
            <button
              key={p.id}
              className="modal-player"
              onClick={() => onPick(p.id)}
            >
              <span className="modal-player__num">{p.number}</span>
              <span className="modal-player__name">{p.name}</span>
            </button>
          ))}
        </div>
        <div className="modal__actions">
          <button className="btn btn--block" onClick={onTeam}>
            Team (no player)
          </button>
          <button className="btn btn--block btn--ghost" onClick={onSkip}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
