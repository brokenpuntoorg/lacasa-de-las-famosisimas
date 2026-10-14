import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Skull, AlertTriangle, X, ShieldAlert, Heart, Trophy, Share2 } from 'lucide-react';
import { SquishyParticipant, EliminationState } from '../types';
import { SquishyAvatar } from './SquishyAvatar';
import { sounds } from '../services/soundEffects';
import { getWhatsAppShareLink } from '../utils/shareUtils';

interface EliminationCeremonyModalProps {
  isOpen: boolean;
  elimination: EliminationState;
  participants: SquishyParticipant[];
  votes: Record<string, number>;
  onClose: () => void;
  isAdmin?: boolean;
}

export const EliminationCeremonyModal: React.FC<EliminationCeremonyModalProps> = ({
  isOpen,
  elimination,
  participants,
  votes,
  onClose,
  isAdmin = false,
}) => {
  useEffect(() => {
    if (isOpen) {
      sounds.playBomb();
    }
  }, [isOpen]);

  if (!isOpen || !elimination.eliminatedSquishyId) return null;

  const eliminatedSquishy = participants.find((p) => p.id === elimination.eliminatedSquishyId) || {
    id: elimination.eliminatedSquishyId,
    name: elimination.eliminatedSquishyName || 'Squishy Eliminado',
    nickname: 'Contendiente',
    filename: 'squishy.png',
    description: '',
    personality: '',
    stats: { squishFactor: 90, softness: 90, slowRiseTime: 3.5, stressRelief: 90 },
    themeColor: '#DC2626',
    badgeColor: 'bg-zinc-800 text-zinc-200 border-zinc-700',
    categories: ['todas'],
    isActive: false,
    totalVotesReceived: 0,
    roundsWon: 0,
  } as SquishyParticipant;

  const eliminatedVotes = elimination.eliminatedVotes || votes[eliminatedSquishy.id] || 0;

  // Los demás nominados que se salvaron
  const savedNominees = elimination.nominees
    .filter((id) => id !== eliminatedSquishy.id)
    .map((id) => {
      const s = participants.find((p) => p.id === id);
      return {
        squishy: s || { id, name: id, nickname: '' } as unknown as SquishyParticipant,
        votes: votes[id] || 0,
      };
    })
    .sort((a, b) => b.votes - a.votes);

  const totalVotesCast = Object.values(votes).reduce((a, b) => a + b, 0);

  return (
    <AnimatePresence>
      <div
        onClick={onClose}
        className="fixed inset-0 z-[120] overflow-y-auto bg-black/90 backdrop-blur-lg flex items-center justify-center p-3 sm:p-5"
      >
        {/* Tache flotante */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar modal de eliminación"
          className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[130] flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-zinc-900/95 hover:bg-zinc-800 text-zinc-200 hover:text-white border-2 border-zinc-700 hover:border-zinc-500 shadow-2xl transition active:scale-95 cursor-pointer backdrop-blur-md"
        >
          <X className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-wider">Cerrar</span>
        </button>

        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-gradient-to-b from-zinc-900 via-zinc-950 to-black rounded-3xl p-5 sm:p-7 border-2 border-red-700/80 shadow-[0_0_60px_rgba(220,38,38,0.35)] text-zinc-100 relative my-auto space-y-5 text-center overflow-hidden"
        >
          {/* Luz de fondo ambiental roja */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Encabezado de Ceremonia de Domingo */}
          <div className="relative z-10 space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-600/70 text-red-400 text-xs font-black uppercase tracking-wider shadow-inner">
              <Skull className="w-4 h-4 text-red-500 animate-pulse" />
              <span>Gala de Eliminación • La Casa de los Famosísimos 2</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white drop-shadow-md">
              🚪 Habitante Expulsado 🚪
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 font-medium max-w-md mx-auto">
              El público ha decidido. El habitante con <strong className="text-red-400 font-bold underline">menos votos</strong> abandona La Casa de los Famosísimos 2.
            </p>
          </div>

          {/* Tarjeta del Eliminado */}
          <div className="relative z-10 p-5 rounded-3xl bg-zinc-900/90 border-2 border-red-600/90 shadow-2xl relative overflow-hidden">
            <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow">
              Eliminado
            </div>

            {/* Avatar del eliminado con desaturación/spotlight */}
            <div className="w-36 h-36 mx-auto my-2 flex items-center justify-center relative">
              <div className="w-full h-full filter contrast-125 saturate-50 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
                <SquishyAvatar
                  id={eliminatedSquishy.id}
                  size="xl"
                  imageUrl={eliminatedSquishy.imageUrl}
                  interactive={false}
                />
              </div>
              <div className="absolute inset-0 bg-red-950/30 rounded-full pointer-events-none mix-blend-color-burn" />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              {eliminatedSquishy.name}
            </h3>
            <p className="text-xs text-red-300 font-medium">
              "{eliminatedSquishy.nickname}"
            </p>

            {/* Votos obtenidos */}
            <div className="mt-4 p-3 rounded-2xl bg-zinc-950 border border-red-900/50 flex items-center justify-around gap-2 text-center">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Votos Recibidos
                </span>
                <span className="text-lg font-black text-red-400 tabular-nums">
                  {eliminatedVotes} {eliminatedVotes === 1 ? 'voto' : 'votos'}
                </span>
              </div>
              <div className="w-px h-8 bg-zinc-800" />
              <div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Causa
                </span>
                <span className="text-xs font-black text-zinc-200">
                  Menor apoyo en votos
                </span>
              </div>
            </div>
          </div>

          {/* Salvados por el público */}
          <div className="relative z-10 text-left space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-zinc-400 px-1">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldAlert className="w-4 h-4" />
                <span>Nominados que se SALVARON ({savedNominees.length}):</span>
              </span>
              <span className="text-[11px] text-zinc-500">{totalVotesCast} votos totales</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {savedNominees.slice(0, 6).map(({ squishy, votes: squishyVotes }) => (
                <div
                  key={squishy.id}
                  className="p-2 rounded-xl bg-zinc-900/70 border border-zinc-800 flex items-center gap-2"
                >
                  <div className="w-7 h-7 shrink-0">
                    <SquishyAvatar id={squishy.id} size="xs" imageUrl={squishy.imageUrl} interactive={false} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-zinc-200 truncate">
                      {squishy.name}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-bold tabular-nums">
                      {squishyVotes} votos (A salvo)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-2 pt-1">
            <a
              href={getWhatsAppShareLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Compartir Resultado en WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Continuar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
