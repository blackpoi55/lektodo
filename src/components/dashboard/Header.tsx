'use client'

import { logoutAction } from '@/actions/auth'
import { CheckCircle2, FileText, LogOut, Moon, Plus, Sun, User } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { confirmAction } from '@/components/ui/toast'

export default function DashboardHeader({
  user,
  onAdd,
}: {
  user: { name: string; email: string }
  onAdd: () => void
}) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const handleLogout = async () => {
    const ok = await confirmAction('ออกจากระบบ?', 'คุณต้องการออกจากระบบใช่หรือไม่', 'ออกจากระบบ')
    if (!ok) return
    await logoutAction()
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/40 bg-white/70 backdrop-blur-xl pt-safe dark:border-white/10 dark:bg-slate-950/60">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white shadow-lg shadow-indigo-500/30">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
              Smart To-Do List
            </h1>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              สวัสดี, {user.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
       

          <Link
            href="/dashboard/report"
            className="grid h-10 w-10 place-items-center rounded-xl bg-white/70 text-slate-600 transition hover:bg-white dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
            data-tooltip-id="tt"
            data-tooltip-content="ออกรายงาน PDF"
            aria-label="ออกรายงาน"
          >
            <FileText className="h-4 w-4" />
          </Link>

          <button
            onClick={toggleTheme}
            className="grid h-10 w-10 place-items-center rounded-xl bg-white/70 text-slate-600 transition hover:bg-white dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
            data-tooltip-id="tt"
            data-tooltip-content={dark ? 'โหมดสว่าง' : 'โหมดมืด'}
            aria-label="สลับธีม"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div
            className="hidden h-10 items-center gap-2 rounded-xl bg-white/70 px-3 text-sm text-slate-600 dark:bg-white/10 dark:text-slate-200 sm:flex"
            data-tooltip-id="tt"
            data-tooltip-content={user.email}
          >
            <User className="h-4 w-4 text-slate-400" />
            <span className="max-w-[140px] truncate">{user.email}</span>
          </div>

          <button
            onClick={handleLogout}
            className="grid h-10 w-10 place-items-center rounded-xl bg-white/70 text-rose-500 transition hover:bg-rose-50 dark:bg-white/10 dark:hover:bg-rose-500/15"
            data-tooltip-id="tt"
            data-tooltip-content="ออกจากระบบ"
            aria-label="ออกจากระบบ"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
