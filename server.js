// server.ts
import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";

// src/data/squishies.ts
var INITIAL_SQUISHIES = [
  {
    id: "croissant",
    name: "Croissant Crujiente",
    nickname: "El Se\xF1or Hojaldrado",
    filename: "croissant.png",
    description: "Dorado por fuera, con capas hojaldradas y aroma a mantequilla tibia. Su recuperaci\xF3n es suave y calmante.",
    personality: "Elegante y madrugador, presume de ser el rey del desayuno parisino.",
    stats: {
      squishFactor: 94,
      softness: 91,
      slowRiseTime: 4.8,
      stressRelief: 96
    },
    themeColor: "#DC2626",
    badgeColor: "bg-zinc-800 text-zinc-200 border-zinc-700",
    categories: ["mas_delicioso", "mas_apretujable"],
    isActive: true,
    totalVotesReceived: 0,
    roundsWon: 0
  },
  {
    id: "dumpling_rosa",
    name: "Dumpling Rosa",
    nickname: "Mochi Rosita",
    filename: "dumpling rosa.png",
    description: "Transl\xFAcido con textura gomosa y sonrisa desafiante. Se siente como gelatina de alta densidad.",
    personality: "\xC1gil y carism\xE1tica, domina la arena con rebotes el\xE1sticos impredecibles.",
    stats: {
      squishFactor: 99,
      softness: 99,
      slowRiseTime: 3.2,
      stressRelief: 98
    },
    themeColor: "#EF4444",
    badgeColor: "bg-red-950/50 text-red-400 border-red-800/60",
    categories: ["mas_tierno", "mas_apretujable"],
    isActive: true,
    totalVotesReceived: 0,
    roundsWon: 0
  },
  {
    id: "dumpling_clasico",
    name: "Dumpling Cl\xE1sico",
    nickname: "Bao Bao Blanco",
    filename: "dumpling.png",
    description: "Baozi blanco al vapor con pliegues artesanales y resistencia el\xE1stica insuperable.",
    personality: "Sereno, concentrado y con una absorci\xF3n de impacto legendaria.",
    stats: {
      squishFactor: 97,
      softness: 98,
      slowRiseTime: 4.2,
      stressRelief: 99
    },
    themeColor: "#E2E8F0",
    badgeColor: "bg-zinc-800 text-zinc-200 border-zinc-700",
    categories: ["mas_tierno", "mas_apretujable"],
    isActive: true,
    totalVotesReceived: 0,
    roundsWon: 0
  },
  {
    id: "hielo_rojo",
    name: "Hielo Rojo Claro",
    nickname: "Cubo Rub\xED",
    filename: "Hielo-rojo-claro.png",
    description: "Cubo geom\xE9trico de resina gelatinosa con brillo transl\xFAcido carmes\xED. Rebote firme y alta respuesta t\xE1ctil.",
    personality: "Preciso, fr\xEDo y letal en duelos de resistencia lenta.",
    stats: {
      squishFactor: 91,
      softness: 87,
      slowRiseTime: 2.1,
      stressRelief: 92
    },
    themeColor: "#DC2626",
    badgeColor: "bg-red-950/70 text-red-300 border-red-700",
    categories: ["el_mas_raro"],
    isActive: true,
    totalVotesReceived: 0,
    roundsWon: 0
  },
  {
    id: "mantequilla",
    name: "Mantequilla Cl\xE1sica",
    nickname: "Barra 4oz Salted",
    filename: "mantequilla.png",
    description: 'La emblem\xE1tica barra rectangular con letras en bajo relieve "4oz. BUTTER". Densidad pesada y slow-rise ultra lento.',
    personality: "Firme, contundente y un tanque defensivo en las votaciones.",
    stats: {
      squishFactor: 96,
      softness: 95,
      slowRiseTime: 5.6,
      stressRelief: 97
    },
    themeColor: "#B91C1C",
    badgeColor: "bg-zinc-800 text-zinc-200 border-zinc-700",
    categories: ["mas_delicioso", "mas_apretujable"],
    isActive: true,
    totalVotesReceived: 0,
    roundsWon: 0
  },
  {
    id: "mantequilla_arcoiris",
    name: "Mantequilla Arco\xEDris",
    nickname: "Rainbow Butter",
    filename: "mantequilla-arcoiris.png",
    description: 'Barra con capas en degrad\xE9 multicolor rotulada con "SALTED BUTTER". Memoria de forma extendida.',
    personality: "Impresionante en el escenario con un estilo visual hipn\xF3tico.",
    stats: {
      squishFactor: 98,
      softness: 96,
      slowRiseTime: 5.3,
      stressRelief: 99
    },
    themeColor: "#EF4444",
    badgeColor: "bg-zinc-800 text-zinc-200 border-zinc-700",
    categories: ["el_mas_raro", "mas_tierno"],
    isActive: true,
    totalVotesReceived: 0,
    roundsWon: 0
  },
  {
    id: "medusa",
    name: "Medusa Gelatina",
    nickname: "Medusa Crimson",
    filename: "medusa.png",
    description: "C\xFApula marina transl\xFAcida con tent\xE1culos el\xE1sticos que bailan y absorben cada apriete.",
    personality: "Fluida e impredecible, capaz de remontar cualquier marcador.",
    stats: {
      squishFactor: 93,
      softness: 94,
      slowRiseTime: 2.9,
      stressRelief: 95
    },
    themeColor: "#991B1B",
    badgeColor: "bg-red-950/50 text-red-400 border-red-800/60",
    categories: ["el_mas_raro", "mas_tierno"],
    isActive: true,
    totalVotesReceived: 0,
    roundsWon: 0
  },
  {
    id: "oreo",
    name: "Galleta Oreo",
    nickname: "Black & White Titan",
    filename: "oreo.png",
    description: "S\xE1ndwich de galleta oscura con relieve y n\xFAcleo de crema densa de alta recuperaci\xF3n.",
    personality: "El cl\xE1sico indiscutible con una base de fan\xE1ticos implacable.",
    stats: {
      squishFactor: 92,
      softness: 91,
      slowRiseTime: 3.8,
      stressRelief: 94
    },
    themeColor: "#18181B",
    badgeColor: "bg-zinc-800 text-zinc-200 border-zinc-700",
    categories: ["mas_delicioso"],
    isActive: true,
    totalVotesReceived: 0,
    roundsWon: 0
  },
  {
    id: "oveja",
    name: "Oveja C\xFAbica",
    nickname: "Oveja Voxel",
    filename: "oveja.png",
    description: "Bloque c\xFAbico de espuma microcelular ultra densa con rostro voxel.",
    personality: "Inamovible, geom\xE9trica y siempre en el centro del combate.",
    stats: {
      squishFactor: 95,
      softness: 97,
      slowRiseTime: 4.6,
      stressRelief: 98
    },
    themeColor: "#71717A",
    badgeColor: "bg-zinc-800 text-zinc-200 border-zinc-700",
    categories: ["el_mas_raro", "mas_tierno"],
    isActive: true,
    totalVotesReceived: 0,
    roundsWon: 0
  },
  {
    id: "pankoso",
    name: "Pankoso",
    nickname: "Bollo Glaseado",
    filename: "pankoso.png",
    description: "Panecillo esf\xE9rico con capa glaseada y base de esponja con retorno ultra suave.",
    personality: "Imparable en los \xFAltimos segundos de votaci\xF3n.",
    stats: {
      squishFactor: 96,
      softness: 98,
      slowRiseTime: 4.9,
      stressRelief: 97
    },
    themeColor: "#EA580C",
    badgeColor: "bg-zinc-800 text-zinc-200 border-zinc-700",
    categories: ["mas_apretujable", "mas_delicioso"],
    isActive: true,
    totalVotesReceived: 0,
    roundsWon: 0
  },
  {
    id: "panquesito",
    name: "Panquesito Dorado",
    nickname: "Brioche Champion",
    filename: "panquesito.png",
    description: "Muffin horneado de masa densa con c\xFApula esponjosa de alta resistencia.",
    personality: "Competitivo, explosivo y favorito en duelos directos.",
    stats: {
      squishFactor: 95,
      softness: 96,
      slowRiseTime: 4.4,
      stressRelief: 96
    },
    themeColor: "#B91C1C",
    badgeColor: "bg-red-950/40 text-red-400 border-red-800/40",
    categories: ["mas_delicioso", "mas_tierno"],
    isActive: true,
    totalVotesReceived: 0,
    roundsWon: 0
  },
  {
    id: "quesito",
    name: "El Quesito",
    nickname: "Don Quesito Suizo",
    filename: "quesito.png",
    description: "Tri\xE1ngulo aerodin\xE1mico de queso con orificios en relieve y compresi\xF3n el\xE1stica extrema.",
    personality: "Audaz, directo y un contendiente que nunca se rinde en el ring.",
    stats: {
      squishFactor: 97,
      softness: 96,
      slowRiseTime: 5.1,
      stressRelief: 98
    },
    themeColor: "#DC2626",
    badgeColor: "bg-red-950/60 text-red-300 border-red-700",
    categories: ["mas_delicioso", "mas_apretujable", "mas_tierno"],
    isActive: true,
    totalVotesReceived: 0,
    roundsWon: 0
  }
];

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var httpServer = createServer(app);
var wss = new WebSocketServer({ server: httpServer, path: "/ws" });
app.use(express.json());
var participants = JSON.parse(JSON.stringify(INITIAL_SQUISHIES));
var gameState = {
  status: "in_round",
  mode: "battle_royale",
  categoryName: "Gran Desaf\xEDo Squishy",
  roundNumber: 1,
  activeFighters: participants.map((s) => s.id),
  votes: participants.reduce((acc, s) => {
    acc[s.id] = 0;
    return acc;
  }, {}),
  playerVotes: {},
  timeRemaining: 600,
  roundDuration: 600,
  isTimerRunning: true,
  superSquishBonus: {
    active: false,
    multiplier: 1,
    expiresAt: null
  },
  connectedPlayers: [],
  activeReactions: [],
  history: [],
  championSquishyId: null,
  lastWinnerId: null
};
var timerInterval = null;
var clientSockets = /* @__PURE__ */ new Map();
startTimer();
function broadcastState() {
  gameState.customParticipants = participants;
  const payload = JSON.stringify({ type: "state_sync", payload: gameState });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}
function broadcastReaction(reaction) {
  const payload = JSON.stringify({ type: "reaction_broadcast", payload: reaction });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
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
      if (gameState.superSquishBonus.active && gameState.superSquishBonus.expiresAt) {
        if (Date.now() >= gameState.superSquishBonus.expiresAt) {
          gameState.superSquishBonus = {
            active: false,
            multiplier: 1,
            expiresAt: null
          };
        }
      }
      broadcastState();
    } else {
      endCurrentRound();
    }
  }, 1e3);
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
  gameState.status = "round_ended";
  let highestVotes = -1;
  let winnerId = gameState.activeFighters[0] || "croissant";
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
  for (const [id, count] of Object.entries(gameState.votes)) {
    const s = participants.find((p) => p.id === id);
    if (s) {
      s.totalVotesReceived = (s.totalVotesReceived || 0) + count;
    }
  }
  const totalVotesCast = Object.values(gameState.votes).reduce((a, b) => a + b, 0);
  const historyEntry = {
    roundNumber: gameState.roundNumber,
    mode: gameState.mode,
    categoryName: gameState.categoryName,
    fighters: [...gameState.activeFighters],
    winnerId,
    winnerName,
    votes: { ...gameState.votes },
    totalVotes: totalVotesCast,
    timestamp: Date.now()
  };
  gameState.history.unshift(historyEntry);
  broadcastState();
}
function handleClientMessage(ws, msg) {
  switch (msg.type) {
    case "join": {
      const { id, name, avatar, role, pin } = msg.payload;
      const isAdmin = role === "admin" && (pin === "1234" || pin === "admin" || !pin);
      clientSockets.set(ws, { playerId: id, role: isAdmin ? "admin" : "player" });
      const existingPlayerIndex = gameState.connectedPlayers.findIndex((p) => p.id === id);
      const playerData = {
        id,
        name: name.trim() || (isAdmin ? "Admin Master" : "SquishyFan"),
        avatar: avatar || "\u{1F431}",
        role: isAdmin ? "admin" : "player",
        joinedAt: Date.now(),
        votesCast: 0,
        badges: ["Nivel 1: Novato del Apriete"]
      };
      if (existingPlayerIndex >= 0) {
        gameState.connectedPlayers[existingPlayerIndex] = playerData;
      } else {
        gameState.connectedPlayers.push(playerData);
      }
      broadcastState();
      break;
    }
    case "vote": {
      const { playerId, squishyId } = msg.payload;
      if (gameState.status !== "in_round" || gameState.timeRemaining <= 0) {
        gameState.status = "in_round";
        gameState.timeRemaining = Math.max(gameState.timeRemaining, 300);
        startTimer();
      }
      const targetSquishy = participants.find((p) => p.id === squishyId);
      if (!targetSquishy) return;
      const multiplier = gameState.superSquishBonus.active ? gameState.superSquishBonus.multiplier : 1;
      const points = 1 * multiplier;
      gameState.votes[squishyId] = (gameState.votes[squishyId] || 0) + points;
      gameState.playerVotes[playerId] = { squishyId, timestamp: Date.now() };
      const player = gameState.connectedPlayers.find((p) => p.id === playerId);
      if (player) {
        player.votesCast = (player.votesCast || 0) + 1;
        player.favoriteSquishyId = squishyId;
        if (player.votesCast >= 1 && !player.badges.includes("Primer Apriete \u{1F90F}")) {
          player.badges.push("Primer Apriete \u{1F90F}");
        }
        if (squishyId === "quesito" && !player.badges.includes("Fan del Quesito \u{1F9C0}")) {
          player.badges.push("Fan del Quesito \u{1F9C0}");
        }
        if (player.votesCast >= 5 && !player.badges.includes("Catador de Esponjas \u{1F950}")) {
          player.badges.push("Catador de Esponjas \u{1F950}");
        }
        if (player.votesCast >= 10 && !player.badges.includes("Rey del Squish \u{1F451}")) {
          player.badges.push("Rey del Squish \u{1F451}");
        }
      }
      broadcastState();
      break;
    }
    case "reaction": {
      const reaction = {
        id: Math.random().toString(36).substring(2, 9),
        emoji: msg.payload.emoji,
        x: msg.payload.x,
        y: msg.payload.y,
        senderName: msg.payload.senderName,
        createdAt: Date.now()
      };
      gameState.activeReactions.push(reaction);
      if (gameState.activeReactions.length > 25) {
        gameState.activeReactions.shift();
      }
      broadcastReaction(reaction);
      break;
    }
    // ADMIN CONTROLS
    case "admin_start_round": {
      const { mode, fighters, duration, categoryName } = msg.payload;
      gameState.roundNumber += 1;
      gameState.status = "in_round";
      gameState.mode = mode || "battle_royale";
      gameState.categoryName = categoryName || "Ronda " + gameState.roundNumber;
      gameState.activeFighters = fighters && fighters.length > 0 ? fighters : participants.map((s) => s.id);
      gameState.roundDuration = duration || 180;
      gameState.timeRemaining = duration || 180;
      gameState.playerVotes = {};
      gameState.lastWinnerId = null;
      gameState.votes = {};
      for (const p of participants) {
        gameState.votes[p.id] = 0;
      }
      startTimer();
      broadcastState();
      break;
    }
    case "admin_pause_round": {
      if (gameState.status === "in_round") {
        gameState.status = "paused";
        stopTimer();
        broadcastState();
      }
      break;
    }
    case "admin_resume_round": {
      if (gameState.status === "paused") {
        gameState.status = "in_round";
        startTimer();
        broadcastState();
      }
      break;
    }
    case "admin_end_round": {
      if (gameState.status === "in_round" || gameState.status === "paused") {
        endCurrentRound();
      }
      break;
    }
    case "admin_toggle_bonus": {
      const { active, multiplier, durationSeconds } = msg.payload;
      gameState.superSquishBonus = {
        active,
        multiplier: multiplier || 2,
        expiresAt: active ? Date.now() + (durationSeconds || 15) * 1e3 : null
      };
      broadcastState();
      break;
    }
    case "admin_add_time": {
      gameState.timeRemaining += msg.payload.seconds;
      broadcastState();
      break;
    }
    case "admin_declare_champion": {
      stopTimer();
      gameState.status = "season_champion";
      gameState.championSquishyId = msg.payload.squishyId;
      broadcastState();
      break;
    }
    case "admin_reset_game": {
      stopTimer();
      gameState.status = "in_round";
      gameState.roundNumber = 1;
      gameState.votes = {};
      for (const p of participants) {
        gameState.votes[p.id] = 0;
      }
      gameState.playerVotes = {};
      gameState.timeRemaining = 300;
      gameState.roundDuration = 300;
      gameState.championSquishyId = null;
      gameState.lastWinnerId = null;
      gameState.history = [];
      participants = JSON.parse(JSON.stringify(INITIAL_SQUISHIES));
      startTimer();
      broadcastState();
      break;
    }
    case "admin_update_squishy": {
      const { id, updates } = msg.payload;
      const target = participants.find((p) => p.id === id);
      if (target) {
        Object.assign(target, updates);
        broadcastState();
      }
      break;
    }
  }
}
wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "state_sync", payload: gameState }));
  ws.on("message", (rawData) => {
    try {
      const msg = JSON.parse(rawData);
      handleClientMessage(ws, msg);
    } catch (e) {
      console.error("Error handling message:", e);
    }
  });
  ws.on("close", () => {
    const clientInfo = clientSockets.get(ws);
    if (clientInfo) {
      gameState.connectedPlayers = gameState.connectedPlayers.filter((p) => p.id !== clientInfo.playerId);
      clientSockets.delete(ws);
      broadcastState();
    }
  });
});
app.get("/api/state", (_req, res) => {
  res.json({ gameState, participants });
});
app.post("/api/action", (req, res) => {
  const msg = req.body;
  const dummyWs = {
    readyState: WebSocket.OPEN,
    send: () => {
    }
  };
  handleClientMessage(dummyWs, msg);
  res.json({ success: true, gameState });
});
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }
  const PORT = 3e3;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Squishy Battle server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
