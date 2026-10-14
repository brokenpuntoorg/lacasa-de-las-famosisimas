import { GameState, ClientMessage, ServerMessage, ReactionEmoji } from '../types';

type StateListener = (state: GameState) => void;
type ReactionListener = (reaction: ReactionEmoji) => void;

interface BroadcastPayload {
  source: string;
  type: 'state_sync' | 'reaction_broadcast' | 'client_action';
  payload: any;
  timestamp: number;
}

const STORAGE_STATE_KEY = 'squishy_battle_state_v6';
const BROADCAST_CHANNEL_NAME = 'squishy_battle_sync';

class SocketService {
  private ws: WebSocket | null = null;
  private stateListeners: Set<StateListener> = new Set();
  private reactionListeners: Set<ReactionListener> = new Set();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  public isConnected: boolean = false;
  private reconnectAttempts = 0;
  private currentPlayerData: { id: string; name: string; avatar: string; role: 'player' | 'admin'; pin?: string } | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private instanceId: string = Math.random().toString(36).substring(2, 9);
  private lastKnownState: GameState | null = null;

  constructor() {
    this.initCrossTabSync();
  }

  /**
   * Inicializa BroadcastChannel y LocalStorage para sincronización instantánea
   * entre múltiples pestañas del navegador (ej. Pestaña 1: Jugador / Pestaña 2: Admin).
   */
  private initCrossTabSync() {
    if (typeof window === 'undefined') return;

    // 1. Cargar último estado conocido de localStorage para evitar parpadeos
    try {
      const cached = localStorage.getItem(STORAGE_STATE_KEY);
      if (cached) {
        this.lastKnownState = JSON.parse(cached);
      }
    } catch {
      // Ignorar errores de parseo
    }

    // 2. BroadcastChannel
    if ('BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event: MessageEvent<BroadcastPayload>) => {
          const data = event.data;
          if (!data || data.source === this.instanceId) return;

          if (data.type === 'state_sync' && data.payload) {
            this.lastKnownState = data.payload;
            this.stateListeners.forEach((fn) => fn(data.payload));
          } else if (data.type === 'reaction_broadcast' && data.payload) {
            this.reactionListeners.forEach((fn) => fn(data.payload));
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel no disponible:', err);
      }
    }

    // 3. Fallback con evento 'storage' de Window
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_STATE_KEY && event.newValue) {
        try {
          const parsed: GameState = JSON.parse(event.newValue);
          this.lastKnownState = parsed;
          this.stateListeners.forEach((fn) => fn(parsed));
        } catch {
          // silent catch
        }
      }
    });
  }

  private broadcastToTabs(type: 'state_sync' | 'reaction_broadcast', payload: any) {
    if (typeof window === 'undefined') return;

    // Guardar en localStorage
    if (type === 'state_sync') {
      try {
        localStorage.setItem(STORAGE_STATE_KEY, JSON.stringify(payload));
      } catch {
        // Cuota excedida o almacenamiento privado
      }
    }

    // Transmitir vía BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          source: this.instanceId,
          type,
          payload,
          timestamp: Date.now(),
        });
      } catch {
        // Ignorar
      }
    }
  }

  public connect(playerData?: { id: string; name: string; avatar: string; role: 'player' | 'admin'; pin?: string }) {
    if (playerData) {
      this.currentPlayerData = playerData;
    }

    // Inmediatamente obtener el estado inicial por HTTP para que la pantalla cargue al instante en móviles
    fetch('/api/state')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.gameState) {
          this.handleServerMessage({ type: 'state_sync', payload: data.gameState });
        }
      })
      .catch(() => {});

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (this.currentPlayerData) {
        this.send({ type: 'join', payload: this.currentPlayerData });
      }
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host || 'localhost:3000';
    const wsUrl = `${protocol}//${host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.stopPollingFallback();
        if (this.currentPlayerData) {
          this.send({ type: 'join', payload: this.currentPlayerData });
        }
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);
          this.handleServerMessage(msg);
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.stopHeartbeat();
        this.scheduleReconnect();
        this.startPollingFallback();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
        this.startPollingFallback();
      };
    } catch {
      this.scheduleReconnect();
      this.startPollingFallback();
    }
  }

  private startPollingFallback() {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(async () => {
      if (this.isConnected) {
        this.stopPollingFallback();
        return;
      }
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = await res.json();
          if (data && data.gameState) {
            this.handleServerMessage({ type: 'state_sync', payload: data.gameState });
          }
        }
      } catch {
        // Fallback silencioso
      }
    }, 2000);
  }

  private stopPollingFallback() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 8000);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public send(msg: ClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      // Fallback via REST API
      fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.gameState) {
            this.handleServerMessage({ type: 'state_sync', payload: data.gameState });
          }
        })
        .catch(() => {
          // silent catch
        });
    }
  }

  public subscribeState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    // Disparar inmediatamente con el último estado conocido en caché si existe
    if (this.lastKnownState) {
      listener(this.lastKnownState);
    }
    return () => this.stateListeners.delete(listener);
  }

  public subscribeReaction(listener: ReactionListener): () => void {
    this.reactionListeners.add(listener);
    return () => this.reactionListeners.delete(listener);
  }

  private handleServerMessage(msg: ServerMessage) {
    switch (msg.type) {
      case 'state_sync':
        this.lastKnownState = msg.payload;
        this.broadcastToTabs('state_sync', msg.payload);
        this.stateListeners.forEach((fn) => fn(msg.payload));
        break;
      case 'reaction_broadcast':
        this.broadcastToTabs('reaction_broadcast', msg.payload);
        this.reactionListeners.forEach((fn) => fn(msg.payload));
        break;
      default:
        break;
    }
  }

  public disconnect() {
    this.stopHeartbeat();
    this.stopPollingFallback();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const socketService = new SocketService();
