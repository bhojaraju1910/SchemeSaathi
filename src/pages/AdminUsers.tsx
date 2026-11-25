import React, { useCallback, useEffect, useState } from 'react';
import api from '../api/axios';
import PageHero from '../components/PageHero';
import AccentWord from '../components/AccentWord';
import EmptyState from '../components/EmptyState';
import { LoaderIcon, ShieldIcon, TrashIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

interface AdminUserRow {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  preferredLanguage: 'en' | 'kn' | 'hi';
  createdAt: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  kn: 'Kannada (ಕನ್ನಡ)',
  hi: 'Hindi (हिन्दी)',
};

export const AdminUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/admin/users');
      setUsers(Array.isArray(res.data?.users) ? res.data.users : []);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load registered users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id: string) => {
    setActionLoadingId(id);
    setError(null);
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      setDeleteConfirmId(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete user account.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="pb-12 animate-fade-up">
      <PageHero
        backTo="/admin"
        backLabel="Back to Scheme Catalog"
        eyebrow="Administrator Workspace"
        title={
          <>
            Registered <AccentWord>Users</AccentWord>
          </>
        }
        subtitle={
          <span className="tabular-nums">
            Live accounts stored in the MongoDB users collection ({users.length})
          </span>
        }
        actions={
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="btn-outline-dark-pill min-h-[44px] px-5 py-2 inline-flex items-center justify-center text-sm cursor-pointer disabled:opacity-50"
          >
            Refresh Users
          </button>
        }
      />

      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 -mt-10 relative z-10 space-y-6">
        {error && (
          <div
            className="p-4 bg-[var(--error-bg)] border border-[var(--error-border)] rounded-[12px] text-sm font-medium text-[var(--error)]"
            role="alert"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="h-56 editorial-card flex items-center justify-center gap-3">
            <LoaderIcon size={28} className="text-[var(--navy)]" />
            <span className="text-sm text-[var(--muted)]">Loading registered users...</span>
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={ShieldIcon}
            title="No Users Found"
            description="Accounts created via the Register page will appear here immediately."
          />
        ) : (
          <div className="editorial-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--navy)] text-[var(--cream)] font-semibold">
                  <tr>
                    <th className="px-4 py-3.5">Name</th>
                    <th className="px-4 py-3.5">Email</th>
                    <th className="px-4 py-3.5">Role</th>
                    <th className="px-4 py-3.5">Language</th>
                    <th className="px-4 py-3.5">Registered On</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] text-[var(--navy)]">
                  {users.map((u) => {
                    const isSelf = currentUser?.id === u._id;
                    const isAdmin = u.role === 'admin';
                    const formattedDate = u.createdAt
                      ? new Date(u.createdAt).toLocaleString()
                      : 'N/A';

                    return (
                      <tr
                        key={u._id}
                        className="odd:bg-[var(--paper)] even:bg-[var(--cream)] hover:bg-[var(--badge-high-bg)]/35 transition-colors duration-150"
                      >
                        <td className="px-4 py-3.5 font-semibold text-[var(--navy)]">
                          {u.name}
                          {isSelf && (
                            <span className="ml-2 text-xs font-medium text-[var(--muted)]">
                              (You)
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-[var(--navy)]">{u.email}</td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              isAdmin
                                ? 'bg-[var(--navy)] text-[var(--cream)] border-[var(--navy)]'
                                : 'bg-[var(--paper)] text-[var(--navy)] border-[var(--line)]'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-[var(--muted)]">
                          {LANGUAGE_LABELS[u.preferredLanguage] || u.preferredLanguage}
                        </td>

                        <td className="px-4 py-3.5 text-[var(--muted)] tabular-nums whitespace-nowrap">
                          {formattedDate}
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          {isAdmin || isSelf ? (
                            <span className="text-xs text-[var(--muted)]">Protected</span>
                          ) : deleteConfirmId === u._id ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDelete(u._id)}
                                disabled={actionLoadingId === u._id}
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
                              onClick={() => setDeleteConfirmId(u._id)}
                              className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-full bg-[var(--paper)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--error)] hover:border-[var(--error)] transition-colors duration-150 cursor-pointer"
                              title="Delete User"
                              aria-label={`Delete ${u.email}`}
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
      </div>
    </div>
  );
};

export default AdminUsers;
