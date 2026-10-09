import { useEffect, useMemo, useState } from 'react';
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
  // เมื่อ action ที่ต้องเลือกแต้ม (ฟาวล์ได้/เสีย) ครบคู่กับผู้เล่นแล้ว -> เปิดถาม 1/2/3
  const [pointsPrompt, setPointsPrompt] = useState<{
    action: ActionDef;
    playerId: string;
  } | null>(null);

  // auto-cancel: เลือกคนค้างไว้ ถ้าไม่กด action ภายในเวลานี้ -> ยกเลิกการเลือกเอง
  const SELECT_TIMEOUT_MS = 6000;
  // nonce ไว้ "รีสตาร์ท" ตัวจับเวลาทุกครั้งที่เลือกคนใหม่/กด action (ให้ useEffect รันซ้ำ)
  const [selectNonce, setSelectNonce] = useState(0);

  const finished = !!game.finished;

  const selectedPlayer = game.players.find((p) => p.id === selectedId) ?? null;

  // จับเวลา: เมื่อมีคนถูกเลือกค้างไว้ (ไม่มี action ค้าง) ตั้งเวลายกเลิกอัตโนมัติ
  // รีสตาร์ททุกครั้งที่ selectedId/selectNonce เปลี่ยน (เลือกใหม่ หรือ กด action)
  useEffect(() => {
    if (!selectedId) return;
    const t = window.setTimeout(() => {
      setSelectedId(null);
    }, SELECT_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [selectedId, selectNonce]);

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

  /** บันทึก event จริง ให้ผู้เล่นที่ระบุ (points สำหรับฟาวล์ได้/เสียแต้ม) */
  function commit(action: ActionDef, playerId: string, points?: number) {
    onPushEvent({ kind: action.kind, playerId, ...(points ? { points } : {}) });
    triggerFlash(playerId);
  }

  /** ตัดสินใจบันทึก: ถ้า action ต้องเลือกแต้ม -> เปิด prompt, ไม่งั้น commit เลย */
  function resolveAction(action: ActionDef, playerId: string) {
    if (action.asksPoints) {
      setPointsPrompt({ action, playerId });
    } else {
      commit(action, playerId);
    }
  }

  /** เลือกจำนวนแต้มจาก prompt (1/2/3) แล้วบันทึก */
  function resolvePoints(points: number) {
    if (!pointsPrompt) return;
    commit(pointsPrompt.action, pointsPrompt.playerId, points);
    setPointsPrompt(null);
    setPendingAction(null);
    setSelectedId(null);
  }

  // กดปุ่ม action:
  // - ถ้าเลือกคนไว้แล้ว -> บันทึก/เปิดถามแต้มทันที
  // - ถ้ายังไม่เลือกคน -> จำ action ไว้ (pending) รอเลือกคน (toggle ได้ถ้ากดซ้ำ)
  function handleAction(action: ActionDef) {
    if (finished) return;
    if (selectedPlayer) {
      resolveAction(action, selectedPlayer.id);
      // กด action แล้ว = ยังจดอยู่ -> รีสตาร์ทตัวจับเวลา auto-cancel
      setSelectNonce((n) => n + 1);
    } else {
      setPendingAction((cur) => (cur?.kind === action.kind ? null : action));
    }
  }

  // เลือกคนทางซ้าย:
  // - ถ้ามี action ค้างไว้ -> บันทึก/เปิดถามแต้มทันที แล้วเคลียร์ pending
  // - ถ้าไม่มี -> toggle เลือก/ยกเลิกการเลือกคน (เตรียมกด action ต่อ, มีเวลา auto-cancel)
  function handleSelectPlayer(id: string) {
    if (finished) return;
    if (pendingAction) {
      resolveAction(pendingAction, id);
      // ถ้าไม่ใช่ action ที่ต้องถามแต้ม ให้เคลียร์ pending ทันที
      // (ถ้าเป็น asksPoints จะเคลียร์ตอน resolvePoints)
      if (!pendingAction.asksPoints) {
        setPendingAction(null);
        setSelectedId(null);
      }
      return;
    }
    setSelectedId(id === selectedId ? null : id);
    // รีสตาร์ทตัวจับเวลาเมื่อเลือกคน (แม้เลือกคนเดิมซ้ำก็ให้เริ่มนับใหม่)
    setSelectNonce((n) => n + 1);
  }

  function handleClearSelection() {
    setSelectedId(null);
    setPendingAction(null);
    setPointsPrompt(null);
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
            selectTimeoutMs={SELECT_TIMEOUT_MS}
            selectNonce={selectNonce}
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

      {pointsPrompt && (
        <PointsPromptModal
          action={pointsPrompt.action}
          playerName={(() => {
            const p = game.players.find((pl) => pl.id === pointsPrompt.playerId);
            return p ? `#${p.number} ${p.name}` : 'Team';
          })()}
          onPick={resolvePoints}
          onClose={() => {
            setPointsPrompt(null);
            setPendingAction(null);
            setSelectedId(null);
          }}
        />
      )}
    </>
  );
}

/** popup เลือกจำนวนแต้ม (1/2/3) สำหรับฟาวล์ได้/เสียแต้มทันที */
function PointsPromptModal({
  action,
  playerName,
  onPick,
  onClose,
}: {
  action: ActionDef;
  playerName: string;
  onPick: (points: number) => void;
  onClose: () => void;
}) {
  const isGain = action.kind === 'FOUL_DRAWN';
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="points-prompt"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Select points"
      >
        <div className="points-prompt__head">
          <span
            className={'points-prompt__title ' + (isGain ? 'is-gain' : 'is-loss')}
          >
            {isGain ? 'โดนฟาวล์ — ทีมเราได้กี่แต้ม?' : 'ทำฟาวล์ — คู่แข่งได้กี่แต้ม?'}
          </span>
          <span className="points-prompt__who">{playerName}</span>
        </div>
        <div className="points-prompt__grid">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              className={'points-prompt__btn ' + (isGain ? 'is-gain' : 'is-loss')}
              onClick={() => onPick(n)}
            >
              {isGain ? '+' : '−'}
              {n}
            </button>
          ))}
        </div>
        <button className="btn btn--ghost points-prompt__cancel" onClick={onClose}>
          ยกเลิก
        </button>
      </div>
    </div>
  );
}
