import { Component } from '@angular/core';
import { NgFor } from '@angular/common';

interface Benefit {
  title: string;
  description: string;
  icon: string;
}

interface ProofPoint {
  stat: string;
  label: string;
  description: string;
}

interface Step {
  title: string;
  description: string;
  duration: string;
}

@Component({
  selector: 'app-b2b-page',
  standalone: true,
  imports: [NgFor],
  styles: [`
    :host {
      display: block;
      padding-block: 1rem 3rem;
      color: var(--text-primary);
    }

    .hero {
      display: grid;
      gap: 1.5rem;
      padding: 3.5rem clamp(1rem, 4vw, 4rem);
      border-radius: 28px;
      background: radial-gradient(circle at top left, rgba(var(--brand-green-rgb, 6, 193, 103), 0.18), transparent 55%),
        linear-gradient(135deg, #0a0a0a, #1a3b28);
      color: #f7fdf9;
      box-shadow: 0 28px 60px rgba(10, 10, 10, 0.28);
      overflow: hidden;
      position: relative;
    }

    .hero::after {
      content: '';
      position: absolute;
      inset: 12% auto auto 64%;
      width: clamp(160px, 24vw, 260px);
      aspect-ratio: 1;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.22), transparent 70%);
      filter: blur(0.5px);
    }

    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.85rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.85);
      font-size: 0.85rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: clamp(2.5rem, 5vw, 3.4rem);
      font-weight: 700;
      letter-spacing: -0.04em;
    }

    .hero p {
      margin: 0;
      max-width: 620px;
      font-size: 1.1rem;
      line-height: 1.65;
      color: rgba(255, 255, 255, 0.78);
    }

    .hero-cta {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      width: fit-content;
      padding: 0.7rem 1.6rem;
      border-radius: 999px;
      background: var(--brand-green);
      color: #05240f;
      font-weight: 600;
      letter-spacing: -0.01em;
      text-decoration: none;
      box-shadow: 0 18px 35px rgba(var(--brand-green-rgb, 6, 193, 103), 0.35);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }

    .hero-cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 24px 40px rgba(var(--brand-green-rgb, 6, 193, 103), 0.42);
    }

    .benefits {
      display: grid;
      gap: 2.2rem;
      margin-top: 3.5rem;
    }

    .section-header {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .section-header h2 {
      margin: 0;
      font-size: clamp(2rem, 3.6vw, 2.85rem);
    }

    .section-header p {
      margin: 0;
      max-width: 640px;
      font-size: 1.05rem;
      color: var(--text-secondary);
    }

    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.75rem;
    }

    .benefit-card {
      display: grid;
      gap: 0.75rem;
      padding: 1.6rem;
      border-radius: 22px;
      background: var(--surface);
      border: 1px solid rgba(10, 10, 10, 0.06);
      box-shadow: 0 18px 40px rgba(15, 23, 42, 0.1);
    }

    .benefit-icon {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.7rem;
      background: rgba(var(--brand-green-rgb, 6, 193, 103), 0.16);
      color: var(--brand-black);
    }

    .benefit-card h3 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 600;
    }

    .benefit-card p {
      margin: 0;
      color: var(--text-secondary);
      line-height: 1.6;
    }

    .proof-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-top: 3rem;
    }

    .proof-card {
      display: grid;
      gap: 0.5rem;
      padding: 1.5rem;
      border-radius: 20px;
      background: linear-gradient(135deg, rgba(var(--brand-green-rgb, 6, 193, 103), 0.1), rgba(var(--brand-green-rgb, 6, 193, 103), 0.02));
      border: 1px solid rgba(var(--brand-green-rgb, 6, 193, 103), 0.18);
    }

    .proof-card strong {
      font-size: 2rem;
      color: var(--brand-black);
      letter-spacing: -0.03em;
    }

    .proof-card span {
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(10, 10, 10, 0.56);
    }

    .proof-card p {
      margin: 0;
      font-size: 0.95rem;
    }

    .steps {
      margin-top: 4rem;
      display: grid;
      gap: 1.5rem;
    }

    .steps-list {
      display: grid;
      gap: 1rem;
    }

    .step-card {
      display: grid;
      gap: 0.35rem;
      padding: 1.25rem 1.5rem;
      border-radius: 18px;
      background: var(--surface);
      border: 1px solid rgba(10, 10, 10, 0.06);
      box-shadow: var(--shadow-soft);
    }

    .step-title {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 1rem;
    }

    .step-title h3 {
      margin: 0;
      font-size: 1.2rem;
      letter-spacing: -0.02em;
    }

    .step-duration {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--text-secondary);
    }

    .cta-card {
      margin-top: 4rem;
      padding: 2.5rem clamp(1.2rem, 4vw, 2.8rem);
      border-radius: 26px;
      background: linear-gradient(135deg, rgba(10, 10, 10, 0.95), rgba(10, 10, 10, 0.8));
      color: #fefefe;
      display: grid;
      gap: 1rem;
    }

    .cta-card h2 {
      margin: 0;
      font-size: clamp(2rem, 4vw, 2.75rem);
    }

    .cta-card p {
      margin: 0;
      max-width: 540px;
      color: rgba(255, 255, 255, 0.75);
    }

    .cta-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .cta-actions a {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.7rem 1.5rem;
      border-radius: 999px;
      text-decoration: none;
      font-weight: 600;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }

    .cta-primary {
      background: var(--brand-green);
      color: #05240f;
      box-shadow: 0 18px 35px rgba(var(--brand-green-rgb, 6, 193, 103), 0.3);
    }

    .cta-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 22px 40px rgba(var(--brand-green-rgb, 6, 193, 103), 0.36);
    }

    .cta-secondary {
      background: rgba(255, 255, 255, 0.14);
      color: #fefefe;
      border: 1px solid rgba(255, 255, 255, 0.24);
    }

    .cta-secondary:hover {
      transform: translateY(-1px);
      background: rgba(255, 255, 255, 0.22);
    }

    @media (max-width: 780px) {
      .hero {
        padding: 2.6rem clamp(1rem, 6vw, 2.6rem);
      }

      .proof-grid {
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      }
    }

    @media (max-width: 540px) {
      .hero {
        border-radius: 22px;
      }

      .hero-cta {
        width: 100%;
        justify-content: center;
      }

      .benefits-grid {
        grid-template-columns: 1fr;
      }

      .cta-actions {
        flex-direction: column;
        align-items: stretch;
      }

      .cta-actions a {
        justify-content: center;
      }
    }
  `],
  template: `
    <section class="hero">
      <span class="hero-eyebrow">For restaurants</span>
      <h1>Grow your restaurant with thefunpart eats</h1>
      <p>
        Join a delivery platform that champions local flavour. Reach new guests, boost order volume, and get the tools you need
        to run smarter operations every day.
      </p>
      <a class="hero-cta" href="mailto:partners@thefunpart.com">
        Become a partner
        <span aria-hidden="true">→</span>
      </a>
    </section>

    <section class="benefits">
      <div class="section-header">
        <h2>Why restaurants choose us</h2>
        <p>
          thefunpart eats unlocks incremental demand while keeping your brand front-and-centre. Our platform is built for busy
          restaurateurs who need reliable logistics, actionable data, and marketing that actually works.
        </p>
      </div>
      <div class="benefits-grid">
        <article class="benefit-card" *ngFor="let benefit of benefits">
          <span class="benefit-icon" aria-hidden="true">{{ benefit.icon }}</span>
          <h3>{{ benefit.title }}</h3>
          <p>{{ benefit.description }}</p>
        </article>
      </div>
    </section>

    <section class="proof-grid" aria-label="Platform highlights">
      <article class="proof-card" *ngFor="let proof of proofPoints">
        <strong>{{ proof.stat }}</strong>
        <span>{{ proof.label }}</span>
        <p>{{ proof.description }}</p>
      </article>
    </section>

    <section class="steps" aria-label="How partnering works">
      <div class="section-header">
        <h2>Onboarding built around your schedule</h2>
        <p>
          From first hello to first delivery, our success managers guide you with hands-on support and automation that gets you
          live without slowing down service.
        </p>
      </div>
      <div class="steps-list">
        <article class="step-card" *ngFor="let step of steps">
          <div class="step-title">
            <h3>{{ step.title }}</h3>
            <span class="step-duration">{{ step.duration }}</span>
          </div>
          <p>{{ step.description }}</p>
        </article>
      </div>
    </section>

    <section class="cta-card" aria-labelledby="cta-heading">
      <h2 id="cta-heading">Ready to bring in your next wave of regulars?</h2>
      <p>
        Our partner team will share a tailored demand forecast for your neighbourhood, review commission options, and help you
        integrate with leading POS providers.
      </p>
      <div class="cta-actions">
        <a class="cta-primary" href="mailto:partners@thefunpart.com">Talk to sales</a>
        <a class="cta-secondary" href="tel:+3220000000">Call us at +32 2 000 00 00</a>
      </div>
    </section>
  `
})
export class B2bPage {
  readonly benefits: Benefit[] = [
    {
      title: 'Drive incremental orders',
      description:
        'Tap into thousands of hungry locals searching for their next go-to spot. Get featured placements during peak demand to fill quiet moments.',
      icon: '📈',
    },
    {
      title: 'Own your brand story',
      description:
        'Update menus, photography, and promos in real time. Spotlight seasonal drops and manage multiple locations from a single dashboard.',
      icon: '⭐️',
    },
    {
      title: 'Logistics you can trust',
      description:
        'Our courier network delivers fast and with care. Monitor courier ETAs, resolve delivery issues instantly, and keep guests in the loop.',
      icon: '🛵',
    },
    {
      title: 'Insights that power decisions',
      description:
        'Understand basket trends, repeat rates, and campaign performance. Export data or sync directly with your POS tools.',
      icon: '📊',
    },
  ];

  readonly proofPoints: ProofPoint[] = [
    {
      stat: '72%',
      label: 'New customer reach',
      description: 'Orders from first-time guests who discovered partners through thefunpart eats campaigns in 2023.',
    },
    {
      stat: '18 min',
      label: 'Average delivery time',
      description: 'Smart batching and courier routing keeps food moving quickly without sacrificing quality.',
    },
    {
      stat: '24/7',
      label: 'Partner support',
      description: 'Get proactive monitoring, live chat, and a dedicated success manager for enterprise groups.',
    },
    {
      stat: 'POS ready',
      label: 'Integrations',
      description: 'Connect with Deliverect, Lightspeed, Toast, and more to keep menus and orders synced automatically.',
    },
  ];

  readonly steps: Step[] = [
    {
      title: 'Share your restaurant details',
      description: 'Tell us about your menu, locations, and ambitions. We create a custom partnership package that fits your goals.',
      duration: 'Day 1',
    },
    {
      title: 'Activate menus & operations',
      description:
        'Upload visuals, connect your POS, and train staff with our bite-sized onboarding. Courier preferences and packaging tips included.',
      duration: 'Day 2-5',
    },
    {
      title: 'Launch with marketing support',
      description:
        'Go live with featured placement, welcome promos, and ongoing optimisation to keep guests coming back.',
      duration: 'Go live',
    },
  ];
}
