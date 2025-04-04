import { Manager } from 'socket.io-client';
import { MessageType } from '@/types';
import type {
  SocketPayloads,
  SocketEvents,
  StoreHandlers,
  SocketConnectionState,
  SocketError,
  ErrorRecoveryOptions,
  SocketErrorType,
} from './types';
import { NotificationService } from '../notification/notificationService';

const DEFAULT_ERROR_RECOVERY_OPTIONS: ErrorRecoveryOptions = {
  maxRetries: 5,
  retryDelay: 1000,
  backoffFactor: 2,
  maxRetryDelay: 5000,
};

export class SocketService {
  private socket: ReturnType<typeof Manager.prototype.socket> | null = null;
  private manager: ReturnType<typeof Manager> | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionState: SocketConnectionState = {
    reconnectAttempts: 0,
    maxReconnectAttempts: DEFAULT_ERROR_RECOVERY_OPTIONS.maxRetries,
    isInitialConnection: true,
    isConnecting: false,
    isDisconnecting: false,
  };

  constructor(
    private sessionId: string,
    private username: string,
    private onError: (message: string) => void,
    private storeHandlers: StoreHandlers,
    private errorRecoveryOptions: ErrorRecoveryOptions = DEFAULT_ERROR_RECOVERY_OPTIONS,
  ) {}

  connect(): void {
    if (
      this.socket?.connected ||
      this.connectionState.isConnecting ||
      this.connectionState.isDisconnecting
    ) {
      console.log('Socket already connected, connecting, or disconnecting, skipping connect');
      return;
    }

    this.connectionState.isConnecting = true;
    console.log('Attempting to connect socket...');

    try {
      this.manager = new Manager({
        path: '/api/ws',
        query: { sessionId: this.sessionId },
        reconnection: false,
        timeout: 20000,
      });

      this.socket = this.manager.socket('/');
      this.setupEventListeners();
    } catch (error) {
      console.error('Error creating socket connection:', error);
      this.handleConnectionError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    const events: SocketEvents = {
      [MessageType.JOIN]: this.handleJoin.bind(this),
      [MessageType.LEAVE]: this.handleLeave.bind(this),
      [MessageType.CONTENT_CHANGE]: this.handleContentChange.bind(this),
      [MessageType.LANGUAGE_CHANGE]: this.handleLanguageChange.bind(this),
      [MessageType.USER_JOINED]: this.handleUserJoined.bind(this),
      [MessageType.USER_LEFT]: this.handleUserLeft.bind(this),
      [MessageType.CURSOR_MOVE]: this.handleCursorMove.bind(this),
      [MessageType.SELECTION_CHANGE]: this.handleSelectionChange.bind(this),
      [MessageType.ERROR]: this.handleError.bind(this),
      [MessageType.UNDO_REDO_STACK]: this.handleUndoRedoStack.bind(this),
      [MessageType.UNDO]: this.handleUndo.bind(this),
      [MessageType.REDO]: this.handleRedo.bind(this),
      [MessageType.SYNC_RESPONSE]: this.handleSyncResponse.bind(this),
      [MessageType.SYNC_REQUEST]: this.handleSyncRequest.bind(this),
    };

    this.socket.on('connect', this.handleConnect.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('connect_error', this.handleConnectError.bind(this));

    Object.entries(events).forEach(([event, handler]) => {
      this.socket?.on(event, handler);
    });
  }

  disconnect(): void {
    if (this.connectionState.isDisconnecting) {
      console.log('Already disconnecting, skipping');
      return;
    }

    this.connectionState.isDisconnecting = true;
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
      this.manager.removeAllListeners();
      this.manager = null;
    }

    this.connectionState = {
      ...this.connectionState,
      reconnectAttempts: 0,
      isConnecting: false,
      isDisconnecting: false,
    };
  }

  sendMessage<T extends MessageType>(type: T, payload: SocketPayloads[T]): void {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, message not sent');
      return;
    }
    this.socket.emit(type, payload);
  }

  private handleConnect(): void {
    this.connectionState.isConnecting = false;
    this.connectionState.reconnectAttempts = 0;
    this.connectionState.lastSuccessfulConnection = new Date();
    this.connectionState.lastError = undefined;

    if (this.connectionState.isInitialConnection) {
      this.socket?.emit(MessageType.JOIN, { username: this.username });
      this.connectionState.isInitialConnection = false;
    } else {
      this.socket?.emit(MessageType.SYNC_REQUEST);
    }
  }

  private handleDisconnect(): void {
    this.connectionState.isConnecting = false;

    if (
      !this.connectionState.isDisconnecting &&
      this.connectionState.reconnectAttempts < this.connectionState.maxReconnectAttempts
    ) {
      const delay = Math.min(1000 * Math.pow(2, this.connectionState.reconnectAttempts), 5000);

      this.reconnectTimeout = setTimeout(() => {
        this.connectionState.reconnectAttempts++;
        this.connect();
      }, delay);
    } else if (!this.connectionState.isDisconnecting) {
      this.onError('Failed to connect to server. Please refresh the page.');
      this.disconnect();
    }
  }

  private handleConnectError(error: Error): void {
    console.error('Socket.IO connection error:', error);
    this.handleConnectionError(error);
  }

  private handleConnectionError(error: Error): void {
    const socketError: SocketError = {
      type: 'CONNECTION_ERROR',
      message: error.message,
      details: error,
    };

    this.connectionState.lastError = socketError;
    this.connectionState.isConnecting = false;

    console.error('Socket connection error:', {
      error: socketError,
      connectionState: this.connectionState,
      timestamp: new Date().toISOString(),
    });

    this.onError(`Connection error: ${error.message}`);
    this.attemptErrorRecovery();
  }

  private attemptErrorRecovery(): void {
    if (this.connectionState.reconnectAttempts >= this.errorRecoveryOptions.maxRetries) {
      this.handleMaxRetriesExceeded();
      return;
    }

    const delay = this.calculateRetryDelay();
    console.log(
      `Attempting recovery in ${delay}ms (attempt ${this.connectionState.reconnectAttempts + 1}/${this.errorRecoveryOptions.maxRetries})`,
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connectionState.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private calculateRetryDelay(): number {
    const { retryDelay, backoffFactor, maxRetryDelay } = this.errorRecoveryOptions;
    const delay = Math.min(
      retryDelay * Math.pow(backoffFactor, this.connectionState.reconnectAttempts),
      maxRetryDelay,
    );
    return delay;
  }

  private handleMaxRetriesExceeded(): void {
    const error: SocketError = {
      type: 'CONNECTION_ERROR',
      message: 'Maximum reconnection attempts exceeded',
      details: this.connectionState.lastError,
    };

    console.error('Max retries exceeded:', {
      error,
      connectionState: this.connectionState,
      timestamp: new Date().toISOString(),
    });

    this.onError(
      'Failed to establish connection after multiple attempts. Please refresh the page.',
    );
    this.disconnect();
  }

  private handleError(payload: SocketPayloads[MessageType.ERROR]): void {
    const error: SocketError = {
      type: payload.type as SocketErrorType,
      message: payload.message,
      details: payload,
    };

    this.connectionState.lastError = error;

    console.error('Socket error received:', {
      error,
      connectionState: this.connectionState,
      timestamp: new Date().toISOString(),
    });

    switch (payload.type) {
      case 'SESSION_FULL':
        this.storeHandlers.onSessionFull();
        break;
      case 'DUPLICATE_USERNAME':
        this.onError('Username is already taken. Please choose a different username.');
        this.storeHandlers.setError(
          'Username is already taken. Please choose a different username.',
        );
        break;
      case 'SYNC_ERROR':
        this.handleSyncError();
        break;
      case 'INVALID_PAYLOAD':
        this.handleInvalidPayloadError();
        break;
      default:
        this.onError(payload.message);
        this.storeHandlers.setError(payload.message);
    }
  }

  private handleSyncError(): void {
    console.warn('Sync error occurred, requesting full sync');
    this.socket?.emit(MessageType.SYNC_REQUEST);
  }

  private handleInvalidPayloadError(): void {
    console.warn('Invalid payload received, requesting state refresh');
    this.socket?.emit(MessageType.SYNC_REQUEST);
  }

  private handleSyncResponse(payload: SocketPayloads[MessageType.SYNC_RESPONSE]): void {
    if (!payload) {
      this.onError('Invalid sync response received');
      return;
    }

    if (this.connectionState.isInitialConnection) {
      this.storeHandlers.resetEditor();
      this.storeHandlers.resetUser();
      this.connectionState.isInitialConnection = false;
    }

    if (typeof payload.content === 'string') {
      this.storeHandlers.setContent(payload.content);
    }
    if (typeof payload.language === 'string') {
      this.storeHandlers.setLanguage(payload.language);
    }

    if (Array.isArray(payload.users)) {
      payload.users.forEach((user) => {
        if (user && typeof user.id === 'number' && typeof user.username === 'string') {
          this.storeHandlers.addUser(user);
        }
      });
    }
  }

  private handleUserJoined(payload: SocketPayloads[MessageType.USER_JOINED]): void {
    if (payload?.user) {
      this.storeHandlers.addUser(payload.user);
      NotificationService.showUserJoined(payload.user.username);
    }
  }

  private handleUserLeft(payload: SocketPayloads[MessageType.USER_LEFT]): void {
    if (payload?.user?.id) {
      this.storeHandlers.removeUser(payload.user.id);
      NotificationService.showUserLeft(payload.user.username);
    }
  }

  private handleContentChange(payload: SocketPayloads[MessageType.CONTENT_CHANGE]): void {
    if (payload?.content) {
      this.storeHandlers.setContent(payload.content);
    }
  }

  private handleLanguageChange(payload: SocketPayloads[MessageType.LANGUAGE_CHANGE]): void {
    if (payload?.language) {
      this.storeHandlers.setLanguage(payload.language);
    }
  }

  private handleCursorMove(payload: SocketPayloads[MessageType.CURSOR_MOVE]): void {
    if (payload?.position && payload?.user) {
      this.storeHandlers.updateCursor({
        userId: payload.user.id,
        username: payload.user.username,
        color: payload.user.color,
        position: payload.position,
      });
    }
  }

  private handleSelectionChange(payload: SocketPayloads[MessageType.SELECTION_CHANGE]): void {
    if (payload?.selection && payload?.user) {
      this.storeHandlers.updateSelection({
        userId: payload.user.id,
        username: payload.user.username,
        color: payload.user.color,
        selection: payload.selection,
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private handleJoin(payload: SocketPayloads[MessageType.JOIN]): void {
    // Implementation for join event
  }

  private handleLeave(): void {
    // Implementation for leave event
  }

  private handleUndoRedoStack(): void {
    // Implementation for undo/redo stack event
  }

  private handleUndo(): void {
    // Implementation for undo event
  }

  private handleRedo(): void {
    // Implementation for redo event
  }

  private handleSyncRequest(): void {
    // Implementation for sync request event
  }
}
