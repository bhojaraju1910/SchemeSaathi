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
    <div className="bg-[#14213B]/60 border border-[#243A63] border-dashed rounded-2xl p-10 text-center max-w-lg mx-auto my-8">
      <div className="w-14 h-14 rounded-2xl bg-[#5AA9FF]/10 border border-[#5AA9FF]/20 text-[#5AA9FF] mx-auto flex items-center justify-center mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-[#EAF1FB] font-heading mb-2">
        {title}
      </h3>
      <p className="text-sm text-[#9FB0C8] leading-relaxed mb-6">
        {description}
      </p>
      {actionText && actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-[#0B1426] bg-[#5AA9FF] hover:bg-[#5AA9FF]/90 rounded-xl transition-all shadow-sm"
        >
          {actionText}
        </Link>
      )}
      {actionText && onActionClick && !actionLink && (
        <button
          onClick={onActionClick}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-[#0B1426] bg-[#5AA9FF] hover:bg-[#5AA9FF]/90 rounded-xl transition-all shadow-sm cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
