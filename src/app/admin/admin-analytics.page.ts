import { CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  finalize,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { SalesPipelineReport } from '../core/models';
import { TranslatePipe } from '../shared/translate.pipe';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';

interface TimeframeFormValue {
  start: string;
  end: string;
}

interface NormalizedTimeframe {
  start: string;
  end: string;
}

@Component({
  standalone: true,
  selector: 'app-admin-analytics',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf, ReactiveFormsModule, TranslatePipe],
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      gap: clamp(1.5rem, 4vw, 2.5rem);
    }

    section.card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: clamp(1.75rem, 3vw, 2.5rem);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.06);
      display: flex;
      flex-direction: column;
      gap: clamp(1.25rem, 3vw, 2rem);
    }

    section.card header {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    section.card header h3,
    .section-title {
      margin: 0;
      font-size: clamp(1.6rem, 3vw, 2rem);
      letter-spacing: -0.02em;
    }

    section.card header p {
      margin: 0;
      color: var(--text-secondary);
      max-width: 640px;
    }

    form.timeframe-form {
      display: flex;
      flex-direction: column;
      gap: clamp(1rem, 2vw, 1.5rem);
    }

    .timeframe-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    }

    .timeframe-grid label {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.9rem;
      color: var(--text-secondary);
    }

    .timeframe-grid label span {
      font-weight: 600;
      color: var(--text-primary);
    }

    .timeframe-grid input[type='date'] {
      padding: 0.55rem 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid var(--border-soft, rgba(10, 10, 10, 0.12));
      font: inherit;
      background: rgba(255, 255, 255, 0.9);
      color: inherit;
    }

    .timeframe-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .timeframe-actions button {
      border: 1px solid rgba(var(--brand-green-rgb, 6, 193, 103), 0.35);
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
      color: var(--brand-green, #06c167);
      padding: 0.45rem 0.9rem;
      border-radius: 999px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 150ms ease, box-shadow 150ms ease;
    }

    .timeframe-actions button:hover,
    .timeframe-actions button:focus-visible {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
      box-shadow: 0 6px 18px rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
      outline: none;
    }

    .export-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .export-actions button {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.55rem 1.1rem;
      border-radius: 999px;
      border: 1px solid rgba(10, 10, 10, 0.12);
      background: rgba(10, 10, 10, 0.04);
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease, box-shadow 0.2s ease;
    }

    .export-actions button:hover,
    .export-actions button:focus-visible {
      background: rgba(10, 10, 10, 0.08);
      box-shadow: 0 6px 16px rgba(10, 10, 10, 0.12);
      outline: none;
    }

    .loading,
    .error-state,
    .empty-state {
      background: rgba(10, 10, 10, 0.04);
      border-radius: 1rem;
      padding: clamp(1.5rem, 3vw, 2rem);
      border: 1px solid rgba(10, 10, 10, 0.06);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .error-state button {
      padding: 0.55rem 1.1rem;
      border-radius: 999px;
      border: none;
      background: var(--brand-green, #06c167);
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 150ms ease;
    }

    .error-state button:hover,
    .error-state button:focus-visible {
      background: color-mix(in srgb, var(--brand-green) 85%, black);
      outline: none;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: clamp(1rem, 3vw, 2rem);
    }

    .metric-card {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.06);
      border-radius: 1rem;
      padding: 1.25rem;
      border: 1px solid rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .metric-card span.label {
      font-size: 0.9rem;
      color: var(--text-secondary);
      font-weight: 600;
    }

    .metric-card span.value {
      font-size: clamp(1.6rem, 4vw, 2.25rem);
      font-weight: 700;
      letter-spacing: -0.02em;
    }

    .breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }

    .breakdown-item {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .breakdown-header {
      display: flex;
      justify-content: space-between;
      gap: 0.5rem;
      font-weight: 600;
    }

    .bar-track {
      position: relative;
      background: rgba(10, 10, 10, 0.08);
      border-radius: 999px;
      overflow: hidden;
      height: 0.6rem;
    }

    .bar-fill {
      position: absolute;
      inset: 0;
      background: var(--brand-green, #06c167);
      transform-origin: left;
    }

    .daily-grid {
      display: grid;
      gap: 0.85rem;
    }

    .daily-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 120px) minmax(0, 160px);
      gap: 0.75rem;
      align-items: center;
    }

    .daily-row .bars {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.35rem;
    }

    .daily-row .bars .bar-track {
      height: 0.45rem;
      background: rgba(10, 10, 10, 0.06);
    }

    .daily-row .bars .bar-fill.orders {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.75);
    }

    .daily-row .bars .bar-fill.revenue {
      background: rgba(10, 118, 255, 0.65);
    }

    table.simple-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
    }

    table.simple-table th,
    table.simple-table td {
      text-align: left;
      padding: 0.5rem 0.35rem;
    }

    table.simple-table tbody tr:nth-child(even) {
      background: rgba(10, 10, 10, 0.03);
    }

    @media (max-width: 720px) {
      .daily-row {
        grid-template-columns: minmax(0, 1fr);
      }

      .daily-row .bars {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `],
  template: `
    <section class="card">
      <header>
        <h3>{{ 'admin.analytics.heading' | translate: 'Reports & analytics' }}</h3>
        <p>
          {{
            'admin.analytics.description'
              | translate:
                  'Analyse order trends, understand bottlenecks and export data-backed insights for your restaurant.'
          }}
        </p>
      </header>

      <form class="timeframe-form" [formGroup]="timeframeForm">
        <div class="timeframe-grid">
          <label>
            <span>{{ 'admin.analytics.timeframe.start' | translate: 'Start date' }}</span>
            <input type="date" formControlName="start" />
          </label>
          <label>
            <span>{{ 'admin.analytics.timeframe.end' | translate: 'End date' }}</span>
            <input type="date" formControlName="end" />
          </label>
        </div>
        <div class="timeframe-actions">
          <button type="button" (click)="applyPresetDays(7)">
            {{ 'admin.analytics.timeframe.last7' | translate: 'Last 7 days' }}
          </button>
          <button type="button" (click)="applyPresetDays(30)">
            {{ 'admin.analytics.timeframe.last30' | translate: 'Last 30 days' }}
          </button>
          <button type="button" (click)="applyCurrentMonth()">
            {{ 'admin.analytics.timeframe.thisMonth' | translate: 'This month' }}
          </button>
        </div>
      </form>

      <div class="export-actions" *ngIf="report">
        <button type="button" (click)="exportCsv()">
          {{ 'admin.analytics.export.csv' | translate: 'Export CSV' }}
        </button>
        <button type="button" (click)="exportXlsx()">
          {{ 'admin.analytics.export.xlsx' | translate: 'Export XLSX' }}
        </button>
        <button type="button" (click)="exportPdf()">
          {{ 'admin.analytics.export.pdf' | translate: 'Export PDF' }}
        </button>
      </div>
    </section>

    <div class="loading" *ngIf="loading">
      {{ 'admin.analytics.loading' | translate: 'Loading analytics…' }}
    </div>

    <div class="error-state" *ngIf="error">
      <strong>
        {{ 'admin.analytics.error' | translate: 'We could not load the analytics for this timeframe.' }}
      </strong>
      <button type="button" (click)="retry()">
        {{ 'admin.analytics.retry' | translate: 'Retry' }}
      </button>
    </div>

    <div class="empty-state" *ngIf="!loading && !error && !report">
      {{ 'admin.analytics.noData' | translate: 'Select a restaurant to view analytics.' }}
    </div>

    <ng-container *ngIf="report as reportData">
      <section class="card">
        <header>
          <h4 class="section-title">
            {{ 'admin.analytics.performance' | translate: 'Performance overview' }}
          </h4>
          <p>
            {{ 'admin.analytics.timeframe.label' | translate: 'Timeframe' }}:
            {{ reportData.timeframe.start_date | date:'mediumDate' }} →
            {{ reportData.timeframe.end_date | date:'mediumDate' }}
          </p>
        </header>
        <div class="metrics-grid">
          <div class="metric-card">
            <span class="label">{{ 'admin.analytics.totals.orders' | translate: 'Total orders' }}</span>
            <span class="value">{{ reportData.totals.orders | number }}</span>
          </div>
          <div class="metric-card">
            <span class="label">{{ 'admin.analytics.totals.revenue' | translate: 'Revenue' }}</span>
            <span class="value">{{ reportData.totals.revenue_cents / 100 | currency:'EUR' }}</span>
          </div>
          <div class="metric-card">
            <span class="label">
              {{ 'admin.analytics.totals.averageOrderValue' | translate: 'Average order value' }}
            </span>
            <span class="value">{{ reportData.totals.average_order_value_cents / 100 | currency:'EUR' }}</span>
          </div>
        </div>
      </section>

      <section class="card">
        <header>
          <h4 class="section-title">
            {{ 'admin.analytics.statusBreakdown' | translate: 'Orders by current status' }}
          </h4>
          <p>
            {{ 'admin.analytics.statusBreakdown.helper' | translate: 'Understand where orders spend most of their time.' }}
          </p>
        </header>
        <div class="breakdown-list">
          <div class="breakdown-item" *ngFor="let item of reportData.status_breakdown">
            <div class="breakdown-header">
              <span>{{ 'admin.analytics.status.' + item.status | translate: item.status }}</span>
              <span>{{ item.order_count | number }} · {{ percentage(item.order_count, reportData.totals.orders) | number:'1.0-1' }}%</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" [style.width.%]="percentage(item.order_count, reportData.totals.orders)"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <header>
          <h4 class="section-title">
            {{ 'admin.analytics.statusProgression' | translate: 'Pipeline progression' }}
          </h4>
          <p>
            {{ 'admin.analytics.statusProgression.helper' | translate: 'Track how many orders reach each state over time.' }}
          </p>
        </header>
        <div class="breakdown-list">
          <div class="breakdown-item" *ngFor="let item of reportData.status_progression">
            <div class="breakdown-header">
              <span>{{ 'admin.analytics.status.' + item.status | translate: item.status }}</span>
              <span>{{ item.order_count | number }}</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" [style.width.%]="barWidth(item.order_count, maxStatusProgression)"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <header>
          <h4 class="section-title">
            {{ 'admin.analytics.scenarioBreakdown' | translate: 'Orders by scenario' }}
          </h4>
          <p>
            {{ 'admin.analytics.scenarioBreakdown.helper' | translate: 'Discover which fulfilment types your customers prefer.' }}
          </p>
        </header>
        <div class="breakdown-list">
          <div class="breakdown-item" *ngFor="let item of reportData.scenario_breakdown">
            <div class="breakdown-header">
              <span>{{ 'admin.analytics.scenario.' + item.scenario | translate: item.scenario }}</span>
              <span>{{ item.order_count | number }} · {{ percentage(item.order_count, reportData.totals.orders) | number:'1.0-1' }}%</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" [style.width.%]="percentage(item.order_count, reportData.totals.orders)"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <header>
          <h4 class="section-title">
            {{ 'admin.analytics.targetTimeBreakdown' | translate: 'Orders by target time' }}
          </h4>
          <p>
            {{ 'admin.analytics.targetTimeBreakdown.helper' | translate: 'Compare ASAP orders with scheduled fulfilment.' }}
          </p>
        </header>
        <div class="breakdown-list">
          <div class="breakdown-item" *ngFor="let item of reportData.target_time_type_breakdown">
            <div class="breakdown-header">
              <span>{{ 'admin.analytics.target.' + item.target_time_type | translate: item.target_time_type }}</span>
              <span>{{ item.order_count | number }} · {{ percentage(item.order_count, reportData.totals.orders) | number:'1.0-1' }}%</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" [style.width.%]="percentage(item.order_count, reportData.totals.orders)"></div>
            </div>
          </div>
        </div>
      </section>

      <section class="card">
        <header>
          <h4 class="section-title">
            {{ 'admin.analytics.dailyTotals' | translate: 'Daily totals' }}
          </h4>
          <p>
            {{ 'admin.analytics.dailyTotals.helper' | translate: 'Visualise day-by-day volumes to spot peaks or dips.' }}
          </p>
        </header>
        <div class="daily-grid">
          <div class="daily-row" *ngFor="let day of reportData.daily_totals">
            <strong>{{ day.date | date:'EEE d MMM' }}</strong>
            <div class="bars">
              <div class="bar-track">
                <div class="bar-fill orders" [style.width.%]="barWidth(day.order_count, maxDailyOrders)"></div>
              </div>
              <div class="bar-track">
                <div class="bar-fill revenue" [style.width.%]="barWidth(day.revenue_cents, maxDailyRevenue)"></div>
              </div>
            </div>
            <div>
              <div>{{ day.order_count | number }} {{ 'admin.analytics.table.orders' | translate: 'orders' }}</div>
              <div>{{ day.revenue_cents / 100 | currency:'EUR' }}</div>
            </div>
          </div>
        </div>
      </section>
    </ng-container>
  `,
})
export class AdminAnalyticsPage {
  private context = inject(AdminRestaurantContextService);
  private analytics = inject(AdminAnalyticsService);
  private fb = inject(FormBuilder);
  private refresh$ = new BehaviorSubject<void>(undefined);

  readonly selectedRestaurant$ = this.context.selectedRestaurant$;

  readonly timeframeForm = this.fb.nonNullable.group({
    start: this.toDateInputValue(this.defaultStartDate()),
    end: this.toDateInputValue(new Date()),
  });

  report: SalesPipelineReport | null = null;
  loading = false;
  error = false;

  maxStatusProgression = 0;
  maxDailyOrders = 0;
  maxDailyRevenue = 0;

  private normalizedTimeframe: NormalizedTimeframe = this.normalizeTimeframe(
    this.timeframeForm.getRawValue()
  );

  constructor() {
    const timeframeChanges$ = this.timeframeForm.valueChanges.pipe(
      startWith(this.timeframeForm.getRawValue())
    );

    combineLatest([
      this.context.selectedRestaurantId$.pipe(filter((id): id is number => id !== null)),
      timeframeChanges$,
      this.refresh$,
    ])
      .pipe(
        switchMap(([restaurantId, timeframe]) => {
          const normalized = this.normalizeTimeframe(timeframe);
          this.normalizedTimeframe = normalized;
          this.loading = true;
          this.error = false;

          return this.analytics
            .getSalesPipeline(restaurantId, normalized.start, normalized.end)
            .pipe(
              catchError(error => {
                console.error('Failed to load sales pipeline report', error);
                this.error = true;
                return of(null);
              }),
              finalize(() => {
                this.loading = false;
              })
            );
        }),
        takeUntilDestroyed()
      )
      .subscribe(report => {
        if (report) {
          this.report = report;
          this.updateDerivedMetrics(report);
        } else {
          this.report = null;
          this.maxStatusProgression = 0;
          this.maxDailyOrders = 0;
          this.maxDailyRevenue = 0;
        }
      });
  }

  percentage(value: number, total: number): number {
    if (!total) {
      return 0;
    }
    return Math.round((value / total) * 1000) / 10;
  }

  barWidth(value: number, max: number): number {
    if (!max) {
      return 0;
    }
    return Math.max(0, Math.min(100, (value / max) * 100));
  }

  applyPresetDays(days: number): void {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    this.timeframeForm.patchValue({
      start: this.toDateInputValue(start),
      end: this.toDateInputValue(end),
    });
  }

  applyCurrentMonth(): void {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
    this.timeframeForm.patchValue({
      start: this.toDateInputValue(start),
      end: this.toDateInputValue(end),
    });
  }

  retry(): void {
    this.refresh$.next();
  }

  exportCsv(): void {
    if (!this.report) {
      return;
    }

    const report = this.report;
    const lines: string[][] = [];
    lines.push(['Timeframe start', this.normalizedTimeframe.start]);
    lines.push(['Timeframe end', this.normalizedTimeframe.end]);
    lines.push([]);

    lines.push(['Metric', 'Value']);
    lines.push(['Total orders', report.totals.orders.toString()]);
    lines.push(['Revenue (EUR)', (report.totals.revenue_cents / 100).toFixed(2)]);
    lines.push(['Average order value (EUR)', (report.totals.average_order_value_cents / 100).toFixed(2)]);
    lines.push([]);

    lines.push(['Status', 'Order count']);
    report.status_breakdown.forEach(item => {
      lines.push([item.status, item.order_count.toString()]);
    });
    lines.push([]);

    lines.push(['Pipeline status', 'Order count']);
    report.status_progression.forEach(item => {
      lines.push([item.status, item.order_count.toString()]);
    });
    lines.push([]);

    lines.push(['Scenario', 'Order count']);
    report.scenario_breakdown.forEach(item => {
      lines.push([item.scenario, item.order_count.toString()]);
    });
    lines.push([]);

    lines.push(['Target time', 'Order count']);
    report.target_time_type_breakdown.forEach(item => {
      lines.push([item.target_time_type, item.order_count.toString()]);
    });
    lines.push([]);

    lines.push(['Date', 'Order count', 'Revenue (EUR)']);
    report.daily_totals.forEach(day => {
      lines.push([day.date, day.order_count.toString(), (day.revenue_cents / 100).toFixed(2)]);
    });

    const csvContent = lines
      .map(row => row.map(value => this.escapeCsv(value)).join(','))
      .join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.saveBlob(blob, this.buildFilename('sales-pipeline', 'csv'));
  }

  exportXlsx(): void {
    if (!this.report) {
      return;
    }

    const report = this.report;

    void import('xlsx').then(({ utils, writeFile }) => {
      const workbook = utils.book_new();

      utils.book_append_sheet(
        workbook,
        utils.aoa_to_sheet([
          ['Timeframe start', this.normalizedTimeframe.start],
          ['Timeframe end', this.normalizedTimeframe.end],
          [],
          ['Metric', 'Value'],
          ['Total orders', report.totals.orders],
          ['Revenue (EUR)', (report.totals.revenue_cents / 100).toFixed(2)],
          ['Average order value (EUR)', (report.totals.average_order_value_cents / 100).toFixed(2)],
        ]),
        'Summary'
      );

      utils.book_append_sheet(
        workbook,
        utils.json_to_sheet(
          report.status_breakdown.map(item => ({
            Status: item.status,
            Orders: item.order_count,
          }))
        ),
        'Status breakdown'
      );

      utils.book_append_sheet(
        workbook,
        utils.json_to_sheet(
          report.status_progression.map(item => ({
            Status: item.status,
            Orders: item.order_count,
          }))
        ),
        'Pipeline progression'
      );

      utils.book_append_sheet(
        workbook,
        utils.json_to_sheet(
          report.scenario_breakdown.map(item => ({
            Scenario: item.scenario,
            Orders: item.order_count,
          }))
        ),
        'Scenarios'
      );

      utils.book_append_sheet(
        workbook,
        utils.json_to_sheet(
          report.target_time_type_breakdown.map(item => ({
            'Target time': item.target_time_type,
            Orders: item.order_count,
          }))
        ),
        'Target times'
      );

      utils.book_append_sheet(
        workbook,
        utils.json_to_sheet(
          report.daily_totals.map(day => ({
            Date: day.date,
            Orders: day.order_count,
            'Revenue (EUR)': (day.revenue_cents / 100).toFixed(2),
          }))
        ),
        'Daily totals'
      );

      writeFile(workbook, this.buildFilename('sales-pipeline', 'xlsx'));
    });
  }

  exportPdf(): void {
    if (!this.report) {
      return;
    }

    const report = this.report;

    void import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'pt' });
      const margin = 40;
      const lineHeight = 18;
      let y = margin;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Sales pipeline report', margin, y);
      y += lineHeight * 1.2;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(
        `Timeframe: ${this.normalizedTimeframe.start} → ${this.normalizedTimeframe.end}`,
        margin,
        y
      );
      y += lineHeight * 1.4;

      doc.setFont('helvetica', 'bold');
      doc.text('Totals', margin, y);
      y += lineHeight;
      doc.setFont('helvetica', 'normal');
      doc.text(`Orders: ${report.totals.orders}`, margin, y);
      y += lineHeight;
      doc.text(`Revenue (EUR): ${(report.totals.revenue_cents / 100).toFixed(2)}`, margin, y);
      y += lineHeight;
      doc.text(
        `Average order value (EUR): ${(report.totals.average_order_value_cents / 100).toFixed(2)}`,
        margin,
        y
      );
      y += lineHeight * 1.5;

      const addList = (title: string, rows: [string, string][]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(title, margin, y);
        y += lineHeight;
        doc.setFont('helvetica', 'normal');
        rows.forEach(([label, value]) => {
          if (y > doc.internal.pageSize.height - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(`${label}: ${value}`, margin, y);
          y += lineHeight;
        });
        y += lineHeight * 0.6;
      };

      addList(
        'Status breakdown',
        report.status_breakdown.map(item => [item.status, item.order_count.toString()])
      );
      addList(
        'Pipeline progression',
        report.status_progression.map(item => [item.status, item.order_count.toString()])
      );
      addList(
        'Scenario breakdown',
        report.scenario_breakdown.map(item => [item.scenario, item.order_count.toString()])
      );
      addList(
        'Target time breakdown',
        report.target_time_type_breakdown.map(item => [item.target_time_type, item.order_count.toString()])
      );
      addList(
        'Daily totals',
        report.daily_totals.map(day => [
          day.date,
          `${day.order_count} orders, EUR ${(day.revenue_cents / 100).toFixed(2)}`,
        ])
      );

      doc.save(this.buildFilename('sales-pipeline', 'pdf'));
    });
  }

  private updateDerivedMetrics(report: SalesPipelineReport): void {
    this.maxStatusProgression = report.status_progression.reduce(
      (max, item) => Math.max(max, item.order_count),
      0
    );
    this.maxDailyOrders = report.daily_totals.reduce(
      (max, day) => Math.max(max, day.order_count),
      0
    );
    this.maxDailyRevenue = report.daily_totals.reduce(
      (max, day) => Math.max(max, day.revenue_cents),
      0
    );
  }

  private defaultStartDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() - 29);
    return date;
  }

  private toDateInputValue(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private normalizeTimeframe(
    value: Partial<TimeframeFormValue> | null | undefined
  ): NormalizedTimeframe {
    const fallbackStart = this.toDateInputValue(this.defaultStartDate());
    const fallbackEnd = this.toDateInputValue(new Date());
    const start = value?.start ?? fallbackStart;
    const end = value?.end ?? fallbackEnd;

    if (start > end) {
      return { start: end, end: start };
    }

    return { start, end };
  }

  private escapeCsv(value: string | number): string {
    const stringValue = String(value ?? '');
    if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
      return '"' + stringValue.replace(/"/g, '""') + '"';
    }
    return stringValue;
  }

  private saveBlob(blob: Blob, filename: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private buildFilename(base: string, extension: string): string {
    return `${base}-${this.normalizedTimeframe.start}-to-${this.normalizedTimeframe.end}.${extension}`;
  }
}
