import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCompare } from '../context/CompareContext';
import CategoryIcon from '../components/CategoryIcon';
import SampleBadge from '../components/SampleBadge';
import VerificationBadge from '../components/VerificationBadge';
import EmptyState from '../components/EmptyState';
import AccentWord from '../components/AccentWord';
import PageHero from '../components/PageHero';
import { ExternalLinkIcon, ScaleIcon, TrashIcon } from '../components/Icons';

export const Compare: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { compareSchemes, removeCompare, clearCompare } = useCompare();

  const currentLang = (['en', 'kn', 'hi'].includes(i18n.language) ? i18n.language : 'en') as
    | 'en'
    | 'kn'
    | 'hi';

  const getLocalized = (scheme: (typeof compareSchemes)[number]) => {
    const tr = currentLang !== 'en' ? scheme.translations?.[currentLang] : undefined;
    return {
      title: tr?.title || scheme.title,
      benefits: tr?.benefits && tr.benefits.length > 0 ? tr.benefits : scheme.benefits,
    };
  };

  return (
    <div className="pb-12 animate-fade-up">
      <PageHero
        backTo="/schemes"
        backLabel={t('schemeDetails.back')}
        eyebrow="Side-by-Side Comparison"
        title={
          <>
            Compare <AccentWord>Welfare</AccentWord> Schemes
          </>
        }
        subtitle={t('comparePage.subtitle')}
        actions={
          compareSchemes.length > 0 ? (
            <button
              type="button"
              onClick={clearCompare}
              className="btn-outline-dark-pill min-h-[44px] px-5 inline-flex items-center gap-2 text-sm cursor-pointer"
            >
              <TrashIcon size={16} />
              <span>{t('comparePage.clearAll')}</span>
            </button>
          ) : undefined
        }
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 -mt-10 relative z-10 space-y-6">
        {compareSchemes.length === 0 ? (
          <EmptyState
            icon={ScaleIcon}
            title={t('comparePage.emptyTitle')}
            description={t('comparePage.emptyDesc')}
            actionText={t('comparePage.browseSchemes')}
            actionLink="/schemes"
          />
        ) : (
          <div className="editorial-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead>
                  <tr className="bg-[var(--navy)] text-[var(--cream)] border-b border-[var(--line-dark)]">
                    <th
                      scope="col"
                      className="sticky left-0 z-10 bg-[var(--navy)] p-4 sm:p-5 w-44 sm:w-52 text-xs font-bold uppercase tracking-wider text-[var(--muted-dark)] border-r border-[var(--line-dark)]"
                    >
                      Comparison Field
                    </th>
                    {compareSchemes.map((scheme) => {
                      const loc = getLocalized(scheme);
                      return (
                        <th
                          key={scheme._id}
                          scope="col"
                          className="p-4 sm:p-5 align-top min-w-[220px] border-r last:border-r-0 border-[var(--line-dark)]"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <CategoryIcon kind={scheme.category} size={20} withChip />
                              <button
                                type="button"
                                onClick={() => removeCompare(scheme._id)}
                                aria-label={`${t('comparePage.removeBtn')} ${loc.title}`}
                                className="min-h-[36px] px-3 rounded-full border border-[var(--line-dark)] text-xs font-semibold text-[var(--cream)] hover:bg-[var(--navy-2)] transition-colors cursor-pointer"
                              >
                                {t('comparePage.removeBtn')}
                              </button>
                            </div>
                            <div>
                              <Link
                                to={`/schemes/${scheme._id}`}
                                className="font-display text-lg font-bold text-[var(--cream)] hover:text-[var(--accent)] transition-colors leading-snug block"
                              >
                                {loc.title}
                              </Link>
                              <div className="mt-2">
                                {scheme.isSample ? (
                                  <SampleBadge />
                                ) : (
                                  <VerificationBadge
                                    verified={scheme.verified}
                                    lastVerified={scheme.lastVerified}
                                    isSample={scheme.isSample}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--line)] text-sm">
                  <tr>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-[var(--paper)] p-4 sm:p-5 font-bold text-[var(--navy)] border-r border-[var(--line)] align-top"
                    >
                      {t('comparePage.rowCategory')}
                    </th>
                    {compareSchemes.map((s) => (
                      <td key={s._id} className="p-4 sm:p-5 text-[var(--navy)] border-r last:border-r-0 border-[var(--line)] align-top">
                        {String(t(`categories.${s.category}`, s.category))}
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-[var(--cream)]/40">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-[var(--cream)] p-4 sm:p-5 font-bold text-[var(--navy)] border-r border-[var(--line)] align-top"
                    >
                      {t('comparePage.rowLevel')}
                    </th>
                    {compareSchemes.map((s) => (
                      <td key={s._id} className="p-4 sm:p-5 text-[var(--navy)] border-r last:border-r-0 border-[var(--line)] align-top font-medium">
                        {s.level === 'central' ? t('schemesPage.levelCentral') : t('schemesPage.levelState')}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-[var(--paper)] p-4 sm:p-5 font-bold text-[var(--navy)] border-r border-[var(--line)] align-top"
                    >
                      {t('comparePage.rowState')}
                    </th>
                    {compareSchemes.map((s) => (
                      <td key={s._id} className="p-4 sm:p-5 text-[var(--navy)] border-r last:border-r-0 border-[var(--line)] align-top">
                        {s.state}
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-[var(--cream)]/40">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-[var(--cream)] p-4 sm:p-5 font-bold text-[var(--navy)] border-r border-[var(--line)] align-top"
                    >
                      {t('comparePage.rowBenefits')}
                    </th>
                    {compareSchemes.map((s) => {
                      const loc = getLocalized(s);
                      return (
                        <td key={s._id} className="p-4 sm:p-5 text-[var(--navy)] border-r last:border-r-0 border-[var(--line)] align-top">
                          <ul className="list-disc pl-4 space-y-1.5 leading-relaxed">
                            {(loc.benefits || []).map((b, i) => (
                              <li key={i}>{b}</li>
                            ))}
                          </ul>
                        </td>
                      );
                    })}
                  </tr>

                  <tr>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-[var(--paper)] p-4 sm:p-5 font-bold text-[var(--navy)] border-r border-[var(--line)] align-top"
                    >
                      {t('comparePage.rowDocuments')}
                    </th>
                    {compareSchemes.map((s) => (
                      <td key={s._id} className="p-4 sm:p-5 text-[var(--navy)] border-r last:border-r-0 border-[var(--line)] align-top">
                        <ul className="list-disc pl-4 space-y-1.5 leading-relaxed">
                          {(s.documentsRequired || []).map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-[var(--cream)]/40">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-[var(--cream)] p-4 sm:p-5 font-bold text-[var(--navy)] border-r border-[var(--line)] align-top"
                    >
                      {t('comparePage.rowRules')}
                    </th>
                    {compareSchemes.map((s) => {
                      const summary = (s.rules || [])
                        .map((r: any) => r.label || `${r.field} ${r.op} ${String(r.value)}`)
                        .filter(Boolean);
                      return (
                        <td key={s._id} className="p-4 sm:p-5 text-[var(--navy)] border-r last:border-r-0 border-[var(--line)] align-top">
                          {summary.length > 0 ? (
                            <ul className="space-y-1.5 leading-relaxed">
                              {summary.map((line, i) => (
                                <li key={i} className="text-[var(--muted)]">
                                  · {line}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-[var(--muted)]">Verify criteria on official portal.</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  <tr>
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-[var(--paper)] p-4 sm:p-5 font-bold text-[var(--navy)] border-r border-[var(--line)] align-top"
                    >
                      {t('comparePage.rowVerified')}
                    </th>
                    {compareSchemes.map((s) => (
                      <td key={s._id} className="p-4 sm:p-5 text-[var(--muted)] tabular-nums border-r last:border-r-0 border-[var(--line)] align-top">
                        {s.lastVerified
                          ? new Date(s.lastVerified).toLocaleDateString(undefined, {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Unverified'}
                      </td>
                    ))}
                  </tr>

                  <tr className="bg-[var(--cream)]/40">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-[var(--cream)] p-4 sm:p-5 font-bold text-[var(--navy)] border-r border-[var(--line)] align-top"
                    >
                      {t('comparePage.rowOfficial')}
                    </th>
                    {compareSchemes.map((s) => (
                      <td key={s._id} className="p-4 sm:p-5 border-r last:border-r-0 border-[var(--line)] align-top">
                        <div className="flex flex-col gap-3">
                          <a
                            href={s.applyUrl || 'https://www.myscheme.gov.in/'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-card-3d-accent min-h-[44px] px-4 inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                          >
                            <span>{t('recommendations.officialPage')}</span>
                            <ExternalLinkIcon size={14} />
                          </a>
                          <Link
                            to={`/schemes/${s._id}`}
                            className="btn-card-3d-outline min-h-[44px] px-4 inline-flex items-center justify-center text-xs sm:text-sm"
                          >
                            {t('recommendations.viewDetails')}
                          </Link>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Compare;
