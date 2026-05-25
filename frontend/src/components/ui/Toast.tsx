"use client";

import { useState, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-xs">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={`p-4 rounded-2xl border-2 flex items-start gap-3 shadow-2xl backdrop-blur-xl ${
                toast.type === "success" 
                  ? "bg-zinc-900/90 border-green-500/50 text-white" 
                  : toast.type === "error"
                  ? "bg-zinc-900/90 border-red-500/50 text-white"
                  : "bg-zinc-900/90 border-blue-500/50 text-white"
              }`}
            >
              <div className="mt-0.5">
                {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
                {toast.type === "info" && <Info className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-widest mb-1">
                  {toast.type}
                </p>
                <p className="text-sm font-medium text-zinc-300">
                  {toast.message}
                </p>
              </div>
              <button 
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-zinc-500 hover:text-white"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useGameToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useGameToast must be used within ToastProvider");
  return context;
}
