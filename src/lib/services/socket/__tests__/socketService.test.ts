import { SocketService } from '../socketService';
import { MessageType, User } from '@/types';
import { expect } from '@jest/globals';

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  Manager: jest.fn().mockImplementation(() => ({
    socket: jest.fn().mockReturnValue({
      on: jest.fn(),
      emit: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      connected: false,
      removeAllListeners: jest.fn(),
    }),
    removeAllListeners: jest.fn(),
  })),
}));

describe('SocketService', () => {
  let socketService: SocketService;
  let mockSocket: any;
  let mockManager: any;
  let mockOnError: jest.Mock;
  const mockStoreHandlers = {
    setContent: jest.fn(),
    setLanguage: jest.fn(),
    setError: jest.fn(),
    resetEditor: jest.fn(),
    addUser: jest.fn(),
    removeUser: jest.fn(),
    updateCursor: jest.fn(),
    updateSelection: jest.fn(),
    resetUser: jest.fn(),
    onSessionFull: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnError = jest.fn();
    socketService = new SocketService(
      'test-session',
      'testuser',
      mockOnError,
      mockStoreHandlers
    );
  });

  const setupConnection = () => {
    socketService.connect();
    mockSocket = socketService['socket'];
    mockManager = socketService['manager'];
  };

  it('initializes socket connection', () => {
    setupConnection();
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(MessageType.ERROR, expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(MessageType.SYNC_RESPONSE, expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(MessageType.USER_JOINED, expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(MessageType.USER_LEFT, expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(MessageType.CONTENT_CHANGE, expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(MessageType.LANGUAGE_CHANGE, expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(MessageType.CURSOR_MOVE, expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith(MessageType.SELECTION_CHANGE, expect.any(Function));
  });

  it('connects to socket server', () => {
    setupConnection();
    expect(mockManager).toBeDefined();
    expect(mockSocket).toBeDefined();
  });

  it('disconnects from socket server', () => {
    setupConnection();
    
    // Simulate successful connection first
    const connectHandler = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )[1];
    connectHandler();
    
    // Set connected state
    mockSocket.connected = true;
    
    // Simulate disconnect event
    const disconnectHandler = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === 'disconnect'
    )[1];
    disconnectHandler();
    
    // Call disconnect method
    socketService.disconnect();
    
    // Verify the sequence of calls
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('sends content change message', () => {
    setupConnection();
    
    // Simulate successful connection first
    const connectHandler = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )[1];
    connectHandler();
    
    // Set connected state
    mockSocket.connected = true;
    
    const content = 'const test = "hello";';
    socketService.sendMessage(MessageType.CONTENT_CHANGE, { content });
    expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.CONTENT_CHANGE, { content });
  });

  it('sends language change message', () => {
    setupConnection();
    
    // Simulate successful connection first
    const connectHandler = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === 'connect'
    )[1];
    connectHandler();
    
    // Set connected state
    mockSocket.connected = true;
    
    const content = 'python';
    socketService.sendMessage(MessageType.LANGUAGE_CHANGE, { content });
    expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.LANGUAGE_CHANGE, { content });
  });

  it('handles sync response', () => {
    setupConnection();
    const mockHandler = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === MessageType.SYNC_RESPONSE
    )[1];

    const mockUser: User = {
      id: 1,
      username: 'testuser',
      color: '#ff0000',
      lastActive: Date.now(),
      sessionId: 'test-session',
    };

    mockHandler({
      content: 'test content',
      language: 'javascript',
      users: [mockUser],
    });

    expect(mockStoreHandlers.setContent).toHaveBeenCalledWith('test content');
    expect(mockStoreHandlers.setLanguage).toHaveBeenCalledWith('javascript');
    expect(mockStoreHandlers.addUser).toHaveBeenCalledWith(mockUser);
  });

  it('handles user joined event', () => {
    setupConnection();
    const mockHandler = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === MessageType.USER_JOINED
    )[1];

    const user: User = {
      id: 2,
      username: 'newuser',
      color: '#00ff00',
      lastActive: Date.now(),
      sessionId: 'test-session',
    };
    mockHandler({ user });
    expect(mockStoreHandlers.addUser).toHaveBeenCalledWith(user);
  });

  it('handles user left event', () => {
    setupConnection();
    const mockHandler = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === MessageType.USER_LEFT
    )[1];

    const user: User = {
      id: 2,
      username: 'newuser',
      color: '#00ff00',
      lastActive: Date.now(),
      sessionId: 'test-session',
    };
    mockHandler({ user });
    expect(mockStoreHandlers.removeUser).toHaveBeenCalledWith(user.id);
  });

  it('handles error event', () => {
    setupConnection();
    const mockHandler = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === MessageType.ERROR
    )[1];

    mockHandler({ message: 'Test error', type: 'SESSION_FULL' });
    expect(mockStoreHandlers.onSessionFull).toHaveBeenCalled();
  });

  it('handles cursor move event', () => {
    setupConnection();
    const mockHandler = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === MessageType.CURSOR_MOVE
    )[1];

    const user: User = {
      id: 2,
      username: 'newuser',
      color: '#00ff00',
      lastActive: Date.now(),
      sessionId: 'test-session',
    };
    mockHandler({
      position: { top: 100, left: 200 },
      user,
    });
    expect(mockStoreHandlers.updateCursor).toHaveBeenCalledWith({
      userId: user.id,
      username: user.username,
      color: user.color,
      position: { top: 100, left: 200 },
    });
  });

  it('handles selection change event', () => {
    setupConnection();
    const mockHandler = mockSocket.on.mock.calls.find(
      (call: any[]) => call[0] === MessageType.SELECTION_CHANGE
    )[1];

    const user: User = {
      id: 2,
      username: 'newuser',
      color: '#00ff00',
      lastActive: Date.now(),
      sessionId: 'test-session',
    };
    mockHandler({
      selection: { start: 0, end: 10 },
      user,
    });
    expect(mockStoreHandlers.updateSelection).toHaveBeenCalledWith({
      userId: user.id,
      username: user.username,
      color: user.color,
      selection: { start: 0, end: 10 },
    });
  });

  describe('Connection Management', () => {
    it('handles reconnection attempts', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'disconnect'
      )[1];

      // Simulate disconnect
      mockHandler();
      expect(socketService['isConnecting']).toBe(false);
      expect(socketService['isDisconnecting']).toBe(false);

      // Simulate reconnect
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )[1];
      connectHandler();
      expect(socketService['isConnecting']).toBe(false);
      expect(socketService['isDisconnecting']).toBe(false);
    });

    it('handles connection errors', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect_error'
      )[1];

      mockHandler(new Error('Connection error'));
      expect(mockOnError).toHaveBeenCalledWith('Connection error occurred. Error: Connection error');
    });

    it('prevents multiple simultaneous connection attempts', () => {
      socketService['isConnecting'] = true;
      socketService.connect();
      expect(socketService['manager']).toBeNull();
    });

    it('prevents connection while disconnecting', () => {
      socketService['isDisconnecting'] = true;
      socketService.connect();
      expect(socketService['manager']).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('handles invalid sync response', () => {
      setupConnection();
      
      // Simulate successful connection first
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )[1];
      connectHandler();
      
      // Set connected state and isInitialConnection
      mockSocket.connected = true;
      socketService['isInitialConnection'] = true;
      
      const mockHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === MessageType.SYNC_RESPONSE
      )[1];

      mockHandler();
      expect(mockOnError).toHaveBeenCalledWith('Invalid sync response received');
    });

    it('handles session full error', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === MessageType.ERROR
      )[1];

      mockHandler({ message: 'Session is full', type: 'SESSION_FULL' });
      expect(mockStoreHandlers.onSessionFull).toHaveBeenCalled();
    });

    it('handles duplicate username error', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === MessageType.ERROR
      )[1];

      mockHandler({ message: 'Username already taken', type: 'DUPLICATE_USERNAME' });
      expect(mockOnError).toHaveBeenCalledWith('Username is already taken. Please choose a different username.');
      expect(mockStoreHandlers.setError).toHaveBeenCalledWith('Username is already taken. Please choose a different username.');
    });

    it('handles network errors', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect_error'
      )[1];

      mockHandler(new Error('Network error'));
      expect(mockOnError).toHaveBeenCalledWith('Connection error occurred. Error: Network error');
    });
  });

  describe('State Management', () => {
    it('handles message sending state', () => {
      setupConnection();
      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )[1];
      connectHandler();
      
      // Set connected state
      mockSocket.connected = true;
      
      socketService.sendMessage(MessageType.CONTENT_CHANGE, { content: 'test' });
      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.CONTENT_CHANGE, { content: 'test' });
    });

    it('handles concurrent message sending', () => {
      setupConnection();
      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )[1];
      connectHandler();
      
      // Set connected state
      mockSocket.connected = true;
      
      // Send multiple messages in quick succession
      socketService.sendMessage(MessageType.CONTENT_CHANGE, { content: 'test1' });
      socketService.sendMessage(MessageType.LANGUAGE_CHANGE, { content: 'javascript' });
      socketService.sendMessage(MessageType.CURSOR_MOVE, { content: '{"top":100,"left":200}' });
      
      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.CONTENT_CHANGE, { content: 'test1' });
      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.LANGUAGE_CHANGE, { content: 'javascript' });
      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.CURSOR_MOVE, { content: '{"top":100,"left":200}' });
    });

    it('handles message sending during reconnection', () => {
      setupConnection();
      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )[1];
      connectHandler();
      
      // Set connected state
      mockSocket.connected = true;
      
      // Simulate disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'disconnect'
      )[1];
      disconnectHandler();
      
      // Set disconnected state
      mockSocket.connected = false;
      
      // Clear mock history before testing
      mockSocket.emit.mockClear();
      
      // Try to send message while disconnected
      socketService.sendMessage(MessageType.CONTENT_CHANGE, { content: 'test' });
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('Concurrent Operations', () => {
    it('handles concurrent content changes', () => {
      setupConnection();
      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )[1];
      connectHandler();
      
      // Set connected state
      mockSocket.connected = true;
      
      // Simulate multiple content changes
      const contentHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === MessageType.CONTENT_CHANGE
      )[1];
      
      contentHandler({ content: 'content1', user: { id: 1, username: 'user1' } });
      contentHandler({ content: 'content2', user: { id: 2, username: 'user2' } });
      contentHandler({ content: 'content3', user: { id: 3, username: 'user3' } });
      
      expect(mockStoreHandlers.setContent).toHaveBeenCalledWith('content3');
    });

    it('handles concurrent language changes', () => {
      setupConnection();
      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )[1];
      connectHandler();
      
      // Set connected state
      mockSocket.connected = true;
      
      // Simulate multiple language changes
      const languageHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === MessageType.LANGUAGE_CHANGE
      )[1];
      
      languageHandler({ language: 'javascript', user: { id: 1, username: 'user1' } });
      languageHandler({ language: 'python', user: { id: 2, username: 'user2' } });
      languageHandler({ language: 'java', user: { id: 3, username: 'user3' } });
      
      expect(mockStoreHandlers.setLanguage).toHaveBeenCalledWith('java');
    });

    it('handles concurrent cursor movements', () => {
      setupConnection();
      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )[1];
      connectHandler();
      
      // Set connected state
      mockSocket.connected = true;
      
      // Simulate multiple cursor movements
      const cursorHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === MessageType.CURSOR_MOVE
      )[1];
      
      cursorHandler({ position: { top: 100, left: 100 }, user: { id: 1, username: 'user1' } });
      cursorHandler({ position: { top: 200, left: 200 }, user: { id: 2, username: 'user2' } });
      cursorHandler({ position: { top: 300, left: 300 }, user: { id: 3, username: 'user3' } });
      
      expect(mockStoreHandlers.updateCursor).toHaveBeenCalledWith({
        userId: 3,
        username: 'user3',
        position: { top: 300, left: 300 }
      });
    });
  });

  describe('Reconnection Scenarios', () => {
    it('handles reconnection with pending messages', () => {
      setupConnection();
      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )[1];
      connectHandler();
      
      // Set connected state
      mockSocket.connected = true;
      
      // Simulate disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'disconnect'
      )[1];
      disconnectHandler();
      
      // Try to send message while disconnected
      socketService.sendMessage(MessageType.CONTENT_CHANGE, { content: 'test' });
      
      // Simulate reconnect
      connectHandler();
      
      // Verify sync request is sent after reconnection
      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.SYNC_REQUEST);
    });

    it('handles multiple reconnection attempts', () => {
      setupConnection();
      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )[1];
      connectHandler();
      
      // Set connected state
      mockSocket.connected = true;
      
      // Clear initial sync request
      mockSocket.emit.mockClear();
      
      // Simulate multiple disconnect/reconnect cycles
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'disconnect'
      )[1];
      
      disconnectHandler();
      connectHandler();
      disconnectHandler();
      connectHandler();
      
      // Verify sync request is sent after each reconnection
      expect(mockSocket.emit).toHaveBeenCalledTimes(2);
      expect(mockSocket.emit).toHaveBeenCalledWith(MessageType.SYNC_REQUEST);
    });

    it('maintains state during reconnection', () => {
      setupConnection();
      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'connect'
      )[1];
      connectHandler();
      
      // Set connected state
      mockSocket.connected = true;
      
      // Set initial state
      const syncHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === MessageType.SYNC_RESPONSE
      )[1];
      
      syncHandler({
        content: 'initial content',
        language: 'javascript',
        users: []
      });
      
      // Simulate disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === 'disconnect'
      )[1];
      disconnectHandler();
      
      // Simulate reconnect with same state
      connectHandler();
      syncHandler({
        content: 'initial content',
        language: 'javascript',
        users: []
      });
      
      // Verify state is maintained
      expect(mockStoreHandlers.setContent).toHaveBeenCalledWith('initial content');
      expect(mockStoreHandlers.setLanguage).toHaveBeenCalledWith('javascript');
    });
  });

  describe('User Management', () => {
    it('handles user join with invalid data', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === MessageType.USER_JOINED
      )[1];

      mockHandler({ invalid: 'data' });
      expect(mockStoreHandlers.addUser).not.toHaveBeenCalled();
    });

    it('handles user leave with invalid data', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === MessageType.USER_LEFT
      )[1];

      mockHandler({ invalid: 'data' });
      expect(mockStoreHandlers.removeUser).not.toHaveBeenCalled();
    });

    it('handles cursor move with invalid data', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === MessageType.CURSOR_MOVE
      )[1];

      mockHandler({ invalid: 'data' });
      expect(mockStoreHandlers.updateCursor).not.toHaveBeenCalled();
    });

    it('handles selection change with invalid data', () => {
      setupConnection();
      const mockHandler = mockSocket.on.mock.calls.find(
        (call: any[]) => call[0] === MessageType.SELECTION_CHANGE
      )[1];

      mockHandler({ invalid: 'data' });
      expect(mockStoreHandlers.updateSelection).not.toHaveBeenCalled();
    });
  });
});