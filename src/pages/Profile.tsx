import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  getMirrorProfile,
  isApiUnavailableError,
  isMirrorToken,
  saveMirrorProfile,
} from '../services/authMirrorService';
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

const INDIAN_STATES = [
  'Karnataka',
  'Maharashtra',
  'Tamil Nadu',
  'Andhra Pradesh',
  'Telangana',
  'Kerala',
  'Delhi',
  'Uttar Pradesh',
  'Bihar',
  'West Bengal',
  'Gujarat',
  'Rajasthan',
  'Madhya Pradesh',
  'Punjab',
  'Haryana',
  'Odisha',
  'Assam',
];

const CATEGORY_KEYS = [
  { key: 'senior_citizen', labelKey: 'profile.cat_senior_citizen' },
  { key: 'student', labelKey: 'profile.cat_student' },
  { key: 'woman', labelKey: 'profile.cat_woman' },
  { key: 'farmer', labelKey: 'profile.cat_farmer' },
  { key: 'disabled', labelKey: 'profile.cat_disabled' },
  { key: 'child', labelKey: 'profile.cat_child' },
  { key: 'general', labelKey: 'profile.cat_general' },
];

export const Profile: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [age, setAge] = useState<string>('');
  const [state, setState] = useState<string>('Karnataka');
  const [incomeRange, setIncomeRange] = useState<string>('low');
  const [category, setCategory] = useState<string[]>([]);
  const [occupation, setOccupation] = useState<string>('');
  const [familySize, setFamilySize] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const applyProfileState = (d: any) => {
    setAge(d.age !== null && d.age !== undefined ? String(d.age) : '');
    setState(d.state || 'Karnataka');
    setIncomeRange(d.incomeRange || 'low');
    setCategory(Array.isArray(d.category) ? d.category : []);
    setOccupation(d.occupation || '');
    setFamilySize(d.familySize !== null && d.familySize !== undefined ? String(d.familySize) : '');
  };

  useEffect(() => {
    async function loadProfile() {
      if (isMirrorToken(token) && user) {
        applyProfileState(getMirrorProfile(user.id));
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/profile');
        if (res.data && typeof res.data === 'object') {
          applyProfileState(res.data);
          if (user) {
            saveMirrorProfile(user.id, res.data);
          }
        }
      } catch (err) {
        console.error('Failed to load profile from API, using mirror profile:', err);
        if (user) {
          applyProfileState(getMirrorProfile(user.id));
        }
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user, token]);

  const handleCategoryToggle = (catKey: string) => {
    setCategory((prev) =>
      prev.includes(catKey) ? prev.filter((c) => c !== catKey) : [...prev, catKey]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSavedSuccess(false);

    const payload = {
      age: age ? Number(age) : null,
      state,
      incomeRange,
      category,
      occupation,
      familySize: familySize ? Number(familySize) : undefined,
    };

    if (user) {
      saveMirrorProfile(user.id, payload);
    }

    if (isMirrorToken(token)) {
      setSavedSuccess(true);
      setSaving(false);
      return;
    }

    try {
      await api.put('/profile', {
        ...payload,
        familySize: familySize ? Number(familySize) : null,
      });

      setSavedSuccess(true);
    } catch (err: any) {
      if (isApiUnavailableError(err) || err?.response?.status === 401) {
        setSavedSuccess(true);
      } else {
        setError(err.response?.data?.message || 'Failed to update profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#5AA9FF] animate-spin" />
        <p className="text-sm text-[#9FB0C8]">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:px-6">
      <div className="bg-[#14213B] border border-[#243A63] rounded-3xl p-6 sm:p-10 shadow-xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#243A63]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <User className="w-5 h-5 text-[#5AA9FF]" />
              <h1 className="text-2xl font-bold text-[#EAF1FB] font-heading">
                {t('profile.title')}
              </h1>
            </div>
            <p className="text-xs text-[#9FB0C8]">
              {t('profile.subtitle')}
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5AA9FF]/10 border border-[#5AA9FF]/30 text-xs font-medium text-[#5AA9FF] self-start sm:self-center">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero ID Data Collected</span>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {savedSuccess && (
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{t('profile.savedSuccess')}</span>
            </div>
            <button
              onClick={() => navigate('/recommendations')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400 text-[#0B1426] font-bold rounded-lg text-xs hover:bg-emerald-300 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span>{t('profile.seeSchemes')}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {/* Age & State Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-[#EAF1FB] mb-1.5">
                {t('profile.age')}
              </label>
              <input
                type="number"
                min="0"
                max="125"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder={t('profile.agePlaceholder')}
                className="w-full px-4 py-2.5 bg-[#0B1426] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-sm text-[#EAF1FB] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#EAF1FB] mb-1.5">
                {t('profile.state')}
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#0B1426] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-sm text-[#EAF1FB] focus:outline-none transition-colors cursor-pointer"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Household Income Range */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-[#EAF1FB]">
                {t('profile.incomeRange')}
              </label>
              <span className="text-[11px] text-[#9FB0C8] flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-[#5AA9FF]" />
                Approximate bracket, no proof needed here
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { value: 'low', label: t('profile.incomeLow') },
                { value: 'lower_middle', label: t('profile.incomeLowerMiddle') },
                { value: 'middle', label: t('profile.incomeMiddle') },
                { value: 'high', label: t('profile.incomeHigh') },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                    incomeRange === opt.value
                      ? 'bg-[#5AA9FF]/15 border-[#5AA9FF] text-[#EAF1FB]'
                      : 'bg-[#0B1426] border-[#243A63] text-[#9FB0C8] hover:border-[#5AA9FF]/40 hover:text-[#EAF1FB]'
                  }`}
                >
                  <input
                    type="radio"
                    name="incomeRange"
                    value={opt.value}
                    checked={incomeRange === opt.value}
                    onChange={() => setIncomeRange(opt.value)}
                    className="accent-[#5AA9FF]"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Categories Checkboxes */}
          <div>
            <label className="block text-xs font-semibold text-[#EAF1FB] mb-2">
              {t('profile.categoriesLabel')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CATEGORY_KEYS.map((cat) => {
                const checked = category.includes(cat.key);
                return (
                  <label
                    key={cat.key}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                      checked
                        ? 'bg-[#5AA9FF]/15 border-[#5AA9FF] text-[#EAF1FB]'
                        : 'bg-[#0B1426] border-[#243A63] text-[#9FB0C8] hover:border-[#5AA9FF]/40 hover:text-[#EAF1FB]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleCategoryToggle(cat.key)}
                      className="accent-[#5AA9FF] rounded"
                    />
                    <span>{t(cat.labelKey)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Occupation & Family Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-[#EAF1FB] mb-1.5">
                {t('profile.occupation')}
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder={t('profile.occupationPlaceholder')}
                className="w-full px-4 py-2.5 bg-[#0B1426] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-sm text-[#EAF1FB] focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#EAF1FB] mb-1.5">
                {t('profile.familySize')}
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={familySize}
                onChange={(e) => setFamilySize(e.target.value)}
                placeholder="e.g. 4"
                className="w-full px-4 py-2.5 bg-[#0B1426] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-sm text-[#EAF1FB] focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t border-[#243A63] flex flex-wrap items-center justify-between gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#5AA9FF] hover:bg-[#5AA9FF]/90 text-[#0B1426] font-semibold text-sm rounded-xl transition-all shadow-md shadow-[#5AA9FF]/10 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{t('profile.saveBtn')}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/recommendations')}
              className="px-5 py-3 bg-[#0B1426] hover:bg-[#14213B] border border-[#243A63] hover:border-[#5AA9FF]/50 text-[#EAF1FB] text-sm font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[#5AA9FF]" />
              <span>{t('profile.seeSchemes')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
