// =====================================================
// FILE: environments/environment.prod.ts
// PURPOSE: Production environment configuration
//
// This file is used when building for production:
// ng build --configuration production
//
// angular.json automatically swaps environment.ts
// with this file during production build
// =====================================================
export const environment = {
  production: true,

  // This is the live Azure API URL
  apiUrl: 'https://tinyurl-api-dhamo.azurewebsites.net'
};