# Changelog

บันทึกการเปลี่ยนแปลงที่สำคัญของ COURTSIDE — Solo Stat
รูปแบบอิงตาม [Keep a Changelog](https://keepachangelog.com/) และใช้ [Semantic Versioning](https://semver.org/)

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

[0.3.1]: https://github.com/xesgithub/courtside-solo-stat-/releases/tag/v0.3.1
[0.3.0]: https://github.com/xesgithub/courtside-solo-stat-/releases/tag/v0.3.0
[0.2.0]: https://github.com/xesgithub/courtside-solo-stat-/releases/tag/v0.2.0
[0.1.0]: https://github.com/xesgithub/courtside-solo-stat-/releases/tag/v0.1.0
