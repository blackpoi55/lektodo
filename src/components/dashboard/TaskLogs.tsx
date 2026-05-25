'use client'

import {
  addTaskLogAction,
  deleteTaskLogAction,
  updateTaskLogAction,
} from '@/actions/taskLogs'
import ThaiDatePicker, { formatThaiDateFull } from '@/components/ui/ThaiDatePicker'
import { confirmDelete, toast } from '@/components/ui/toast'
import { Calendar, Loader2, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { TaskLogDTO } from './types'

function toISODate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function TaskLogs({
  taskId,
  logs,
  autoFocus = false,
}: {
  taskId: string
  logs?: TaskLogDTO[]
  autoFocus?: boolean
}) {
  const logList = Array.isArray(logs) ? logs : []
  const [date, setDate] = useState(toISODate(new Date()))
  const [note, setNote] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editNote, setEditNote] = useState('')
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const sorted = useMemo(
    () => [...logList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [logList],
  )

  const add = () => {
    const n = note.trim()
    if (!n) return
    startTransition(async () => {
      const res = await addTaskLogAction(taskId, date, n)
      if (res.ok) {
        toast.success('เพิ่มบันทึกแล้ว')
        setNote('')
      } else {
        toast.error(res.error)
      }
    })
  }

  const remove = async (id: string) => {
    const ok = await confirmDelete('ต้องการลบบันทึกนี้?')
    if (!ok) return
    startTransition(async () => {
      const res = await deleteTaskLogAction(id)
      if (res.ok) toast.success('ลบเรียบร้อย')
      else toast.error(res.error)
    })
  }

  const startEdit = (log: TaskLogDTO) => {
    setEditingId(log.id)
    setEditDate(log.date.slice(0, 10))
    setEditNote(log.note)
  }

  const saveEdit = () => {
    if (!editingId) return
    const n = editNote.trim()
    if (!n) {
      setEditingId(null)
      return
    }
    const id = editingId
    startTransition(async () => {
      const res = await updateTaskLogAction(id, editDate, n)
      if (res.ok) {
        toast.success('อัปเดตแล้ว')
        setEditingId(null)
      } else toast.error(res.error)
    })
  }

  return (
    <div className="space-y-3">
      {/* Add new entry */}
      <div className="rounded-xl border border-dashed border-slate-300 p-2.5 dark:border-white/15">
        <div className="grid gap-2 sm:grid-cols-[170px_1fr_auto]">
          <ThaiDatePicker name="logDate" value={date} onChange={setDate} />
          <input
            ref={inputRef}
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                add()
              }
            }}
            placeholder="วันนี้ทำอะไรไป… แล้วกด Enter"
            className="input"
            maxLength={2000}
          />
          <button
            type="button"
            onClick={add}
            disabled={pending || !note.trim()}
            className="btn-primary !py-2 !px-3 !text-xs"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            เพิ่ม
          </button>
        </div>
      </div>

      {/* Timeline */}
      {sorted.length === 0 ? (
        <p className="py-3 text-center text-xs text-slate-400">ยังไม่มีบันทึก</p>
      ) : (
        <ul className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
          {sorted.map((log) => (
            <li
              key={log.id}
              className="group flex gap-2.5 rounded-xl bg-white/50 p-2.5 transition hover:bg-white/80 dark:bg-white/5 dark:hover:bg-white/10"
            >
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-pink-500 text-white shadow shadow-brand-500/30">
                <Calendar className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                {editingId === log.id ? (
                  <div className="space-y-1.5">
                    <div className="flex gap-1.5">
                      <div className="w-40">
                        <ThaiDatePicker
                          name="editLogDate"
                          value={editDate}
                          onChange={setEditDate}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="rounded-lg bg-emerald-500 px-2 text-white hover:bg-emerald-600"
                        aria-label="บันทึก"
                      >
                        <Save className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg bg-slate-200 px-2 text-slate-700 hover:bg-slate-300 dark:bg-white/10 dark:text-slate-200"
                        aria-label="ยกเลิก"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <textarea
                      autoFocus
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveEdit()
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                      rows={2}
                      className="input resize-none text-sm"
                      maxLength={2000}
                    />
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-bold text-brand-700 dark:text-brand-300">
                      {formatThaiDateFull(log.date)}
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                      {log.note}
                    </p>
                  </>
                )}
              </div>
              {editingId !== log.id && (
                <div className="flex shrink-0 items-start gap-0.5 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => startEdit(log)}
                    className="grid h-7 w-7 place-items-center rounded text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 dark:hover:bg-indigo-500/15"
                    aria-label="แก้ไข"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(log.id)}
                    className="grid h-7 w-7 place-items-center rounded text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/15"
                    aria-label="ลบ"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
