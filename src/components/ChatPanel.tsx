'use client';

import { useState, useRef, useEffect } from 'react';
import { useRoomStore } from '@/store/useRoomStore';

interface ChatPanelProps {
  onSendMessage: (message: string) => void;
}

export function ChatPanel({ onSendMessage }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const chatMessages = useRoomStore((s) => s.chatMessages);
  const toggleChat = useRoomStore((s) => s.toggleChat);
  const peerId = useRoomStore((s) => s.peerId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputValue('');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-80 bg-black border-l border-white/10 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-white/80 font-light tracking-wide text-sm uppercase">Chat</h2>
        <button
          onClick={toggleChat}
          className="text-white/30 hover:text-white/70 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 && (
          <p className="text-white/20 text-xs text-center mt-8 tracking-wide uppercase">
            No messages yet
          </p>
        )}
        {chatMessages.map((msg, i) => {
          const isOwn = msg.peerId === peerId;
          return (
            <div key={i} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] text-white/40 tracking-wide uppercase">
                  {isOwn ? 'You' : msg.displayName}
                </span>
                <span className="text-[10px] text-white/20">{formatTime(msg.timestamp)}</span>
              </div>
              <div
                className={`px-3 py-2 rounded-lg max-w-[85%] text-sm ${
                  isOwn
                    ? 'bg-white text-black'
                    : 'bg-white/5 border border-white/10 text-white/80'
                }`}
              >
                {msg.message}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors font-light"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="px-3 py-2 bg-white hover:bg-white/90 disabled:bg-white/5 disabled:border-white/5 disabled:text-white/20 text-black rounded-lg transition-all border border-transparent disabled:border-white/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
