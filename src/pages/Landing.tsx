import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import SchemeCard, { SchemeData } from '../components/SchemeCard';
import { HARDCODED_SCHEMES } from '../data/schemes';
import api from '../api/axios';
import {
  Sparkles,
  Compass,
  ArrowRight,
  ShieldCheck,
  Users,
  Lock,
  FileCheck2,
  ExternalLink,
  Award,
} from 'lucide-react';

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

  return (
    <div className="space-y-20 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#5AA9FF]/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#14213B] border border-[#243A63] text-xs font-semibold text-[#5AA9FF] mb-6 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-[#5AA9FF]" />
          <span>Privacy-First Government Scheme Discovery for Indian Families</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#EAF1FB] font-heading max-w-4xl mx-auto leading-tight">
          {t('hero.title')}
        </h1>

        <p className="mt-6 text-base sm:text-lg text-[#9FB0C8] max-w-2xl mx-auto leading-relaxed">
          {t('hero.subtitle')}
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            to={user ? '/recommendations' : '/profile'}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-[#0B1426] bg-[#5AA9FF] hover:bg-[#5AA9FF]/90 shadow-lg shadow-[#5AA9FF]/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t('hero.ctaFind')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/schemes"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-[#EAF1FB] bg-[#14213B] hover:bg-[#14213B]/80 border border-[#243A63] hover:border-[#5AA9FF]/40 transition-all cursor-pointer"
          >
            <Compass className="w-4 h-4 text-[#9FB0C8]" />
            <span>{t('hero.ctaBrowse')}</span>
          </Link>
        </div>

        {/* Hard Rule & Privacy Note */}
        <p className="mt-5 text-xs text-[#9FB0C8] max-w-lg mx-auto flex items-center justify-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-[#5AA9FF] shrink-0" />
          <span>{t('hero.ruleNote')}</span>
        </p>

        {/* Target Citizen Chips */}
        <div className="mt-10 pt-8 border-t border-[#243A63]/60 max-w-4xl mx-auto">
          <p className="text-xs uppercase tracking-wider font-semibold text-[#9FB0C8] mb-3">
            Tailored For Diverse Family Needs
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {targetGroups.map((group, idx) => (
              <Link
                key={idx}
                to={`/schemes?category=${group.cat}`}
                className="px-3 py-1.5 rounded-xl bg-[#14213B]/80 border border-[#243A63] hover:border-[#5AA9FF]/60 text-xs text-[#EAF1FB] transition-all hover:scale-105"
              >
                {group.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3-Step How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#EAF1FB] font-heading">
            {t('howItWorks.title')}
          </h2>
          <p className="text-sm text-[#9FB0C8] mt-2 max-w-xl mx-auto">
            Clear, step-by-step guidance without complex paperwork jargon.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#14213B] border border-[#243A63] rounded-2xl p-6 relative">
            <div className="w-12 h-12 rounded-xl bg-[#5AA9FF]/10 text-[#5AA9FF] border border-[#5AA9FF]/20 flex items-center justify-center font-bold text-lg mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#EAF1FB] font-heading mb-2">
              {t('howItWorks.step1Title')}
            </h3>
            <p className="text-sm text-[#9FB0C8] leading-relaxed">
              {t('howItWorks.step1Desc')}
            </p>
          </div>

          <div className="bg-[#14213B] border border-[#243A63] rounded-2xl p-6 relative">
            <div className="w-12 h-12 rounded-xl bg-[#F7B6CE]/10 text-[#FF7BA5] border border-[#FF7BA5]/20 flex items-center justify-center font-bold text-lg mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#EAF1FB] font-heading mb-2">
              {t('howItWorks.step2Title')}
            </h3>
            <p className="text-sm text-[#9FB0C8] leading-relaxed">
              {t('howItWorks.step2Desc')}
            </p>
          </div>

          <div className="bg-[#14213B] border border-[#243A63] rounded-2xl p-6 relative">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-lg mb-4">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#EAF1FB] font-heading mb-2">
              {t('howItWorks.step3Title')}
            </h3>
            <p className="text-sm text-[#9FB0C8] leading-relaxed">
              {t('howItWorks.step3Desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Featured Sample Schemes Catalog Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-[#EAF1FB] font-heading">
                Popular Welfare Schemes
              </h2>
            </div>
            <p className="text-sm text-[#9FB0C8]">
              Flagship social protection and welfare programs across Karnataka and Central Government.
            </p>
          </div>
          <Link
            to="/schemes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5AA9FF] hover:underline"
          >
            <span>View all schemes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 bg-[#14213B] rounded-2xl animate-pulse border border-[#243A63]" />
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

      {/* Trust & Official Portals Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#14213B] border border-[#243A63] rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl font-bold text-[#EAF1FB] font-heading flex items-center justify-center md:justify-start gap-2">
              <Award className="w-5 h-5 text-[#5AA9FF]" />
              <span>Independent Guidance, Real Impact</span>
            </h3>
            <p className="text-sm text-[#9FB0C8] max-w-xl">
              All schemes link out directly to designated central and state government portals like myScheme and Seva Sindhu for safe and official application processing.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://www.myscheme.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0B1426] border border-[#243A63] text-xs font-semibold text-[#EAF1FB] hover:border-[#5AA9FF] transition-all"
            >
              <span>Visit myScheme.gov.in</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#5AA9FF]" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
