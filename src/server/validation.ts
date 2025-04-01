import { MessageType } from '@/types';

interface ValidationError {
  message: string;
  type: 'VALIDATION_ERROR';
}

export class ValidationService {
  private static readonly MAX_USERNAME_LENGTH = 30;
  private static readonly MIN_USERNAME_LENGTH = 3;
  private static readonly USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;
  private static readonly MAX_CONTENT_LENGTH = 1000000; // 1MB
  private static readonly MAX_SESSION_ID_LENGTH = 50;
  private static readonly SESSION_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

  static validateSessionId(sessionId: string): ValidationError | null {
    if (!sessionId || typeof sessionId !== 'string') {
      return {
        message: 'Invalid session ID',
        type: 'VALIDATION_ERROR',
      };
    }

    if (sessionId.length > this.MAX_SESSION_ID_LENGTH) {
      return {
        message: `Session ID must be less than ${this.MAX_SESSION_ID_LENGTH} characters`,
        type: 'VALIDATION_ERROR',
      };
    }

    if (!this.SESSION_ID_PATTERN.test(sessionId)) {
      return {
        message: 'Session ID can only contain letters, numbers, underscores, and hyphens',
        type: 'VALIDATION_ERROR',
      };
    }

    return null;
  }

  static validateUsername(username: string): ValidationError | null {
    if (!username || typeof username !== 'string') {
      return {
        message: 'Username is required',
        type: 'VALIDATION_ERROR',
      };
    }

    if (username.length < this.MIN_USERNAME_LENGTH) {
      return {
        message: `Username must be at least ${this.MIN_USERNAME_LENGTH} characters long`,
        type: 'VALIDATION_ERROR',
      };
    }

    if (username.length > this.MAX_USERNAME_LENGTH) {
      return {
        message: `Username must be less than ${this.MAX_USERNAME_LENGTH} characters`,
        type: 'VALIDATION_ERROR',
      };
    }

    if (!this.USERNAME_PATTERN.test(username)) {
      return {
        message: 'Username can only contain letters, numbers, underscores, and hyphens',
        type: 'VALIDATION_ERROR',
      };
    }

    return null;
  }

  static validateContent(content: string): ValidationError | null {
    if (typeof content !== 'string') {
      return {
        message: 'Content must be a string',
        type: 'VALIDATION_ERROR',
      };
    }

    if (content.length > this.MAX_CONTENT_LENGTH) {
      return {
        message: `Content must be less than ${this.MAX_CONTENT_LENGTH} characters`,
        type: 'VALIDATION_ERROR',
      };
    }

    return null;
  }

  static validateLanguage(language: string): ValidationError | null {
    if (!language || typeof language !== 'string') {
      return {
        message: 'Language is required',
        type: 'VALIDATION_ERROR',
      };
    }

    // Add a list of supported languages if needed
    const supportedLanguages = [
      'javascript',
      'typescript',
      'python',
      'java',
      'cpp',
      'csharp',
      'go',
      'rust',
    ];
    if (!supportedLanguages.includes(language.toLowerCase())) {
      return {
        message: 'Unsupported programming language',
        type: 'VALIDATION_ERROR',
      };
    }

    return null;
  }

  static validatePosition(position: { top: number; left: number }): ValidationError | null {
    if (!position || typeof position !== 'object') {
      return {
        message: 'Position must be an object',
        type: 'VALIDATION_ERROR',
      };
    }

    if (typeof position.top !== 'number' || typeof position.left !== 'number') {
      return {
        message: 'Position coordinates must be numbers',
        type: 'VALIDATION_ERROR',
      };
    }

    if (position.top < 0 || position.left < 0) {
      return {
        message: 'Position coordinates cannot be negative',
        type: 'VALIDATION_ERROR',
      };
    }

    return null;
  }

  static validateSelection(selection: { start: number; end: number }): ValidationError | null {
    if (!selection || typeof selection !== 'object') {
      return {
        message: 'Selection must be an object',
        type: 'VALIDATION_ERROR',
      };
    }

    if (typeof selection.start !== 'number' || typeof selection.end !== 'number') {
      return {
        message: 'Selection bounds must be numbers',
        type: 'VALIDATION_ERROR',
      };
    }

    if (selection.start < 0 || selection.end < 0) {
      return {
        message: 'Selection bounds cannot be negative',
        type: 'VALIDATION_ERROR',
      };
    }

    if (selection.start > selection.end) {
      return {
        message: 'Selection start cannot be greater than end',
        type: 'VALIDATION_ERROR',
      };
    }

    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static validateEventPayload(type: MessageType, payload: any): ValidationError | null {
    switch (type) {
      case MessageType.JOIN:
        return this.validateUsername(payload.username);
      case MessageType.CONTENT_CHANGE:
        return this.validateContent(payload.content);
      case MessageType.LANGUAGE_CHANGE:
        return this.validateLanguage(payload.language);
      case MessageType.CURSOR_MOVE:
        return this.validatePosition(payload.position);
      case MessageType.SELECTION_CHANGE:
        return this.validateSelection(payload.selection);
      default:
        return null;
    }
  }
}
