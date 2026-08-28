const ROLE_BADGE_MAP: Record<string, string> = {
  PL: "bg-yellow-300 text-yellow-900 font-bold",
  M: "bg-emerald-400 text-emerald-950 font-bold",
  A: "bg-amber-400 text-amber-950 font-bold",
};

export const getRoleBadgeClass = (role?: string): string => {
  if (!role) return "";
  return ROLE_BADGE_MAP[role.toUpperCase()] || "";
};

export const getHeatmapClass = (capacity: number = 100): string => {
  if (capacity === 100) return "bg-red-500 text-white font-medium";
  if (capacity >= 50) return "bg-emerald-400 text-emerald-950 font-medium";
  return "bg-emerald-100 text-emerald-800 font-medium";
};
