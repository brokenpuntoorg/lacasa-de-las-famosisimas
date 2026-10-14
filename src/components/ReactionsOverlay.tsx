import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ReactionEmoji } from '../types';
import { socketService } from '../services/socketService';
import { sounds } from '../services/soundEffects';

interface ReactionsOverlayProps {
  playerName: string;
}

const EMOJI_BUTTONS = ['🔥', '⚡', '💥', '🧀', '🥐', '🧈', '👑', '🎯', '💯'];

export const ReactionsOverlay: React.FC<ReactionsOverlayProps> = ({ playerName }) => {
  const [floatingEmojis, setFloatingEmojis] = useState<ReactionEmoji[]>([]);

  useEffect(() => {
    const unsub = socketService.subscribeReaction((reaction) => {
      setFloatingEmojis((prev) => [...prev, reaction]);
      setTimeout(() => {
        setFloatingEmojis((prev) => prev.filter((item) => item.id !== reaction.id));
      }, 2400);
    });
    return unsub;
  }, []);

  const sendReaction = (emoji: string) => {
    sounds.playSquish();
    const x = 15 + Math.random() * 70; // percentage
    const y = 80;
    const reaction: ReactionEmoji = {
      id: Math.random().toString(36).substring(2, 9),
      emoji,
      x,
      y,
      senderName: playerName,
      createdAt: Date.now(),
    };

    setFloatingEmojis((prev) => [...prev, reaction]);
    socketService.send({
      type: 'reaction',
      payload: { emoji, x, y, senderName: playerName },
    });

    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== reaction.id));
    }, 2400);
  };

  return (
    <>
      {/* Floating Emojis Canvas */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        <AnimatePresence>
          {floatingEmojis.map((item) => (
            <motion.div
              key={item.id}
              initial={{
                opacity: 0,
                scale: 0.5,
                x: `${item.x}vw`,
                y: '82vh',
              }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0.6, 1.3, 1.1, 0.8],
                y: '20vh',
                x: `${item.x + (Math.sin(item.id.charCodeAt(0)) * 12)}vw`,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
              className="absolute flex flex-col items-center select-none"
            >
              <span className="text-3xl drop-shadow-md">{item.emoji}</span>
              {item.senderName && (
                <span className="text-[10px] font-bold text-red-400 bg-zinc-900/90 border border-zinc-700 px-2 py-0.5 rounded-full shadow-lg backdrop-blur-sm -mt-1">
                  {item.senderName}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Floating Reaction Bar (above bottom tab bar) */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 bg-zinc-900/95 backdrop-blur-md rounded-full shadow-2xl border border-zinc-800 max-w-[92vw] overflow-x-auto">
        <span className="text-[10px] font-black uppercase tracking-wider text-red-500 pl-2 pr-1 hidden sm:inline whitespace-nowrap">
          Reaccionar:
        </span>
        {EMOJI_BUTTONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => sendReaction(emoji)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:scale-125 active:scale-95 transition bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700/60 shrink-0 cursor-pointer"
            title={`Enviar ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
};
