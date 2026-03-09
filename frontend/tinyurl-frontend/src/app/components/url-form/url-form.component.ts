// =====================================================
// FILE: components/url-form/url-form.component.ts
// PURPOSE: Handles the URL input form
//          - Takes URL input from user
//          - Sends to backend API
//          - Shows success/error message
//
// DESIGN PATTERN: Component Pattern
//  One component, one responsibility
//
// SOLID: Single Responsibility Principle
//  This component ONLY handles form submission
//  It does NOT handle the URL list
//  It does NOT make HTTP calls directly
//   (that is TinyUrlService's job)
//
// @Component is a decorator that tells Angular this class is a component. 
// It defines the template and styles to use for this component.
//
// Standalone means this component does not need to be declared in any NgModule.
// It imports its own dependencies directly.
// =====================================================

import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TinyUrlService } from '../../services/tiny-url.service';
import { TinyUrlEntry } from '../../models/tiny-url.model';

@Component({
  selector: 'app-url-form',       // used as <app-url-form> in HTML
  standalone: true,               // no NgModule needed
  imports: [
    CommonModule,   // gives us *ngIf, *ngFor in template
    FormsModule     // gives us [(ngModel)] two-way binding
  ],
  templateUrl: './url-form.component.html',
  styleUrls: ['./url-form.component.scss']
})
export class UrlFormComponent {

  // -------------------------------------------------------
  // @Output EventEmitter
  // When a URL is successfully created, we notify the parent component (AppComponent) 
  // so it can refresh the URL list automatically.
  //
  // DESIGN PATTERN: Observer Pattern
  //  Parent subscribes to this event Child emits when something happens
  //  Parent and child are loosely coupled
  // -------------------------------------------------------
  @Output() urlAdded = new EventEmitter<TinyUrlEntry>();

  // -------------------------------------------------------
  // Component properties - these are bound to the HTML
  // template using [(ngModel)] two-way data binding
  // -------------------------------------------------------

  // Stores what user types in the input box
  url = '';

  // Stores the checkbox value
  isPrivate = false;

  // Controls the loading state of the button
  loading = false;

  // Stores error message to show in red box
  error = '';

  // Stores success message to show in green box
  success = '';

  // -------------------------------------------------------
  // TinyUrlService is injected by Angular automatically
  // SOLID: Dependency Inversion Principle
  //  We depend on TinyUrlService abstraction not on HttpClient directly
  // -------------------------------------------------------
  constructor(private svc: TinyUrlService) {}

  // -------------------------------------------------------
  // METHOD: generate()
  // PURPOSE: Called when user clicks Generate button
  //
  // Step by step:
  // 1. Validate URL is not empty
  // 2. Set loading = true (disables button, shows spinner)
  // 3. Call TinyUrlService.addUrl()
  // 4. On success  show success message, emit event
  // 5. On error  show error message
  // 6. Set loading = false (re-enables button)
  // -------------------------------------------------------
  generate() {
    // Step 1: Validate
    if (!this.url.trim()) {
      this.error = 'Please enter a URL.';
      return;
    }

    // Clear previous messages
    this.error = '';
    this.success = '';

    // Step 2: Show loading state
    this.loading = true;

    // Step 3: Call service
    // DESIGN PATTERN: Observer Pattern
    //  subscribe() registers callbacks
    //  next() runs when HTTP call succeeds
    //  error() runs when HTTP call fails
    this.svc.addUrl({
      url: this.url.trim(),
      isPrivate: this.isPrivate
    }).subscribe({
      // Runs when API returns success (200 OK)
      next: (entry) => {
        this.success = `Short URL created: ${entry.shortUrl}`;
        this.url = '';              // clear input
        this.isPrivate = false;     // reset checkbox
        this.loading = false;       // re-enable button
        this.urlAdded.emit(entry);  // notify parent to refresh list
      },
      // Runs when API returns error
      error: (err) => {
        this.error = 'Failed to create short URL. Is the API running?';
        this.loading = false;
      }
    });
  }
}