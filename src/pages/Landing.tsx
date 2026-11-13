import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import SchemeCard, { SchemeData } from '../components/SchemeCard';
import CategoryIcon, { getCategoryPalette } from '../components/CategoryIcon';
import { HARDCODED_SCHEMES } from '../data/schemes';
import api from '../api/axios';

const BROWSE_CATEGORIES = [
  {
    key: 'women_child',
    labelKey: 'categories.women_child',
    summary: 'Monthly family assistance, maternal health support, and child care.',
  },
  {
    key: 'senior_citizens',
    labelKey: 'categories.senior_citizens',
    summary: 'State old-age pensions, dignity stipends, and assisted living support.',
  },
  {
    key: 'education',
    labelKey: 'categories.education',
    summary: 'Post-matric scholarships, hostel stipends, and youth skill allowances.',
  },
  {
    key: 'agriculture',
    labelKey: 'categories.agriculture',
    summary: 'Direct farmer income support, crop insurance, and input subsidies.',
  },
  {
    key: 'healthcare',
    labelKey: 'categories.healthcare',
    summary: 'Cashless hospital cover, medical treatments, and disability support.',
  },
  {
    key: 'employment',
    labelKey: 'categories.employment',
    summary: 'Livelihood grants, artisan toolkits, and self-employment credit.',
  },
];

export const Landing: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [featuredSchemes, setFeaturedSchemes] = useState<SchemeData[]>(
    HARDCODED_SCHEMES.slice(0, 3)
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await api.get('/schemes?limit=3');
        if (Array.isArray(res.data?.schemes) && res.data.schemes.length > 0) {
          setFeaturedSchemes(res.data.schemes);
        }
      } catch (err) {
        console.error('Failed to load featured schemes, using hardcoded catalog:', err);
        setFeaturedSchemes(HARDCODED_SCHEMES.slice(0, 3));
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const targetGroups = [
    { label: 'Senior Citizens (60+)', cat: 'senior_citizens' },
    { label: 'College & School Students', cat: 'education' },
    { label: 'Women & Mothers', cat: 'women_child' },
    { label: 'Small & Marginal Farmers', cat: 'agriculture' },
    { label: 'Traditional Artisans & Weavers', cat: 'employment' },
    { label: 'Persons with Disabilities', cat: 'healthcare' },
  ];

  const steps = [
    {
      num: '1',
      title: t('howItWorks.step1Title'),
      desc: t('howItWorks.step1Desc'),
      bgVar: 'var(--step-1-bg)',
      textVar: 'var(--step-1-text)',
    },
    {
      num: '2',
      title: t('howItWorks.step2Title'),
      desc: t('howItWorks.step2Desc'),
      bgVar: 'var(--step-2-bg)',
      textVar: 'var(--step-2-text)',
    },
    {
      num: '3',
      title: t('howItWorks.step3Title'),
      desc: t('howItWorks.step3Desc'),
      bgVar: 'var(--step-3-bg)',
      textVar: 'var(--step-3-text)',
    },
  ];

  return (
    <div>
      {/* 1. Deep Band Hero (two columns desktop, illustration below & compact on mobile) */}
      <section className="hero-band-bg text-[var(--deep-text)] border-b border-[var(--deep-border)]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <h1 className="text-[28px] sm:text-[34px] font-bold text-[var(--deep-text)] leading-tight">
              {t('hero.title')}
            </h1>

            <p className="text-base text-[var(--deep-muted)] leading-relaxed max-w-xl">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-wrap items-center gap-5 pt-1">
              <Link
                to={user ? '/recommendations' : '/profile'}
                className="min-h-[44px] inline-flex items-center justify-center px-6 py-2.5 rounded-[6px] font-semibold text-base bg-[var(--saffron)] hover:bg-[var(--saffron-hover)] text-[var(--saffron-text)] transition-colors duration-150"
              >
                {t('hero.ctaFind')}
              </Link>

              <Link
                to="/schemes"
                className="text-base font-semibold text-[var(--deep-text)] hover:text-[var(--deep-muted)] underline underline-offset-4 transition-colors duration-150"
              >
                {t('hero.ctaBrowse')}
              </Link>
            </div>

            <p className="text-sm text-[var(--deep-muted)]">
              {t('hero.ruleNote')}
            </p>
          </div>

          {/* Simple HTML/CSS + inline SVG illustration: mock Potential matches card */}
          <div className="lg:col-span-5">
            <div
              className="bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--deep-border)] rounded-[6px] p-4 sm:p-5 space-y-3 max-w-md lg:max-w-none"
              aria-hidden="true"
            >
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[var(--border)]">
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  Potential matches
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-[6px] bg-[var(--surface-subtle)] text-[var(--text-muted)]">
                  Sample preview
                </span>
              </div>

              {/* Row 1: High match + saved bookmark */}
              <div className="p-3 rounded-[6px] border border-[var(--border)] bg-[var(--bg-page)] flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <CategoryIcon kind="women_child" size={20} withChip />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-semibold bg-[var(--saffron-tint)] text-[var(--saffron-tint-text)] border border-[var(--saffron-border)]">
                        High match
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">Karnataka</span>
                    </div>
                    <p className="text-sm font-bold text-[var(--text-primary)] leading-snug">
                      Gruha Lakshmi Scheme
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Matches state and household category
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center justify-center w-8 h-8 rounded-[6px] bg-[var(--teal)] text-[var(--deep-text)] shrink-0">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 4h12v16l-6-4-6 4V4z" />
                  </svg>
                </span>
              </div>

              {/* Row 2: Medium match */}
              <div className="p-3 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <CategoryIcon kind="healthcare" size={20} withChip />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-semibold bg-[var(--medium-bg)] text-[var(--medium-text)] border border-[var(--medium-border)]">
                        Medium match
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">Central</span>
                    </div>
                    <p className="text-sm font-bold text-[var(--text-primary)] leading-snug">
                      Ayushman Bharat Health Cover
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Confirm family ration card eligibility
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center justify-center w-8 h-8 rounded-[6px] border border-[var(--border)] text-[var(--text-muted)] shrink-0">
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 4h12v16l-6-4-6 4V4z" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. How it works on a white band with coloured step circles + dotted connector */}
      <section className="bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <h2 className="text-[22px] sm:text-[24px] font-bold text-[var(--text-primary)] mb-8">
            {t('howItWorks.title')}
          </h2>

          <div className="relative">
            <div
              className="hidden md:block absolute top-7 left-[16%] right-[16%] border-t-2 border-dotted border-[var(--border)]"
              aria-hidden="true"
            />
            <ol className="relative grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {steps.map((step) => (
                <li key={step.num} className="flex md:flex-col items-start gap-4">
                  <span
                    className="w-14 h-14 rounded-full inline-flex items-center justify-center text-[22px] font-bold tabular-nums shrink-0 border-4 border-[var(--surface)]"
                    style={{ backgroundColor: step.bgVar, color: step.textVar }}
                  >
                    {step.num}
                  </span>
                  <div className="space-y-1.5">
                    <h3 className="text-[18px] font-bold text-[var(--text-primary)]">
                      {step.title}
                    </h3>
                    <p className="text-base text-[var(--text-muted)] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 3. Browse by category band (6 colourful tiles) */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 sm:py-12 space-y-6">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <h2 className="text-[22px] sm:text-[24px] font-bold text-[var(--text-primary)]">
              Browse by category
            </h2>
            <p className="text-base text-[var(--text-muted)] mt-1">
              Explore welfare support grouped by household need.
            </p>
          </div>
          <Link
            to="/schemes"
            className="text-base font-semibold text-[var(--teal)] hover:text-[var(--teal-hover)] underline underline-offset-4 transition-colors duration-150"
          >
            View all schemes
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BROWSE_CATEGORIES.map((cat) => (
            <Link
              key={cat.key}
              to={`/schemes?category=${cat.key}`}
              className="bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--teal)] rounded-[6px] p-5 flex items-start gap-4 transition-colors duration-150"
            >
              <CategoryIcon kind={cat.key} size={24} withChip />
              <div className="min-w-0 space-y-1">
                <h3 className="text-[18px] font-bold text-[var(--text-primary)] leading-snug">
                  {t(cat.labelKey)}
                </h3>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {cat.summary}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Popular Welfare Schemes */}
      <section className="max-w-[1100px] mx-auto px-4 sm:px-6 pb-10 sm:pb-12 space-y-6">
        <div className="flex flex-wrap items-baseline justify-between gap-4 pt-4 border-t border-[var(--border)]">
          <div>
            <h2 className="text-[22px] sm:text-[24px] font-bold text-[var(--text-primary)]">
              Popular Welfare Schemes
            </h2>
            <p className="text-base text-[var(--text-muted)] mt-1">
              Flagship social protection and welfare programs across Karnataka and Central Government.
            </p>
          </div>
          <Link
            to="/schemes"
            className="text-base font-semibold text-[var(--teal)] hover:text-[var(--teal-hover)] underline underline-offset-4 transition-colors duration-150"
          >
            View all schemes
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-[var(--surface)] rounded-[6px] border border-[var(--border)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredSchemes.map((scheme) => (
              <SchemeCard key={scheme._id} scheme={scheme} />
            ))}
          </div>
        )}
      </section>

      {/* 5. Who is it for strip + SDG strip */}
      <section className="bg-[var(--surface)] border-t border-[var(--border)]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 space-y-8">
          <div className="space-y-3">
            <h2 className="text-[18px] font-bold text-[var(--text-primary)]">
              Who is it for
            </h2>
            <div className="flex flex-wrap items-center gap-2.5">
              {targetGroups.map((group) => {
                const palette = getCategoryPalette(group.cat);
                return (
                  <Link
                    key={group.cat}
                    to={`/schemes?category=${group.cat}`}
                    className="min-h-[40px] inline-flex items-center px-3.5 py-2 rounded-[6px] text-sm font-semibold border border-[var(--border)] hover:border-[var(--teal)] transition-colors duration-150"
                    style={{ backgroundColor: palette.bg, color: palette.fg }}
                  >
                    {group.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-[6px] text-xs font-bold text-[var(--deep-text)]"
                style={{ backgroundColor: 'var(--sdg-1-bg)' }}
              >
                SDG 1 · No Poverty
              </span>
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-[6px] text-xs font-bold text-[var(--deep-text)]"
                style={{ backgroundColor: 'var(--sdg-10-bg)' }}
              >
                SDG 10 · Reduced Inequalities
              </span>
              <span
                className="inline-flex items-center px-3 py-1.5 rounded-[6px] text-xs font-bold text-[var(--deep-text)]"
                style={{ backgroundColor: 'var(--sdg-16-bg)' }}
              >
                SDG 16 · Strong Institutions
              </span>
            </div>

            <a
              href="https://www.myscheme.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--teal)] hover:text-[var(--teal-hover)] font-semibold underline underline-offset-2 shrink-0 transition-colors duration-150"
            >
              Visit myScheme.gov.in
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
