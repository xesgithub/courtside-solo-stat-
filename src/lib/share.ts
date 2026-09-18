import html2canvas from 'html2canvas';

/** ทำชื่อไฟล์ให้ปลอดภัย (ตัดอักขระที่ใช้ในชื่อไฟล์ไม่ได้) */
function safeName(s: string): string {
  return s.replace(/[^\w\u0E00-\u0E7F-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

/** render element เป็น PNG blob ด้วย html2canvas */
async function elementToBlob(el: HTMLElement): Promise<Blob> {
  // อ่านสีพื้นหลังจริงของหน้า เพื่อไม่ให้รูปออกมาพื้นโปร่ง/ขาว
  const bg =
    getComputedStyle(document.body).backgroundColor || '#0d0f14';
  const canvas = await html2canvas(el, {
    backgroundColor: bg,
    scale: 2, // ความละเอียดสูงขึ้น อ่านง่ายบนจอมือถือ
    useCORS: true,
    logging: false,
  });
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

  // 1) ลองแชร์ไฟล์ผ่าน Web Share API ก่อน (ดีที่สุด: ส่งเข้า LINE ตรง)
  if (nav.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
    try {
      await nav.share({ files: [file], title: fileBase });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'canceled';
      console.warn('[share] navigator.share({files}) failed:', err);
      // ตกไปลองวิธีถัดไป
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
