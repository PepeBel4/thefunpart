import { AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  distinctUntilChanged,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
} from 'rxjs';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';
import { SalesPipelineReport } from '../core/models';
import { TranslatePipe } from '../shared/translate.pipe';

interface ReportViewModel {
  report: SalesPipelineReport;
  statusBreakdownMax: number;
  statusProgressionMax: number;
  scenarioBreakdownMax: number;
  targetTimeTypeBreakdownMax: number;
  dailyTotalsMaxOrders: number;
  dailyTotalsMaxRevenue: number;
  hasDailyRevenue: boolean;
}

type ReportState =
  | { status: 'loading' }
  | { status: 'loaded'; viewModel: ReportViewModel }
  | { status: 'error' }
  | { status: 'invalid-range'; message: string }
  | { status: 'no-restaurant' };

@Component({
  standalone: true,
  selector: 'app-admin-reports',
  imports: [
    AsyncPipe,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    NgFor,
    NgIf,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      gap: clamp(1.5rem, 3vw, 2rem);
    }

    section.card {
      background: var(--surface);
      border-radius: var(--radius-card);
      padding: clamp(1.5rem, 3vw, 2.5rem);
      box-shadow: var(--shadow-soft);
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: clamp(1rem, 2vw, 1.5rem);
    }

    .filters-header {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .filters-header h2 {
      margin: 0;
      font-size: clamp(1.75rem, 3vw, 2.25rem);
      letter-spacing: -0.02em;
    }

    .filters-header p {
      margin: 0;
      color: var(--text-secondary);
      max-width: 640px;
    }

    .filters-form {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.75rem 1rem;
      align-items: end;
    }

    .filters-form label {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }

    .filters-form label span {
      font-weight: 600;
      color: var(--text-primary, inherit);
    }

    .filters-form input[type='date'] {
      padding: 0.55rem 0.75rem;
      border-radius: 0.65rem;
      border: 1px solid var(--border-soft);
      background: rgba(255, 255, 255, 0.85);
      font: inherit;
      color: inherit;
    }

    .filters-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .filters-actions button {
      padding: 0.55rem 1rem;
      border-radius: 999px;
      border: 1px solid rgba(var(--brand-green-rgb, 6, 193, 103), 0.4);
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.12);
      color: var(--brand-green, #06c167);
      cursor: pointer;
      font-weight: 600;
      transition: background-color 150ms ease, box-shadow 150ms ease;
    }

    .filters-actions button:hover,
    .filters-actions button:focus-visible {
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
      box-shadow: 0 8px 18px rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
      outline: none;
    }

    .state-card {
      align-items: center;
      text-align: center;
      color: var(--text-secondary);
    }

    .state-card.error {
      color: var(--danger, #b3261e);
    }

    .state-card.warning {
      color: var(--warning, #b26b16);
    }

    .totals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1.25rem;
    }

    .metric {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      padding: 1rem 1.25rem;
      border-radius: 1rem;
      border: 1px solid rgba(10, 10, 10, 0.08);
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.05);
    }

    .metric strong {
      font-size: 0.9rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .metric span {
      font-size: clamp(1.35rem, 3vw, 1.8rem);
      font-weight: 700;
      letter-spacing: -0.01em;
    }

    .metric small {
      color: var(--text-secondary);
      font-size: 0.8rem;
    }

    .breakdown-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: clamp(1rem, 2vw, 1.5rem);
    }

    .list-breakdown {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .list-breakdown h4 {
      margin: 0;
      font-size: 1.05rem;
    }

    .list-breakdown ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .list-breakdown li {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .list-breakdown li header {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      font-weight: 600;
    }

    .progress-bar {
      --progress: 0;
      position: relative;
      display: block;
      height: 0.6rem;
      border-radius: 999px;
      background: rgba(10, 10, 10, 0.08);
      overflow: hidden;
    }

    .progress-bar::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.5);
      transform-origin: left center;
      transform: scaleX(var(--progress));
      transition: transform 250ms ease;
    }

    .daily-chart {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: clamp(1rem, 2vw, 1.5rem);
    }

    .daily-chart section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .daily-chart ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      max-height: 360px;
      overflow-y: auto;
      padding-right: 0.25rem;
    }

    .daily-chart li {
      display: grid;
      grid-template-columns: 92px minmax(0, 1fr);
      gap: 0.75rem;
      align-items: center;
    }

    .daily-chart .bar-stack {
      display: grid;
      gap: 0.35rem;
    }

    .daily-chart .bar {
      --progress: 0;
      height: 0.5rem;
      border-radius: 999px;
      background: rgba(10, 10, 10, 0.08);
      position: relative;
      overflow: hidden;
    }

    .daily-chart .bar::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.55);
      transform-origin: left center;
      transform: scaleX(var(--progress));
      transition: transform 250ms ease;
    }

    .daily-chart .bar.revenue::after {
      background: rgba(10, 10, 10, 0.45);
    }

    .export-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }

    .export-buttons button {
      padding: 0.55rem 1rem;
      border-radius: 999px;
      border: 1px solid rgba(10, 10, 10, 0.1);
      background: white;
      cursor: pointer;
      font-weight: 600;
      transition: background-color 150ms ease, box-shadow 150ms ease;
    }

    .export-buttons button:hover,
    .export-buttons button:focus-visible {
      background: rgba(10, 10, 10, 0.05);
      box-shadow: 0 8px 16px rgba(10, 10, 10, 0.08);
      outline: none;
    }

    .empty-state {
      color: var(--text-secondary);
      font-style: italic;
    }

    @media (max-width: 600px) {
      .filters-actions {
        justify-content: stretch;
      }

      .filters-actions button {
        flex: 1 1 auto;
        text-align: center;
      }
    }

    .totals-header {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      align-items: center;
    }

    .totals-header h3 {
      margin: 0;
      font-size: 1.35rem;
    }

    .totals-header p {
      margin: 0.35rem 0 0;
      color: var(--text-secondary);
    }

    .section-title {
      margin: 0;
      font-size: 1.35rem;
    }

    .section-subtitle {
      margin: 0 0 0.5rem;
      font-size: 1.05rem;
    }
  `],
  template: `
    <section class="card">
      <div class="filters-header">
        <h2>{{ 'admin.reports.title' | translate: 'Reports & analytics' }}</h2>
        <p>
          {{
            'admin.reports.subtitle'
              | translate:
                  'Track order performance and revenue for the selected restaurant across any timeframe.'
          }}
        </p>
      </div>

      <form [formGroup]="filterForm" class="filters-form" novalidate>
        <label>
          <span>{{ 'admin.reports.startDate' | translate: 'Start date' }}</span>
          <input type="date" formControlName="startDate" />
        </label>
        <label>
          <span>{{ 'admin.reports.endDate' | translate: 'End date' }}</span>
          <input type="date" formControlName="endDate" />
        </label>
      </form>

      <div class="filters-actions">
        <button type="button" (click)="refresh()">
          {{ 'admin.reports.refresh' | translate: 'Refresh data' }}
        </button>
      </div>
    </section>

    <ng-container *ngIf="reportState$ | async as state">
      <section *ngIf="state.status === 'loading'" class="card state-card">
        <p>{{ 'admin.reports.loading' | translate: 'Loading analytics…' }}</p>
      </section>

      <section *ngIf="state.status === 'error'" class="card state-card error">
        <p>{{ 'admin.reports.error' | translate: 'Could not load analytics. Please try again.' }}</p>
        <button type="button" (click)="refresh()">
          {{ 'admin.reports.retry' | translate: 'Retry' }}
        </button>
      </section>

      <section *ngIf="state.status === 'invalid-range'" class="card state-card warning">
        <p>{{ state.message }}</p>
      </section>

      <section *ngIf="state.status === 'no-restaurant'" class="card state-card">
        <p>
          {{
            'admin.reports.noRestaurant'
              | translate: 'Select a restaurant to explore analytics.'
          }}
        </p>
      </section>

      <ng-container *ngIf="state.status === 'loaded'">
        <section class="card">
          <header class="totals-header">
            <div>
              <h3>{{ 'admin.reports.totalsTitle' | translate: 'Key totals' }}</h3>
              <p>
                {{
                  'admin.reports.periodLabel'
                    | translate:
                        ('Reporting period: ' + (state.viewModel.report.timeframe.start_date | date: 'mediumDate') + ' – ' +
                        (state.viewModel.report.timeframe.end_date | date: 'mediumDate'))
                }}
              </p>
            </div>
            <div class="export-buttons">
              <button type="button" (click)="exportAsCsv(state.viewModel.report)">
                {{ 'admin.reports.exportCsv' | translate: 'Export CSV' }}
              </button>
              <button type="button" (click)="exportAsXlsx(state.viewModel.report)">
                {{ 'admin.reports.exportXlsx' | translate: 'Export XLSX' }}
              </button>
              <button type="button" (click)="exportAsPdf(state.viewModel.report)">
                {{ 'admin.reports.exportPdf' | translate: 'Export PDF' }}
              </button>
            </div>
          </header>

          <div class="totals-grid">
            <div class="metric">
              <strong>{{ 'admin.reports.totalOrders' | translate: 'Orders' }}</strong>
              <span>{{ state.viewModel.report.totals.orders | number }}</span>
              <small>{{ 'admin.reports.ordersHint' | translate: 'Orders created within the selected period.' }}</small>
            </div>
            <div class="metric">
              <strong>{{ 'admin.reports.revenue' | translate: 'Revenue' }}</strong>
              <span>{{ (state.viewModel.report.totals.revenue_cents / 100) | currency }}</span>
              <small>{{ 'admin.reports.revenueHint' | translate: 'Gross revenue based on paid orders.' }}</small>
            </div>
            <div class="metric">
              <strong>{{ 'admin.reports.averageOrderValue' | translate: 'Avg. order value' }}</strong>
              <span>{{ (state.viewModel.report.totals.average_order_value_cents / 100) | currency }}</span>
              <small>{{ 'admin.reports.averageHint' | translate: 'Average ticket size over the timeframe.' }}</small>
            </div>
          </div>
        </section>

        <section class="card">
          <div class="breakdown-grid">
            <div class="list-breakdown">
              <h4>{{ 'admin.reports.statusBreakdown' | translate: 'Status breakdown' }}</h4>
              <ul>
                <li *ngFor="let item of state.viewModel.report.status_breakdown">
                  <header>
                    <span>{{ formatStatusLabel(item.status) }}</span>
                    <span>{{ item.order_count | number }}</span>
                  </header>
                  <span class="progress-bar" [style.--progress]="item.order_count / state.viewModel.statusBreakdownMax"></span>
                </li>
              </ul>
              <p *ngIf="!state.viewModel.report.status_breakdown.length" class="empty-state">
                {{ 'admin.reports.noStatusData' | translate: 'No orders for this timeframe.' }}
              </p>
            </div>

            <div class="list-breakdown">
              <h4>{{ 'admin.reports.statusProgression' | translate: 'Pipeline progression' }}</h4>
              <ul>
                <li *ngFor="let item of state.viewModel.report.status_progression">
                  <header>
                    <span>{{ formatStatusLabel(item.status) }}</span>
                    <span>{{ item.order_count | number }}</span>
                  </header>
                  <span class="progress-bar" [style.--progress]="item.order_count / state.viewModel.statusProgressionMax"></span>
                </li>
              </ul>
              <p *ngIf="!state.viewModel.report.status_progression.length" class="empty-state">
                {{ 'admin.reports.noStatusData' | translate: 'No orders for this timeframe.' }}
              </p>
            </div>

            <div class="list-breakdown">
              <h4>{{ 'admin.reports.scenarioBreakdown' | translate: 'Scenario mix' }}</h4>
              <ul>
                <li *ngFor="let item of state.viewModel.report.scenario_breakdown">
                  <header>
                    <span>{{ formatScenarioLabel(item.scenario) }}</span>
                    <span>{{ item.order_count | number }}</span>
                  </header>
                  <span class="progress-bar" [style.--progress]="item.order_count / state.viewModel.scenarioBreakdownMax"></span>
                </li>
              </ul>
              <p *ngIf="!state.viewModel.report.scenario_breakdown.length" class="empty-state">
                {{ 'admin.reports.noScenarioData' | translate: 'No scenario data available.' }}
              </p>
            </div>

            <div class="list-breakdown">
              <h4>{{ 'admin.reports.targetTimeTypeBreakdown' | translate: 'Target time mix' }}</h4>
              <ul>
                <li *ngFor="let item of state.viewModel.report.target_time_type_breakdown">
                  <header>
                    <span>{{ formatTargetTimeTypeLabel(item.target_time_type) }}</span>
                    <span>{{ item.order_count | number }}</span>
                  </header>
                  <span class="progress-bar" [style.--progress]="item.order_count / state.viewModel.targetTimeTypeBreakdownMax"></span>
                </li>
              </ul>
              <p *ngIf="!state.viewModel.report.target_time_type_breakdown.length" class="empty-state">
                {{ 'admin.reports.noTargetTimeData' | translate: 'No target time data available.' }}
              </p>
            </div>
          </div>
        </section>

        <section class="card">
          <h3 class="section-title">{{ 'admin.reports.dailyPerformance' | translate: 'Daily performance' }}</h3>
          <div class="daily-chart">
            <section>
              <h4 class="section-subtitle">{{ 'admin.reports.dailyOrders' | translate: 'Orders per day' }}</h4>
              <ul>
                <li *ngFor="let day of state.viewModel.report.daily_totals">
                  <span>{{ day.date | date: 'MMM d' }}</span>
                  <div class="bar-stack">
                    <span class="bar" [style.--progress]="day.order_count / state.viewModel.dailyTotalsMaxOrders"></span>
                    <small>{{ day.order_count | number }}</small>
                  </div>
                </li>
              </ul>
              <p *ngIf="!state.viewModel.report.daily_totals.length" class="empty-state">
                {{ 'admin.reports.noDailyData' | translate: 'No activity recorded for this timeframe.' }}
              </p>
            </section>

            <section>
              <h4 class="section-subtitle">{{ 'admin.reports.dailyRevenue' | translate: 'Revenue per day' }}</h4>
              <ul>
                <li *ngFor="let day of state.viewModel.report.daily_totals">
                  <span>{{ day.date | date: 'MMM d' }}</span>
                  <div class="bar-stack">
                    <span
                      class="bar revenue"
                      [style.--progress]="day.revenue_cents / state.viewModel.dailyTotalsMaxRevenue"
                    ></span>
                    <small>{{ (day.revenue_cents / 100) | currency }}</small>
                  </div>
                </li>
              </ul>
              <p *ngIf="!state.viewModel.hasDailyRevenue" class="empty-state">
                {{ 'admin.reports.noRevenueData' | translate: 'No revenue captured during this timeframe.' }}
              </p>
            </section>
          </div>
        </section>
      </ng-container>
    </ng-container>
  `,
})
export class AdminReportsPage {
  private fb = inject(FormBuilder);
  private analytics = inject(AdminAnalyticsService);
  private context = inject(AdminRestaurantContextService);

  private readonly defaultRange = this.getDefaultRange();

  readonly filterForm = this.fb.nonNullable.group({
    startDate: this.defaultRange.startDate,
    endDate: this.defaultRange.endDate,
  });

  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  private filters$ = this.filterForm.valueChanges.pipe(
    startWith(this.filterForm.getRawValue()),
    map(value => ({ startDate: value.startDate ?? '', endDate: value.endDate ?? '' })),
    distinctUntilChanged((a, b) => a.startDate === b.startDate && a.endDate === b.endDate)
  );

  readonly reportState$ = combineLatest([
    this.context.selectedRestaurantId$,
    this.filters$,
    this.refreshTrigger$,
  ]).pipe(
    switchMap(([restaurantId, filters]) => {
      if (restaurantId === null) {
        return of<ReportState>({ status: 'no-restaurant' });
      }

      const validation = this.validateRange(filters.startDate, filters.endDate);
      if (!validation.valid) {
        return of<ReportState>({ status: 'invalid-range', message: validation.message });
      }

      return this.analytics
        .getSalesPipeline(restaurantId, { startDate: validation.startDate, endDate: validation.endDate })
        .pipe(
          map(report => ({ status: 'loaded', viewModel: this.toViewModel(report) }) as ReportState),
          startWith({ status: 'loading' } as ReportState),
          catchError(() => of<ReportState>({ status: 'error' }))
        );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  refresh(): void {
    this.refreshTrigger$.next(undefined);
  }

  formatStatusLabel(status: string): string {
    return this.capitalizeWords(status.replace(/_/g, ' '));
  }

  formatScenarioLabel(scenario: string): string {
    return this.capitalizeWords(scenario);
  }

  formatTargetTimeTypeLabel(type: string): string {
    if (type === 'asap') {
      return 'ASAP';
    }
    return this.capitalizeWords(type.replace(/_/g, ' '));
  }

  exportAsCsv(report: SalesPipelineReport): void {
    const rows: (string | number)[][] = [];
    rows.push(['Sales pipeline report']);
    rows.push([`Period`, `${report.timeframe.start_date} - ${report.timeframe.end_date}`]);
    rows.push([]);
    rows.push(['Totals']);
    rows.push(['Orders', report.totals.orders]);
    rows.push(['Revenue (cents)', report.totals.revenue_cents]);
    rows.push(['Average order value (cents)', report.totals.average_order_value_cents]);
    rows.push([]);
    rows.push(['Status breakdown']);
    rows.push(['Status', 'Orders']);
    report.status_breakdown.forEach(item => rows.push([this.formatStatusLabel(item.status), item.order_count]));
    rows.push([]);
    rows.push(['Pipeline progression']);
    rows.push(['Status', 'Orders']);
    report.status_progression.forEach(item => rows.push([this.formatStatusLabel(item.status), item.order_count]));
    rows.push([]);
    rows.push(['Scenario breakdown']);
    rows.push(['Scenario', 'Orders']);
    report.scenario_breakdown.forEach(item => rows.push([this.formatScenarioLabel(item.scenario), item.order_count]));
    rows.push([]);
    rows.push(['Target time type breakdown']);
    rows.push(['Target time type', 'Orders']);
    report.target_time_type_breakdown.forEach(item =>
      rows.push([this.formatTargetTimeTypeLabel(item.target_time_type), item.order_count])
    );
    rows.push([]);
    rows.push(['Daily totals']);
    rows.push(['Date', 'Orders', 'Revenue (cents)']);
    report.daily_totals.forEach(day => rows.push([day.date, day.order_count, day.revenue_cents]));

    const csv = rows.map(row => row.map(value => this.escapeCsvValue(String(value))).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.triggerDownload(blob, this.buildFileName(report, 'csv'));
  }

  async exportAsXlsx(report: SalesPipelineReport): Promise<void> {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();

    const summarySheet = XLSX.utils.aoa_to_sheet([
      ['Metric', 'Value'],
      ['Orders', report.totals.orders],
      ['Revenue (cents)', report.totals.revenue_cents],
      ['Average order value (cents)', report.totals.average_order_value_cents],
    ]);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    const statusSheet = XLSX.utils.json_to_sheet(
      report.status_breakdown.map(item => ({
        Status: this.formatStatusLabel(item.status),
        Orders: item.order_count,
      }))
    );
    XLSX.utils.book_append_sheet(workbook, statusSheet, 'Status');

    const progressionSheet = XLSX.utils.json_to_sheet(
      report.status_progression.map(item => ({
        Status: this.formatStatusLabel(item.status),
        Orders: item.order_count,
      }))
    );
    XLSX.utils.book_append_sheet(workbook, progressionSheet, 'Pipeline');

    const scenarioSheet = XLSX.utils.json_to_sheet(
      report.scenario_breakdown.map(item => ({
        Scenario: this.formatScenarioLabel(item.scenario),
        Orders: item.order_count,
      }))
    );
    XLSX.utils.book_append_sheet(workbook, scenarioSheet, 'Scenario');

    const targetSheet = XLSX.utils.json_to_sheet(
      report.target_time_type_breakdown.map(item => ({
        'Target time type': this.formatTargetTimeTypeLabel(item.target_time_type),
        Orders: item.order_count,
      }))
    );
    XLSX.utils.book_append_sheet(workbook, targetSheet, 'Target time');

    const dailySheet = XLSX.utils.json_to_sheet(
      report.daily_totals.map(item => ({
        Date: item.date,
        Orders: item.order_count,
        'Revenue (cents)': item.revenue_cents,
      }))
    );
    XLSX.utils.book_append_sheet(workbook, dailySheet, 'Daily totals');

    XLSX.writeFile(workbook, this.buildFileName(report, 'xlsx'));
  }

  async exportAsPdf(report: SalesPipelineReport): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    const title = 'Sales pipeline report';
    doc.setFontSize(16);
    doc.text(title, 14, 20);

    doc.setFontSize(11);
    let cursorY = 30;
    const lineHeight = 6;

    const writeLine = (text: string, indent = 0) => {
      if (cursorY > 280) {
        doc.addPage();
        cursorY = 20;
      }
      doc.text(text, 14 + indent, cursorY);
      cursorY += lineHeight;
    };

    writeLine(`Period: ${report.timeframe.start_date} - ${report.timeframe.end_date}`);
    cursorY += 2;

    doc.setFontSize(13);
    writeLine('Totals');
    doc.setFontSize(11);
    writeLine(`Orders: ${report.totals.orders}`, 6);
    writeLine(`Revenue (cents): ${report.totals.revenue_cents}`, 6);
    writeLine(`Average order value (cents): ${report.totals.average_order_value_cents}`, 6);
    cursorY += 2;

    doc.setFontSize(13);
    writeLine('Status breakdown');
    doc.setFontSize(11);
    report.status_breakdown.forEach(item => {
      writeLine(`${this.formatStatusLabel(item.status)}: ${item.order_count}`, 6);
    });
    cursorY += 2;

    doc.setFontSize(13);
    writeLine('Pipeline progression');
    doc.setFontSize(11);
    report.status_progression.forEach(item => {
      writeLine(`${this.formatStatusLabel(item.status)}: ${item.order_count}`, 6);
    });
    cursorY += 2;

    doc.setFontSize(13);
    writeLine('Scenario breakdown');
    doc.setFontSize(11);
    report.scenario_breakdown.forEach(item => {
      writeLine(`${this.formatScenarioLabel(item.scenario)}: ${item.order_count}`, 6);
    });
    cursorY += 2;

    doc.setFontSize(13);
    writeLine('Target time type breakdown');
    doc.setFontSize(11);
    report.target_time_type_breakdown.forEach(item => {
      writeLine(`${this.formatTargetTimeTypeLabel(item.target_time_type)}: ${item.order_count}`, 6);
    });
    cursorY += 2;

    doc.setFontSize(13);
    writeLine('Daily totals');
    doc.setFontSize(11);
    report.daily_totals.forEach(item => {
      writeLine(`${item.date}: ${item.order_count} orders / ${item.revenue_cents} cents`, 6);
    });

    doc.save(this.buildFileName(report, 'pdf'));
  }

  private toViewModel(report: SalesPipelineReport): ReportViewModel {
    return {
      report,
      statusBreakdownMax: this.maxCount(report.status_breakdown.map(item => item.order_count)),
      statusProgressionMax: this.maxCount(report.status_progression.map(item => item.order_count)),
      scenarioBreakdownMax: this.maxCount(report.scenario_breakdown.map(item => item.order_count)),
      targetTimeTypeBreakdownMax: this.maxCount(report.target_time_type_breakdown.map(item => item.order_count)),
      dailyTotalsMaxOrders: this.maxCount(report.daily_totals.map(item => item.order_count)),
      dailyTotalsMaxRevenue: this.maxRevenue(report.daily_totals.map(item => item.revenue_cents)),
      hasDailyRevenue: report.daily_totals.some(item => item.revenue_cents > 0),
    };
  }

  private maxCount(values: number[]): number {
    const max = values.reduce((acc, value) => Math.max(acc, value), 0);
    return max > 0 ? max : 1;
  }

  private maxRevenue(values: number[]): number {
    const max = values.reduce((acc, value) => Math.max(acc, value), 0);
    return max > 0 ? max : 1;
  }

  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private triggerDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private buildFileName(report: SalesPipelineReport, extension: string): string {
    return `sales-pipeline-${report.timeframe.start_date}-to-${report.timeframe.end_date}.${extension}`;
  }

  private capitalizeWords(value: string): string {
    return value
      .split(' ')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getDefaultRange(): { startDate: string; endDate: string } {
    const today = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);
    return {
      startDate: this.toDateInputValue(start),
      endDate: this.toDateInputValue(today),
    };
  }

  private toDateInputValue(date: Date): string {
    const iso = date.toISOString();
    return iso.slice(0, 10);
  }

  private validateRange(startDate: string, endDate: string):
    | { valid: true; startDate: string; endDate: string }
    | { valid: false; message: string } {
    if (!startDate || !endDate) {
      return { valid: false, message: 'Please select both a start and end date.' };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return { valid: false, message: 'Please provide valid dates.' };
    }

    if (start > end) {
      return { valid: false, message: 'Start date must be before the end date.' };
    }

    return { valid: true, startDate, endDate };
  }
}
