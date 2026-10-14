import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  Pause, 
  Clock, 
  Trophy, 
  RotateCcw, 
  Users, 
  Eye, 
  Flame,
  Lock,
  Unlock,
  KeyRound,
  Share2,
  Copy,
  Check,
  Edit2,
  Save,
  X,
  AlertTriangle,
  Crown,
  QrCode,
  MessageCircle,
  ShieldCheck,
  Skull,
  ShieldAlert
} from 'lucide-react';
import { GameState, GameMode, SquishyParticipant, EliminationState, EliminationStatus } from '../types';
import { INITIAL_SQUISHIES } from '../data/squishies';
import { SquishyAvatar } from './SquishyAvatar';
import { sounds } from '../services/soundEffects';
import { ShareModal } from './ShareModal';
import { getPublicShareUrl, getWhatsAppShareLink, getWhatsAppShareText, copyTextSafe, isPrivateDevOrigin } from '../utils/shareUtils';

interface AdminViewProps {
  gameState: GameState;
  onStartRound: (params: { mode: GameMode; fighters: string[]; duration: number; categoryName?: string }) => void;
  onPauseRound: () => void;
  onResumeRound: () => void;
  onEndRound: () => void;
  onToggleBonus: (active: boolean, multiplier: number, durationSeconds?: number) => void;
  onAddTime: (seconds: number) => void;
  onDeclareChampion: (squishyId: string) => void;
  onResetGame: () => void;
  onSwitchToPlayer: () => void;
  onUpdateSquishy?: (id: string, updates: Partial<SquishyParticipant>) => void;
  onUpdateElimination?: (updates: Partial<EliminationState>) => void;
  onTriggerElimination?: (squishyId?: string) => void;
  onSetEliminationStatus?: (status: EliminationStatus) => void;
  onDismissCeremony?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  gameState,
  onStartRound,
  onPauseRound,
  onResumeRound,
  onEndRound,
  onToggleBonus,
  onAddTime,
  onDeclareChampion,
  onResetGame,
  onSwitchToPlayer,
  onUpdateSquishy,
  onUpdateElimination,
  onTriggerElimination,
  onSetEliminationStatus,
  onDismissCeremony,
}) => {
  // 1. PIN Access Gate (Default PIN: 1234)
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('squishy_admin_unlocked') === 'true';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // 2. Round Controls
  const [selectedMinutes, setSelectedMinutes] = useState<number>(3); // 1, 2, 3 or 5 minutes
  const [roundTitle, setRoundTitle] = useState<string>('Gran Desafío Squishy');

  // 3. Modals
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [showPodiumModal, setShowPodiumModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // 4. WhatsApp Share Feedback
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // 5. Squishy Edit State
  const [editingSquishyId, setEditingSquishyId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; nickname: string; imageUrl: string }>({
    name: '',
    nickname: '',
    imageUrl: '',
  });

  // Dynamic participants list (combining default list with server updates if available)
  const participantsList: SquishyParticipant[] = gameState.customParticipants && gameState.customParticipants.length > 0
    ? gameState.customParticipants
    : INITIAL_SQUISHIES;

  const getSquishy = (id: string): SquishyParticipant => {
    return participantsList.find((s) => s.id === id) || INITIAL_SQUISHIES[0];
  };

  // Ranking calculation for Podium and Live Metrics
  const sortedByVotes = [...participantsList].sort((a, b) => {
    const votesA = (a.totalVotesReceived || 0) + (gameState.votes[a.id] || 0);
    const votesB = (b.totalVotesReceived || 0) + (gameState.votes[b.id] || 0);
    return votesB - votesA;
  });

  // ESCAPE KEY SUPPORT: closes modals and active editors
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showShareModal) setShowShareModal(false);
        if (showPodiumModal) setShowPodiumModal(false);
        if (showResetModal) setShowResetModal(false);
        if (editingSquishyId) setEditingSquishyId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShareModal, showPodiumModal, showResetModal, editingSquishyId]);

  const totalRoomVotes = Object.values(gameState.votes).reduce((a, b) => a + b, 0);

  // Handle PIN verification
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === '1234') {
      setIsUnlocked(true);
      setPinError(null);
      sessionStorage.setItem('squishy_admin_unlocked', 'true');
      sounds.playBonus();
    } else {
      setPinError('PIN incorrecto. Acceso denegado.');
      setPinInput('');
      sounds.playPop();
    }
  };

  const handleLockAdmin = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem('squishy_admin_unlocked');
    setPinInput('');
  };

  // Format countdown
  const formatTime = (seconds: number) => {
    const s = Math.max(0, seconds || 0);
    const days = Math.floor(s / 86400);
    const hrs = Math.floor((s % 86400) / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (days > 0) {
      return `${days}d ${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m`;
    }
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Round Control: Iniciar Cuenta Regresiva
  const handleStartCountdown = () => {
    sounds.playPop();
    const durationSeconds = selectedMinutes * 60;
    onStartRound({
      mode: 'battle_royale',
      fighters: participantsList.map((s) => s.id),
      duration: durationSeconds,
      categoryName: roundTitle.trim() || 'Ronda de Batalla',
    });
  };

  // Round Control: Revelar Ganadores con Confeti a Pantalla Completa
  const handleRevealWinners = () => {
    sounds.playVictory();

    // Full screen canvas confetti
    confetti({
      particleCount: 260,
      spread: 120,
      origin: { y: 0.45 },
      colors: ['#DC2626', '#EF4444', '#F59E0B', '#E4E4E7', '#FFFFFF'],
    });

    setTimeout(() => {
      confetti({
        particleCount: 160,
        angle: 60,
        spread: 70,
        origin: { x: 0 },
        colors: ['#DC2626', '#F59E0B', '#FFFFFF'],
      });
      confetti({
        particleCount: 160,
        angle: 120,
        spread: 70,
        origin: { x: 1 },
        colors: ['#DC2626', '#F59E0B', '#FFFFFF'],
      });
    }, 350);

    setShowPodiumModal(true);
  };

  // WhatsApp Message Generator (Garantiza URL pública compartible sin bloqueos)
  const currentPublicUrl = getPublicShareUrl();
  const whatsappMessage = getWhatsAppShareText(currentPublicUrl);
  const whatsappHref = getWhatsAppShareLink(currentPublicUrl);
  const isDevOrigin = isPrivateDevOrigin();

  // Configuración de la Gran Eliminación de La Casa de los Famosísimos 2
  const elimination = gameState.elimination || {
    weekNumber: 3,
    title: 'La Casa de los Famosísimos 2 - 3ª Gala de Eliminación (Croissant Líder 🥐 • Medusa Salvada 🪼 - Cierre Domingo 9:30 PM)',
    nominees: [
      'quesito',
      'oreo',
      'dumpling_clasico',
      'pankoso',
    ],
    immune: ['oveja'],
    leaderId: 'oveja',
    windowStart: '2026-10-12T00:00:00-07:00',
    windowEnd: '2026-10-18T21:30:00-07:00',
    status: 'upcoming' as const,
    eliminatedSquishyId: 'oreo',
    eliminatedSquishyName: 'Galleta Oreo',
    eliminatedVotes: 3629,
    ceremonyActive: false,
    hideVotesFromPublic: true,
  };

  const nomineesList = elimination.nominees || [];
  const immuneList = elimination.immune || [];

  const handleSetLeader = (id: string) => {
    sounds.playBonus();
    const currentImmune = elimination.immune || [];
    const newImmune = currentImmune.includes(id) ? currentImmune : [...currentImmune, id];
    const newNominees = (elimination.nominees || []).filter((n) => n !== id);
    onUpdateElimination?.({
      leaderId: id,
      immune: newImmune,
      nominees: newNominees,
    });
  };

  const handleToggleNominee = (id: string) => {
    sounds.playPop();
    const currentNominees = elimination.nominees || [];
    const isNom = currentNominees.includes(id);
    const newNominees = isNom ? currentNominees.filter((n) => n !== id) : [...currentNominees, id];
    const newImmune = (elimination.immune || []).filter((i) => i !== id);
    const updates: Partial<EliminationState> = {
      nominees: newNominees,
      immune: newImmune,
    };
    if (elimination.leaderId === id && !isNom) {
      updates.leaderId = null;
    }
    onUpdateElimination?.(updates);
  };

  const handleToggleImmune = (id: string) => {
    sounds.playPop();
    const currentImmune = elimination.immune || [];
    const isImm = currentImmune.includes(id);
    const newImmune = isImm ? currentImmune.filter((i) => i !== id) : [...currentImmune, id];
    const newNominees = (elimination.nominees || []).filter((n) => n !== id);
    const updates: Partial<EliminationState> = {
      immune: newImmune,
      nominees: newNominees,
    };
    if (elimination.leaderId === id && isImm) {
      updates.leaderId = null;
    }
    onUpdateElimination?.(updates);
  };

  // Squishies nominados ordenados de menor a mayor cantidad de votos
  const sortedNomineesAsc = nomineesList
    .map((id) => participantsList.find((p) => p.id === id) || ({ id, name: id, nickname: '' } as SquishyParticipant))
    .sort((a, b) => (gameState.votes[a.id] || 0) - (gameState.votes[b.id] || 0));

  const leastVotedNominee = sortedNomineesAsc[0];

  const handleCopyInvite = async () => {
    sounds.playSquish();
    const success = await copyTextSafe(currentPublicUrl);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    }
  };

  // Start Editing Squishy
  const handleStartEdit = (squishy: SquishyParticipant) => {
    setEditingSquishyId(squishy.id);
    setEditForm({
      name: squishy.name,
      nickname: squishy.nickname,
      imageUrl: squishy.imageUrl || '',
    });
  };

  const handleSaveEdit = (squishyId: string) => {
    sounds.playPop();
    onUpdateSquishy?.(squishyId, {
      name: editForm.name.trim(),
      nickname: editForm.nickname.trim(),
      imageUrl: editForm.imageUrl.trim() || undefined,
    });
    setEditingSquishyId(null);
  };

  // =========================================================================
  // PIN LOCK GATE SCREEN (Si el PIN es incorrecto, no permite ver las opciones)
  // =========================================================================
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4 select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-md bg-zinc-900 rounded-3xl p-6 sm:p-8 border-2 border-zinc-800 shadow-2xl text-center space-y-5"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-950 border border-red-700/80 flex items-center justify-center text-red-500 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-red-500 block mb-1">
              Acceso Restringido
            </span>
            <h2 className="text-xl font-black uppercase tracking-tight text-white">
              Panel del Organizador (/admin)
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Introduce el PIN de acceso para desbloquear los controles de la sala
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <input
                  type="password"
                  maxLength={8}
                  autoFocus
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError(null);
                  }}
                  placeholder="PIN (por defecto: 1234)"
                  className="w-full px-4 py-3.5 text-center text-lg tracking-widest font-mono font-black rounded-2xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-red-500 shadow-inner"
                />
                <KeyRound className="w-4 h-4 text-zinc-600 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>

              {pinError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-xs font-bold text-red-400 flex items-center justify-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{pinError}</span>
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-red-950/80 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>Desbloquear Panel</span>
            </button>
          </form>

          <div className="pt-3 border-t border-zinc-800 space-y-2">
            <button
              type="button"
              onClick={onSwitchToPlayer}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer border border-zinc-700"
            >
              <span>👈 ¿Eres un Jugador? Entra a Votar Aquí</span>
            </button>
            <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1">
              <span>PIN organizador: <strong className="text-zinc-300 font-mono">1234</strong></span>
              <span className="text-zinc-500">Panel de Control</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // =========================================================================
  // MAIN ADMIN DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen pb-24 pt-4 bg-zinc-950 text-zinc-100 select-none">
      {/* Top Header Bar */}
      <header className="max-w-4xl mx-auto px-4 mb-5 flex items-center justify-between border-b border-zinc-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-red-700 text-red-500 flex items-center justify-center font-bold shadow-inner">
            <Flame className="w-6 h-6 fill-red-500 text-red-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                La Casa de los Famosísimos 2
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-red-950 text-red-400 border border-red-800/80 text-[10px] font-mono font-bold">
                PRODUCCIÓN
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Panel oficial de control de galas, votaciones en tiempo real y expulsiones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchToPlayer}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold border border-zinc-800 flex items-center gap-1.5 transition cursor-pointer hover:border-red-500"
            title="Ver vista pública de invitados"
          >
            <Eye className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Pantalla Invitados (/)</span>
          </button>

          <button
            onClick={handleLockAdmin}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-800 transition cursor-pointer"
            title="Bloquear Panel"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 space-y-5">
        {/* 
          =======================================================
          BOTÓN "COMPARTIR POR WHATSAPP"
          Garantiza enlace público 100% libre y accesible
          =======================================================
        */}
        <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900 border-2 border-emerald-600/70 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-400 flex items-center justify-center text-xl shrink-0 shadow-inner">
                <MessageCircle className="w-6 h-6 fill-emerald-400/20" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-400">
                    Difundir Votación por WhatsApp
                  </h3>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300">
                    <ShieldCheck className="w-3 h-3" /> Enlace Público Libre
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-snug mt-0.5">
                  Los jugadores entran directo desde el celular sin necesidad de cuenta de Google ni registros.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => sounds.playBonus()}
                className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar por WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                title="Ver opciones de compartir y Código QR"
              >
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline">Código QR</span>
              </button>
            </div>
          </div>

          {/* Caja con la URL pública oficial */}
          <div className="bg-zinc-950 p-2 sm:p-2.5 rounded-2xl border border-zinc-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md shrink-0 border border-emerald-800/60">
                Link Público
              </span>
              <span className="text-xs text-zinc-300 font-mono truncate select-all">
                {currentPublicUrl}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyInvite}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700'
              }`}
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copiedLink ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* 
          =======================================================
          PANEL DE CONTROL: GRAN ELIMINACIÓN DEL DOMINGO
          - Ventana de tiempo: Viernes noche a Domingo 21:00
          - Sale el personaje con menos votos
          - 6 Nominados en riesgo vs 5 con Inmunidad (Panquesito es el Líder 👑)
          - Botones de acción directa: Abrir, Cerrar, Revelar Ceremonia
          =======================================================
        */}
        <div className="p-5 rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-red-600 shadow-2xl shadow-red-950/50 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-950/80 border border-red-600 text-red-500 flex items-center justify-center text-xl shrink-0 shadow-inner">
                <Skull className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black uppercase tracking-wide text-white">
                    Control de Eliminación del Domingo
                  </h2>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    elimination.status === 'open'
                      ? 'bg-red-600 text-white animate-pulse'
                      : elimination.status === 'closed'
                      ? 'bg-zinc-800 text-amber-400 border border-amber-500/50'
                      : 'bg-red-950 text-red-300 border border-red-700'
                  }`}>
                    {elimination.status === 'open' ? '🔴 Votaciones Abiertas' : elimination.status === 'closed' ? '⛔ Votaciones Cerradas' : '💔 Eliminación Concluida'}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Ventana oficial: <strong className="text-white">Viernes noche ➔ Domingo 21:30 hrs (9:30 PM)</strong>. Sale el que tenga <strong className="text-red-400 underline font-bold">menos votos</strong>.
                </p>
                <div className="mt-1 text-[11px] text-amber-300 font-bold flex items-center gap-1.5">
                  <span>🔒</span>
                  <span>Modo Voto Secreto activo para los jugadores. Tú como anfitrión ves los votos reales.</span>
                </div>
              </div>
            </div>

            {/* Botones de acción del host */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {elimination.status !== 'open' ? (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playBonus();
                    onSetEliminationStatus?.('open');
                  }}
                  className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider transition shadow-md cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Abrir Votaciones</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    onSetEliminationStatus?.('closed');
                  }}
                  className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-600/50 font-black text-xs uppercase tracking-wider transition shadow-md cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5 fill-amber-400" />
                  <span>Cerrar Votaciones</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  sounds.playPop();
                  const currentHide = elimination.hideVotesFromPublic !== false;
                  onUpdateElimination?.({ hideVotesFromPublic: !currentHide });
                }}
                className={`flex-1 sm:flex-none py-2.5 px-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-md cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 border ${
                  elimination.hideVotesFromPublic !== false
                    ? 'bg-amber-950/80 hover:bg-amber-900 text-amber-300 border-amber-600/60'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                }`}
                title="Oculta o muestra los votos al público en tiempo real"
              >
                <span>{elimination.hideVotesFromPublic !== false ? '🔒 Voto Secreto (Activo)' : '👁️ Voto Público (Visible)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSetEliminationStatus?.('open');
                }}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition shadow cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                title="Asegura que las votaciones sigan abiertas y nadie esté eliminado"
              >
                <span>🟢 Votaciones Abiertas (Nadie Eliminado)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const ok = window.confirm('⚠️ ¿Estás seguro de que deseas cerrar las votaciones y expulsar al nominado con menos votos?');
                  if (!ok) return;
                  sounds.playBomb();
                  onTriggerElimination?.();
                }}
                className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-600 hover:from-rose-600 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-red-950/80 cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                title="Calcula automáticamente el nominado con menos votos y muestra la ceremonia a todos"
              >
                <Skull className="w-3.5 h-3.5 text-white" />
                <span>🚨 Revelar Eliminado (Menos Votos)</span>
              </button>
            </div>
          </div>

          {/* Candidato actual a ser eliminado (el de menor votación) */}
          {leastVotedNominee && (
            <div className="p-3.5 rounded-2xl bg-red-950/60 border-2 border-red-600/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-red-700 p-1 shrink-0 flex items-center justify-center">
                  <SquishyAvatar id={leastVotedNominee.id} size="xs" imageUrl={leastVotedNominee.imageUrl} interactive={false} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-red-400 flex items-center gap-1">
                    <Skull className="w-3 h-3" />
                    <span>En Zona de Eliminación (Menos Votos Actuales)</span>
                  </span>
                  <div className="text-sm font-black text-white">
                    {leastVotedNominee.name} ({leastVotedNominee.nickname})
                  </div>
                  <div className="text-xs text-red-300 font-bold">
                    Solo tiene <strong className="text-white text-sm">{gameState.votes[leastVotedNominee.id] || 0} votos</strong> acumulados
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const ok = window.confirm(`⚠️ ¿Deseas expulsar oficialmente a ${leastVotedNominee.name} y cerrar las votaciones?`);
                  if (!ok) return;
                  onTriggerElimination?.(leastVotedNominee.id);
                }}
                className="py-2 px-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider shadow cursor-pointer active:scale-95 shrink-0"
              >
                Ejecutar Eliminación Ahora 🚨
              </button>
            </div>
          )}

          {/* Lista de los Nominados vs Inmunes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Nominados */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-red-400 uppercase tracking-wide flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  <span>{elimination.nominees?.length ?? 0} Nominados en Riesgo</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">El de menos votos sale</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {sortedNomineesAsc.length === 0 ? (
                  <div className="text-center py-5 text-xs text-zinc-500 italic bg-zinc-900/60 rounded-xl p-3 border border-zinc-800/60">
                    Ahorita no hay nadie nominado. Usa el botón <strong className="text-zinc-300 font-bold">+ Nominar</strong> abajo para seleccionar participantes.
                  </div>
                ) : sortedNomineesAsc.map((s, idx) => (
                  <div key={s.id} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-zinc-900 border border-zinc-800/80">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-4 text-center font-bold text-[11px] ${idx === 0 ? 'text-red-400 font-black' : 'text-zinc-500'}`}>
                        {idx === 0 ? '💀' : `#${idx + 1}`}
                      </span>
                      <span className="font-bold text-zinc-200 truncate">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-black text-red-400 text-xs tabular-nums">
                        {gameState.votes[s.id] || 0} votos
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleNominee(s.id)}
                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
                        title="Quitar de nominados"
                      >
                        Quitar
                      </button>
                      <button
                        type="button"
                        onClick={() => onTriggerElimination?.(s.id)}
                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 hover:bg-red-600 text-zinc-300 hover:text-white transition cursor-pointer"
                        title="Eliminar a este participante directamente"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inmunes */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{elimination.immune?.length || 7} Contendientes con Inmunidad</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">Protegidos (Sin votos)</span>
              </div>
              <div className="space-y-1.5">
                {immuneList.map((id) => {
                  const s = participantsList.find((p) => p.id === id);
                  const isLeader = elimination.leaderId === id;
                  return (
                    <div key={id} className={`flex items-center justify-between text-xs p-2 rounded-lg border ${isLeader ? 'bg-amber-950/40 border-amber-600/70' : 'bg-zinc-900 border-zinc-800/80'}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={isLeader ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>{isLeader ? '👑' : '🛡️'}</span>
                        <span className="font-bold text-zinc-200 truncate">{s?.name || id}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isLeader && (
                          <button
                            type="button"
                            onClick={() => handleSetLeader(id)}
                            className="text-[9px] font-bold px-2 py-0.5 rounded bg-zinc-800 hover:bg-amber-600 text-zinc-300 hover:text-white transition cursor-pointer"
                            title="Nombrar como Líder de la Semana"
                          >
                            👑 Nombrar Líder
                          </button>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${isLeader ? 'text-amber-300 bg-amber-950/80 border-amber-600/70' : 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60'}`}>
                          {isLeader ? 'Líder de la Semana' : 'Inmune'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel Rápido de Gestión de Todos los Habitantes Activos */}
            <div className="col-span-1 md:col-span-2 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2 mt-2">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-black text-zinc-200 uppercase tracking-wide flex items-center gap-1.5">
                  <span>⚙️</span>
                  <span>Panel Rápido de Habitantes (Asignar Líder, Nominar o Salvar)</span>
                </span>
                <span className="text-[10px] text-zinc-400">
                  {participantsList.filter((s) => s.id !== 'mantequilla' && s.id !== 'dumpling_rosa' && s.id !== 'oreo' && !s.isEliminated).length} Habitantes en competencia
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                {participantsList
                  .filter((s) => s.id !== 'mantequilla' && s.id !== 'dumpling_rosa' && s.id !== 'oreo' && !s.isEliminated)
                  .map((s) => {
                    const isLeader = elimination.leaderId === s.id;
                    const isNominated = (elimination.nominees || []).includes(s.id);
                    const isImmune = (elimination.immune || []).includes(s.id) || isLeader;
                    const liveVotes = gameState.votes[s.id] || 0;

                    return (
                      <div
                        key={s.id}
                        className={`p-2 rounded-xl border flex flex-col justify-between gap-1.5 ${
                          isLeader
                            ? 'bg-amber-950/30 border-amber-600/70'
                            : isNominated
                            ? 'bg-red-950/20 border-red-800/60'
                            : 'bg-zinc-900 border-zinc-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-sm shrink-0">
                              {isLeader ? '👑' : isNominated ? '⚠️' : '🛡️'}
                            </span>
                            <span className="text-xs font-bold text-white truncate">{s.name}</span>
                          </div>
                          <span className="text-xs font-mono font-black text-red-400 shrink-0">
                            {liveVotes} v
                          </span>
                        </div>

                        <div className="flex items-center gap-1 flex-wrap pt-0.5">
                          {!isLeader ? (
                            <button
                              type="button"
                              onClick={() => handleSetLeader(s.id)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 hover:bg-amber-600 text-zinc-300 hover:text-white transition cursor-pointer"
                              title="Nombrar como Líder de la Semana"
                            >
                              👑 Hacer Líder
                            </button>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-500 text-zinc-950">
                              👑 LÍDER
                            </span>
                          )}

                          {!isLeader && (
                            <button
                              type="button"
                              onClick={() => handleToggleNominee(s.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                isNominated
                                  ? 'bg-red-600 text-white'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                              }`}
                            >
                              {isNominated ? '⚠️ Nominado' : '+ Nominar'}
                            </button>
                          )}

                          {!isLeader && (
                            <button
                              type="button"
                              onClick={() => handleToggleImmune(s.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                isImmune
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                              }`}
                            >
                              {isImmune ? '🛡️ Inmune' : '+ Salvar'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* 
          =======================================================
          HISTORIAL DE EXPULSADOS (MURO DE EXPULSADOS)
          - Mantequilla Clásica: 1° Expulsado de La Casa (Semana 1)
          =======================================================
        */}
        <div className="p-5 rounded-3xl bg-zinc-900 border-2 border-zinc-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-950/80 border border-red-800 text-red-400 flex items-center justify-center text-xl shrink-0">
                🚪
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-white tracking-wide flex items-center gap-2">
                  <span>Muro de Expulsados de La Casa de los Famosísimos 2</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800 font-bold">
                    1 Expulsado Oficial
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Participantes que abandonaron la competencia por votación del público.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {participantsList
              .filter((s) => s.isEliminated || !s.isActive || s.id === 'mantequilla' || s.id === 'dumpling_rosa' || s.id === 'oreo')
              .sort((a, b) => (a.eliminationOrder || 99) - (b.eliminationOrder || 99))
              .map((squishy) => (
                <div
                  key={squishy.id}
                  className="p-3.5 rounded-2xl bg-zinc-950 border-2 border-red-900/60 flex items-center justify-between gap-3 relative overflow-hidden"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 p-1 shrink-0 relative flex items-center justify-center grayscale">
                      <SquishyAvatar id={squishy.id} size="xs" interactive={false} />
                      <div className="absolute inset-0 bg-red-950/30 rounded-xl" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-zinc-200">{squishy.name}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-600 text-white font-black uppercase tracking-wider">
                          {squishy.eliminationOrder ? `${squishy.eliminationOrder}° Expulsada` : 'Expulsada'}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
                        Semana {squishy.eliminationWeek || 1} • {squishy.eliminationReason || 'Menor votación para ser salvada'}
                      </div>
                      <div className="text-[10px] text-red-400 font-bold mt-0.5">
                        🚫 Votación bloqueada permanentemente
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold block">
                      Semana {squishy.eliminationWeek || 1}
                    </span>
                    <span className="text-[9px] text-red-400 font-mono mt-0.5 block">
                      {squishy.totalVotesReceived ? `${squishy.totalVotesReceived} votos` : 'Fuera de la Casa'}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* 
          =======================================================
          MÉTRICAS EN VIVO
          - Total de votos emitidos en la sala
          - Total de votantes conectados
          =======================================================
        */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Total Votos Emitidos */}
          <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                Total de Votos en Sala
              </span>
              <div className="text-2xl sm:text-3xl font-black text-red-500 tabular-nums mt-0.5">
                {totalRoomVotes}
              </div>
              <span className="text-[11px] text-zinc-400">Votos acumulados en la ronda</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-red-500">
              <Flame className="w-6 h-6 fill-red-500" />
            </div>
          </div>

          {/* Card 2: Votantes Conectados */}
          <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                Votantes Conectados
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white tabular-nums mt-0.5">
                {gameState.connectedPlayers.length}
              </div>
              <span className="text-[11px] text-emerald-400 font-bold">🟢 En línea ahora</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Estado y Tiempo */}
          <div className="bg-zinc-900 rounded-3xl p-4 border border-zinc-800 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
                Cronómetro Sincronizado
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-red-400 tabular-nums mt-0.5">
                {formatTime(gameState.timeRemaining)}
              </div>
              <span className="text-[11px] text-zinc-400">
                {gameState.status === 'in_round' ? '🔴 Ronda activa' : '⛔ Votación en pausa'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-red-400">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 
          =======================================================
          CONTROLES DE LA RONDA
          - Selector de tiempo en minutos (1, 2, 3 o 5 minutos)
          - Botón: "⏱ Iniciar Cuenta Regresiva"
          - Botón: "⏸ Pausar / Cerrar Votaciones"
          - Botón: "🔄 Reiniciar Votación a 0" (con confirmación)
          - Botón: "🏆 Revelar Ganadores" (confeti y podio 1º, 2º, 3º)
          =======================================================
        */}
        <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Controles de la Ronda en Vivo
              </h2>
              <p className="text-xs text-zinc-400">Gestiona la duración, estado y premiación del juego</p>
            </div>

            {/* +15s Quick Bonus Time */}
            <button
              onClick={() => {
                sounds.playPop();
                onAddTime(15);
              }}
              className="py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>+15s Extra</span>
            </button>
          </div>

          {/* 1. Selector de tiempo en minutos (1, 2, 3 o 5 minutos) */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">
              Duración de la Ronda (Minutos)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 5].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    sounds.playSquish();
                    setSelectedMinutes(mins);
                  }}
                  className={`py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition cursor-pointer border ${
                    selectedMinutes === mins
                      ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-950/60'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                  }`}
                >
                  {mins} {mins === 1 ? 'Minuto' : 'Minutos'}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Action Control Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* Botón: "⏱ Iniciar Cuenta Regresiva" */}
            <button
              type="button"
              onClick={handleStartCountdown}
              className="py-3.5 px-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-red-950/80 transition active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>⏱ Iniciar Cuenta Regresiva</span>
            </button>

            {/* Botón: "⏸ Pausar / Cerrar Votaciones" */}
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                if (gameState.status === 'in_round') {
                  onPauseRound();
                } else if (gameState.status === 'paused') {
                  onResumeRound();
                } else {
                  onEndRound();
                }
              }}
              className="py-3.5 px-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              {gameState.status === 'in_round' ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>⏸ Pausar / Cerrar Votaciones</span>
                </>
              ) : gameState.status === 'paused' ? (
                <>
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span>▶️ Reanudar Votaciones</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  <span>⏸ Pausar / Cerrar Votaciones</span>
                </>
              )}
            </button>

            {/* Botón: "🔄 Reiniciar Votación a 0" */}
            <button
              type="button"
              onClick={() => {
                sounds.playSquish();
                setShowResetModal(true);
              }}
              className="py-3.5 px-3 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-red-400 border border-zinc-800 hover:border-red-800 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>🔄 Reiniciar Votación a 0</span>
            </button>

            {/* Botón: "🏆 Revelar Ganadores" */}
            <button
              type="button"
              onClick={handleRevealWinners}
              className="py-3.5 px-3 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-950/60 transition active:scale-95 cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>🏆 Revelar Ganadores</span>
            </button>
          </div>
        </div>

        {/* 
          =======================================================
          LISTA DE LOS 12 PARTICIPANTES CON VOTOS EXACTOS
          Y OPCIÓN DE EDITAR SUS NOMBRES O CAMBIAR LAS URLS DE SUS FOTOS
          =======================================================
        */}
        <div className="bg-zinc-900 rounded-3xl p-5 border border-zinc-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">
                Lista de los 12 Participantes Oficiales
              </h2>
              <p className="text-xs text-zinc-400">
                Votos exactos en tiempo real con edición de nombre y URL de foto
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-red-400 text-xs font-mono font-black self-start sm:self-auto">
              12 Contendientes
            </span>
          </div>

          {/* Grid of the 12 participants */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedByVotes.map((squishy, index) => {
              const liveVotes = (squishy.totalVotesReceived || 0) + (gameState.votes[squishy.id] || 0);
              const isEditing = editingSquishyId === squishy.id;

              return (
                <div
                  key={squishy.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isEditing
                      ? 'bg-zinc-950 border-red-500 ring-1 ring-red-500/50'
                      : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {!isEditing ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Position / Medal */}
                        <span className="w-6 text-xs font-black text-zinc-500 text-center shrink-0">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </span>

                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                          <SquishyAvatar
                            id={squishy.id}
                            size="xs"
                            imageUrl={squishy.imageUrl}
                            interactive={false}
                          />
                        </div>

                        {/* Info */}
                        <div className="min-w-0">
                          <h4 className="text-xs font-black text-white uppercase truncate">
                            {squishy.name}
                          </h4>
                          <p className="text-[10px] text-zinc-400 truncate">
                            {squishy.nickname}
                          </p>
                          {squishy.imageUrl && (
                            <span className="text-[9px] text-emerald-400 font-mono block truncate">
                              🖼️ Foto personalizada activa
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Exact Votes */}
                        <div className="text-right">
                          <div className="text-sm font-black text-red-400 tabular-nums">
                            {liveVotes} {liveVotes === 1 ? 'voto' : 'votos'}
                          </div>
                        </div>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleStartEdit(squishy)}
                          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
                          title="Editar nombre y foto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Edit Form for this squishy */
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span className="text-xs font-black uppercase text-red-400">
                          Editando a {squishy.name}
                        </span>
                        <button
                          onClick={() => setEditingSquishyId(null)}
                          className="p-1 text-zinc-500 hover:text-zinc-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                            Nombre del Squishy
                          </label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-1.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-red-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                            Apodo / Subtítulo
                          </label>
                          <input
                            type="text"
                            value={editForm.nickname}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, nickname: e.target.value }))}
                            className="w-full px-3 py-1.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-red-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-zinc-400 mb-1">
                          URL de Foto Personalizada (Opcional - reemplaza dibujo)
                        </label>
                        <input
                          type="url"
                          placeholder="https://ejemplo.com/foto-squishy.png"
                          value={editForm.imageUrl}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                          className="w-full px-3 py-1.5 text-xs rounded-xl bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:border-red-500 font-mono text-[11px]"
                        />
                      </div>

                      {/* Photo preview if URL is set */}
                      {editForm.imageUrl && (
                        <div className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                          <img
                            src={editForm.imageUrl}
                            alt="Previsualización"
                            className="w-8 h-8 rounded-lg object-contain bg-zinc-950 border border-zinc-700"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                          <span className="text-[10px] text-zinc-400">Previsualización de la nueva imagen</span>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingSquishyId(null)}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(squishy.id)}
                          className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Guardar Cambios</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* 
        =======================================================
        MODAL DE CONFIRMACIÓN: REINICIAR VOTACIÓN A 0
        =======================================================
      */}
      <AnimatePresence>
        {showResetModal && (
          <div
            onClick={() => setShowResetModal(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-zinc-900 rounded-3xl p-6 border-2 border-red-600 shadow-2xl text-center space-y-4 text-zinc-100 my-auto relative"
            >
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                title="Cerrar (Esc)"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-14 h-14 mx-auto rounded-2xl bg-zinc-950 border border-red-800 flex items-center justify-center text-red-500 text-2xl">
                ⚠️
              </div>

              <div>
                <h3 className="text-lg font-black uppercase text-white tracking-tight">
                  ¿Reiniciar Votación a 0?
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Esta acción borrará todos los votos registrados de los 12 squishies y devolverá el marcador a 0 para todos los jugadores conectados.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    onResetGame();
                    setShowResetModal(false);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-950/80 transition cursor-pointer"
                >
                  Sí, reiniciar a 0
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 
        =======================================================
        MODAL DEL PODIO: REVELAR GANADORES (1.º, 2.º y 3.º lugar)
        =======================================================
      */}
      <AnimatePresence>
        {showPodiumModal && (
          <>
            {/* Tache flotante superior fijo */}
            <button
              type="button"
              onClick={() => setShowPodiumModal(false)}
              aria-label="Cerrar podio (Esc)"
              className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[70] flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-zinc-900/95 hover:bg-red-600 text-zinc-200 hover:text-white border-2 border-zinc-700 hover:border-red-500 shadow-2xl transition active:scale-95 cursor-pointer backdrop-blur-md"
              title="Cerrar (Esc)"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              <span className="text-xs font-black uppercase tracking-wider">Cerrar</span>
            </button>

            <div
              onClick={() => setShowPodiumModal(false)}
              className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md overflow-y-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-zinc-900 rounded-3xl p-5 sm:p-6 border-2 border-amber-500/80 shadow-2xl text-center space-y-5 text-zinc-100 relative my-auto"
              >
                <button
                  type="button"
                  onClick={() => setShowPodiumModal(false)}
                  className="absolute top-4 right-4 z-10 w-9 h-9 rounded-2xl bg-zinc-800 hover:bg-red-600 text-zinc-300 hover:text-white flex items-center justify-center transition cursor-pointer"
                  title="Cerrar (Esc)"
                >
                  <X className="w-4 h-4 stroke-[2.5]" />
                </button>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-black uppercase tracking-wider mb-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>Ceremonia Oficial de Ganadores</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                  ¡Podio de Campeones!
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Los 3 squishies con mayor cantidad de toques y aprietes
                </p>
              </div>

              {/* Podium Visual Layout (2nd place left, 1st center high, 3rd right) */}
              <div className="grid grid-cols-3 gap-2 pt-2 items-end">
                {/* 2º Lugar - Plata */}
                {sortedByVotes[1] && (
                  <div className="flex flex-col items-center">
                    <div className="text-2xl mb-1">🥈</div>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-950 rounded-2xl border-2 border-zinc-400 p-1 flex items-center justify-center shadow-lg">
                      <SquishyAvatar
                        id={sortedByVotes[1].id}
                        size="sm"
                        imageUrl={sortedByVotes[1].imageUrl}
                        interactive={false}
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <h4 className="text-xs font-black text-zinc-200 uppercase truncate max-w-[90px]">
                        {sortedByVotes[1].name}
                      </h4>
                      <span className="text-[11px] font-black text-zinc-400 font-mono">
                        {(sortedByVotes[1].totalVotesReceived || 0) + (gameState.votes[sortedByVotes[1].id] || 0)} votos
                      </span>
                    </div>
                    <div className="w-full h-18 bg-zinc-800 rounded-t-2xl mt-2 flex items-center justify-center border-t-2 border-zinc-400">
                      <span className="text-sm font-black text-zinc-300">2.º Lugar</span>
                    </div>
                  </div>
                )}

                {/* 1º Lugar - Oro (Centro más alto) */}
                {sortedByVotes[0] && (
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={{ y: [-3, 3, -3], rotate: [-3, 3, -3] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="text-3xl mb-1"
                    >
                      👑
                    </motion.div>
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-zinc-950 rounded-3xl border-2 border-amber-400 p-1 flex items-center justify-center shadow-2xl ring-4 ring-amber-500/30">
                      <SquishyAvatar
                        id={sortedByVotes[0].id}
                        size="md"
                        imageUrl={sortedByVotes[0].imageUrl}
                        isWinning
                        interactive={false}
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <h4 className="text-xs sm:text-sm font-black text-amber-300 uppercase truncate max-w-[110px]">
                        {sortedByVotes[0].name}
                      </h4>
                      <span className="text-xs font-black text-amber-400 font-mono">
                        {(sortedByVotes[0].totalVotesReceived || 0) + (gameState.votes[sortedByVotes[0].id] || 0)} votos
                      </span>
                    </div>
                    <div className="w-full h-24 bg-gradient-to-t from-zinc-800 to-amber-950/60 rounded-t-2xl mt-2 flex flex-col items-center justify-center border-t-2 border-amber-400">
                      <span className="text-base font-black text-amber-300">1.º Oro</span>
                      <span className="text-[10px] text-amber-200 uppercase font-bold">¡CAMPEÓN!</span>
                    </div>
                  </div>
                )}

                {/* 3º Lugar - Bronce */}
                {sortedByVotes[2] && (
                  <div className="flex flex-col items-center">
                    <div className="text-2xl mb-1">🥉</div>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-950 rounded-2xl border-2 border-amber-700 p-1 flex items-center justify-center shadow-lg">
                      <SquishyAvatar
                        id={sortedByVotes[2].id}
                        size="sm"
                        imageUrl={sortedByVotes[2].imageUrl}
                        interactive={false}
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <h4 className="text-xs font-black text-zinc-300 uppercase truncate max-w-[90px]">
                        {sortedByVotes[2].name}
                      </h4>
                      <span className="text-[11px] font-black text-amber-600 font-mono">
                        {(sortedByVotes[2].totalVotesReceived || 0) + (gameState.votes[sortedByVotes[2].id] || 0)} votos
                      </span>
                    </div>
                    <div className="w-full h-14 bg-zinc-800 rounded-t-2xl mt-2 flex items-center justify-center border-t-2 border-amber-700">
                      <span className="text-sm font-black text-zinc-400">3.º Lugar</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => setShowPodiumModal(false)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-red-950/80 transition cursor-pointer"
                >
                  Continuar en la Sala
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>

    <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
    </div>
  );
};
