import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/EmptyState';
import SampleBadge from '../components/SampleBadge';
import { getHardcodedSchemeById } from '../services/schemeMirrorService';
import {
  getMirrorSavedSchemes,
  isMirrorToken,
  recordMirrorApplicationStatus,
  removeMirrorSavedScheme,
} from '../services/authMirrorService';
import {
  Bookmark,
  Trash2,
  ExternalLink,
  CheckCircle2,
  ChevronRight,
  Building,
} from 'lucide-react';

interface SavedRecord {
  _id: string;
  userId: string;
  schemeId: string;
  savedAt: string;
  scheme: any;
  status?: 'clicked' | 'applied' | 'not_applied';
}

export const Saved: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, token } = useAuth();
  const [savedList, setSavedList] = useState<SavedRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSaved = async () => {
    try {
      setLoading(true);
      if (isMirrorToken(token) && user) {
        setSavedList(getMirrorSavedSchemes(user.id) as SavedRecord[]);
        return;
      }

      const res = await api.get('/saved');
      const records = (Array.isArray(res.data) ? res.data : []).map((item: SavedRecord) => ({
        ...item,
        scheme: item.scheme || getHardcodedSchemeById(item.schemeId)?.scheme,
      }));
      setSavedList(records);
    } catch (err) {
      console.error('Failed to load saved schemes, using mirror store:', err);
      if (user) {
        setSavedList(getMirrorSavedSchemes(user.id) as SavedRecord[]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, [user, token]);

  const handleRemove = async (schemeId: string) => {
    setActionLoading(schemeId);
    try {
      if (user) {
        removeMirrorSavedScheme(user.id, schemeId);
      }
      if (!isMirrorToken(token)) {
        await api.delete(`/saved/${schemeId}`).catch(() => {});
      }
      setSavedList((prev) => prev.filter((item) => item.schemeId !== schemeId));
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusToggle = async (schemeId: string, currentStatus?: string) => {
    const nextStatus = currentStatus === 'applied' ? 'not_applied' : 'applied';
    setActionLoading(schemeId);
    try {
      if (user) {
        recordMirrorApplicationStatus(user.id, schemeId, nextStatus);
      }
      if (!isMirrorToken(token)) {
        await api.post('/applications/status', { schemeId, status: nextStatus }).catch(() => {});
      }
      setSavedList((prev) =>
        prev.map((item) =>
          item.schemeId === schemeId ? { ...item, status: nextStatus } : item
        )
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleOfficialClick = async (schemeId: string) => {
    if (user) {
      recordMirrorApplicationStatus(user.id, schemeId, 'clicked');
    }
    if (!isMirrorToken(token)) {
      try {
        await api.post('/applications/click', { schemeId, status: 'clicked' });
      } catch {
        // non-blocking
      }
    }
  };

  const currentLang = i18n.language as 'en' | 'kn' | 'hi';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#243A63]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Bookmark className="w-6 h-6 text-[#FF7BA5]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#EAF1FB] font-heading">
              {t('savedPage.title')}
            </h1>
          </div>
          <p className="text-sm text-[#9FB0C8]">
            {t('savedPage.subtitle')}
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#14213B] border border-[#243A63] text-[#EAF1FB] self-start sm:self-auto">
          {savedList.length} Scheme{savedList.length === 1 ? '' : 's'} Bookmarked
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-[#14213B] rounded-2xl animate-pulse border border-[#243A63]" />
          ))}
        </div>
      ) : savedList.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title={t('savedPage.empty')}
          description="Browse potentially relevant schemes and click the bookmark button to save them here."
          actionText={t('savedPage.browseNow')}
          actionLink="/schemes"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savedList.map((item) => {
            const scheme = item.scheme;
            if (!scheme) return null;

            const hasTranslation =
              currentLang !== 'en' &&
              scheme.translations &&
              scheme.translations[currentLang] &&
              Boolean(scheme.translations[currentLang]?.title);

            const displayTitle = hasTranslation
              ? scheme.translations[currentLang].title
              : scheme.title;

            const displayDescription = hasTranslation && scheme.translations[currentLang]?.shortDescription
              ? scheme.translations[currentLang].shortDescription
              : scheme.shortDescription;

            const isApplied = item.status === 'applied';

            return (
              <div
                key={item.schemeId}
                className="bg-[#14213B] border border-[#243A63] rounded-3xl p-6 flex flex-col justify-between hover:border-[#5AA9FF]/40 transition-all shadow-md"
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-[#5AA9FF]/10 text-[#5AA9FF] border border-[#5AA9FF]/20">
                        {String(t(`categories.${scheme.category}`, scheme.category))}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-lg bg-[#243A63]/60 text-[#9FB0C8] border border-[#243A63] flex items-center gap-1">
                        <Building className="w-3 h-3" />
                        {scheme.level === 'central'
                          ? t('schemesPage.levelCentral')
                          : `${scheme.state || 'State'}`}
                      </span>
                      {scheme.isSample && <SampleBadge />}
                    </div>

                    <button
                      onClick={() => handleRemove(item.schemeId)}
                      disabled={actionLoading === item.schemeId}
                      className="p-1.5 text-[#9FB0C8] hover:text-rose-400 rounded-lg hover:bg-[#0B1426] transition-colors cursor-pointer"
                      title={t('savedPage.remove')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-[#EAF1FB] font-heading mb-1.5 hover:text-[#5AA9FF] transition-colors line-clamp-2">
                    <Link to={`/schemes/${scheme._id}`}>{displayTitle}</Link>
                  </h3>

                  <p className="text-xs text-[#9FB0C8] line-clamp-2 mb-4 leading-relaxed">
                    {displayDescription}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#243A63] space-y-3">
                  {/* Status row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[#9FB0C8]">{t('savedPage.status')}:</span>
                      {isApplied ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t('savedPage.statusApplied')}
                        </span>
                      ) : (
                        <span className="text-amber-300 font-medium">
                          {item.status === 'clicked' ? t('savedPage.statusClicked') : t('savedPage.statusNotApplied')}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleStatusToggle(item.schemeId, item.status)}
                      disabled={actionLoading === item.schemeId}
                      className={`text-xs px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        isApplied
                          ? 'bg-[#243A63] text-[#9FB0C8] hover:text-[#EAF1FB]'
                          : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                      }`}
                    >
                      {isApplied ? t('savedPage.markNotApplied') : t('savedPage.markApplied')}
                    </button>
                  </div>

                  {/* Links */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      to={`/schemes/${scheme._id}`}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#EAF1FB] bg-[#0B1426] border border-[#243A63] hover:border-[#5AA9FF] transition-all"
                    >
                      <span>{t('recommendations.viewDetails')}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <a
                      href={scheme.applyUrl || 'https://www.myscheme.gov.in/'}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleOfficialClick(scheme._id)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#0B1426] bg-[#5AA9FF] hover:bg-[#5AA9FF]/90 transition-all"
                    >
                      <span>{t('recommendations.officialPage')}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Saved;
