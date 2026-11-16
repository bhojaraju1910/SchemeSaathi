import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import PageHero from '../components/PageHero';
import AccentWord from '../components/AccentWord';
import FallbackNotice from '../components/FallbackNotice';
import { getHardcodedSchemeById } from '../services/schemeMirrorService';
import { loadEmergencySchemes, withTimeout } from '../utils/clientCache';
import {
  LoaderIcon,
  PlusIcon,
  TrashIcon,
} from '../components/Icons';

interface RuleItem {
  field: string;
  op: string;
  value: any;
  required: boolean;
  label: string;
}

export const AdminSchemeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { t: _t } = useTranslation();

  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [category, setCategory] = useState('senior_citizens');
  const [level, setLevel] = useState<'central' | 'state'>('central');
  const [state, setState] = useState('All');
  const [benefitsText, setBenefitsText] = useState('');
  const [documentsText, setDocumentsText] = useState('');
  const [applyUrl, setApplyUrl] = useState('https://www.myscheme.gov.in/');
  const [sourceUrl, setSourceUrl] = useState('https://www.myscheme.gov.in/');
  const [isSample, setIsSample] = useState(false);
  const [verified, setVerified] = useState(false);
  const [lastVerified, setLastVerified] = useState<string | null>(null);

  const [knTitle, setKnTitle] = useState('');
  const [knDesc, setKnDesc] = useState('');
  const [hiTitle, setHiTitle] = useState('');
  const [hiDesc, setHiDesc] = useState('');

  const [rules, setRules] = useState<RuleItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const populateForm = (scheme: any, criteria?: any) => {
    setTitle(scheme.title || '');
    setShortDescription(scheme.shortDescription || '');
    setCategory(scheme.category || 'senior_citizens');
    setLevel(scheme.level || 'central');
    setState(scheme.state || 'All');
    setBenefitsText((scheme.benefits || []).join('\n'));
    setDocumentsText((scheme.documentsRequired || []).join('\n'));
    setApplyUrl(scheme.applyUrl || 'https://www.myscheme.gov.in/');
    setSourceUrl(scheme.sourceUrl || 'https://www.myscheme.gov.in/');
    setIsSample(Boolean(scheme.isSample));
    setVerified(Boolean(scheme.verified));
    setLastVerified(
      scheme.lastVerified ? new Date(scheme.lastVerified).toISOString() : null
    );

    if (scheme.translations?.kn) {
      setKnTitle(scheme.translations.kn.title || '');
      setKnDesc(scheme.translations.kn.shortDescription || '');
    }
    if (scheme.translations?.hi) {
      setHiTitle(scheme.translations.hi.title || '');
      setHiDesc(scheme.translations.hi.shortDescription || '');
    }

    const rawRules = criteria?.rules || scheme.rules;
    if (Array.isArray(rawRules)) {
      setRules(
        rawRules.map((r: any) => ({
          field: r.field || 'age',
          op: r.op || 'gte',
          value: Array.isArray(r.value) ? r.value.join(', ') : String(r.value),
          required: r.required !== false,
          label: r.label || '',
        }))
      );
    }
  };

  useEffect(() => {
    async function loadSchemeForEdit() {
      if (!isEditMode || !id) return;
      setLoading(true);

      const fallbackLookup = async () => {
        const emergency = await loadEmergencySchemes();
        const found = getHardcodedSchemeById(id, emergency);
        if (found) {
          populateForm(found.scheme, found.criteria);
          setIsFallback(true);
          setError(null);
        } else {
          setError('Could not load scheme data.');
        }
      };

      try {
        const res = await withTimeout(
          (signal) => api.get(`/schemes/${id}`, { signal }),
          4000
        );
        if (res.data?.scheme) {
          populateForm(res.data.scheme, res.data.criteria);
          setIsFallback(false);
          setError(null);
        } else {
          await fallbackLookup();
        }
      } catch {
        await fallbackLookup();
      } finally {
        setLoading(false);
      }
    }

    loadSchemeForEdit();
  }, [id, isEditMode]);

  const handleVerifiedToggle = (checked: boolean) => {
    setVerified(checked);
    setLastVerified(checked ? new Date().toISOString() : null);
  };

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      {
        field: 'age',
        op: 'gte',
        value: '60',
        required: true,
        label: 'Age 60 years or above',
      },
    ]);
  };

  const removeRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, patch: Partial<RuleItem>) => {
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r))
    );
  };

  const clearClientSessionCache = () => {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    try {
      for (const k of Object.keys(window.sessionStorage)) {
        if (k.startsWith('ss_cache_')) {
          window.sessionStorage.removeItem(k);
        }
      }
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !shortDescription) {
      setError('Title and short description are required.');
      return;
    }

    setSaving(true);
    setError(null);

    const cleanRules = rules.map((r) => {
      let val: any = r.value;
      if (r.op === 'in' || r.op === 'includesAny') {
        val = String(r.value)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (r.field === 'age' || r.op === 'gte' || r.op === 'lte') {
        const num = Number(r.value);
        val = isNaN(num) ? r.value : num;
      }

      return {
        field: r.field,
        op: r.op,
        value: val,
        required: r.required,
        label: r.label.trim(),
      };
    });

    const benefits = benefitsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const documentsRequired = documentsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const translations: any = {};
    if (knTitle || knDesc) {
      translations.kn = {
        title: knTitle,
        shortDescription: knDesc,
        benefits,
      };
    }
    if (hiTitle || hiDesc) {
      translations.hi = {
        title: hiTitle,
        shortDescription: hiDesc,
        benefits,
      };
    }

    const payload = {
      title,
      shortDescription,
      category,
      level,
      state,
      benefits,
      documentsRequired,
      applyUrl,
      sourceUrl,
      isSample,
      verified,
      lastVerified: verified ? lastVerified || new Date().toISOString() : null,
      translations,
      rules: cleanRules,
    };

    try {
      if (isEditMode && id) {
        await api.put(`/admin/schemes/${id}`, payload);
      } else {
        await api.post('/admin/schemes', payload);
      }
      clearClientSessionCache();
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save scheme.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-12 animate-fade-up">
      <PageHero
        backTo="/admin"
        backLabel="Back to Admin Portal"
        eyebrow="Scheme Editor"
        title={
          isEditMode ? (
            <>
              Edit Scheme & <AccentWord>Rules</AccentWord>
            </>
          ) : (
            <>
              Create Social <AccentWord>Scheme</AccentWord>
            </>
          )
        }
        subtitle="Define scheme information, official links, verification status, and eligibility matching rules."
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 -mt-10 relative z-10 space-y-6">
        {isFallback && <FallbackNotice />}

        {loading ? (
          <div className="max-w-3xl editorial-card p-8 h-64 flex flex-col items-center justify-center gap-3">
            <LoaderIcon size={28} className="text-[var(--navy)]" />
            <p className="text-base text-[var(--muted)]">Loading scheme builder...</p>
          </div>
        ) : (
          <div className="max-w-3xl editorial-card p-6 sm:p-9 space-y-6">
            {error && (
              <div
                className="p-4 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-[12px] text-sm font-medium text-[var(--error)]"
                role="alert"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 1. Basic Information */}
              <div className="space-y-4">
                <h2 className="font-display text-[22px] font-bold text-[var(--navy)] pb-2 border-b border-[var(--line)]">
                  01. Basic Information
                </h2>

                <div>
                  <label className="block text-sm font-semibold text-[var(--navy)] mb-1.5">
                    Scheme Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Gruha Lakshmi Yojana (Karnataka)"
                    required
                    className="editorial-input w-full px-3.5 py-2.5 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--navy)] mb-1.5">
                    Short Plain-Language Description *
                  </label>
                  <textarea
                    rows={3}
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Explain the scheme purpose in 1-2 plain sentences..."
                    required
                    className="editorial-input w-full px-3.5 py-2.5 text-base"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1.5">
                      Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="editorial-input w-full px-3 py-2 text-base cursor-pointer"
                    >
                      <option value="senior_citizens">Senior Citizens</option>
                      <option value="education">Education & Scholarships</option>
                      <option value="healthcare">Healthcare & Wellness</option>
                      <option value="housing">Housing & Shelter</option>
                      <option value="employment">Employment & Skills</option>
                      <option value="women_child">Women & Child Care</option>
                      <option value="agriculture">Agriculture & Farming</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1.5">
                      Government Level *
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value as any)}
                      className="editorial-input w-full px-3 py-2 text-base cursor-pointer"
                    >
                      <option value="central">Central Government</option>
                      <option value="state">State Government</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1.5">
                      State / Jurisdiction
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Karnataka or All"
                      className="editorial-input w-full px-3.5 py-2.5 text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    htmlFor="markVerifiedCheck"
                    className={`flex items-start gap-3 p-4 rounded-[12px] border cursor-pointer transition-colors ${
                      verified
                        ? 'bg-[var(--success-bg)] border-[var(--success-border)]'
                        : 'bg-[#FFF4DF] border-[#E5C17B]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      id="markVerifiedCheck"
                      checked={verified}
                      onChange={(e) => handleVerifiedToggle(e.target.checked)}
                      className="w-5 h-5 mt-0.5 accent-[var(--success)] cursor-pointer"
                    />
                    <span className="text-sm text-[var(--navy)]">
                      <strong>Mark as verified</strong>
                      <span className="block text-xs text-[var(--muted)] mt-0.5">
                        {verified && lastVerified
                          ? `Verified on ${new Date(lastVerified).toLocaleDateString()}`
                          : 'Displays "Verify on official site" until checked.'}
                      </span>
                    </span>
                  </label>

                  <label
                    htmlFor="isSampleCheck"
                    className="flex items-start gap-3 p-4 rounded-[12px] bg-[var(--badge-high-bg)] border border-[var(--line)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id="isSampleCheck"
                      checked={isSample}
                      onChange={(e) => setIsSample(e.target.checked)}
                      className="w-5 h-5 mt-0.5 accent-[var(--navy)] cursor-pointer"
                    />
                    <span className="text-sm text-[var(--navy)]">
                      <strong>Mark as Demonstration Sample Data</strong>
                      <span className="block text-xs text-[var(--badge-high-text)] mt-0.5">
                        Shows the &quot;Sample data&quot; badge for placeholder entries.
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              {/* 2. Benefits & Documents */}
              <div className="space-y-4">
                <h2 className="font-display text-[22px] font-bold text-[var(--navy)] pb-2 border-b border-[var(--line)]">
                  02. Benefits & Documents
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1.5">
                      Key Benefits (one per line)
                    </label>
                    <textarea
                      rows={4}
                      value={benefitsText}
                      onChange={(e) => setBenefitsText(e.target.value)}
                      placeholder="Direct benefit transfer of ₹1,500/month&#10;Free annual health checkup"
                      className="editorial-input w-full px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1.5">
                      Required Documents (one per line)
                    </label>
                    <textarea
                      rows={4}
                      value={documentsText}
                      onChange={(e) => setDocumentsText(e.target.value)}
                      placeholder="Age proof (Voter ID / Certificate)&#10;Income certificate from Tahsildar"
                      className="editorial-input w-full px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1.5">
                      Official Application URL (outlink)
                    </label>
                    <input
                      type="url"
                      value={applyUrl}
                      onChange={(e) => setApplyUrl(e.target.value)}
                      placeholder="https://www.myscheme.gov.in/"
                      className="editorial-input w-full px-3.5 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[var(--navy)] mb-1.5">
                      Official Source Link
                    </label>
                    <input
                      type="url"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://www.myscheme.gov.in/"
                      className="editorial-input w-full px-3.5 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Translations */}
              <div className="space-y-4">
                <h2 className="font-display text-[22px] font-bold text-[var(--navy)] pb-2 border-b border-[var(--line)]">
                  03. Kannada & Hindi Content (Optional)
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-[12px] bg-[var(--cream)] border border-[var(--line)] space-y-3">
                    <p className="text-sm font-bold text-[var(--navy)]">ಕನ್ನಡ (Kannada)</p>
                    <input
                      type="text"
                      value={knTitle}
                      onChange={(e) => setKnTitle(e.target.value)}
                      placeholder="ಯೋಜನೆಯ ಶೀರ್ಷಿಕೆ..."
                      className="editorial-input w-full px-3 py-2 text-sm"
                    />
                    <textarea
                      rows={2}
                      value={knDesc}
                      onChange={(e) => setKnDesc(e.target.value)}
                      placeholder="ಸಂಕ್ಷಿಪ್ತ ವಿವರಣೆ..."
                      className="editorial-input w-full px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="p-4 rounded-[12px] bg-[var(--cream)] border border-[var(--line)] space-y-3">
                    <p className="text-sm font-bold text-[var(--navy)]">हिन्दी (Hindi)</p>
                    <input
                      type="text"
                      value={hiTitle}
                      onChange={(e) => setHiTitle(e.target.value)}
                      placeholder="योजना का नाम..."
                      className="editorial-input w-full px-3 py-2 text-sm"
                    />
                    <textarea
                      rows={2}
                      value={hiDesc}
                      onChange={(e) => setHiDesc(e.target.value)}
                      placeholder="संक्षिप्त विवरण..."
                      className="editorial-input w-full px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Eligibility Rule Builder */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[var(--line)]">
                  <h2 className="font-display text-[22px] font-bold text-[var(--navy)]">
                    04. Eligibility Rule Builder
                  </h2>
                  <button
                    type="button"
                    onClick={addRule}
                    className="btn-outline-pill min-h-[42px] inline-flex items-center gap-1.5 px-4 py-1.5 text-sm cursor-pointer"
                  >
                    <PlusIcon size={16} />
                    <span>Add Rule</span>
                  </button>
                </div>

                <p className="text-sm text-[var(--muted)]">
                  Rules are evaluated automatically when users search for potential matches. If a mandatory rule fails, the scheme is excluded.
                </p>

                {rules.length === 0 ? (
                  <div className="p-6 text-center border border-[var(--line)] rounded-[12px] bg-[var(--cream)] text-sm text-[var(--muted)]">
                    No eligibility criteria rules added yet. Click &quot;Add Rule&quot; to configure eligibility conditions.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rules.map((rule, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-[12px] bg-[var(--cream)] border border-[var(--line)] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[var(--navy)] tabular-nums">
                            Rule #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeRule(idx)}
                            className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-full text-[var(--muted)] hover:text-[var(--error)] hover:bg-[var(--paper)] transition-colors cursor-pointer"
                            title="Remove Rule"
                            aria-label="Remove Rule"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-[var(--navy)] mb-1">
                              Field
                            </label>
                            <select
                              value={rule.field}
                              onChange={(e) => updateRule(idx, { field: e.target.value })}
                              className="editorial-input w-full min-h-[42px] px-2.5 py-1.5 text-sm"
                            >
                              <option value="age">age</option>
                              <option value="incomeRange">incomeRange</option>
                              <option value="state">state</option>
                              <option value="category">category</option>
                              <option value="occupation">occupation</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[var(--navy)] mb-1">
                              Operator
                            </label>
                            <select
                              value={rule.op}
                              onChange={(e) => updateRule(idx, { op: e.target.value })}
                              className="editorial-input w-full min-h-[42px] px-2.5 py-1.5 text-sm"
                            >
                              <option value="gte">gte (&gt;=)</option>
                              <option value="lte">lte (&lt;=)</option>
                              <option value="eq">eq (==)</option>
                              <option value="in">in (list contains value)</option>
                              <option value="includesAny">includesAny (array intersection)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[var(--navy)] mb-1">
                              Target Value
                            </label>
                            <input
                              type="text"
                              value={rule.value}
                              onChange={(e) => updateRule(idx, { value: e.target.value })}
                              placeholder="e.g. 60 or low, lower_middle"
                              className="editorial-input w-full min-h-[42px] px-2.5 py-1.5 text-sm"
                            />
                          </div>

                          <div className="flex items-center gap-2 pt-5">
                            <input
                              type="checkbox"
                              id={`req_${idx}`}
                              checked={rule.required}
                              onChange={(e) => updateRule(idx, { required: e.target.checked })}
                              className="w-4 h-4 accent-[var(--navy)] cursor-pointer"
                            />
                            <label htmlFor={`req_${idx}`} className="text-sm text-[var(--navy)] cursor-pointer">
                              Mandatory Rule
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[var(--navy)] mb-1">
                            Plain-Language Explanation Label *
                          </label>
                          <input
                            type="text"
                            value={rule.label}
                            onChange={(e) => updateRule(idx, { label: e.target.value })}
                            placeholder="e.g. Age 60 years or above (shown to users in match reasons)"
                            required
                            className="editorial-input w-full min-h-[42px] px-3 py-1.5 text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-6 border-t border-[var(--line)] flex flex-wrap items-center justify-between gap-4">
                <Link
                  to="/admin"
                  className="btn-outline-pill inline-flex items-center justify-center px-6 py-2.5 text-sm"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-accent-pill inline-flex items-center justify-center gap-2 px-7 py-2.5 text-sm cursor-pointer disabled:opacity-50"
                >
                  {saving && <LoaderIcon size={16} />}
                  <span>{isEditMode ? 'Save Scheme & Rules' : 'Create Scheme'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSchemeForm;
