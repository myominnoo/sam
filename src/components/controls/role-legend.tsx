export function RoleLegend() {
  return (
    <div className="flex items-center gap-2 text-xs font-bold">
      <span className="px-2 py-1 rounded-full bg-amber-400 dark:bg-amber-500 text-amber-950 shadow-2xs">
        PL Project Lead
      </span>
      <span className="px-2 py-1 rounded-full bg-emerald-500 text-white shadow-2xs">
        M Member
      </span>
      <span className="px-2 py-1 rounded-full bg-sky-500 dark:bg-sky-600 text-white shadow-2xs">
        A Assisting
      </span>
    </div>
  )
}