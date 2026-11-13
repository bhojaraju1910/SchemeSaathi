import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import EmptyState from '../components/EmptyState';
import { ArrowLeft, Copy, Trash2, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminSuggestionItem {
  _id: string;
  type: 'scheme' | 'feature' | 'other';
  title: string;
  details: string;
  schemeName: string;
  schemeState: string;
  schemeLink: string;
  targetGroup: string;
  name: string;
  email: string;
  userId?: string;
  status: 'new' | 'planned' | 'done' | 'rejected';
  createdAt: string;
}

const STATUS_OPTIONS: AdminSuggestionItem['status'][] = ['new', 'planned', 'done', 'rejected'];

function csvEscape(val: string): string {
  const safe = String(val || '').replace(/"/g, '""');
  return `"${safe}"`;
}

export const AdminSuggestions: React.FC = () => {
  const { t } = useTranslation();
  const [suggestions, setSuggestions] = useState<AdminSuggestionItem[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedCsv, setCopiedCsv] = useState<boolean>(false);

  const fetchSuggestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await api.get(`/admin/suggestions?${params.toString()}`);
      setSuggestions(Array.isArray(res.data?.suggestions) ? res.data.suggestions : []);
      setTotal(res.data?.total ?? 0);
      setTotalPages(res.data?.totalPages ?? 1);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load community suggestions.');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, page]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleStatusChange = async (id: string, nextStatus: AdminSuggestionItem['status']) => {
    setActionLoadingId(id);
    setError(null);
    try {
      await api.patch(`/admin/suggestions/${id}`, { status: nextStatus });
      setSuggestions((prev) =>
        prev.map((item) => (item._id === id ? { ...item, status: nextStatus } : item))
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update suggestion status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoadingId(id);
    setError(null);
    try {
      await api.delete(`/admin/suggestions/${id}`);
      setSuggestions((prev) => prev.filter((item) => item._id !== id));
      setDeleteConfirmId(null);
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete suggestion.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCopyCsv = async () => {
    const header = [
      'Type',
      'Title / Scheme Name',
      'Details',
      'State / Level',
      'Target Group',
      'Official Link',
      'Name',
      'Email',
      'Status',
      'Date',
    ].join(',');

    const rows = suggestions.map((s) => {
      const displayTitle = s.type === 'scheme' ? s.schemeName : s.title || '(Feedback)';
      const dateStr = s.createdAt ? new Date(s.createdAt).toISOString() : '';
      return [
        csvEscape(s.type),
        csvEscape(displayTitle),
        csvEscape(s.details),
        csvEscape(s.schemeState),
        csvEscape(s.targetGroup),
        csvEscape(s.schemeLink),
        csvEscape(s.name),
        csvEscape(s.email),
        csvEscape(s.status),
        csvEscape(dateStr),
      ].join(',');
    });

    const csvText = [header, ...rows].join('\n');
    try {
      await navigator.clipboard.writeText(csvText);
      setCopiedCsv(true);
      window.setTimeout(() => setCopiedCsv(false), 2500);
    } catch {
      setError('Clipboard permission unavailable in this browser.');
    }
  };

  const getTypeLabel = (type: AdminSuggestionItem['type']) => {
    if (type === 'scheme') return 'Scheme';
    if (type === 'feature') return 'Feature';
    return 'Feedback';
  };

  const getTypeStyles = (type: AdminSuggestionItem['type']) => {
    if (type === 'scheme') {
      return { bg: 'var(--cat-employment-bg)', fg: 'var(--cat-employment-fg)' };
    }
    if (type === 'feature') {
      return { bg: 'var(--cat-education-bg)', fg: 'var(--cat-education-fg)' };
    }
    return { bg: 'var(--medium-bg)', fg: 'var(--medium-text)' };
  };

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div>
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--teal)] hover:text-[var(--teal-hover)] transition-colors duration-150"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('adminSuggestions.backToSchemes')}</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--border)]">
        <div>
          <h1 className="text-[28px] font-bold text-[var(--text-primary)] leading-tight">
            {t('adminSuggestions.title')}
          </h1>
          <p className="text-base text-[var(--text-muted)] mt-1">
            {t('adminSuggestions.subtitle')} ({total})
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyCsv}
          disabled={suggestions.length === 0}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[6px] text-sm font-semibold bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--teal)] hover:text-[var(--teal)] transition-colors duration-150 cursor-pointer disabled:opacity-40 self-start sm:self-auto"
        >
          <Copy className="w-4 h-4" />
          <span>{copiedCsv ? t('adminSuggestions.copiedCsv') : t('adminSuggestions.copyCsv')}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[6px] p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="admin-sug-type" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
            {t('adminSuggestions.filterType')}
          </label>
          <select
            id="admin-sug-type"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="w-full min-h-[44px] px-3 py-2 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--teal)] rounded-[6px] text-base text-[var(--text-primary)] cursor-pointer"
          >
            <option value="">{t('adminSuggestions.allTypes')}</option>
            <option value="scheme">Suggest a scheme</option>
            <option value="feature">Request a feature</option>
            <option value="other">Other feedback</option>
          </select>
        </div>

        <div>
          <label htmlFor="admin-sug-status" className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5">
            {t('adminSuggestions.filterStatus')}
          </label>
          <select
            id="admin-sug-status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full min-h-[44px] px-3 py-2 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--teal)] rounded-[6px] text-base text-[var(--text-primary)] cursor-pointer"
          >
            <option value="">{t('adminSuggestions.allStatuses')}</option>
            <option value="new">new</option>
            <option value="planned">planned</option>
            <option value="done">done</option>
            <option value="rejected">rejected</option>
          </select>
        </div>
      </div>

      {error && (
        <div
          className="p-4 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-[6px] text-sm font-medium text-[var(--error)]"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-56 bg-[var(--surface)] rounded-[6px] border border-[var(--border)] flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-[var(--teal)] animate-spin" />
        </div>
      ) : suggestions.length === 0 ? (
        <EmptyState
          title={t('adminSuggestions.emptyTitle')}
          description={t('adminSuggestions.emptyDesc')}
        />
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[6px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface-subtle)] border-b border-[var(--border)] text-[var(--text-primary)] font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Title / Scheme Name</th>
                  <th className="px-4 py-3.5">Details</th>
                  <th className="px-4 py-3.5">Name</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
                {suggestions.map((s) => {
                  const badgeStyle = getTypeStyles(s.type);
                  const heading =
                    s.type === 'scheme'
                      ? s.schemeName
                      : s.title || 'General Feedback';
                  const formattedDate = s.createdAt
                    ? new Date(s.createdAt).toLocaleDateString()
                    : 'N/A';

                  return (
                    <tr
                      key={s._id}
                      className="odd:bg-[var(--surface)] even:bg-[var(--bg-page)] align-top"
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] text-xs font-semibold"
                          style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.fg }}
                        >
                          {getTypeLabel(s.type)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 max-w-[220px]">
                        <p className="font-semibold text-[var(--text-primary)]">
                          {heading}
                        </p>
                        {s.schemeState && (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            {s.schemeState}
                            {s.targetGroup ? ` · ${s.targetGroup}` : ''}
                          </p>
                        )}
                        {s.schemeLink && (
                          <a
                            href={s.schemeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[var(--teal)] underline break-all block mt-0.5"
                          >
                            {s.schemeLink}
                          </a>
                        )}
                      </td>

                      <td className="px-4 py-3.5 max-w-[280px] text-[var(--text-muted)]">
                        {s.details || (s.targetGroup ? `For: ${s.targetGroup}` : '—')}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-[var(--text-primary)]">{s.name || 'Anonymous'}</p>
                        {s.email && (
                          <p className="text-xs text-[var(--text-muted)]">{s.email}</p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-[var(--text-muted)] tabular-nums whitespace-nowrap">
                        {formattedDate}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <select
                          aria-label={`Status for ${heading}`}
                          value={s.status}
                          disabled={actionLoadingId === s._id}
                          onChange={(e) =>
                            handleStatusChange(
                              s._id,
                              e.target.value as AdminSuggestionItem['status']
                            )
                          }
                          className="min-h-[38px] px-2.5 py-1 bg-[var(--surface)] border border-[var(--border)] focus:border-[var(--teal)] rounded-[6px] text-sm font-medium text-[var(--text-primary)] cursor-pointer"
                        >
                          {STATUS_OPTIONS.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        {deleteConfirmId === s._id ? (
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDelete(s._id)}
                              disabled={actionLoadingId === s._id}
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
                            title="Delete Suggestion"
                            aria-label="Delete Suggestion"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[var(--surface)] border border-[var(--border)] text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--teal)] disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-[var(--surface)] border border-[var(--border)] text-sm font-semibold text-[var(--text-primary)] hover:border-[var(--teal)] disabled:opacity-40 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminSuggestions;
