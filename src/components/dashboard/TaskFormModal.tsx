'use client'

import { createTaskAction, updateTaskAction } from '@/actions/tasks'
import { cn } from '@/lib/utils'
import { TaskPriority, TaskStatus } from '@prisma/client'
import { Loader2, Save, X } from 'lucide-react'
import { useEffect, useRef, useState, useTransition } from 'react'
import { toast } from '@/components/ui/toast'
import ThaiDatePicker from '@/components/ui/ThaiDatePicker'
import CategorySelect from '@/components/ui/CategorySelect'
import {
  PRIORITY_META,
  STATUS_META,
  STATUS_ORDER,
  STATUS_PROGRESS,
  type TaskDTO,
} from './types'

export default function TaskFormModal({
  open,
  onClose,
  task,
}: {
  open: boolean
  onClose: () => void
  task?: TaskDTO
}) {
  const isEdit = !!task
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? 'TODO')
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'MEDIUM')
  const titleRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setStatus(task?.status ?? 'TODO')
      setPriority(task?.priority ?? 'MEDIUM')
      setTimeout(() => titleRef.current?.focus(), 50)
    }
  }, [open, task])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const dueDateValue = task?.dueDate ? toDateOnly(task.dueDate) : ''

  const onSubmit = (formData: FormData) => {
    formData.set('status', status)
    formData.set('priority', priority)
    startTransition(async () => {
      const res = isEdit
        ? await updateTaskAction(task!.id, formData)
        : await createTaskAction(formData)
      if (res.ok) {
        toast.success(isEdit ? 'อัปเดตแล้ว' : 'เพิ่มงานเรียบร้อย')
        onClose()
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 animate-fade-in">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto glass rounded-3xl p-6 animate-slide-up shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEdit ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}
          </h2>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 dark:hover:bg-white/10"
            aria-label="ปิด"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form action={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              การกิจ / งาน <span className="text-rose-500">*</span>
            </label>
            <input
              ref={titleRef}
              name="title"
              type="text"
              required
              defaultValue={task?.title ?? ''}
              placeholder="เช่น ทำวิดีโอ"
              className="input"
              maxLength={120}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              รายละเอียด
            </label>
            <textarea
              name="description"
              rows={2}
              defaultValue={task?.description ?? ''}
              placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
              className="input resize-none"
              maxLength={2000}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                ประเภทงาน
              </label>
              <CategorySelect name="category" defaultValue={task?.category ?? ''} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                วันที่ Deadline
              </label>
              <ThaiDatePicker name="dueDate" defaultValue={dueDateValue} placeholder="เลือกวันที่" />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                ความสำคัญ
              </label>
              <div className="flex gap-1.5">
                {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      'flex-1 rounded-xl px-1 py-2 text-xs font-semibold transition',
                      priority === p
                        ? cn(PRIORITY_META[p].chip, 'ring-2 ring-offset-1 ring-current scale-105')
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10',
                    )}
                  >
                    {PRIORITY_META[p].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300">
                <span>สถานะ</span>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  {STATUS_PROGRESS[status]}%
                </span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {STATUS_ORDER.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={cn(
                      'rounded-xl px-2 py-2.5 text-xs font-semibold transition',
                      status === s
                        ? cn(STATUS_META[s].chip, 'ring-2 ring-offset-1 ring-current scale-105')
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10',
                    )}
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{STATUS_META[s].label}</span>
                      <span className="text-[10px] opacity-75">{STATUS_PROGRESS[s]}%</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              ยกเลิก
            </button>
            <button type="submit" disabled={pending} className="btn-primary flex-1">
              {pending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังบันทึก…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  บันทึก
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function toDateOnly(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
