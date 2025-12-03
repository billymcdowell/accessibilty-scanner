import fs from "fs";
import path from "path";

interface ManifestEntry {
  folder: string;
  summary: string;
  timestamp: string;
  pageCount: number;
  projects: string[];
}

interface ScanSummary {
  counts: {
    violation: number;
    potentialviolation: number;
    pass: number;
  };
  startReport: number;
  endReport: number;
  scanID: string;
  pageScanSummary: Array<{ label: string }>;
}

// Default results directory (relative to project root)
const RESULTS_DIR = process.argv[2] || "public/results";

function isDateFolder(name: string): boolean {
  // Match format like "Tue_Dec_02_2025"
  const pattern = /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)_(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)_\d{2}_\d{4}$/;
  return pattern.test(name);
}

function isSummaryFile(name: string): boolean {
  // Match format like "summary_2025-12-02T17-50-48.483Z.json"
  return name.startsWith("summary_") && name.endsWith(".json");
}

function extractTimestampFromSummary(filename: string): Date | null {
  // Extract timestamp from "summary_2025-12-02T17-50-48.483Z.json"
  const match = filename.match(/summary_(\d{4}-\d{2}-\d{2}T[\d-]+\.\d+Z)\.json/);
  if (match) {
    // Convert the timestamp format back to ISO format
    // "2025-12-02T17-50-48.483Z" -> "2025-12-02T17:50:48.483Z"
    const isoString = match[1].replace(/-(\d{2})-(\d{2})\./, ":$1:$2.");
    const date = new Date(isoString);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function parseDateFolder(folderName: string): Date | null {
  const parts = folderName.split("_");
  if (parts.length !== 4) return null;

  const [_dayOfWeek, month, day, year] = parts;
  const monthMap: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };

  const monthNum = monthMap[month];
  if (monthNum === undefined) return null;

  const date = new Date(parseInt(year), monthNum, parseInt(day));
  return isNaN(date.getTime()) ? null : date;
}

function generateManifest(): void {
  const resultsPath = path.resolve(RESULTS_DIR);
  
  if (!fs.existsSync(resultsPath)) {
    console.error(`Results directory not found: ${resultsPath}`);
    process.exit(1);
  }

  console.log(`📁 Scanning results directory: ${resultsPath}\n`);

  const entries: ManifestEntry[] = [];
  const allFolders = fs.readdirSync(resultsPath);
  
  // Find all date folders
  const dateFolders = allFolders.filter((name) => {
    const fullPath = path.join(resultsPath, name);
    return fs.statSync(fullPath).isDirectory() && isDateFolder(name);
  });

  if (dateFolders.length === 0) {
    console.log("⚠️  No date folders found (expected format: Day_Mon_DD_YYYY)");
    console.log("   Example: Tue_Dec_02_2025\n");
  }

  // Process each date folder
  for (const folder of dateFolders) {
    const folderPath = path.join(resultsPath, folder);
    const files = fs.readdirSync(folderPath);
    
    // Find all summary files in this folder
    const summaryFiles = files.filter(isSummaryFile);
    
    if (summaryFiles.length === 0) {
      console.log(`⚠️  No summary files found in: ${folder}`);
      continue;
    }

    // Sort summary files by timestamp (most recent first)
    const sortedSummaries = summaryFiles
      .map((file) => ({
        file,
        timestamp: extractTimestampFromSummary(file),
      }))
      .filter((s) => s.timestamp !== null)
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime());

    // Add entries for each summary file (most recent first)
    for (const summary of sortedSummaries) {
      // Read summary to get page count and project names
      let pageCount = 0;
      let projects: string[] = [];
      try {
        const summaryContent = fs.readFileSync(
          path.join(folderPath, summary.file),
          "utf-8"
        );
        const summaryData: ScanSummary = JSON.parse(summaryContent);
        pageCount = summaryData.pageScanSummary?.length || 0;
        
        // Extract unique project names (domains) from page labels
        const projectSet = new Set<string>();
        for (const page of summaryData.pageScanSummary || []) {
          // Label is like "react.dev/index" or "tailwindcss.com/docs/installation/using-vite"
          const domain = page.label.split('/')[0];
          if (domain) {
            projectSet.add(domain);
          }
        }
        projects = Array.from(projectSet);
      } catch {
        // Ignore read errors
      }

      entries.push({
        folder,
        summary: summary.file,
        timestamp: summary.timestamp!.toISOString(),
        pageCount,
        projects,
      });
    }
  }

  // Sort all entries by folder date (most recent first), then by summary timestamp
  entries.sort((a, b) => {
    const dateA = parseDateFolder(a.folder);
    const dateB = parseDateFolder(b.folder);
    if (dateA && dateB) {
      const folderDiff = dateB.getTime() - dateA.getTime();
      if (folderDiff !== 0) return folderDiff;
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Write manifest file
  const manifestPath = path.join(resultsPath, "manifest.json");
  
  // Create a simplified manifest (folder + summary + projects for app compatibility)
  const simpleManifest = entries.map(({ folder, summary, projects }) => ({
    folder,
    summary,
    projects,
  }));

  fs.writeFileSync(manifestPath, JSON.stringify(simpleManifest, null, 2));

  // Print summary
  console.log("✅ Manifest generated successfully!\n");
  console.log(`📍 Output: ${manifestPath}\n`);
  console.log("📊 Summary:");
  console.log(`   Total date folders: ${dateFolders.length}`);
  console.log(`   Total scan summaries: ${entries.length}\n`);
  
  if (entries.length > 0) {
    console.log("📋 Entries:");
    for (const entry of entries) {
      const date = new Date(entry.timestamp);
      const timeStr = date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      console.log(`   • ${entry.folder}/${entry.summary}`);
      console.log(`     └─ ${entry.pageCount} pages scanned at ${timeStr}`);
    }
  }
}

// Run the script
generateManifest();

