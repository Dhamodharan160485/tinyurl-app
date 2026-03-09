// =====================================================
// FILE: app.config.ts
// PURPOSE: Configures the Angular application
//
// This is where we register app-wide providers. It as the setup file for the whole app.
//
// provideHttpClient() registers HttpClient so it can be injected into TinyUrlService automatically.
// Without this, HttpClient injection would fail.
//
// SOLID: Dependency Inversion Principle
//  Services depend on HttpClient abstraction which is provided here centrally
// =====================================================

import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Enables routing in the app
    provideRouter(routes),

    // Registers HttpClient for dependency injection
    // This allows TinyUrlService to use HttpClient. Without this line  ERROR: No provider for HttpClient
    provideHttpClient()
  ]
};