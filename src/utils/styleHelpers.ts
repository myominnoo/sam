export const getRoleBadgeClass = (role: string): string => {
  if (role === "PL") return "bg-yellow-300 text-yellow-900 font-bold";
  if (role === "M") return "bg-emerald-400 text-emerald-950 font-bold";
  if (role === "A") return "bg-amber-400 text-amber-950 font-bold";
  return "";
};

export const getHeatmapClass = (capacity: number = 100): string => {
  if (capacity === 100) return "bg-red-500 text-white font-medium";
  if (capacity >= 50) return "bg-emerald-400 text-emerald-950 font-medium";
  return "bg-emerald-100 text-emerald-800 font-medium";
};
