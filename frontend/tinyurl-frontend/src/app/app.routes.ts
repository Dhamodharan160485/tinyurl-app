// =====================================================
// FILE: app.routes.ts
// PURPOSE: Defines the routes for the application
//
// Routing means navigating between different pages/views
// e.g. /home, /about, /contact
//
// For our TinyURL app we don't need multiple pages
// Everything is on one page so routes array is empty.
// But we still need this file because app.config.ts
// imports it with provideRouter(routes)
// =====================================================

import { Routes } from '@angular/router';

// Empty array = no routes needed
// Our app is a Single Page Application (SPA)
// with everything on one page
export const routes: Routes = [];