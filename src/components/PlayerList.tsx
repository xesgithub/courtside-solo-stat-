import { useRef, useState } from 'react';
import type { Player } from '../types';
import type { PlayerLine } from '../lib/stats';

export type StatMode = 'pts' | 'full';

interface Props {
  players: Player[];
  linesById: Map<string, PlayerLine>;
  statMode: StatMode;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
}

// ต้องขยับเกินระยะนี้ถึงนับว่าเป็น "ลาก" ไม่งั้นถือเป็น "แตะเลือก"
const DRAG_THRESHOLD = 10;

export function PlayerList({
  players,
  linesById,
  statMode,
  selectedId,
  onSelect,
  onReorder,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // สถานะการลากปัจจุบัน (ไม่ทำให้ re-render)
  const drag = useRef<{
    id: string;
    startX: number;
    startY: number;
    moved: boolean;
    pointerId: number;
  } | null>(null);

  /** หา playerId ของการ์ดที่อยู่ใต้พิกัดจอ */
  function cardIdAtPoint(x: number, y: number): string | null {
    const el = document.elementFromPoint(x, y);
    const card = el?.closest('[data-player-id]') as HTMLElement | null;
    return card?.dataset.playerId ?? null;
  }

  function onPointerDown(e: React.PointerEvent, id: string) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      pointerId: e.pointerId,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;

    if (!d.moved) {
      const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
      if (dist <= DRAG_THRESHOLD) return;
      d.moved = true;
      setDragId(d.id);
      // จับ pointer ไว้ที่ grid เพื่อรับ move/up ต่อเนื่องแม้เลื่อนออกนอกการ์ด
      try {
        gridRef.current?.setPointerCapture(d.pointerId);
      } catch {
        /* ไม่รองรับก็ปล่อยผ่าน */
      }
    }

    // กันหน้าจอ scroll ระหว่างลาก
    e.preventDefault();
    setOverId(cardIdAtPoint(e.clientX, e.clientY));
  }

  function endDrag() {
    const d = drag.current;
    if (!d) return;

    if (d.moved) {
      if (overId && overId !== d.id) onReorder(d.id, overId);
    } else {
      // ไม่ได้ลาก = แตะเลือกปกติ
      onSelect(d.id);
    }

    try {
      if (gridRef.current?.hasPointerCapture(d.pointerId)) {
        gridRef.current.releasePointerCapture(d.pointerId);
      }
    } catch {
      /* noop */
    }
    drag.current = null;
    setDragId(null);
    setOverId(null);
  }

  return (
    <div
      className="player-grid"
      ref={gridRef}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {players.map((p) => {
        const line = linesById.get(p.id);
        return (
          <div
            key={p.id}
            data-player-id={p.id}
            role="button"
            tabIndex={0}
            className={
              'player-card' +
              (selectedId === p.id ? ' selected' : '') +
              (overId === p.id && dragId !== p.id ? ' drop-target' : '') +
              (dragId === p.id ? ' dragging' : '')
            }
            onPointerDown={(e) => onPointerDown(e, p.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(p.id);
              }
            }}
          >
            <span className="player-card__grip" aria-hidden>
              ⠿
            </span>
            {p.isStarter && <span className="player-card__star">★</span>}
            <span className="player-card__num">{p.number}</span>
            <span className="player-card__name">{p.name}</span>

            {statMode === 'pts' ? (
              <span className="player-card__pts">
                <b>{line?.pts ?? 0}</b> PTS
              </span>
            ) : (
              <span className="player-card__stats">
                <span>
                  <b>{line?.pts ?? 0}</b> PTS
                </span>
                <span>
                  <b>{line?.reb ?? 0}</b> REB
                </span>
                <span>
                  <b>{line?.ast ?? 0}</b> AST
                </span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
