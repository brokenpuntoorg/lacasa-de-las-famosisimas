import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Flame, Zap, Clock, ShieldCheck, Maximize2, Minimize2, ZoomIn } from 'lucide-react';
import { SquishyParticipant } from '../types';
import { SquishyAvatar } from './SquishyAvatar';
import { sounds } from '../services/soundEffects';

interface SquishyDetailModalProps {
  squishy: SquishyParticipant;
  canVote?: boolean;
  currentVotes?: number;
  bonusMultiplier?: number;
  onVote?: () => void;
  onClose: () => void;
}

interface ModalParticle {
  id: string;
  x: number;
}

export const SquishyDetailModal: React.FC<SquishyDetailModalProps> = ({
  squishy,
  canVote = false,
  currentVotes = 0,
  bonusMultiplier = 1,
  onVote,
  onClose,
}) => {
  const [isSquishing, setIsSquishing] = useState(false);
  const [particles, setParticles] = useState<ModalParticle[]>([]);
  const [isFullScreenPhoto, setIsFullScreenPhoto] = useState(false);

  // 1. ESCAPE KEY LISTENER: Ensures Esc key always closes the modal or full-screen photo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullScreenPhoto) {
          setIsFullScreenPhoto(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isFullScreenPhoto]);

  // 2. BODY SCROLL LOCK: Prevents background page from scrolling while modal is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleVoteClick = () => {
    if (!onVote) return;

    // Trigger physical squish deformation
    setIsSquishing(true);
    setTimeout(() => setIsSquishing(false), 200);

    // Clicker particle burst
    const pId = Math.random().toString(36).substring(2, 9);
    const x = (Math.random() - 0.5) * 50;
    setParticles((prev) => [...prev.slice(-10), { id: pId, x }]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== pId));
    }, 850);

    sounds.playSquish();
    onVote();
  };

  return (
    <>
      {/* 
        ========================================================================
        TACHE FLOTANTE GLOBAL EN VIEWPORT (NUNCA SE PIERDE EN NINGÚN DISPOSITIVO)
        Fixed en la esquina superior derecha de la pantalla, por encima de todo.
        ========================================================================
      */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar modal (Escape)"
        className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[70] group flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-zinc-900/95 hover:bg-red-600 active:bg-red-700 text-zinc-200 hover:text-white border-2 border-zinc-700 hover:border-red-500 shadow-2xl transition-all duration-200 active:scale-95 cursor-pointer backdrop-blur-md"
        title="Cerrar ventana (Presiona ESC o haz clic aquí)"
      >
        <div className="w-5 h-5 flex items-center justify-center rounded-full bg-zinc-800 group-hover:bg-red-700 text-red-400 group-hover:text-white transition">
          <X className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
        <span className="text-xs font-black uppercase tracking-wider">Cerrar</span>
        <span className="hidden md:inline text-[10px] text-zinc-400 group-hover:text-zinc-200 font-mono bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
          Esc
        </span>
      </button>

      {/* 
        ========================================================================
        MODAL BACKDROP (CLIC AFUERA PARA CERRAR)
        Responsive: adapta padding en celular (p-2), tablet (p-4) y PC (p-6)
        ========================================================================
      */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 md:p-6"
      >
        {/* 
          ======================================================================
          TARJETA MODAL RESPONSIVE
          stopPropagation para que clicks dentro no cierren el modal.
          max-h-[90vh] / max-h-[90dvh] para que NUNCA se desborde fuera de pantalla.
          ======================================================================
        */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md sm:max-w-lg md:max-w-xl max-h-[90vh] max-h-[90dvh] flex flex-col bg-zinc-900 rounded-3xl shadow-2xl border-2 border-zinc-800 overflow-hidden relative text-zinc-100 my-auto"
        >
          {/* 
            ====================================================================
            CABECERA FIJA DEL MODAL (STICKY / SHRINK-0)
            Contiene el nombre, el botón Tache principal, la foto interactiva y votos.
            ====================================================================
          */}
          <div className="shrink-0 p-4 sm:p-5 pb-3 bg-zinc-950 border-b border-zinc-800 relative">
            {/* Tache destacado dentro de la cabecera */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ficha"
              className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 px-3 py-1.5 sm:py-2 rounded-2xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white flex items-center justify-center gap-1.5 transition shadow-lg shadow-red-950/80 active:scale-95 cursor-pointer ring-2 ring-red-400/50"
              title="Cerrar ventana (Esc)"
            >
              <X className="w-4 h-4 stroke-[3]" />
              <span className="text-xs font-black uppercase tracking-wider">Cerrar</span>
            </button>

            {/* Título y categoría */}
            <div className="text-center pr-10 pl-2">
              <div className="text-[10px] sm:text-xs font-black text-red-500 uppercase tracking-widest flex items-center justify-center gap-1">
                <span>⭐</span> Ficha Oficial de Contendiente <span>⭐</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-zinc-100 uppercase tracking-tight mt-0.5">
                {squishy.name}
              </h3>
              <p className="text-xs text-zinc-400 font-medium">{squishy.nickname}</p>
              {(squishy.isEliminated || squishy.isActive === false) && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950 border border-red-700 text-red-200 text-xs font-black uppercase tracking-wider shadow">
                  <span>🚪</span>
                  <span>{squishy.eliminationOrder ? `${squishy.eliminationOrder}° Expulsada de La Casa` : 'Participante Expulsada'} (Semana {squishy.eliminationWeek || 1})</span>
                </div>
              )}
            </div>

            {/* Contenedor de Foto interactiva con clicker */}
            <div className="mt-3 flex flex-col items-center justify-center bg-zinc-900/90 rounded-2xl p-2.5 sm:p-3 border border-zinc-800 relative overflow-hidden">
              {/* Botón para ver foto en pantalla completa */}
              <button
                type="button"
                onClick={() => setIsFullScreenPhoto(true)}
                className="absolute top-2 right-2 z-10 px-2 py-1 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 text-[10px] font-bold text-zinc-300 hover:text-white flex items-center gap-1 transition shadow cursor-pointer"
                title="Ver foto en tamaño máximo"
              >
                <ZoomIn className="w-3 h-3 text-red-400" />
                <span className="hidden sm:inline">Zoom</span>
              </button>

              {/* Avatar con tamaño responsivo */}
              <motion.div
                animate={isSquishing ? { scale: 0.86, rotate: -2 } : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.15 }}
                onClick={handleVoteClick}
                className="cursor-pointer py-1 flex items-center justify-center"
              >
                {/* Responsive size: size='md' on mobile, size='lg' on tablet+ */}
                <div className="block sm:hidden">
                  <SquishyAvatar
                    id={squishy.id}
                    size="md"
                    imageUrl={squishy.imageUrl}
                    interactive
                    onSquish={handleVoteClick}
                  />
                </div>
                <div className="hidden sm:block">
                  <SquishyAvatar
                    id={squishy.id}
                    size="lg"
                    imageUrl={squishy.imageUrl}
                    interactive
                    onSquish={handleVoteClick}
                  />
                </div>
              </motion.div>

              {/* Partículas flotantes al tocar la foto */}
              <AnimatePresence>
                {particles.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 1, scale: 0.8, y: 0, x: p.x }}
                    animate={{ opacity: 0, scale: 1.5, y: -65 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none z-30 font-black text-sm text-red-400 drop-shadow-md flex items-center gap-1"
                  >
                    <span>+{bonusMultiplier > 1 ? bonusMultiplier : 1}</span>
                    <span>❤️</span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Indicación táctil */}
              <div className="text-[10px] sm:text-[11px] text-zinc-400 font-semibold uppercase tracking-wider mt-1 text-center">
                {canVote ? (
                  <span className="text-red-400 flex items-center justify-center gap-1">
                    <Flame className="w-3 h-3 fill-red-500" /> ¡Toca la foto para deformarlo y sumar toques!
                  </span>
                ) : (
                  <span>Foto del Contendiente</span>
                )}
              </div>
            </div>

            {/* Badge de Votos en vivo o Estado Expulsado */}
            <div className="mt-2 text-center">
              {(squishy.isEliminated || squishy.isActive === false) ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950 border border-red-800 text-xs font-black text-red-300 shadow-sm">
                  <span>🚫</span>
                  <span>{squishy.eliminationOrder ? `${squishy.eliminationOrder}° Expulsada de La Casa` : 'Participante Expulsada'} • Votación Bloqueada</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-black text-amber-400 shadow-sm">
                  <span>🔒</span>
                  <span>Votos Secretos • Votación Ilimitada</span>
                </div>
              )}
            </div>
          </div>

          {/* 
            ====================================================================
            CUERPO SCROLLABLE (FLEX-1 CON OVERFLOW-Y-AUTO)
            Contiene la descripción, cita de personalidad y parámetros técnicos.
            ====================================================================
          */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3.5">
            {/* Descripción */}
            <div>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">
                Descripción
              </span>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                {squishy.description}
              </p>
            </div>

            {/* Cita de personalidad */}
            <div>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">
                Personalidad
              </span>
              <div className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-300 bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
                <Flame className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span className="italic font-medium">"{squishy.personality}"</span>
              </div>
            </div>

            {/* Parámetros de Rendimiento */}
            <div className="space-y-2.5 bg-zinc-950/70 p-3.5 rounded-2xl border border-zinc-800">
              <div className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                Parámetros de Rendimiento
              </div>

              {/* Stat 1: Squish factor */}
              <div>
                <div className="flex justify-between text-xs font-bold text-zinc-300 mb-1">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Zap className="w-3.5 h-3.5 text-red-500" /> Apretujabilidad / Impacto
                  </span>
                  <span className="tabular-nums font-black text-red-400">{squishy.stats.squishFactor}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full border border-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-red-600 rounded-full transition-all duration-500"
                    style={{ width: `${squishy.stats.squishFactor}%` }}
                  />
                </div>
              </div>

              {/* Stat 2: Suavidad */}
              <div>
                <div className="flex justify-between text-xs font-bold text-zinc-300 mb-1">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Flame className="w-3.5 h-3.5 text-red-500" /> Suavidad al Tacto
                  </span>
                  <span className="tabular-nums font-black text-red-400">{squishy.stats.softness}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full border border-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${squishy.stats.softness}%` }}
                  />
                </div>
              </div>

              {/* Stat 3: Slow Rise */}
              <div>
                <div className="flex justify-between text-xs font-bold text-zinc-300 mb-1">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" /> Recuperación Lenta (Slow-Rise)
                  </span>
                  <span className="tabular-nums font-black text-zinc-200">{squishy.stats.slowRiseTime}s</span>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full border border-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-zinc-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (squishy.stats.slowRiseTime / 6) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Stat 4: Antiestrés */}
              <div>
                <div className="flex justify-between text-xs font-bold text-zinc-300 mb-1">
                  <span className="flex items-center gap-1 text-zinc-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-red-400" /> Poder Antiestrés
                  </span>
                  <span className="tabular-nums font-black text-red-400">{squishy.stats.stressRelief}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-900 rounded-full border border-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-red-700 rounded-full transition-all duration-500"
                    style={{ width: `${squishy.stats.stressRelief}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 
            ====================================================================
            PIE FIJO DEL MODAL (STICKY / SHRINK-0)
            Botón de votar + Botón explícito para cerrar.
            ====================================================================
          */}
          <div className="shrink-0 p-3 sm:p-4 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2">
            {/* Botón de cerrar secundario */}
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-4 h-4 text-zinc-400" />
              <span>Cerrar</span>
            </button>

            {/* Botón de votar principal o aviso de expulsado */}
            {(squishy.isEliminated || squishy.isActive === false) ? (
              <div className="flex-1 py-3 sm:py-3.5 px-4 rounded-2xl bg-zinc-900 border border-red-900/60 text-red-400 font-bold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 cursor-not-allowed select-none">
                <span>🚪 {squishy.eliminationOrder ? `${squishy.eliminationOrder}° Expulsada de La Casa` : 'Participante Expulsada'} (No Recibe Votos)</span>
              </div>
            ) : onVote ? (
              <button
                type="button"
                onClick={handleVoteClick}
                className="flex-1 py-3 sm:py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-xl shadow-red-950/80 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Flame className="w-4 h-4 fill-white" />
                <span>¡Votar para Salvar! ❤️ (Ilimitado)</span>
              </button>
            ) : null}
          </div>
        </motion.div>
      </div>

      {/* 
        ========================================================================
        VISOR DE FOTO COMPLETA EN TAMAÑO MÁXIMO (ZOOM FULLSCREEN)
        Solución definitiva al reporte de "pantalla secuestrada":
        - Botón Tache fijo gigante en la esquina superior con z-[9999]
        - Botón Tache en la cabecera del visor
        - Botón Tache en el pie del visor (accesible con el pulgar)
        - Clic en cualquier parte del fondo cierra la vista
        ========================================================================
      */}
      <AnimatePresence>
        {isFullScreenPhoto && (
          <div
            onClick={() => setIsFullScreenPhoto(false)}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-3 sm:p-6 overflow-y-auto"
          >
            {/* Barra superior fija con Tache de máxima prioridad */}
            <div className="w-full max-w-xl flex items-center justify-between z-[110] mb-2 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔍</span>
                <span className="text-xs sm:text-sm font-black text-zinc-200 uppercase tracking-wider">
                  Foto en Tamaño Grande
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullScreenPhoto(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-xs uppercase tracking-wider shadow-2xl transition-all cursor-pointer ring-2 ring-red-400/50 active:scale-95"
                title="Cerrar foto (Esc)"
              >
                <X className="w-5 h-5 stroke-[3]" />
                <span>✕ CERRAR FOTO</span>
              </button>
            </div>

            {/* Tarjeta central de la foto */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 bg-zinc-900/90 rounded-3xl border-2 border-zinc-700 max-w-md sm:max-w-lg w-full my-auto shadow-2xl relative"
            >
              {/* Tache flotante interno en la tarjeta */}
              <button
                type="button"
                onClick={() => setIsFullScreenPhoto(false)}
                className="absolute top-3 right-3 z-20 w-10 h-10 rounded-2xl bg-zinc-800 hover:bg-red-600 text-zinc-300 hover:text-white border border-zinc-700 hover:border-red-500 flex items-center justify-center transition shadow-lg cursor-pointer"
                title="Cerrar (Esc)"
              >
                <X className="w-6 h-6 stroke-[2.5]" />
              </button>

              <div className="w-56 h-56 sm:w-72 sm:h-72 flex items-center justify-center my-2">
                <SquishyAvatar
                  id={squishy.id}
                  size="arena"
                  imageUrl={squishy.imageUrl}
                  interactive
                  onSquish={handleVoteClick}
                />
              </div>

              <h4 className="text-xl sm:text-2xl font-black text-zinc-100 uppercase tracking-tight text-center mt-2">
                {squishy.name}
              </h4>
              <p className="text-xs sm:text-sm text-zinc-400 font-medium text-center">
                {squishy.nickname}
              </p>

              {/* Botón de Voto rápido desde la foto grande */}
              <div className="w-full mt-4 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={handleVoteClick}
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Flame className="w-4 h-4 fill-white" />
                  <span>¡Apretar y Votar! (+1 ❤️)</span>
                </button>

                {/* Tache inferior para dedos rápidos en celular */}
                <button
                  type="button"
                  onClick={() => setIsFullScreenPhoto(false)}
                  className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-black text-xs uppercase tracking-wider border border-zinc-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <X className="w-4 h-4 text-red-400 stroke-[2.5]" />
                  <span>Cerrar</span>
                </button>
              </div>

              <p className="text-[11px] text-zinc-400 mt-2 text-center">
                💡 Toca el botón rojo o en cualquier zona oscura para volver.
              </p>
            </div>

            {/* Aviso inferior */}
            <div className="w-full text-center py-2">
              <button
                type="button"
                onClick={() => setIsFullScreenPhoto(false)}
                className="text-xs text-zinc-400 hover:text-white underline underline-offset-4 cursor-pointer"
              >
                ✕ Presiona aquí o la tecla Esc para cerrar
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
