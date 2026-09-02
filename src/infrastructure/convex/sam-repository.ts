import type { SamRepository } from "@/domain/repositories"

/**
 * Convex adapter seam. Implement this after configuring Convex/Clerk; keeping
 * their generated types out of the domain prevents the UI from depending on them.
 */
export type ConvexSamRepository = SamRepository
