# COURTSIDE — Solo Stat

แอปจดสถิติบาสเกตบอลแบบ **Live** สำหรับ "คนจดคนเดียว" — บันทึกสถิติรายบุคคลของทีมเรา
พร้อมคะแนนคู่แข่ง, นาฬิกาแข่งขัน, Box Score และการจัดการหลายแมตช์ต่อวัน

> จดสถิติเฉพาะ "ทีมเรา" รายบุคคล ส่วนคู่แข่งเก็บแค่คะแนนรวม — ออกแบบให้จดคนเดียวทันเกมจริง

## ✨ ฟีเจอร์หลัก

- **จดสถิติ Live** — 2PT / 3PT (เข้า-พลาด), REB, AST, STL, BLK, TO, PF และปรับแต้มทีมแบบเร็ว; ปุ่มจัดเป็น 3 ระดับตามความถี่ใช้งานและใส่สีแยกแต่ละสถิติเพื่อกดเร็ว
- **นาฬิกาแข่งขัน** — เดินถอยหลังจริงตาม timestamp (กัน drift), แก้เวลา/ควอเตอร์ได้, รองรับต่อเวลา (EX1, EX2, …)
- **ปักหมุดผู้เล่น (Pin)** — แตะดาวเพื่อดันคนสำคัญขึ้นบนสุด + ทำให้การ์ดเด่นขึ้น เข้าถึงเร็วสำหรับคนที่กดบ่อย
- **Undo / ลบ event** — ปุ่ม Undo บนกระดานคะแนนย้อน event ล่าสุดได้ทันที หรือเปิดดู/ลบทีละรายการ แล้ว Box Score/แต้มคำนวณใหม่ทันที
- **แก้ทีม/ผู้เล่น** — เพิ่ม/ลบ/แก้ชื่อ-เบอร์, สลับลำดับผู้เล่น
- **Box Score** — ตารางสถิติเต็ม (format สากล FG/3PT), ไฮไลต์ผู้นำ (PTS/REB/AST สูงสุด) พร้อมแชร์เป็นรูปภาพ (html2canvas)
- **แชร์เข้า LINE** — กด Share ส่งรูป Box Score เข้า LINE ได้ตรงบน Safari (iPad/มือถือ); เบราว์เซอร์ที่ไม่รองรับจะคัดลอกรูป/ดาวน์โหลดแทน
- **จัดการหลายแมตช์** — ตั้งเกมรอล่วงหน้าได้หลายคู่, กำหนด **วัน-เวลาแข่ง** เพื่อแยกแมตช์ในวันเดียวกัน
- **History** — เก็บทุกเกม, จัดกลุ่ม "กำลังแข่ง/รอแข่ง" ไว้บน และ "จบแล้ว" ไว้ล่าง, เรียงอัตโนมัติ
- **Resume** — เปิดเกมเก่ากลับมาแก้/จดต่อได้ (จากหน้า History หรือหน้า Box Score)
- **Export CSV** — ดาวน์โหลด Box Score เป็น CSV เปิดใน Excel / Google Sheets
- **Import CSV** — นำเข้าไฟล์สถิติจากโปรแกรมอื่นเข้า History เป็นเกมที่จบแล้ว (ทีมแรก = ทีมเรา, ทีมสอง = คู่แข่งเก็บแค่คะแนนรวม)
- **Export / Import JSON** — สำรองข้อมูลหรือย้ายเครื่องด้วยไฟล์ JSON (merge อัตโนมัติ ไม่ทับข้อมูลที่ใหม่กว่า)
- **บันทึกอัตโนมัติ** — เก็บลง `localStorage` ทันทีทุกการเปลี่ยนแปลง (กันข้อมูลหายตอนรีเฟรช/ปิด)

## 🧱 เทคโนโลยี

- [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 5](https://vite.dev/) (dev server + build)
- [Vitest](https://vitest.dev/) + jsdom (unit tests)
- [html2canvas](https://html2canvas.hertzen.com/) (แชร์ Box Score เป็นรูป)
- เก็บข้อมูลบนเครื่องด้วย `localStorage` (ไม่มี backend / ไม่มีค่าใช้จ่าย)

## 🚀 เริ่มต้นใช้งาน (Development)

ต้องมี **Node.js 22+** และ npm

```bash
# ติดตั้ง dependencies
npm install

# รัน dev server (เปิดที่ http://localhost:5173)
npm run dev

# build สำหรับ production (ออกที่ ./dist)
npm run build

# ดู build ที่ได้แบบ local
npm run preview

# รัน unit tests
npm test

# รัน tests แบบ watch
npm run test:watch

# ตรวจโค้ดด้วย ESLint
npm run lint
```

## 🕹️ วิธีใช้งานโดยย่อ

1. **New game** — ตั้งชื่อทีมเรา/คู่แข่ง, **วัน-เวลาแข่ง**, นาที/ควอเตอร์, จำนวนควอเตอร์ และจำนวนผู้เล่น
   (สร้างผู้เล่นอัตโนมัติ เบอร์เริ่มที่ 4 — แก้ชื่อ/เบอร์ทีหลังได้ที่ *Edit team*)
2. **Live** — แตะการ์ดผู้เล่นแล้วกดปุ่มสถิติเพื่อบันทึก, ปักหมุด (⭐) คนที่กดบ่อยให้ขึ้นบนสุด, กด **Undo** ย้อน event ล่าสุด, คุมนาฬิกา (Start/Pause), ปรับคะแนนคู่แข่ง
3. **End game** — ล็อกเกม (กดอีกครั้งเพื่อปลดล็อกกลับมาแก้ได้)
4. **Box Score** — ดูตารางสถิติเต็ม และกด **Share** เพื่อบันทึก/แชร์เป็นรูป
5. **History** — ดูทุกเกม, กด ▶ เพื่อ *Resume* (แก้/จดต่อ), หรือลบได้เฉพาะเกมที่ End แล้ว
6. **Export / Import** — Export CSV (เปิดใน Excel/Sheets) หรือสำรอง/ย้ายข้อมูลด้วยไฟล์ JSON; Import CSV จากโปรแกรมอื่นเข้า History ได้

### การจัดการหลายแมตช์ต่อวัน

- ตั้งเกมรอล่วงหน้าได้หลายคู่ โดยกำหนด **วัน-เวลาแข่ง** ของแต่ละคู่
- History แบ่งเป็น 2 กลุ่ม:
  - **In progress & Upcoming** (ยังไม่ End) — เกมที่กำลังแก้อยู่บนสุด, ตามด้วยที่เพิ่งเลยเวลา แล้วที่จะถึงก่อน
  - **Finished** (End แล้ว) — เรียงใหม่ → เก่า

### ย้ายเครื่อง / สำรองข้อมูล

ข้อมูลทั้งหมดเก็บใน `localStorage` ของเบราว์เซอร์เครื่องเดียว หากต้องการย้าย:

1. เครื่องเดิม: หน้า **History → Export** ได้ไฟล์ `courtside-backup-YYYY-MM-DD.json`
2. ส่งไฟล์ไปเครื่องใหม่ (AirDrop / ไดรฟ์ / อีเมล)
3. เครื่องใหม่: หน้า **History → Import** เลือกไฟล์นั้น (ระบบ merge ให้ ไม่ลบของเดิม)

## 📁 โครงสร้างโปรเจกต์

```
src/
├─ App.tsx              # state หลัก, การจัดการเกม/นาฬิกา/History
├─ types.ts             # โมเดลข้อมูล (Game, Player, StatEvent, ...)
├─ components/          # UI แต่ละหน้า/ส่วน
│  ├─ TopBar, LivePage, BoxScorePage, ReviewPage
│  ├─ NewGameModal, TeamEditModal, ClockEditModal
│  └─ PlayerList, ActionPad, ScorePanel (event bar + Undo), AllEventsModal, ...
├─ lib/                 # ตรรกะล้วน (ไม่มี UI)
│  ├─ storage.ts        # อ่าน/เขียน localStorage
│  ├─ backup.ts         # Export/Import JSON + merge
│  ├─ csvImport.ts      # นำเข้าไฟล์ CSV จากโปรแกรมอื่น
│  ├─ export.ts         # สร้าง CSV จาก Box Score
│  ├─ history.ts        # จัดกลุ่ม/เรียง History
│  ├─ stats.ts          # คำนวณ Box Score + ผู้นำ
│  ├─ format.ts         # จัดรูปเวลา/วันที่
│  ├─ mock.ts, share.ts
├─ styles/global.css    # สไตล์ทั้งแอป
└─ test/                # unit tests (vitest)
```

## 🌐 Deploy

Deploy อัตโนมัติขึ้น **GitHub Pages** ผ่าน GitHub Actions ทุกครั้งที่ push เข้า `main`
(ดู `.github/workflows/deploy.yml`) — build ด้วย Node 22 แล้ว publish โฟลเดอร์ `dist/`

เลขเวอร์ชันจะแสดงที่มุมซ้ายบน (ใต้ชื่อแอป) อ่านจาก `package.json` ตอน build
ใช้ตรวจว่า production ขึ้นเวอร์ชันล่าสุดแล้วหรือยัง

## 📄 License

[MIT](./LICENSE)
