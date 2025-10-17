import { AsyncPipe, CurrencyPipe, DecimalPipe, NgIf } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { TranslatePipe } from '../shared/translate.pipe';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';
import { OrderService } from '../orders/order.service';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  distinctUntilChanged,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import { Order } from '../core/models';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

Chart.register(...registerables);

type AggregatedDataset = {
  orders: Order[];
  totalRevenue: number;
  averageOrderValue: number;
  totalOrders: number;
  salesByDay: { label: string; total: number }[];
  scenarioBreakdown: { label: string; count: number; total: number }[];
  topItems: { label: string; quantity: number; total: number }[];
};

type ViewModel =
  | { state: 'loading' }
  | { state: 'empty' }
  | { state: 'error' }
  | ({ state: 'ready' } & AggregatedDataset);

type ReadyViewModel = Extract<ViewModel, { state: 'ready' }>;

@Component({
  standalone: true,
  selector: 'app-admin-reports',
  imports: [AsyncPipe, CurrencyPipe, DecimalPipe, NgIf, TranslatePipe],
  template: `
    <section class="card">
      <header class="section-header">
        <div>
          <h2>
            {{
              'admin.reports.title'
                | translate: 'Performance overview'
            }}
          </h2>
          <p>
            {{
              'admin.reports.subtitle'
                | translate:
                  'Track sales trends, channel performance, and menu best-sellers for your restaurant.'
            }}
          </p>
        </div>
        <div class="export-actions" *ngIf="(viewModel$ | async) as vm">
          <button type="button" class="ghost" (click)="export('csv')" [disabled]="vm.state !== 'ready' || exporting()">
            {{ 'admin.reports.exportCsv' | translate: 'Export CSV' }}
          </button>
          <button type="button" class="ghost" (click)="export('xlsx')" [disabled]="vm.state !== 'ready' || exporting()">
            {{ 'admin.reports.exportXlsx' | translate: 'Export XLSX' }}
          </button>
          <button type="button" class="ghost" (click)="export('pdf')" [disabled]="vm.state !== 'ready' || exporting()">
            {{ 'admin.reports.exportPdf' | translate: 'Export PDF' }}
          </button>
        </div>
      </header>

      <ng-container *ngIf="viewModel$ | async as vm">
        <div *ngIf="vm.state === 'loading'" class="state-message">
          <span class="spinner" aria-hidden="true"></span>
          <p>{{ 'admin.reports.loading' | translate: 'Loading analytics…' }}</p>
        </div>

        <div *ngIf="vm.state === 'error'" class="state-message error">
          <p>{{ 'admin.reports.error' | translate: 'We could not load the analytics right now.' }}</p>
          <button type="button" class="primary" (click)="reload()">
            {{ 'admin.reports.retry' | translate: 'Try again' }}
          </button>
        </div>

        <div *ngIf="vm.state === 'empty'" class="state-message empty">
          <p>
            {{
              'admin.reports.empty'
                | translate: 'Select a restaurant with recent orders to see analytics.'
            }}
          </p>
        </div>

        <ng-container *ngIf="vm.state === 'ready'">
          <div class="quick-stats">
            <div>
              <h3>{{ 'admin.reports.totalRevenue' | translate: 'Total revenue' }}</h3>
              <p>{{ vm.totalRevenue | currency }}</p>
            </div>
            <div>
              <h3>{{ 'admin.reports.orderCount' | translate: 'Orders' }}</h3>
              <p>{{ vm.totalOrders | number }}</p>
            </div>
            <div>
              <h3>{{ 'admin.reports.averageOrder' | translate: 'Avg. order value' }}</h3>
              <p>{{ vm.averageOrderValue | currency }}</p>
            </div>
          </div>

          <div class="charts-grid">
            <article class="chart-card">
              <header>
                <h3>{{ 'admin.reports.salesTrend' | translate: 'Sales trend' }}</h3>
                <p>{{ 'admin.reports.salesTrendHint' | translate: 'Revenue by day' }}</p>
              </header>
              <canvas #salesChart></canvas>
            </article>

            <article class="chart-card">
              <header>
                <h3>{{ 'admin.reports.scenarioMix' | translate: 'Order channels' }}</h3>
                <p>{{ 'admin.reports.scenarioMixHint' | translate: 'Breakdown by scenario' }}</p>
              </header>
              <canvas #scenarioChart></canvas>
            </article>

            <article class="chart-card full">
              <header>
                <h3>{{ 'admin.reports.topItems' | translate: 'Menu best-sellers' }}</h3>
                <p>{{ 'admin.reports.topItemsHint' | translate: 'Top 5 items by revenue' }}</p>
              </header>
              <ng-container *ngIf="vm.topItems.length; else noItems">
                <canvas #itemsChart></canvas>
              </ng-container>
              <ng-template #noItems>
                <div class="state-message empty">
                  <p>{{ 'admin.reports.noItems' | translate: 'No menu item data available yet.' }}</p>
                </div>
              </ng-template>
            </article>
          </div>
        </ng-container>
      </ng-container>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      section.card {
        background: var(--surface);
        border-radius: var(--radius-card);
        padding: clamp(1.75rem, 3vw, 2.5rem);
        box-shadow: var(--shadow-soft);
        border: 1px solid rgba(10, 10, 10, 0.05);
        display: flex;
        flex-direction: column;
        gap: clamp(1.5rem, 3vw, 2rem);
      }

      .section-header {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      @media (min-width: 768px) {
        .section-header {
          flex-direction: row;
          justify-content: space-between;
          align-items: flex-start;
        }
      }

      .section-header h2 {
        margin: 0;
        font-size: clamp(1.8rem, 3vw, 2.2rem);
      }

      .section-header p {
        margin: 0.35rem 0 0;
        color: var(--text-secondary);
        max-width: 520px;
      }

      .export-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }

      button.primary,
      button.ghost {
        appearance: none;
        border-radius: 999px;
        padding: 0.6rem 1.1rem;
        font-weight: 600;
        border: none;
        cursor: pointer;
        transition: transform 150ms ease, box-shadow 150ms ease, background 150ms ease;
      }

      button.primary {
        background: var(--brand-green, #06c167);
        color: white;
      }

      button.primary:hover,
      button.primary:focus-visible {
        transform: translateY(-1px);
        box-shadow: 0 10px 24px rgba(var(--brand-green-rgb, 6, 193, 103), 0.25);
        outline: none;
      }

      button.ghost {
        background: rgba(10, 10, 10, 0.04);
        color: inherit;
      }

      button.ghost:hover,
      button.ghost:focus-visible {
        background: rgba(10, 10, 10, 0.08);
        transform: translateY(-1px);
        outline: none;
      }

      button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      .state-message {
        display: grid;
        place-items: center;
        gap: 0.5rem;
        min-height: 180px;
        text-align: center;
        color: var(--text-secondary);
      }

      .state-message.error {
        color: #c43d3d;
      }

      .state-message.empty {
        color: var(--text-secondary);
      }

      .spinner {
        width: 2rem;
        height: 2rem;
        border: 0.25rem solid rgba(10, 10, 10, 0.1);
        border-top-color: var(--brand-green, #06c167);
        border-radius: 999px;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      .quick-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 1rem;
      }

      .quick-stats h3 {
        margin: 0 0 0.35rem;
        font-size: 0.95rem;
        color: var(--text-secondary);
      }

      .quick-stats p {
        margin: 0;
        font-size: clamp(1.4rem, 3vw, 1.75rem);
        font-weight: 600;
      }

      .charts-grid {
        display: grid;
        gap: clamp(1.25rem, 3vw, 1.75rem);
      }

      @media (min-width: 900px) {
        .charts-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .chart-card.full {
          grid-column: span 2;
        }
      }

      .chart-card {
        background: rgba(10, 10, 10, 0.03);
        border-radius: 1rem;
        padding: clamp(1.25rem, 3vw, 1.75rem);
        border: 1px solid rgba(10, 10, 10, 0.08);
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .chart-card canvas {
        width: 100%;
        min-height: 240px;
      }

      .chart-card header h3 {
        margin: 0;
        font-size: 1.1rem;
      }

      .chart-card header p {
        margin: 0.25rem 0 0;
        color: var(--text-secondary);
        font-size: 0.85rem;
      }
    `,
  ],
})
export class AdminReportsPage implements AfterViewInit, OnDestroy {
  private context = inject(AdminRestaurantContextService);
  private orderService = inject(OrderService);

  private destroy$ = new Subject<void>();
  private reloadTrigger$ = new BehaviorSubject<void>(undefined);

  private latestOrders: Order[] = [];
  private latestDataset: ReadyViewModel | null = null;
  private salesChart: Chart | null = null;
  private scenarioChart: Chart | null = null;
  private itemsChart: Chart | null = null;

  private salesChartElement?: ElementRef<HTMLCanvasElement>;
  private scenarioChartElement?: ElementRef<HTMLCanvasElement>;
  private itemsChartElement?: ElementRef<HTMLCanvasElement>;
  private renderQueued = false;

  private exportingSignal = signal(false);

  @ViewChild('salesChart')
  set salesChartRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.salesChartElement = ref;
    this.scheduleRender();
  }

  @ViewChild('scenarioChart')
  set scenarioChartRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.scenarioChartElement = ref;
    this.scheduleRender();
  }

  @ViewChild('itemsChart')
  set itemsChartRef(ref: ElementRef<HTMLCanvasElement> | undefined) {
    this.itemsChartElement = ref;
    this.scheduleRender();
  }

  readonly exporting = this.exportingSignal.asReadonly();

  readonly viewModel$: Observable<ViewModel> = this.context.selectedRestaurantId$.pipe(
    distinctUntilChanged(),
    switchMap(restaurantId => {
      if (restaurantId === null) {
        return of<ViewModel>({ state: 'empty' });
      }

      return this.reloadTrigger$.pipe(
        switchMap(() =>
          this.orderService.listForRestaurant(restaurantId).pipe(
            map(orders => this.buildAggregatedDataset(orders)),
            map(dataset => ({ state: 'ready', ...dataset } as ViewModel)),
            catchError(error => {
              console.error('Failed to load analytics', error);
              return of<ViewModel>({ state: 'error' });
            }),
            startWith<ViewModel>({ state: 'loading' })
          )
        )
      );
    })
  ).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  ngAfterViewInit(): void {
    this.viewModel$
      .pipe(
        takeUntil(this.destroy$),
        tap(vm => {
          if (vm.state === 'ready') {
            this.latestOrders = vm.orders;
            this.latestDataset = vm;
            this.scheduleRender();
          } else {
            this.latestOrders = [];
            this.latestDataset = null;
            this.destroyCharts();
          }
        })
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroyCharts();
  }

  reload(): void {
    this.reloadTrigger$.next(undefined);
  }

  export(format: 'csv' | 'xlsx' | 'pdf'): void {
    if (!this.latestOrders.length || this.exporting()) {
      return;
    }

    this.exportingSignal.set(true);

    try {
      const dataset = this.latestOrders.map(order => ({
        id: order.id,
        created_at: order.created_at,
        scenario: order.scenario ?? 'unknown',
        status: order.status,
        total: order.total_cents / 100,
      }));

      switch (format) {
        case 'csv':
          this.exportCsv(dataset);
          break;
        case 'xlsx':
          this.exportXlsx(dataset);
          break;
        case 'pdf':
          this.exportPdf(dataset);
          break;
      }
    } finally {
      this.exportingSignal.set(false);
    }
  }

  private exportCsv(rows: { id: number; created_at: string; scenario: string; status: string; total: number }[]) {
    const header = 'Order ID,Created At,Scenario,Status,Total';
    const body = rows
      .map(row =>
        [row.id, row.created_at, row.scenario, row.status, row.total.toFixed(2)]
          .map(value => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `restaurant-report-${this.timestamp()}.csv`);
  }

  private exportXlsx(rows: { id: number; created_at: string; scenario: string; status: string; total: number }[]) {
    const worksheet = XLSX.utils.json_to_sheet(
      rows.map(row => ({
        'Order ID': row.id,
        'Created At': row.created_at,
        Scenario: row.scenario,
        Status: row.status,
        Total: row.total,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    this.downloadBlob(blob, `restaurant-report-${this.timestamp()}.xlsx`);
  }

  private exportPdf(rows: { id: number; created_at: string; scenario: string; status: string; total: number }[]) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt' });
    const margin = 40;
    const lineHeight = 18;
    let y = margin;

    doc.setFontSize(18);
    doc.text('Restaurant orders report', margin, y);
    y += lineHeight * 1.5;

    doc.setFontSize(11);
    rows.forEach((row, index) => {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }

      doc.text(
        `#${row.id} • ${new Date(row.created_at).toLocaleString()} • ${row.scenario} • ${row.status} • ${row.total.toFixed(2)}`,
        margin,
        y
      );
      y += lineHeight;

      if (index === rows.length - 1) {
        doc.text(`Exported on ${new Date().toLocaleString()}`, margin, y + lineHeight);
      }
    });

    if (!rows.length) {
      doc.text('No orders available for this restaurant.', margin, y);
    }

    doc.save(`restaurant-report-${this.timestamp()}.pdf`);
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  private timestamp(): string {
    return new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
  }

  private buildAggregatedDataset(orders: Order[]): AggregatedDataset {
    if (!orders.length) {
      return {
        orders,
        totalRevenue: 0,
        averageOrderValue: 0,
        totalOrders: 0,
        salesByDay: [],
        scenarioBreakdown: [],
        topItems: [],
      };
    }

    const totalRevenue = orders.reduce((acc, order) => acc + order.total_cents, 0) / 100;
    const salesByDayMap = new Map<string, number>();
    const scenarioMap = new Map<string, { count: number; total: number }>();
    const itemMap = new Map<string, { quantity: number; total: number }>();

    for (const order of orders) {
      const dateKey = order.created_at ? order.created_at.slice(0, 10) : '';
      const currentValue = salesByDayMap.get(dateKey) ?? 0;
      salesByDayMap.set(dateKey, currentValue + order.total_cents / 100);

      const scenario = order.scenario ?? 'unknown';
      const scenarioEntry = scenarioMap.get(scenario) ?? { count: 0, total: 0 };
      scenarioEntry.count += 1;
      scenarioEntry.total += order.total_cents / 100;
      scenarioMap.set(scenario, scenarioEntry);

      for (const item of order.order_items ?? []) {
        const label = item.menu_item?.name ?? `Item #${item.menu_item_id}`;
        const entry = itemMap.get(label) ?? { quantity: 0, total: 0 };
        entry.quantity += item.quantity;
        entry.total += (item.price_cents * item.quantity) / 100;
        itemMap.set(label, entry);
      }
    }

    const salesByDay = Array.from(salesByDayMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, total]) => ({ label: this.formatDisplayDate(key), total }));

    const scenarioBreakdown = Array.from(scenarioMap.entries()).map(([label, value]) => ({
      label: this.formatScenarioLabel(label),
      count: value.count,
      total: value.total,
    }));

    const topItems = Array.from(itemMap.entries())
      .map(([label, value]) => ({ label, quantity: value.quantity, total: value.total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      orders,
      totalRevenue,
      averageOrderValue: totalRevenue / orders.length,
      totalOrders: orders.length,
      salesByDay,
      scenarioBreakdown,
      topItems,
    };
  }

  private renderCharts(dataset: AggregatedDataset): void {
    const salesCtx = this.salesChartElement?.nativeElement.getContext('2d');
    const scenarioCtx = this.scenarioChartElement?.nativeElement.getContext('2d');
    const itemsCtx = this.itemsChartElement?.nativeElement.getContext('2d');

    if (salesCtx) {
      this.salesChart?.destroy();
      this.salesChart = new Chart(salesCtx, this.buildLineChartConfig(dataset.salesByDay));
    }

    if (scenarioCtx) {
      this.scenarioChart?.destroy();
      this.scenarioChart = new Chart(scenarioCtx, this.buildDoughnutConfig(dataset.scenarioBreakdown));
    }

    if (itemsCtx && dataset.topItems.length) {
      this.itemsChart?.destroy();
      this.itemsChart = new Chart(itemsCtx, this.buildBarChartConfig(dataset.topItems));
    } else if (this.itemsChart) {
      this.itemsChart.destroy();
      this.itemsChart = null;
    }
  }

  private destroyCharts(): void {
    this.salesChart?.destroy();
    this.scenarioChart?.destroy();
    this.itemsChart?.destroy();
    this.salesChart = null;
    this.scenarioChart = null;
    this.itemsChart = null;
  }

  private scheduleRender(): void {
    if (this.renderQueued) {
      return;
    }

    this.renderQueued = true;
    Promise.resolve().then(() => {
      this.renderQueued = false;

      if (!this.latestDataset) {
        return;
      }

      if (!this.salesChartElement || !this.scenarioChartElement) {
        return;
      }
      this.renderCharts(this.latestDataset);
    });
  }

  private buildLineChartConfig(data: { label: string; total: number }[]): ChartConfiguration<'line'> {
    return {
      type: 'line',
      data: {
        labels: data.map(entry => entry.label),
        datasets: [
          {
            label: 'Revenue',
            data: data.map(entry => entry.total),
            borderColor: '#06c167',
            backgroundColor: 'rgba(6, 193, 103, 0.18)',
            tension: 0.35,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            ticks: {
              callback: value => this.formatCurrencyTick(value),
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: context => {
                const value = context.parsed.y;
                if (typeof value === 'number' && Number.isFinite(value)) {
                  return `$${value.toFixed(2)}`;
                }
                return '';
              },
            },
          },
        },
      },
    };
  }

  private buildDoughnutConfig(data: {
    label: string;
    count: number;
    total: number;
  }[]): ChartConfiguration<'doughnut'> {
    const labels = data.map(entry => `${entry.label} (${entry.count})`);
    const values = data.map(entry => entry.total);
    const palette = ['#06c167', '#0f7b6c', '#ec950f', '#ea5a4f', '#4d64ff'];

    return {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: values,
            backgroundColor: values.map((_, index) => palette[index % palette.length]),
            hoverOffset: 10,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: context => {
                const value = context.parsed;
                const formatted =
                  typeof value === 'number' && Number.isFinite(value)
                    ? `$${value.toFixed(2)}`
                    : '$0.00';
                return `${context.label}: ${formatted}`;
              },
            },
          },
        },
      },
    };
  }

  private buildBarChartConfig(data: {
    label: string;
    quantity: number;
    total: number;
  }[]): ChartConfiguration<'bar'> {
    return {
      type: 'bar',
      data: {
        labels: data.map(entry => entry.label),
        datasets: [
          {
            label: 'Revenue',
            data: data.map(entry => entry.total),
            backgroundColor: 'rgba(6, 193, 103, 0.75)',
            borderRadius: 6,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: context => {
                const value = context.parsed.x;
                const formatted =
                  typeof value === 'number' && Number.isFinite(value)
                    ? `$${value.toFixed(2)}`
                    : '$0.00';
                return `${formatted} • ${data[context.dataIndex].quantity} sold`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              callback: value => this.formatCurrencyTick(value),
            },
          },
        },
      },
    };
  }

  private formatCurrencyTick(value: unknown): string {
    const numeric =
      typeof value === 'number' ? value : typeof value === 'string' ? Number.parseFloat(value) : 0;
    if (!Number.isFinite(numeric)) {
      return '$0';
    }
    return `$${numeric.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  }

  private formatDisplayDate(key: string): string {
    if (!key) {
      return 'Unknown date';
    }

    const date = new Date(key);
    if (Number.isNaN(date.getTime())) {
      return key;
    }

    return date.toLocaleDateString();
  }

  private formatScenarioLabel(label: string): string {
    if (!label) {
      return 'Unknown';
    }

    return label.charAt(0).toUpperCase() + label.slice(1);
  }
}
