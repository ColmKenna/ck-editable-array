/**
 * @file validation-enhanced.test.ts
 * @description Tests for enhanced validation rules: maxLength, pattern, type
 * TDD RED Phase: Writing failing tests first
 */

import { ValidationManager } from '../../src/components/ck-editable-array/validation-manager';
import {
  InternalRowData,
  ValidationSchema,
} from '../../src/components/ck-editable-array/types';

describe('ValidationManager - Enhanced Validation', () => {
  describe('maxLength validation', () => {
    it('should pass when string length is within maxLength', () => {
      const row: InternalRowData = { name: 'John' };
      const schema: ValidationSchema = {
        properties: {
          name: { maxLength: 10 },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(true);
      expect(result.errors.name).toBeUndefined();
    });

    it('should pass when string length equals maxLength', () => {
      const row: InternalRowData = { name: '1234567890' }; // exactly 10 chars
      const schema: ValidationSchema = {
        properties: {
          name: { maxLength: 10 },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(true);
    });

    it('should fail when string exceeds maxLength', () => {
      const row: InternalRowData = { name: 'This is too long' }; // 16 chars
      const schema: ValidationSchema = {
        properties: {
          name: { maxLength: 10 },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.name[0]).toContain('10');
    });

    it('should skip maxLength validation for non-string values', () => {
      const row: InternalRowData = { count: 12345 };
      const schema: ValidationSchema = {
        properties: {
          count: { maxLength: 3 },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(true);
    });

    it('should validate both minLength and maxLength', () => {
      const row: InternalRowData = { name: 'Hi' }; // 2 chars, minLength 3, maxLength 10
      const schema: ValidationSchema = {
        properties: {
          name: { minLength: 3, maxLength: 10 },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it('should support i18n messages for maxLength', () => {
      const row: InternalRowData = { name: 'This is too long' };
      const schema: ValidationSchema = {
        properties: {
          name: { maxLength: 10 },
        },
      };
      const i18n = {
        maxLength: (field: string, max: number) =>
          `${field} cannot exceed ${max} characters`,
      };

      const result = ValidationManager.validateRow(row, schema, i18n);
      expect(result.isValid).toBe(false);
      expect(result.errors.name[0]).toBe('name cannot exceed 10 characters');
    });
  });

  describe('pattern validation', () => {
    it('should pass when value matches pattern', () => {
      const row: InternalRowData = { email: 'test@example.com' };
      const schema: ValidationSchema = {
        properties: {
          email: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(true);
    });

    it('should fail when value does not match pattern', () => {
      const row: InternalRowData = { email: 'invalid-email' };
      const schema: ValidationSchema = {
        properties: {
          email: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBeDefined();
    });

    it('should validate phone number pattern', () => {
      const row: InternalRowData = { phone: '123-456-7890' };
      const schema: ValidationSchema = {
        properties: {
          phone: { pattern: '^\\d{3}-\\d{3}-\\d{4}$' },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(true);
    });

    it('should fail invalid phone number pattern', () => {
      const row: InternalRowData = { phone: '123456' };
      const schema: ValidationSchema = {
        properties: {
          phone: { pattern: '^\\d{3}-\\d{3}-\\d{4}$' },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(false);
    });

    it('should skip pattern validation for non-string values', () => {
      const row: InternalRowData = { code: 12345 };
      const schema: ValidationSchema = {
        properties: {
          code: { pattern: '^[A-Z]+$' },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(true);
    });

    it('should skip pattern validation for empty values (not required)', () => {
      const row: InternalRowData = { email: '' };
      const schema: ValidationSchema = {
        properties: {
          email: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
        },
      };

      // Empty string skips pattern validation (not type/pattern)
      // but minLength would still fail if set
      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(true);
    });

    it('should validate pattern for required field when empty', () => {
      const row: InternalRowData = { email: '' };
      const schema: ValidationSchema = {
        required: ['email'],
        properties: {
          email: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(false);
      // Should fail required, not pattern
      expect(result.errors.email[0]).toContain('required');
    });

    it('should support i18n messages for pattern', () => {
      const row: InternalRowData = { email: 'invalid' };
      const schema: ValidationSchema = {
        properties: {
          email: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
        },
      };
      const i18n = {
        pattern: (field: string) => `${field} has invalid format`,
      };

      const result = ValidationManager.validateRow(row, schema, i18n);
      expect(result.isValid).toBe(false);
      expect(result.errors.email[0]).toBe('email has invalid format');
    });

    it('should handle invalid regex patterns gracefully', () => {
      const row: InternalRowData = { name: 'test' };
      const schema: ValidationSchema = {
        properties: {
          name: { pattern: '[invalid(' }, // Invalid regex
        },
      };

      // Should not throw, should return valid or handle error gracefully
      expect(() => {
        ValidationManager.validateRow(row, schema);
      }).not.toThrow();
    });
  });

  describe('type validation', () => {
    it('should pass when value is of correct string type', () => {
      const row: InternalRowData = { name: 'John' };
      const schema: ValidationSchema = {
        properties: {
          name: { type: 'string' },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(true);
    });

    it('should fail when value is not of expected string type', () => {
      const row: InternalRowData = { name: 123 };
      const schema: ValidationSchema = {
        properties: {
          name: { type: 'string' },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
    });

    it('should pass when value is of correct number type', () => {
      const row: InternalRowData = { age: 25 };
      const schema: ValidationSchema = {
        properties: {
          age: { type: 'number' },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(true);
    });

    it('should fail when value is not of expected number type', () => {
      const row: InternalRowData = { age: 'twenty-five' };
      const schema: ValidationSchema = {
        properties: {
          age: { type: 'number' },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(false);
    });

    it('should pass when value is of correct boolean type', () => {
      const row: InternalRowData = { active: true };
      const schema: ValidationSchema = {
        properties: {
          active: { type: 'boolean' },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(true);
    });

    it('should fail when value is not of expected boolean type', () => {
      const row: InternalRowData = { active: 'yes' };
      const schema: ValidationSchema = {
        properties: {
          active: { type: 'boolean' },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(false);
    });

    it('should pass for integer type with integer value', () => {
      const row: InternalRowData = { count: 42 };
      const schema: ValidationSchema = {
        properties: {
          count: { type: 'integer' },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(true);
    });

    it('should fail for integer type with float value', () => {
      const row: InternalRowData = { count: 42.5 };
      const schema: ValidationSchema = {
        properties: {
          count: { type: 'integer' },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(false);
    });

    it('should skip type validation for null/undefined values (not required)', () => {
      const row: InternalRowData = { name: undefined };
      const schema: ValidationSchema = {
        properties: {
          name: { type: 'string' },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(true);
    });

    it('should support i18n messages for type', () => {
      const row: InternalRowData = { age: 'twenty' };
      const schema: ValidationSchema = {
        properties: {
          age: { type: 'number' },
        },
      };
      const i18n = {
        type: (field: string, expectedType: string) =>
          `${field} must be a ${expectedType}`,
      };

      const result = ValidationManager.validateRow(row, schema, i18n);
      expect(result.isValid).toBe(false);
      expect(result.errors.age[0]).toBe('age must be a number');
    });
  });

  describe('combined validations', () => {
    it('should validate multiple constraints on same field', () => {
      const row: InternalRowData = { email: 'ab' }; // too short, invalid pattern
      const schema: ValidationSchema = {
        properties: {
          email: {
            type: 'string',
            minLength: 5,
            maxLength: 100,
            pattern: '^[^@]+@[^@]+\\.[^@]+$',
          },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(false);
      // Should have at least one error (minLength or pattern)
      expect(result.errors.email.length).toBeGreaterThanOrEqual(1);
    });

    it('should validate multiple fields with different constraints', () => {
      const row: InternalRowData = {
        name: 'A', // minLength 2
        age: 'not a number', // type number
        email: 'invalid', // pattern
      };
      const schema: ValidationSchema = {
        properties: {
          name: { minLength: 2 },
          age: { type: 'number' },
          email: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(false);
      expect(result.errors.name).toBeDefined();
      expect(result.errors.age).toBeDefined();
      expect(result.errors.email).toBeDefined();
    });

    it('should prioritize required validation over other validations', () => {
      const row: InternalRowData = { name: '' };
      const schema: ValidationSchema = {
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            pattern: '^[A-Za-z]+$',
          },
        },
      };

      const result = ValidationManager.validateRow(row, schema);
      expect(result.isValid).toBe(false);
      // Should only show required error, not all constraint errors
      expect(result.errors.name.length).toBe(1);
      expect(result.errors.name[0]).toContain('required');
    });
  });
});
