'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'
import DashboardHeader from './Header'
import StatsBar from './StatsBar'
import TaskTable from './TaskTable'
import TaskFormModal from './TaskFormModal'
import Sidebar from './Sidebar'
import { progressForStatus, type TaskDTO } from './types'
import { isOverdueAt } from '@/lib/utils'

const Tooltip = dynamic(
  () => import('react-tooltip').then((mod) => mod.Tooltip),
  { ssr: false },
)

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

type DashboardClientProps = {
  serverNow: number
  user: { name: string; email: string }
  tasks?: TaskDTO[]
  initialTasks?: TaskDTO[]
}

export default function DashboardClient(rawProps?: Partial<DashboardClientProps>) {
  const props = rawProps ?? {}
  const {
    serverNow = 0,
    user = { name: '', email: '' },
    tasks,
    initialTasks,
  } = props
  const taskList = Array.isArray(tasks)
    ? tasks
    : Array.isArray(initialTasks)
      ? initialTasks
      : []
  const [now, setNow] = useState(serverNow)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<TaskDTO | null>(null)

  useEffect(() => {
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const stats = useMemo(() => {
    const total = taskList.length
    const done = taskList.filter((t) => t.status === 'DONE').length
    const pending = total - done
    const overdue = taskList.filter((t) =>
      isOverdueAt(t.dueDate, t.status === 'DONE', now),
    ).length
    return { total, done, pending, overdue }
  }, [taskList, now])

  const completion = useMemo(() => {
    if (!taskList.length) return 0
    const sum = taskList.reduce((s, t) => s + progressForStatus(t.status), 0)
    return Math.round(sum / taskList.length)
  }, [taskList])

  const today = new Date(now)
  const todayTasks = useMemo(() => {
    return taskList
      .filter((t) => {
        if (t.status === 'DONE') return false
        if (!t.dueDate) return false
        const due = new Date(t.dueDate)
        return isSameDay(due, today) || isOverdueAt(t.dueDate, false, now)
      })
      .sort((a, b) => {
        const ad = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
        const bd = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
        return ad - bd
      })
  }, [taskList, now, today])

  return (
    <div className="min-h-screen">
      <DashboardHeader user={user} onAdd={() => setShowAdd(true)} />

      <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 sm:pb-12 sm:pt-6 space-y-5">
        <StatsBar
          total={stats.total}
          done={stats.done}
          pending={stats.pending}
          overdue={stats.overdue}
        />

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-5 min-w-0">
            <TaskTable
              title="งานที่ต้องทำวันนี้"
              tasks={todayTasks}
              now={now}
              onEdit={(t) => setEditing(t)}
              emptyText="วันนี้ยังไม่มีงานครบกำหนด 🎉"
              accent="amber"
            />

            <div className="lg:hidden">
              <Sidebar
                tasks={taskList}
                now={now}
                completion={completion}
                onEdit={(t) => setEditing(t)}
              />
            </div>

            <TaskTable
              title="รายการงานทั้งหมด"
              tasks={taskList}
              now={now}
              onEdit={(t) => setEditing(t)}
              onAdd={() => setShowAdd(true)}
              showDaysLeft
              showProgress
              emptyText="ยังไม่มีงาน — กดปุ่ม + เพื่อเพิ่มงานแรก"
              accent="brand"
            />
          </div>

          <aside className="hidden lg:sticky lg:top-24 lg:self-start lg:block">
            <Sidebar
              tasks={taskList}
              now={now}
              completion={completion}
              onEdit={(t) => setEditing(t)}
            />
          </aside>
        </div>
      </main>

      {/* Floating add button */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-6 z-30 grid h-14 w-14 place-items-center rounded-full bg-gradient-brand text-white shadow-2xl shadow-indigo-500/40 transition active:scale-95 sm:bottom-8 sm:right-8"
        data-tooltip-id="tt"
        data-tooltip-content="เพิ่มงานใหม่"
        aria-label="เพิ่มงานใหม่"
      >
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <TaskFormModal open={showAdd} onClose={() => setShowAdd(false)} />
      <TaskFormModal
        open={!!editing}
        task={editing ?? undefined}
        onClose={() => setEditing(null)}
      />

      <Tooltip id="tt" className="!z-[90] !rounded-lg !bg-slate-900 !px-2.5 !py-1.5 !text-xs" />
    </div>
  )
}
