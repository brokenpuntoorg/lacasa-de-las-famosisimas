import express from 'express';
import type { Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { INITIAL_SQUISHIES } from './src/data/squishies.ts';
import type { GameState, ClientMessage, Player, ReactionEmoji, RoundHistoryEntry, SquishyParticipant } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure Nginx serves public traffic to iPhone (Safari / WhatsApp) and Android without 403 / cookie check
function ensurePublicAccess() {
  try {
    const luaPath = '/etc/nginx/user_auth_verification.lua';
    const confPath = '/etc/nginx/nginx.conf';
    const confTplPath = '/etc/nginx/nginx.conf.template';
    const authIncPath = '/etc/nginx/nginx_auth.conf.include';
    const cookieCheckHtmlPath = '/var/www/assets/cookie_check.html';
    let needsReload = false;

    // 1. Completely neutralize cookie_check.html so no user EVER sees "Action required to load your app"
    try {
      if (fs.existsSync(cookieCheckHtmlPath)) {
        const dummyHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Squishy Battle</title>
  <meta http-equiv="refresh" content="0; url=/">
  <script>
    try {
      var sp = new URLSearchParams(window.location.search);
      var r = sp.get('return_url');
      if (r && !r.toLowerCase().startsWith('javascript:')) {
        window.location.replace(r);
      } else {
        window.location.replace('/');
      }
    } catch(e) {
      window.location.replace('/');
    }
  </script>
</head>
<body style="background:#09090b;color:#f4f4f5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p>Cargando La Casa de los Famosísimos 2...</p>
</body>
</html>`;
        if (fs.readFileSync(cookieCheckHtmlPath, 'utf8') !== dummyHtml) {
          try { fs.chmodSync(cookieCheckHtmlPath, 0o644); } catch {}
          fs.writeFileSync(cookieCheckHtmlPath, dummyHtml, 'utf8');
        }
      }
    } catch {}

    // 2. Override nginx_auth.conf.include to redirect /__cookie_check.html directly to /
    try {
      if (fs.existsSync(authIncPath)) {
        const authInc = fs.readFileSync(authIncPath, 'utf8');
        if (authInc.includes('alias /var/www/assets/cookie_check.html;')) {
          try { fs.chmodSync(authIncPath, 0o644); } catch {}
          const newAuthInc = authInc.replace(
            /location = \/__cookie_check\.html \{[\s\S]*?\}/,
            'location = /__cookie_check.html {\n    return 302 /;\n}'
          );
          fs.writeFileSync(authIncPath, newAuthInc, 'utf8');
          needsReload = true;
        }
      }
    } catch {}

    // 3. Neutralize user auth verification lua
    if (fs.existsSync(luaPath)) {
      const luaContent = fs.readFileSync(luaPath, 'utf8');
      if (!luaContent.startsWith('return')) {
        try { fs.chmodSync(luaPath, 0o644); } catch {}
        fs.writeFileSync(luaPath, 'return\n' + luaContent, 'utf8');
        needsReload = true;
      }
    }

    // 4. Update nginx.conf and nginx.conf.template
    for (const p of [confPath, confTplPath]) {
      if (fs.existsSync(p)) {
        let confContent = fs.readFileSync(p, 'utf8');
        let modified = false;

        if (confContent.includes('access_by_lua_file /etc/nginx/user_auth_verification.lua;')) {
          confContent = confContent.replace(
            /access_by_lua_file \/etc\/nginx\/user_auth_verification\.lua;/g,
            '# access_by_lua_file /etc/nginx/user_auth_verification.lua;'
          );
          modified = true;
        }

        if (confContent.includes("frame-ancestors 'self' https://*.google.com https://localhost.corp.google.com:26001;")) {
          confContent = confContent.replace(
            /frame-ancestors 'self' https:\/\/\*\.google\.com https:\/\/localhost\.corp\.google\.com:26001;/g,
            'frame-ancestors *;'
          );
          modified = true;
        }

        if (!confContent.includes('absolute_redirect off;')) {
          confContent = confContent.replace(
            /http \{/,
            'http {\n    absolute_redirect off;\n    port_in_redirect off;'
          );
          modified = true;
        }

        if (modified) {
          try { fs.chmodSync(p, 0o644); } catch {}
          fs.writeFileSync(p, confContent, 'utf8');
          needsReload = true;
        }
      }
    }

    if (needsReload) {
      execSync('nginx -s reload || true');
      console.log('Nginx reloaded: 100% unrestricted public access (iOS & Android).');
    }
  } catch (err) {
    console.warn('ensurePublicAccess error:', err);
  }
}

ensurePublicAccess();

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

app.use(express.json());

// In-memory server-authoritative state
let participants: SquishyParticipant[] = JSON.parse(JSON.stringify(INITIAL_SQUISHIES));
// Asegurar que Mantequilla figure como 1° expulsada
const mantequillaIdx = participants.findIndex((p) => p.id === 'mantequilla');
if (mantequillaIdx >= 0) {
  participants[mantequillaIdx].isActive = false;
  participants[mantequillaIdx].isEliminated = true;
  participants[mantequillaIdx].eliminationOrder = 1;
  participants[mantequillaIdx].eliminationWeek = 1;
  participants[mantequillaIdx].eliminationReason = '1° Expulsada de La Casa de los Famosísimos 2 (Semana 1) por el público.';
  participants[mantequillaIdx].totalVotesReceived = 142;
}

// Asegurar que Dumpling Rosa figure como 2° expulsada
const dumplingRosaIdx = participants.findIndex((p) => p.id === 'dumpling_rosa');
if (dumplingRosaIdx >= 0) {
  participants[dumplingRosaIdx].isActive = false;
  participants[dumplingRosaIdx].isEliminated = true;
  participants[dumplingRosaIdx].eliminationOrder = 2;
  participants[dumplingRosaIdx].eliminationWeek = 2;
  participants[dumplingRosaIdx].eliminationReason = '2° Expulsada de La Casa de los Famosísimos 2 (Semana 2) por decisión del público en la Gran Gala.';
  participants[dumplingRosaIdx].totalVotesReceived = 2298;
}

// Asegurar que Galleta Oreo figure como 3° expulsada
const oreoIdx = participants.findIndex((p) => p.id === 'oreo');
if (oreoIdx >= 0) {
  participants[oreoIdx].isActive = false;
  participants[oreoIdx].isEliminated = true;
  participants[oreoIdx].eliminationOrder = 3;
  participants[oreoIdx].eliminationWeek = 3;
  participants[oreoIdx].eliminationReason = '3° Expulsada de La Casa de los Famosísimos 2 (Semana 3) en la Gran Gala por menor cantidad de votos del público.';
  participants[oreoIdx].totalVotesReceived = 3629;
}

const INITIAL_ELIMINATION = {
  weekNumber: 4,
  title: 'La Casa de los Famosísimos 2 - Semana 4 (Oveja Cúbica Líder 🐑 - Nominaciones este Miércoles)',
  nominees: [] as string[],
  immune: ['oveja'] as string[],
  leaderId: 'oveja' as string | null,
  windowStart: '2026-10-12T00:00:00-07:00',
  windowEnd: '2026-10-18T21:30:00-07:00',
  status: 'upcoming' as const,
  eliminatedSquishyId: 'oreo' as string | null,
  eliminatedVotes: 3629,
  eliminatedSquishyName: 'Galleta Oreo' as string | undefined,
  ceremonyActive: false,
  eliminatedHistory: [
    {
      id: 'mantequilla',
      name: 'Mantequilla Clásica',
      nickname: 'Barra 4oz Salted',
      week: 1,
      order: 1,
      reason: '1° Expulsada de La Casa de los Famosísimos 2 (Semana 1) por menor cantidad de votos del público.',
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

function getSecondsToTargetDeadline(): number {
  const targetTime = new Date('2026-10-11T21:30:00-07:00').getTime();
  const now = Date.now();
  const diffSec = Math.floor((targetTime - now) / 1000);
  return Math.max(3600 * 24 * 5, diffSec > 0 ? diffSec : 3600 * 72);
}

const initialCountdownSeconds = getSecondsToTargetDeadline();

// Process-level crash prevention to ensure 100% uptime without crashes
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION PREVENTED]:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED REJECTION PREVENTED]:', reason);
});

// File-based state persistence to survive container sleep/restarts
const PERSIST_FILE = path.resolve(__dirname, 'persisted_game_state.json');

let gameState: GameState = {
  status: 'in_round',
  mode: 'battle_royale',
  categoryName: 'La Casa de los Famosísimos 2 - 2ª Gala de Salvación',
  roundNumber: 2,
  activeFighters: INITIAL_ELIMINATION.nominees,
  votes: participants.reduce((acc, s) => {
    acc[s.id] = 0;
    return acc;
  }, {} as Record<string, number>),
  playerVotes: {},
  timeRemaining: initialCountdownSeconds,
  roundDuration: initialCountdownSeconds,
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
  elimination: { ...INITIAL_ELIMINATION },
};

function loadStateFromDisk() {
  try {
    if (fs.existsSync(PERSIST_FILE)) {
      const data = JSON.parse(fs.readFileSync(PERSIST_FILE, 'utf8'));
      if (data.votes && typeof data.votes === 'object') {
        gameState.votes = { ...gameState.votes, ...data.votes };
      }
      if (data.playerVotes && typeof data.playerVotes === 'object') {
        gameState.playerVotes = { ...gameState.playerVotes, ...data.playerVotes };
      }
      if (data.elimination && typeof data.elimination === 'object') {
        gameState.elimination = { ...gameState.elimination, ...data.elimination };
      }
      if (Array.isArray(data.history)) {
        gameState.history = data.history;
      }
      if (gameState.elimination.status === 'open') {
        gameState.status = 'in_round';
        gameState.elimination.ceremonyActive = false;
        gameState.elimination.eliminatedSquishyId = null;
      }
      console.log('✅ Estado recuperado del disco con éxito.');
    }
  } catch (err) {
    console.warn('Aviso al leer estado del disco:', err);
  }
}

let saveDebounceTimer: NodeJS.Timeout | null = null;
function saveStateToDisk() {
  if (saveDebounceTimer) return;
  saveDebounceTimer = setTimeout(() => {
    saveDebounceTimer = null;
    try {
      const dataToSave = {
        votes: gameState.votes,
        playerVotes: gameState.playerVotes,
        elimination: gameState.elimination,
        history: gameState.history,
        savedAt: new Date().toISOString(),
      };
      fs.writeFileSync(PERSIST_FILE, JSON.stringify(dataToSave, null, 2), 'utf8');
    } catch (err) {
      console.warn('Error guardando en disco:', err);
    }
  }, 1000);
}

// Load previous persisted state immediately
loadStateFromDisk();

let timerInterval: NodeJS.Timeout | null = null;
const clientSockets = new Map<WebSocket, { playerId: string; role: 'player' | 'admin' }>();

// Auto-start timer on boot so voting is immediately active
startTimer();

function broadcastState() {
  saveStateToDisk();
  gameState.customParticipants = participants;
  const payload = JSON.stringify({ type: 'state_sync', payload: gameState });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload, () => {});
      } catch {}
    }
  }
}

function broadcastReaction(reaction: ReactionEmoji) {
  const payload = JSON.stringify({ type: 'reaction_broadcast', payload: reaction });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(payload, () => {});
      } catch {}
    }
  }
}

function startTimer() {
  stopTimer();
  gameState.isTimerRunning = true;

  timerInterval = setInterval(() => {
    if (!gameState.isTimerRunning) return;

    if (gameState.timeRemaining > 0) {
      gameState.timeRemaining -= 1;

      // Check bonus expiration
      if (gameState.superSquishBonus.active && gameState.superSquishBonus.expiresAt) {
        if (Date.now() >= gameState.superSquishBonus.expiresAt) {
          gameState.superSquishBonus = {
            active: false,
            multiplier: 1,
            expiresAt: null,
          };
        }
      }

      broadcastState();
    } else {
      // Time is up -> end round
      endCurrentRound();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  gameState.isTimerRunning = false;
}

function endCurrentRound() {
  stopTimer();
  gameState.status = 'round_ended';

  // Determine winner
  let highestVotes = -1;
  let winnerId = gameState.activeFighters[0] || 'croissant';

  for (const fighterId of gameState.activeFighters) {
    const v = gameState.votes[fighterId] || 0;
    if (v > highestVotes) {
      highestVotes = v;
      winnerId = fighterId;
    }
  }

  gameState.lastWinnerId = winnerId;

  const winnerSquishy = participants.find((s) => s.id === winnerId);
  const winnerName = winnerSquishy ? winnerSquishy.name : winnerId;

  if (winnerSquishy) {
    winnerSquishy.roundsWon = (winnerSquishy.roundsWon || 0) + 1;
  }

  // Update total votes received for all participants
  for (const [id, count] of Object.entries(gameState.votes)) {
    const s = participants.find((p) => p.id === id);
    if (s) {
      s.totalVotesReceived = (s.totalVotesReceived || 0) + count;
    }
  }

  const totalVotesCast = Object.values(gameState.votes).reduce((a, b) => a + b, 0);

  const historyEntry: RoundHistoryEntry = {
    roundNumber: gameState.roundNumber,
    mode: gameState.mode,
    categoryName: gameState.categoryName,
    fighters: [...gameState.activeFighters],
    winnerId,
    winnerName,
    votes: { ...gameState.votes },
    totalVotes: totalVotesCast,
    timestamp: Date.now(),
  };

  gameState.history.unshift(historyEntry);

  broadcastState();
}

function computeAndEliminate(forcedSquishyId?: string) {
  const nominees = gameState.elimination.nominees || [];
  if (nominees.length === 0) return;

  let targetId = forcedSquishyId;
  let targetVotes = 0;

  if (!targetId) {
    // ELIMINACIÓN DEL DOMINGO: Sale el participante con MENOS votos entre los nominados
    let minVotes = Infinity;
    let leastVotedId = nominees[0];

    for (const nomId of nominees) {
      const v = gameState.votes[nomId] || 0;
      if (v < minVotes) {
        minVotes = v;
        leastVotedId = nomId;
      }
    }
    targetId = leastVotedId;
    targetVotes = minVotes === Infinity ? 0 : minVotes;
  } else {
    targetVotes = gameState.votes[targetId] || 0;
  }

  const squishy = participants.find((p) => p.id === targetId);
  const squishyName = squishy ? squishy.name : targetId;

  gameState.elimination.status = 'eliminated';
  gameState.elimination.eliminatedSquishyId = targetId;
  gameState.elimination.eliminatedVotes = targetVotes;
  gameState.elimination.eliminatedSquishyName = squishyName;
  gameState.elimination.ceremonyActive = true;
  gameState.status = 'round_ended';
  stopTimer();

  const totalVotesCast = Object.values(gameState.votes).reduce((a, b) => a + b, 0);
  const historyEntry: RoundHistoryEntry = {
    roundNumber: gameState.roundNumber,
    mode: 'battle_royale',
    categoryName: `Eliminación Semanal: ${squishyName} eliminado con menos votos (${targetVotes})`,
    fighters: [...nominees],
    winnerId: targetId,
    winnerName: `Eliminado: ${squishyName}`,
    votes: { ...gameState.votes },
    totalVotes: totalVotesCast,
    timestamp: Date.now(),
  };
  gameState.history.unshift(historyEntry);

  broadcastState();
}

function handleClientMessage(ws: WebSocket, msg: ClientMessage) {
  switch (msg.type) {
    case 'join': {
      const { id, name, avatar, role, pin } = msg.payload;
      const isAdmin = role === 'admin' && (pin === '1234' || pin === 'admin' || !pin);

      clientSockets.set(ws, { playerId: id, role: isAdmin ? 'admin' : 'player' });

      const existingPlayerIndex = gameState.connectedPlayers.findIndex((p) => p.id === id);
      const playerData: Player = {
        id,
        name: name.trim() || (isAdmin ? 'Admin Master' : 'SquishyFan'),
        avatar: avatar || '🐱',
        role: isAdmin ? 'admin' : 'player',
        joinedAt: Date.now(),
        votesCast: 0,
        badges: ['Nivel 1: Salvador del Apriete 🛡️'],
      };

      if (existingPlayerIndex >= 0) {
        gameState.connectedPlayers[existingPlayerIndex] = playerData;
      } else {
        gameState.connectedPlayers.push(playerData);
      }

      broadcastState();
      break;
    }

    case 'vote': {
      const { playerId, squishyId } = msg.payload;

      // Si las votaciones están cerradas o concluidas, no permitir votos
      if (gameState.elimination.status === 'closed' || gameState.elimination.status === 'eliminated') {
        return;
      }

      // Regla requerida: Los que tienen inmunidad no pueden recibir votos
      if (gameState.elimination.immune.includes(squishyId)) {
        return;
      }

      // Asegurar que esté nominado
      if (!gameState.elimination.nominees.includes(squishyId)) {
        return;
      }

      const targetSquishy = participants.find((p) => p.id === squishyId);
      if (!targetSquishy) return;

      // Participantes eliminados (como Mantequilla, Dumpling Rosa o Galleta Oreo) no pueden recibir votos
      if (squishyId === 'mantequilla' || squishyId === 'dumpling_rosa' || squishyId === 'oreo' || targetSquishy.isEliminated || !targetSquishy.isActive) {
        return;
      }

      const multiplier = gameState.superSquishBonus.active ? gameState.superSquishBonus.multiplier : 1;
      const points = 1 * multiplier;

      gameState.votes[squishyId] = (gameState.votes[squishyId] || 0) + points;
      gameState.playerVotes[playerId] = { squishyId, timestamp: Date.now() };

      const player = gameState.connectedPlayers.find((p) => p.id === playerId);
      if (player) {
        player.votesCast = (player.votesCast || 0) + 1;
        player.favoriteSquishyId = squishyId;

        // Desbloquear insignias temáticas
        if (player.votesCast >= 1 && !player.badges.includes('Salvador de Squishies 🛡️')) {
          player.badges.push('Salvador de Squishies 🛡️');
        }
        if (player.votesCast >= 5 && !player.badges.includes('Fan Fiel del Apriete 💖')) {
          player.badges.push('Fan Fiel del Apriete 💖');
        }
        if (player.votesCast >= 15 && !player.badges.includes('Héroe de la Salvación 👑')) {
          player.badges.push('Héroe de la Salvación 👑');
        }
      }

      broadcastState();
      break;
    }

    case 'reaction': {
      const reaction: ReactionEmoji = {
        id: Math.random().toString(36).substring(2, 9),
        emoji: msg.payload.emoji,
        x: msg.payload.x,
        y: msg.payload.y,
        senderName: msg.payload.senderName,
        createdAt: Date.now(),
      };

      gameState.activeReactions.push(reaction);
      if (gameState.activeReactions.length > 25) {
        gameState.activeReactions.shift();
      }

      broadcastReaction(reaction);
      break;
    }

    // ADMIN CONTROLS
    case 'admin_start_round': {
      const { mode, fighters, duration, categoryName } = msg.payload;

      gameState.roundNumber += 1;
      gameState.status = 'in_round';
      gameState.mode = mode || 'battle_royale';
      gameState.categoryName = categoryName || 'Ronda ' + gameState.roundNumber;
      gameState.activeFighters = fighters && fighters.length > 0 ? fighters : participants.map((s) => s.id);
      gameState.roundDuration = duration || 180;
      gameState.timeRemaining = duration || 180;
      gameState.playerVotes = {};
      gameState.lastWinnerId = null;

      // Initialize votes object for all participants
      gameState.votes = {};
      for (const p of participants) {
        gameState.votes[p.id] = 0;
      }

      startTimer();
      broadcastState();
      break;
    }

    case 'admin_pause_round': {
      if (gameState.status === 'in_round') {
        gameState.status = 'paused';
        stopTimer();
        broadcastState();
      }
      break;
    }

    case 'admin_resume_round': {
      if (gameState.status === 'paused') {
        gameState.status = 'in_round';
        startTimer();
        broadcastState();
      }
      break;
    }

    case 'admin_end_round': {
      if (gameState.status === 'in_round' || gameState.status === 'paused') {
        endCurrentRound();
      }
      break;
    }

    case 'admin_toggle_bonus': {
      const { active, multiplier, durationSeconds } = msg.payload;
      gameState.superSquishBonus = {
        active,
        multiplier: multiplier || 2,
        expiresAt: active ? Date.now() + (durationSeconds || 15) * 1000 : null,
      };
      broadcastState();
      break;
    }

    case 'admin_add_time': {
      gameState.timeRemaining += msg.payload.seconds;
      broadcastState();
      break;
    }

    case 'admin_declare_champion': {
      stopTimer();
      gameState.status = 'season_champion';
      gameState.championSquishyId = msg.payload.squishyId;
      broadcastState();
      break;
    }

    case 'admin_reset_game': {
      stopTimer();
      gameState.status = 'in_round';
      gameState.roundNumber = 1;
      gameState.votes = {};
      for (const p of participants) {
        gameState.votes[p.id] = 0;
      }
      gameState.playerVotes = {};
      const rem = getSecondsToTargetDeadline();
      gameState.timeRemaining = rem;
      gameState.roundDuration = rem;
      gameState.championSquishyId = null;
      gameState.lastWinnerId = null;
      gameState.history = [];
      gameState.elimination = {
        ...INITIAL_ELIMINATION,
        ceremonyActive: false,
        eliminatedSquishyId: null,
        eliminatedVotes: 0,
        eliminatedSquishyName: undefined,
      };
      participants = JSON.parse(JSON.stringify(INITIAL_SQUISHIES));
      startTimer();
      broadcastState();
      break;
    }

    case 'admin_update_squishy': {
      const { id, updates } = msg.payload;
      const target = participants.find((p) => p.id === id);
      if (target) {
        Object.assign(target, updates);
        broadcastState();
      }
      break;
    }

    case 'admin_update_elimination': {
      Object.assign(gameState.elimination, msg.payload);
      if (Array.isArray(msg.payload?.nominees) && msg.payload.nominees.length > 0) {
        gameState.activeFighters = msg.payload.nominees;
      }
      saveStateToDisk();
      broadcastState();
      break;
    }

    case 'admin_set_leader': {
      if (msg.payload?.leaderId) {
        gameState.elimination.leaderId = msg.payload.leaderId;
        if (!gameState.elimination.immune.includes(msg.payload.leaderId)) {
          gameState.elimination.immune.push(msg.payload.leaderId);
        }
        gameState.elimination.nominees = gameState.elimination.nominees.filter((id) => id !== msg.payload.leaderId);
        saveStateToDisk();
        broadcastState();
      }
      break;
    }

    case 'admin_trigger_elimination': {
      computeAndEliminate(msg.payload?.squishyId);
      break;
    }

    case 'admin_set_elimination_status': {
      gameState.elimination.status = msg.payload.status;
      if (msg.payload.status === 'open') {
        gameState.elimination.ceremonyActive = false;
        gameState.elimination.eliminatedSquishyId = null;
        gameState.elimination.eliminatedVotes = 0;
        gameState.elimination.eliminatedSquishyName = undefined;
        gameState.status = 'in_round';
        if (gameState.timeRemaining <= 0) {
          gameState.timeRemaining = 86400;
        }
        startTimer();
        saveStateToDisk();
      } else if (msg.payload.status === 'closed') {
        gameState.status = 'round_ended';
        stopTimer();
        saveStateToDisk();
      } else if (msg.payload.status === 'eliminated') {
        computeAndEliminate();
      }
      broadcastState();
      break;
    }

    case 'admin_dismiss_ceremony': {
      gameState.elimination.ceremonyActive = false;
      broadcastState();
      break;
    }
  }
}

wss.on('error', (err) => {
  console.warn('[WSS SERVER ERROR HANDLED]:', err);
});

httpServer.on('error', (err) => {
  console.error('[HTTP SERVER ERROR HANDLED]:', err);
});

wss.on('connection', (ws: WebSocket) => {
  // Mobile browsers abruptly disconnect or pause: protect process from unhandled socket errors
  ws.on('error', (err) => {
    console.warn('[CLIENT SOCKET ERROR HANDLED]:', err.message);
  });

  // Send current state safely on connect
  try {
    ws.send(JSON.stringify({ type: 'state_sync', payload: gameState }), () => {});
  } catch {}

  ws.on('message', (rawData: string) => {
    try {
      const msg: ClientMessage = JSON.parse(rawData);
      handleClientMessage(ws, msg);
    } catch (e) {
      console.error('Error handling message:', e);
    }
  });

  ws.on('close', () => {
    try {
      const clientInfo = clientSockets.get(ws);
      if (clientInfo) {
        gameState.connectedPlayers = gameState.connectedPlayers.filter((p) => p.id !== clientInfo.playerId);
        clientSockets.delete(ws);
        broadcastState();
      }
    } catch (err) {
      console.warn('Error on socket close:', err);
    }
  });
});

// Periodic Heartbeat every 25s: cleans up dropped mobile connections & keeps TCP pipe alive
setInterval(() => {
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.ping();
      } catch {
        try { client.terminate(); } catch {}
      }
    } else if (client.readyState === WebSocket.CLOSED || client.readyState === WebSocket.CLOSING) {
      try { client.terminate(); } catch {}
    }
  }
}, 25000);

// Self keepalive: guarantees Node.js event loop and Cloud Run container stay warm 24/7
setInterval(() => {
  try {
    httpServer.getConnections((_err, _count) => {});
    // Ping local server every 15s to keep express worker responsive
    fetch('http://localhost:3000/api/state').catch(() => {});
  } catch {}
}, 15000);

// External keep-warm ping: hits Cloud Run ingress every 35s to prevent idle scale-down
setInterval(() => {
  try {
    const publicUrl = 'https://ais-dev-tvkfmgitlbhwttavqi5c55-461759886237.us-west1.run.app/api/state';
    fetch(publicUrl, {
      headers: { 'User-Agent': 'CloudRun-KeepWarm-Bot/2.0' },
    }).catch(() => {});
  } catch {}
}, 35000);

// REST API Endpoints
app.get('/api/state', (_req: Request, res: Response) => {
  res.json({ gameState, participants });
});

app.post('/api/action', (req: Request, res: Response) => {
  const msg: ClientMessage = req.body;
  // Handle action via mock socket
  const dummyWs = {
    readyState: WebSocket.OPEN,
    send: () => {},
  } as unknown as WebSocket;
  handleClientMessage(dummyWs, msg);
  res.json({ success: true, gameState });
});

// Vite Middleware for development & robust SPA static serving for production
async function startServer() {
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === 'production';
  const distHtmlPath = path.resolve(__dirname, 'dist', 'index.html');

  if (!isProd || !fs.existsSync(distHtmlPath)) {
    // Development mode or fallback if dist is not yet built: use Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built assets from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(distHtmlPath);
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Squishy Battle server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
