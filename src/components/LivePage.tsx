import { useMemo, useState } from 'react';
import type { Game, StatEvent } from '../types';
import type { ActionDef } from '../lib/actions';
import { uid } from '../lib/mock';
import {
  computeBoxScore,
  computeOpponentScore,
  type PlayerLine,
} from '../lib/stats';
import { PlayerList } from './PlayerList';
import { ActionPad } from './ActionPad';
import { OpponentPanel } from './OpponentPanel';
import { Scoreboard } from './Scoreboard';
import { MiniBoxScore } from './MiniBoxScore';
import { PromptModal, type PromptMode } from './PromptModal';

interface PendingPrompt {
  mode: PromptMode;
}

export function LivePage({ initialGame }: { initialGame: Game }) {
  const [game, setGame] = useState<Game>(initialGame);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<PendingPrompt | null>(null);

  const box = useMemo(
    () => computeBoxScore(game.players, game.events),
    [game.players, game.events],
  );
  const linesById = useMemo(() => {
    const m = new Map<string, PlayerLine>();
    box.lines.forEach((l) => m.set(l.playerId, l));
    return m;
  }, [box.lines]);
  const opponentScore = useMemo(() => computeOpponentScore(game), [game]);

  const selectedPlayer =
    game.players.find((p) => p.id === selectedId) ?? null;

  function pushEvent(ev: Omit<StatEvent, 'id' | 'ts' | 'quarter' | 'clockMs'>) {
    setGame((g) => ({
      ...g,
      events: [
        ...g.events,
        {
          id: uid(),
          ts: Date.now(),
          quarter: g.clock.quarter,
          clockMs: g.clock.remainingMs,
          ...ev,
        },
      ],
      updatedAt: Date.now(),
    }));
  }

  function handleAction(action: ActionDef) {
    if (!selectedPlayer) return;
    pushEvent({ kind: action.kind, playerId: selectedPlayer.id });
    if (action.asksAssist) setPrompt({ mode: 'assist' });
    else if (action.asksRebound) setPrompt({ mode: 'rebound' });
  }

  function resolvePrompt(kind: 'AST' | 'REB', target: string | 'team' | 'skip') {
    if (target === 'skip') {
      setPrompt(null);
      return;
    }
    if (target === 'team') {
      pushEvent({ kind, isTeam: true });
    } else {
      pushEvent({ kind, playerId: target });
    }
    setPrompt(null);
  }

  function opponentDelta(delta: number) {
    setGame((g) => ({
      ...g,
      opponentEvents: [
        ...g.opponentEvents,
        {
          id: uid(),
          delta,
          quarter: g.clock.quarter,
          clockMs: g.clock.remainingMs,
          ts: Date.now(),
        },
      ],
      updatedAt: Date.now(),
    }));
  }

  function toggleClock() {
    setGame((g) => ({ ...g, clock: { ...g.clock, running: !g.clock.running } }));
  }
  function resetClock() {
    setGame((g) => ({
      ...g,
      clock: {
        ...g.clock,
        remainingMs: g.config.minutesPerQuarter * 60 * 1000,
        running: false,
      },
    }));
  }
  function nextQuarter() {
    setGame((g) => ({
      ...g,
      clock: {
        quarter: g.clock.quarter + 1,
        remainingMs: g.config.minutesPerQuarter * 60 * 1000,
        running: false,
      },
    }));
  }

  return (
    <>
      <div className="live">
        <PlayerList
          teamName={game.teamName}
          players={game.players}
          linesById={linesById}
          selectedId={selectedId}
          onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
        />

        <div className="center-col">
          <Scoreboard
            teamName={game.teamName}
            opponentName={game.opponentName}
            teamScore={box.teamScore}
            opponentScore={opponentScore}
            clock={game.clock}
            onToggleClock={toggleClock}
            onNextQuarter={nextQuarter}
            onResetClock={resetClock}
          />
          <ActionPad
            player={selectedPlayer}
            onAction={handleAction}
            onClose={() => setSelectedId(null)}
          />
          <MiniBoxScore players={game.players} box={box} />
        </div>

        <OpponentPanel
          opponentName={game.opponentName}
          score={opponentScore}
          onDelta={opponentDelta}
        />
      </div>

      {prompt && (
        <PromptModal
          mode={prompt.mode}
          players={game.players}
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
    </>
  );
}
