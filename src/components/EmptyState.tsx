import React from 'react';
import { LucideIcon, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
  onActionClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = HelpCircle,
  title,
  description,
  actionText,
  actionLink,
  onActionClick,
}) => {
  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[6px] p-8 sm:p-10 text-center max-w-lg mx-auto my-8">
      <Icon className="w-7 h-7 text-[var(--text-muted)] mx-auto mb-3" />
      <h3 className="text-[22px] font-bold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-base text-[var(--text-muted)] leading-relaxed mb-6">
        {description}
      </p>
      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 text-sm font-semibold text-[var(--surface)] bg-[var(--teal)] hover:bg-[var(--teal-hover)] rounded-[6px] transition-colors duration-150"
        >
          {actionText}
        </Link>
      )}
      {actionText && onActionClick && !actionLink && (
        <button
          type="button"
          onClick={onActionClick}
          className="inline-flex items-center justify-center min-h-[44px] px-5 py-2.5 text-sm font-semibold text-[var(--surface)] bg-[var(--teal)] hover:bg-[var(--teal-hover)] rounded-[6px] transition-colors duration-150 cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
