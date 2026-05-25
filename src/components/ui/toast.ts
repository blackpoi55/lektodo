'use client'

import Swal from 'sweetalert2'

const baseToast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2400,
  timerProgressBar: true,
  customClass: {
    popup: 'rounded-2xl shadow-2xl !p-3 !text-sm',
  },
  didOpen: (el) => {
    el.addEventListener('mouseenter', Swal.stopTimer)
    el.addEventListener('mouseleave', Swal.resumeTimer)
  },
})

export const toast = {
  success: (title: string) => baseToast.fire({ icon: 'success', title }),
  error: (title: string) => baseToast.fire({ icon: 'error', title }),
  info: (title: string) => baseToast.fire({ icon: 'info', title }),
  warn: (title: string) => baseToast.fire({ icon: 'warning', title }),
}

export const confirmDelete = async (text: string) => {
  const res = await Swal.fire({
    title: 'ยืนยันการลบ?',
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบเลย',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#94a3b8',
    customClass: { popup: 'rounded-2xl' },
  })
  return res.isConfirmed
}

export const confirmAction = async (title: string, text?: string, confirmText = 'ตกลง') => {
  const res = await Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#6366f1',
    cancelButtonColor: '#94a3b8',
    customClass: { popup: 'rounded-2xl' },
  })
  return res.isConfirmed
}
