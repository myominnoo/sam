import { MASTER_MONTH_OPTIONS } from "../constants";

/**
 * Checks if a target month (YYYY-Month) falls within a start and end month range.
 */
export const isMonthInRange = (
  targetKey: string,
  startKey?: string,
  endKey?: string,
): boolean => {
  if (!startKey || !endKey) return false;

  const targetIdx = MASTER_MONTH_OPTIONS.findIndex((m) => m.key === targetKey);
  const startIdx = MASTER_MONTH_OPTIONS.findIndex((m) => m.key === startKey);
  const endIdx = MASTER_MONTH_OPTIONS.findIndex((m) => m.key === endKey);

  if (targetIdx === -1 || startIdx === -1 || endIdx === -1) return false;

  return targetIdx >= startIdx && targetIdx <= endIdx;
};
