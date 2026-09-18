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
export type ShareResult = 'shared' | 'canceled' | 'downloaded' | 'unsupported';

/** ดาวน์โหลดไฟล์เป็น fallback เมื่อแชร์ไฟล์ผ่าน Web Share API ไม่ได้ */
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

/**
 * แชร์รูป box score เข้าแอปอื่น (เช่น LINE) ผ่าน Web Share API
 * - อุปกรณ์ที่รองรับแชร์ไฟล์ (iPad/มือถือ) -> เด้ง share sheet เลือกส่ง LINE ได้ตรงๆ
 * - ไม่รองรับ -> ดาวน์โหลดรูปแทน (คืน 'downloaded') ให้ผู้ใช้เซฟแล้วส่งเข้า LINE เอง
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

  // ถ้าแชร์ "ไฟล์" ได้ -> ใช้ Web Share API (เด้ง share sheet ส่ง LINE)
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: fileBase });
      return 'shared';
    } catch (err) {
      // ผู้ใช้กดยกเลิก share sheet
      if (err instanceof DOMException && err.name === 'AbortError') return 'canceled';
      // แชร์ล้มเหลวด้วยเหตุอื่น -> ตกไปดาวน์โหลดแทน กันผู้ใช้ทำอะไรไม่ได้
      downloadBlob(blob, fileName);
      return 'downloaded';
    }
  }

  // อุปกรณ์/เบราว์เซอร์ไม่รองรับแชร์ไฟล์ -> ดาวน์โหลดรูปแทน
  downloadBlob(blob, fileName);
  return 'downloaded';
}
