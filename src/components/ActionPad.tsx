import { ACTIONS, type ActionDef } from '../lib/actions';
import type { Player } from '../types';

export type PromptMode = 'assist' | 'rebound';

export interface PickPrompt {
  mode: PromptMode;
  /** คนที่เพิ่งยิง — ห้ามเลือกเป็นคนแอสซิสต์/รีบาวด์ตัวเอง */
  shooterId: string;
}

interface Props {
  player: Player | null;
  onAction: (action: ActionDef) => void;
  onClose: () => void;
  /** เมื่อมีค่า = แสดงแผงเลือกคน assist/rebound แทนปุ่มสถิติ */
  prompt: PickPrompt | null;
  players: Player[];
  onPickPerson: (playerId: string) => void;
  onPickTeam: () => void;
  onSkipPrompt: () => void;
}

const primaryActions = ACTIONS.filter((a) => a.primary);
const midActions = ACTIONS.filter((a) => a.mid);
const quickActions = ACTIONS.filter((a) => a.quick);

const PROMPT_TITLE: Record<PromptMode, string> = {
  assist: 'ใคร Assist?',
  rebound: 'ใคร Rebound?',
};

export function ActionPad({
  player,
  onAction,
  onClose,
  prompt,
  players,
  onPickPerson,
  onPickTeam,
  onSkipPrompt,
}: Props) {
  const disabled = !player;

  // ---- โหมดเลือกคน assist/rebound (ปุ่มใหญ่เต็มพื้นที่ฝั่งขวา) ----
  if (prompt) {
    const options = players.filter((p) => p.id !== prompt.shooterId);
    return (
      <div className="action-pad action-pad--pick">
        <div className="pick-head">
          <span className="pick-head__title">{PROMPT_TITLE[prompt.mode]}</span>
          <button
            className="btn btn--ghost pick-head__skip"
            onClick={onSkipPrompt}
            aria-label="Skip"
          >
            ข้าม ✕
          </button>
        </div>

        <div className="pick-grid">
          {options.map((p) => (
            <button
              key={p.id}
              className="pick-btn"
              onClick={() => onPickPerson(p.id)}
            >
              <span className="pick-btn__num">#{p.number}</span>
              <span className="pick-btn__name">{p.name}</span>
            </button>
          ))}
        </div>

        <button className="pick-btn pick-btn--team" onClick={onPickTeam}>
          Team (ไม่ระบุตัว)
        </button>
      </div>
    );
  }

  return (
    <div className="action-pad">
      <div className="action-selected">
        {player ? (
          <>
            <span className="action-selected__who">
              <span className="num">#{player.number}</span> {player.name}
            </span>
            <div className="action-quick">
              {quickActions.map((a) => (
                <button
                  key={a.kind}
                  className={'action-quick__btn stat-' + a.kind + ' ' + a.tone}
                  onClick={() => player && onAction(a)}
                  title={a.sub}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <button className="btn btn--ghost" onClick={onClose} aria-label="Clear selection">
              ✕
            </button>
          </>
        ) : (
          <span className="action-selected__hint">
            Tap a player on the left, then log stats
          </span>
        )}
      </div>

      <div className={'action-groups' + (disabled ? ' action-groups--disabled' : '')}>
        {/* ปุ่มหลัก: ยิง 2P/3P — แถวละ 2 ปุ่มใหญ่สุด */}
        <div className="action-grid action-grid--primary">
          {primaryActions.map((a) => (
            <button
              key={a.kind}
              className={'action-btn action-btn--primary ' + a.tone}
              onClick={() => player && onAction(a)}
              disabled={disabled}
            >
              <span className="action-btn__label">{a.label}</span>
              {a.sub && <span className="action-btn__sub">{a.sub}</span>}
            </button>
          ))}
        </div>

        {/* ปุ่มระดับกลาง: REB/AST/STL/BLK — แถวละ 4 ขนาดกลาง */}
        <div className="action-grid action-grid--mid">
          {midActions.map((a) => (
            <button
              key={a.kind}
              className={'action-btn action-btn--mid stat-' + a.kind + ' ' + a.tone}
              onClick={() => player && onAction(a)}
              disabled={disabled}
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
