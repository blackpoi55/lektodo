'use client'

import { AlertTriangle, CheckCircle2, Clock, ListChecks } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function StatsBar({
  total,
  done,
  pending,
  overdue,
}: {
  total: number
  done: number
  pending: number
  overdue: number
}) {
  const cards = [
    {
      label: 'งานทั้งหมด',
      sub: `ทั้งหมด ${total} งาน`,
      value: total,
      icon: ListChecks,
      gradient: 'from-sky-400 to-blue-500',
      bg: 'from-sky-50 to-blue-50 dark:from-sky-500/10 dark:to-blue-500/10',
    },
    {
      label: 'งานเสร็จแล้ว',
      sub: `เสร็จแล้ว ${done} งาน`,
      value: done,
      icon: CheckCircle2,
      gradient: 'from-emerald-400 to-green-500',
      bg: 'from-emerald-50 to-green-50 dark:from-emerald-500/10 dark:to-green-500/10',
    },
    {
      label: 'งานค้าง',
      sub: `ค้าง ${pending} งาน`,
      value: pending,
      icon: Clock,
      gradient: 'from-amber-400 to-orange-500',
      bg: 'from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10',
    },
    {
      label: 'เลยกำหนด',
      sub: `เลย ${overdue} งาน`,
      value: overdue,
      icon: AlertTriangle,
      gradient: 'from-rose-400 to-red-500',
      bg: 'from-rose-50 to-red-50 dark:from-rose-500/10 dark:to-red-500/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div
            key={c.label}
            className={cn(
              'glass relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br',
              c.bg,
            )}
          >
            <div
              className={cn(
                'absolute -right-4 -top-4 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br opacity-90 text-white shadow-lg',
                c.gradient,
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="relative">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {c.label}
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">
                {c.value}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{c.sub}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
