import { useEffect, useMemo, useRef, useState } from 'react';
import { TopBar, type Tab } from './components/TopBar';
import { LivePage } from './components/LivePage';
import { BoxScorePage } from './components/BoxScorePage';
import { ReviewPage } from './components/ReviewPage';
import { NewGameModal } from './components/NewGameModal';
import { createMockGame, createGame, uid, type NewGameConfig } from './lib/mock';
import { computeBoxScore, computeOpponentScore } from './lib/stats';
import { matchTimeOf } from './lib/format';
import {
  loadGame,
  saveGame,
  loadSavedGames,
  archiveGame,
  deleteSavedGame,
} from './lib/storage';
import type { Game, Player, StatEvent } from './types';

export default function App() {
  const [game, setGame] = useState<Game>(() => loadGame() ?? createMockGame());
  const [tab, setTab] = useState<Tab>('live');
  const [saved, setSaved] = useState(false);
  const [savedGames, setSavedGames] = useState<Game[]>(() => loadSavedGames());
  // id ของเกมเก่าที่กำลังเปิดดู (null = กำลังดูเกมปัจจุบัน)
  const [viewingId, setViewingId] = useState<string | null>(null);
  // เปิด modal ตั้งค่าเกมใหม่
  const [newGameOpen, setNewGameOpen] = useState(false);
  const saveTimer = useRef<number | null>(null);

  // เกมที่กำลังเปิดดูอยู่: ถ้าเลือกเกมเก่าให้ใช้ตัวนั้น ไม่งั้นใช้เกมปัจจุบัน
  const viewingGame =
    (viewingId && savedGames.find((g) => g.id === viewingId)) || game;
  const isViewingArchived = !!viewingId;

  const box = useMemo(
    () => computeBoxScore(viewingGame.players, viewingGame.events),
    [viewingGame.players, viewingGame.events],
  );
  const opponentScore = useMemo(
    () => computeOpponentScore(viewingGame),
    [viewingGame],
  );

  // รายการที่แสดงใน History = เกม active + เกมในคลัง โดยไม่ให้ id ซ้ำ
  // เรียงตามเวลาแข่ง (scheduledAt) ใหม่สุดอยู่บนสุดเสมอ
  const historyGames = useMemo(() => {
    const rest = savedGames.filter((g) => g.id !== game.id);
    const all = [game, ...rest];
    return all.sort((a, b) => matchTimeOf(b) - matchTimeOf(a));
  }, [game, savedGames]);

  // auto-save ลง localStorage — เขียน "ทันที" ทุกครั้งที่ game เปลี่ยน
  // (localStorage.setItem เร็วมาก ไม่ต้อง debounce; กัน race ตอน refresh เร็วๆ แล้วข้อมูลหาย)
  useEffect(() => {
    saveGame(game);
    // โชว์ป้าย "Saved" แบบหน่วงสั้นๆ เพื่อความรู้สึก ไม่เกี่ยวกับการเขียนจริง
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => setSaved(true), 300);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [game]);

  // เซฟทันทีตอนกำลังจะปิด/รีเฟรช กันข้อมูลหาย
  useEffect(() => {
    const handler = () => saveGame(game);
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [game]);

  // เดินนาฬิกาถอยหลังจริงตอน running = true
  // คำนวณจาก timestamp จริง (deadline) ทุก tick กัน drift และเวลาเพี้ยนตอน tab ถูก throttle
  useEffect(() => {
    if (!game.clock.running) return;
    const deadline = Date.now() + game.clock.remainingMs;
    const id = window.setInterval(() => {
      const left = deadline - Date.now();
      setGame((g) => {
        if (!g.clock.running) return g; // เผื่อถูกสั่งหยุดระหว่างทาง
        if (left <= 0) {
          // หมดเวลาควอเตอร์ -> หยุดที่ 0
          return { ...g, clock: { ...g.clock, remainingMs: 0, running: false } };
        }
        return { ...g, clock: { ...g.clock, remainingMs: left } };
      });
    }, 200);
    return () => window.clearInterval(id);
    // ผูกกับ running เท่านั้น: เริ่มเดินใหม่เมื่อกด start/pause หรือรีเซ็ตเวลา
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.clock.running]);

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

  function teamDelta(delta: number) {
    // ปรับแต้มทีมเราแบบเร็ว: บันทึกเป็น event ไม่ระบุตัว (undo ได้ปกติ)
    pushEvent({ kind: 'PTS_ADJ', isTeam: true, points: delta });
  }

  /** ลบ event ออกจาก log — box score/แต้มจะคำนวณใหม่ตามทันที */
  function deleteEvent(id: string) {
    setGame((g) => ({
      ...g,
      events: g.events.filter((e) => e.id !== id),
      updatedAt: Date.now(),
    }));
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

  function reorderPlayers(fromId: string, toId: string) {
    if (fromId === toId) return;
    setGame((g) => {
      const players = [...g.players];
      const from = players.findIndex((p) => p.id === fromId);
      const to = players.findIndex((p) => p.id === toId);
      if (from < 0 || to < 0) return g;
      // สลับตำแหน่งกัน (swap) — ตัวอื่นอยู่ที่เดิม
      [players[from], players[to]] = [players[to], players[from]];
      return { ...g, players, updatedAt: Date.now() };
    });
  }

  function updateTeamInfo(patch: {
    teamName?: string;
    opponentName?: string;
    scheduledAt?: number;
  }) {
    if (game.finished) return;
    setGame((g) => {
      const next = { ...g, ...patch, updatedAt: Date.now() };
      // ถ้าแก้เวลาแข่ง ให้ date ตามวันของ scheduledAt ด้วย (คงความสอดคล้อง)
      if (typeof patch.scheduledAt === 'number' && !Number.isNaN(patch.scheduledAt)) {
        next.date = new Date(patch.scheduledAt).toISOString().slice(0, 10);
      }
      return next;
    });
  }

  function updatePlayer(id: string, patch: Partial<Pick<Player, 'name' | 'number'>>) {
    if (game.finished) return;
    setGame((g) => ({
      ...g,
      players: g.players.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      updatedAt: Date.now(),
    }));
  }

  function addPlayer(name: string, number: string) {
    if (game.finished) return;
    setGame((g) => ({
      ...g,
      players: [...g.players, { id: uid(), name, number }],
      updatedAt: Date.now(),
    }));
  }

  function removePlayer(id: string) {
    if (game.finished) return;
    // ลบผู้เล่นออกจากรายชื่อ — event ของเขาจะตกไปรวมใน "Team" row (แต้มทีมไม่หาย)
    setGame((g) => ({
      ...g,
      players: g.players.filter((p) => p.id !== id),
      updatedAt: Date.now(),
    }));
  }

  function toggleFinished() {
    // จบเกม = ล็อกไม่ให้จดสถิติเพิ่ม / กดอีกครั้ง = ปลดล็อกกลับมาแก้ได้ (ไม่ลบข้อมูล)
    setGame((g) => {
      const finished = !g.finished;
      return {
        ...g,
        finished,
        // จบเกมให้หยุดนาฬิกาด้วย กันเวลาเดินต่อ
        clock: finished ? { ...g.clock, running: false } : g.clock,
        updatedAt: Date.now(),
      };
    });
  }

  function newGame() {
    // เปิด modal ตั้งค่าเกมใหม่ — การ archive/สร้างจริงจะทำตอนกด Create ใน modal
    setNewGameOpen(true);
  }

  /** สร้างเกมใหม่จากค่าที่ตั้งใน NewGameModal (archive เกมเก่าถ้ามีข้อมูล) */
  function createFromConfig(config: NewGameConfig) {
    const worthKeeping =
      game.finished || game.events.length > 0 || game.opponentEvents.length > 0;
    if (worthKeeping) {
      // เก็บเกมเก่าเข้า History ก่อนเริ่มใหม่ — ไม่ลบข้อมูล
      const list = archiveGame(game);
      setSavedGames(list);
    }
    const fresh = createGame(config);
    setGame(fresh);
    saveGame(fresh);
    setViewingId(null);
    setNewGameOpen(false);
    setTab('live');
  }

  /**
   * Reset all — ล้างทุกอย่างกลับเป็นเกมเริ่มต้น (dummy) โดย "ไม่" เก็บเกมเก่า
   * ต่างจาก New game ตรงที่ลบเกมปัจจุบันทิ้งเลย (ไม่ archive)
   */
  /**
   * Reset all — ล้างสถิติทั้งหมดของเกมปัจจุบัน (แต้ม, event, นาฬิกา) กลับเป็นค่าเริ่มต้น
   * แต่ "คง" รายชื่อผู้เล่น/เบอร์, ชื่อทีม/คู่แข่ง และ config (นาที/ควอเตอร์) ไว้
   * ต่างจาก New game ตรงที่ไม่เก็บเกมเก่าเข้า History
   */
  function resetAll() {
    if (
      !window.confirm(
        'Reset all stats? Scores, events and the clock will be cleared. Players, team names and settings are kept. (Not saved to History.)',
      )
    )
      return;
    setGame((g) => ({
      ...g,
      // คง players / teamName / opponentName / config ไว้เหมือนเดิม
      events: [],
      opponentEvents: [],
      clock: {
        quarter: 1,
        remainingMs: g.config.minutesPerQuarter * 60 * 1000,
        running: false,
      },
      finished: false,
      updatedAt: Date.now(),
    }));
    setViewingId(null);
    setNewGameOpen(false);
    setTab('live');
  }

  /** เปิดเกมเก่าจากคลังมาดู (ที่แท็บ Box Score) */
  function openSavedGame(id: string) {
    setViewingId(id);
    setTab('box');
  }

  /** เลิกดูเกมเก่า กลับมาที่เกมปัจจุบัน */
  function backToCurrent() {
    setViewingId(null);
    setTab('live');
  }

  /**
   * ลบเกมออกจากคลัง (History)
   * - ปกติ: ลบออกจาก savedGames
   * - ถ้าเป็นเกมที่ active อยู่ (โชว์ใน History ด้วย): แทนที่เกม active ด้วยเกมใหม่
   *   เพื่อไม่ให้มันถูก auto-save กลับเข้ามาใหม่ (ปุ่มลบเปิดเฉพาะเกม finished อยู่แล้ว)
   */
  function removeSavedGame(id: string) {
    const list = deleteSavedGame(id);
    setSavedGames(list);
    if (viewingId === id) setViewingId(null);
    if (id === game.id) {
      // เกมที่ลบคือเกม active — เริ่มเกมใหม่แทน (กันมันเด้งกลับมาใน History)
      const fresh = createMockGame();
      setGame(fresh);
      saveGame(fresh);
      setViewingId(null);
      setTab('live');
    }
  }

  /**
   * เปิดเกมจากคลังกลับมา "แก้/จดต่อ" เป็นเกมปัจจุบัน
   * - เก็บเกมปัจจุบันเข้า History ก่อนเสมอ กันเกมที่กำลังทำอยู่หาย
   * - "ไม่" ลบเกมเป้าหมายออกจาก History — ทุกเกมอยู่ในคลังเสมอ
   *   (เกม active จะปรากฏใน History ด้วย พร้อม badge "กำลังแก้")
   *   การลบทำได้ที่ History และต้อง End game ก่อนเท่านั้น
   */
  function resumeSavedGame(id: string) {
    // resume เกมตัวเดิมที่ active อยู่แล้ว — แค่กลับไปแท็บ Live พอ
    if (id === game.id) {
      setViewingId(null);
      setTab('live');
      return;
    }

    // หาเกมเป้าหมายในคลังก่อน — ถ้าไม่เจอก็ไม่ทำอะไร
    const target = savedGames.find((g) => g.id === id);
    if (!target) return;

    // เก็บเกมปัจจุบันเข้า History ก่อนเสมอ (archive ใช้ upsert ตาม id ไม่ซ้ำ)
    // ไม่ลบเกมเป้าหมายออก — ปล่อยให้ค้างใน History ต่อ
    const list = archiveGame(game);
    setSavedGames(list);

    // ตั้งเกมเป้าหมายเป็นเกมปัจจุบัน แล้วไปแท็บ Live เพื่อจดต่อ
    setGame(target);
    saveGame(target);
    setViewingId(null);
    setTab('live');
  }

  function toggleClock() {
    if (game.finished) return; // เกมล็อกอยู่ ห้ามเดินนาฬิกา
    setGame((g) => {
      // กด START ตอนเวลาหมด (0:00) -> ขึ้นช่วงถัดไป + เวลาเต็ม แล้วเดินต่อ
      // เกินควอเตอร์ปกติจะเข้าสู่ช่วงต่อเวลา (overtime: EX1, EX2, ...) ได้เรื่อยๆ
      if (!g.clock.running && g.clock.remainingMs <= 0) {
        return {
          ...g,
          clock: {
            quarter: g.clock.quarter + 1,
            remainingMs: g.config.minutesPerQuarter * 60 * 1000,
            running: true,
          },
          updatedAt: Date.now(),
        };
      }
      return { ...g, clock: { ...g.clock, running: !g.clock.running } };
    });
  }
  /** ตั้งเวลา/ควอเตอร์เอง (จาก modal แก้เวลา) — pause ให้ด้วยกันเวลาวิ่งชน */
  function setClock(quarter: number, remainingMs: number) {
    if (game.finished) return;
    setGame((g) => ({
      ...g,
      clock: {
        quarter: Math.max(1, Math.round(quarter)),
        remainingMs: Math.max(0, Math.round(remainingMs)),
        running: false,
      },
      updatedAt: Date.now(),
    }));
  }
  function resetClock() {
    if (game.finished) return;
    if (!window.confirm('Reset clock?')) return;
    setGame((g) => ({
      ...g,
      clock: {
        ...g.clock,
        remainingMs: g.config.minutesPerQuarter * 60 * 1000,
        running: false,
      },
    }));
  }

  return (
    <div className="app-shell">
      <TopBar
        activeTab={tab}
        onTabChange={(t) => {
          // กลับไปแท็บ Live = เลิกดูเกมเก่า กลับมาเกมปัจจุบันเสมอ
          if (t === 'live') setViewingId(null);
          setTab(t);
        }}
        clock={game.clock}
        totalQuarters={game.config.quarters}
        onToggleClock={toggleClock}
        onResetClock={resetClock}
        onSetClock={setClock}
        onNewGame={newGame}
        onResetAll={resetAll}
        onLogoClick={backToCurrent}
        saved={saved}
        finished={!!game.finished}
        onToggleFinished={toggleFinished}
      />

      {tab === 'live' && (
        <LivePage
          game={game}
          teamScore={box.teamScore}
          opponentScore={opponentScore}
          onPushEvent={pushEvent}
          onTeamDelta={teamDelta}
          onOpponentDelta={opponentDelta}
          onReorderPlayers={reorderPlayers}
          onUpdateTeamInfo={updateTeamInfo}
          onUpdatePlayer={updatePlayer}
          onAddPlayer={addPlayer}
          onRemovePlayer={removePlayer}
          onDeleteEvent={deleteEvent}
        />
      )}
      {tab === 'box' && (
        <BoxScorePage
          game={viewingGame}
          archived={isViewingArchived}
          onBack={backToCurrent}
        />
      )}
      {tab === 'review' && (
        <ReviewPage
          currentGame={game}
          savedGames={historyGames}
          onOpen={openSavedGame}
          onResume={resumeSavedGame}
          onDelete={removeSavedGame}
        />
      )}

      {newGameOpen && (
        <NewGameModal
          onCreate={createFromConfig}
          onClose={() => setNewGameOpen(false)}
        />
      )}
    </div>
  );
}
