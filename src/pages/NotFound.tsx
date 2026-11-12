import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Compass } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#FF7BA5]/10 border border-[#FF7BA5]/20 text-[#FF7BA5] flex items-center justify-center mb-6">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#EAF1FB] font-heading mb-2">
        404 - Page Not Found
      </h1>
      <p className="text-sm text-[#9FB0C8] max-w-md mx-auto mb-8 leading-relaxed">
        The welfare directory or page you requested could not be located.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5AA9FF] text-[#0B1426] font-bold text-xs rounded-xl shadow-md hover:bg-[#5AA9FF]/90 transition-all"
      >
        <Compass className="w-4 h-4" />
        <span>Return to SchemeSaathi Home</span>
      </Link>
    </div>
  );
};

export default NotFound;
