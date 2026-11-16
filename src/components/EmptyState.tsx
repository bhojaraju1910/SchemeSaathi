import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircleIcon } from './Icons';

interface EmptyStateProps {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
  onActionClick?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = HelpCircleIcon,
  title,
  description,
  actionText,
  actionLink,
  onActionClick,
}) => {
  return (
    <div className="editorial-card p-8 sm:p-10 text-center max-w-lg mx-auto my-8">
      <div className="w-12 h-12 rounded-full bg-[var(--cream)] border border-[var(--line)] inline-flex items-center justify-center mx-auto mb-4 text-[var(--navy)]">
        <Icon size={22} />
      </div>
      <h3 className="font-display text-2xl font-bold text-[var(--navy)] mb-2">
        {title}
      </h3>
      <p className="text-base text-[var(--muted)] leading-relaxed mb-6">
        {description}
      </p>
      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="btn-accent-pill inline-flex items-center justify-center px-6 py-2.5 text-sm"
        >
          {actionText}
        </Link>
      )}
      {actionText && onActionClick && !actionLink && (
        <button
          type="button"
          onClick={onActionClick}
          className="btn-accent-pill inline-flex items-center justify-center px-6 py-2.5 text-sm cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
