import html2canvas from 'html2canvas';

/** ทำชื่อไฟล์ให้ปลอดภัย (ตัดอักขระที่ใช้ในชื่อไฟล์ไม่ได้) */
function safeName(s: string): string {
  return s.replace(/[^\w\u0E00-\u0E7F-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

/** render element เป็น PNG blob ด้วย html2canvas */
export async function elementToBlob(el: HTMLElement): Promise<Blob> {
  // อ่านสีพื้นหลังจริงของหน้า เพื่อไม่ให้รูปออกมาพื้นโปร่ง/ขาว
  // ถ้าอ่านไม่ได้/โปร่งใส (rgba(0,0,0,0)) ให้ fallback เป็นสีพื้นแอป
  const rawBg = getComputedStyle(document.body).backgroundColor;
  const bg = rawBg && rawBg !== 'rgba(0, 0, 0, 0)' && rawBg !== 'transparent'
    ? rawBg
    : '#0d0f14';

  // ขนาดจริงของเนื้อหา (รวมส่วนที่ถูก overflow:hidden ซ่อน) — ใช้ scrollWidth/Height
  // กันกรณี element อยู่ใน container ที่ overflow:hidden แล้ว capture ได้ภาพว่าง/ตัด
  const width = Math.ceil(Math.max(el.scrollWidth, el.offsetWidth, el.clientWidth));
  const height = Math.ceil(Math.max(el.scrollHeight, el.offsetHeight, el.clientHeight));

  // จำกัดขนาด canvas ไม่ให้เกิน limit ของ Safari/iOS (~16.7M px ต่อด้าน/รวม)
  // ถ้าใหญ่เกินจะได้ canvas ว่าง = ภาพดำ -> ลด scale ลงอัตโนมัติ
  const MAX_CANVAS_PX = 16_000_000; // พื้นที่รวมที่ปลอดภัยข้ามเบราว์เซอร์
  const MAX_SIDE = 8192; // ความยาวด้านที่ปลอดภัยบน iOS
  let scale = 2;
  while (
    scale > 1 &&
    (width * scale > MAX_SIDE ||
      height * scale > MAX_SIDE ||
      width * height * scale * scale > MAX_CANVAS_PX)
  ) {
    scale -= 0.5;
  }

  const canvas = await html2canvas(el, {
    backgroundColor: bg,
    scale,
    useCORS: true,
    logging: false,
    width,
    height,
    windowWidth: width,
    windowHeight: height,
    scrollX: 0,
    scrollY: 0,
    // บน element ที่ clone: ตั้งพื้นหลังทึบ + ปลดการตัด overflow ให้เห็นเนื้อหาครบ
    onclone: (_doc, element) => {
      element.style.background = bg;
      element.style.overflow = 'visible';
      element.style.maxHeight = 'none';
      element.style.height = 'auto';
      element.querySelectorAll<HTMLElement>('*').forEach((node) => {
        const cs = getComputedStyle(node);
        if (cs.overflow !== 'visible' || cs.maxHeight !== 'none') {
          node.style.overflow = 'visible';
          node.style.maxHeight = 'none';
        }
      });
    },
  });

  // กันกรณีได้ canvas ว่าง (0 px) จริงๆ -> โยน error ให้ชั้นบน alert แจ้งผู้ใช้
  if (!canvas.width || !canvas.height) {
    throw new Error('html2canvas produced an empty canvas');
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      'image/png',
    );
  });
}

/** ผลลัพธ์ของการแชร์ */
export type ShareResult = 'shared' | 'canceled' | 'copied' | 'downloaded' | 'unsupported';

/** ดาวน์โหลดไฟล์เป็น fallback สุดท้าย */
function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** คัดลอกรูปเข้า clipboard (ให้ผู้ใช้ไปวางในแชท LINE ได้เลย) — คืน true ถ้าสำเร็จ */
async function copyBlobToClipboard(blob: Blob): Promise<boolean> {
  try {
    const nav = navigator as Navigator & {
      clipboard?: { write?: (items: ClipboardItem[]) => Promise<void> };
    };
    if (!nav.clipboard?.write || typeof ClipboardItem === 'undefined') return false;
    await nav.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch (err) {
    console.warn('[share] clipboard copy failed:', err);
    return false;
  }
}

/**
 * แชร์รูป box score เข้าแอปอื่น (เช่น LINE) — ไล่ทางที่ดีที่สุดที่อุปกรณ์รองรับ:
 * 1) Web Share API แชร์ไฟล์ (Safari iOS/Android) -> เด้ง share sheet เลือก LINE ได้ตรง
 * 2) คัดลอกรูปเข้า clipboard (Edge/Chrome iPad ฯลฯ) -> ไปวางในแชท LINE ได้เลย
 * 3) ดาวน์โหลดรูป (ทางสุดท้าย) -> เซฟแล้วแชร์เอง
 */
export async function shareBoxScore(
  el: HTMLElement,
  fileBase: string,
): Promise<ShareResult> {
  const blob = await elementToBlob(el);
  const fileName = `${safeName(fileBase)}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });

  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
  };

  // 1) ลองแชร์ไฟล์ผ่าน Web Share API ก่อน (ดีที่สุด: เด้ง share sheet เลือก LINE ตรง)
  //    ลอง share({files}) เลยถ้ามี navigator.share — ไม่ gate ด้วย canShare
  //    เพราะบน Safari/iPad บางกรณี canShare({files}) คืน false ทั้งที่ share ได้จริง
  //    ถ้าเบราว์เซอร์ไม่รองรับไฟล์จริง share() จะ throw แล้วเราค่อย fallback
  if (nav.share) {
    try {
      await nav.share({ files: [file], title: fileBase });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'canceled';
      console.warn('[share] navigator.share({files}) failed:', err);
      // ตกไปลองวิธีถัดไป (clipboard / download)
    }
  }

  // 2) คัดลอกรูปเข้า clipboard (Edge/Chrome บน iPad ฯลฯ) -> ไปวางในแชท LINE
  if (await copyBlobToClipboard(blob)) {
    return 'copied';
  }

  // 3) ทางสุดท้าย: ดาวน์โหลดรูป
  console.warn('[share] fallback to download');
  downloadBlob(blob, fileName);
  return 'downloaded';
}

/**
 * แชร์รูปจาก blob ที่ "เตรียมไว้ล่วงหน้าแล้ว" — เรียกได้ทันทีใน user gesture (กดปุ่ม)
 * โดยไม่มี await html2canvas คั่น จึงรักษา transient user activation ของ iOS/Safari ไว้
 * ทำให้ navigator.share({files}) ไม่ถูกบล็อก และเด้ง share sheet เลือก LINE ได้ตรง
 */
export async function shareImageBlob(
  blob: Blob,
  fileBase: string,
): Promise<ShareResult> {
  const fileName = `${safeName(fileBase)}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
  };

  if (nav.share) {
    try {
      await nav.share({ files: [file], title: fileBase });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'canceled';
      console.warn('[share] shareImageBlob: navigator.share failed:', err);
    }
  }
  if (await copyBlobToClipboard(blob)) return 'copied';
  downloadBlob(blob, fileName);
  return 'downloaded';
}
