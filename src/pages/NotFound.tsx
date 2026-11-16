import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '../components/Icons';

export const NotFound: React.FC = () => {
  return (
    <div className="max-w-[1160px] mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center space-y-5">
      <p className="eyebrow text-[var(--accent-ink)]">Error 404</p>
      <h1 className="font-display text-[36px] sm:text-[44px] font-bold text-[var(--navy)] leading-tight">
        Page Not Found
      </h1>
      <p className="text-base sm:text-lg text-[var(--muted)] max-w-md mx-auto">
        The welfare directory or page you requested could not be located.
      </p>
      <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="btn-accent-pill inline-flex items-center justify-center gap-2 px-7 py-3 text-base"
        >
          <span>Return to SchemeSaathi Home</span>
          <ArrowRightIcon size={17} />
        </Link>
        <Link
          to="/schemes"
          className="btn-outline-pill inline-flex items-center justify-center px-6 py-3 text-base"
        >
          Browse All Schemes
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
