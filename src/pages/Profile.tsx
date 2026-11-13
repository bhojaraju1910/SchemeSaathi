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
import { Loader2 } from 'lucide-react';

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
        <Loader2 className="w-7 h-7 text-[var(--teal)] animate-spin" />
        <p className="text-base text-[var(--text-muted)]">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-[680px] bg-[var(--surface)] border border-[var(--border)] rounded-[6px] p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="pb-5 border-b border-[var(--border)] space-y-2">
          <h1 className="text-[28px] font-bold text-[var(--text-primary)] leading-tight">
            {t('profile.title')}
          </h1>
          <p className="text-base text-[var(--text-muted)]">
            {t('profile.subtitle')}
          </p>
          <div className="inline-block px-3 py-1.5 rounded-[6px] bg-[var(--teal-tint)] text-sm font-medium text-[var(--teal)]">
            Zero ID data collected — we never ask for Aadhaar, bank account, or phone numbers.
          </div>
        </div>

        {error && (
          <div className="p-4 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-[6px] text-sm font-medium text-[var(--error)]" role="alert">
            {error}
          </div>
        )}

        {savedSuccess && (
          <div className="p-4 bg-[var(--success-bg)] border border-[var(--success-border)] rounded-[6px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-sm font-semibold text-[var(--success)]">
              {t('profile.savedSuccess')}
            </span>
            <button
              type="button"
              onClick={() => navigate('/recommendations')}
              className="min-h-[44px] inline-flex items-center justify-center px-4 py-2 bg-[var(--teal)] hover:bg-[var(--teal-hover)] text-[var(--deep-text)] font-semibold text-sm rounded-[6px] transition-colors duration-150 cursor-pointer self-start sm:self-auto"
            >
              {t('profile.seeSchemes')}
            </button>
          </div>
        )}

        {/* Single-column grouped form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Basic Details */}
          <section className="space-y-4">
            <div className="bg-[var(--surface-subtle)] border-l-4 border-[var(--teal)] px-4 py-2.5 rounded-r-[6px]">
              <h2 className="text-[18px] font-bold text-[var(--text-primary)]">
                1. Age & State of Residence
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Used to check age thresholds and state-specific welfare programs.
              </p>
            </div>

            <div>
              <label htmlFor="profile-age" className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
                {t('profile.age')}
              </label>
              <p className="text-sm text-[var(--text-muted)] mb-1.5">
                Enter your completed age in years.
              </p>
              <input
                id="profile-age"
                type="number"
                min="0"
                max="125"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder={t('profile.agePlaceholder')}
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--teal)] rounded-[6px] text-base text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label htmlFor="profile-state" className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
                {t('profile.state')}
              </label>
              <p className="text-sm text-[var(--text-muted)] mb-1.5">
                Select the state where your family currently resides.
              </p>
              <select
                id="profile-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--teal)] rounded-[6px] text-base text-[var(--text-primary)] cursor-pointer"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Section 2: Household Income */}
          <section className="space-y-3">
            <div className="bg-[var(--surface-subtle)] border-l-4 border-[var(--saffron)] px-4 py-2.5 rounded-r-[6px]">
              <h2 className="text-[18px] font-bold text-[var(--text-primary)]">
                2. {t('profile.incomeRange')}
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Approximate annual household bracket only — no proof or exact figure is needed.
              </p>
            </div>

            <div className="space-y-2">
              {[
                { value: 'low', label: t('profile.incomeLow') },
                { value: 'lower_middle', label: t('profile.incomeLowerMiddle') },
                { value: 'middle', label: t('profile.incomeMiddle') },
                { value: 'high', label: t('profile.incomeHigh') },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-[6px] border text-base cursor-pointer transition-colors duration-150 ${
                    incomeRange === opt.value
                      ? 'bg-[var(--teal-tint)] border-[var(--teal)] font-semibold text-[var(--text-primary)]'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--teal)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="incomeRange"
                    value={opt.value}
                    checked={incomeRange === opt.value}
                    onChange={() => setIncomeRange(opt.value)}
                    className="w-4 h-4 accent-[var(--teal)]"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Section 3: Categories */}
          <section className="space-y-3">
            <div className="bg-[var(--surface-subtle)] border-l-4 border-[var(--step-3-bg)] px-4 py-2.5 rounded-r-[6px]">
              <h2 className="text-[18px] font-bold text-[var(--text-primary)]">
                3. {t('profile.categoriesLabel')}
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Select every group that describes you or your family members.
              </p>
            </div>

            <div className="space-y-2">
              {CATEGORY_KEYS.map((cat) => {
                const checked = category.includes(cat.key);
                return (
                  <label
                    key={cat.key}
                    className={`min-h-[44px] flex items-center gap-3 px-4 py-2.5 rounded-[6px] border text-base cursor-pointer transition-colors duration-150 ${
                      checked
                        ? 'bg-[var(--teal-tint)] border-[var(--teal)] font-semibold text-[var(--text-primary)]'
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--teal)]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleCategoryToggle(cat.key)}
                      className="w-4 h-4 accent-[var(--teal)]"
                    />
                    <span>{t(cat.labelKey)}</span>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Section 4: Livelihood & Household Size */}
          <section className="space-y-4">
            <div className="bg-[var(--surface-subtle)] border-l-4 border-[var(--teal)] px-4 py-2.5 rounded-r-[6px]">
              <h2 className="text-[18px] font-bold text-[var(--text-primary)]">
                4. Occupation & Family Details
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Optional details to help surface livelihood-specific schemes.
              </p>
            </div>

            <div>
              <label htmlFor="profile-occupation" className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
                {t('profile.occupation')}
              </label>
              <input
                id="profile-occupation"
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                placeholder={t('profile.occupationPlaceholder')}
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--teal)] rounded-[6px] text-base text-[var(--text-primary)]"
              />
            </div>

            <div>
              <label htmlFor="profile-family" className="block text-sm font-semibold text-[var(--text-primary)] mb-1">
                {t('profile.familySize')}
              </label>
              <input
                id="profile-family"
                type="number"
                min="1"
                max="30"
                value={familySize}
                onChange={(e) => setFamilySize(e.target.value)}
                placeholder="e.g. 4"
                className="w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--teal)] rounded-[6px] text-base text-[var(--text-primary)]"
              />
            </div>
          </section>

          {/* Actions */}
          <div className="pt-6 border-t border-[var(--border)] flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-6 py-2.5 bg-[var(--teal)] hover:bg-[var(--teal-hover)] text-[var(--deep-text)] font-semibold text-base rounded-[6px] transition-colors duration-150 inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{t('profile.saveBtn')}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/recommendations')}
              className="min-h-[44px] px-5 py-2.5 bg-[var(--surface)] hover:border-[var(--teal)] border border-[var(--border)] text-[var(--text-primary)] text-base font-semibold rounded-[6px] transition-colors duration-150 cursor-pointer"
            >
              {t('profile.seeSchemes')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
