import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EgpPipe } from '../../core/i18n/egp.pipe';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { UiStore } from '../../core/stores/ui.store';
import { AiConfigStore } from '../../core/ai/ai-config.store';
import { AssistantService } from '../../core/ai/assistant.service';
import { OverlayDirective } from '../../shared/overlay';
import { ToastService } from '../../core/services/toast.service';
import { BuilderSlot } from '../../core/models/catalog.models';

@Component({
  selector: 'app-assistant-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, TranslatePipe, EgpPipe, OverlayDirective, RouterLink],
  template: `
    <button
      type="button"
      class="fixed end-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[var(--accent)] text-xl font-bold text-[var(--accent-ink)] shadow-[var(--shadow)]"
      style="bottom: calc(7.5rem + env(safe-area-inset-bottom, 0px))"
      (click)="ui.assistantOpen.set(true)"
      aria-label="Turbo Assistant"
    >
      AI
    </button>

    @if (ui.assistantOpen()) {
      <div class="fixed inset-0 z-[65] bg-black/50" (click)="close()">
        <aside
          appOverlay
          class="ms-auto flex h-full w-full max-w-md flex-col bg-[var(--bg-elevated)] shadow-[var(--shadow)]"
          (click)="$event.stopPropagation()"
          (closed)="close()"
        >
          <div class="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
            <h2 class="font-display text-lg font-bold">{{ 'ai.title' | t }}</h2>
            <button type="button" class="ms-auto text-sm" (click)="cfg.showSettings.set(!cfg.showSettings())">{{ 'ai.settings' | t }}</button>
            <button type="button" (click)="close()">✕</button>
          </div>

          @if (cfg.showSettings() || !cfg.configured()) {
            <div class="border-b border-[var(--border)] p-4 text-sm">
              <p class="mb-3 text-[var(--text-muted)]">{{ cfg.configured() ? ('ai.privacy' | t) : ('ai.connect' | t) }}</p>
              <label class="mb-2 block">{{ 'ai.provider' | t }}
                <select class="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-2 py-2" [ngModel]="cfg.config().provider" (ngModelChange)="cfg.patch({ provider: $event })">
                  <option value="openai">OpenAI</option>
                  <option value="compatible">OpenAI-compatible</option>
                </select>
              </label>
              <label class="mb-2 block">{{ 'ai.baseUrl' | t }}
                <input class="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-2 py-2" [ngModel]="cfg.config().baseUrl" (ngModelChange)="cfg.patch({ baseUrl: $event })" />
              </label>
              <label class="mb-2 block">{{ 'ai.model' | t }}
                <input class="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-2 py-2" [ngModel]="cfg.config().model" (ngModelChange)="cfg.patch({ model: $event })" />
              </label>
              <p class="mb-2 text-xs text-[var(--text-muted)]">gpt-5.6-terra · gpt-5.6-luna</p>
              <label class="mb-2 block">{{ 'ai.key' | t }}
                <input type="password" autocomplete="off" class="mt-1 w-full rounded-lg border border-[var(--border)] bg-transparent px-2 py-2" [ngModel]="cfg.config().apiKey" (ngModelChange)="cfg.patch({ apiKey: $event })" />
              </label>
              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" class="rounded-lg border border-[var(--border)] px-3 py-1" (click)="test()">{{ 'ai.test' | t }}</button>
                <button type="button" class="rounded-lg border border-[var(--border)] px-3 py-1" (click)="cfg.forget()">{{ 'ai.forget' | t }}</button>
                <button type="button" class="rounded-lg bg-[var(--accent)] px-3 py-1 font-bold text-[var(--accent-ink)]" (click)="assistant.replaySample()">{{ 'ai.sample' | t }}</button>
              </div>
              @if (testMsg()) {
                <p class="mt-2 text-xs">{{ testMsg() }}</p>
              }
            </div>
          }

          <div class="flex-1 space-y-3 overflow-auto p-4">
            @if (!assistant.messages().length) {
              <div class="flex flex-wrap gap-2">
                <button type="button" class="rounded-full border border-[var(--border)] px-3 py-1 text-xs" (click)="ask('ai.suggested1')">{{ 'ai.suggested1' | t }}</button>
                <button type="button" class="rounded-full border border-[var(--border)] px-3 py-1 text-xs" (click)="ask('ai.suggested2')">{{ 'ai.suggested2' | t }}</button>
                <button type="button" class="rounded-full border border-[var(--border)] px-3 py-1 text-xs" (click)="ask('ai.suggested3')">{{ 'ai.suggested3' | t }}</button>
                <button type="button" class="rounded-full border border-[var(--border)] px-3 py-1 text-xs" (click)="ask('ai.suggested4')">{{ 'ai.suggested4' | t }}</button>
              </div>
            }
            @for (m of assistant.messages(); track m.id) {
              <div class="rounded-2xl px-3 py-2 text-sm" [class.bg-[var(--bg-card)]]="m.role === 'assistant'" [class.ms-8]="m.role === 'user'" [class.border]="m.role === 'user'" [class.border-[var(--border)]]="m.role === 'user'">
                <p class="whitespace-pre-wrap">{{ m.text }}</p>
                @if (m.products?.length) {
                  <div class="mt-2 space-y-2">
                    @for (p of m.products; track p.slug) {
                      <a [routerLink]="['/p', p.slug]" class="flex gap-2 rounded-xl border border-[var(--border)] p-2" (click)="close()">
                        <img [src]="p.image" alt="" class="h-12 w-12 object-contain" />
                        <span class="min-w-0">
                          <span class="line-clamp-2 text-xs">{{ p.name }}</span>
                          <span class="text-xs text-[var(--accent)]">{{ p.price | egp }}</span>
                        </span>
                      </a>
                    }
                  </div>
                }
                @if (m.build) {
                  <button type="button" class="mt-2 rounded-lg bg-[var(--accent)] px-3 py-1 text-xs font-bold text-[var(--accent-ink)]" (click)="apply(m.build)">{{ 'ai.applyBuild' | t }}</button>
                }
              </div>
            }
            @if (assistant.busy()) {
              <p class="text-xs text-[var(--text-muted)]">{{ 'ai.thinking' | t }}</p>
            }
          </div>

          <div class="border-t border-[var(--border)] p-3" style="padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px))">
            <div class="flex gap-2">
              <input class="flex-1 rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm" [placeholder]="'ai.placeholder' | t" [ngModel]="draft()" (ngModelChange)="draft.set($event)" (keydown.enter)="submit()" />
              @if (assistant.busy()) {
                <button type="button" class="rounded-xl border border-[var(--border)] px-3" (click)="assistant.stop()">{{ 'ai.stop' | t }}</button>
              } @else {
                <button type="button" class="rounded-xl bg-[var(--accent)] px-3 font-bold text-[var(--accent-ink)]" (click)="submit()">{{ 'ai.send' | t }}</button>
              }
            </div>
          </div>
        </aside>
      </div>
    }
  `,
})
export class AssistantHost {
  readonly ui = inject(UiStore);
  readonly cfg = inject(AiConfigStore);
  readonly assistant = inject(AssistantService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly draft = signal('');
  readonly testMsg = signal('');

  constructor() {
    effect(() => {
      const seed = this.ui.assistantSeed();
      if (this.ui.assistantOpen() && seed) {
        this.ui.assistantSeed.set('');
        if (this.cfg.configured()) void this.assistant.send(seed);
        else this.draft.set(seed);
      }
    });
  }

  close(): void {
    this.ui.assistantOpen.set(false);
    this.ui.assistantMode.set('chat');
  }

  submit(): void {
    const t = this.draft().trim();
    if (!t) return;
    this.draft.set('');
    if (!this.cfg.configured()) {
      this.cfg.showSettings.set(true);
      this.toast.show(this.ui.t('ai.noKey'), { kind: 'warn' });
      return;
    }
    void this.assistant.send(t);
  }

  ask(key: string): void {
    this.draft.set(this.ui.t(key));
    this.submit();
  }

  apply(parts?: Partial<Record<BuilderSlot, string>>): void {
    if (!parts) return;
    this.assistant.applyBuild(parts);
    this.close();
    void this.router.navigate(['/builder']);
  }

  async test(): Promise<void> {
    try {
      this.testMsg.set(await this.assistant.testConnection());
    } catch {
      this.testMsg.set(this.ui.t('ai.errorNet'));
    }
  }
}
