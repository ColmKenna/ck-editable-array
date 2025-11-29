import {
  InternalRowData,
  ValidationSchema,
  ValidationResult,
  I18nMessages,
} from './types';

export class ValidationManager {
  /**
   * Validate a row and return detailed error information
   */
  static validateRow(
    row: InternalRowData,
    schema: ValidationSchema | null,
    i18n?: I18nMessages
  ): ValidationResult {
    const errors: Record<string, string[]> = {};

    // If no schema is set, consider the row valid
    if (!schema || typeof schema !== 'object') {
      return { isValid: true, errors };
    }

    // Validate required fields
    const requiredErrors = this.validateRequiredFields(row, schema, i18n);
    Object.assign(errors, requiredErrors);

    // Validate property constraints (skip fields with required errors)
    const propertyErrors = this.validatePropertyConstraints(
      row,
      schema,
      requiredErrors,
      i18n
    );
    Object.assign(errors, propertyErrors);

    return { isValid: Object.keys(errors).length === 0, errors };
  }

  /**
   * Check if a field value is empty
   */
  private static isFieldEmpty(value: unknown): boolean {
    return (
      value === undefined ||
      value === null ||
      value === '' ||
      (typeof value === 'string' && value.trim() === '')
    );
  }

  /**
   * Validate required fields against schema
   */
  private static validateRequiredFields(
    row: InternalRowData,
    schema: ValidationSchema,
    i18n?: I18nMessages
  ): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    if (Array.isArray(schema.required)) {
      for (const field of schema.required) {
        const value = row[field];
        if (this.isFieldEmpty(value)) {
          if (!errors[field]) {
            errors[field] = [];
          }
          errors[field].push(
            this.formatValidationError(field, 'required', value, i18n)
          );
        }
      }
    }

    return errors;
  }

  /**
   * Validate property constraints against schema
   */
  private static validatePropertyConstraints(
    row: InternalRowData,
    schema: ValidationSchema,
    requiredErrors: Record<string, string[]>,
    i18n?: I18nMessages
  ): Record<string, string[]> {
    const errors: Record<string, string[]> = {};

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (propSchema) {
          const value = row[key];

          // Skip property validation if field already has a required error
          if (requiredErrors[key]) {
            continue;
          }

          const isEmpty = this.isFieldEmpty(value);

          // Check type constraint (skip for empty optional fields)
          if (propSchema.type && !isEmpty) {
            const typeError = this.validateType(
              value,
              propSchema.type,
              key,
              i18n
            );
            if (typeError) {
              if (!errors[key]) {
                errors[key] = [];
              }
              errors[key].push(typeError);
            }
          }

          // Check minLength for strings (apply even for empty strings)
          if (
            typeof propSchema.minLength === 'number' &&
            typeof value === 'string'
          ) {
            if (value.length < propSchema.minLength) {
              if (!errors[key]) {
                errors[key] = [];
              }
              errors[key].push(
                this.formatValidationError(
                  key,
                  'minLength',
                  propSchema.minLength,
                  i18n
                )
              );
            }
          }

          // Check maxLength for strings
          if (
            typeof propSchema.maxLength === 'number' &&
            typeof value === 'string'
          ) {
            if (value.length > propSchema.maxLength) {
              if (!errors[key]) {
                errors[key] = [];
              }
              errors[key].push(
                this.formatValidationError(
                  key,
                  'maxLength',
                  propSchema.maxLength,
                  i18n
                )
              );
            }
          }

          // Check pattern for strings (skip for empty optional fields)
          if (propSchema.pattern && typeof value === 'string' && !isEmpty) {
            const patternError = this.validatePattern(
              value,
              propSchema.pattern,
              key,
              i18n
            );
            if (patternError) {
              if (!errors[key]) {
                errors[key] = [];
              }
              errors[key].push(patternError);
            }
          }
        }
      }
    }

    return errors;
  }

  /**
   * Validate value type against expected type
   */
  private static validateType(
    value: unknown,
    expectedType: string,
    field: string,
    i18n?: I18nMessages
  ): string | null {
    const actualType = typeof value;

    switch (expectedType) {
      case 'string':
        if (actualType !== 'string') {
          return this.formatValidationError(field, 'type', expectedType, i18n);
        }
        break;
      case 'number':
        if (actualType !== 'number' || isNaN(value as number)) {
          return this.formatValidationError(field, 'type', expectedType, i18n);
        }
        break;
      case 'integer':
        if (
          actualType !== 'number' ||
          !Number.isInteger(value) ||
          isNaN(value as number)
        ) {
          return this.formatValidationError(field, 'type', expectedType, i18n);
        }
        break;
      case 'boolean':
        if (actualType !== 'boolean') {
          return this.formatValidationError(field, 'type', expectedType, i18n);
        }
        break;
    }

    return null;
  }

  /**
   * Validate value against regex pattern
   */
  private static validatePattern(
    value: string,
    pattern: string,
    field: string,
    i18n?: I18nMessages
  ): string | null {
    try {
      const regex = new RegExp(pattern);
      if (!regex.test(value)) {
        return this.formatValidationError(field, 'pattern', pattern, i18n);
      }
    } catch {
      // Invalid regex pattern - skip validation silently
      return null;
    }
    return null;
  }

  /**
   * Format validation error message consistently
   */
  private static formatValidationError(
    field: string,
    constraint: string,
    value: unknown,
    i18n?: I18nMessages
  ): string {
    if (constraint === 'required') {
      if (i18n?.required) {
        return i18n.required(field);
      }
      return `${field} is required`;
    }
    if (constraint === 'minLength') {
      if (i18n?.minLength && typeof value === 'number') {
        return i18n.minLength(field, value);
      }
      return `${field} must be at least ${value} characters`;
    }
    if (constraint === 'maxLength') {
      if (i18n?.maxLength && typeof value === 'number') {
        return i18n.maxLength(field, value);
      }
      return `${field} must be at most ${value} characters`;
    }
    if (constraint === 'pattern') {
      if (i18n?.pattern) {
        return i18n.pattern(field);
      }
      return `${field} has an invalid format`;
    }
    if (constraint === 'type') {
      if (i18n?.type && typeof value === 'string') {
        return i18n.type(field, value);
      }
      return `${field} must be of type ${value}`;
    }
    return `${field} validation failed`;
  }
}
