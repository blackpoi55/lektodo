import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import DashboardClient from '@/components/dashboard/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await requireSession()
  const serverNow = Date.now()
  const tasks = await prisma.task.findMany({
    where: { userId: session.userId },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    include: { logs: { orderBy: { date: 'desc' } } },
  })

  return (
    <DashboardClient
      serverNow={serverNow}
      user={{ name: session.name || session.email, email: session.email }}
      tasks={tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        progress: t.progress,
        category: t.category,
        pinned: t.pinned,
        startDate: t.startDate ? t.startDate.toISOString() : null,
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        completedAt: t.completedAt ? t.completedAt.toISOString() : null,
        userId: t.userId,
        logs: t.logs.map((l) => ({
          id: l.id,
          taskId: l.taskId,
          date: l.date.toISOString(),
          note: l.note,
          createdAt: l.createdAt.toISOString(),
        })),
      }))}
    />
  )
}
