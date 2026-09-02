# SAM — Staff Allocation Manager

SAM is a local-first capacity-planning app for answering a simple planning question: who is allocated to which project, when, and at what share of their own workload?

It runs entirely in the browser. Workspace data is stored in IndexedDB; SAM does not require an account, server connection, or live sync.

## Core planning views

- **Staff Allocation & Capacity** shows each staff member’s monthly total allocation and project-level breakdowns.
- **Project Timeline & Staffing** shows when projects are staffed and who is assigned.
- Expand rows to inspect assignments, roles, allocation percentages, FTE, designations, and project dates.
- Use **Timeline Window** presets or a custom range to focus on the planning period that matters.
- Clear year and January boundaries make longer time ranges easier to scan.

## Managing a workspace

- Create, edit, archive, restore, and delete staff and projects. Archived records are kept for history but excluded from planning matrices.
- Maintain staff designations, FTE reference values, project dates, assignments, and Project Lead, Member, or Assisting roles.
- Use **Bulk Set Capacity** to update selected project assignments over a custom range or full project timeline. It respects project dates, preserves unselected allocations, and prevents a person’s monthly workload from exceeding 100%.
- In SAM, **100% always means that individual person’s full workload**. FTE is reference information and does not reduce the 100% allocation ceiling.
- Set limits for projects per staff member and staff per project. Matrix count badges show a check at or below the limit and a warning above it, with an explanation on hover or keyboard focus.

## Data safety and portability

- Load a ready-made sample workspace or begin with a blank slate.
- Import/export complete workspaces as JSON or Excel (`.xlsx`).
- Use **To Sync Folder** and **From Sync Folder** with a OneDrive or Google Drive desktop-synced folder. SAM reads and writes a validated `sam-workspace.json` snapshot; this manual browser workflow is currently available in Chromium-based browsers.
- Import files are validated before replacement: SAM checks record structure, IDs, references, duplicate assignments/allocation months, valid dates, project timelines, and monthly workload totals.
- An import preview shows its record count and requires confirmation before replacing local data.
- Export before using **Clear Data** or moving to a different browser. Clearing data permanently removes the local workspace and SAM preferences.

## Experience

- Light, dark, and system themes. New installations follow the operating-system preference.
- Responsive desktop and compact mobile navigation.
- Theme-aware dialogs and non-intrusive toast feedback for data-changing actions.
- A guided walkthrough starts once on first use after confirmation and can be replayed from the footer Compass button.
- Installable, offline-friendly PWA.

## Getting started

1. Choose **Load Sample Sandbox** to explore with example data, or **Start with Blank Slate**.
2. Open **Manage Data** to update designations, add staff, and create projects with timelines.
3. Assign staff to projects and set roles.
4. Configure monthly capacity for staff assignments.
5. Return to the Dashboard and adjust **Timeline Window** to review the plan.

## Development

Requirements: Node.js and npm.

```bash
npm install
npm run dev
```

Useful commands:

```bash
npm run build
npm run lint
npm run preview
```

## Tech stack

- React, TypeScript, and Vite
- Dexie / IndexedDB for local persistence
- Tailwind CSS, Base UI, and shadcn-inspired components
- Sonner for theme-aware toast feedback
- Driver.js for the product tour
- Vite PWA / Workbox for offline-friendly delivery

## Release notes

See [NEWS.md](NEWS.md) for the changelog.
