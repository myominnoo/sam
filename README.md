# Staff Allocation Matrix (SAM) - Comprehensive Technical Documentation

## Table of Contents
1. [Executive Summary & System Architecture](#1-executive-summary--system-architecture)
2. [Technology Stack & Dependencies](#2-technology-stack--dependencies)
3. [Database Schema & Data Models (Dexie.js)](#3-database-schema--data-models-dexiejs)
4. [Application Component Hierarchy & Structure](#4-application-component-hierarchy--structure)
5. [Advanced Technical Workflows](#5-advanced-technical-workflows)
6. [Build, Test, and Distribution](#6-build-test-and-distribution)

---

## 1. Executive Summary & System Architecture
Staff Allocation Matrix (SAM) is a local-first Progressive Web Application (PWA) built to solve complex organizational resource management, staff bandwidth tracking, and project timeline visualization. 

The application architecture relies on a **Client-Side Rendering (CSR)** model using Vite and React, ensuring complete offline capability, blazing-fast performance, and absolute data privacy by storing all organizational records locally inside the browser's IndexedDB wrapper.

---

## 2. Technology Stack & Dependencies

* **Frontend Framework**: React 18+ with TypeScript for static type safety[cite: 10].
* **Build Tooling & Bundler**: Vite for optimized module bundling and rapid hot module replacement[cite: 10].
* **Styling & Design System**: Tailwind CSS v4, providing utility-first styling and custom responsive grid layouts[cite: 10].
* **Local Storage & Database**: Dexie.js (IndexedDB abstraction layer) providing robust client-side relational transactions[cite: 10].
* **Iconography & UI Components**: Lucide React for lightweight, scalable vector icons[cite: 10].
* **Interactive Guided Tours**: React Joyride for programmatically controlled step-by-step user walkthroughs.
* **Spreadsheet Processing**: SheetJS (`xlsx`) for handling client-side Excel workbook parsing, validation, and data export generation[cite: 10].

---

## 3. Database Schema & Data Models (Dexie.js)

The application manages data through four primary relational tables hosted in local IndexedDB:

### A. `staff`
* `id` (`number`, Auto-increment): Unique primary identifier for personnel.
* `name` (`string`): Full name of the staff member.
* `designation` (`string`): Job title code referencing active organization categories.
* `fte` (`number`): Full-Time Equivalent capacity rating (default `1.0`)[cite: 5].
* `isActive` (`boolean`): Soft status flag separating active team members from archive states.
* `monthlyCapacity` (`Record<string, number>`): Granular custom capacity override values mapped by month keys.

### B. `projects`
* `id` (`number`, Auto-increment): Unique project identifier.
* `name` (`string`): Project title.
* `startMonth` (`string` | `undefined`): Timeline window start boundary formatted as `YYYY-Month`.
* `endMonth` (`string` | `undefined`): Timeline window end boundary formatted as `YYYY-Month`.
* `isActive` (`boolean`): Soft status flag controlling visibility across matrices.

### C. `assignments`
* `id` (`number`, Auto-increment): Primary key for individual allocation links.
* `staffId` (`number`): Foreign key matching `staff.id`.
* `projectId` (`number`): Foreign key matching `projects.id`.
* `role` (`"PL"` | `"M"` | `"A"`): Project role classification where `PL` denotes Project Lead, `M` denotes Main Contributor, and `A` denotes Supporting Assistant[cite: 5].

### D. `designations`
* `id` (`number`, Auto-increment): Primary key for position lookup categories.
* `code` (`string`): Capitalized short identifier (e.g., `"SRA"`).
* `name` (`string`): Descriptive position title (e.g., `"Senior Research Analyst"`).

---

## 4. Application Component Hierarchy & Structure

```text
App.tsx (Global State, Dexie Live Queries, Tab Orchestration)[cite: 1, 10]
├── Header.tsx / Footer.tsx (Navigation & Tour Triggers)[cite: 3, 10]
├── Dashboard View (Active Planning Matrices)[cite: 10]
│   ├── PlanningPeriodCard.tsx (Timeline Window Controller)[cite: 10]
│   ├── StaffMatrix.tsx (Staff Workload Grid & Scroll Sync)[cite: 1, 10]
│   └── ProjectMatrix.tsx (Project Distribution Grid)[cite: 10]
├── Manage Data View (CRUD Operations & Administration)[cite: 10]
│   ├── ManageDataToolbar.tsx (Import/Export, Templates, Clear Data)[cite: 7, 10]
│   ├── StaffDirectory.tsx (Personnel Management Table)[cite: 5, 10]
│   └── ProjectDirectory.tsx (Project Metadata Table)[cite: 6, 10]
└── Modals & Overlays
    ├── TourGuide.tsx (5-Step React Joyride Walkthrough)[cite: 3, 10]
    ├── DesignationCategoryModal.tsx (Position Configuration)[cite: 4, 10]
    ├── BulkCapacityModal.tsx (Monthly FTE Bandwidth Adjustments)[cite: 10]
    ├── ThresholdSettingsModal.tsx (Allocation Limit Configurations)[cite: 10]
    └── ImportConfirmModal.tsx (Excel Validation & Commit Preview)[cite: 10]

```

---

## 5. Advanced Technical Workflows

### A. Live-Query Reactivity

By utilizing `dexie-react-hooks`, all table components (`StaffMatrix`, `ProjectMatrix`, `StaffDirectory`, `ProjectDirectory`) maintain real-time observation over IndexedDB records. Any mutations executed via transactions automatically trigger component re-renders with zero manual state prop-drilling required.

### B. Synchronized Dual-Matrix Scrolling

To handle large temporal ranges smoothly, the dashboard implements a custom `useScrollSync` hook linking horizontal scroll containers between `StaffMatrix` and `ProjectMatrix`, providing a unified spreadsheet-like review experience.

### C. Programmatic Onboarding & DOM Targeting

The 5-step guided tour (`TourGuide.tsx`) coordinates complex state transitions across views:

* Programmatically switches between "dashboard" and "manage" tabs.
* Mounts and unmounts sub-component modals (such as `DesignationCategoryModal`) asynchronously.
* Targets explicit DOM element selectors (`#add-project-card`, `#designations-btn`, `#timeline-window-card`) with localized timing buffers to guarantee precise coordinate calculation by React Joyride.



### D. Transactional Excel Data Exchange

The Excel utilities (`utils/excel.ts`) process incoming workbooks through SheetJS:

* **Parsing**: Validates column structures and extracts multi-sheet data into an isolated `ParsedImportData` payload.
* **Commitment**: Executes database operations inside a strict Dexie read-write transaction wrapper (`db.transaction('rw', ...)`), guaranteeing atomicity so that malformed or incomplete imports never leave the local database in a corrupted state.

---

## 6. Build, Test, and Distribution

To compile the application for production deployment:

```bash
# Install package dependencies
npm install

# Run Vite local development environment
npm run dev

# Execute TypeScript type checks and build production bundle
npm run build

```

