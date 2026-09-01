interface MonthItem {
  key: string
  monthLabel: string
}

interface YearGroupItem {
  year: string | number
  span: number
}

interface MatrixHeaderProps {
  metadataTitle: string
  countLabel: string
  months: MonthItem[]
  yearGroups: YearGroupItem[]
}

interface MatrixColumnGroupProps {
  monthCount: number
}

export function MatrixColumnGroup({ monthCount }: MatrixColumnGroupProps) {
  return (
    <colgroup>
      <col className="w-44" />
      <col className="w-14" />
      {Array.from({ length: monthCount }, (_, index) => (
        <col key={index} className="w-14" />
      ))}
    </colgroup>
  )
}

export function MatrixHeader({
  metadataTitle,
  countLabel,
  months,
  yearGroups,
}: MatrixHeaderProps) {
  return (
    <thead>
      {/* Upper Header Row */}
      <tr className="border-b border-border/40 bg-muted/20 text-[10px] uppercase font-bold text-muted-foreground">
        <th className="p-2 px-2 sm:px-3 align-top text-left sticky left-0 z-20 bg-muted/90 backdrop-blur-md border-r border-border/40 w-[120px] sm:w-[176px]">
          {metadataTitle}
        </th>
        {/* Removed border-r here to avoid border doubling */}
        <th className="p-2 align-top text-center w-12 sm:w-16 sticky left-[120px] sm:left-[176px] z-20 bg-muted/90 backdrop-blur-md border-r-0"></th>

        {yearGroups.map((g, idx) => (
          <th
            key={g.year}
            colSpan={g.span}
            className={`p-1.5 align-top text-center border-r border-border/40 tracking-widest bg-primary/10 dark:bg-primary/15 ${
              idx === 0 ? "border-l-2 border-l-primary/50" : ""
            }`}
          >
            {g.year}
          </th>
        ))}
      </tr>

      {/* Lower Header Row */}
      <tr className="border-b border-border/60 bg-muted/50 font-bold text-[11px]">
        <th className="p-2.5 px-2 sm:px-3 align-top text-left w-[120px] sm:w-[176px] sticky left-0 z-20 bg-muted/90 backdrop-blur-md border-r border-border/40 truncate">
          {metadataTitle === "Staff Metadata" ? "Staff Name" : "Project Name"}
        </th>

        {/* Changed border-r border-border/60 to border-r-0 */}
        <th className="p-2 align-top text-center w-12 sm:w-16 sticky left-[120px] sm:left-[176px] z-20 bg-muted/80 border-r-0 truncate">
          {countLabel}
        </th>

        {months.map((m, idx) => (
          <th
            key={m.key}
            className={`p-2 align-top text-center w-14 min-w-[56px] border-r border-border/20 uppercase text-[10px] text-muted-foreground bg-primary/5 dark:bg-primary/10 ${
              idx === 0 ? "border-l-2 border-l-primary/50" : ""
            }`}
          >
            {m.monthLabel}
          </th>
        ))}
      </tr>
    </thead>
  )
}
