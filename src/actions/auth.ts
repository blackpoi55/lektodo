'use server'

import { prisma } from '@/lib/prisma'
import { createSession, destroySession } from '@/lib/session'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(60),
  email: z.string().trim().toLowerCase().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(6, 'รหัสผ่านอย่างน้อย 6 ตัวอักษร').max(100),
})

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('อีเมลไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
})

export type ActionResult = { ok: true } | { ok: false; error: string }

export async function registerAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (existing) return { ok: false, error: 'อีเมลนี้ถูกใช้งานแล้ว' }

  const hashed = await bcrypt.hash(parsed.data.password, 10)
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      password: hashed,
      name: parsed.data.name,
    },
  })

  await createSession({ userId: user.id, email: user.email, name: user.name })
  redirect('/dashboard')
}

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message }
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
  if (!user) return { ok: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }

  const valid = await bcrypt.compare(parsed.data.password, user.password)
  if (!valid) return { ok: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }

  await createSession({ userId: user.id, email: user.email, name: user.name })
  redirect('/dashboard')
}

export async function logoutAction() {
  await destroySession()
  redirect('/login')
}
