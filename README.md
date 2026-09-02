# SAM — Staff Allocation Manager

SAM is a local-first capacity-planning app for seeing how team availability and project staffing change over time. It is designed for planners who need an immediate, visual answer to: *who is allocated, to which project, and at what capacity?*

All workspace data is stored in the browser with IndexedDB. SAM does not require an account or a server connection.

## What you can do

- Review capacity by staff member, month, and project in the **Staff Allocation & Capacity** matrix.
- Review project staffing by month in the **Project Timeline & Staffing** matrix.
- Expand matrix rows for allocation detail and role visibility: Project Lead, Member, or Assisting.
- Change the timeline window and identify year boundaries at a glance.
- Manage staff, FTE, designations, projects, timelines, assignments, and allocation percentages in **Manage Data**.
- Import/export a complete workspace as JSON or Excel (`.xlsx`).
- Start with a blank workspace or load sample data.
- Use light, dark, or system theme preferences.
- Replay the guided walkthrough anytime from the Compass icon in the footer.

## Getting started

1. On an empty workspace, choose **Load Sample Sandbox** to explore SAM with example data, or **Start with Blank Slate** to create your own plan.
2. Open **Manage Data** and update staff designations as needed.
3. Add staff members and projects, including project timelines.
4. Assign staff to projects and choose their roles.
5. Configure monthly capacity for each staff member.
6. Return to the Dashboard and use **Timeline Window** to focus on the months you want to review.

The guided tour covers these same steps and can be launched from the footer Compass button.

## Data and privacy

SAM stores workspace records locally in IndexedDB under the browser profile. Clearing browser site data removes the workspace. Use **Manage Data → Export** to create a portable backup before clearing data or switching browsers.

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
- Dexie / IndexedDB for local data persistence
- Tailwind CSS and Base UI components
- Driver.js for the product tour
- Vite PWA for installable/offline-friendly delivery

## Release notes

See [NEWS.md](NEWS.md) for the changelog.
