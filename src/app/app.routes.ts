import { Routes } from '@angular/router';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'c/:categorySlug',
        loadComponent: () => import('./features/catalog/catalog.page').then((m) => m.CatalogPage),
      },
      {
        path: 'brand/:brandSlug',
        loadComponent: () => import('./features/catalog/catalog.page').then((m) => m.CatalogPage),
      },
      {
        path: 'brands',
        loadComponent: () => import('./features/brands/brands.page').then((m) => m.BrandsPage),
      },
      {
        path: 'search',
        loadComponent: () => import('./features/catalog/catalog.page').then((m) => m.CatalogPage),
      },
      {
        path: 'p/:slug',
        loadComponent: () => import('./features/product/product.page').then((m) => m.ProductPage),
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/cart.page').then((m) => m.CartPage),
      },
      {
        path: 'checkout',
        loadComponent: () => import('./features/checkout/checkout.page').then((m) => m.CheckoutPage),
      },
      {
        path: 'order/:id',
        loadComponent: () => import('./features/checkout/order.page').then((m) => m.OrderPage),
      },
      {
        path: 'wishlist',
        loadComponent: () => import('./features/wishlist/wishlist.page').then((m) => m.WishlistPage),
      },
      {
        path: 'compare',
        loadComponent: () => import('./features/compare/compare.page').then((m) => m.ComparePage),
      },
      {
        path: 'builder',
        loadComponent: () => import('./features/builder/builder.page').then((m) => m.BuilderPage),
      },
      {
        path: 'blog',
        loadComponent: () => import('./features/blog/blog.page').then((m) => m.BlogPage),
      },
      {
        path: 'blog/:slug',
        loadComponent: () => import('./features/blog/blog-post.page').then((m) => m.BlogPostPage),
      },
      {
        path: 'warranty',
        redirectTo: 'page/warranty',
        pathMatch: 'full',
      },
      {
        path: 'about',
        redirectTo: 'page/about',
        pathMatch: 'full',
      },
      {
        path: 'contact',
        loadComponent: () => import('./features/pages/content.pages').then((m) => m.ContactPage),
      },
      {
        path: 'page/:id',
        loadComponent: () => import('./features/pages/content.pages').then((m) => m.ContentPage),
      },
      {
        path: '**',
        loadComponent: () => import('./features/pages/content.pages').then((m) => m.NotFoundPage),
      },
    ],
  },
];
