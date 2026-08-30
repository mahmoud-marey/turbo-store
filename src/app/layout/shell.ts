import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './header';
import { Footer } from './footer';
import { CartDrawer } from './cart-drawer';
import { CompareBar } from './compare-bar';
import { TabBar } from './tab-bar';
import { Toasts } from '../shared/toasts';
import { ScrollTop } from '../shared/scroll-top';
import { AssistantHost } from '../features/assistant/assistant-host';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Header, Footer, CartDrawer, CompareBar, TabBar, Toasts, ScrollTop, AssistantHost],
  template: `
    <app-header />
    <main class="min-h-[70vh] pb-24 md:pb-0">
      <router-outlet />
    </main>
    <app-footer />
    <app-cart-drawer />
    <app-compare-bar />
    <app-tab-bar />
    <app-toasts />
    <app-scroll-top />
    @defer (on idle) {
      <app-assistant-host />
    }
  `,
})
export class Shell {}
