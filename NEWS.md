# SAM release notes

## v1.6

- Added a local-first staff allocation and project staffing workspace.
- Added responsive capacity and project timeline matrices with expandable detail rows, role badges, allocation heatmaps, and year markers.
- Added staff and project directories for managing FTE, designations, timelines, project roles, activation state, and capacity allocations.
- Added empty states, delete confirmations, and bulk management actions for inactive records.
- Added JSON and Excel import/export, sample-data loading, and a clear-data workflow.
- Added validated import previews and replacement confirmation. Imports now reject malformed records, broken staff/project references, duplicate assignments or allocation months, invalid project dates, out-of-timeline allocations, and workload totals above 100%.
- Clarified allocation semantics: 100% is always an individual staff member's full workload, independent of their FTE reference value.
- Improved bulk capacity editing with project-timeline-aware writes, month-aware equal allocation, preserved non-target allocations, custom-range validation, and a strict 0–100% target range.
- Archived staff and projects are now excluded from planning matrices while their historical records remain intact; the directory actions use clearer Archive and Restore labels.
- Added dashboard warnings for legacy or imported staff-month workloads that exceed 100%.
- Added configurable staffing thresholds. The `# Proj` and `# Staff` matrix badges now show a shared green check at or below the limit, or an amber warning above it, with an accessible count-and-limit tooltip.
- Added light, dark, and system theme support; new installations follow the system preference.
- Added an in-app Driver.js walkthrough, launched automatically once on first use after confirmation and replayable from the footer Compass button.
- Added Sonner-based, theme-aware toast feedback for capacity updates and workspace actions, including staff/project changes, imports, exports, sample data, and clearing local data.
- Standardized confirmations, seed-data, capacity, designation, and threshold dialogs with SAM’s shared theme-aware dialog surface, header, close control, and motion.
- Refined compact mobile navigation, local-only status, dropdown consistency, responsive spacing, and the reusable count-limit tooltip interaction.

## Earlier releases

Earlier changes established the SAM dashboard, local IndexedDB data model, initial sample workspace, PWA support, and the core staff/project planning flow.
