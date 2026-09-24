import { useMemo, useState } from 'react';
import type { Game, Player, StatEvent } from '../types';
import type { ActionDef } from '../lib/actions';
import { PlayerList } from './PlayerList';
import { ActionPad, type PickPrompt } from './ActionPad';
import { ScorePanel } from './ScorePanel';
import { TeamEditModal } from './TeamEditModal';

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
  onTogglePin: (id: string) => void;
  onAddPlayer: (name: string, number: string) => void;
  onRemovePlayer: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  onUndo: () => void;
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
  onTogglePin,
  onAddPlayer,
  onRemovePlayer,
  onDeleteEvent,
  onUndo,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<PickPrompt | null>(null);
  const [editing, setEditing] = useState(false);

  const finished = !!game.finished;

  const selectedPlayer = game.players.find((p) => p.id === selectedId) ?? null;

  // ผู้เล่นที่ปักหมุด (pin) ดันขึ้นบนสุด — คงลำดับเดิมภายในกลุ่ม (stable)
  const orderedPlayers = useMemo(() => {
    const pinned = game.players.filter((p) => p.isStarter);
    const rest = game.players.filter((p) => !p.isStarter);
    return [...pinned, ...rest];
  }, [game.players]);

  function handleAction(action: ActionDef) {
    if (finished) return;
    if (!selectedPlayer) return;
    onPushEvent({ kind: action.kind, playerId: selectedPlayer.id });
    // ยิงลง/พลาด → เปิดแผงเลือกคน assist/rebound ฝั่งขวา (ไม่บังคับ)
    if (action.asksAssist)
      setPrompt({ mode: 'assist', shooterId: selectedPlayer.id });
    else if (action.asksRebound)
      setPrompt({ mode: 'rebound', shooterId: selectedPlayer.id });
    else setPrompt(null);
  }

  function resolvePrompt(target: string | 'team') {
    if (!prompt) return;
    const kind = prompt.mode === 'assist' ? 'AST' : 'REB';
    if (target === 'team') {
      onPushEvent({ kind, isTeam: true });
    } else {
      onPushEvent({ kind, playerId: target });
    }
    setPrompt(null);
  }

  // เลือกคนฝั่งซ้าย = ยกเลิกโหมดถาม แล้วเตรียม action ให้คนใหม่ (ไม่บังคับตอบ assist/rebound)
  function handleSelectPlayer(id: string) {
    setPrompt(null);
    setSelectedId(id === selectedId ? null : id);
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
          </div>
          <PlayerList
            players={orderedPlayers}
            selectedId={selectedId}
            onSelect={handleSelectPlayer}
            onReorder={onReorderPlayers}
            onTogglePin={finished ? undefined : onTogglePin}
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
              game={game}
              onUndo={finished ? undefined : onUndo}
              onDeleteEvent={finished ? undefined : onDeleteEvent}
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
                prompt={prompt}
                players={game.players}
                onPickPerson={(pid) => resolvePrompt(pid)}
                onPickTeam={() => resolvePrompt('team')}
                onSkipPrompt={() => setPrompt(null)}
              />
            )}
          </section>
        </div>
      </div>

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
