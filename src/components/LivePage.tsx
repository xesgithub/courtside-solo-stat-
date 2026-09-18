import { useMemo, useState } from 'react';
import type { Game, Player, StatEvent } from '../types';
import type { ActionDef } from '../lib/actions';
import { computeBoxScore, type PlayerLine } from '../lib/stats';
import { PlayerList, type StatMode } from './PlayerList';
import { ActionPad } from './ActionPad';
import { ScorePanel } from './ScorePanel';
import { EventLog } from './EventLog';
import { PromptModal, type PromptMode } from './PromptModal';
import { TeamEditModal } from './TeamEditModal';

interface PendingPrompt {
  mode: PromptMode;
  /** คนที่เพิ่งยิง — ห้ามเลือกเป็นคนแอสซิสต์/รีบาวด์ตัวเอง */
  shooterId: string;
}

interface Props {
  game: Game;
  teamScore: number;
  opponentScore: number;
  onPushEvent: (ev: Omit<StatEvent, 'id' | 'ts' | 'quarter' | 'clockMs'>) => void;
  onTeamDelta: (delta: number) => void;
  onOpponentDelta: (delta: number) => void;
  onReorderPlayers: (fromId: string, toId: string) => void;
  onUpdateTeamInfo: (patch: {
    teamName?: string;
    opponentName?: string;
    scheduledAt?: number;
  }) => void;
  onUpdatePlayer: (id: string, patch: Partial<Pick<Player, 'name' | 'number'>>) => void;
  onAddPlayer: (name: string, number: string) => void;
  onRemovePlayer: (id: string) => void;
  onDeleteEvent: (id: string) => void;
}

export function LivePage({
  game,
  teamScore,
  opponentScore,
  onPushEvent,
  onTeamDelta,
  onOpponentDelta,
  onReorderPlayers,
  onUpdateTeamInfo,
  onUpdatePlayer,
  onAddPlayer,
  onRemovePlayer,
  onDeleteEvent,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<PendingPrompt | null>(null);
  const [statMode, setStatMode] = useState<StatMode>('pts');
  const [editing, setEditing] = useState(false);

  const finished = !!game.finished;

  const selectedPlayer = game.players.find((p) => p.id === selectedId) ?? null;

  const linesById = useMemo(() => {
    const box = computeBoxScore(game.players, game.events);
    const m = new Map<string, PlayerLine>();
    box.lines.forEach((l) => m.set(l.playerId, l));
    return m;
  }, [game.players, game.events]);

  function handleAction(action: ActionDef) {
    if (finished) return;
    if (!selectedPlayer) return;
    onPushEvent({ kind: action.kind, playerId: selectedPlayer.id });
    if (action.asksAssist)
      setPrompt({ mode: 'assist', shooterId: selectedPlayer.id });
    else if (action.asksRebound)
      setPrompt({ mode: 'rebound', shooterId: selectedPlayer.id });
  }

  function resolvePrompt(kind: 'AST' | 'REB', target: string | 'team' | 'skip') {
    if (target === 'skip') {
      setPrompt(null);
      return;
    }
    if (target === 'team') {
      onPushEvent({ kind, isTeam: true });
    } else {
      onPushEvent({ kind, playerId: target });
    }
    setPrompt(null);
  }

  return (
    <>
      <div className="live">
        <section className="panel live__players">
          <div className="panel__head">
            <div className="live__head-left">
              <span className="panel__label">
                {game.teamName} · {finished ? 'Game finished (locked)' : 'Tap to log stats'}
              </span>
              <span className="live__count" title="Players in roster">
                {game.players.length} 👤
              </span>
              <button
                className="edit-team-btn"
                onClick={() => setEditing(true)}
                disabled={finished}
                title={finished ? 'Game locked' : 'Edit team / players'}
              >
                ✎ Edit team
              </button>
            </div>
            <div className="statmode-toggle">
              <button
                className={
                  'statmode-btn' + (statMode === 'pts' ? ' statmode-btn--active' : '')
                }
                onClick={() => setStatMode('pts')}
              >
                PTS
              </button>
              <button
                className={
                  'statmode-btn' + (statMode === 'full' ? ' statmode-btn--active' : '')
                }
                onClick={() => setStatMode('full')}
              >
                PTS·REB·AST
              </button>
            </div>
          </div>
          <PlayerList
            players={game.players}
            linesById={linesById}
            statMode={statMode}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
            onReorder={onReorderPlayers}
          />
        </section>

        <div className="live__right">
          <section className="panel live__score">
            <ScorePanel
              teamName={game.teamName}
              teamScore={teamScore}
              opponentName={game.opponentName}
              opponentScore={opponentScore}
              onTeamDelta={finished ? () => {} : onTeamDelta}
              onOpponentDelta={finished ? () => {} : onOpponentDelta}
            />
          </section>

          <section className="panel live__events">
            <EventLog
              game={game}
              limit={3}
              onDelete={finished ? undefined : onDeleteEvent}
            />
          </section>

          <section
            className={'panel live__actions' + (finished ? ' live__actions--locked' : '')}
          >
            {finished ? (
              <div className="game-locked">
                <div className="game-locked__title">🔒 Game finished</div>
                <div className="game-locked__text">
                  Stats are locked. Tap “Reopen / keep editing” to log or change more.
                  Existing data is never deleted.
                </div>
              </div>
            ) : (
              <ActionPad
                player={selectedPlayer}
                onAction={handleAction}
                onClose={() => setSelectedId(null)}
              />
            )}
          </section>
        </div>
      </div>

      {prompt && (
        <PromptModal
          mode={prompt.mode}
          players={game.players}
          excludeId={prompt.shooterId}
          onPick={(pid) =>
            resolvePrompt(prompt.mode === 'assist' ? 'AST' : 'REB', pid)
          }
          onTeam={() =>
            resolvePrompt(prompt.mode === 'assist' ? 'AST' : 'REB', 'team')
          }
          onSkip={() =>
            resolvePrompt(prompt.mode === 'assist' ? 'AST' : 'REB', 'skip')
          }
        />
      )}

      {editing && (
        <TeamEditModal
          teamName={game.teamName}
          opponentName={game.opponentName}
          scheduledAt={game.scheduledAt}
          players={game.players}
          onUpdateTeamInfo={onUpdateTeamInfo}
          onUpdatePlayer={onUpdatePlayer}
          onAddPlayer={onAddPlayer}
          onRemovePlayer={onRemovePlayer}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
