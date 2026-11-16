import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import EmptyState from '../components/EmptyState';
import PageHero from '../components/PageHero';
import AccentWord from '../components/AccentWord';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  LoaderIcon,
  MessageIcon,
  TrashIcon,
} from '../components/Icons';

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
      return { bg: 'var(--success-bg)', fg: 'var(--success)' };
    }
    if (type === 'feature') {
      return { bg: 'var(--badge-high-bg)', fg: 'var(--badge-high-text)' };
    }
    return { bg: 'var(--badge-medium-bg)', fg: 'var(--badge-medium-text)' };
  };

  return (
    <div className="pb-12 animate-fade-up">
      <PageHero
        backTo="/admin"
        backLabel={t('adminSuggestions.backToSchemes')}
        eyebrow="Administrator Inbox"
        title={
          <>
            Community <AccentWord>Suggestions</AccentWord>
          </>
        }
        subtitle={
          <span className="tabular-nums">
            {t('adminSuggestions.subtitle')} ({total})
          </span>
        }
        actions={
          <button
            type="button"
            onClick={handleCopyCsv}
            disabled={suggestions.length === 0}
            className="btn-outline-dark-pill min-h-[44px] px-5 py-2 inline-flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-40"
          >
            <CopyIcon size={16} />
            <span>{copiedCsv ? t('adminSuggestions.copiedCsv') : t('adminSuggestions.copyCsv')}</span>
          </button>
        }
      />

      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 -mt-10 relative z-10 space-y-6">

      {/* Filters */}
      <div className="editorial-card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="admin-sug-type" className="block text-sm font-semibold text-[var(--navy)] mb-1.5">
            {t('adminSuggestions.filterType')}
          </label>
          <select
            id="admin-sug-type"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="editorial-input w-full px-3.5 py-2 text-base cursor-pointer"
          >
            <option value="">{t('adminSuggestions.allTypes')}</option>
            <option value="scheme">Suggest a scheme</option>
            <option value="feature">Request a feature</option>
            <option value="other">Other feedback</option>
          </select>
        </div>

        <div>
          <label htmlFor="admin-sug-status" className="block text-sm font-semibold text-[var(--navy)] mb-1.5">
            {t('adminSuggestions.filterStatus')}
          </label>
          <select
            id="admin-sug-status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="editorial-input w-full px-3.5 py-2 text-base cursor-pointer"
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
          className="p-4 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-[12px] text-sm font-medium text-[var(--error)]"
          role="alert"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-56 editorial-card flex items-center justify-center">
          <LoaderIcon size={28} className="text-[var(--navy)]" />
        </div>
      ) : suggestions.length === 0 ? (
        <EmptyState
          icon={MessageIcon}
          title={t('adminSuggestions.emptyTitle')}
          description={t('adminSuggestions.emptyDesc')}
        />
      ) : (
        <div className="editorial-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--navy)] text-[var(--cream)] font-semibold">
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
              <tbody className="divide-y divide-[var(--line)] text-[var(--navy)]">
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
                      className="odd:bg-[var(--paper)] even:bg-[var(--cream)] align-top"
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ backgroundColor: badgeStyle.bg, color: badgeStyle.fg }}
                        >
                          {getTypeLabel(s.type)}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 max-w-[220px]">
                        <p className="font-semibold text-[var(--navy)]">
                          {heading}
                        </p>
                        {s.schemeState && (
                          <p className="text-xs text-[var(--muted)] mt-0.5">
                            {s.schemeState}
                            {s.targetGroup ? ` · ${s.targetGroup}` : ''}
                          </p>
                        )}
                        {s.schemeLink && (
                          <a
                            href={s.schemeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[var(--accent-ink)] underline break-all block mt-0.5"
                          >
                            {s.schemeLink}
                          </a>
                        )}
                      </td>

                      <td className="px-4 py-3.5 max-w-[280px] text-[var(--muted)]">
                        {s.details || (s.targetGroup ? `For: ${s.targetGroup}` : '—')}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <p className="text-[var(--navy)] font-medium">{s.name || 'Anonymous'}</p>
                        {s.email && (
                          <p className="text-xs text-[var(--muted)]">{s.email}</p>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-[var(--muted)] tabular-nums whitespace-nowrap">
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
                          className="min-h-[40px] px-3 py-1 bg-[var(--paper)] border border-[var(--line)] focus:border-[var(--navy)] rounded-[10px] text-sm font-medium text-[var(--navy)] cursor-pointer"
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
                              className="min-h-[38px] px-3 py-1 bg-[var(--error)] text-[var(--cream)] rounded-full text-xs font-semibold cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="min-h-[38px] px-3 py-1 bg-[var(--paper)] border border-[var(--line)] text-[var(--navy)] rounded-full text-xs font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(s._id)}
                            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-full bg-[var(--paper)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--error)] hover:border-[var(--error)] transition-colors duration-150 cursor-pointer"
                            title="Delete Suggestion"
                            aria-label="Delete Suggestion"
                          >
                            <TrashIcon size={16} />
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
        <div className="flex items-center justify-between gap-4 pt-4 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn-outline-pill px-5 py-2 inline-flex items-center gap-1.5 text-sm disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeftIcon size={16} />
            <span>Previous</span>
          </button>

          <span className="text-sm font-semibold text-[var(--navy)] tabular-nums">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn-outline-pill px-5 py-2 inline-flex items-center gap-1.5 text-sm disabled:opacity-40 cursor-pointer"
          >
            <span>Next</span>
            <ChevronRightIcon size={16} />
          </button>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminSuggestions;
