import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldAlert, ExternalLink, Heart, Globe, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-[#080E1C] border-t border-[#243A63] text-[#9FB0C8] mt-auto">
      {/* SDG Alignment Banner */}
      <div className="border-b border-[#243A63]/60 py-4 bg-[#0B1426]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#EAF1FB]/80">
              <Award className="w-4 h-4 text-[#5AA9FF]" />
              <span>Aligned with UN Sustainable Development Goals</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#E5243B]/20 border border-[#E5243B]/40 text-[#FFAAB5] text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-[#E5243B]"></span>
                SDG 1: No Poverty
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#DD1367]/20 border border-[#DD1367]/40 text-[#FFAED0] text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-[#DD1367]"></span>
                SDG 10: Reduced Inequalities
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00689D]/20 border border-[#00689D]/40 text-[#85D8FF] text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-[#00689D]"></span>
                SDG 16: Peace, Justice & Strong Institutions
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-[#EAF1FB] font-heading">
                Scheme<span className="text-[#5AA9FF]">Saathi</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#5AA9FF]/10 text-[#5AA9FF] border border-[#5AA9FF]/30 font-semibold">
                Open Welfare Guidance
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[#9FB0C8] max-w-md">
              A privacy-conscious social protection discovery engine that helps citizens identify potentially relevant government welfare schemes without collecting sensitive identities like Aadhaar or bank account numbers.
            </p>
            <div className="flex items-center gap-4 text-xs pt-1">
              <span className="flex items-center gap-1 text-[#EAF1FB]/80">
                <Globe className="w-3.5 h-3.5 text-[#5AA9FF]" />
                English • ಕನ್ನಡ • हिन्दी
              </span>
              <span>•</span>
              <span>Academic Full-Stack Project</span>
            </div>
          </div>

          {/* Official Portals */}
          <div>
            <h3 className="text-xs font-semibold text-[#EAF1FB] uppercase tracking-wider mb-3">
              Official Portals
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://www.myscheme.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#5AA9FF] transition-colors inline-flex items-center gap-1"
                >
                  myScheme.gov.in <ExternalLink className="w-3 h-3 text-[#9FB0C8]" />
                </a>
              </li>
              <li>
                <a
                  href="https://sevasindhu.karnataka.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#5AA9FF] transition-colors inline-flex items-center gap-1"
                >
                  Seva Sindhu (Karnataka) <ExternalLink className="w-3 h-3 text-[#9FB0C8]" />
                </a>
              </li>
              <li>
                <a
                  href="https://scholarships.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#5AA9FF] transition-colors inline-flex items-center gap-1"
                >
                  National Scholarship Portal <ExternalLink className="w-3 h-3 text-[#9FB0C8]" />
                </a>
              </li>
              <li>
                <a
                  href="https://nha.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#5AA9FF] transition-colors inline-flex items-center gap-1"
                >
                  National Health Authority <ExternalLink className="w-3 h-3 text-[#9FB0C8]" />
                </a>
              </li>
            </ul>
          </div>

          {/* Privacy & Principles */}
          <div>
            <h3 className="text-xs font-semibold text-[#EAF1FB] uppercase tracking-wider mb-3">
              Design Principles
            </h3>
            <ul className="space-y-1.5 text-xs text-[#9FB0C8]">
              <li>✓ Zero identity footprint</li>
              <li>✓ No bank or Aadhaar collection</li>
              <li>✓ Plain-language rule matching</li>
              <li>✓ Clear &quot;Sample Data&quot; indicators</li>
              <li>✓ Direct outlinks to official sites</li>
            </ul>
          </div>
        </div>

        {/* Mandatory Disclaimer Box */}
        <div className="bg-[#14213B] border border-[#243A63] rounded-xl p-4 flex items-start gap-3 text-xs leading-relaxed text-[#EAF1FB]">
          <ShieldAlert className="w-5 h-5 text-[#FF7BA5] shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#FF7BA5] mr-1.5">Official Advisory:</span>
            {t('disclaimer')}
            <span className="block text-[#9FB0C8] mt-1">
              SchemeSaathi is an independent informational matching tool for families. It does not issue sanctions, approve claims, or act as an intermediary for government departments. All applications must be submitted directly through official state or central government channels.
            </span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#243A63]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9FB0C8]">
          <p>© {new Date().getFullYear()} SchemeSaathi. Crafted for Social Welfare Discovery.</p>
          <div className="flex items-center gap-1 text-xs">
            Built with <Heart className="w-3 h-3 text-[#FF7BA5] fill-[#FF7BA5]" /> for inclusive governance
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
