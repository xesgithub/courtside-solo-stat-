import { useRef, useState } from 'react';
import type { Player } from '../types';

interface Props {
  players: Player[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (fromId: string, toId: string) => void;
  /** ปักหมุด/ถอนหมุด (ไม่ส่ง = ล็อกอยู่ pin ไม่ได้) */
  onTogglePin?: (id: string) => void;
  /** id ผู้เล่นที่เพิ่งบันทึก event — flash สั้นๆ ยืนยัน */
  flashId?: string | null;
  /** bump ทุกครั้งที่ flash — ใช้เป็น key re-trigger animation (flash คนเดิมซ้ำได้) */
  flashNonce?: number;
  /** true = มี action ค้างรออยู่ รอผู้ใช้แตะคน (ทำให้การ์ดดูเชิญชวนให้แตะ) */
  awaitingPick?: boolean;
  /** เวลา auto-cancel การเลือกคน (ms) — ใช้วาดแถบนับถอยหลังบนการ์ดที่เลือก */
  selectTimeoutMs?: number;
  /** เปลี่ยนค่าทุกครั้งที่รีสตาร์ทตัวจับเวลา — ใช้เป็น key รีสตาร์ท animation */
  selectNonce?: number;
}

// ต้องขยับเกินระยะนี้ถึงนับว่าเป็น "ลาก" ไม่งั้นถือเป็น "แตะเลือก"
const DRAG_THRESHOLD = 10;

export function PlayerList({
  players,
  selectedId,
  onSelect,
  onReorder,
  onTogglePin,
  flashId,
  flashNonce,
  awaitingPick,
  selectTimeoutMs = 6000,
  selectNonce = 0,
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
      className={'player-grid' + (awaitingPick ? ' player-grid--awaiting' : '')}
      ref={gridRef}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {players.map((p) => {
        return (
          <div
            key={p.id}
            data-player-id={p.id}
            role="button"
            tabIndex={0}
            className={
              'player-card' +
              (selectedId === p.id ? ' selected' : '') +
              (p.isStarter ? ' pinned' : '') +
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
            {onTogglePin && (
              <button
                className={
                  'player-card__star' + (p.isStarter ? ' player-card__star--on' : '')
                }
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(p.id);
                }}
                aria-label={p.isStarter ? 'Unpin player' : 'Pin player'}
                title={p.isStarter ? 'เอาหมุดออก' : 'ปักหมุด (ดันขึ้นบน)'}
              >
                {p.isStarter ? '★' : '☆'}
              </button>
            )}
            {!onTogglePin && p.isStarter && (
              <span className="player-card__star player-card__star--on">★</span>
            )}
            <span className="player-card__num">{p.number}</span>
            <span className="player-card__name">{p.name}</span>
            {/* แถบนับถอยหลัง auto-cancel (เฉพาะคนที่เลือกค้างอยู่) */}
            {selectedId === p.id && (
              <span
                key={selectNonce}
                className="player-card__countdown"
                style={{ animationDuration: `${selectTimeoutMs}ms` }}
                aria-hidden
              />
            )}
            {/* flash ยืนยันบันทึก — key=flashNonce ทำให้ animation เล่นใหม่ทุกครั้ง
                (แม้ flash คนเดิมติดๆ กัน) */}
            {flashId === p.id && (
              <span key={flashNonce} className="player-card__flash" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}
