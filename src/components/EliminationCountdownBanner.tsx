import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Flame, Clock, ShieldCheck, AlertTriangle, Share2, Sparkles, Skull } from 'lucide-react';
import { EliminationState } from '../types';
import { INITIAL_SQUISHIES } from '../data/squishies';
import { getWhatsAppShareLink } from '../utils/shareUtils';

interface EliminationCountdownBannerProps {
  elimination: EliminationState;
  onOpenShareModal: () => void;
  onTriggerCeremony?: () => void;
  isAdmin?: boolean;
}

export const EliminationCountdownBanner: React.FC<EliminationCountdownBannerProps> = ({
  elimination,
  onOpenShareModal,
  onTriggerCeremony,
  isAdmin = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      // Target is windowEnd (Sunday 21:00) or windowStart if upcoming
      const targetTime = elimination.status === 'upcoming'
        ? new Date(elimination.windowStart).getTime()
        : new Date(elimination.windowEnd).getTime();

      const diff = Math.max(0, targetTime - now);

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [elimination]);

  const isClosed = elimination.status === 'closed';
  const isEliminated = elimination.status === 'eliminated';
  const isOpen = elimination.status === 'open';

  return (
    <div className="rounded-3xl p-4 sm:p-5 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 border-2 border-red-600/70 shadow-2xl shadow-red-950/60 relative overflow-hidden space-y-3.5">
      {/* Luz sutil de fondo */}
      <div className="absolute -top-10 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Fila Superior: Badge de Estado y Botón WhatsApp */}
      <div className="flex flex-wrap items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-2">
          {elimination.nominees?.length === 0 ? (
            <span className="px-3 py-1 rounded-full bg-blue-950 border border-blue-600/70 text-blue-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md">
              <span>⏳ Sin Nominados Aún</span>
            </span>
          ) : isOpen ? (
            <span className="px-3 py-1 rounded-full bg-red-600 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-red-950/80 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>Votaciones Abiertas</span>
            </span>
          ) : isClosed ? (
            <span className="px-3 py-1 rounded-full bg-zinc-800 text-amber-400 border border-amber-600/50 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <span>⛔ Votaciones Cerradas</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-red-950 border border-red-600 text-red-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
              <Skull className="w-3.5 h-3.5 text-red-500" />
              <span>Eliminación Concluida</span>
            </span>
          )}

          <span className="text-[11px] text-zinc-400 font-bold hidden sm:inline">
            {elimination.nominees?.length === 0
              ? 'Esperando la próxima Gala de Nominación'
              : 'Horario: Cierre domingo 9:30 PM (21:30 hrs)'}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenShareModal}
          className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Compartir en WhatsApp</span>
        </button>
      </div>

      {/* Titular y Reglas de la Eliminación */}
      <div className="relative z-10 space-y-1">
        <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
          <span>👁️ La Casa de los Famosísimos 2</span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-bold border border-zinc-700">
            Semana {elimination.weekNumber || 4}
          </span>
        </h2>
        {elimination.nominees?.length === 0 ? (
          <p className="text-xs sm:text-sm text-zinc-200">
            <strong className="text-amber-400 font-bold">¡Oveja Cúbica 🐑 es la Líder de la Semana 4!</strong> Cuenta con inmunidad total y por el momento es la única habitante protegida. Ahorita no hay nadie nominado hasta que este miércoles se celebre la <strong className="text-amber-300 font-bold">Gala de Nominaciones</strong>.
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-zinc-200">
            <strong className="text-amber-400 font-bold">¡Vota para salvar a tu habitante favorito!</strong> El nominado con{' '}
            <strong className="text-red-400 underline font-black">MENOS VOTOS</strong> al cierre del <strong className="text-amber-300 font-black">domingo a las 9:30 PM (21:30 hrs)</strong> será <strong className="text-red-400 font-bold">ELIMINADO</strong>.
          </p>
        )}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-950/60 border border-amber-600/50 text-[10px] font-bold text-amber-300">
          <span>🔒 Votación Secreta:</span>
          <span className="text-zinc-300 font-normal">
            {elimination.nominees?.length === 0
              ? 'Esperando asignación de nuevos nominados este miércoles'
              : 'Los votos se mantienen ocultos para mayor suspenso'}
          </span>
        </div>
      </div>

      {/* Líder de la Semana Banner */}
      {elimination.leaderId && (() => {
        const leaderSquishy = INITIAL_SQUISHIES.find((s) => s.id === elimination.leaderId);
        const leaderName = leaderSquishy ? leaderSquishy.name : (elimination.leaderId === 'oveja' ? 'Oveja Cúbica' : 'Líder');
        const leaderEmoji = elimination.leaderId === 'oveja' ? '🐑' : elimination.leaderId === 'croissant' ? '🥐' : '👑';
        return (
          <div className="relative z-10 flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/10 border border-amber-500/40 shadow-inner">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl shrink-0">👑</span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                    Líder de la Semana {elimination.weekNumber || 4}:
                  </span>
                  <span className="text-xs font-black text-white">
                    {leaderName} {leaderEmoji}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-300 truncate">
                  Inmunidad total garantizada. Por el momento es la única protegida hasta la gala de nominación del miércoles.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 shrink-0">
              Inmune 🛡️
            </span>
          </div>
        );
      })()}

      {/* Banner de la Salvada de la Semana */}
      {elimination.immune?.includes('medusa') && (
        <div className="relative z-10 flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/10 border border-emerald-500/40 shadow-inner">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">🪼</span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-emerald-300 uppercase tracking-wide">
                  Salvada de la Semana:
                </span>
                <span className="text-xs font-black text-white">
                  Medusa Gelatina 🎉
                </span>
              </div>
              <p className="text-[10px] text-zinc-300 truncate">
                ¡Salvada de la nominación! Goza de inmunidad total y ya no está en riesgo.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shrink-0">
            A Salvo 🛡️
          </span>
        </div>
      )}

      {/* Contadores / Cronómetro a 21:30 PM */}
      <div className="relative z-10 grid grid-cols-4 gap-2 pt-1 max-w-sm mx-auto sm:mx-0">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 text-center shadow-inner">
          <span className="block text-lg sm:text-2xl font-black text-red-400 tabular-nums font-mono leading-none">
            {timeLeft.days.toString().padStart(2, '0')}
          </span>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Días</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 text-center shadow-inner">
          <span className="block text-lg sm:text-2xl font-black text-red-400 tabular-nums font-mono leading-none">
            {timeLeft.hours.toString().padStart(2, '0')}
          </span>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Horas</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 text-center shadow-inner">
          <span className="block text-lg sm:text-2xl font-black text-red-400 tabular-nums font-mono leading-none">
            {timeLeft.minutes.toString().padStart(2, '0')}
          </span>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Min</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 text-center shadow-inner">
          <span className="block text-lg sm:text-2xl font-black text-red-400 tabular-nums font-mono leading-none">
            {timeLeft.seconds.toString().padStart(2, '0')}
          </span>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Seg</span>
        </div>
      </div>

      {/* Barra de Distribución: Nominados vs Con Inmunidad */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/80 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400 font-bold">
          <AlertTriangle className="w-4 h-4 text-zinc-500 shrink-0" />
          <span>{elimination.nominees?.length ?? 0} Nominados (Gala el Miércoles)</span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>1 con Inmunidad: Oveja Cúbica 🐑 (Líder 👑)</span>
        </div>
      </div>
    </div>
  );
};
