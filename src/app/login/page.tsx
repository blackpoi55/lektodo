import LoginForm from '@/components/auth/LoginForm'
import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-mesh" />
      <div className="relative w-full max-w-md animate-slide-up">
        <div className="glass rounded-3xl p-8 sm:p-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand text-white shadow-lg shadow-indigo-500/40">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                ยินดีต้อนรับกลับ
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                เข้าสู่ระบบเพื่อจัดการงานของคุณ
              </p>
            </div>
          </div>

          <LoginForm />

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            ยังไม่มีบัญชี?{' '}
            <Link
              href="/register"
              className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-400"
            >
              สมัครเลย
            </Link>
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          LekToDo · จัดการงานง่ายๆ ใช้ได้ทั้งคอมและมือถือ
        </p>
      </div>
    </div>
  )
}
