/**
 * IsOptional decorator
 * Used to mark a property as optional for class-validator
 */
export function IsOptional(): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    // This is a marker decorator, no implementation needed
    // It will be used by the validation process to determine if a property is optional
  };
} 