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
//  This component ONLY handles the URL list display. It does NOT handle form submission
//  (that is UrlFormComponent's job)
// =====================================================

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TinyUrlService } from '../../services/tiny-url.service';
import { TinyUrlEntry } from '../../models/tiny-url.model';

@Component({
  selector: 'app-url-list',      // used as <app-url-list> in HTML
  standalone: true,
  imports: [
    CommonModule,   // gives us *ngIf, *ngFor in template
    FormsModule     // gives us [(ngModel)] for search input
  ],
  templateUrl: './url-list.component.html',
  styleUrls: ['./url-list.component.scss']
})
export class UrlListComponent implements OnInit {

  // -------------------------------------------------------
  // Component Properties
  // These are bound to the HTML template
  // -------------------------------------------------------

  // Stores the list of public URLs from API
  urls: TinyUrlEntry[] = [];

  // Stores the search term typed by user
  searchTerm = '';

  // Controls loading spinner visibility
  loading = false;

  // Stores which URL was just copied
  // Used to show "✓ Copied" button state
  copiedCode: string | null = null;

  // Stores toast notification message
  toastMsg = '';

  // -------------------------------------------------------
  // TinyUrlService injected by Angular automatically
  // SOLID: Dependency Inversion Principle
  // -------------------------------------------------------
  constructor(private svc: TinyUrlService) {}

  // -------------------------------------------------------
  // ngOnInit() is lifecycle hook runs ONCE when component loads. Perfect place to load initial data from API
  //
  // -------------------------------------------------------
  ngOnInit() {
    this.load();  // load URLs when component first appears
  }

  // -------------------------------------------------------
  // METHOD: load()
  // PURPOSE: Fetch public URLs from API
  // Called on init and after any changes
  // -------------------------------------------------------
  load() {
    this.loading = true;

    // Pass search term if user typed something
    this.svc.getPublicUrls(this.searchTerm).subscribe({
      next: (data) => {
        this.urls = data;       // store URLs in component
        this.loading = false;   // hide loading spinner
      },
      error: () => {
        this.loading = false;   // hide spinner even on error
      }
    });
  }

  // -------------------------------------------------------
  // METHOD: refresh()
  // PURPOSE: Public method to reload the list
  // Called by parent AppComponent when new URL is added
  // -------------------------------------------------------
  refresh() {
    this.load();
  }

  // -------------------------------------------------------
  // METHOD: onSearch()
  // PURPOSE: Called every time search input changes
  // Reloads list with search filter applied
  // -------------------------------------------------------
  onSearch() {
    this.load();
  }

  // -------------------------------------------------------
  // METHOD: copy()
  // PURPOSE: Copy short URL to clipboard
  //
  // navigator.clipboard is a browser API. It copies text to the system clipboard
  // Same as pressing Ctrl+C
  // -------------------------------------------------------
  copy(url: TinyUrlEntry) {
    navigator.clipboard.writeText(url.shortUrl).then(() => {
      // Show "Copied" state on the button
      this.copiedCode = url.code;
      this.showToast('Copied to clipboard!');

      // Reset button back to "Copy" after 2 seconds
      setTimeout(() => {
        this.copiedCode = null;
      }, 2000);
    });
  }

  // -------------------------------------------------------
  // METHOD: delete()
  // PURPOSE: Delete a short URL
  // Shows confirmation dialog before deleting
  // -------------------------------------------------------
  delete(url: TinyUrlEntry) {
    // confirm() shows a browser dialog with OK/Cancel
    // Returns true if user clicks OK
    if (!confirm(`Delete short URL /${url.code}?`)) {
      return;  // user clicked Cancel - do nothing
    }

    this.svc.deleteUrl(url.code).subscribe({
      next: () => {
        // Remove from local list without reloading
        // This is faster than calling API again
        this.urls = this.urls.filter(u => u.code !== url.code);
        this.showToast('Deleted successfully!');
      },
      error: () => {
        this.showToast('Failed to delete. Try again.');
      }
    });
  }

  // -------------------------------------------------------
  // METHOD: showToast()
  // PURPOSE: Shows a notification message at bottom
  // Automatically hides after 2.5 seconds
  // -------------------------------------------------------
  private showToast(msg: string) {
    this.toastMsg = msg;
    setTimeout(() => {
      this.toastMsg = '';
    }, 2500);
  }
}