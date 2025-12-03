import { chromium } from "playwright";
import * as aChecker from "accessibility-checker";
import data from "./data.ts";
import fs from "fs";

const outputFolder = `public/results/${new Date()
  .toDateString()
  .replaceAll(" ", "_")}/`;

const config = {
  ruleArchive: "latest",
  policies: ["IBM_Accessibility"],
  failLevels: ["violation", "potentialviolation"],
  reportLevels: [
      "violation",
      "potentialviolation",
      "recommendation",
      "potentialrecommendation",
      "manual",
      "pass",
  ],
  outputFormat: ["json", "html"],
  outputFolder: outputFolder,
};

try {
  // Ensure the directory exists
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }
} catch (error: any) {
  console.error(`An error occurred: ${error.message}`);
}

async function batchScanAuthenticated() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  for (const project of data) {
    const page = await context.newPage();

    // Login once
    if (project.authentication) {
      console.log(`Running setup for ${project.project}`);
      await project.authentication(page);
    }

    aChecker.setConfig(config as any);

    const urlsToScan = project.pages.map(
      ({ label, url }) => `${project.base_url}${url}`
    );

    // Now scan all authenticated URLs
    for (const url of urlsToScan) {
      await page.goto(url);
      await page.waitForTimeout(5000);

      const label = url
        .replace(/^(https?:|file:)\/\//, "")
        .replace(/[:?&=]/g, "_");

      const d = new Date().toDateString().replaceAll(" ", "_");

      const labelPathname =
        label.slice(-1) === "/" ? `${label}index` : `${label}`;

      await page.screenshot({
        path: `public/results/${d}/${labelPathname}.png`,
        fullPage: true,
      });
      const result = await aChecker.getCompliance(page, labelPathname);

      if (result) {
        console.log(
          aChecker.assertCompliance(result.report as any) === 0
            ? "Passed:"
            : "Failed:",
          url
        );
      }
    }

  }
  await aChecker.close();
  await browser.close();
}

batchScanAuthenticated();
