import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Crown, Trophy, Flame, X } from 'lucide-react';
import { SquishyParticipant } from '../types';
import { SquishyAvatar } from './SquishyAvatar';
import { sounds } from '../services/soundEffects';

interface VictoryModalProps {
  squishy: SquishyParticipant;
  votesWon: number;
  totalVotes: number;
  isSeasonChampion?: boolean;
  onClose: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  squishy,
  votesWon,
  totalVotes,
  isSeasonChampion = false,
  onClose,
}) => {
  // ESCAPE KEY LISTENER
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    sounds.playVictory();

    // Confetti cannon
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#DC2626', '#EF4444', '#F59E0B', '#10B981', '#FFFFFF'],
    });

    if (isSeasonChampion) {
      setTimeout(() => {
        confetti({
          particleCount: 150,
          angle: 60,
          spread: 60,
          origin: { x: 0 },
          colors: ['#DC2626', '#F59E0B', '#FFFFFF'],
        });
        confetti({
          particleCount: 150,
          angle: 120,
          spread: 60,
          origin: { x: 1 },
          colors: ['#DC2626', '#F59E0B', '#FFFFFF'],
        });
      }, 400);
    }
  }, [isSeasonChampion]);

  const percentage = totalVotes > 0 ? Math.round((votesWon / totalVotes) * 100) : 100;

  return (
    <>
      {/* Tache flotante superior fijo */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar modal de victoria"
        className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[70] flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-zinc-900/95 hover:bg-red-600 text-zinc-200 hover:text-white border-2 border-zinc-700 hover:border-red-500 shadow-2xl transition-all duration-200 active:scale-95 cursor-pointer backdrop-blur-md"
      >
        <X className="w-4 h-4 stroke-[2.5]" />
        <span className="text-xs font-black uppercase tracking-wider">Cerrar</span>
      </button>

      <div
        onClick={onClose}
        className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 md:p-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm sm:max-w-md bg-zinc-900 rounded-3xl shadow-2xl border-2 border-zinc-800 overflow-hidden text-center relative text-zinc-100 my-auto"
        >
          {/* Tache en la tarjeta */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-20 w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-zinc-800/90 hover:bg-red-600 active:bg-red-700 border border-zinc-700 text-zinc-200 hover:text-white flex items-center justify-center transition shadow-md cursor-pointer"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Header background with banner */}
          <div className="p-5 sm:p-6 pb-3 bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 border-b border-zinc-800">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-950 border border-red-800/80 shadow-md text-xs font-black uppercase tracking-wider text-red-400 mb-2">
              {isSeasonChampion ? (
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Crown className="w-3.5 h-3.5 text-red-500" />
              )}
              <span>{isSeasonChampion ? '¡CAMPEÓN ABSOLUTO!' : '¡VICTORIA EN LA RONDA!'}</span>
            </div>

            <div className="relative my-3 flex items-center justify-center bg-zinc-950/60 rounded-2xl p-3 border border-zinc-800/80">
              {/* Animated Crown floating above */}
              <motion.div
                animate={{ y: [-4, 4, -4], rotate: [-4, 4, -4] }}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className="absolute -top-5 text-3xl z-10"
              >
                👑
              </motion.div>
              <SquishyAvatar id={squishy.id} size="xl" imageUrl={squishy.imageUrl} isWinning interactive />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-zinc-100 uppercase tracking-tight">
              {squishy.name}
            </h3>
            <p className="text-xs text-red-400 font-bold uppercase tracking-wider">{squishy.nickname}</p>
          </div>

          {/* Stats and praise */}
          <div className="p-5 sm:p-6 pt-3 space-y-4">
            <p className="text-xs text-zinc-400 italic">
              "{squishy.personality}"
            </p>

            <div className="bg-zinc-950 rounded-2xl p-3.5 border border-zinc-800 flex items-center justify-around">
              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-500">Votos Obtenidos</div>
                <div className="text-lg sm:text-xl font-black text-red-500 tabular-nums">{votesWon}</div>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div>
                <div className="text-[10px] uppercase font-bold text-zinc-500">Dominio</div>
                <div className="text-lg sm:text-xl font-black text-zinc-200 tabular-nums">{percentage}%</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 sm:py-3.5 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl shadow-red-950/80 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4 fill-white" />
              <span>Continuar el Combate</span>
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
};
