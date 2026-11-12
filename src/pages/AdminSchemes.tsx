import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/axios';
import SampleBadge from '../components/SampleBadge';
import EmptyState from '../components/EmptyState';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Scale,
  Building,
  Loader2,
  Calendar,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export const AdminSchemes: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/schemes');
      setSchemes(res.data || []);
    } catch (err) {
      console.error('Failed to load admin schemes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const handleDelete = async (id: string) => {
    setActionLoading(id);
    try {
      await api.delete(`/admin/schemes/${id}`);
      setSchemes((prev) => prev.filter((s) => s._id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete scheme:', err);
      alert('Failed to delete scheme.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#243A63]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-6 h-6 text-[#5AA9FF]" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#EAF1FB] font-heading">
              {t('admin.title')}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FF7BA5]/15 text-[#FF7BA5] border border-[#FF7BA5]/30 font-semibold uppercase">
              Admin Only
            </span>
          </div>
          <p className="text-sm text-[#9FB0C8]">
            Manage social protection schemes, eligibility criteria rules, and multi-language content.
          </p>
        </div>

        <Link
          to="/admin/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-[#0B1426] bg-[#5AA9FF] hover:bg-[#5AA9FF]/90 transition-all shadow-md shadow-[#5AA9FF]/15 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('admin.addNew')}</span>
        </Link>
      </div>

      {/* Schemes Table */}
      {loading ? (
        <div className="h-64 bg-[#14213B] rounded-3xl animate-pulse border border-[#243A63] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#5AA9FF] animate-spin" />
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
        <div className="bg-[#14213B] border border-[#243A63] rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B1426] border-b border-[#243A63] text-[#9FB0C8] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-6 py-4">{t('admin.tableTitle')}</th>
                  <th className="px-6 py-4">{t('admin.tableCategory')}</th>
                  <th className="px-6 py-4">{t('admin.tableLevel')}</th>
                  <th className="px-6 py-4 text-center">{t('admin.tableRules')}</th>
                  <th className="px-6 py-4">Last Verified</th>
                  <th className="px-6 py-4 text-right">{t('admin.tableActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#243A63]/60 text-[#EAF1FB]">
                {schemes.map((s) => (
                  <tr key={s._id} className="hover:bg-[#1A2B4C]/50 transition-colors">
                    {/* Title */}
                    <td className="px-6 py-4 max-w-xs">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/schemes/${s._id}`}
                          className="font-bold hover:text-[#5AA9FF] transition-colors line-clamp-1"
                        >
                          {s.title}
                        </Link>
                        {s.isSample && <SampleBadge showIcon={false} />}
                      </div>
                      <span className="text-[11px] text-[#9FB0C8] line-clamp-1 mt-0.5">
                        {s.shortDescription}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-[#5AA9FF]/10 text-[#5AA9FF] border border-[#5AA9FF]/20 font-medium">
                        {String(t(`categories.${s.category}`, s.category))}
                      </span>
                    </td>

                    {/* Level / State */}
                    <td className="px-6 py-4 text-[#9FB0C8]">
                      <span className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#5AA9FF]" />
                        <span>{s.level === 'central' ? 'Central' : s.state || 'State'}</span>
                      </span>
                    </td>

                    {/* Rules count */}
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0B1426] border border-[#243A63] font-semibold text-[#EAF1FB]">
                        <Scale className="w-3 h-3 text-amber-400" />
                        <span>{s.rules?.length || 0}</span>
                      </span>
                    </td>

                    {/* Last Verified */}
                    <td className="px-6 py-4 text-[#9FB0C8]">
                      {s.lastVerified
                        ? new Date(s.lastVerified).toLocaleDateString()
                        : 'N/A'}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/edit/${s._id}`)}
                          className="p-1.5 rounded-lg bg-[#0B1426] border border-[#243A63] text-[#5AA9FF] hover:border-[#5AA9FF] transition-colors cursor-pointer"
                          title="Edit Scheme and Rules"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {deleteConfirmId === s._id ? (
                          <div className="inline-flex items-center gap-1 bg-[#0B1426] p-1 rounded-lg border border-rose-500/40">
                            <button
                              onClick={() => handleDelete(s._id)}
                              disabled={actionLoading === s._id}
                              className="px-2 py-0.5 bg-rose-500 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-1.5 py-0.5 text-[#9FB0C8] hover:text-white text-[10px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(s._id)}
                            className="p-1.5 rounded-lg bg-[#0B1426] border border-[#243A63] text-[#9FB0C8] hover:text-rose-400 hover:border-rose-400/40 transition-colors cursor-pointer"
                            title="Delete Scheme"
                          >
                            <Trash2 className="w-4 h-4" />
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
  );
};

export default AdminSchemes;
