import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from './Icons';

interface PageHeroProps {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  backTo?: string;
  backLabel?: string;
  icon?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  compact?: boolean;
}

export const PageHero: React.FC<PageHeroProps> = ({
  eyebrow,
  title,
  subtitle,
  backTo,
  backLabel,
  icon,
  meta,
  actions,
  compact = false,
}) => {
  return (
    <section
      className={`hero-editorial-bg text-[var(--cream)] border-b border-[var(--line-dark)] ${
        compact
          ? 'min-h-[140px] sm:min-h-[188px] pt-7 pb-14 sm:pt-9 sm:pb-16'
          : 'min-h-[140px] sm:min-h-[212px] pt-8 pb-14 sm:pt-11 sm:pb-16'
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 space-y-4">
        {backTo && backLabel && (
          <div className="no-print">
            <Link
              to={backTo}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted-dark)] hover:text-[var(--cream)] transition-colors duration-150"
            >
              <ArrowLeftIcon size={16} />
              <span>{backLabel}</span>
            </Link>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0 max-w-3xl">
            {icon && <div className="shrink-0 mt-1">{icon}</div>}
            <div className="space-y-2 min-w-0">
              {meta && <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs sm:text-sm">{meta}</div>}
              {eyebrow && (
                <p className="eyebrow text-[var(--accent)]">{eyebrow}</p>
              )}
              <h1 className="font-display text-balance text-3xl sm:text-4xl lg:text-[42px] font-bold text-[var(--cream)] leading-[1.12]">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm sm:text-base text-[var(--muted-dark)] leading-relaxed max-w-2xl">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 no-print">
              {actions}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PageHero;
