import 'reflect-metadata';

// This file ensures that reflect-metadata is properly imported before any other imports
// This solves the "Reflect.getMetadata is not a function" error in the tests

// Re-export all other modules that need reflect-metadata
export * from './modules/app-module';
export * from './modules/detection-module/service';
export * from './modules/authenticator/totp-service'; 