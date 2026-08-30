import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BlogPost,
  Brand,
  BuilderCatalog,
  CatalogQuery,
  Category,
  ContentPage,
  FilterMeta,
  HomeData,
  Page,
  ProductDetail,
  ProductListItem,
} from '../models/catalog.models';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
export const API_LATENCY_MS = new InjectionToken<number>('API_LATENCY_MS');

export interface CatalogApi {
  list(query: CatalogQuery): Observable<Page<ProductListItem>>;
  detail(slug: string): Observable<ProductDetail>;
  categories(): Observable<Category[]>;
  brands(): Observable<Brand[]>;
  home(): Observable<HomeData>;
  builderCatalog(): Observable<BuilderCatalog>;
  filters(): Observable<FilterMeta>;
  blog(): Observable<BlogPost[]>;
  post(slug: string): Observable<BlogPost>;
  page(id: string): Observable<ContentPage>;
  suggestions(q: string): Observable<ProductListItem[]>;
}

export const CATALOG_API = new InjectionToken<CatalogApi>('CATALOG_API');
