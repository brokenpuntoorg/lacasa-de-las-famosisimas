import React, { useState, useEffect } from 'react';
import { GameState, Player, GameMode, SquishyParticipant, EliminationState, EliminationStatus } from './types';
import { INITIAL_SQUISHIES } from './data/squishies';
import { socketService } from './services/socketService';
import { sounds } from './services/soundEffects';
import { JoinModal } from './components/JoinModal';
import { PlayerView } from './components/PlayerView';
import { AdminView } from './components/AdminView';
import { ReactionsOverlay } from './components/ReactionsOverlay';
import { VictoryModal } from './components/VictoryModal';
import { ShareModal } from './components/ShareModal';
import { EliminationCeremonyModal } from './components/EliminationCeremonyModal';
import { getPublicShareUrl, isPrivateDevOrigin, getWhatsAppShareLink, triggerWhatsAppShare, copyTextSafe } from './utils/shareUtils';
import { Share2, MessageCircle, Copy, Check, X, ShieldCheck } from 'lucide-react';

const DEFAULT_ELIMINATION: EliminationState = {
  weekNumber: 4,
  title: 'La Casa de los Famosísimos 2 - Semana 4 (Oveja Cúbica Líder 🐑 - Nominaciones este Miércoles)',
  nominees: [],
  immune: ['oveja'],
  leaderId: 'oveja',
  windowStart: '2026-10-12T00:00:00-07:00',
  windowEnd: '2026-10-18T21:30:00-07:00',
  status: 'upcoming',
  eliminatedSquishyId: 'oreo',
  eliminatedSquishyName: 'Galleta Oreo',
  eliminatedVotes: 3629,
  ceremonyActive: false,
  eliminatedHistory: [
    {
      id: 'mantequilla',
      name: 'Mantequilla Clásica',
      nickname: 'Barra 4oz Salted',
      week: 1,
      order: 1,
      reason: '1° Expulsada de La Casa de los Famosísimos 2 (Semana 1) por el público.',
      votes: 142,
    },
    {
      id: 'dumpling_rosa',
      name: 'Dumpling Rosa',
      nickname: 'Mochi Rosita',
      week: 2,
      order: 2,
      reason: '2° Expulsada de La Casa de los Famosísimos 2 (Semana 2) por menor votación del público en la Gran Gala.',
      votes: 2298,
    },
    {
      id: 'oreo',
      name: 'Galleta Oreo',
      nickname: 'Black & White Titan',
      week: 3,
      order: 3,
      reason: '3° Expulsada de La Casa de los Famosísimos 2 (Semana 3) en la Gran Gala por menor cantidad de votos del público.',
      votes: 3629,
    },
  ],
  hideVotesFromPublic: true,
};

const DEFAULT_STATE: GameState = {
  status: 'in_round',
  mode: 'battle_royale',
  categoryName: 'La Casa de los Famosísimos 2 - 2ª Gala de Salvación',
  roundNumber: 2,
  activeFighters: DEFAULT_ELIMINATION.nominees,
  votes: INITIAL_SQUISHIES.reduce((acc, s) => {
    acc[s.id] = 0;
    return acc;
  }, {} as Record<string, number>),
  playerVotes: {},
  timeRemaining: 86400 * 5,
  roundDuration: 86400 * 5,
  isTimerRunning: true,
  superSquishBonus: {
    active: false,
    multiplier: 1,
    expiresAt: null,
  },
  connectedPlayers: [],
  activeReactions: [],
  history: [],
  championSquishyId: null,
  lastWinnerId: null,
  elimination: DEFAULT_ELIMINATION,
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(DEFAULT_STATE);
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(sounds.enabled);
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);
  const [victoryData, setVictoryData] = useState<{ squishy: SquishyParticipant; isSeason: boolean; votesWon: number; totalVotes: number } | null>(null);
  const [showDevBanner, setShowDevBanner] = useState<boolean>(false);
  const [showGlobalShareModal, setShowGlobalShareModal] = useState<boolean>(false);
  const [copiedBannerLink, setCopiedBannerLink] = useState<boolean>(false);

  // Sync client-side route changes (e.g. / vs /admin)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const isAdminRoute = currentPath === '/admin';

  // Initialize socket and fetch initial state
  useEffect(() => {
    // 1. Fetch initial HTTP state
    fetch('/api/state')
      .then((res) => res.json())
      .then((data) => {
        if (data.gameState) {
          setGameState(data.gameState);
        }
      })
      .catch(() => {
        // server might still be booting, socket will handle
      });

    // 2. Connect WebSocket
    socketService.connect();

    // 3. Subscribe to real-time state sync
    const unsubscribe = socketService.subscribeState((newState) => {
      setGameState((prevState) => {
        // Detect round finish transition for victory celebration modal
        if (
          newState.status === 'round_ended' &&
          prevState.status === 'in_round' &&
          newState.lastWinnerId
        ) {
          const winner = INITIAL_SQUISHIES.find((s) => s.id === newState.lastWinnerId) || INITIAL_SQUISHIES[0];
          const totalVotes = Object.values(newState.votes).reduce((a, b) => a + b, 0);
          const votesWon = newState.votes[winner.id] || 0;
          setVictoryData({
            squishy: winner,
            isSeason: false,
            votesWon,
            totalVotes,
          });
          setShowVictoryModal(true);
        } else if (
          newState.status === 'season_champion' &&
          prevState.status !== 'season_champion' &&
          newState.championSquishyId
        ) {
          const champ = INITIAL_SQUISHIES.find((s) => s.id === newState.championSquishyId) || INITIAL_SQUISHIES[0];
          setVictoryData({
            squishy: champ,
            isSeason: true,
            votesWon: champ.totalVotesReceived || 0,
            totalVotes: champ.totalVotesReceived || 1,
          });
          setShowVictoryModal(true);
        }

        return newState;
      });
    });

    // 4. Restore saved player session or create seamless instant guest session
    const storageKey = isAdminRoute ? 'squishy_admin_data' : 'squishy_guest_data';
    const savedPlayer = localStorage.getItem(storageKey);
    if (savedPlayer) {
      try {
        const parsed: Player = JSON.parse(savedPlayer);
        setCurrentPlayer(parsed);
        setShowJoinModal(false);
        socketService.connect(parsed);
      } catch {
        // ignore
      }
    } else if (!isAdminRoute) {
      // Para jugadores invitados: entrada directa 100% libre sin formularios ni bloqueos
      const guestNum = Math.floor(100 + Math.random() * 900);
      const avatars = ['🔥', '⚡', '🧀', '🥐', '👑', '💥', '🥟', '🧊', '🎯', '🐺', '🦊', '🐻'];
      const autoPlayer: Player = {
        id: 'guest_' + Math.random().toString(36).substring(2, 9),
        name: `Votante #${guestNum}`,
        avatar: avatars[Math.floor(Math.random() * avatars.length)],
        role: 'player',
        joinedAt: Date.now(),
        votesCast: 0,
        badges: ['Nivel 1: Novato del Apriete'],
      };
      setCurrentPlayer(autoPlayer);
      setShowJoinModal(false);
      try {
        localStorage.setItem(storageKey, JSON.stringify(autoPlayer));
      } catch {
        // ignore storage errors
      }
      socketService.connect(autoPlayer);
    }

    return () => {
      unsubscribe();
    };
  }, [isAdminRoute]);

  const handleJoin = (playerData: { id: string; name: string; avatar: string; role: 'player' | 'admin'; pin?: string }) => {
    const player: Player = {
      id: playerData.id,
      name: playerData.name,
      avatar: playerData.avatar,
      role: playerData.role,
      joinedAt: Date.now(),
      votesCast: 0,
      badges: ['Nivel 1: Novato del Apriete'],
    };

    setCurrentPlayer(player);
    setShowJoinModal(false);
    const storageKey = playerData.role === 'admin' ? 'squishy_admin_data' : 'squishy_guest_data';
    localStorage.setItem(storageKey, JSON.stringify(player));

    // Connect & notify server
    socketService.connect(playerData);
  };

  const handleVote = (squishyId: string) => {
    if (squishyId === 'mantequilla' || squishyId === 'dumpling_rosa' || squishyId === 'oreo') return;
    if (squishyId === gameState.elimination?.leaderId || gameState.elimination?.immune?.includes(squishyId)) return;
    const participantsList = gameState.customParticipants || INITIAL_SQUISHIES;
    const target = participantsList.find((p) => p.id === squishyId);
    if (target?.isEliminated || target?.isActive === false) return;
    const playerId = currentPlayer?.id || 'guest_' + Math.random().toString(36).substring(2, 8);
    // Optimistic vote update for instant visual feedback on multi-click
    setGameState((prev) => {
      const mult = prev.superSquishBonus?.active ? prev.superSquishBonus.multiplier : 1;
      return {
        ...prev,
        status: 'in_round',
        votes: {
          ...prev.votes,
          [squishyId]: (prev.votes[squishyId] || 0) + mult,
        },
      };
    });

    socketService.send({
      type: 'vote',
      payload: {
        playerId,
        squishyId,
      },
    });
  };

  const handleToggleSound = () => {
    const enabled = sounds.toggleSound();
    setSoundEnabled(enabled);
  };

  // Admin handlers
  const handleStartRound = (params: { mode: GameMode; fighters: string[]; duration: number; categoryName?: string }) => {
    socketService.send({
      type: 'admin_start_round',
      payload: params,
    });
  };

  const handlePauseRound = () => {
    socketService.send({ type: 'admin_pause_round' });
  };

  const handleResumeRound = () => {
    socketService.send({ type: 'admin_resume_round' });
  };

  const handleEndRound = () => {
    socketService.send({ type: 'admin_end_round' });
  };

  const handleToggleBonus = (active: boolean, multiplier: number, durationSeconds?: number) => {
    socketService.send({
      type: 'admin_toggle_bonus',
      payload: { active, multiplier, durationSeconds },
    });
  };

  const handleAddTime = (seconds: number) => {
    socketService.send({
      type: 'admin_add_time',
      payload: { seconds },
    });
  };

  const handleDeclareChampion = (squishyId: string) => {
    socketService.send({
      type: 'admin_declare_champion',
      payload: { squishyId },
    });
  };

  const handleResetGame = () => {
    socketService.send({ type: 'admin_reset_game' });
  };

  const handleUpdateSquishy = (id: string, updates: Partial<SquishyParticipant>) => {
    socketService.send({
      type: 'admin_update_squishy',
      payload: { id, updates },
    });
  };

  const handleQuickStartRound = () => {
    socketService.send({
      type: 'admin_start_round',
      payload: {
        mode: 'battle_royale',
        fighters: (gameState.customParticipants || INITIAL_SQUISHIES).map((s) => s.id),
        duration: 300,
        categoryName: 'Gran Desafío Squishy',
      },
    });
  };

  const handleUpdateElimination = (updates: Partial<EliminationState>) => {
    socketService.send({
      type: 'admin_update_elimination',
      payload: updates,
    });
  };

  const handleTriggerElimination = (squishyId?: string) => {
    socketService.send({
      type: 'admin_trigger_elimination',
      payload: { squishyId },
    });
  };

  const handleSetEliminationStatus = (status: EliminationStatus) => {
    socketService.send({
      type: 'admin_set_elimination_status',
      payload: { status },
    });
  };

  const handleDismissCeremony = () => {
    socketService.send({
      type: 'admin_dismiss_ceremony',
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased font-['Quicksand',sans-serif]">
      {/* Dev URL Notice & Direct WhatsApp Share Banner (Solo visible en entorno de desarrollo ais-dev-) */}
      {showDevBanner && (
        <div className="bg-emerald-950/95 text-emerald-200 border-b border-emerald-500/50 px-3 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-lg relative z-40">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">📲</span>
            <span className="text-[11px] sm:text-xs">
              <strong className="text-white font-black">Votación en WhatsApp:</strong> Difunde el enlace para que tus amigos voten por los <strong className="text-emerald-300 underline font-bold">4 nominados en riesgo</strong> (Oveja, Dumpling Rosa, Pankoso y Medusa). Panquesito es el Líder 👑.
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto shrink-0">
            <a
              href={getWhatsAppShareLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1 transition shadow cursor-pointer active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white" />
              <span>Enviar WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={async () => {
                sounds.playSquish();
                const ok = await copyTextSafe(getPublicShareUrl());
                if (ok) {
                  setCopiedBannerLink(true);
                  setTimeout(() => setCopiedBannerLink(false), 2400);
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
            >
              {copiedBannerLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copiedBannerLink ? 'Copiado' : 'Copiar Link'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGlobalShareModal(true)}
              className="px-2 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-200 text-[11px] font-bold transition cursor-pointer"
              title="Ver QR y detalles"
            >
              QR
            </button>

            <button
              type="button"
              onClick={() => setShowDevBanner(false)}
              className="p-1 rounded-md text-amber-400 hover:text-white hover:bg-amber-900/50 transition cursor-pointer"
              title="Ocultar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Join Screen Modal for Guests */}
      {showJoinModal && !isAdminRoute && (
        <JoinModal 
          isAdminRoute={isAdminRoute} 
          onJoin={handleJoin} 
          onSwitchRoute={navigateTo}
          onClose={() => setShowJoinModal(false)}
        />
      )}

      {/* 
        ROUTING CONDICIONAL:
        - /admin: Vista privada de Administrador para controlar la partida.
        - /: PANTALLA PÚBLICA PARA INVITADOS (Mobile-First, sin acceso de desarrollador).
      */}
      {isAdminRoute ? (
        <AdminView
          gameState={gameState}
          onStartRound={handleStartRound}
          onPauseRound={handlePauseRound}
          onResumeRound={handleResumeRound}
          onEndRound={handleEndRound}
          onToggleBonus={handleToggleBonus}
          onAddTime={handleAddTime}
          onDeclareChampion={handleDeclareChampion}
          onResetGame={handleResetGame}
          onSwitchToPlayer={() => navigateTo('/')}
          onUpdateSquishy={handleUpdateSquishy}
          onUpdateElimination={handleUpdateElimination}
          onTriggerElimination={handleTriggerElimination}
          onSetEliminationStatus={handleSetEliminationStatus}
          onDismissCeremony={handleDismissCeremony}
        />
      ) : (
        <>
          <PlayerView
            gameState={gameState}
            currentPlayer={currentPlayer || {
              id: 'temp_guest',
              name: 'Invitado Squishy',
              avatar: '🐱',
              role: 'player',
              joinedAt: Date.now(),
              votesCast: 0,
              badges: ['Primer Apriete 🤏'],
            }}
            onVote={handleVote}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
            onQuickStartRound={handleQuickStartRound}
            onEditProfile={() => setShowJoinModal(true)}
          />
          {/* Floating Emoji Reactions Overlay */}
          <ReactionsOverlay playerName={currentPlayer?.name || 'Invitado'} />
        </>
      )}

      {/* Round / Season Victory Modal with Confetti */}
      {showVictoryModal && victoryData && (
        <VictoryModal
          squishy={victoryData.squishy}
          isSeasonChampion={victoryData.isSeason}
          votesWon={victoryData.votesWon}
          totalVotes={victoryData.totalVotes}
          onClose={() => setShowVictoryModal(false)}
        />
      )}

      {/* Gran Ceremonia de Eliminación del Domingo Modal */}
      {gameState.elimination && (
        <EliminationCeremonyModal
          isOpen={Boolean(gameState.elimination.ceremonyActive && gameState.elimination.eliminatedSquishyId)}
          elimination={gameState.elimination}
          participants={gameState.customParticipants || INITIAL_SQUISHIES}
          votes={gameState.votes}
          onClose={handleDismissCeremony}
          isAdmin={isAdminRoute}
        />
      )}

      {/* Global Share Modal */}
      <ShareModal isOpen={showGlobalShareModal} onClose={() => setShowGlobalShareModal(false)} />
    </div>
  );
}
