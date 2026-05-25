'use server'

import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'

type Result = { ok: true; id?: string } | { ok: false; error: string }

function parseLogDate(value: string): Date | null {
  if (!value) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0)
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

async function ensureOwnsTask(userId: string, taskId: string) {
  const t = await prisma.task.findFirst({ where: { id: taskId, userId } })
  return !!t
}

export async function addTaskLogAction(
  taskId: string,
  date: string,
  note: string,
): Promise<Result> {
  try {
    const session = await requireSession()
    if (!(await ensureOwnsTask(session.userId, taskId)))
      return { ok: false, error: 'ไม่พบงาน' }
    const n = note.trim()
    if (!n) return { ok: false, error: 'กรุณากรอกบันทึก' }
    const d = parseLogDate(date) ?? new Date()
    const log = await prisma.taskLog.create({
      data: { taskId, date: d, note: n.slice(0, 2000) },
    })
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/report')
    return { ok: true, id: log.id }
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'เกิดข้อผิดพลาด' }
  }
}

export async function updateTaskLogAction(
  id: string,
  date: string,
  note: string,
): Promise<Result> {
  try {
    const session = await requireSession()
    const log = await prisma.taskLog.findUnique({
      where: { id },
      include: { task: { select: { userId: true } } },
    })
    if (!log || log.task.userId !== session.userId)
      return { ok: false, error: 'ไม่พบบันทึก' }
    const n = note.trim()
    if (!n) return { ok: false, error: 'กรุณากรอกบันทึก' }
    const d = parseLogDate(date) ?? log.date
    await prisma.taskLog.update({
      where: { id },
      data: { date: d, note: n.slice(0, 2000) },
    })
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/report')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'เกิดข้อผิดพลาด' }
  }
}

export async function deleteTaskLogAction(id: string): Promise<Result> {
  try {
    const session = await requireSession()
    const log = await prisma.taskLog.findUnique({
      where: { id },
      include: { task: { select: { userId: true } } },
    })
    if (!log || log.task.userId !== session.userId)
      return { ok: false, error: 'ไม่พบบันทึก' }
    await prisma.taskLog.delete({ where: { id } })
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/report')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'เกิดข้อผิดพลาด' }
  }
}
