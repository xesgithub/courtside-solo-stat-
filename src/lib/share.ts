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
export type ShareResult = 'shared' | 'canceled' | 'unsupported';

/**
 * แชร์รูป box score เข้าแอปอื่น (เช่น LINE) ผ่าน Web Share API เท่านั้น — ไม่ดาวน์โหลด
 * - อุปกรณ์ที่รองรับ (iPad/มือถือ) -> เด้ง share sheet เลือกส่ง LINE ได้ตรงๆ
 * - ไม่รองรับ -> คืน 'unsupported' ให้ UI แจ้งผู้ใช้
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

  // ต้องรองรับการแชร์ "ไฟล์" ด้วย ไม่ใช่แค่ share ข้อความ
  if (!nav.share || !nav.canShare || !nav.canShare({ files: [file] })) {
    return 'unsupported';
  }

  try {
    await nav.share({ files: [file], title: fileBase });
    return 'shared';
  } catch (err) {
    // ผู้ใช้กดยกเลิก share sheet
    if (err instanceof DOMException && err.name === 'AbortError') return 'canceled';
    throw err;
  }
}
