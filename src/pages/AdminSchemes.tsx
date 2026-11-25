import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import SampleBadge from '../components/SampleBadge';
import VerificationBadge from '../components/VerificationBadge';
import EmptyState from '../components/EmptyState';
import AccentWord from '../components/AccentWord';
import PageHero from '../components/PageHero';
import FallbackNotice from '../components/FallbackNotice';
import CategoryIcon from '../components/CategoryIcon';
import {
  EditIcon,
  FileCheckIcon,
  LoaderIcon,
  PlusIcon,
  ShieldIcon,
  TrashIcon,
} from '../components/Icons';
import { loadEmergencySchemes, withTimeout } from '../utils/clientCache';
import { useAuth } from '../context/AuthContext';
import { isMirrorToken } from '../services/authMirrorService';

interface HealthStatus {
  storageMode: string;
  schemeCount: number;
  verifiedCount: number;
}

export const AdminSchemes: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [schemes, setSchemes] = useState<any[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSchemes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isMirrorToken(token)) {
        const [healthRes, emergency] = await Promise.all([
          withTimeout((signal) => api.get('/health', { signal }), 3000).catch(() => ({
            data: null,
          })),
          loadEmergencySchemes(),
        ]);
        if (healthRes.data && typeof healthRes.data.storageMode === 'string') {
          setHealth(healthRes.data);
        }
        setSchemes(emergency);
        setIsFallback(true);
        return;
      }

      const [adminRes, healthRes] = await withTimeout(
        (signal) =>
          Promise.all([
            api.get('/admin/schemes', { signal }),
            api.get('/health', { signal }).catch(() => ({ data: null })),
          ]),
        4000
      );

      if (healthRes.data && typeof healthRes.data.storageMode === 'string') {
        setHealth(healthRes.data);
      }

      if (Array.isArray(adminRes.data)) {
        if (adminRes.data.length === 0) {
          setSchemes([]);
        } else {
          setSchemes(adminRes.data);
        }
        setIsFallback(false);
      } else {
        const emergency = await loadEmergencySchemes();
        setSchemes(emergency);
        setIsFallback(true);
      }
    } catch (err: any) {
      const emergency = await loadEmergencySchemes();
      setSchemes(emergency);
      setIsFallback(true);
      setError(
        err?.response?.data?.message ||
          'Database unavailable right now. Showing emergency saved copy (read-only).'
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    setError(null);
    try {
      await api.delete(`/admin/schemes/${id}`);
      setSchemes((prev) => prev.filter((s) => s._id !== id));
      setHealth((prev) =>
        prev ? { ...prev, schemeCount: Math.max(0, prev.schemeCount - 1) } : prev
      );
      setDeleteConfirmId(null);
    } catch {
      setError('Failed to delete scheme on server. Database connection may be unavailable.');
    } finally {
      setActionLoading(null);
    }
  };

  const storageLabel =
    health?.storageMode === 'mongodb'
      ? 'MongoDB'
      : health?.storageMode === 'memory'
        ? 'Memory (Dev)'
        : isFallback
          ? 'Emergency Copy'
          : 'Checking...';

  return (
    <div className="pb-12 animate-fade-up">
      <PageHero
        eyebrow="Administrator Workspace"
        title={
          <>
            Admin Scheme <AccentWord>Management</AccentWord>
          </>
        }
        subtitle="Manage social protection schemes, verification dates, eligibility rules, and multi-language content."
        actions={
          <>
            <Link
              to="/admin/users"
              className="btn-outline-dark-pill px-5 py-2.5 inline-flex items-center justify-center text-sm"
            >
              Registered Users
            </Link>

            <Link
              to="/admin/suggestions"
              className="btn-outline-dark-pill px-5 py-2.5 inline-flex items-center justify-center text-sm"
            >
              Community Suggestions
            </Link>

            <Link
              to="/admin/new"
              className="btn-accent-pill px-5 py-2.5 inline-flex items-center justify-center gap-2 text-sm"
            >
              <PlusIcon size={16} />
              <span>{t('admin.addNew')}</span>
            </Link>
          </>
        }
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 -mt-10 relative z-10 space-y-6">
        {/* Live Health & Storage Source Banner */}
        <div
          data-testid="admin-data-source-banner"
          className="editorial-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 text-sm font-bold text-[var(--navy)] tabular-nums">
            <ShieldIcon size={18} className="text-[var(--accent-ink)] shrink-0" />
            <span>
              Data source: {storageLabel} ·{' '}
              {health ? health.schemeCount : schemes.length} schemes ·{' '}
              {health
                ? health.verifiedCount
                : schemes.filter((s) => s.verified).length}{' '}
              verified
            </span>
          </div>

          <span className="text-xs font-medium text-[var(--muted)]">
            {health?.storageMode === 'mongodb'
              ? 'Primary MongoDB Atlas source active'
              : 'Run npm run seed against MongoDB Atlas for production catalog'}
          </span>
        </div>

        {isFallback && <FallbackNotice onRetry={fetchSchemes} />}

        {error && (
          <div
            className="p-4 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-[12px] text-sm font-medium text-[var(--error)]"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Schemes Table */}
        {loading ? (
          <div className="h-64 editorial-card flex items-center justify-center gap-3">
            <LoaderIcon size={28} className="text-[var(--navy)]" />
            <span className="text-sm text-[var(--muted)]">Loading catalog...</span>
          </div>
        ) : schemes.length === 0 ? (
          <EmptyState
            icon={FileCheckIcon}
            title="No Schemes in Database"
            description="Run npm run seed with MONGODB_URI configured or click Add New Scheme to create your first scheme."
            actionText={t('admin.addNew')}
            actionLink="/admin/new"
          />
        ) : (
          <div className="editorial-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--navy)] text-[var(--cream)] font-semibold">
                  <tr>
                    <th className="px-4 py-3.5">{t('admin.tableTitle')}</th>
                    <th className="px-4 py-3.5">{t('admin.tableCategory')}</th>
                    <th className="px-4 py-3.5">{t('admin.tableLevel')}</th>
                    <th className="px-4 py-3.5 text-center">{t('admin.tableRules')}</th>
                    <th className="px-4 py-3.5">Verification</th>
                    <th className="px-4 py-3.5 text-right">{t('admin.tableActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] text-[var(--navy)]">
                  {schemes.map((s) => (
                    <tr
                      key={s._id}
                      className="odd:bg-[var(--paper)] even:bg-[var(--cream)] hover:bg-[var(--badge-high-bg)]/35 transition-colors duration-150"
                    >
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/schemes/${s._id}`}
                            className="font-semibold text-[var(--navy)] hover:text-[var(--accent-ink)] transition-colors duration-150"
                          >
                            {s.title}
                          </Link>
                          {s.isSample && <SampleBadge showIcon={false} />}
                        </div>
                        <p className="text-xs text-[var(--muted)] line-clamp-1 mt-0.5">
                          {s.shortDescription}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-[var(--line)] bg-[var(--paper)] text-[var(--navy)]">
                          <CategoryIcon kind={s.category} size={14} />
                          <span>{String(t(`categories.${s.category}`, s.category))}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-[var(--muted)] font-medium">
                        {s.level === 'central' ? 'Central' : s.state || 'State'}
                      </td>

                      <td className="px-4 py-3.5 text-center font-bold tabular-nums">
                        {s.rules?.length ?? s.rulesCount ?? 0}
                      </td>

                      <td className="px-4 py-3.5">
                        <VerificationBadge
                          verified={s.verified}
                          lastVerified={s.lastVerified}
                          isSample={s.isSample}
                        />
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/edit/${s._id}`)}
                            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-full bg-[var(--paper)] border border-[var(--line)] text-[var(--navy)] hover:border-[var(--navy)] transition-colors duration-150 cursor-pointer"
                            title="Edit Scheme and Rules"
                            aria-label="Edit Scheme and Rules"
                          >
                            <EditIcon size={16} />
                          </button>

                          {deleteConfirmId === s._id ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDelete(s._id)}
                                disabled={actionLoading === s._id}
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
                              title="Delete Scheme"
                              aria-label="Delete Scheme"
                            >
                              <TrashIcon size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSchemes;
