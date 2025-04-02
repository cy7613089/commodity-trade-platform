"use client"

import { useState } from "react"

const TOAST_TIMEOUT = 5000

export type ToastProps = {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

type ToastActionType = (props: Omit<ToastProps, "id">) => void

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const toast: ToastActionType = (props) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { id, ...props }
    
    setToasts((prevToasts) => [...prevToasts, newToast])
    
    setTimeout(() => {
      setToasts((prevToasts) => 
        prevToasts.filter((toast) => toast.id !== id)
      )
    }, TOAST_TIMEOUT)

    return id
  }

  return {
    toasts,
    toast,
  }
} 