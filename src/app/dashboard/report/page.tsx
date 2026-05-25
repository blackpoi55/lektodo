import { prisma } from '@/lib/prisma'
import { requireSession } from '@/lib/session'
import ReportClient from '@/components/dashboard/report/ReportClient'

export const dynamic = 'force-dynamic'

export default async function ReportPage() {
  const session = await requireSession()
  const tasks = await prisma.task.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <ReportClient
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
        dueDate: t.dueDate ? t.dueDate.toISOString() : null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        completedAt: t.completedAt ? t.completedAt.toISOString() : null,
        userId: t.userId,
      }))}
    />
  )
}
