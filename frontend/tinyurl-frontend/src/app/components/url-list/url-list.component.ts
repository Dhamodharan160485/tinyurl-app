// =====================================================
// FILE: components/url-list/url-list.component.ts
// PURPOSE: Displays all public URLs in a list
//          - Shows short URL, original URL, click count
//          - Search/filter URLs
//          - Copy short URL to clipboard
//          - Delete a URL
//
// DESIGN PATTERN: Component Pattern
//  One component, one responsibility
//
// SOLID: Single Responsibility Principle
//  This component ONLY handles the URL list display.  It does NOT handle form submission  (that is UrlFormComponent's job)
//  It does NOT make HTTP calls directly (that is TinyUrlService's job)
//
// SOLID: Dependency Inversion Principle
//  This component depends on TinyUrlService abstraction  not on HttpClient directly
// =====================================================

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TinyUrlService } from '../../services/tiny-url.service';
import { TinyUrlEntry } from '../../models/tiny-url.model';

// -------------------------------------------------------
// What is @angular/common NgIf and NgFor?
// NgIf   shows/hides elements based on condition
//         e.g. *ngIf="loading" shows div when loading=true
// NgFor  loops through array and creates elements
//         e.g. *ngFor="let url of urls" creates one
//         row for each URL in the array
//
// Angular 17 recommends importing only what you need
// NgIf and NgFor are lighter than importing full CommonModule
// -------------------------------------------------------

@Component({
  selector: 'app-url-list',      // used as <app-url-list> in HTML
  standalone: true,               // no NgModule needed
  imports: [
    NgIf,        // gives us *ngIf in template
    NgFor,       // gives us *ngFor in template
    FormsModule  // gives us [(ngModel)] for search input
  ],
  templateUrl: './url-list.component.html',
  styleUrls: ['./url-list.component.scss']
})
export class UrlListComponent implements OnInit {

  // -------------------------------------------------------
  // Component Properties
  // These are bound to the HTML template
  // -------------------------------------------------------

  // Stores the list of public URLs fetched from API
  // Starts as empty array - filled when API responds
  urls: TinyUrlEntry[] = [];

  // Stores the search term typed by user in search box
  // Bound to search input using [(ngModel)]
  searchTerm = '';

  // Controls loading spinner visibility
  // true   show "Loading..."
  // false  show list or "No public URLs found."
  loading = false;

  // Stores code of URL that was just copied
  // Used to show "Copied" button state temporarily
  // null means no URL is currently in copied state
  copiedCode: string | null = null;

  // Stores toast notification message
  // Empty string means toast is hidden
  toastMsg = '';

  // -------------------------------------------------------
  // Constructor - Angular injects dependencies here
  //
  // TinyUrlService  handles all HTTP calls to backend
  // ChangeDetectorRef  forces Angular to update the UI
  //
  // What is ChangeDetectorRef?
  // Angular normally checks for UI updates automatically.
  // But sometimes inside async callbacks (like HTTP responses)
  // Angular misses the changes.
  // ChangeDetectorRef.detectChanges() forces Angular to
  // re-check the template and update the UI immediately.
  //
  // SOLID: Dependency Inversion Principle
  //  We depend on TinyUrlService abstraction  not on HttpClient directly
  // -------------------------------------------------------
  constructor(
    private svc: TinyUrlService,
    private cdr: ChangeDetectorRef
  ) {}

  // -------------------------------------------------------
  // ngOnInit() - Angular Lifecycle Hook
  //
  // Angular components go through stages: Constructor  ngOnInit  Changes  ngOnDestroy
  // -------------------------------------------------------
  ngOnInit() {
    // Load URLs when component first appears on screen
    this.load();
  }

  // -------------------------------------------------------
  // METHOD: load()
  // PURPOSE: Fetch public URLs from backend API
  //
  // Step by step:
  // 1. Set loading = true  shows "Loading..." in UI
  // 2. Call TinyUrlService.getPublicUrls()
  // 3. On success  store URLs, set loading = false
  // 4. On error    set loading = false
  // 5. detectChanges()  force UI to update
  //
  // DESIGN PATTERN: Observer Pattern
  //  subscribe() registers callbacks
  //  next() runs when HTTP call succeeds
  //  error() runs when HTTP call fails
  // -------------------------------------------------------
  load() {
    // Show loading spinner in UI
    this.loading = true;
    this.cdr.detectChanges(); // force UI to show loading state

    // Call API with optional search term
    // If searchTerm is empty  returns all public URLs
    // If searchTerm has value  returns filtered URLs
    this.svc.getPublicUrls(this.searchTerm).subscribe({

      // Runs when API returns success (HTTP 200 OK)
      next: (data) => {
        this.urls = data;       // store URLs in component
        this.loading = false;   // hide loading spinner
        this.cdr.detectChanges(); // force UI to update
      },

      // Runs when API returns error (HTTP 4xx or 5xx)
      error: (err) => {
        console.error('Failed to load URLs:', err);
        this.loading = false;   // hide spinner even on error
        this.cdr.detectChanges(); // force UI to update
      }
    });
  }

  // -------------------------------------------------------
  // METHOD: refresh()
  // PURPOSE: Public method to reload the list
  //
  // This is called by parent AppComponent when a new
  // URL is added in UrlFormComponent.
  //
  // Flow:
  // UrlFormComponent  emits urlAdded event
  // AppComponent  catches event, calls urlList.refresh()
  // UrlListComponent  reloads list from API
  // -------------------------------------------------------
  refresh() {
    this.load();
  }

  // -------------------------------------------------------
  // METHOD: onSearch()
  // PURPOSE: Called every time search input changes
  //
  // [(ngModel)] + (ngModelChange) means:
  //  Every keystroke updates searchTerm
  //  Every keystroke calls onSearch()
  //  List reloads with new search filter
  // -------------------------------------------------------
  onSearch() {
    this.load();
  }

  // -------------------------------------------------------
  // METHOD: copy()
  // PURPOSE: Copy short URL to clipboard
  //
  // navigator.clipboard is a built-in browser API
  // It copies text to the system clipboard
  // Same as selecting text and pressing Ctrl+C
  //
  // writeText() returns a Promise so we use .then()
  // to run code after copy is complete
  // -------------------------------------------------------
  copy(url: TinyUrlEntry) {
    navigator.clipboard.writeText(url.shortUrl).then(() => {

      // Store which URL was copied
      // Template uses this to show "✓ Copied" on button
      this.copiedCode = url.code;
      this.showToast('Copied to clipboard!');

      // Reset button back to "Copy" after 2 seconds
      setTimeout(() => {
        this.copiedCode = null;
        this.cdr.detectChanges(); // force UI to reset button
      }, 2000);
    });
  }

  // -------------------------------------------------------
  // METHOD: delete()
  // PURPOSE: Delete a specific short URL
  //
  // Step by step:
  // 1. Show confirmation dialog
  // 2. If user cancels  do nothing
  // 3. If user confirms  call API to delete
  // 4. Remove from local list without reloading
  //    (faster than calling API again)
  // -------------------------------------------------------
  delete(url: TinyUrlEntry) {

    // confirm() shows a browser popup with OK/Cancel
    // Returns true if user clicks OK
    // Returns false if user clicks Cancel
    if (!confirm(`Delete short URL /${url.code}?`)) {
      return; // user clicked Cancel - stop here
    }

    // Call API to delete
    this.svc.deleteUrl(url.code).subscribe({

      // Runs when delete succeeds
      next: () => {
        // Remove from local array without calling API again
        // filter() creates new array excluding deleted URL
        this.urls = this.urls.filter(u => u.code !== url.code);
        this.showToast('Deleted successfully!');
        this.cdr.detectChanges(); // force UI to remove the row
      },

      // Runs when delete fails
      error: () => {
        this.showToast('Failed to delete. Try again.');
      }
    });
  }

  // -------------------------------------------------------
  // METHOD: showToast()
  // PURPOSE: Shows a notification message at bottom of screen
  //
  // private means only this component can call it
  // It is a helper method not needed outside this class
  //
  // Step by step:
  // 1. Set toastMsg  toast appears in UI
  // 2. After 2.5 seconds  clear toastMsg  toast hides
  // -------------------------------------------------------
  private showToast(msg: string) {
    this.toastMsg = msg;
    this.cdr.detectChanges(); // force UI to show toast

    setTimeout(() => {
      this.toastMsg = '';
      this.cdr.detectChanges(); // force UI to hide toast
    }, 2500);
  }
}