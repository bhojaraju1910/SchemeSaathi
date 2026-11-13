import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
      <h1 className="text-[28px] font-bold text-[var(--text-primary)]">
        404 - Page Not Found
      </h1>
      <p className="text-base text-[var(--text-muted)] max-w-md mx-auto">
        The welfare directory or page you requested could not be located.
      </p>
      <div className="pt-2">
        <Link
          to="/"
          className="min-h-[44px] inline-flex items-center justify-center px-5 py-2.5 bg-[var(--teal)] hover:bg-[var(--teal-hover)] text-[var(--deep-text)] font-semibold text-base rounded-[6px] transition-colors duration-150"
        >
          Return to SchemeSaathi Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
