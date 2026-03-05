'use client';

import { useEffect, useState } from 'react';
import { useRoomStore } from '@/store/useRoomStore';
import { Reaction } from '@/types';

interface FloatingReaction extends Reaction {
  id: string;
  x: number;
}

export function ReactionOverlay() {
  const reactions = useRoomStore((s) => s.reactions);
  const [floating, setFloating] = useState<FloatingReaction[]>([]);

  useEffect(() => {
    if (reactions.length === 0) return;
    const latest = reactions[reactions.length - 1];
    const id = `${latest.peerId}-${latest.timestamp}`;

    // Don't add duplicates
    setFloating((prev) => {
      if (prev.some((r) => r.id === id)) return prev;
      return [...prev, { ...latest, id, x: 20 + Math.random() * 60 }];
    });

    // Remove after animation
    const timer = setTimeout(() => {
      setFloating((prev) => prev.filter((r) => r.id !== id));
    }, 3000);

    return () => clearTimeout(timer);
  }, [reactions]);

  if (floating.length === 0) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
      {floating.map((r) => (
        <div
          key={r.id}
          className="absolute animate-float-up"
          style={{ left: `${r.x}%`, bottom: '100px' }}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-3xl">{r.emoji}</span>
            <span className="text-white/40 text-[10px] tracking-wider uppercase bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm">
              {r.displayName}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
