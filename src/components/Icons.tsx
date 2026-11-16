import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

const baseProps = (size: number, className: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
  className: `shrink-0 ${className}`.trim(),
});

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M19 12H5" />
    <path d="M11 6l-6 6 6 6" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M5 12.5l4.2 4.2L19 7" />
  </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.2l2.3 2.3 4.8-4.9" />
  </svg>
);

export const HelpCircleIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.2a2.6 2.6 0 0 1 5 1c0 1.7-2.5 2.2-2.5 3.6" />
    <circle cx="12" cy="17" r="0.6" fill="currentColor" />
  </svg>
);

export const AlertCircleIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5" />
    <circle cx="12" cy="16.5" r="0.6" fill="currentColor" />
  </svg>
);

export const BookmarkIcon: React.FC<IconProps & { filled?: boolean }> = ({
  size = 18,
  className = '',
  filled = false,
}) => (
  <svg {...baseProps(size, className)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M6 4h12v16l-6-4-6 4V4z" />
  </svg>
);

export const ExternalLinkIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M14 4h6v6" />
    <path d="M10 14L20 4" />
    <path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" />
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M16.5 16.5L21 21" />
  </svg>
);

export const SlidersIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
    <circle cx="9" cy="6" r="2" fill="var(--paper)" />
    <circle cx="15" cy="12" r="2" fill="var(--paper)" />
    <circle cx="10" cy="18" r="2" fill="var(--paper)" />
  </svg>
);

export const ScaleIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M12 4v16" />
    <path d="M6 7h12" />
    <path d="M4 13l2-6 2 6a2.5 2.5 0 0 1-4 0z" />
    <path d="M16 13l2-6 2 6a2.5 2.5 0 0 1-4 0z" />
    <path d="M8 20h8" />
  </svg>
);

export const PrintIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M7 8V4h10v4" />
    <rect x="4" y="8" width="16" height="8" rx="2" />
    <rect x="7" y="13" width="10" height="7" fill="var(--paper)" />
  </svg>
);

export const ShareIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <circle cx="18" cy="5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="19" r="2.5" />
    <path d="M8.3 10.9l7.4-4.3" />
    <path d="M8.3 13.1l7.4 4.3" />
  </svg>
);

export const VolumeIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M4 10v4h4l5 4V6l-5 4H4z" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 6a8.5 8.5 0 0 1 0 12" />
  </svg>
);

export const StopIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M4 7h16" />
    <path d="M9 7V4h6v3" />
    <path d="M7 7l1 13h8l1-13" />
    <path d="M10 11v5" />
    <path d="M14 11v5" />
  </svg>
);

export const EditIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M12 20h8" />
    <path d="M16.5 4.5l3 3L8 19l-4 1 1-4L16.5 4.5z" />
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
);

export const CopyIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </svg>
);

export const EyeIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M2 12s3.8-6.5 10-6.5S22 12 22 12s-3.8 6.5-10 6.5S2 12 2 12z" />
    <circle cx="12" cy="12" r="2.8" />
  </svg>
);

export const EyeOffIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M3 3l18 18" />
    <path d="M10.6 5.6A9.8 9.8 0 0 1 12 5.5c6.2 0 10 6.5 10 6.5a16.5 16.5 0 0 1-3.3 4.2" />
    <path d="M6.4 7.7A16.5 16.5 0 0 0 2 12s3.8 6.5 10 6.5c1.5 0 2.9-.3 4.1-.8" />
  </svg>
);

export const MenuIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M4 7h16" />
    <path d="M4 12h16" />
    <path d="M4 17h16" />
  </svg>
);

export const CloseIcon: React.FC<IconProps> = ({ size = 20, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  </svg>
);

export const ShieldIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M12 3l7 3v5c0 4.6-3 8.5-7 10-4-1.5-7-5.4-7-10V6l7-3z" />
    <path d="M9 12.2l2 2 4-4.2" />
  </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const FileCheckIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
    <path d="M14 3v5h5" />
    <path d="M9 14l2 2 4-4" />
  </svg>
);

export const MessageIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V6z" />
  </svg>
);

export const LoaderIcon: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg {...baseProps(size, `animate-spin ${className}`)}>
    <circle cx="12" cy="12" r="9" opacity="0.25" />
    <path d="M12 3a9 9 0 0 1 9 9" />
  </svg>
);

export const CalendarIcon: React.FC<IconProps> = ({ size = 16, className = '' }) => (
  <svg {...baseProps(size, className)}>
    <rect x="4" y="5" width="16" height="15" rx="2" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <path d="M4 10h16" />
  </svg>
);
