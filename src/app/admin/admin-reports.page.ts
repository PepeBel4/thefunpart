import { CurrencyPipe, DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AdminRestaurantContextService } from './admin-restaurant-context.service';
import { AdminSalesPipelineService } from './admin-sales-pipeline.service';
import { SalesPipelineReport } from '../core/models';
import { TranslatePipe } from '../shared/translate.pipe';

interface StatusChartEntry {
  status: string;
  orderCount: number;
  percentage: number;
}

@Component({
  standalone: true,
  selector: 'app-admin-reports',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, FormsModule, NgFor, NgIf, TranslatePipe],
  styles: [`
    :host {
      display: block;
      padding-bottom: 3rem;
    }

    .page-shell {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .card {
      background: var(--surface, #fff);
      border-radius: var(--radius-card, 1.25rem);
      padding: clamp(1.5rem, 3vw, 2rem);
      box-shadow: var(--shadow-soft, 0 10px 40px rgba(15, 15, 15, 0.08));
      border: 1px solid rgba(10, 10, 10, 0.05);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    header.section-header {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    header.section-header h2 {
      margin: 0;
      font-size: clamp(2rem, 4vw, 2.6rem);
      letter-spacing: -0.04em;
    }

    header.section-header p {
      margin: 0;
      color: var(--text-secondary, rgba(15, 15, 15, 0.68));
      max-width: 540px;
    }

    .header-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    @media (min-width: 768px) {
      header.section-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
      }

      .header-actions {
        flex-direction: row;
        align-items: center;
      }
    }

    form.range-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    @media (min-width: 576px) {
      form.range-form {
        flex-direction: row;
        align-items: center;
      }
    }

    form.range-form label {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-weight: 600;
      font-size: 0.95rem;
    }

    form.range-form input[type='date'] {
      padding: 0.55rem 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(10, 10, 10, 0.12);
      font-size: 1rem;
      background: rgba(255, 255, 255, 0.85);
      min-width: 220px;
    }

    form.range-form button {
      align-self: flex-start;
      padding: 0.6rem 1.3rem;
      border-radius: 999px;
      border: none;
      font-weight: 600;
      cursor: pointer;
      background: var(--brand-green, #06c167);
      color: #fff;
      transition: background 0.2s ease;
      white-space: nowrap;
    }

    form.range-form button:hover:not(:disabled) {
      background: color-mix(in srgb, var(--brand-green) 85%, black);
    }

    form.range-form button:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .summary-card {
      border-radius: var(--radius-card, 1.1rem);
      padding: 1.25rem;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.08);
      border: 1px solid rgba(var(--brand-green-rgb, 6, 193, 103), 0.25);
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .summary-card h3 {
      margin: 0;
      font-size: 0.95rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: color-mix(in srgb, var(--brand-green, #06c167) 70%, black);
    }

    .summary-card span {
      font-size: clamp(1.8rem, 4vw, 2.4rem);
      font-weight: 700;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 1.5rem;
    }

    @media (min-width: 1024px) {
      .charts-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .bar-chart-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .bar-chart-label {
      min-width: 140px;
      font-weight: 600;
      font-size: 0.95rem;
    }

    .bar-chart-track {
      flex: 1;
      height: 12px;
      border-radius: 999px;
      background: rgba(10, 10, 10, 0.08);
      overflow: hidden;
    }

    .bar-chart-fill {
      height: 100%;
      border-radius: inherit;
      background: var(--brand-green, #06c167);
      transition: width 0.3s ease;
    }

    .bar-chart-value {
      min-width: 48px;
      text-align: right;
      font-variant-numeric: tabular-nums;
      color: var(--text-secondary, rgba(15, 15, 15, 0.6));
    }

    .empty-state {
      color: var(--text-secondary, rgba(15, 15, 15, 0.6));
    }

    .tables-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 1.5rem;
    }

    @media (min-width: 992px) {
      .tables-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95rem;
    }

    th,
    td {
      text-align: left;
      padding: 0.5rem 0;
      border-bottom: 1px solid rgba(10, 10, 10, 0.08);
      font-variant-numeric: tabular-nums;
    }

    th {
      font-weight: 600;
      color: var(--text-secondary, rgba(15, 15, 15, 0.65));
    }

    .export-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .export-actions button {
      padding: 0.5rem 1rem;
      border-radius: 999px;
      border: 1px solid rgba(10, 10, 10, 0.12);
      background: rgba(255, 255, 255, 0.9);
      cursor: pointer;
      font-weight: 600;
      transition: background 0.2s ease;
    }

    .export-actions button:hover:not(:disabled) {
      background: rgba(10, 10, 10, 0.06);
    }

    .export-actions button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .line-chart-wrapper {
      width: 100%;
      overflow-x: auto;
    }

    .line-chart {
      width: 100%;
      max-width: none;
    }

    .error-message {
      color: var(--brand-red, #c81e1e);
      margin: 0;
    }
  `],
  template: `
    <div class="page-shell">
      <header class="section-header">
        <div>
          <h2>{{ 'admin.reports.title' | translate: 'Reports & analytics' }}</h2>
          <p>
            {{
              'admin.reports.subtitle'
                | translate:
                    'Track order flow, channel performance and daily revenue across your selected timeframe.'
            }}
          </p>
        </div>

        <div class="header-actions">
          <form class="range-form" (ngSubmit)="refresh()">
            <label for="report-start-date">
              {{ 'admin.reports.start' | translate: 'Start date' }}
              <input
                id="report-start-date"
                type="date"
                name="startDate"
                [(ngModel)]="startDate"
                required
              />
            </label>

            <label for="report-end-date">
              {{ 'admin.reports.end' | translate: 'End date' }}
              <input
                id="report-end-date"
                type="date"
                name="endDate"
                [(ngModel)]="endDate"
                required
              />
            </label>

            <button type="submit" [disabled]="loading || !isRangeValid">
              {{ loading ? ('admin.reports.loading' | translate: 'Loading…') : ('admin.reports.apply' | translate: 'Apply range') }}
            </button>
          </form>

          <div class="export-actions">
            <button type="button" (click)="exportCsv()" [disabled]="!report">
              {{ 'admin.reports.export.csv' | translate: 'Export CSV' }}
            </button>
            <button type="button" (click)="exportXlsx()" [disabled]="!report">
              {{ 'admin.reports.export.xlsx' | translate: 'Export XLSX' }}
            </button>
            <button type="button" (click)="exportPdf()" [disabled]="!report">
              {{ 'admin.reports.export.pdf' | translate: 'Export PDF' }}
            </button>
          </div>
        </div>
      </header>

      <ng-container *ngIf="!loading && report as reportData; else loadingOrEmpty">
        <section class="card summary-card-wrapper">
          <div class="summary-grid">
            <article class="summary-card">
              <h3>{{ 'admin.reports.totalOrders' | translate: 'Total orders' }}</h3>
              <span>{{ reportData.totals.orders | number }}</span>
            </article>
            <article class="summary-card">
              <h3>{{ 'admin.reports.totalRevenue' | translate: 'Revenue' }}</h3>
              <span>{{ reportData.totals.revenue_cents / 100 | currency:currencyCode }}</span>
            </article>
            <article class="summary-card">
              <h3>{{ 'admin.reports.averageOrder' | translate: 'Average order value' }}</h3>
              <span>
                {{ reportData.totals.average_order_value_cents / 100 | currency:currencyCode }}
              </span>
            </article>
          </div>
        </section>

        <section class="charts-grid">
          <article class="card">
            <header>
              <h3>{{ 'admin.reports.statusBreakdown' | translate: 'Status breakdown' }}</h3>
              <p class="empty-state" *ngIf="!statusBreakdown.length">
                {{ 'admin.reports.empty' | translate: 'No data for the selected timeframe.' }}
              </p>
            </header>

            <div class="bar-chart" *ngIf="statusBreakdown.length">
              <div class="bar-chart-row" *ngFor="let entry of statusBreakdown">
                <span class="bar-chart-label">{{ getStatusLabel(entry.status) }}</span>
                <div class="bar-chart-track">
                  <div class="bar-chart-fill" [style.width.%]="entry.percentage"></div>
                </div>
                <span class="bar-chart-value">{{ entry.orderCount | number }}</span>
              </div>
            </div>
          </article>

          <article class="card">
            <header>
              <h3>{{ 'admin.reports.statusProgression' | translate: 'Status progression' }}</h3>
              <p class="empty-state" *ngIf="!reportData.status_progression.length">
                {{ 'admin.reports.empty' | translate: 'No data for the selected timeframe.' }}
              </p>
            </header>

            <div class="bar-chart" *ngIf="reportData.status_progression.length">
              <div class="bar-chart-row" *ngFor="let entry of reportData.status_progression">
                <span class="bar-chart-label">{{ getStatusLabel(entry.status) }}</span>
                <div class="bar-chart-track">
                  <div
                    class="bar-chart-fill"
                    [style.width.%]="getProgressionPercentage(entry.order_count)"
                    style="background: rgba(15, 15, 15, 0.85)"
                  ></div>
                </div>
                <span class="bar-chart-value">{{ entry.order_count | number }}</span>
              </div>
            </div>
          </article>
        </section>

        <section class="card">
          <header>
            <h3>{{ 'admin.reports.dailyTotals' | translate: 'Daily totals' }}</h3>
          </header>

          <div class="line-chart-wrapper" *ngIf="reportData.daily_totals.length; else noDailyData">
            <svg class="line-chart" [attr.viewBox]="dailyChartViewBox" preserveAspectRatio="none">
              <defs>
                <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--brand-green, #06c167)" stop-opacity="0.35" />
                  <stop offset="100%" stop-color="var(--brand-green, #06c167)" stop-opacity="0" />
                </linearGradient>
              </defs>
              <polyline
                *ngIf="dailyOrdersPolyline"
                [attr.points]="dailyOrdersPolyline"
                fill="none"
                stroke="var(--brand-green, #06c167)"
                stroke-width="3"
                stroke-linecap="round"
              ></polyline>
              <polygon
                *ngIf="dailyOrdersArea"
                [attr.points]="dailyOrdersArea"
                fill="url(#ordersGradient)"
                stroke="none"
              ></polygon>
            </svg>
          </div>

          <ng-template #noDailyData>
            <p class="empty-state">
              {{ 'admin.reports.empty' | translate: 'No data for the selected timeframe.' }}
            </p>
          </ng-template>

          <div class="tables-grid">
            <div>
              <h4>{{ 'admin.reports.scenarioBreakdown' | translate: 'Scenario breakdown' }}</h4>
              <table>
                <thead>
                  <tr>
                    <th>{{ 'admin.reports.scenario' | translate: 'Scenario' }}</th>
                    <th>{{ 'admin.reports.orders' | translate: 'Orders' }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let scenario of reportData.scenario_breakdown">
                    <td>{{ getScenarioLabel(scenario.scenario) }}</td>
                    <td>{{ scenario.order_count | number }}</td>
                  </tr>
                  <tr *ngIf="!reportData.scenario_breakdown.length">
                    <td colspan="2" class="empty-state">
                      {{ 'admin.reports.empty' | translate: 'No data for the selected timeframe.' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4>{{ 'admin.reports.targetTimeBreakdown' | translate: 'Target time' }}</h4>
              <table>
                <thead>
                  <tr>
                    <th>{{ 'admin.reports.targetTime' | translate: 'Type' }}</th>
                    <th>{{ 'admin.reports.orders' | translate: 'Orders' }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let entry of reportData.target_time_type_breakdown">
                    <td>{{ getTargetTimeLabel(entry.target_time_type) }}</td>
                    <td>{{ entry.order_count | number }}</td>
                  </tr>
                  <tr *ngIf="!reportData.target_time_type_breakdown.length">
                    <td colspan="2" class="empty-state">
                      {{ 'admin.reports.empty' | translate: 'No data for the selected timeframe.' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div>
              <h4>{{ 'admin.reports.dailyTable' | translate: 'Daily table' }}</h4>
              <table>
                <thead>
                  <tr>
                    <th>{{ 'admin.reports.date' | translate: 'Date' }}</th>
                    <th>{{ 'admin.reports.orders' | translate: 'Orders' }}</th>
                    <th>{{ 'admin.reports.revenue' | translate: 'Revenue' }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let day of reportData.daily_totals">
                    <td>{{ day.date | date }}</td>
                    <td>{{ day.order_count | number }}</td>
                    <td>{{ day.revenue_cents / 100 | currency:currencyCode }}</td>
                  </tr>
                  <tr *ngIf="!reportData.daily_totals.length">
                    <td colspan="3" class="empty-state">
                      {{ 'admin.reports.empty' | translate: 'No data for the selected timeframe.' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </ng-container>

      <ng-template #loadingOrEmpty>
        <section class="card">
          <ng-container *ngIf="loading; else emptyState">
            <p class="empty-state">{{ 'admin.reports.loading' | translate: 'Loading…' }}</p>
          </ng-container>
        </section>
      </ng-template>

      <ng-template #emptyState>
        <p class="empty-state">
          {{ 'admin.reports.noSelection' | translate: 'Choose a restaurant and timeframe to see analytics.' }}
        </p>
      </ng-template>

      <p class="error-message" *ngIf="errorMessage">
        {{ errorMessage }}
      </p>
    </div>
  `,
})
export class AdminReportsPage implements OnInit {
  private context = inject(AdminRestaurantContextService);
  private salesPipeline = inject(AdminSalesPipelineService);

  report: SalesPipelineReport | null = null;
  loading = false;
  errorMessage: string | null = null;
  startDate = '';
  endDate = '';
  currencyCode = 'EUR';
  private restaurantId: number | null = null;

  dailyChartViewBox = '0 0 600 200';
  dailyOrdersPolyline = '';
  dailyOrdersArea = '';

  ngOnInit(): void {
    this.applyDefaultRange();

    this.context.selectedRestaurantId$
      .pipe(takeUntilDestroyed())
      .subscribe(id => {
        this.restaurantId = id;
        if (id !== null) {
          void this.refresh();
        } else {
          this.report = null;
        }
      });
  }

  get isRangeValid(): boolean {
    if (!this.startDate || !this.endDate) {
      return false;
    }

    return new Date(this.startDate) <= new Date(this.endDate);
  }

  get statusBreakdown(): StatusChartEntry[] {
    const source = this.report?.status_breakdown ?? [];
    if (!source.length) {
      return [];
    }

    const total = source.reduce((sum, entry) => sum + entry.order_count, 0);
    if (!total) {
      return source.map(entry => ({ status: entry.status, orderCount: entry.order_count, percentage: 0 }));
    }

    return source.map(entry => ({
      status: entry.status,
      orderCount: entry.order_count,
      percentage: Math.min(100, Math.round((entry.order_count / total) * 1000) / 10),
    }));
  }

  refresh(): Promise<void> {
    if (!this.restaurantId || !this.isRangeValid) {
      return Promise.resolve();
    }

    this.loading = true;
    this.errorMessage = null;

    return firstValueFrom(
      this.salesPipeline.getReport(this.restaurantId, {
        startDate: this.startDate,
        endDate: this.endDate,
      })
    )
      .then(report => {
        this.report = report;
        this.prepareDailyChart();
      })
      .catch(() => {
        this.errorMessage = 'Unable to load report data. Please try again later.';
        this.report = null;
        this.dailyOrdersPolyline = '';
        this.dailyOrdersArea = '';
      })
      .finally(() => {
        this.loading = false;
      });
  }

  getProgressionPercentage(value: number): number {
    const max = this.report?.status_progression.reduce((acc, entry) => Math.max(acc, entry.order_count), 0) ?? 0;
    if (!max) {
      return 0;
    }

    return Math.min(100, Math.round((value / max) * 1000) / 10);
  }

  getStatusLabel(status: string): string {
    return status.replace(/_/g, ' ');
  }

  getScenarioLabel(scenario: string): string {
    switch (scenario) {
      case 'takeaway':
        return 'Takeaway';
      case 'delivery':
        return 'Delivery';
      case 'eatin':
        return 'Eat in';
      default:
        return scenario;
    }
  }

  getTargetTimeLabel(target: string): string {
    switch (target) {
      case 'asap':
        return 'ASAP';
      case 'scheduled':
        return 'Scheduled';
      default:
        return target;
    }
  }

  exportCsv(): void {
    if (!this.report) {
      return;
    }

    const rows: string[] = [];
    rows.push('Section,Label,Value');
    rows.push(`Totals,Orders,${this.report.totals.orders}`);
    rows.push(`Totals,Revenue,${(this.report.totals.revenue_cents / 100).toFixed(2)}`);
    rows.push(`Totals,Average order value,${(this.report.totals.average_order_value_cents / 100).toFixed(2)}`);

    this.report.status_breakdown.forEach(entry => {
      rows.push(`Status breakdown,${this.getStatusLabel(entry.status)},${entry.order_count}`);
    });

    this.report.status_progression.forEach(entry => {
      rows.push(`Status progression,${this.getStatusLabel(entry.status)},${entry.order_count}`);
    });

    this.report.scenario_breakdown.forEach(entry => {
      rows.push(`Scenario breakdown,${this.getScenarioLabel(entry.scenario)},${entry.order_count}`);
    });

    this.report.target_time_type_breakdown.forEach(entry => {
      rows.push(`Target time,${this.getTargetTimeLabel(entry.target_time_type)},${entry.order_count}`);
    });

    this.report.daily_totals.forEach(entry => {
      rows.push(`Daily totals,${entry.date} orders,${entry.order_count}`);
      rows.push(`Daily totals,${entry.date} revenue,${(entry.revenue_cents / 100).toFixed(2)}`);
    });

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = this.makeFilename('sales-pipeline.csv');
    link.click();
    URL.revokeObjectURL(url);
  }

  exportXlsx(): void {
    if (!this.report) {
      return;
    }

    const workbook = XLSX.utils.book_new();

    const totalsSheet = XLSX.utils.aoa_to_sheet([
      ['Metric', 'Value'],
      ['Orders', this.report.totals.orders],
      ['Revenue', (this.report.totals.revenue_cents / 100).toFixed(2)],
      ['Average order value', (this.report.totals.average_order_value_cents / 100).toFixed(2)],
    ]);

    const statusSheet = XLSX.utils.aoa_to_sheet([
      ['Status', 'Orders'],
      ...this.report.status_breakdown.map(entry => [this.getStatusLabel(entry.status), entry.order_count]),
    ]);

    const progressionSheet = XLSX.utils.aoa_to_sheet([
      ['Status', 'Orders'],
      ...this.report.status_progression.map(entry => [this.getStatusLabel(entry.status), entry.order_count]),
    ]);

    const scenarioSheet = XLSX.utils.aoa_to_sheet([
      ['Scenario', 'Orders'],
      ...this.report.scenario_breakdown.map(entry => [this.getScenarioLabel(entry.scenario), entry.order_count]),
    ]);

    const targetSheet = XLSX.utils.aoa_to_sheet([
      ['Target time type', 'Orders'],
      ...this.report.target_time_type_breakdown.map(entry => [
        this.getTargetTimeLabel(entry.target_time_type),
        entry.order_count,
      ]),
    ]);

    const dailySheet = XLSX.utils.aoa_to_sheet([
      ['Date', 'Orders', 'Revenue'],
      ...this.report.daily_totals.map(entry => [
        entry.date,
        entry.order_count,
        (entry.revenue_cents / 100).toFixed(2),
      ]),
    ]);

    XLSX.utils.book_append_sheet(workbook, totalsSheet, 'Totals');
    XLSX.utils.book_append_sheet(workbook, statusSheet, 'Status breakdown');
    XLSX.utils.book_append_sheet(workbook, progressionSheet, 'Status progression');
    XLSX.utils.book_append_sheet(workbook, scenarioSheet, 'Scenarios');
    XLSX.utils.book_append_sheet(workbook, targetSheet, 'Target time');
    XLSX.utils.book_append_sheet(workbook, dailySheet, 'Daily totals');

    XLSX.writeFile(workbook, this.makeFilename('sales-pipeline.xlsx'));
  }

  exportPdf(): void {
    if (!this.report) {
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(18);
    doc.text('Sales pipeline report', 14, 18);
    doc.setFontSize(12);
    doc.text(`Period: ${this.startDate} to ${this.endDate}`, 14, 26);

    let nextY = 32;

    autoTable(doc, {
      startY: nextY,
      head: [['Metric', 'Value']],
      body: [
        ['Orders', this.report.totals.orders.toString()],
        ['Revenue', (this.report.totals.revenue_cents / 100).toFixed(2)],
        ['Average order value', (this.report.totals.average_order_value_cents / 100).toFixed(2)],
      ],
    });

    nextY = this.getAutoTableFinalY(doc) + 10;

    autoTable(doc, {
      startY: nextY,
      head: [['Status', 'Orders']],
      body: this.report.status_breakdown.map(entry => [
        this.getStatusLabel(entry.status),
        entry.order_count.toString(),
      ]),
    });

    nextY = this.getAutoTableFinalY(doc) + 10;

    autoTable(doc, {
      startY: nextY,
      head: [['Scenario', 'Orders']],
      body: this.report.scenario_breakdown.map(entry => [
        this.getScenarioLabel(entry.scenario),
        entry.order_count.toString(),
      ]),
    });

    nextY = this.getAutoTableFinalY(doc) + 10;

    autoTable(doc, {
      startY: nextY,
      head: [['Target time type', 'Orders']],
      body: this.report.target_time_type_breakdown.map(entry => [
        this.getTargetTimeLabel(entry.target_time_type),
        entry.order_count.toString(),
      ]),
    });

    nextY = this.getAutoTableFinalY(doc) + 10;

    autoTable(doc, {
      startY: nextY,
      head: [['Date', 'Orders', 'Revenue']],
      body: this.report.daily_totals.map(entry => [
        entry.date,
        entry.order_count.toString(),
        (entry.revenue_cents / 100).toFixed(2),
      ]),
    });

    doc.save(this.makeFilename('sales-pipeline.pdf'));
  }

  private prepareDailyChart(): void {
    if (!this.report || !this.report.daily_totals.length) {
      this.dailyOrdersPolyline = '';
      this.dailyOrdersArea = '';
      return;
    }

    const width = 600;
    const height = 200;
    const padding = 24;
    const items = this.report.daily_totals;
    const maxOrders = items.reduce((max, day) => Math.max(max, day.order_count), 0);

    if (!maxOrders) {
      this.dailyOrdersPolyline = '';
      this.dailyOrdersArea = '';
      return;
    }

    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;
    const step = items.length > 1 ? plotWidth / (items.length - 1) : 0;

    const points = items.map((day, index) => {
      const x = padding + step * index;
      const y = height - padding - (day.order_count / maxOrders) * plotHeight;
      return `${x},${y}`;
    });

    this.dailyOrdersPolyline = points.join(' ');
    const areaPoints = [`${padding},${height - padding}`, ...points, `${padding + step * (items.length - 1)},${height - padding}`];
    this.dailyOrdersArea = areaPoints.join(' ');
  }

  private makeFilename(suffix: string): string {
    const restaurantPart = this.restaurantId ? `restaurant-${this.restaurantId}-` : '';
    return `${restaurantPart}${this.startDate}-to-${this.endDate}-${suffix}`;
  }

  private applyDefaultRange(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    this.startDate = this.toInputDate(start);
    this.endDate = this.toInputDate(end);
  }

  private toInputDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private getAutoTableFinalY(doc: jsPDF): number {
    const typed = doc as unknown as { lastAutoTable?: { finalY: number } };
    return typed.lastAutoTable?.finalY ?? 32;
  }
}
