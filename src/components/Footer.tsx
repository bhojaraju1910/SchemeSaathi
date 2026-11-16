import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="no-print bg-[var(--navy)] text-[var(--muted-dark)] border-t border-[var(--line-dark)] mt-16">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
        {/* Mandatory Guidance Disclaimer Box */}
        <div className="editorial-card-dark p-5 sm:p-6">
          <p className="text-sm font-bold text-[var(--cream)]">
            Official Advisory: {t('disclaimer')}
          </p>
          <p className="text-sm text-[var(--muted-dark)] mt-1.5 max-w-4xl leading-relaxed">
            SchemeSaathi is an independent informational matching guide built for Indian families. It does not process applications, approve claims, or represent any government ministry. Always submit applications directly on official state or central portals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Brand Summary */}
          <div className="lg:col-span-4 space-y-3">
            <p className="font-display text-2xl font-bold text-[var(--cream)]">
              SchemeSaathi
            </p>
            <p className="text-sm text-[var(--muted-dark)] leading-relaxed max-w-sm">
              A privacy-first welfare scheme finder explaining rules in plain English, Kannada, and Hindi without asking for Aadhaar or bank numbers.
            </p>
            <p className="text-xs font-semibold text-[var(--accent)] pt-1">
              English · ಕನ್ನಡ · हिन्दी
            </p>
          </div>

          {/* Explore Links */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="eyebrow text-[var(--cream)]">Explore</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/schemes" className="hover:text-[var(--cream)] transition-colors">
                  {t('nav.schemes')}
                </Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-[var(--cream)] transition-colors">
                  {t('nav.compare')}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[var(--cream)] transition-colors">
                  {t('nav.faq')}
                </Link>
              </li>
              <li>
                <Link to="/suggest" className="hover:text-[var(--cream)] transition-colors">
                  {t('nav.suggest')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Official Portals */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="eyebrow text-[var(--cream)]">Official Portals</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="https://www.myscheme.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--cream)] hover:text-[var(--accent)] underline underline-offset-4 transition-colors"
                >
                  myScheme.gov.in
                </a>
              </li>
              <li>
                <a
                  href="https://sevasindhu.karnataka.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--cream)] hover:text-[var(--accent)] underline underline-offset-4 transition-colors"
                >
                  Seva Sindhu (Karnataka)
                </a>
              </li>
              <li>
                <a
                  href="https://scholarships.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--cream)] hover:text-[var(--accent)] underline underline-offset-4 transition-colors"
                >
                  National Scholarship Portal
                </a>
              </li>
              <li>
                <a
                  href="https://nha.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--cream)] hover:text-[var(--accent)] underline underline-offset-4 transition-colors"
                >
                  National Health Authority
                </a>
              </li>
            </ul>
          </div>

          {/* Principles */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="eyebrow text-[var(--cream)]">Our Commitments</h3>
            <ul className="space-y-2 text-sm text-[var(--muted-dark)]">
              <li>Zero Aadhaar or bank collection</li>
              <li>Plain-language eligibility reasons</li>
              <li>Clear verification status badges</li>
              <li>Direct links to official portals</li>
            </ul>
          </div>
        </div>

        {/* Bottom SDG + Cursor FX Toggle + Copyright */}
        <div className="pt-6 border-t border-[var(--line-dark)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs sm:text-sm">
          <p>
            Aligned with UN Sustainable Development Goals: SDG 1 (No Poverty), SDG 10 (Reduced Inequalities), SDG 16 (Strong Institutions).
          </p>

          <p className="tabular-nums text-[var(--cream)] font-medium shrink-0">
            © {new Date().getFullYear()} SchemeSaathi
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
