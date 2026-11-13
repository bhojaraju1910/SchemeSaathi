import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import SampleBadge from '../components/SampleBadge';
import EmptyState from '../components/EmptyState';
import CategoryIcon, { getCategoryPalette } from '../components/CategoryIcon';
import { HARDCODED_SCHEMES } from '../data/schemes';
import { Settings, Plus, Edit, Trash2, Loader2 } from 'lucide-react';

export const AdminSchemes: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState<any[]>(HARDCODED_SCHEMES);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/schemes');
      if (Array.isArray(res.data) && res.data.length > 0) {
        setSchemes(res.data);
      } else {
        setSchemes(HARDCODED_SCHEMES);
      }
    } catch (err) {
      console.error('Failed to load admin schemes, showing hardcoded catalog:', err);
      setSchemes(HARDCODED_SCHEMES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    setError(null);
    try {
      await api.delete(`/admin/schemes/${id}`);
      setSchemes((prev) => prev.filter((s) => s._id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete scheme:', err);
      setError('Failed to delete scheme on server. Database connection may be in read-only demo mode.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--border)]">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="text-[28px] font-bold text-[var(--text-primary)] leading-tight">
              {t('admin.title')}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-[6px] bg-[var(--medium-bg)] text-[var(--medium-text)] border border-[var(--medium-border)] font-semibold uppercase">
              Admin Only
            </span>
          </div>
          <p className="text-base text-[var(--text-muted)]">
            Manage social protection schemes, eligibility criteria rules, and multi-language content.
          </p>
        </div>

        <Link
          to="/admin/new"
          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[6px] text-sm font-semibold text-[var(--deep-text)] bg-[var(--teal)] hover:bg-[var(--teal-hover)] transition-colors duration-150 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('admin.addNew')}</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-[6px] text-sm font-medium text-[var(--error)]" role="alert">
          {error}
        </div>
      )}

      {/* Schemes Table */}
      {loading ? (
        <div className="h-64 bg-[var(--surface)] rounded-[6px] border border-[var(--border)] flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-[var(--teal)] animate-spin" />
        </div>
      ) : schemes.length === 0 ? (
        <EmptyState
          icon={Settings}
          title="No Schemes in Database"
          description="Click Add New Scheme above to create your first scheme and define its eligibility criteria."
          actionText={t('admin.addNew')}
          actionLink="/admin/new"
        />
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[6px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-subtle)] border-b border-[var(--border)] text-[var(--text-primary)] font-semibold">
                <tr>
                  <th className="px-4 py-3.5">{t('admin.tableTitle')}</th>
                  <th className="px-4 py-3.5">{t('admin.tableCategory')}</th>
                  <th className="px-4 py-3.5">{t('admin.tableLevel')}</th>
                  <th className="px-4 py-3.5 text-center">{t('admin.tableRules')}</th>
                  <th className="px-4 py-3.5">Last Verified</th>
                  <th className="px-4 py-3.5 text-right">{t('admin.tableActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
                {schemes.map((s) => {
                  const palette = getCategoryPalette(s.category);
                  return (
                    <tr
                      key={s._id}
                      className="odd:bg-[var(--surface)] even:bg-[var(--bg-page)] hover:bg-[var(--teal-tint)] transition-colors duration-150"
                    >
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/schemes/${s._id}`}
                            className="font-semibold text-[var(--text-primary)] hover:text-[var(--teal)] transition-colors duration-150"
                          >
                            {s.title}
                          </Link>
                          {s.isSample && <SampleBadge showIcon={false} />}
                        </div>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-1 mt-0.5">
                          {s.shortDescription}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold"
                          style={{ backgroundColor: palette.bg, color: palette.fg }}
                        >
                          <CategoryIcon kind={s.category} size={14} />
                          <span>{String(t(`categories.${s.category}`, s.category))}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-[var(--text-muted)]">
                        {s.level === 'central' ? 'Central' : s.state || 'State'}
                      </td>

                      <td className="px-4 py-3.5 text-center font-semibold tabular-nums">
                        {s.rules?.length || 0}
                      </td>

                      <td className="px-4 py-3.5 text-[var(--text-muted)] tabular-nums">
                        {s.lastVerified
                          ? new Date(s.lastVerified).toLocaleDateString()
                          : 'N/A'}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/edit/${s._id}`)}
                            className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-[6px] bg-[var(--surface)] border border-[var(--border)] text-[var(--teal)] hover:border-[var(--teal)] transition-colors duration-150 cursor-pointer"
                            title="Edit Scheme and Rules"
                            aria-label="Edit Scheme and Rules"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {deleteConfirmId === s._id ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDelete(s._id)}
                                disabled={actionLoading === s._id}
                                className="min-h-[36px] px-2.5 py-1 bg-[var(--error)] text-[var(--deep-text)] rounded-[6px] text-xs font-semibold cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="min-h-[36px] px-2.5 py-1 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-[6px] text-xs font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(s._id)}
                              className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-[6px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--error)] hover:border-[var(--error)] transition-colors duration-150 cursor-pointer"
                              title="Delete Scheme"
                              aria-label="Delete Scheme"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSchemes;
