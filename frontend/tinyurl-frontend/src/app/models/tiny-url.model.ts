// =====================================================
// FILE: models/tiny-url.model.ts
// PURPOSE: Defines TypeScript interfaces for our data
//
// DESIGN PATTERN: DTO Pattern
//  Same concept as backend DTOs. Defines exactly what data looks like
//
// SOLID: Single Responsibility Principle
//  This file ONLY defines data structures. No logic, no HTTP calls, just data shapes
//
// =====================================================

// -------------------------------------------------------
// This matches exactly what the backend API returns
// when we call GET /api/public or POST /api/add
// -------------------------------------------------------
export interface TinyUrlEntry {
  // Unique ID from database
  id: number;

  // 6-character short code e.g. "aB3xKq"
  code: string;

  // The original long URL
  originalUrl: string;

  // Whether this URL is hidden from public list
  isPrivate: boolean;

  // How many times this short URL was clicked
  clicks: number;

  // When this was created
  createdAt: string;

  // Full short URL e.g. "https://localhost:7001/aB3xKq"
  // This is built by the backend and returned to us
  shortUrl: string;
}

// -------------------------------------------------------
// This is what we SEND to the backend
// when creating a new short URL
// POST /api/add expects this structure
// -------------------------------------------------------
export interface TinyUrlAddDto {
  // The long URL to shorten
  url: string;

  // Whether to hide from public list
  isPrivate: boolean;
}

// -------------------------------------------------------
// This is what we SEND to the backend. when updating an existing short URL
// PUT /api/update/{code} expects this structure
// -------------------------------------------------------
export interface TinyUrlUpdateDto {
  // New URL to replace existing one
  url: string;

  // New private/public status
  isPrivate: boolean;
}