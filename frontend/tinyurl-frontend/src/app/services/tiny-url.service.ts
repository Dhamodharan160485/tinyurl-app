// =====================================================
// FILE: services/tiny-url.service.ts
// PURPOSE: Handles all HTTP calls to the backend API
//
// DESIGN PATTERN: Service Pattern
//  All API communication is in ONE place
//  Components never call HTTP directly
//  If API URL changes, we only change this file
//
// SOLID: Single Responsibility Principle
//  This service ONLY handles HTTP calls
//  No UI logic, no form handling
//
// SOLID: Dependency Inversion Principle
//  Components depend on this Service abstraction
//  Not on HttpClient directly
//
// @Injectable means Angular can automatically inject. This service into any component that needs it.
// We never use "new TinyUrlService()" anywhere. Angular creates and manages the instance for us.
// =====================================================

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TinyUrlEntry, TinyUrlAddDto } from '../models/tiny-url.model';
import { environment } from '../../environments/environment';

@Injectable({
  // providedIn: 'root' means this service is available. everywhere in the app without importing it manually
  // Angular creates ONE instance and shares it app-wide
  // DESIGN PATTERN: Singleton Pattern. Only one instance of this service exists
  providedIn: 'root'
})
export class TinyUrlService {

  // -------------------------------------------------------
  // Base API URL comes from environment file
  // Development  https://localhost:7001
  // Production   https://your-api.azurewebsites.net
  // -------------------------------------------------------
  private apiUrl = environment.apiUrl;

  // -------------------------------------------------------
  // HttpClient is injected by Angular automatically. We never create it manually with "new HttpClient()"
  // SOLID: Dependency Inversion Principle
  // We depend on HttpClient abstraction. not on fetch() or XMLHttpRequest directly
  // -------------------------------------------------------
  constructor(private http: HttpClient) {}

  // -------------------------------------------------------
  // METHOD: addUrl()
  // PURPOSE: Create a new short URL
  // CALLS: POST /api/add
  //
  // Observable is like a promise but more powerful.
  // It represents a value that will arrive in the future.
  // Component "subscribes" to it and gets the value when the HTTP call completes.
  // DESIGN PATTERN: Observer Pattern
  // -------------------------------------------------------
  addUrl(dto: TinyUrlAddDto): Observable<TinyUrlEntry> {
    return this.http.post<TinyUrlEntry>(
      `${this.apiUrl}/api/add`,
      dto   // this is sent as JSON in request body
    );
  }

  // -------------------------------------------------------
  // METHOD: getPublicUrls()
  // PURPOSE: Get all public URLs with optional search
  // CALLS: GET /api/public?search=xxx
  //
  // HttpParams builds the query string automatically
  // e.g. if search = "google"
  // URL becomes: /api/public?search=google
  // -------------------------------------------------------
  getPublicUrls(search?: string): Observable<TinyUrlEntry[]> {
    // Start with empty params
    let params = new HttpParams();

    // Only add search param if search term is provided
    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<TinyUrlEntry[]>(
      `${this.apiUrl}/api/public`,
      { params }  // passes ?search=xxx to the URL
    );
  }

  // -------------------------------------------------------
  // METHOD: deleteUrl()
  // PURPOSE: Delete a specific short URL by code
  // CALLS: DELETE /api/delete/{code}
  // -------------------------------------------------------
  deleteUrl(code: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/api/delete/${code}`
    );
  }

  // -------------------------------------------------------
  // METHOD: deleteAllUrls()
  // PURPOSE: Delete ALL short URLs
  // CALLS: DELETE /api/delete-all
  // -------------------------------------------------------
  deleteAllUrls(): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/api/delete-all`
    );
  }
}