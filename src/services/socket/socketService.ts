import { Manager } from 'socket.io-client';
import { MessageType, User, UserCursor, UserSelection } from '@/types';

interface StoreHandlers {
  setContent: (content: string) => void;
  setLanguage: (language: string) => void;
  setError: (error: string) => void;
  resetEditor: () => void;
  addUser: (user: User) => void;
  removeUser: (userId: number) => void;
  updateCursor: (cursor: UserCursor) => void;
  updateSelection: (selection: UserSelection) => void;
  resetUser: () => void;
  onSessionFull: () => void;
}

export class SocketService {
  private socket: ReturnType<typeof Manager.prototype.socket> | null = null;
  private manager: ReturnType<typeof Manager> | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private isInitialConnection = true;
  private isConnecting = false;
  private isDisconnecting = false;

  constructor(
    private sessionId: string,
    private username: string,
    private onError: (message: string) => void,
    private storeHandlers: StoreHandlers
  ) {}

  connect() {
    if (this.socket?.connected || this.isConnecting || this.isDisconnecting) {
      console.log('Socket already connected, connecting, or disconnecting, skipping connect');
      return;
    }

    this.isConnecting = true;
    console.log('Attempting to connect socket...');

    try {
      // Create new manager instance
      this.manager = new Manager({
        path: '/api/ws',
        query: { sessionId: this.sessionId },
        reconnection: false, // We'll handle reconnection manually
        timeout: 20000,
      });

      // Create new socket instance
      this.socket = this.manager.socket('/');

      // Set up event listeners
      this.setupEventListeners();
    } catch (error) {
      console.error('Error creating socket connection:', error);
      this.handleConnectionError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', this.handleConnect.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('connect_error', this.handleConnectError.bind(this));
    this.socket.on(MessageType.ERROR, this.handleError.bind(this));
    this.socket.on(MessageType.SYNC_RESPONSE, this.handleSyncResponse.bind(this));
    this.socket.on(MessageType.USER_JOINED, this.handleUserJoined.bind(this));
    this.socket.on(MessageType.USER_LEFT, this.handleUserLeft.bind(this));
    this.socket.on(MessageType.CONTENT_CHANGE, this.handleContentChange.bind(this));
    this.socket.on(MessageType.LANGUAGE_CHANGE, this.handleLanguageChange.bind(this));
    this.socket.on(MessageType.CURSOR_MOVE, this.handleCursorMove.bind(this));
    this.socket.on(MessageType.SELECTION_CHANGE, this.handleSelectionChange.bind(this));
  }

  disconnect() {
    if (this.isDisconnecting) {
      console.log('Already disconnecting, skipping');
      return;
    }

    this.isDisconnecting = true;
    console.log('Disconnecting socket...');

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.manager) {
      // Remove all listeners from the manager
      this.manager.removeAllListeners();
      this.manager = null;
    }

    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.isDisconnecting = false;
  }

  sendMessage(type: MessageType, payload: any) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, message not sent');
      return;
    }
    this.socket.emit(type, payload);
  }

  private handleConnect() {
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    if (this.isInitialConnection) {
      this.socket?.emit(MessageType.JOIN, { username: this.username });
      this.isInitialConnection = false;
    } else {
      this.socket?.emit(MessageType.SYNC_REQUEST);
    }
  }

  private handleDisconnect() {
    this.isConnecting = false;

    if (!this.isDisconnecting && this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 5000);

      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    } else if (!this.isDisconnecting) {
      this.onError('Failed to connect to server. Please refresh the page.');
      this.disconnect();
    }
  }

  private handleConnectError(error: Error) {
    console.error('Socket.IO connection error:', error);
    this.handleConnectionError(error);
  }

  private handleConnectionError(error: Error) {
    this.isConnecting = false;
    this.onError('Connection error occurred');
    this.disconnect();
  }

  private handleError(payload: { message: string; type?: string }) {
    if (payload.type === 'SESSION_FULL') {
      this.storeHandlers.onSessionFull();
    } else {
      this.onError(payload.message);
      this.storeHandlers.setError(payload.message);
    }
  }

  private handleSyncResponse(payload: { content: string; language: string; users: User[] }) {
    if (!payload) {
      this.onError('Invalid sync response received');
      return;
    }

    if (this.isInitialConnection) {
      this.storeHandlers.resetEditor();
      this.storeHandlers.resetUser();
      this.isInitialConnection = false;
    }

    if (typeof payload.content === 'string') {
      this.storeHandlers.setContent(payload.content);
    }
    if (typeof payload.language === 'string') {
      this.storeHandlers.setLanguage(payload.language);
    }

    if (Array.isArray(payload.users)) {
      payload.users.forEach(user => {
        if (user && typeof user.id === 'number' && typeof user.username === 'string') {
          this.storeHandlers.addUser(user);
        }
      });
    }
  }

  private handleUserJoined(payload: { user: User }) {
    if (payload?.user) {
      this.storeHandlers.addUser(payload.user);
    }
  }

  private handleUserLeft(payload: { user: User }) {
    if (payload?.user?.id) {
      this.storeHandlers.removeUser(payload.user.id);
    }
  }

  private handleContentChange(payload: { content: string; user: User }) {
    if (payload?.content) {
      this.storeHandlers.setContent(payload.content);
    }
  }

  private handleLanguageChange(payload: { language: string; user: User }) {
    if (payload?.language) {
      this.storeHandlers.setLanguage(payload.language);
    }
  }

  private handleCursorMove(payload: { position: { top: number; left: number }; user: User }) {
    if (payload?.position && payload?.user) {
      this.storeHandlers.updateCursor({
        userId: payload.user.id,
        username: payload.user.username,
        color: payload.user.color,
        position: payload.position,
      });
    }
  }

  private handleSelectionChange(payload: {
    selection: { start: number; end: number };
    user: User;
  }) {
    if (payload?.selection && payload?.user) {
      this.storeHandlers.updateSelection({
        userId: payload.user.id,
        username: payload.user.username,
        color: payload.user.color,
        selection: payload.selection,
      });
    }
  }
}
