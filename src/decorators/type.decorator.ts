import 'reflect-metadata';

/**
 * Type decorator for class properties
 * Used to specify the type of a property for class-transformer
 */
export function Type(typeFunction: () => any): PropertyDecorator {
  return (target: Object, propertyKey: string | symbol) => {
    if (!Reflect.hasOwnMetadata) {
      // Polyfill for environments without Reflect.getMetadata
      Reflect.defineMetadata = function(metadataKey: any, metadataValue: any, target: any, propertyKey?: any) {
        if (!target['__metadata__']) {
          target['__metadata__'] = {};
        }
        
        if (!propertyKey) {
          target['__metadata__'][metadataKey] = metadataValue;
        } else {
          if (!target['__metadata__'][propertyKey]) {
            target['__metadata__'][propertyKey] = {};
          }
          target['__metadata__'][propertyKey][metadataKey] = metadataValue;
        }
      };
      
      Reflect.getMetadata = function(metadataKey: any, target: any, propertyKey?: any): any {
        if (!target['__metadata__']) {
          return undefined;
        }
        
        if (!propertyKey) {
          return target['__metadata__'][metadataKey];
        }
        
        if (!target['__metadata__'][propertyKey]) {
          return undefined;
        }
        
        return target['__metadata__'][propertyKey][metadataKey];
      };
      
      Reflect.hasOwnMetadata = function(metadataKey: any, target: any, propertyKey?: any): boolean {
        if (!target['__metadata__']) {
          return false;
        }
        
        if (!propertyKey) {
          return !!target['__metadata__'][metadataKey];
        }
        
        if (!target['__metadata__'][propertyKey]) {
          return false;
        }
        
        return !!target['__metadata__'][propertyKey][metadataKey];
      };
    }
    
    Reflect.defineMetadata('design:type', typeFunction(), target, propertyKey);
  };
} 