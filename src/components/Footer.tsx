import React from 'react';
import { useTranslation } from 'react-i18next';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-[var(--deep-band)] text-[var(--deep-muted)] mt-16 border-t border-[var(--deep-border)]">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Mandatory Disclaimer Callout */}
        <div className="border border-[var(--deep-border)] bg-[var(--deep-band-end)] rounded-[6px] p-4 sm:p-5 text-sm leading-relaxed">
          <p className="font-semibold text-[var(--deep-text)]">
            Official Advisory: {t('disclaimer')}
          </p>
          <p className="text-sm text-[var(--deep-muted)] mt-1">
            SchemeSaathi is an independent student-built informational matching tool for families. It does not issue sanctions, approve claims, or act as an intermediary for government departments. All applications must be submitted directly through official state or central government channels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Summary */}
          <div className="space-y-2">
            <p className="text-lg font-bold text-[var(--deep-text)]">SchemeSaathi</p>
            <p className="text-sm leading-relaxed text-[var(--deep-muted)]">
              A privacy-conscious social protection directory helping families identify potentially relevant welfare schemes without collecting Aadhaar or bank details.
            </p>
            <p className="text-sm text-[var(--deep-muted)]">
              Languages: English · ಕನ್ನಡ · हिन्दी
            </p>
          </div>

          {/* Official Portals */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--deep-text)] mb-3">
              Official Portals
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.myscheme.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--saffron)] hover:underline underline-offset-2 transition-colors duration-150"
                >
                  myScheme.gov.in
                </a>
              </li>
              <li>
                <a
                  href="https://sevasindhu.karnataka.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--saffron)] hover:underline underline-offset-2 transition-colors duration-150"
                >
                  Seva Sindhu (Karnataka)
                </a>
              </li>
              <li>
                <a
                  href="https://scholarships.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--saffron)] hover:underline underline-offset-2 transition-colors duration-150"
                >
                  National Scholarship Portal
                </a>
              </li>
              <li>
                <a
                  href="https://nha.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--saffron)] hover:underline underline-offset-2 transition-colors duration-150"
                >
                  National Health Authority
                </a>
              </li>
            </ul>
          </div>

          {/* Principles */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--deep-text)] mb-3">
              Public-Service Principles
            </h3>
            <ul className="space-y-1.5 text-sm text-[var(--deep-muted)]">
              <li>No Aadhaar or bank account collection</li>
              <li>Plain-language eligibility explanations</li>
              <li>Clear sample data labeling</li>
              <li>Direct links to official portals</li>
            </ul>
          </div>
        </div>

        {/* Plain SDG & Copyright Row */}
        <div className="pt-6 border-t border-[var(--deep-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-[var(--deep-muted)]">
          <p>
            Aligned with UN Sustainable Development Goals: SDG 1 (No Poverty), SDG 10 (Reduced Inequalities), SDG 16 (Strong Institutions).
          </p>
          <p className="shrink-0">© {new Date().getFullYear()} SchemeSaathi</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
