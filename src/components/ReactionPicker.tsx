'use client';

import { useState } from 'react';

const reactions = ['👍', '👎', '❤️', '😂', '👏', '🎉'];

interface ReactionPickerProps {
  onReaction: (emoji: string) => void;
}

export function ReactionPicker({ onReaction }: ReactionPickerProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShow(!show)}
        className={`p-3 rounded-xl border transition-all ${
          show
            ? 'border-white/30 bg-white/15 text-white'
            : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
        }`}
        title="Reactions (R)"
      >
        <span className="text-lg leading-none">😊</span>
      </button>

      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 animate-fade-in-up">
          <div className="flex items-center gap-1 px-2 py-1.5 bg-black/90 border border-white/15 backdrop-blur-xl rounded-xl shadow-2xl">
            {reactions.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onReaction(emoji);
                  setShow(false);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-lg"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
