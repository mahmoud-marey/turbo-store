import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './header';
import { Footer } from './footer';
import { CartDrawer } from './cart-drawer';
import { CompareBar } from './compare-bar';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Header, Footer, CartDrawer, CompareBar],
  template: `
    <app-header />
    <main class="min-h-[70vh]">
      <router-outlet />
    </main>
    <app-footer />
    <app-cart-drawer />
    <app-compare-bar />
  `,
})
export class Shell {}
