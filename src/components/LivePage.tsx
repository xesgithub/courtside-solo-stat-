import { useMemo, useState } from 'react';
import type { Game, Player, StatEvent } from '../types';
import type { ActionDef } from '../lib/actions';
import { PlayerList } from './PlayerList';
import { ActionPad } from './ActionPad';
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
  const [pendingAction, setPendingAction] = useState<ActionDef | null>(null);
  const [editing, setEditing] = useState(false);
  // id ของ event ที่เพิ่งบันทึก (ไว้ flash ยืนยันบนการ์ด/ปุ่ม)
  const [flashPlayerId, setFlashPlayerId] = useState<string | null>(null);

  const finished = !!game.finished;

  const selectedPlayer = game.players.find((p) => p.id === selectedId) ?? null;

  // ผู้เล่นที่ปักหมุด (pin) ดันขึ้นบนสุด — คงลำดับเดิมภายในกลุ่ม (stable)
  const orderedPlayers = useMemo(() => {
    const pinned = game.players.filter((p) => p.isStarter);
    const rest = game.players.filter((p) => !p.isStarter);
    return [...pinned, ...rest];
  }, [game.players]);

  /** flash สั้นๆ ยืนยันว่าบันทึก event ให้ผู้เล่นคนนี้แล้ว */
  function triggerFlash(playerId: string) {
    setFlashPlayerId(playerId);
    window.setTimeout(() => {
      setFlashPlayerId((cur) => (cur === playerId ? null : cur));
    }, 450);
  }

  /** บันทึก event จริง ให้ผู้เล่นที่ระบุ */
  function commit(action: ActionDef, playerId: string) {
    onPushEvent({ kind: action.kind, playerId });
    triggerFlash(playerId);
  }

  // กดปุ่ม action:
  // - ถ้าเลือกคนไว้แล้ว -> บันทึกทันที
  // - ถ้ายังไม่เลือกคน -> จำ action ไว้ (pending) รอเลือกคน (toggle ได้ถ้ากดซ้ำ)
  function handleAction(action: ActionDef) {
    if (finished) return;
    if (selectedPlayer) {
      commit(action, selectedPlayer.id);
    } else {
      setPendingAction((cur) => (cur?.kind === action.kind ? null : action));
    }
  }

  // เลือกคนทางซ้าย:
  // - ถ้ามี action ค้างไว้ -> บันทึกทันทีให้คนนี้ แล้วเคลียร์ pending (ไม่ค้างเลือกคน)
  // - ถ้าไม่มี -> toggle เลือก/ยกเลิกการเลือกคน (เตรียมกด action ต่อ)
  function handleSelectPlayer(id: string) {
    if (finished) return;
    if (pendingAction) {
      commit(pendingAction, id);
      setPendingAction(null);
      setSelectedId(null);
      return;
    }
    setSelectedId(id === selectedId ? null : id);
  }

  function handleClearSelection() {
    setSelectedId(null);
    setPendingAction(null);
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
            flashId={flashPlayerId}
            awaitingPick={!!pendingAction}
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
                onClose={handleClearSelection}
                pendingAction={pendingAction}
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
