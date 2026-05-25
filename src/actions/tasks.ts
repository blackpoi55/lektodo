'use server'

import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import { TaskPriority, TaskStatus } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const STATUS_PROGRESS: Record<TaskStatus, number> = {
  TODO: 0,
  IN_PROGRESS: 50,
  FOLLOW_UP: 75,
  DONE: 100,
}

const taskSchema = z.object({
  title: z.string().trim().min(1, 'กรุณากรอกชื่องาน').max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  category: z.string().trim().max(40).optional().nullable(),
})

type TaskActionResult = { ok: true; id?: string } | { ok: false; error: string }

function parseDate(value: FormDataEntryValue | null, boundary: 'start' | 'end') {
  if (!value || typeof value !== 'string' || !value.trim()) return null
  const s = value.trim()
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (m) {
    return boundary === 'end'
      ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59)
      : new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0)
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

export async function createTaskAction(formData: FormData): Promise<TaskActionResult> {
  try {
    const session = await requireSession()
    const parsed = taskSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description') || null,
      priority: (formData.get('priority') as TaskPriority) || TaskPriority.MEDIUM,
      status: (formData.get('status') as TaskStatus) || TaskStatus.TODO,
      startDate: (formData.get('startDate') as string) || null,
      dueDate: (formData.get('dueDate') as string) || null,
      category: (formData.get('category') as string) || null,
    })
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

    const data = parsed.data
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        status: data.status,
        progress: STATUS_PROGRESS[data.status],
        startDate: parseDate(formData.get('startDate'), 'start'),
        dueDate: parseDate(formData.get('dueDate'), 'end'),
        category: data.category || null,
        completedAt: data.status === 'DONE' ? new Date() : null,
        userId: session.userId,
      },
    })
    revalidatePath('/dashboard')
    return { ok: true, id: task.id }
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'เกิดข้อผิดพลาด' }
  }
}

export async function updateTaskAction(id: string, formData: FormData): Promise<TaskActionResult> {
  try {
    const session = await requireSession()
    const parsed = taskSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description') || null,
      priority: (formData.get('priority') as TaskPriority) || TaskPriority.MEDIUM,
      status: (formData.get('status') as TaskStatus) || TaskStatus.TODO,
      startDate: (formData.get('startDate') as string) || null,
      dueDate: (formData.get('dueDate') as string) || null,
      category: (formData.get('category') as string) || null,
    })
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message }

    const existing = await prisma.task.findFirst({ where: { id, userId: session.userId } })
    if (!existing) return { ok: false, error: 'ไม่พบงานนี้' }

    const data = parsed.data
    const becameDone = data.status === 'DONE' && existing.status !== 'DONE'

    await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        status: data.status,
        progress: STATUS_PROGRESS[data.status],
        startDate: parseDate(formData.get('startDate'), 'start'),
        dueDate: parseDate(formData.get('dueDate'), 'end'),
        category: data.category || null,
        completedAt:
          data.status === 'DONE'
            ? becameDone
              ? new Date()
              : existing.completedAt
            : null,
      },
    })
    revalidatePath('/dashboard')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'เกิดข้อผิดพลาด' }
  }
}

export async function deleteTaskAction(id: string): Promise<TaskActionResult> {
  try {
    const session = await requireSession()
    await prisma.task.deleteMany({ where: { id, userId: session.userId } })
    revalidatePath('/dashboard')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'เกิดข้อผิดพลาด' }
  }
}

export async function setTaskStatusAction(
  id: string,
  status: TaskStatus,
): Promise<TaskActionResult> {
  try {
    const session = await requireSession()
    const existing = await prisma.task.findFirst({ where: { id, userId: session.userId } })
    if (!existing) return { ok: false, error: 'ไม่พบงาน' }

    await prisma.task.update({
      where: { id },
      data: {
        status,
        progress: STATUS_PROGRESS[status],
        completedAt:
          status === 'DONE' ? existing.completedAt ?? new Date() : null,
      },
    })
    revalidatePath('/dashboard')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'เกิดข้อผิดพลาด' }
  }
}

export async function togglePinTaskAction(id: string): Promise<TaskActionResult> {
  try {
    const session = await requireSession()
    const existing = await prisma.task.findFirst({ where: { id, userId: session.userId } })
    if (!existing) return { ok: false, error: 'ไม่พบงาน' }
    await prisma.task.update({ where: { id }, data: { pinned: !existing.pinned } })
    revalidatePath('/dashboard')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'เกิดข้อผิดพลาด' }
  }
}

export async function clearCompletedTasksAction(): Promise<TaskActionResult> {
  try {
    const session = await requireSession()
    await prisma.task.deleteMany({ where: { userId: session.userId, status: 'DONE' } })
    revalidatePath('/dashboard')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message || 'เกิดข้อผิดพลาด' }
  }
}
