import { ValidationService } from '../validation';
import { MessageType } from '@/types';

describe('ValidationService', () => {
  describe('validateSessionId', () => {
    it('should accept valid session IDs', () => {
      const validIds = ['abc123', 'test-session', 'user_123', 'project-456'];
      validIds.forEach((id) => {
        const result = ValidationService.validateSessionId(id);
        expect(result).toBeNull();
      });
    });

    it('should reject invalid session IDs', () => {
      const invalidIds = ['', null, undefined, 'a', 'test@session', 'test session'];
      invalidIds.forEach((id) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = ValidationService.validateSessionId(id as any);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('validateUsername', () => {
    it('should accept valid usernames', () => {
      const validUsernames = ['john_doe', 'user123', 'test-user', 'dev_123'];
      validUsernames.forEach((username) => {
        const result = ValidationService.validateUsername(username);
        expect(result).toBeNull();
      });
    });

    it('should reject invalid usernames', () => {
      const invalidUsernames = [
        '', // empty
        'ab', // too short
        'a'.repeat(31), // too long
        'test@user', // invalid characters
        'test user', // spaces
        null,
        undefined,
      ];
      invalidUsernames.forEach((username) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = ValidationService.validateUsername(username as any);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('validateContent', () => {
    it('should accept valid content', () => {
      const validContent = ['', 'test content', 'a'.repeat(1000000)];
      validContent.forEach((content) => {
        const result = ValidationService.validateContent(content);
        expect(result).toBeNull();
      });
    });

    it('should reject invalid content', () => {
      const invalidContent = [
        null,
        undefined,
        'a'.repeat(1000001), // too long
      ];
      invalidContent.forEach((content) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = ValidationService.validateContent(content as any);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('validateLanguage', () => {
    it('should accept valid languages', () => {
      const validLanguages = [
        'javascript',
        'typescript',
        'python',
        'java',
        'cpp',
        'csharp',
        'go',
        'rust',
      ];
      validLanguages.forEach((language) => {
        const result = ValidationService.validateLanguage(language);
        expect(result).toBeNull();
      });
    });

    it('should reject invalid languages', () => {
      const invalidLanguages = ['', null, undefined, 'invalid', 'php', 'ruby'];
      invalidLanguages.forEach((language) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = ValidationService.validateLanguage(language as any);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('validatePosition', () => {
    it('should accept valid positions', () => {
      const validPositions = [
        { top: 0, left: 0 },
        { top: 100, left: 200 },
        { top: 999999, left: 999999 },
      ];
      validPositions.forEach((position) => {
        const result = ValidationService.validatePosition(position);
        expect(result).toBeNull();
      });
    });

    it('should reject invalid positions', () => {
      const invalidPositions = [
        null,
        undefined,
        { top: -1, left: 0 },
        { top: 0, left: -1 },
        { top: '100', left: 200 },
        { top: 100, left: '200' },
      ];
      invalidPositions.forEach((position) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = ValidationService.validatePosition(position as any);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('validateSelection', () => {
    it('should accept valid selections', () => {
      const validSelections = [
        { start: 0, end: 0 },
        { start: 0, end: 10 },
        { start: 100, end: 200 },
      ];
      validSelections.forEach((selection) => {
        const result = ValidationService.validateSelection(selection);
        expect(result).toBeNull();
      });
    });

    it('should reject invalid selections', () => {
      const invalidSelections = [
        null,
        undefined,
        { start: -1, end: 0 },
        { start: 0, end: -1 },
        { start: 10, end: 5 }, // start > end
        { start: '0', end: 10 },
        { start: 0, end: '10' },
      ];
      invalidSelections.forEach((selection) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = ValidationService.validateSelection(selection as any);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('validateEventPayload', () => {
    it('should validate JOIN event payload', () => {
      const validPayload = { username: 'testuser' };
      const invalidPayload = { username: 'a' }; // too short

      const validResult = ValidationService.validateEventPayload(MessageType.JOIN, validPayload);
      const invalidResult = ValidationService.validateEventPayload(
        MessageType.JOIN,
        invalidPayload,
      );

      expect(validResult).toBeNull();
      expect(invalidResult).not.toBeNull();
      expect(invalidResult?.type).toBe('VALIDATION_ERROR');
    });

    it('should validate CONTENT_CHANGE event payload', () => {
      const validPayload = { content: 'test content' };
      const invalidPayload = { content: 'a'.repeat(1000001) }; // too long

      const validResult = ValidationService.validateEventPayload(
        MessageType.CONTENT_CHANGE,
        validPayload,
      );
      const invalidResult = ValidationService.validateEventPayload(
        MessageType.CONTENT_CHANGE,
        invalidPayload,
      );

      expect(validResult).toBeNull();
      expect(invalidResult).not.toBeNull();
      expect(invalidResult?.type).toBe('VALIDATION_ERROR');
    });

    it('should validate LANGUAGE_CHANGE event payload', () => {
      const validPayload = { language: 'javascript' };
      const invalidPayload = { language: 'invalid' };

      const validResult = ValidationService.validateEventPayload(
        MessageType.LANGUAGE_CHANGE,
        validPayload,
      );
      const invalidResult = ValidationService.validateEventPayload(
        MessageType.LANGUAGE_CHANGE,
        invalidPayload,
      );

      expect(validResult).toBeNull();
      expect(invalidResult).not.toBeNull();
      expect(invalidResult?.type).toBe('VALIDATION_ERROR');
    });

    it('should validate CURSOR_MOVE event payload', () => {
      const validPayload = { position: { top: 100, left: 200 } };
      const invalidPayload = { position: { top: -1, left: 0 } };

      const validResult = ValidationService.validateEventPayload(
        MessageType.CURSOR_MOVE,
        validPayload,
      );
      const invalidResult = ValidationService.validateEventPayload(
        MessageType.CURSOR_MOVE,
        invalidPayload,
      );

      expect(validResult).toBeNull();
      expect(invalidResult).not.toBeNull();
      expect(invalidResult?.type).toBe('VALIDATION_ERROR');
    });

    it('should validate SELECTION_CHANGE event payload', () => {
      const validPayload = { selection: { start: 0, end: 10 } };
      const invalidPayload = { selection: { start: 10, end: 5 } }; // start > end

      const validResult = ValidationService.validateEventPayload(
        MessageType.SELECTION_CHANGE,
        validPayload,
      );
      const invalidResult = ValidationService.validateEventPayload(
        MessageType.SELECTION_CHANGE,
        invalidPayload,
      );

      expect(validResult).toBeNull();
      expect(invalidResult).not.toBeNull();
      expect(invalidResult?.type).toBe('VALIDATION_ERROR');
    });
  });
});
