import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import SchemeCard, { SchemeData } from '../components/SchemeCard';
import { HARDCODED_SCHEMES } from '../data/schemes';
import {
  getMirrorDashboardStats,
  isMirrorToken,
} from '../services/authMirrorService';
import {
  LayoutDashboard,
  Compass,
  Sparkles,
  Bookmark,
  ExternalLink,
  SlidersHorizontal,
  FolderOpen,
  ArrowRight,
  Loader2,
  Layers,
} from 'lucide-react';

interface StatsResponse {
  availableSchemes: number;
  potentialMatches: number;
  savedSchemes: number;
  applicationLinks: number;
  topMatches?: {
    scheme: SchemeData;
    match: 'High' | 'Medium';
    reasons: string[];
    missing: string[];
  }[];
}

const CATEGORIES = [
  { key: 'education', labelKey: 'categories.education' },
  { key: 'healthcare', labelKey: 'categories.healthcare' },
  { key: 'housing', labelKey: 'categories.housing' },
  { key: 'employment', labelKey: 'categories.employment' },
  { key: 'women_child', labelKey: 'categories.women_child' },
  { key: 'senior_citizens', labelKey: 'categories.senior_citizens' },
  { key: 'agriculture', labelKey: 'categories.agriculture' },
];

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadStats() {
      const applyMirrorStats = () => {
        setStats(getMirrorDashboardStats(user?.id || 'user_demo'));
      };

      try {
        setLoading(true);
        if (isMirrorToken(token)) {
          applyMirrorStats();
          return;
        }
        const res = await api.get('/dashboard/stats');
        if (res.data && typeof res.data === 'object' && typeof res.data.availableSchemes === 'number') {
          setStats(res.data);
        } else {
          applyMirrorStats();
        }
      } catch (err) {
        console.error('Failed to load dashboard stats, mirroring locally:', err);
        applyMirrorStats();
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user, token]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#5AA9FF] animate-spin" />
        <p className="text-sm text-[#9FB0C8]">Loading dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#243A63]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="w-6 h-6 text-[#5AA9FF]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#EAF1FB] font-heading">
              {t('dashboard.title')}
            </h1>
          </div>
          <p className="text-sm text-[#9FB0C8]">
            Welcome, <span className="text-[#EAF1FB] font-semibold">{user?.name}</span>. Here is an overview of your social-protection journey.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#0B1426] bg-[#5AA9FF] hover:bg-[#5AA9FF]/90 transition-all shadow-sm"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{t('dashboard.updateProfile')}</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label={t('dashboard.statAvailable')}
          value={stats?.availableSchemes ?? HARDCODED_SCHEMES.length}
          icon={Compass}
          subtext="Catalog database count"
          accentColor="text-[#5AA9FF]"
          iconBgColor="bg-[#5AA9FF]/10"
        />
        <StatCard
          label={t('dashboard.statMatches')}
          value={stats?.potentialMatches ?? 0}
          icon={Sparkles}
          subtext="Filtered by current profile"
          accentColor="text-emerald-400"
          iconBgColor="bg-emerald-500/10"
        />
        <StatCard
          label={t('dashboard.statSaved')}
          value={stats?.savedSchemes ?? 0}
          icon={Bookmark}
          subtext="In your personal shortlist"
          accentColor="text-[#FF7BA5]"
          iconBgColor="bg-[#FF7BA5]/10"
        />
        <StatCard
          label={t('dashboard.statApplications')}
          value={stats?.applicationLinks ?? 0}
          icon={ExternalLink}
          subtext="Official website redirects"
          accentColor="text-purple-400"
          iconBgColor="bg-purple-500/10"
        />
      </div>

      {/* Category Navigation Strip */}
      <div className="bg-[#14213B] border border-[#243A63] rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#5AA9FF]" />
            <h2 className="text-lg font-bold text-[#EAF1FB] font-heading">
              Explore By Focus Category
            </h2>
          </div>
          <Link
            to="/schemes"
            className="text-xs text-[#5AA9FF] hover:underline flex items-center gap-1 font-semibold"
          >
            <span>All Directory</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex flex-wrap gap-2.5 pt-1">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.key}
              to={`/schemes?category=${cat.key}`}
              className="px-4 py-2 rounded-xl bg-[#0B1426] border border-[#243A63] hover:border-[#5AA9FF] text-xs font-medium text-[#EAF1FB] hover:text-[#5AA9FF] transition-all hover:scale-105"
            >
              {t(cat.labelKey)}
            </Link>
          ))}
        </div>
      </div>

      {/* Top Potential Matches Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#EAF1FB] font-heading">
              {t('dashboard.topMatches')}
            </h2>
            <p className="text-xs text-[#9FB0C8]">
              High priority recommendations derived from your demographic profile.
            </p>
          </div>

          <Link
            to="/recommendations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5AA9FF] hover:underline"
          >
            <span>View all matches</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats?.topMatches && stats.topMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.topMatches.map((item) => (
              <SchemeCard
                key={item.scheme._id}
                scheme={item.scheme}
                match={item.match}
                reasons={item.reasons}
                missing={item.missing}
              />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-3xl bg-[#14213B]/50 border border-[#243A63] text-center">
            <p className="text-sm text-[#9FB0C8] mb-4">
              Complete your profile details to unlock personalized scheme matching.
            </p>
            <Link
              to="/profile"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#5AA9FF] text-[#0B1426] font-semibold text-xs rounded-xl"
            >
              <span>Setup Profile Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        <Link
          to="/profile"
          className="p-6 bg-[#14213B] border border-[#243A63] hover:border-[#5AA9FF] rounded-2xl transition-all group block"
        >
          <SlidersHorizontal className="w-6 h-6 text-[#5AA9FF] mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-[#EAF1FB] font-heading mb-1">
            {t('dashboard.updateProfile')}
          </h3>
          <p className="text-xs text-[#9FB0C8]">
            Adjust your age, family category, or state to see updated matching schemes.
          </p>
        </Link>

        <Link
          to="/schemes"
          className="p-6 bg-[#14213B] border border-[#243A63] hover:border-[#5AA9FF] rounded-2xl transition-all group block"
        >
          <Compass className="w-6 h-6 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-[#EAF1FB] font-heading mb-1">
            {t('dashboard.browseCatalog')}
          </h3>
          <p className="text-xs text-[#9FB0C8]">
            Explore the full database of central and state government protection programs.
          </p>
        </Link>

        <Link
          to="/saved"
          className="p-6 bg-[#14213B] border border-[#243A63] hover:border-[#5AA9FF] rounded-2xl transition-all group block"
        >
          <FolderOpen className="w-6 h-6 text-[#FF7BA5] mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-base font-bold text-[#EAF1FB] font-heading mb-1">
            {t('dashboard.viewSaved')}
          </h3>
          <p className="text-xs text-[#9FB0C8]">
            Check your saved schemes, track applications, and visit official portals.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
