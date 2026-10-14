export interface SquishyStats {
  squishFactor: number; // 0-100%
  softness: number;     // 0-100%
  slowRiseTime: number; // seconds, e.g. 4.5
  stressRelief: number; // 0-100%
}

export type SquishyCategory = 
  | 'mas_apretujable'
  | 'mas_tierno'
  | 'mas_delicioso'
  | 'el_mas_raro'
  | 'todas';

export interface SquishyParticipant {
  id: string;
  name: string;
  nickname: string;
  filename: string;
  description: string;
  personality: string;
  stats: SquishyStats;
  themeColor: string;
  badgeColor: string;
  categories: SquishyCategory[];
  isActive: boolean;
  isEliminated?: boolean;
  eliminationOrder?: number;
  eliminationWeek?: number;
  eliminationReason?: string;
  totalVotesReceived: number;
  roundsWon: number;
  imageUrl?: string;
}

export type GameStatus = 'waiting' | 'in_round' | 'paused' | 'round_ended' | 'season_champion';

export type GameMode = '1v1' | 'battle_royale' | 'category';

export interface RoundHistoryEntry {
  roundNumber: number;
  mode: GameMode;
  categoryName?: string;
  fighters: string[];
  winnerId: string;
  winnerName: string;
  votes: Record<string, number>;
  totalVotes: number;
  timestamp: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  role: 'player' | 'admin';
  joinedAt: number;
  votesCast: number;
  favoriteSquishyId?: string;
  badges: string[];
}

export interface ReactionEmoji {
  id: string;
  emoji: string;
  x: number;
  y: number;
  senderName: string;
  createdAt: number;
}

export type EliminationStatus = 'upcoming' | 'open' | 'closed' | 'eliminated';

export interface EliminationState {
  weekNumber: number;
  title: string;
  nominees: string[];
  immune: string[];
  leaderId?: string | null; // ID del Squishy Líder de la Semana (e.g. 'panquesito')
  windowStart: string;
  windowEnd: string;
  status: EliminationStatus;
  eliminatedSquishyId: string | null;
  eliminatedVotes: number;
  eliminatedSquishyName?: string;
  ceremonyActive: boolean;
  eliminatedHistory?: {
    id: string;
    name: string;
    nickname: string;
    week: number;
    order: number;
    reason: string;
    votes?: number;
  }[];
  hideVotesFromPublic?: boolean;
}

export interface GameState {
  status: GameStatus;
  mode: GameMode;
  categoryName: string;
  roundNumber: number;
  activeFighters: string[]; // Squishy IDs
  votes: Record<string, number>; // squishyId -> count
  playerVotes: Record<string, { squishyId: string; timestamp: number }>; // playerId -> vote
  timeRemaining: number;
  roundDuration: number;
  isTimerRunning: boolean;
  superSquishBonus: {
    active: boolean;
    multiplier: number;
    expiresAt: number | null;
  };
  connectedPlayers: Player[];
  activeReactions: ReactionEmoji[];
  history: RoundHistoryEntry[];
  championSquishyId: string | null;
  lastWinnerId: string | null;
  customParticipants?: SquishyParticipant[];
  elimination: EliminationState;
}

export type ClientMessage =
  | { type: 'join'; payload: { id: string; name: string; avatar: string; role: 'player' | 'admin'; pin?: string } }
  | { type: 'vote'; payload: { playerId: string; squishyId: string } }
  | { type: 'reaction'; payload: { emoji: string; x: number; y: number; senderName: string } }
  | { type: 'admin_start_round'; payload: { mode: GameMode; fighters: string[]; duration: number; categoryName?: string } }
  | { type: 'admin_pause_round' }
  | { type: 'admin_resume_round' }
  | { type: 'admin_end_round' }
  | { type: 'admin_toggle_bonus'; payload: { active: boolean; multiplier: number; durationSeconds?: number } }
  | { type: 'admin_add_time'; payload: { seconds: number } }
  | { type: 'admin_declare_champion'; payload: { squishyId: string } }
  | { type: 'admin_reset_game' }
  | { type: 'admin_update_squishy'; payload: { id: string; updates: Partial<SquishyParticipant> } }
  | { type: 'admin_update_elimination'; payload: Partial<EliminationState> }
  | { type: 'admin_set_leader'; payload: { leaderId: string } }
  | { type: 'admin_trigger_elimination'; payload?: { squishyId?: string } }
  | { type: 'admin_set_elimination_status'; payload: { status: EliminationStatus } }
  | { type: 'admin_dismiss_ceremony' };

export type ServerMessage =
  | { type: 'state_sync'; payload: GameState }
  | { type: 'vote_registered'; payload: { squishyId: string; newTotal: number; playerId: string } }
  | { type: 'reaction_broadcast'; payload: ReactionEmoji }
  | { type: 'bonus_activated'; payload: { multiplier: number; durationSeconds: number } }
  | { type: 'round_started'; payload: { roundNumber: number; mode: GameMode; fighters: string[]; duration: number } }
  | { type: 'round_finished'; payload: { winnerId: string; winnerName: string; votes: Record<string, number> } }
  | { type: 'champion_crowned'; payload: { champion: SquishyParticipant } };
