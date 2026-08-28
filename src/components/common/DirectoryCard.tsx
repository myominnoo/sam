import type { ReactNode } from "react";
import { Search } from "lucide-react";

interface DirectoryCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  itemCount: number;
  itemCountLabel: string;
  actionForm: ReactNode;
  tableContent: ReactNode;
}

export const DirectoryCard = ({
  icon,
  title,
  description,
  search,
  onSearchChange,
  searchPlaceholder,
  itemCount,
  itemCountLabel,
  actionForm,
  tableContent,
}: DirectoryCardProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200/90 ring-1 ring-slate-900/5 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
            <p className="text-[11px] text-slate-500">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-36 sm:w-48"
            />
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
            {itemCount} {itemCountLabel}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {actionForm}
        <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
          {tableContent}
        </div>
      </div>
    </div>
  );
};
