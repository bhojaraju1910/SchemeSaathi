import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Scale,
  Sparkles,
  Save,
} from 'lucide-react';

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
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [category, setCategory] = useState('senior_citizens');
  const [level, setLevel] = useState<'central' | 'state'>('central');
  const [state, setState] = useState('All');
  const [benefitsText, setBenefitsText] = useState('');
  const [documentsText, setDocumentsText] = useState('');
  const [applyUrl, setApplyUrl] = useState('https://www.myscheme.gov.in/');
  const [sourceUrl, setSourceUrl] = useState('https://www.myscheme.gov.in/');
  const [isSample, setIsSample] = useState(true);

  // Translations
  const [knTitle, setKnTitle] = useState('');
  const [knDesc, setKnDesc] = useState('');
  const [hiTitle, setHiTitle] = useState('');
  const [hiDesc, setHiDesc] = useState('');

  // Rules state
  const [rules, setRules] = useState<RuleItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSchemeForEdit() {
      if (!isEditMode || !id) return;
      setLoading(true);
      try {
        const res = await api.get(`/schemes/${id}`);
        const { scheme, criteria } = res.data;
        setTitle(scheme.title || '');
        setShortDescription(scheme.shortDescription || '');
        setCategory(scheme.category || 'senior_citizens');
        setLevel(scheme.level || 'central');
        setState(scheme.state || 'All');
        setBenefitsText((scheme.benefits || []).join('\n'));
        setDocumentsText((scheme.documentsRequired || []).join('\n'));
        setApplyUrl(scheme.applyUrl || 'https://www.myscheme.gov.in/');
        setSourceUrl(scheme.sourceUrl || 'https://www.myscheme.gov.in/');
        setIsSample(scheme.isSample !== undefined ? scheme.isSample : true);

        if (scheme.translations?.kn) {
          setKnTitle(scheme.translations.kn.title || '');
          setKnDesc(scheme.translations.kn.shortDescription || '');
        }
        if (scheme.translations?.hi) {
          setHiTitle(scheme.translations.hi.title || '');
          setHiDesc(scheme.translations.hi.shortDescription || '');
        }

        if (criteria?.rules) {
          setRules(
            criteria.rules.map((r: any) => ({
              field: r.field || 'age',
              op: r.op || 'gte',
              value: Array.isArray(r.value) ? r.value.join(', ') : String(r.value),
              required: r.required !== false,
              label: r.label || '',
            }))
          );
        }
      } catch (err: any) {
        console.error('Failed to load scheme:', err);
        setError('Could not load scheme data.');
      } finally {
        setLoading(false);
      }
    }

    loadSchemeForEdit();
  }, [id, isEditMode]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !shortDescription) {
      setError('Title and short description are required.');
      return;
    }

    setSaving(true);
    setError(null);

    // Parse array values for rules
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
      translations,
      rules: cleanRules,
    };

    try {
      if (isEditMode && id) {
        await api.put(`/admin/schemes/${id}`, payload);
      } else {
        await api.post('/admin/schemes', payload);
      }
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save scheme.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#5AA9FF] animate-spin" />
        <p className="text-sm text-[#9FB0C8]">Loading scheme builder...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#9FB0C8] hover:text-[#5AA9FF] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Admin Portal</span>
        </Link>
      </div>

      <div className="bg-[#14213B] border border-[#243A63] rounded-3xl p-6 sm:p-10 shadow-xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#EAF1FB] font-heading">
            {isEditMode ? 'Edit Scheme & Criteria Rules' : 'Create New Social Protection Scheme'}
          </h1>
          <p className="text-xs text-[#9FB0C8] mt-1">
            Define scheme information, official links, and configure deterministic matching rules.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* General Scheme Information */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#5AA9FF] border-b border-[#243A63] pb-2">
              1. Basic Information
            </h2>

            <div>
              <label className="block text-xs font-semibold text-[#EAF1FB] mb-1.5">
                Scheme Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sample Senior Citizen Social Security Pension"
                required
                className="w-full px-4 py-2.5 bg-[#0B1426] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-sm text-[#EAF1FB] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#EAF1FB] mb-1.5">
                Short Plain-Language Description *
              </label>
              <textarea
                rows={3}
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Explain the scheme purpose in 1-2 plain sentences..."
                required
                className="w-full px-4 py-2.5 bg-[#0B1426] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-sm text-[#EAF1FB] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#EAF1FB] mb-1.5">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#0B1426] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-xs text-[#EAF1FB] focus:outline-none cursor-pointer"
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
                <label className="block text-xs font-semibold text-[#EAF1FB] mb-1.5">
                  Government Level *
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-[#0B1426] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-xs text-[#EAF1FB] focus:outline-none cursor-pointer"
                >
                  <option value="central">Central Government</option>
                  <option value="state">State Government</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#EAF1FB] mb-1.5">
                  State / Jurisdiction
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. Karnataka or All"
                  className="w-full px-4 py-2.5 bg-[#0B1426] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-xs text-[#EAF1FB] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#0B1426] border border-[#243A63]">
              <input
                type="checkbox"
                id="isSampleCheck"
                checked={isSample}
                onChange={(e) => setIsSample(e.target.checked)}
                className="w-4 h-4 accent-[#5AA9FF] rounded cursor-pointer"
              />
              <label htmlFor="isSampleCheck" className="text-xs text-[#EAF1FB] cursor-pointer">
                <strong>Mark as Demonstration Sample Data (isSample: true)</strong>
                <span className="block text-[#9FB0C8] text-[11px]">
                  Displays the &quot;Sample data&quot; badge to clearly indicate academic placeholder status.
                </span>
              </label>
            </div>
          </div>

          {/* Benefits & Documents Required */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#5AA9FF] border-b border-[#243A63] pb-2">
              2. Benefits & Documents
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#EAF1FB] mb-1.5">
                  Key Benefits (one per line)
                </label>
                <textarea
                  rows={4}
                  value={benefitsText}
                  onChange={(e) => setBenefitsText(e.target.value)}
                  placeholder="Direct benefit transfer of ₹1,500/month&#10;Free annual health checkup"
                  className="w-full px-4 py-2 bg-[#0B1426] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-xs text-[#EAF1FB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#EAF1FB] mb-1.5">
                  Required Documents (one per line)
                </label>
                <textarea
                  rows={4}
                  value={documentsText}
                  onChange={(e) => setDocumentsText(e.target.value)}
                  placeholder="Age proof (Voter ID / Certificate)&#10;Income certificate from Tahsildar"
                  className="w-full px-4 py-2 bg-[#0B1426] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-xs text-[#EAF1FB] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#EAF1FB] mb-1.5">
                  Official Application URL (outlink)
                </label>
                <input
                  type="url"
                  value={applyUrl}
                  onChange={(e) => setApplyUrl(e.target.value)}
                  placeholder="https://www.myscheme.gov.in/"
                  className="w-full px-4 py-2.5 bg-[#0B1426] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-xs text-[#EAF1FB] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#EAF1FB] mb-1.5">
                  Official Source Link
                </label>
                <input
                  type="url"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  placeholder="https://www.myscheme.gov.in/"
                  className="w-full px-4 py-2.5 bg-[#0B1426] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-xs text-[#EAF1FB] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Multi-language Translations */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#5AA9FF] border-b border-[#243A63] pb-2">
              3. Kannada & Hindi Content (Optional)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#0B1426] border border-[#243A63] space-y-3">
                <p className="text-xs font-bold text-[#EAF1FB]">ಕನ್ನಡ (Kannada)</p>
                <input
                  type="text"
                  value={knTitle}
                  onChange={(e) => setKnTitle(e.target.value)}
                  placeholder="ಯೋಜನೆಯ ಶೀರ್ಷಿಕೆ..."
                  className="w-full px-3 py-2 bg-[#14213B] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-xs text-[#EAF1FB] focus:outline-none"
                />
                <textarea
                  rows={2}
                  value={knDesc}
                  onChange={(e) => setKnDesc(e.target.value)}
                  placeholder="ಸಂಕ್ಷಿಪ್ತ ವಿವರಣೆ..."
                  className="w-full px-3 py-2 bg-[#14213B] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-xs text-[#EAF1FB] focus:outline-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-[#0B1426] border border-[#243A63] space-y-3">
                <p className="text-xs font-bold text-[#EAF1FB]">हिन्दी (Hindi)</p>
                <input
                  type="text"
                  value={hiTitle}
                  onChange={(e) => setHiTitle(e.target.value)}
                  placeholder="योजना का नाम..."
                  className="w-full px-3 py-2 bg-[#14213B] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-xs text-[#EAF1FB] focus:outline-none"
                />
                <textarea
                  rows={2}
                  value={hiDesc}
                  onChange={(e) => setHiDesc(e.target.value)}
                  placeholder="संक्षिप्त विवरण..."
                  className="w-full px-3 py-2 bg-[#14213B] border border-[#243A63] focus:border-[#5AA9FF] rounded-xl text-xs text-[#EAF1FB] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Interactive Eligibility Rule Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#243A63] pb-2">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[#5AA9FF]">
                  4. Eligibility Rule Builder
                </h2>
              </div>
              <button
                type="button"
                onClick={addRule}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#5AA9FF]/15 text-[#5AA9FF] border border-[#5AA9FF]/30 hover:bg-[#5AA9FF]/25 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Rule</span>
              </button>
            </div>

            <p className="text-xs text-[#9FB0C8]">
              Rules are evaluated automatically when users search for potential matches. If a mandatory rule fails, the scheme is excluded.
            </p>

            {rules.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-[#243A63] rounded-2xl text-xs text-[#9FB0C8]">
                No eligibility criteria rules added yet. Click &quot;Add Rule&quot; to configure eligibility conditions.
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#0B1426] border border-[#243A63] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">
                        Rule #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRule(idx)}
                        className="text-[#9FB0C8] hover:text-rose-400 p-1 cursor-pointer"
                        title="Remove Rule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#9FB0C8] mb-1">
                          Field
                        </label>
                        <select
                          value={rule.field}
                          onChange={(e) => updateRule(idx, { field: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-[#14213B] border border-[#243A63] rounded-lg text-xs text-[#EAF1FB] focus:outline-none"
                        >
                          <option value="age">age</option>
                          <option value="incomeRange">incomeRange</option>
                          <option value="state">state</option>
                          <option value="category">category</option>
                          <option value="occupation">occupation</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#9FB0C8] mb-1">
                          Operator
                        </label>
                        <select
                          value={rule.op}
                          onChange={(e) => updateRule(idx, { op: e.target.value })}
                          className="w-full px-2.5 py-1.5 bg-[#14213B] border border-[#243A63] rounded-lg text-xs text-[#EAF1FB] focus:outline-none"
                        >
                          <option value="gte">gte (&gt;=)</option>
                          <option value="lte">lte (&lt;=)</option>
                          <option value="eq">eq (==)</option>
                          <option value="in">in (list contains value)</option>
                          <option value="includesAny">includesAny (array intersection)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#9FB0C8] mb-1">
                          Target Value
                        </label>
                        <input
                          type="text"
                          value={rule.value}
                          onChange={(e) => updateRule(idx, { value: e.target.value })}
                          placeholder="e.g. 60 or low, lower_middle"
                          className="w-full px-2.5 py-1.5 bg-[#14213B] border border-[#243A63] rounded-lg text-xs text-[#EAF1FB] focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-5">
                        <input
                          type="checkbox"
                          id={`req_${idx}`}
                          checked={rule.required}
                          onChange={(e) => updateRule(idx, { required: e.target.checked })}
                          className="accent-[#5AA9FF] rounded cursor-pointer"
                        />
                        <label htmlFor={`req_${idx}`} className="text-xs text-[#EAF1FB] cursor-pointer">
                          Mandatory Rule
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#9FB0C8] mb-1">
                        Plain-Language Explanation Label *
                      </label>
                      <input
                        type="text"
                        value={rule.label}
                        onChange={(e) => updateRule(idx, { label: e.target.value })}
                        placeholder="e.g. Age 60 years or above (shown to users in match reasons)"
                        required
                        className="w-full px-3 py-1.5 bg-[#14213B] border border-[#243A63] rounded-lg text-xs text-[#EAF1FB] focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-[#243A63] flex items-center justify-between gap-4">
            <Link
              to="/admin"
              className="px-5 py-2.5 rounded-xl border border-[#243A63] text-xs font-semibold text-[#9FB0C8] hover:text-[#EAF1FB] hover:bg-[#0B1426] transition-all"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-[#0B1426] bg-[#5AA9FF] hover:bg-[#5AA9FF]/90 transition-all shadow-md shadow-[#5AA9FF]/20 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isEditMode ? 'Save Scheme & Rules' : 'Create Scheme'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminSchemeForm;
