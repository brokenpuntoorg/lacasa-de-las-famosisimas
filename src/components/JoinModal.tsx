import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Flame, Shield, User, Zap, X, ArrowRight, Share2, Sparkles } from 'lucide-react';
import { sounds } from '../services/soundEffects';
import { ShareModal } from './ShareModal';

interface JoinModalProps {
  isAdminRoute?: boolean;
  onJoin: (playerData: { id: string; name: string; avatar: string; role: 'player' | 'admin'; pin?: string }) => void;
  onSwitchRoute?: (path: string) => void;
  onClose?: () => void;
}

const AVATAR_OPTIONS = ['🔥', '⚡', '🧀', '🥐', '👑', '💥', '🥟', '🧊', '🎯', '🐺', '🦊', '🐻'];

export const JoinModal: React.FC<JoinModalProps> = ({ 
  isAdminRoute = false, 
  onJoin,
  onSwitchRoute,
  onClose
}) => {
  const [name, setName] = useState(() => (isAdminRoute ? 'Organizador Master' : ''));
  const [selectedAvatar, setSelectedAvatar] = useState(() => (isAdminRoute ? '👑' : '🔥'));
  const [adminPin, setAdminPin] = useState('');
  const [error, setError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  // Auto-dismiss or enter with Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleQuickGuestEnter();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickGuestEnter = () => {
    sounds.playPop();
    const guestNum = Math.floor(100 + Math.random() * 900);
    const playerId = 'guest_' + Math.random().toString(36).substring(2, 9);
    onJoin({
      id: playerId,
      name: `Contendiente #${guestNum}`,
      avatar: selectedAvatar || '🔥',
      role: 'player',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || (isAdminRoute ? 'Admin Master' : `Contendiente #${Math.floor(100 + Math.random() * 900)}`);

    if (isAdminRoute) {
      if (adminPin !== '1234' && adminPin !== 'admin' && adminPin !== '') {
        setError('PIN de Administrador incorrecto (usa 1234)');
        return;
      }
    }

    sounds.playPop();
    const playerId = (isAdminRoute ? 'admin_' : 'guest_') + Math.random().toString(36).substring(2, 9);
    onJoin({
      id: playerId,
      name: finalName,
      avatar: selectedAvatar,
      role: isAdminRoute ? 'admin' : 'player',
      pin: adminPin,
    });
  };

  return (
    <>
      <div 
        onClick={handleQuickGuestEnter}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-zinc-900 rounded-3xl shadow-2xl border-2 border-zinc-800 overflow-hidden text-zinc-100 relative my-auto"
        >
          {/* Tache para entrar directo sin formulario */}
          <button
            type="button"
            onClick={handleQuickGuestEnter}
            aria-label="Entrar directo a la arena"
            className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Entrar rápido sin configurar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Dark Red / Charcoal Header */}
          <div className="bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 p-5 sm:p-6 text-white text-center relative overflow-hidden border-b border-zinc-800">
            <div className="absolute -right-6 -bottom-6 text-7xl opacity-5 select-none font-mono">VS</div>
            <div className="absolute -left-6 -top-6 text-7xl opacity-5 select-none font-mono">⚡</div>
            
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-2 bg-zinc-800/90 border border-zinc-700 rounded-2xl flex items-center justify-center text-3xl shadow-inner"
            >
              {selectedAvatar}
            </motion.div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-100">
              {isAdminRoute ? 'Panel Administrador' : 'La Casa de los Famosísimos 2'}
            </h2>
            <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-semibold mt-1">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              <span>{isAdminRoute ? 'Gestión de Votaciones y Control' : '¡Votaciones Oficiales en Vivo!'}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3.5">
            {/* Botón Gigante de Acceso Rápido para Jugadores de WhatsApp */}
            {!isAdminRoute && (
              <button
                type="button"
                onClick={handleQuickGuestEnter}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-98 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-red-950/80 transition flex items-center justify-center gap-2 cursor-pointer border border-red-500/40"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>⚡ ¡Entrar Rápido a Votar! (1 Clic)</span>
              </button>
            )}

            {!isAdminRoute && (
              <div className="flex items-center my-2">
                <div className="flex-1 border-t border-zinc-800" />
                <span className="px-2 text-[10px] font-bold text-zinc-500 uppercase">
                  o personaliza tu jugador
                </span>
                <div className="flex-1 border-t border-zinc-800" />
              </div>
            )}

            {/* Name input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                {isAdminRoute ? 'Identificador de Admin' : 'Tu Apodo o Nombre (Opcional)'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder={isAdminRoute ? 'Admin Master' : 'Ej. Striker, Fénix, Mariana...'}
                maxLength={20}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder-zinc-600 focus:bg-zinc-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/30 transition"
              />
            </div>

            {/* Avatar selector */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Elige tu Emblema
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      sounds.playSquish();
                      setSelectedAvatar(emoji);
                    }}
                    className={`h-10 rounded-xl text-lg flex items-center justify-center transition cursor-pointer border ${
                      selectedAvatar === emoji
                        ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-950/80 scale-105 ring-2 ring-red-500/40'
                        : 'bg-zinc-800/80 border-zinc-700/60 hover:bg-zinc-700 text-zinc-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin PIN input if role is admin */}
            {isAdminRoute && (
              <div className="space-y-1 pt-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  PIN de Administrador (1234)
                </label>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="1234"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/30"
                />
              </div>
            )}

            {error && (
              <p className="text-xs font-semibold text-red-400 text-center bg-red-950/50 border border-red-800/60 py-2 px-3 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm tracking-wider uppercase transition flex items-center justify-center gap-2 cursor-pointer border border-zinc-700"
            >
              <Flame className="w-4 h-4 text-red-500" />
              <span>{isAdminRoute ? 'Acceder al Panel Admin' : 'Guardar y Entrar'}</span>
            </button>

            {/* Si cayó en /admin sin querer, permitirle ir a la pantalla de jugadores */}
            {isAdminRoute && onSwitchRoute && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => onSwitchRoute('/')}
                  className="text-xs text-red-400 hover:text-red-300 font-bold underline cursor-pointer"
                >
                  👈 ¿Eres un jugador invitado? Entra a votar aquí
                </button>
              </div>
            )}

            {/* Botón para compartir por WhatsApp antes de entrar */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="text-[11px] text-green-400 hover:text-green-300 font-semibold flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <Share2 className="w-3 h-3" />
                <span>Invitar amigos por WhatsApp</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
    </>
  );
};
