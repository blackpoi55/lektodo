# LekToDo

แอป To-Do สวยงาม ทันสมัย ใช้งานง่าย รองรับทั้งคอมและมือถือ (PWA) สร้างด้วย Next.js + Tailwind + Prisma + Supabase

## ฟีเจอร์เด่น

- ระบบสมาชิก (สมัคร / เข้าสู่ระบบ / ออกจากระบบ) — JWT ใน HTTP-only cookie
- จัดการงาน CRUD เต็มรูปแบบผ่าน Server Actions
- สถานะงาน 3 ระดับ: รอทำ / กำลังทำ / เสร็จแล้ว (คลิกไอคอนเพื่อสลับสถานะอย่างรวดเร็ว)
- แถบเลื่อน % ความคืบหน้า (0–100) อัปเดตทันที, อัตโนมัติเปลี่ยนเป็น "เสร็จ" เมื่อถึง 100%
- ระดับความสำคัญ 4 ระดับ พร้อมแถบสีด้านข้างการ์ด
- ปักหมุดงานสำคัญขึ้นบนสุด
- กำหนดวันครบกำหนด พร้อมไฮไลต์งานที่เลยกำหนด
- หมวดหมู่งาน
- ตัวกรอง (สถานะ / ความสำคัญ / คำค้นหา) + การจัดเรียงหลายแบบ
- สถิติภาพรวมและ % ความคืบหน้ารวมของทั้งหมด
- โหมดมืด/สว่าง (จำค่า ใช้กับระบบอัตโนมัติ)
- SweetAlert2 สำหรับยืนยัน + Toast แจ้งเตือน
- ไอคอน Lucide + Tooltips ครบทุกปุ่ม
- รองรับ PWA — ติดตั้งเป็นแอปบนมือถือ/คอมได้
- หน้าออฟไลน์สวยๆ
- หน้าเดียวจบ จัดการทุกอย่างได้จากแดชบอร์ด
- รองรับ Responsive ทั้งมือถือและเดสก์ท็อป
- ปุ่ม Floating Add ที่มุมขวาล่างสำหรับมือถือ

## เทคโนโลยี

- **Next.js 14 (App Router)** + **TypeScript**
- **Tailwind CSS** พร้อม glassmorphism และ gradients ทันสมัย
- **Prisma ORM** + **Supabase PostgreSQL** (connection pooling)
- **Server Actions** สำหรับทุก mutation
- **JWT (jose)** สำหรับ session
- **bcryptjs** เข้ารหัสรหัสผ่าน
- **SweetAlert2** สำหรับ alert/toast
- **Lucide React** ไอคอน + **react-tooltip**
- **PWA** (manifest + service worker)

## การตั้งค่า

```bash
# 1) ติดตั้ง dependencies
npm install

# 2) ตั้งค่า .env (มี Supabase URL และ JWT_SECRET ให้แล้ว)
#    ⚠️ เปลี่ยน JWT_SECRET ก่อนใช้งานจริง

# 3) sync schema เข้าฐานข้อมูล Supabase
npm run db:push

# 4) รันโหมด dev
npm run dev

# 5) build production
npm run build
```

เปิด http://localhost:3000

## Deploy ไป Vercel

1. push โค้ดขึ้น GitHub
2. เชื่อมต่อ repo กับ Vercel
3. ตั้ง Environment Variables: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`
4. กด Deploy — Vercel จะรัน `prisma generate && next build` ให้อัตโนมัติ

## โครงสร้างไฟล์หลัก

```
src/
├── app/
│   ├── layout.tsx          # root layout + theme + SW register
│   ├── page.tsx            # redirect login/dashboard
│   ├── globals.css
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── dashboard/page.tsx  # หน้าเดียวจบ
├── actions/
│   ├── auth.ts             # register / login / logout
│   └── tasks.ts            # CRUD + progress + pin
├── components/
│   ├── auth/               # LoginForm, RegisterForm
│   ├── dashboard/          # Header, StatsBar, TaskCard, TaskFormModal
│   └── ui/toast.ts         # SweetAlert2 helpers
├── lib/
│   ├── prisma.ts
│   ├── session.ts          # JWT helpers
│   └── utils.ts
└── middleware.ts           # route protection
public/
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker
├── offline.html            # หน้าออฟไลน์
└── icon.svg
prisma/schema.prisma
```

## Keyboard / UX Tips

- `Esc` ปิด modal
- คลิก vงกลมสถานะที่การ์ดเพื่อสลับ TODO → IN_PROGRESS → DONE
- ลากแถบเลื่อน % เพื่ออัปเดตความคืบหน้าทันที (เมื่อถึง 100% สถานะจะเปลี่ยนเป็นเสร็จอัตโนมัติ)
- ปักหมุดงานสำคัญเพื่อให้อยู่บนสุดเสมอ
