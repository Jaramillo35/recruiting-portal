'use client'

import { useEffect, useState } from 'react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastProps {
  toast: Toast
  onRemove: (id: string) => void
}

export function ToastComponent({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, 5000)

    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500'
  }[toast.type]

  return (
    <div
      className={`${bgColor} text-white px-4 py-3 rounded-md shadow-lg mb-2 flex items-center justify-between min-w-80`}
      role="status"
      aria-live="polite"
    >
      <span>{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-4 text-white hover:text-gray-200"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, onRemove }: { toasts: Toast[], onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-50">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return {
    toasts,
    addToast,
    removeToast
  }
}
