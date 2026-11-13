import React from 'react';

export type IconKind =
  | 'education'
  | 'healthcare'
  | 'housing'
  | 'employment'
  | 'women_child'
  | 'senior_citizens'
  | 'agriculture'
  | 'all'
  | 'schemes'
  | 'matches'
  | 'saved'
  | 'links';

export interface CategoryPalette {
  fg: string;
  bg: string;
}

export function getCategoryPalette(kind: string): CategoryPalette {
  switch (kind) {
    case 'education':
      return { fg: 'var(--cat-education-fg)', bg: 'var(--cat-education-bg)' };
    case 'healthcare':
      return { fg: 'var(--cat-healthcare-fg)', bg: 'var(--cat-healthcare-bg)' };
    case 'housing':
      return { fg: 'var(--cat-housing-fg)', bg: 'var(--cat-housing-bg)' };
    case 'employment':
    case 'matches':
      return { fg: 'var(--cat-employment-fg)', bg: 'var(--cat-employment-bg)' };
    case 'women_child':
    case 'saved':
      return { fg: 'var(--cat-women-fg)', bg: 'var(--cat-women-bg)' };
    case 'senior_citizens':
    case 'schemes':
      return { fg: 'var(--cat-senior-fg)', bg: 'var(--cat-senior-bg)' };
    case 'agriculture':
      return { fg: 'var(--cat-agriculture-fg)', bg: 'var(--cat-agriculture-bg)' };
    case 'links':
      return { fg: 'var(--saffron-tint-text)', bg: 'var(--saffron-tint)' };
    default:
      return { fg: 'var(--cat-all-fg)', bg: 'var(--cat-all-bg)' };
  }
}

interface CategoryIconProps {
  kind: string;
  size?: number;
  withChip?: boolean;
  chipShape?: 'round' | 'square';
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  kind,
  size = 24,
  withChip = false,
  chipShape = 'square',
  className = '',
}) => {
  const palette = getCategoryPalette(kind);

  const renderSvg = () => {
    const common = {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.75,
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
      'aria-hidden': true as const,
    };

    switch (kind) {
      case 'education':
        return (
          <svg {...common}>
            <path d="M2 10l10-5 10 5-10 5-10-5z" />
            <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
            <path d="M22 10v6" />
          </svg>
        );
      case 'healthcare':
        return (
          <svg {...common}>
            <path d="M12 21s-7-4.5-9-9a5.2 5.2 0 0 1 9-5 5.2 5.2 0 0 1 9 5c-2 4.5-9 9-9 9z" />
            <path d="M12 9v5" />
            <path d="M9.5 11.5h5" />
          </svg>
        );
      case 'housing':
        return (
          <svg {...common}>
            <path d="M3 10.5L12 3l9 7.5" />
            <path d="M5 9.5V20h14V9.5" />
            <path d="M10 20v-6h4v6" />
          </svg>
        );
      case 'employment':
        return (
          <svg {...common}>
            <rect x="3" y="7" width="18" height="13" rx="2" />
            <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M3 13h18" />
          </svg>
        );
      case 'women_child':
        return (
          <svg {...common}>
            <circle cx="9" cy="7" r="3" />
            <path d="M3 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
            <circle cx="17.5" cy="9.5" r="2.2" />
            <path d="M15.5 20v-1.5a3 3 0 0 1 5.5-1.5" />
          </svg>
        );
      case 'senior_citizens':
        return (
          <svg {...common}>
            <circle cx="12" cy="5.5" r="2.5" />
            <path d="M10 10.5l-2 9.5" />
            <path d="M10 10.5h3.5l1.5 4.5" />
            <path d="M18 11v9" />
            <path d="M16.5 11a1.5 1.5 0 0 1 3 0" />
          </svg>
        );
      case 'agriculture':
        return (
          <svg {...common}>
            <path d="M12 20V9" />
            <path d="M12 13c-4 0-7-2.5-7-6 3.5 0 6.2 1.8 7 5" />
            <path d="M12 10c4 0 7-2.5 7-6-3.5 0-6.2 1.8-7 5" />
            <path d="M6 20h12" />
          </svg>
        );
      case 'schemes':
        return (
          <svg {...common}>
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M8 9h8" />
            <path d="M8 13h8" />
            <path d="M8 17h5" />
          </svg>
        );
      case 'matches':
        return (
          <svg {...common}>
            <circle cx="12" cy="12" r="8.5" />
            <path d="M8.5 12.2l2.4 2.4 4.8-5.1" />
          </svg>
        );
      case 'saved':
        return (
          <svg {...common}>
            <path d="M6 4h12v16l-6-4-6 4V4z" />
          </svg>
        );
      case 'links':
        return (
          <svg {...common}>
            <path d="M14 4h6v6" />
            <path d="M10 14L20 4" />
            <path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" />
          </svg>
        );
      default:
        return (
          <svg {...common}>
            <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
            <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
            <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
            <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
          </svg>
        );
    }
  };

  if (!withChip) {
    return <span className={`inline-flex items-center justify-center ${className}`}>{renderSvg()}</span>;
  }

  return (
    <span
      className={`inline-flex items-center justify-center w-11 h-11 shrink-0 ${
        chipShape === 'round' ? 'rounded-full' : 'rounded-[6px]'
      } ${className}`}
      style={{ backgroundColor: palette.bg, color: palette.fg }}
    >
      {renderSvg()}
    </span>
  );
};

export default CategoryIcon;
