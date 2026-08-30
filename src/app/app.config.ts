import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { API_BASE_URL, API_LATENCY_MS, CATALOG_API } from './core/api/catalog-api';
import { JsonCatalogApi } from './core/api/json-catalog-api';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideHttpClient(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'top' }),
    ),
    { provide: API_BASE_URL, useValue: 'data' },
    { provide: API_LATENCY_MS, useValue: 180 },
    { provide: CATALOG_API, useExisting: JsonCatalogApi },
  ],
};
