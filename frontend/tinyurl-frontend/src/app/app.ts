// =====================================================
// FILE: app.ts
// PURPOSE: Root component - wires everything together
//          - Contains UrlFormComponent
//          - Contains UrlListComponent
//          - Listens for urlAdded event from form
//          - Tells list to refresh when URL is added
//
// DESIGN PATTERN: Component Pattern
//  App is broken into small focused components
//  AppComponent is the COORDINATOR
//   it does not do form logic or list logic
//   it just connects the two components together
//
// SOLID: Single Responsibility Principle
//  AppComponent only coordinates between components
//  It does NOT handle form submission
//  It does NOT handle list display
//
// @ViewChild gives us a direct reference to a
// child component instance.
// We use it to call refresh() on UrlListComponent
// when a new URL is added.
// =====================================================

import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UrlFormComponent } from './components/url-form/url-form.component';
import { UrlListComponent } from './components/url-list/url-list.component';
import { TinyUrlEntry } from './models/tiny-url.model';

@Component({
  selector: 'app-root',        // used as <app-root> in index.html
  standalone: true,
  imports: [
    CommonModule,
    // Import child components so we can use them in template   
    // parent must import child components it uses
    UrlFormComponent,          // gives us <app-url-form>
    UrlListComponent           // gives us <app-url-list>
  ],
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {

  // -------------------------------------------------------
  // @ViewChild
  // Gets a direct reference to the UrlListComponent
  // instance that is rendered in the template.
  //
  // When user adds a new URL in UrlFormComponent,
  // we need to tell UrlListComponent to refresh.
  // @ViewChild gives us access to call refresh() on it.
  // -------------------------------------------------------
  @ViewChild(UrlListComponent) urlList!: UrlListComponent;

  // -------------------------------------------------------
  // METHOD: onUrlAdded()
  // PURPOSE: Called when UrlFormComponent emits urlAdded event
  //
  // Flow:
  // 1. User submits URL in UrlFormComponent
  // 2. UrlFormComponent emits urlAdded event
  // 3. AppComponent catches it here (via (urlAdded) in HTML)
  // 4. We tell UrlListComponent to refresh
  // 5. List reloads and shows the new URL
  //
  // Parameter:
  // entry = the newly created TinyUrlEntry from API
  // -------------------------------------------------------
  onUrlAdded(entry: TinyUrlEntry) {
    // Tell the list component to reload from API
    this.urlList.refresh();
  }
}