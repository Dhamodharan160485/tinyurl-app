// =====================================================
// FILE: environments/environment.ts
// PURPOSE: Stores environment-specific configuration
// SOLID: Open/Closed Principle
// → Easy to add new environments without changing code
// =====================================================
export const environment = {
  production: false,

  // Your .NET API URL - check the port in Visual Studio
  // When you press F5 in VS, look for:
  // "Now listening on: https://localhost:XXXX"
  apiUrl: 'https://localhost:7001'
};