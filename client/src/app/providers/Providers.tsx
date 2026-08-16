"use client"
import { store } from "@/redux/store"
import { Provider } from "react-redux"
import { MotionConfig } from "motion/react"
import { ToastProvider } from "@/components/ui/Toast"

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            {/* Respects the OS-level "reduce motion" setting for every motion/react animation in the app */}
            <MotionConfig reducedMotion="user">
                <ToastProvider>{children}</ToastProvider>
            </MotionConfig>
        </Provider>
    )
}