# Contributing

ขอบคุณที่สนใจร่วมพัฒนา COURTSIDE — Solo Stat 🏀

## เริ่มต้น

ต้องมี **Node.js 22+** และ npm

```bash
npm install      # ติดตั้ง dependencies
npm run dev      # dev server (http://localhost:5173)
```

## ก่อนเปิด Pull Request

รันให้ผ่านทั้งหมดก่อนเสมอ:

```bash
npm run lint     # ESLint
npm test         # unit tests (vitest)
npm run build    # tsc + vite build ต้องผ่านโดยไม่มี error
```

## แนวทางการเขียนโค้ด

- **ตรรกะล้วนอยู่ใน `src/lib/`** (ไม่มี UI) เพื่อให้เทสต์ง่าย — เขียน/แก้ตรรกะที่นี่พร้อม unit test ใน `src/test/`
- **UI อยู่ใน `src/components/`** — คอมโพเนนต์รับข้อมูลผ่าน props, state หลักอยู่ที่ `App.tsx`
- ใช้ **TypeScript** แบบเข้ม หลีกเลี่ยง `any`
- เก็บข้อมูลผ่าน helper ใน `src/lib/storage.ts` เท่านั้น อย่าเรียก `localStorage` ตรงๆ จาก UI
- คอมเมนต์อธิบาย "ทำไม" มากกว่า "ทำอะไร" (ภาษาไทยได้)

## การเพิ่มฟีเจอร์ที่แตะข้อมูล (Game/Storage)

- เพิ่มฟิลด์ใหม่ใน `types.ts` แบบ **optional** เพื่อ backward-compat กับข้อมูลเก่าใน `localStorage`
- เตรียม fallback สำหรับข้อมูลเก่าที่ไม่มีฟิลด์นั้น (ดูตัวอย่าง `matchTimeOf` ใน `src/lib/format.ts`)
- เพิ่ม unit test ครอบทั้ง flow ใหม่และการ fallback

## Versioning & Changelog

ใช้ [Semantic Versioning](https://semver.org/)

- **patch** (0.3.x) — แก้บั๊ก / ปรับเล็กน้อย
- **minor** (0.x.0) — เพิ่มฟีเจอร์แบบ backward-compatible
- **major** (x.0.0) — เปลี่ยนแปลงที่ breaking

เมื่อ release: อัปเดต `version` ใน `package.json` และเพิ่มหัวข้อใน [CHANGELOG.md](./CHANGELOG.md)
(เลขเวอร์ชันจะแสดงที่หัวแอปอัตโนมัติผ่าน `__APP_VERSION__` ตอน build)

## Deploy

push เข้า `main` แล้ว GitHub Actions จะ build + deploy ขึ้น GitHub Pages ให้เอง
(ดู `.github/workflows/deploy.yml`)
