# Changelog

บันทึกการเปลี่ยนแปลงที่สำคัญของ COURTSIDE — Solo Stat
รูปแบบอิงตาม [Keep a Changelog](https://keepachangelog.com/) และใช้ [Semantic Versioning](https://semver.org/)

## [0.3.9] - 2026-09-18

### Fixed
- ปุ่ม Share บน iPad/Safari: เตรียมรูปไว้ล่วงหน้า (pre-generate) แล้วเรียก `navigator.share` ทันทีตอนกดปุ่ม เพื่อรักษา user gesture ของ iOS ไม่ให้ share ถูกบล็อก — ทำให้เด้ง share sheet เลือกส่ง LINE ได้ตรง (เดิมตกไป copy เพราะ html2canvas ทำงานนานก่อน share)

## [0.3.8] - 2026-09-18

### Fixed
- ปุ่ม Share: ลองเรียก Web Share API แชร์ไฟล์ก่อนเสมอเมื่อเบราว์เซอร์รองรับ (ไม่ตัดสินด้วย canShare อย่างเข้มงวด) เพื่อให้เด้ง share sheet เลือกส่ง LINE ได้ตรงบนเครื่องที่รองรับ (เช่น Windows Edge/Chrome) — ถ้าไม่รองรับจริงจึงค่อย copy/download

## [0.3.7] - 2026-09-18

### Changed
- คืนสีธีมทีมเรากลับเป็น **ส้ม** (`#ff7a1a`) ตามเดิม
- สีไฮไลต์ผู้นำในตาราง (คนทำ stat สูงสุด) เป็นสี **ฟ้า** (`#38bdf8`) ให้ตัดกับสีส้มชัด

## [0.3.6] - 2026-09-18

### Added
- **Export CSV** ในหน้า Box Score — กดปุ่มเดียวดาวน์โหลดตารางสถิติ (เปิดใน Excel / Google Sheets) รองรับภาษาไทย (BOM) และ escape ค่าถูกต้อง

### Changed
- เปลี่ยนสีธีมทีมเราจากส้มเป็น **teal** (`#14b8a6`) ให้ดูโดดเด่นไม่ซ้ำใคร; ปรับสีไฮไลต์ผู้นำในตารางเป็นเหลือง (amber) ให้ตัดกับ teal

## [0.3.5] - 2026-09-18

### Added
- แชร์รูป Box Score: เพิ่มการ **คัดลอกรูปเข้า clipboard** เป็นทางเลือกเมื่อแชร์ไฟล์ตรงไม่ได้ (เช่น Edge/Chrome บน iPad) — ไปวาง (paste) ในแชท LINE ได้เลย

### Changed
- ลำดับการแชร์: Web Share (Safari) → Copy clipboard (Edge/Chrome) → Download (ทางสุดท้าย)
- เปลี่ยนสีไฮไลต์ผู้นำในตาราง (REB/AST) เป็นสีฟ้า ให้ต่างจากสีทั่วไปแต่ไม่จัดจ้าน

## [0.3.4] - 2026-09-18

### Fixed
- แชร์รูป Box Score เข้า LINE: ถ้าอุปกรณ์/เบราว์เซอร์แชร์ไฟล์โดยตรงไม่ได้ (หรือ share ล้มเหลว) จะ **ดาวน์โหลดรูปให้แทน** เพื่อให้เซฟแล้วส่งเข้า LINE เองได้ (เดิมขึ้นข้อความว่าแชร์ไม่ได้เฉยๆ)

### Changed
- ย่อขนาดตัวอักษรตาราง Box Score และ score ให้พอดีจอ iPad/มือถือ (responsive) ไม่ล้นจอ

## [0.3.3] - 2026-09-18

### Added
- ไฮไลต์ **ผู้นำประจำเกม** ในตาราง Box Score — ค่า PTS / REB / AST สูงสุดจะเด่นขึ้น (ตัวหนา + จุดสีทีม) เน้นในตารางแบบเรียบ สากล ไม่เปลืองพื้นที่ (เสมอกันเน้นทุกคน, ไม่เน้นเลข 0)

## [0.3.2] - 2026-09-18

### Changed
- ปรับดีไซน์ตาราง Box Score ให้อ่านง่ายขึ้น — แถวสลับสี + hover, เน้น PTS ด้วยสีทีม, FG%/3P% สีเขียว, PF สีแดง, หัวตารางและแถวรวมทีมเด่นขึ้น

## [0.3.1] - 2026-09-18

### Added
- ปุ่ม **"▶ Go to this match"** ในหน้า Box Score ของเกมจาก History — เข้าไปแก้/จดต่อแมตช์นั้นได้ทันทีโดยไม่ต้องย้อนกลับ

### Changed
- ปรับสีเลขเวอร์ชันที่หัวแอปให้อ่านง่ายขึ้น

## [0.3.0] - 2026-09-18

### Added
- **บันทึกวัน-เวลาแข่ง** (`scheduledAt`) — ตั้งได้ตอนสร้างเกม และแก้ย้อนหลังได้ที่ Edit team ใช้แยกหลายแมตช์ในวันเดียวกัน
- **จัดกลุ่ม & เรียง History** — กลุ่ม "In progress & Upcoming" อยู่บน (active > เพิ่งเลยเวลา > จะถึงก่อน), กลุ่ม "Finished" อยู่ล่าง (ใหม่ → เก่า)
- **Export / Import** ข้อมูลเกมทั้งหมดเป็นไฟล์ JSON — สำรอง/ย้ายเครื่อง โดย merge อัตโนมัติ (ไม่ทับข้อมูลที่ใหม่กว่า ไม่ลบของเดิม)

### Changed
- History แสดง **วัน-เวลาแข่ง** แทนวันที่อย่างเดียว

## [0.2.0] - 2026-09-16

### Added
- **Resume** — เปิดเกมจาก History กลับมาแก้/จดต่อได้
- แสดง **เลขเวอร์ชัน** ที่หัวแอป (อ่านจาก `package.json` ตอน build)
- ทุกเกมอยู่ใน History พร้อมป้าย "กำลังแก้" บนเกมที่ active; ลบได้เฉพาะเกมที่ End แล้ว

### Fixed
- เก็บเกมที่กำลังทำอยู่เข้า History เสมอก่อน Resume เกมอื่น กันข้อมูลหาย

## [0.1.0] - 2026-09-14

### Added
- หน้า **Live** จดสถิติรายบุคคล (2PT/3PT เข้า-พลาด, REB, AST, STL, BLK, TO, PF) + ปรับแต้มทีม/คู่แข่ง
- **นาฬิกาแข่งขัน** เดินถอยหลังจริง, แก้เวลา/ควอเตอร์, ต่อเวลา
- **แก้ทีม/ผู้เล่น**, ล็อกเกม (End game), ลบ event
- **Box Score** ตารางสถิติเต็ม + แชร์เป็นรูป (html2canvas)
- **New game modal** — สร้างเกมพร้อมผู้เล่นอัตโนมัติ, Reset all
- **History** เก็บเกมเก่า
- CI: deploy อัตโนมัติขึ้น GitHub Pages (Node 22)

[0.3.9]: https://github.com/xesgithub/courtside-solo-stat-/releases/tag/v0.3.9
[0.3.8]: https://github.com/xesgithub/courtside-solo-stat-/releases/tag/v0.3.8
[0.3.7]: https://github.com/xesgithub/courtside-solo-stat-/releases/tag/v0.3.7
[0.3.6]: https://github.com/xesgithub/courtside-solo-stat-/releases/tag/v0.3.6
[0.3.5]: https://github.com/xesgithub/courtside-solo-stat-/releases/tag/v0.3.5
[0.3.4]: https://github.com/xesgithub/courtside-solo-stat-/releases/tag/v0.3.4
[0.3.3]: https://github.com/xesgithub/courtside-solo-stat-/releases/tag/v0.3.3
[0.3.2]: https://github.com/xesgithub/courtside-solo-stat-/releases/tag/v0.3.2
[0.3.1]: https://github.com/xesgithub/courtside-solo-stat-/releases/tag/v0.3.1
[0.3.0]: https://github.com/xesgithub/courtside-solo-stat-/releases/tag/v0.3.0
[0.2.0]: https://github.com/xesgithub/courtside-solo-stat-/releases/tag/v0.2.0
[0.1.0]: https://github.com/xesgithub/courtside-solo-stat-/releases/tag/v0.1.0
