import type { Player } from '../types';

export type PromptMode = 'assist' | 'rebound';

interface Props {
  mode: PromptMode;
  players: Player[];
  onPick: (playerId: string) => void;
  onTeam: () => void;
  onSkip: () => void;
}

const TITLE: Record<PromptMode, string> = {
  assist: 'ใครแอสซิสต์?',
  rebound: 'ใครเก็บรีบาวด์?',
};

export function PromptModal({ mode, players, onPick, onTeam, onSkip }: Props) {
  return (
    <div className="modal-overlay" onClick={onSkip}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__title">{TITLE[mode]}</div>
        <div className="modal__players">
          {players.map((p) => (
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
            ทีม (ไม่ระบุตัว)
          </button>
          <button className="btn btn--block btn--ghost" onClick={onSkip}>
            ข้าม
          </button>
        </div>
      </div>
    </div>
  );
}
