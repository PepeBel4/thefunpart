export const legalPageStyles = `
  :host {
    display: block;
    color: var(--text-primary);
    padding-block: clamp(1.5rem, 5vw, 3rem) 4rem;
  }

  .legal-hero {
    display: grid;
    gap: 0.75rem;
    margin-bottom: clamp(2rem, 6vw, 3rem);
  }

  .legal-hero h1 {
    margin: 0;
    font-size: clamp(2.1rem, 4vw, 2.9rem);
    letter-spacing: -0.02em;
  }

  .legal-hero p {
    margin: 0;
    max-width: 720px;
    color: var(--text-secondary);
    line-height: 1.6;
  }

  .legal-section {
    display: grid;
    gap: 0.85rem;
    padding-block: 1.5rem;
    border-top: 1px solid rgba(12, 36, 32, 0.08);
  }

  .legal-section:first-of-type {
    border-top: none;
  }

  .legal-section h2 {
    margin: 0;
    font-size: clamp(1.4rem, 3vw, 1.75rem);
    letter-spacing: -0.01em;
  }

  .legal-section p {
    margin: 0;
    line-height: 1.65;
  }

  .legal-section ul,
  .legal-section ol {
    margin: 0;
    padding-left: 1.25rem;
    display: grid;
    gap: 0.5rem;
    line-height: 1.6;
  }

  .legal-section strong {
    color: var(--text-primary);
  }

  .legal-meta {
    font-size: 0.95rem;
    color: var(--text-tertiary, rgba(12, 36, 32, 0.65));
  }
`;
