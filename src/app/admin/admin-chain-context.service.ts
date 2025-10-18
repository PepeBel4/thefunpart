import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, combineLatest, firstValueFrom, map, shareReplay } from 'rxjs';
import { Chain } from '../core/models';
import { ChainService } from '../chains/chain.service';
import { AuthService } from '../core/auth.service';

@Injectable({ providedIn: 'root' })
export class AdminChainContextService {
  private chainService = inject(ChainService);
  private auth = inject(AuthService);

  private chainsSubject = new BehaviorSubject<Chain[]>([]);
  private readonly storageKey = 'admin.selectedChainId';
  private readonly storage = this.resolveStorage();
  private selectedChainIdSubject = new BehaviorSubject<number | null>(this.restoreSelectedChainId());

  readonly chains$ = this.chainsSubject.asObservable();
  readonly selectedChainId$ = this.selectedChainIdSubject.asObservable();

  readonly selectedChain$ = combineLatest([this.chains$, this.selectedChainId$]).pipe(
    map(([chains, id]) => {
      if (id == null) {
        return null;
      }

      return chains.find(chain => chain.id === id) ?? null;
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  async loadChains(): Promise<void> {
    try {
      const chains = await firstValueFrom(this.chainService.list());
      const filtered = this.filterChainsForCurrentUser(chains ?? []);
      this.chainsSubject.next(filtered);
      this.ensureSelectedChain(filtered);
    } catch (error) {
      console.error('Failed to load chains', error);
      this.chainsSubject.next([]);
      this.setSelectedChainId(null);
    }
  }

  selectChain(id: number | null): void {
    if (id === null || Number.isNaN(id)) {
      this.setSelectedChainId(null);
      return;
    }

    const chains = this.chainsSubject.value;
    const exists = chains.some(chain => chain.id === id);

    if (!exists) {
      void this.loadChains().then(() => {
        const refreshed = this.chainsSubject.value.some(chain => chain.id === id);
        if (refreshed) {
          this.setSelectedChainId(id);
        }
      });
      return;
    }

    this.setSelectedChainId(id);
  }

  refreshSelectedChain(): void {
    const current = this.selectedChainIdSubject.value;
    if (current !== null) {
      this.setSelectedChainId(current);
    }
  }

  private filterChainsForCurrentUser(chains: Chain[]): Chain[] {
    if (!chains.length) {
      return [];
    }

    if (this.auth.isSuperAdmin()) {
      return this.sortChains(chains);
    }

    const allowedIds = new Set(this.auth.getChainAdminChainIds());
    if (!allowedIds.size) {
      return [];
    }

    const filtered = chains.filter(chain => allowedIds.has(chain.id));
    return this.sortChains(filtered);
  }

  private ensureSelectedChain(chains: Chain[]): void {
    if (!chains.length) {
      this.setSelectedChainId(null);
      return;
    }

    const current = this.selectedChainIdSubject.value;
    if (current === null) {
      this.setSelectedChainId(chains[0].id);
      return;
    }

    const stillExists = chains.some(chain => chain.id === current);
    if (!stillExists) {
      this.setSelectedChainId(chains[0].id);
    }
  }

  private setSelectedChainId(id: number | null): void {
    this.selectedChainIdSubject.next(id);
    this.persistSelectedChainId(id);
  }

  private persistSelectedChainId(id: number | null): void {
    if (!this.storage) {
      return;
    }

    try {
      if (id === null) {
        this.storage.removeItem(this.storageKey);
      } else {
        this.storage.setItem(this.storageKey, String(id));
      }
    } catch (error) {
      // Ignore persistence errors
    }
  }

  private restoreSelectedChainId(): number | null {
    if (!this.storage) {
      return null;
    }

    try {
      const storedValue = this.storage.getItem(this.storageKey);
      if (storedValue === null) {
        return null;
      }

      const parsed = Number.parseInt(storedValue, 10);
      return Number.isNaN(parsed) ? null : parsed;
    } catch (error) {
      return null;
    }
  }

  private resolveStorage(): Storage | null {
    if (typeof globalThis === 'undefined') {
      return null;
    }

    try {
      const storage = globalThis.localStorage;
      const testKey = '__admin_chain_context__';
      storage.setItem(testKey, '1');
      storage.removeItem(testKey);
      return storage;
    } catch (error) {
      return null;
    }
  }

  private sortChains(chains: Chain[]): Chain[] {
    return [...chains].sort((a, b) => a.name.localeCompare(b.name));
  }
}
