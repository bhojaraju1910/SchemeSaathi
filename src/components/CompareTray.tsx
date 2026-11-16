import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCompare } from '../context/CompareContext';
import { ArrowRightIcon, CloseIcon, ScaleIcon } from './Icons';

export const CompareTray: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { compareIds, compareSchemes, clearCompare, limitNotice, dismissLimitNotice } = useCompare();

  if (compareIds.length === 0 || location.pathname === '/compare') {
    return null;
  }

  return (
    <aside
      aria-label="Scheme comparison tray"
      className="compare-tray no-print fixed bottom-3 inset-x-0 z-40 px-3 sm:px-6 pointer-events-none"
    >
      <div className="max-w-[780px] mx-auto pointer-events-auto">
        {limitNotice && (
          <div
            role="status"
            className="mb-2 px-4 py-2 rounded-full bg-[var(--badge-high-bg)] text-[var(--badge-high-text)] border border-[var(--line)] text-xs font-semibold flex items-center justify-between gap-3 shadow-[var(--shadow-paper)]"
          >
            <span>{t('comparePage.limitReached')}</span>
            <button
              type="button"
              onClick={dismissLimitNotice}
              aria-label="Dismiss notice"
              className="p-1 rounded-full hover:bg-[var(--paper)] cursor-pointer"
            >
              <CloseIcon size={14} />
            </button>
          </div>
        )}

        <div className="bg-[var(--navy)] text-[var(--cream)] border border-[var(--line-dark)] rounded-full px-4 sm:px-5 py-2 shadow-[var(--shadow-float)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-full bg-[var(--navy-2)] border border-[var(--line-dark)] inline-flex items-center justify-center text-[var(--accent)] shrink-0">
              <ScaleIcon size={16} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight whitespace-nowrap">
                {t('comparePage.trayLabel', { count: compareIds.length })}
              </p>
              <p className="hidden sm:block text-xs text-[var(--muted-dark)] truncate max-w-[340px]">
                {compareSchemes.map((s) => s.title.split('(')[0].trim()).join(' · ')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={clearCompare}
              className="min-h-[40px] px-3 rounded-full text-xs font-semibold text-[var(--muted-dark)] hover:text-[var(--cream)] hover:bg-[var(--navy-2)] transition-colors cursor-pointer"
            >
              {t('comparePage.clearAll')}
            </button>
            <Link
              to="/compare"
              className="btn-accent-pill min-h-[40px] px-4 sm:px-5 inline-flex items-center gap-1.5 text-xs sm:text-sm"
            >
              <span>{t('comparePage.compareNow')}</span>
              <ArrowRightIcon size={15} />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default CompareTray;
