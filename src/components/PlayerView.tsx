import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Trophy, 
  BookOpen, 
  User, 
  Volume2, 
  VolumeX, 
  ChevronRight,
  Zap,
  HelpCircle,
  Award,
  Sparkles,
  Share2,
  ShieldCheck,
  AlertTriangle,
  Skull,
  ShieldAlert,
  Info
} from 'lucide-react';
import { GameState, SquishyParticipant, Player } from '../types';
import { INITIAL_SQUISHIES } from '../data/squishies';
import { SquishyAvatar } from './SquishyAvatar';
import { SquishyDetailModal } from './SquishyDetailModal';
import { ShareModal } from './ShareModal';
import { EliminationCountdownBanner } from './EliminationCountdownBanner';
import { sounds } from '../services/soundEffects';

interface PlayerViewProps {
  gameState: GameState;
  currentPlayer: Player;
  onVote: (squishyId: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onQuickStartRound?: () => void;
  onEditProfile?: () => void;
}

interface FloatingParticle {
  id: string;
  squishyId: string;
  x: number;
  bonusMultiplier: number;
}

export const PlayerView: React.FC<PlayerViewProps> = ({
  gameState,
  currentPlayer,
  onVote,
  soundEnabled,
  onToggleSound,
  onQuickStartRound,
  onEditProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'votar' | 'ranking' | 'reglas' | 'perfil'>('votar');
  const [selectedSquishy, setSelectedSquishy] = useState<SquishyParticipant | null>(null);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'nominees' | 'immune' | 'expulsados'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Clicker deformation tracking: holds id of currently squished squishy
  const [squishingId, setSquishingId] = useState<string | null>(null);

  // Floating particles +1 ❤️ queue
  const [floatingParticles, setFloatingParticles] = useState<FloatingParticle[]>([]);

  // Local counter of personal taps per squishy (allows unlimited rapid multi-voting)
  const [mySquishyTaps, setMySquishyTaps] = useState<Record<string, number>>({});

  // Time Formatter (e.g. 180s -> 03:00, 25200s -> 07:00:00, 198000s -> 2d 07h 00m)
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

  const isRoundActive = (gameState.status === 'in_round' && gameState.timeRemaining > 0) || gameState.elimination?.status === 'open';
  const isRoundEnded = gameState.elimination?.status === 'closed' || gameState.elimination?.status === 'eliminated';

  const participantsList: SquishyParticipant[] = gameState.customParticipants && gameState.customParticipants.length > 0
    ? gameState.customParticipants
    : INITIAL_SQUISHIES;

  const getSquishy = (id: string): SquishyParticipant => {
    return participantsList.find((s) => s.id === id) || INITIAL_SQUISHIES[0];
  };

  // Configuración de eliminación de La Casa de los Famosísimos 2
  const elimination = gameState.elimination || {
    weekNumber: 4,
    title: 'La Casa de los Famosísimos 2 - Esperando la Próxima Gala de Nominaciones',
    nominees: [],
    immune: [],
    leaderId: null,
    windowStart: '2026-10-12T00:00:00-07:00',
    windowEnd: '2026-10-18T21:30:00-07:00',
    status: 'upcoming' as const,
    eliminatedSquishyId: 'oreo',
    eliminatedSquishyName: 'Galleta Oreo',
    eliminatedVotes: 3629,
    ceremonyActive: false,
  };

  const nomineesList = elimination.nominees || [];
  const immuneList = elimination.immune || [];

  // Squishies nominados
  const nomineeParticipants = participantsList.filter((s) => nomineesList.includes(s.id));
  const leastVotedNominee = nomineeParticipants[0];

  const filteredSquishies = participantsList.filter((s) => {
    if (filterCategory === 'nominees') return nomineesList.includes(s.id);
    if (filterCategory === 'immune') return immuneList.includes(s.id) || elimination.leaderId === s.id;
    if (filterCategory === 'expulsados') return s.id === 'mantequilla' || s.id === 'dumpling_rosa' || s.id === 'oreo' || s.isEliminated || s.isActive === false;
    return true;
  });

  // Ordenar lista para la pestaña activa
  filteredSquishies.sort((a, b) => {
    if (filterCategory === 'immune') {
      if (a.id === elimination.leaderId) return -1;
      if (b.id === elimination.leaderId) return 1;
    }
    // En la vista general poner los expulsados al final
    const aExpelled = a.id === 'mantequilla' || a.id === 'dumpling_rosa' || a.id === 'oreo' || a.isEliminated || !a.isActive;
    const bExpelled = b.id === 'mantequilla' || b.id === 'dumpling_rosa' || b.id === 'oreo' || b.isEliminated || !b.isActive;
    if (aExpelled && !bExpelled) return 1;
    if (!aExpelled && bExpelled) return -1;
    return 0;
  });

  // Clicker repeated tap handler - UNLIMITED MULTI-VOTE
  const handleVoteClick = (squishyId: string) => {
    // Si está expulsado (Mantequilla, Dumpling Rosa u Oreo), bloquear de inmediato
    const targetSquishy = participantsList.find((p) => p.id === squishyId);
    if (squishyId === 'mantequilla' || squishyId === 'dumpling_rosa' || squishyId === 'oreo' || targetSquishy?.isEliminated || targetSquishy?.isActive === false) {
      sounds.playPop();
      const expName = targetSquishy?.name || 'Este habitante';
      const order = targetSquishy?.eliminationOrder ? `${targetSquishy.eliminationOrder}ª` : '';
      setToastMessage(`🚪 ${expName} fue la ${order} EXPULSADA de La Casa de los Famosísimos 2. ¡Ya no puede recibir votos!`);
      setTimeout(() => setToastMessage(null), 3800);
      return;
    }

    // Si es la líder de la semana o tiene inmunidad, no se puede votar para eliminación
    if (squishyId === elimination.leaderId) {
      sounds.playBonus();
      const sq = participantsList.find((p) => p.id === squishyId);
      setToastMessage(`👑 ¡${sq?.name || 'Panquesito Dorado'} es el Líder de la Semana! Goza de inmunidad total y está 100% a salvo de la eliminación.`);
      setTimeout(() => setToastMessage(null), 3800);
      return;
    }

    if (squishyId === elimination.leaderId) {
      sounds.playBonus();
      const sq = participantsList.find((p) => p.id === squishyId);
      setToastMessage(`👑 ¡${sq?.name || 'Oveja Cúbica'} es la Líder de la Semana 4! Tiene Inmunidad total garantizada.`);
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    if (immuneList.includes(squishyId)) {
      sounds.playBonus();
      const sq = participantsList.find((p) => p.id === squishyId);
      setToastMessage(`🛡️ ¡${sq?.name || 'Este habitante'} tiene Inmunidad! Esta semana está a salvo y no se puede votar por él.`);
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    // Si no hay nadie nominado en este momento
    if (nomineesList.length === 0) {
      sounds.playPop();
      setToastMessage('⏳ Ahorita no hay nadie nominado. Las votaciones se abrirán este miércoles tras la Gala de Nominaciones.');
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    // Si las votaciones están cerradas o ya se eliminó
    if (elimination.status === 'closed' || elimination.status === 'eliminated') {
      sounds.playPop();
      setToastMessage('⛔ Las votaciones están cerradas. Esperando el anuncio oficial del eliminado.');
      setTimeout(() => setToastMessage(null), 3200);
      return;
    }

    // If round was closed or ended, automatically re-open it so votes always register
    if (!isRoundActive && onQuickStartRound) {
      onQuickStartRound();
    }

    // 1. Play tactile squish/pop sound
    sounds.playSquish();

    // 2. Increment personal tap count
    setMySquishyTaps((prev) => ({
      ...prev,
      [squishyId]: (prev[squishyId] || 0) + 1,
    }));

    // 3. Trigger deformation effect (scale 0.9)
    setSquishingId(squishyId);
    setTimeout(() => {
      setSquishingId((prev) => (prev === squishyId ? null : prev));
    }, 180);

    // 4. Spawn floating +1 ❤️ particle
    const pId = Math.random().toString(36).substring(2, 9);
    const xOffset = (Math.random() - 0.5) * 36;
    const bonus = gameState.superSquishBonus?.active ? gameState.superSquishBonus.multiplier : 1;

    setFloatingParticles((prev) => [
      ...prev.slice(-25), // Keep max 25 particles in memory for smooth 60fps
      {
        id: pId,
        squishyId,
        x: xOffset,
        bonusMultiplier: bonus,
      },
    ]);

    setTimeout(() => {
      setFloatingParticles((prev) => prev.filter((p) => p.id !== pId));
    }, 850);

    // 5. Send vote to server
    onVote(squishyId);
  };

  const totalVotesThisRound = Object.values(gameState.votes).reduce((a, b) => a + b, 0);

  // Ranked participants for Ranking Tab (1st to 12th place)
  const sortedSquishies = [...participantsList].sort((a, b) => {
    const votesA = (a.totalVotesReceived || 0) + (gameState.votes[a.id] || 0);
    const votesB = (b.totalVotesReceived || 0) + (gameState.votes[b.id] || 0);
    return votesB - votesA;
  });

  const maxVotes = Math.max(1, ...sortedSquishies.map((s) => (s.totalVotesReceived || 0) + (gameState.votes[s.id] || 0)));
  const totalAllVotes = Math.max(1, sortedSquishies.reduce((sum, s) => sum + (s.totalVotesReceived || 0) + (gameState.votes[s.id] || 0), 0));

  return (
    <div className="min-h-screen pb-36 pt-18 bg-zinc-950 text-zinc-100 select-none">
      {/* Toast Flotante Informativo */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-zinc-900/95 border-2 border-emerald-500 text-white shadow-2xl text-xs font-bold flex items-center gap-2 max-w-sm backdrop-blur-md"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 
        ====================================================
        BARRA DE ESTADO SUPERIOR FIJA
        - Título con icono de fuego
        - Indicador de estado: "🔴 EN VIVO" o "⛔ CERRADA"
        - Cronómetro sincronizado (00:00 al terminar)
        - Control de sonido
        ====================================================
      */}
      <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between px-3 sm:px-4 max-w-xl mx-auto shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 text-red-500 flex items-center justify-center font-bold text-lg shadow-inner">
            <Flame className="w-5 h-5 fill-red-500 text-red-500" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider text-zinc-100 uppercase leading-tight">
              La Casa de los Famosísimos 2
            </h1>
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider leading-none">
              Votaciones Oficiales en Vivo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* WhatsApp / Compartir Sala button */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="px-2.5 py-1 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 hover:border-emerald-400 text-emerald-300 hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
            title="Invitar amigos por WhatsApp (Enlace Público)"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline text-[11px]">Invitar</span>
            <span className="sm:hidden text-[10px]">Compartir</span>
          </button>

          {/* Status Indicator */}
          <div
            className={`px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black tracking-wide flex items-center gap-1.5 transition ${
              isRoundActive
                ? 'bg-red-950/80 text-red-400 border border-red-800/80 shadow-xs shadow-red-950/50 animate-pulse'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}
          >
            <span className="text-xs leading-none">
              {isRoundActive ? '🔴' : '⛔'}
            </span>
            <span className="font-extrabold uppercase">
              {isRoundActive ? 'EN VIVO' : 'CERRADA'}
            </span>
          </div>

          {/* Synchronized Timer */}
          <div className="px-2.5 py-1 rounded-full bg-zinc-950 text-red-500 border border-zinc-800 text-xs font-mono font-black tabular-nums flex items-center gap-1 shadow-inner">
            <span>⏱️</span>
            <span>{formatTime(gameState.timeRemaining)}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-300 transition shrink-0 cursor-pointer"
            title={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-red-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-3.5 py-3 space-y-3.5">
        {/* Banner Oficial de la Gran Eliminación del Domingo */}
        <EliminationCountdownBanner
          elimination={elimination}
          onOpenShareModal={() => setShowShareModal(true)}
          onTriggerCeremony={() => {}}
          isAdmin={false}
        />

        {/* Super Squish Bonus Banner */}
        {gameState.superSquishBonus.active && isRoundActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-700 to-zinc-900 text-white shadow-xl shadow-red-950/60 border border-red-500/50 flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl animate-bounce">⚡</span>
              <div>
                <div className="text-xs font-black tracking-wider uppercase">
                  ¡SUPER SQUISH BONUS ACTIVO!
                </div>
                <div className="text-[11px] text-zinc-200 font-medium">
                  ¡Cada toque tuyo suma x{gameState.superSquishBonus.multiplier} puntos al instante!
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-black/40 border border-red-400/40 text-xs font-black text-red-200">
              x{gameState.superSquishBonus.multiplier}
            </span>
          </motion.div>
        )}

        {/* 
          ====================================================
          BANNER FESTIVO DE FIN DEL JUEGO
          Aparece automáticamente cuando el cronómetro llega a 0
          o el admin cierra la votación.
          ====================================================
        */}
        {isRoundEnded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="p-4 rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 border-2 border-red-600 shadow-2xl shadow-red-950/70 text-center relative overflow-hidden"
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-2xl animate-bounce">🏁</span>
              <h3 className="text-base font-black uppercase tracking-wider text-zinc-100">
                ¡Votaciones en Pausa o Cerradas!
              </h3>
              <span className="text-2xl animate-bounce">🎉</span>
            </div>
            <p className="text-xs text-zinc-300">
              {elimination.status === 'eliminated'
                ? `¡La eliminación de la semana ha concluido! ${elimination.eliminatedSquishyName || 'Un personaje'} fue eliminado por tener menos votos.`
                : 'El conteo oficial está cerrado temporalmente o a la espera de la ceremonia del domingo.'}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-amber-400">
              <span>🔒 Votación Secreta:</span>
              <span className="text-zinc-300 font-medium">Resultados ocultos hasta la revelación oficial</span>
            </div>
            <div className="mt-2 text-[11px] text-zinc-400">
              Revisa la pestaña <strong className="text-red-400">&quot;Ranking&quot;</strong> para ver el Termómetro de Eliminación.
            </div>
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={onQuickStartRound}
                className="py-2.5 px-5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-950/80 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <span>🚀 ¡Abrir Votación / Reanudar!</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* 
          ====================================================
          1. PESTAÑA "VOTAR" (CLICKER / MÚLTIPLES VOTOS)
          ====================================================
        */}
        {activeTab === 'votar' && (
          <div className="space-y-3.5">
            {/* Round info bar */}
            <div className="bg-zinc-900 rounded-3xl p-3.5 shadow-lg border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-red-500 block">
                  {isRoundActive ? 'Votación para Salvar (En Vivo)' : 'Votación Pausada'}
                </span>
                <h2 className="text-sm font-bold text-zinc-100">
                  {gameState.categoryName || 'Gran Eliminación de Squishies'}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">Conteo Oficial</span>
                <span className="text-xs font-black text-amber-400 flex items-center justify-end gap-1">
                  <span>🔒</span>
                  <span>Voto Secreto</span>
                </span>
              </div>
            </div>

            {/* Pestañas de Filtro: Todos / Nominados / Inmunes / Expulsados */}
            <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-2xl border border-zinc-800 text-xs font-bold overflow-x-auto">
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-xl transition flex-1 text-center whitespace-nowrap cursor-pointer ${
                  filterCategory === 'all'
                    ? 'bg-zinc-800 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Todos ({participantsList.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('nominees')}
                className={`px-3 py-1.5 rounded-xl transition flex-1 text-center whitespace-nowrap flex items-center justify-center gap-1 cursor-pointer ${
                  filterCategory === 'nominees'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-red-400 hover:text-red-300'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{elimination.nominees?.length || 6} Nominados (En Riesgo)</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('immune')}
                className={`px-3 py-1.5 rounded-xl transition flex-1 text-center whitespace-nowrap flex items-center justify-center gap-1 cursor-pointer ${
                  filterCategory === 'immune'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{elimination.immune?.length || 5} Inmunes</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('expulsados')}
                className={`px-2.5 py-1.5 rounded-xl transition flex-1 text-center whitespace-nowrap flex items-center justify-center gap-1 cursor-pointer ${
                  filterCategory === 'expulsados'
                    ? 'bg-red-950 text-red-300 border border-red-800 shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <span>🚪</span>
                <span>Expulsados (1)</span>
              </button>
            </div>

            {/* Banner de invitación rápida por WhatsApp */}
            <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-emerald-950/50 p-3 rounded-2xl border border-emerald-800/40 flex items-center justify-between gap-2 shadow-md">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-xl">📲</span>
                <div className="min-w-0">
                  <p className="text-xs font-black text-zinc-200 truncate">
                    ¿Quieres salvar a tu habitante nominado?
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    Comparte en WhatsApp con amigos para votar juntos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Invitar</span>
              </button>
            </div>

            {/* Aviso de Estado de Votación */}
            {nomineesList.length === 0 ? (
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-700/80 text-xs flex items-center justify-between gap-2 shadow-md">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">🏠</span>
                  <div className="min-w-0">
                    <span className="text-xs font-black text-emerald-400 block truncate">
                      Sin Nominados en este Momento
                    </span>
                    <span className="text-[11px] text-zinc-300 truncate block">
                      Ahorita nadie está nominado. Los 9 habitantes continúan en La Casa esperando la próxima gala.
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-500/40 shrink-0">
                  En Pausa ⏸️
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-red-950/80 via-zinc-900 to-amber-950/80 border border-amber-600/50 text-xs flex items-center justify-between gap-2 shadow-md">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl shrink-0">🔒</span>
                  <div className="min-w-0">
                    <span className="text-xs font-black text-amber-300 block truncate">
                      Votación a Ciegas • Resultados Secretos
                    </span>
                    <span className="text-[11px] text-zinc-300 truncate block">
                      ¡Vota las veces que quieras! El conteo total se revelará el domingo a las 9:30 PM.
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-500/40 shrink-0">
                  Ilimitado ✨
                </span>
              </div>
            )}

            {/* Hint banner */}
            <div className="text-center text-xs font-bold py-0.5">
              {nomineesList.length === 0 ? (
                <span className="text-zinc-400 font-medium flex items-center justify-center gap-1.5">
                  <span>⭐ Los 9 habitantes siguen a salvo esperando la siguiente Gala de Nominación</span>
                </span>
              ) : isRoundActive ? (
                <span className="text-red-400 animate-pulse flex items-center justify-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 fill-red-500 inline" />
                  <span>¡Vota tantas veces como quieras! Toca el botón o la foto repetidamente ❤️</span>
                  <Flame className="w-3.5 h-3.5 fill-red-500 inline" />
                </span>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <span className="text-zinc-400 text-xs font-medium">
                    ⛔ Votación pausada o concluida.
                  </span>
                  {onQuickStartRound && (
                    <button
                      type="button"
                      onClick={onQuickStartRound}
                      className="px-3 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
                    >
                      ⚡ Reanudar / Abrir Votación
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2-column Grid of squishies (filtered) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-3.5">
              {filteredSquishies.map((squishy) => {
                const votes = gameState.votes[squishy.id] || 0;
                const isSquished = squishingId === squishy.id;
                const isMyFavorite = currentPlayer.favoriteSquishyId === squishy.id;
                const isLeader = elimination.leaderId === squishy.id;
                const isImmune = immuneList.includes(squishy.id) || isLeader;
                const isNominated = nomineesList.includes(squishy.id);
                const isSecretVoting = elimination.hideVotesFromPublic !== false;
                const isLeastVoted = !isSecretVoting && !isLeader && isNominated && leastVotedNominee && leastVotedNominee.id === squishy.id;
                const isExpelled = squishy.id === 'mantequilla' || squishy.id === 'dumpling_rosa' || squishy.id === 'oreo' || squishy.isEliminated || !squishy.isActive;

                return (
                  <div
                    key={squishy.id}
                    className={`rounded-3xl p-3 shadow-xl border-2 transition-all flex flex-col justify-between relative ${
                      isExpelled
                        ? 'bg-zinc-950/80 border-zinc-800 opacity-80'
                        : isLeader
                        ? 'bg-zinc-900/90 border-amber-500 ring-2 ring-amber-400/40 shadow-amber-950/60 shadow-xl'
                        : isImmune
                        ? 'bg-zinc-900/90 border-emerald-600/60 shadow-emerald-950/30'
                        : isLeastVoted
                        ? 'bg-zinc-900 border-red-500 ring-2 ring-red-500/50 shadow-[0_0_25px_rgba(239,68,68,0.35)]'
                        : isMyFavorite
                        ? 'bg-zinc-900 border-red-600 ring-2 ring-red-600/30 shadow-red-950/50'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {/* Badge de Estado: Líder vs Inmune vs Nominado / Menos votos vs Expulsado */}
                    {isExpelled ? (
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-red-950 border border-red-800 text-red-300 text-[9px] font-black z-10 shadow-md uppercase tracking-wider flex items-center gap-1">
                        <span>🚪</span>
                        <span>{squishy.eliminationOrder ? `${squishy.eliminationOrder}° Expulsada` : 'Expulsada'}</span>
                      </div>
                    ) : isLeader ? (
                      <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 text-[9px] font-black z-10 shadow-lg uppercase tracking-wider flex items-center gap-1">
                        <span>👑</span>
                        <span>Líder de la Semana</span>
                      </div>
                    ) : isImmune ? (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black z-10 shadow-md uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{squishy.id === 'medusa' ? '¡Salvada! 🪼' : 'Inmune'}</span>
                      </div>
                    ) : isNominated ? (
                      isLeastVoted ? (
                        <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-black z-10 shadow-lg uppercase tracking-wider flex items-center gap-1 animate-pulse">
                          <Skull className="w-3 h-3" />
                          <span>Menos Votos</span>
                        </div>
                      ) : (
                        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-amber-600 text-white text-[9px] font-black z-10 shadow-md uppercase tracking-wider flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Nominado</span>
                        </div>
                      )
                    ) : (
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-[9px] font-bold z-10 shadow uppercase tracking-wider">
                        <span>En La Casa 🏠</span>
                      </div>
                    )}

                    {/* Badge personal si votaste por él */}
                    {(mySquishyTaps[squishy.id] || 0) > 0 && !isExpelled && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-red-950/90 border border-red-600/70 text-red-200 text-[9px] font-black z-10 shadow-md uppercase tracking-wider flex items-center gap-1 animate-pulse">
                        <span>❤️</span>
                        <span>{mySquishyTaps[squishy.id]} votos tuyos</span>
                      </div>
                    )}
                    {isExpelled && (
                      <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-[9px] font-bold z-10 shadow-md uppercase tracking-wider">
                        Semana {squishy.eliminationWeek || 1}
                      </div>
                    )}

                    {/* 
                      TOCAR LA FOTO:
                      Abre el Modal con foto en grande y ficha técnica
                    */}
                    <div 
                      onClick={() => setSelectedSquishy(squishy)}
                      className={`h-28 sm:h-32 w-full flex items-center justify-center cursor-pointer my-1 rounded-2xl border border-zinc-800/60 relative overflow-hidden group mt-6 ${
                        isExpelled ? 'bg-zinc-950 grayscale' : 'bg-zinc-950/50'
                      }`}
                      title={isExpelled ? 'Participante expulsado de La Casa' : 'Toca para ver foto en grande y descripción completa'}
                    >
                      <motion.div
                        animate={isSquished ? { scale: 0.88, rotate: -2 } : { scale: 1, rotate: 0 }}
                        transition={{ duration: 0.18 }}
                        className="w-full h-full flex items-center justify-center"
                      >
                        <SquishyAvatar
                          id={squishy.id}
                          size="md"
                          imageUrl={squishy.imageUrl}
                          interactive={false}
                        />
                      </motion.div>

                      {isExpelled && (
                        <div className="absolute inset-0 bg-red-950/30 flex items-center justify-center pointer-events-none">
                          <span className="px-2 py-0.5 bg-red-900/90 text-white text-[9px] font-black uppercase tracking-wider rounded-md border border-red-600 shadow">
                            FUERA DE LA CASA
                          </span>
                        </div>
                      )}

                      {/* Floating Particles +1 ❤️ Animation */}
                      <AnimatePresence>
                        {floatingParticles
                          .filter((p) => p.squishyId === squishy.id)
                          .map((p) => (
                            <motion.div
                              key={p.id}
                              initial={{ opacity: 1, scale: 0.8, y: 15, x: p.x }}
                              animate={{ opacity: 0, scale: 1.5, y: -50 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none z-30 font-black text-sm text-red-400 drop-shadow-md flex items-center gap-0.5 whitespace-nowrap"
                            >
                              <span>+{p.bonusMultiplier > 1 ? p.bonusMultiplier : 1}</span>
                              <span>❤️</span>
                            </motion.div>
                          ))}
                      </AnimatePresence>

                      <div className="absolute bottom-1 right-2 text-[9px] text-zinc-500 font-mono opacity-60 group-hover:opacity-100 transition">
                        🔍 Ver Ficha
                      </div>
                    </div>

                    {/* Nombre del squishy y estado */}
                    <div className="text-center mt-1">
                      <h3 className="text-xs sm:text-sm font-black text-zinc-100 uppercase tracking-tight leading-tight truncate">
                        {squishy.name}
                      </h3>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                        {squishy.nickname}
                      </p>

                      {isExpelled ? (
                        <span className="inline-block mt-1 text-[9px] font-black text-red-400 uppercase tracking-wider bg-red-950/60 px-2 py-0.5 rounded-full border border-red-800/60">
                          🚪 {squishy.eliminationOrder ? `${squishy.eliminationOrder}° Expulsada de La Casa` : 'Expulsada de La Casa'}
                        </span>
                      ) : isLeader ? (
                        <span className="inline-block mt-1 text-[9px] font-black text-amber-300 uppercase tracking-wider bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-600/60">
                          👑 Líder de la Semana 4 (Inmune)
                        </span>
                      ) : isImmune ? (
                        <span className="inline-block mt-1 text-[9px] font-black text-emerald-400 uppercase tracking-wider bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                          🛡️ Inmune esta semana
                        </span>
                      ) : isNominated ? (
                        isLeastVoted ? (
                          <span className="inline-block mt-1 text-[9px] font-black text-red-300 uppercase tracking-wider bg-red-950/80 px-2 py-0.5 rounded-full border border-red-700 animate-pulse">
                            💀 En Zona de Eliminación
                          </span>
                        ) : (
                          <span className="inline-block mt-1 text-[9px] font-black text-amber-400 uppercase tracking-wider bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-800/60">
                            ⚠️ En Riesgo de Eliminación
                          </span>
                        )
                      ) : (
                        <span className="inline-block mt-1 text-[9px] font-black text-emerald-400 uppercase tracking-wider bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/50">
                          ⭐ Habitante en Competencia
                        </span>
                      )}
                    </div>

                    {/* Estado de votos protegido / secreto */}
                    {isExpelled ? (
                      <div className="my-2 py-1 px-2.5 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center gap-1.5 text-zinc-500 font-bold text-[11px] shadow-inner">
                        <span>🚪</span>
                        <span>Expulsada en Semana {squishy.eliminationWeek || 1}</span>
                      </div>
                    ) : (
                      <div className="my-2 py-1 px-2.5 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center gap-1.5 text-amber-400 font-bold text-[11px] shadow-inner">
                        <span>🔒</span>
                        <span>Votos Ocultos • Votación Secreta</span>
                      </div>
                    )}

                    {/* 
                      BOTÓN CLICKER O BOTÓN INMUNE:
                      Si es expulsado, está bloqueado.
                      Si es líder, está protegido con máxima autoridad.
                      Si es inmune, está salvado y muestra explicación.
                      Si está nominado, permite votar repetidamente para salvarlo de la eliminación.
                    */}
                    {isExpelled ? (
                      <button
                        type="button"
                        onClick={() => handleVoteClick(squishy.id)}
                        className="w-full min-h-[46px] sm:min-h-[48px] py-2.5 px-2 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed shadow-md"
                        title="Mantequilla Clásica fue expulsada en la Semana 1 y no puede recibir votos"
                      >
                        <span>🚪</span>
                        <span>1° Expulsado (Fuera de la Casa)</span>
                      </button>
                    ) : isLeader ? (
                      <button
                        type="button"
                        onClick={() => handleVoteClick(squishy.id)}
                        className="w-full min-h-[46px] sm:min-h-[48px] py-2.5 px-2 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-950/90 to-amber-900/80 hover:from-amber-900 hover:to-amber-800 border border-amber-500/70 text-amber-200 transition active:scale-95 cursor-pointer shadow-md"
                        title={`${squishy.name} es el Líder de la Semana y goza de inmunidad total`}
                      >
                        <span>👑</span>
                        <span>Líder Protegido</span>
                      </button>
                    ) : isImmune ? (
                      <button
                        type="button"
                        onClick={() => handleVoteClick(squishy.id)}
                        className="w-full min-h-[46px] sm:min-h-[48px] py-2.5 px-2 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-300 transition active:scale-95 cursor-pointer shadow-md"
                        title="Este personaje tiene inmunidad y no puede ser votado para eliminación"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>🛡️ Inmune (Salvado)</span>
                      </button>
                    ) : (
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.90 }}
                        onClick={() => handleVoteClick(squishy.id)}
                        className={`w-full min-h-[46px] sm:min-h-[48px] py-2.5 px-2 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ring-2 ${
                          isLeastVoted
                            ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white ring-red-400/50 shadow-red-950/90'
                            : 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white ring-red-500/30 shadow-red-950/80'
                        }`}
                      >
                        <Flame className="w-4 h-4 fill-white" />
                        <span>¡Votar para Salvar! ❤️ (Ilimitado)</span>
                      </motion.button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 
          ====================================================
          2. PESTAÑA "RANKING" (TABLA DE POSICIONES 1º A 12º)
          ====================================================
        */}
        {activeTab === 'ranking' && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-black tracking-wide uppercase text-zinc-100">
                Tabla de Posiciones y Eliminación
              </h2>
              <p className="text-xs text-zinc-400">
                Seguimiento en vivo para la gran eliminación del domingo
              </p>
            </div>

            {/* Muro Oficial de Expulsados de La Casa de los Famosísimos 2 */}
            <div className="p-4 rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-zinc-800 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-red-950/90 border border-red-800 flex items-center justify-center text-sm">
                    🚪
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black uppercase text-white tracking-tight flex items-center gap-1.5">
                      <span>Muro de Expulsados</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-950 text-red-300 font-bold border border-red-800">
                        {participantsList.filter((s) => s.isEliminated || !s.isActive || s.id === 'mantequilla' || s.id === 'dumpling_rosa' || s.id === 'oreo').length} Fuera de La Casa
                      </span>
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      Participantes expulsados de La Casa de los Famosísimos 2 por menor votación del público en las Galas de los Domingos.
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista dinámica de participantes expulsados */}
              <div className="space-y-2">
                {participantsList
                  .filter((s) => s.isEliminated || !s.isActive || s.id === 'mantequilla' || s.id === 'dumpling_rosa' || s.id === 'oreo')
                  .sort((a, b) => (a.eliminationOrder || 99) - (b.eliminationOrder || 99))
                  .map((squishy) => (
                    <div
                      key={squishy.id}
                      className="p-3 rounded-2xl bg-zinc-950 border-2 border-red-950/80 flex items-center justify-between gap-3 relative overflow-hidden"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 p-1 shrink-0 relative flex items-center justify-center grayscale">
                          <SquishyAvatar id={squishy.id} size="xs" interactive={false} />
                          <div className="absolute inset-0 bg-red-950/30 rounded-xl" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-zinc-200">{squishy.name}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full bg-red-600 text-white font-black uppercase tracking-wider">
                              {squishy.eliminationOrder ? `${squishy.eliminationOrder}° Expulsada` : 'Expulsada'}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-0.5 truncate">
                            Semana {squishy.eliminationWeek || 1} • {squishy.eliminationReason || 'Menor votación para ser salvada'}
                          </p>
                          <p className="text-[10px] text-red-400 font-bold">
                            🚫 Votación bloqueada permanentemente
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-bold block">
                          Semana {squishy.eliminationWeek || 1}
                        </span>
                        <span className="text-[9px] text-red-400 font-mono mt-0.5 block">
                          {squishy.totalVotesReceived ? `${squishy.totalVotesReceived} votos` : 'Expulsada'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Termómetro de Eliminación: Nominados en Riesgo */}
            <div className="p-4 rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border-2 border-red-600/80 shadow-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Skull className="w-5 h-5 text-red-500 animate-pulse shrink-0" />
                  <div>
                    <h3 className="text-xs sm:text-sm font-black uppercase text-white tracking-tight flex items-center gap-1.5">
                      <span>Termómetro de Nominados</span>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Voto Secreto 🔒
                      </span>
                    </h3>
                    <p className="text-[10px] text-zinc-400">
                      Los nominados en riesgo. Los números de votos se mantienen <strong className="text-amber-300">ocultos</strong> para mantener el suspenso hasta la gala del domingo a las 9:30 PM.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-red-950 text-red-300 font-bold border border-red-800 shrink-0">
                  {elimination.nominees?.length || 6} Nominados
                </span>
              </div>

              <div className="space-y-2">
                {nomineeParticipants.map((squishy, idx) => {
                  return (
                    <div
                      key={squishy.id}
                      className="p-2.5 rounded-2xl border transition flex items-center justify-between gap-2 bg-zinc-900/80 border-zinc-800"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 text-center font-black text-xs shrink-0 text-red-400">
                          ⚠️
                        </span>
                        <div className="w-8 h-8 shrink-0">
                          <SquishyAvatar id={squishy.id} size="xs" imageUrl={squishy.imageUrl} interactive={false} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white truncate flex items-center gap-1.5">
                            <span className="truncate">{squishy.name}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-red-950 text-red-300 font-bold border border-red-800/60 shrink-0">
                              Nominado
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 truncate">
                            {squishy.nickname}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-black text-amber-400 font-mono">
                          🔒 Secreto
                        </span>
                        <button
                          type="button"
                          onClick={() => handleVoteClick(squishy.id)}
                          className="px-2.5 py-1 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] shadow active:scale-95 cursor-pointer"
                        >
                          Salvar ❤️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ordered List of all 12 squishies */}
            <div className="bg-zinc-900 rounded-3xl p-4 shadow-xl border border-zinc-800 divide-y divide-zinc-800/80">
              <div className="pb-3 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Tabla General de Todos los Participantes (12)
              </div>
              {sortedSquishies.map((squishy, idx) => {
                const totalVotes = (squishy.totalVotesReceived || 0) + (gameState.votes[squishy.id] || 0);
                const pctOfLeader = maxVotes > 0 ? Math.round((totalVotes / maxVotes) * 100) : 0;
                const pctOfTotal = totalAllVotes > 0 ? Math.round((totalVotes / totalAllVotes) * 100) : 0;
                const isImmune = immuneList.includes(squishy.id);

                let positionDisplay: React.ReactNode = null;
                if (idx === 0) {
                  positionDisplay = <span className="text-xl" title="1º Oro">🥇</span>;
                } else if (idx === 1) {
                  positionDisplay = <span className="text-xl" title="2º Plata">🥈</span>;
                } else if (idx === 2) {
                  positionDisplay = <span className="text-xl" title="3º Bronce">🥉</span>;
                } else {
                  positionDisplay = (
                    <span className="w-6 text-xs font-black text-zinc-500 tabular-nums text-center">
                      #{idx + 1}
                    </span>
                  );
                }

                return (
                  <motion.div
                    layout
                    layoutId={`rank-${squishy.id}`}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                    key={squishy.id}
                    onClick={() => setSelectedSquishy(squishy)}
                    className="py-3.5 space-y-2 cursor-pointer hover:bg-zinc-800/50 rounded-2xl px-2 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-7 flex items-center justify-center">
                          {positionDisplay}
                        </div>
                        <div className="w-10 h-10 flex items-center justify-center bg-zinc-950 rounded-xl border border-zinc-800 p-1">
                          <SquishyAvatar id={squishy.id} size="xs" imageUrl={squishy.imageUrl} interactive={false} />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-black text-zinc-100 uppercase flex items-center gap-1.5">
                            <span>{squishy.name}</span>
                            {squishy.id === elimination.leaderId ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-950 text-amber-300 font-bold border border-amber-600/60">
                                👑 Líder
                              </span>
                            ) : isImmune ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-950 text-emerald-300 font-bold border border-emerald-700/60">
                                Inmune 🛡️
                              </span>
                            ) : null}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-medium">
                            {squishy.nickname}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs sm:text-sm font-black text-amber-400 flex items-center justify-end gap-1">
                          <span>🔒</span>
                          <span>Voto Secreto</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono font-bold">
                          Conteo Oculto
                        </div>
                      </div>
                    </div>

                    {/* Barra de estado misteriosa / votos secretos */}
                    <div className="w-full h-2.5 bg-zinc-950 rounded-full border border-zinc-800/80 overflow-hidden relative">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse w-full opacity-70"
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* 
          ====================================================
          3. PESTAÑA "REGLAS"
          ====================================================
        */}
        {activeTab === 'reglas' && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-black tracking-wide uppercase text-zinc-100">
                Reglas Oficiales de la Competencia
              </h2>
              <p className="text-xs text-zinc-400">Eliminación semanal y dinámicas de voto</p>
            </div>

            {/* Regla Clave de la Gran Eliminación del Domingo */}
            <div className="p-5 rounded-3xl bg-zinc-900 border-2 border-red-600 shadow-xl shadow-red-950/40 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-xl">
                  ⚔️
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wide">
                    La Gran Eliminación del Domingo
                  </h3>
                  <span className="text-[11px] text-red-400 font-bold">Viernes por la noche a Domingo 21:30 hrs (9:30 PM)</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm font-bold text-zinc-200 leading-relaxed bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800">
                &ldquo;Las votaciones abren desde el viernes en la noche y cierran el domingo a las 9:30 PM. El personaje nominado con <strong className="text-red-400 underline font-black">MENOS VOTOS</strong> será el <strong className="text-red-400 font-black">ELIMINADO</strong> de la semana. Los contendientes con inmunidad no están en riesgo y no reciben votos.&rdquo;
              </p>
            </div>

            {/* Desglose de Nominados e Inmunes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-red-800/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-red-400 uppercase">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{nomineesList.length} Nominados a Salvar:</span>
                </div>
                <ul className="text-xs text-zinc-300 space-y-1 list-disc pl-4">
                  {nomineesList.map((id) => {
                    const s = participantsList.find((p) => p.id === id);
                    return <li key={id}>{s?.name || id}</li>;
                  })}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900 border border-emerald-800/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{immuneList.length} con Inmunidad (Protegidos):</span>
                </div>
                <ul className="text-xs text-zinc-300 space-y-1 list-disc pl-4">
                  {immuneList.map((id) => {
                    const s = participantsList.find((p) => p.id === id);
                    const isLeader = id === elimination.leaderId;
                    return (
                      <li key={id} className={isLeader ? 'text-amber-300 font-bold' : ''}>
                        {isLeader ? `👑 ${s?.name || id} (¡Líder de la Semana!)` : s?.name || id}
                      </li>
                    );
                  })}
                </ul>
                <p className="text-[10px] text-zinc-400 pt-1">
                  Protegidos de la eliminación. No reciben votos esta semana.
                </p>
              </div>
            </div>

            {/* Instrucciones Paso a Paso */}
            <div className="bg-zinc-900 rounded-3xl p-5 shadow-xl border border-zinc-800 space-y-3.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-red-500" />
                <span>Mecánicas y Consejos de Batalla</span>
              </h3>

              <div className="space-y-3 text-xs text-zinc-300">
                <div className="flex items-start gap-3 p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                  <span className="text-xl shrink-0">👆</span>
                  <div>
                    <strong className="text-zinc-100 block font-bold">1. Votación Ilimitada y Secreta:</strong>
                    Puedes votar todas las veces que quieras sin ningún límite para salvar a tus squishies favoritos. El número total de votos está <strong className="text-amber-300">oculto</strong> para mantener la emoción hasta el domingo a las 9:30 PM.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                  <span className="text-xl shrink-0">🔍</span>
                  <div>
                    <strong className="text-zinc-100 block font-bold">2. Ficha y Votación Modal:</strong>
                    Toca la foto de cualquier squishy para abrir su modal con foto en grande, detalles de personalidad, estadísticas de slow-rise y seguir votando.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                  <span className="text-xl shrink-0">⚡</span>
                  <div>
                    <strong className="text-zinc-100 block font-bold">3. Multiplicadores Super Squish:</strong>
                    Presta atención al banner superior. Cuando se active el bonus, cada toque sumará x2 o x3 puntos en el marcador.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                  <span className="text-xl shrink-0">⏱️</span>
                  <div>
                    <strong className="text-zinc-100 block font-bold">4. Cierre Automático:</strong>
                    Cuando el cronómetro llegue a 00:00, los botones se bloquearán instantáneamente y se proclamará al vencedor en la pestaña Ranking.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 
          ====================================================
          4. PESTAÑA "PERFIL"
          ====================================================
        */}
        {activeTab === 'perfil' && (
          <div className="space-y-4">
            {/* User Card */}
            <div className="bg-zinc-900 rounded-3xl p-5 shadow-xl border border-zinc-800 text-center relative overflow-hidden">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-3xl shadow-inner mb-2.5">
                {currentPlayer.avatar}
              </div>

              <h2 className="text-lg font-black tracking-wide text-zinc-100 uppercase">
                {currentPlayer.name}
              </h2>
              <div className="inline-block px-3 py-0.5 rounded-full bg-red-950/70 border border-red-800/60 text-red-400 text-xs font-bold uppercase tracking-wider mt-1">
                Contendiente Activo
              </div>

              {onEditProfile && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      onEditProfile();
                    }}
                    className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow"
                  >
                    <span>✏️ Personalizar Nombre y Avatar</span>
                  </button>
                </div>
              )}

              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-zinc-800">
                <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80">
                  <div className="text-xs text-zinc-400 font-medium">Toques Registrados</div>
                  <div className="text-xl font-black text-red-500 tabular-nums mt-0.5">
                    {currentPlayer.votesCast || 0}
                  </div>
                </div>

                <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80">
                  <div className="text-xs text-zinc-400 font-medium">Favorito Actual</div>
                  <div className="text-xs font-bold text-zinc-200 mt-1 truncate">
                    {currentPlayer.favoriteSquishyId
                      ? getSquishy(currentPlayer.favoriteSquishyId).name
                      : 'Ninguno'}
                  </div>
                </div>
              </div>
            </div>

            {/* Badges / Medals */}
            <div className="bg-zinc-900 rounded-3xl p-5 shadow-xl border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black tracking-wide uppercase text-zinc-100">Insignias Desbloqueadas</h3>
                <span className="text-xs text-red-400 font-bold">
                  {currentPlayer.badges?.length || 1}/5
                </span>
              </div>

              <div className="space-y-2">
                {[
                  { name: 'Primer Apriete 🤏', desc: 'Registraste tu primer voto en combate directo' },
                  { name: 'Catador de Esponjas 🥐', desc: 'Has votado más de 5 veces en la arena' },
                  { name: 'Fan del Quesito 🧀', desc: 'Apoyaste a Don Quesito Suizo en el combate' },
                  { name: 'Rey del Squish 👑', desc: 'Más de 10 votos registrados en vivo' },
                ].map((b) => {
                  const isUnlocked = currentPlayer.badges?.includes(b.name);

                  return (
                    <div
                      key={b.name}
                      className={`p-3 rounded-2xl flex items-center gap-3 transition border ${
                        isUnlocked
                          ? 'bg-zinc-950 border-red-800/50 text-zinc-100 shadow-sm'
                          : 'bg-zinc-950/40 border-zinc-800/50 text-zinc-600 opacity-60'
                      }`}
                    >
                      <div className="text-2xl">{b.name.split(' ').slice(-1)[0]}</div>
                      <div>
                        <div className="text-xs font-bold text-zinc-200">{b.name}</div>
                        <div className="text-[11px] text-zinc-500">{b.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 
        ====================================================
        SISTEMA DE PESTAÑAS (BOTTOM NAVIGATION BAR)
        - 1. Votar
        - 2. Ranking (Tabla de posiciones 1 a 12 con medallas)
        - 3. Reglas (Tarjeta explicativa)
        - 4. Perfil (Métricas personales)
        ====================================================
      */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 max-w-xl mx-auto grid grid-cols-4 items-center shadow-2xl">
        <button
          onClick={() => {
            sounds.playSquish();
            setActiveTab('votar');
          }}
          className={`flex flex-col items-center justify-center h-full transition cursor-pointer ${
            activeTab === 'votar' ? 'text-red-500 font-bold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Flame className={`w-5 h-5 ${activeTab === 'votar' ? 'fill-red-500' : ''}`} />
          <span className="text-[10px] tracking-wider uppercase font-semibold mt-1">Votar</span>
        </button>

        <button
          onClick={() => {
            sounds.playSquish();
            setActiveTab('ranking');
          }}
          className={`flex flex-col items-center justify-center h-full transition cursor-pointer ${
            activeTab === 'ranking' ? 'text-red-500 font-bold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] tracking-wider uppercase font-semibold mt-1">Ranking</span>
        </button>

        <button
          onClick={() => {
            sounds.playSquish();
            setActiveTab('reglas');
          }}
          className={`flex flex-col items-center justify-center h-full transition cursor-pointer ${
            activeTab === 'reglas' ? 'text-red-500 font-bold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] tracking-wider uppercase font-semibold mt-1">Reglas</span>
        </button>

        <button
          onClick={() => {
            sounds.playSquish();
            setActiveTab('perfil');
          }}
          className={`flex flex-col items-center justify-center h-full transition cursor-pointer ${
            activeTab === 'perfil' ? 'text-red-500 font-bold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] tracking-wider uppercase font-semibold mt-1">Perfil</span>
        </button>
      </nav>

      {/* Squishy Detail Modal with Clicker Support */}
      {selectedSquishy && (
        <SquishyDetailModal
          squishy={selectedSquishy}
          canVote={isRoundActive}
          currentVotes={gameState.votes[selectedSquishy.id] || 0}
          bonusMultiplier={gameState.superSquishBonus.active ? gameState.superSquishBonus.multiplier : 1}
          onVote={() => handleVoteClick(selectedSquishy.id)}
          onClose={() => setSelectedSquishy(null)}
        />
      )}

      {/* WhatsApp Share Modal */}
      <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} />
    </div>
  );
};
