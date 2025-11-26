import { InternalRowData, ValidationSchema, ValidationResult } from './types';

export class ValidationManager {
  /**
   * Validate a row and return detailed error information
   */
  static validateRow(
    row: InternalRowData,
    schema: ValidationSchema | null
  ): ValidationResult {
    const errors: Record<string, string[]> = {};

    // If no schema is set, consider the row valid
    if (!schema || typeof schema !== 'object') {
      return { isValid: true, errors };
    }

    // Validate required fields
    const requiredErrors = this.validateRequiredFields(row, schema);
    Object.assign(errors, requiredErrors);

    // Validate property constraints (skip fields with required errors)
    const propertyErrors = this.validatePropertyConstraints(
      row,
      schema,
      requiredErrors
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
    schema: ValidationSchema
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
            this.formatValidationError(field, 'required', value)
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
    requiredErrors: Record<string, string[]>
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

          // Check minLength for strings
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
                  propSchema.minLength
                )
              );
            }
          }
        }
      }
    }

    return errors;
  }

  /**
   * Format validation error message consistently
   */
  private static formatValidationError(
    field: string,
    constraint: string,
    value: unknown
  ): string {
    if (constraint === 'required') {
      return `${field} is required`;
    }
    if (constraint === 'minLength') {
      return `${field} must be at least ${value} characters`;
    }
    return `${field} validation failed`;
  }
}
