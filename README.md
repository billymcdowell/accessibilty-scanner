# Accessibility Scanner

A comprehensive accessibility testing toolkit powered by IBM Accessibility Checker and Playwright, featuring an interactive React dashboard for visualizing scan results.

## Overview

This project combines automated accessibility scanning with a beautiful visualization dashboard:

- **Scanner**: Uses Playwright to navigate websites and IBM Accessibility Checker to identify WCAG violations
- **Dashboard**: A React + TypeScript + shadcn/ui interface for exploring and analyzing scan results
- **Config API**: Edit scan configuration directly from the dashboard (dev mode)

## Features

### Scanner (`npm run scan`)
- Automated batch scanning of multiple URLs
- Support for authenticated pages (login flows)
- Full-page screenshot capture
- Multi-project configuration
- Results organized by scan date
- JSON and HTML report output
- Direct output to `public/results/` for instant dashboard updates

### Dashboard (`npm run dev`)
- **Overview**: Aggregate statistics across all scanned pages
- **Page Details**: Drill down into individual page accessibility issues
- **Filtering**: Filter by severity level (violations, potential violations, recommendations)
- **Search**: Search through issues by message, rule ID, or HTML snippet
- **Grouping**: View issues grouped by rule or as a flat list
- **Screenshots**: View captured page screenshots alongside issues
- **Charts**: Visual distribution of issues using recharts
- **Dark Mode**: Toggle between light and dark themes
- **Config Editor**: Edit scan configuration via `/api/config` endpoint (dev mode)

## Getting Started

### Prerequisites

- Node.js 22+ (uses native TypeScript execution)
- npm

### Installation

```bash
npm install
```

### Running a Scan

1. Configure your projects in `data.ts`:

```typescript
const projects: Project[] = [
  {
    project: "My Website",
    base_url: "https://example.com",
    pages: [
      { label: "Home", url: "/" },
      { label: "About", url: "/about" },
      { label: "Contact", url: "/contact" },
    ],
  },
];
```

2. Run the scanner:

```bash
npm run scan
```

Results are saved directly to `public/results/[Date]/` with:
- JSON files for each scanned page
- HTML reports
- Full-page screenshots (PNG)
- A summary file with aggregate counts

3. Generate the manifest (indexes all scans for the dashboard):

```bash
npm run manifest
```

### Viewing Results in the Dashboard

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Configuration

### Project Configuration (`data.ts`)

```typescript
interface Project {
  project: string;           // Project name for logging
  base_url: string;          // Base URL for all pages
  authentication?: (page) => Promise<void>;  // Optional login function
  pages: Page[];             // Array of pages to scan
}

interface Page {
  label: string;             // Human-readable page name
  url: string;               // URL path (appended to base_url)
}
```

### Example: Multi-Project Configuration

```typescript
const projects: Project[] = [
  {
    project: "Tailwind Accessibility",
    base_url: "https://tailwindcss.com",
    pages: [
      { label: "Home", url: "/" },
      { label: "Documentation", url: "/docs/installation/using-vite" },
      { label: "Showcase", url: "/showcase" },
    ],
  },
  {
    project: "React.dev",
    base_url: "https://react.dev",
    pages: [
      { label: "Home", url: "/" },
      { label: "Learn", url: "/learn" },
    ],
  },
];
```

### Authenticated Scanning

For pages requiring authentication:

```typescript
{
  project: "My Authenticated App",
  base_url: "https://app.example.com",
  authentication: async (page) => {
    await page.goto("https://app.example.com/login");
    await page.fill('input[name="email"]', "user@example.com");
    await page.fill('input[name="password"]', "password");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");
  },
  pages: [
    { label: "Dashboard", url: "/dashboard" },
    { label: "Settings", url: "/settings" },
  ],
}
```

### Config API (Development)

The dashboard includes a Vite plugin that exposes a configuration API during development:

- `GET /api/config` — Read current scan configuration
- `POST /api/config` — Update scan configuration

This allows editing `data.ts` directly from the dashboard UI.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run scan` | Run accessibility scan on configured URLs |
| `npm run manifest` | Generate manifest.json from scan results |
| `npm run dev` | Start dashboard development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Data Format

### Manifest File (`manifest.json`)

Auto-generated index of all scan summaries:

```json
[
  { "folder": "Tue_Dec_02_2025", "summary": "summary_2025-12-02T17-51-10.242Z.json" },
  { "folder": "Tue_Dec_02_2025", "summary": "summary_2025-12-02T17-50-48.483Z.json" }
]
```

### Summary File (`summary_*.json`)

```json
{
  "counts": {
    "violation": 100,
    "potentialviolation": 50,
    "recommendation": 25,
    "potentialrecommendation": 10,
    "manual": 5,
    "pass": 1000
  },
  "startReport": 1764675429482,
  "endReport": 1764675547951,
  "toolID": "accessibility-checker-v4.0.9",
  "policies": ["IBM_Accessibility"],
  "pageScanSummary": [
    {
      "label": "example.com/index",
      "counts": { ... }
    }
  ]
}
```

### Page Results File (`*.json`)

```json
{
  "results": [
    {
      "ruleId": "WCAG20_A_HasText",
      "level": "violation",
      "message": "Hyperlink has no link text",
      "snippet": "<a href=\"/\"></a>",
      "path": {
        "dom": "/html[1]/body[1]/a[1]",
        "aria": "/document[1]/link[1]"
      },
      "help": "https://...",
      "category": "Accessibility",
      "bounds": { "left": 0, "top": 0, "width": 100, "height": 50 }
    }
  ]
}
```

## Tech Stack

### Scanner
- **Playwright** — Browser automation
- **IBM Accessibility Checker** — WCAG compliance testing
- **Node.js 22+** — Native TypeScript execution

### Dashboard
- **React 19** — UI framework
- **TypeScript** — Type safety
- **Vite 7** — Build tool & dev server
- **Tailwind CSS 4** — Styling
- **shadcn/ui** — UI components
- **Recharts** — Charts and data visualization
- **Lucide React** — Icons

## Project Structure

```
accessibilty-scanner/
├── a11y.ts                    # Main scanner script
├── data.ts                    # Project/URL configuration
├── generate-manifest.ts       # Manifest generator script
├── vite-plugin-config-api.ts  # Vite plugin for config API
├── public/
│   └── results/               # Scan output (served by dashboard)
│       ├── manifest.json      # Index of all scans
│       └── [Date]/
│           ├── summary_*.json
│           └── [domain]/
│               ├── *.json     # Page results
│               └── *.png      # Screenshots
├── scripts/
│   └── update-results.sh      # Legacy sync script
├── src/
│   ├── components/
│   │   ├── dashboard/         # Dashboard components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── Overview.tsx
│   │   │   ├── PageDetails.tsx
│   │   │   ├── ScreenshotViewer.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ui/                # shadcn/ui components
│   ├── context/               # React context providers
│   ├── hooks/                 # Custom hooks
│   ├── lib/                   # Utilities
│   ├── types/                 # TypeScript types
│   ├── App.tsx                # Main app component
│   └── main.tsx               # Entry point
├── vite.config.ts
└── package.json
```

## Issue Severity Levels

| Level | Description |
|-------|-------------|
| **Violation** | Definite accessibility barrier |
| **Potential Violation** | Likely accessibility issue requiring review |
| **Recommendation** | Best practice suggestion |
| **Potential Recommendation** | Possible improvement area |
| **Manual** | Requires manual verification |
| **Pass** | Rule check passed |

## Workflow

```
1. Configure → Edit data.ts with projects/URLs to scan
2. Scan     → npm run scan (results saved to public/results/)
3. Index    → npm run manifest (generates manifest.json)
4. View     → npm run dev (open dashboard at localhost:5173)
```

## License

MIT
