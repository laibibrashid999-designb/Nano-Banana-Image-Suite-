
import React from 'react';

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  Icon?: React.FC;
}

export const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick, Icon }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2
        ${isActive
          ? 'bg-white text-teal-700 shadow-sm'
          : 'bg-transparent text-slate-500 hover:bg-slate-200/50 hover:text-slate-800'
        }`}
    >
      {Icon && <Icon />}
      {label}
    </button>
  );
};
