'use client';

import { useToastStore } from '@/store/useToastStore';

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="animate-fade-in-up pointer-events-auto px-4 py-2.5 bg-black/90 border border-white/10 backdrop-blur-sm rounded-xl text-sm text-white/80 font-light tracking-wide shadow-2xl"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
