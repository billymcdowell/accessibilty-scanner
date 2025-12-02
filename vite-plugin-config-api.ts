import type { Plugin, ViteDevServer } from 'vite';
import fs from 'fs/promises';
import path from 'path';

interface Page {
  label: string;
  url: string;
}

interface AuthStep {
  type: 'goto' | 'fill' | 'click' | 'wait';
  selector?: {
    method: 'label' | 'role' | 'placeholder' | 'text' | 'testId';
    value: string;
    roleOptions?: { name: string };
  };
  value?: string;
  url?: string;
  timeout?: number;
}

interface Project {
  project: string;
  base_url: string;
  authenticationSteps?: AuthStep[];
  pages: Page[];
}

// Parse the data.ts file to extract projects
async function parseDataFile(filePath: string): Promise<Project[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  
  const projects: Project[] = [];
  
  // Match each project block more carefully
  const projectBlockRegex = /\{\s*project:\s*["']([^"']+)["'],\s*base_url:\s*["']([^"']+)["'],([\s\S]*?)pages:\s*\[([\s\S]*?)\]\s*,?\s*\}/g;
  
  let match;
  while ((match = projectBlockRegex.exec(content)) !== null) {
    const [, projectName, baseUrl, middleContent, pagesContent] = match;
    
    // Parse pages
    const pages: Page[] = [];
    const pageRegex = /\{\s*label:\s*["']([^"']+)["'],\s*url:\s*["']([^"']+)["']\s*,?\s*\}/g;
    
    let pageMatch;
    while ((pageMatch = pageRegex.exec(pagesContent)) !== null) {
      pages.push({
        label: pageMatch[1],
        url: pageMatch[2]
      });
    }
    
    // Parse authentication steps if present
    const authenticationSteps: AuthStep[] = [];
    const hasAuth = middleContent.includes('authentication:');
    
    if (hasAuth) {
      // Extract the authentication function body
      const authMatch = middleContent.match(/authentication:\s*async\s*\(page:\s*Page\)\s*=>\s*\{([\s\S]*?)\},?\s*$/);
      if (authMatch) {
        const authBody = authMatch[1];
        
        // Parse goto statements
        const gotoRegex = /await\s+page\.goto\(['"]([^'"]+)['"]\)/g;
        let gotoMatch;
        while ((gotoMatch = gotoRegex.exec(authBody)) !== null) {
          authenticationSteps.push({
            type: 'goto',
            url: gotoMatch[1]
          });
        }
        
        // Parse getByLabel().fill() statements
        const labelFillRegex = /await\s+page\.getByLabel\(['"]([^'"]+)['"]\)\.fill\(['"]([^'"]+)['"]\)/g;
        let labelFillMatch;
        while ((labelFillMatch = labelFillRegex.exec(authBody)) !== null) {
          authenticationSteps.push({
            type: 'fill',
            selector: {
              method: 'label',
              value: labelFillMatch[1]
            },
            value: labelFillMatch[2]
          });
        }
        
        // Parse getByPlaceholder().fill() statements
        const placeholderFillRegex = /await\s+page\.getByPlaceholder\(['"]([^'"]+)['"]\)\.fill\(['"]([^'"]+)['"]\)/g;
        let placeholderFillMatch;
        while ((placeholderFillMatch = placeholderFillRegex.exec(authBody)) !== null) {
          authenticationSteps.push({
            type: 'fill',
            selector: {
              method: 'placeholder',
              value: placeholderFillMatch[1]
            },
            value: placeholderFillMatch[2]
          });
        }
        
        // Parse getByText().fill() statements
        const textFillRegex = /await\s+page\.getByText\(['"]([^'"]+)['"]\)\.fill\(['"]([^'"]+)['"]\)/g;
        let textFillMatch;
        while ((textFillMatch = textFillRegex.exec(authBody)) !== null) {
          authenticationSteps.push({
            type: 'fill',
            selector: {
              method: 'text',
              value: textFillMatch[1]
            },
            value: textFillMatch[2]
          });
        }
        
        // Parse getByTestId().fill() statements
        const testIdFillRegex = /await\s+page\.getByTestId\(['"]([^'"]+)['"]\)\.fill\(['"]([^'"]+)['"]\)/g;
        let testIdFillMatch;
        while ((testIdFillMatch = testIdFillRegex.exec(authBody)) !== null) {
          authenticationSteps.push({
            type: 'fill',
            selector: {
              method: 'testId',
              value: testIdFillMatch[1]
            },
            value: testIdFillMatch[2]
          });
        }
        
        // Parse getByRole().click() statements
        const roleClickRegex = /await\s+page\.getByRole\(['"]([^'"]+)['"],\s*\{\s*name:\s*['"]([^'"]+)['"]\s*\}\)\.click\(\)/g;
        let roleClickMatch;
        while ((roleClickMatch = roleClickRegex.exec(authBody)) !== null) {
          authenticationSteps.push({
            type: 'click',
            selector: {
              method: 'role',
              value: roleClickMatch[1],
              roleOptions: { name: roleClickMatch[2] }
            }
          });
        }
        
        // Parse getByLabel().click() statements
        const labelClickRegex = /await\s+page\.getByLabel\(['"]([^'"]+)['"]\)\.click\(\)/g;
        let labelClickMatch;
        while ((labelClickMatch = labelClickRegex.exec(authBody)) !== null) {
          authenticationSteps.push({
            type: 'click',
            selector: {
              method: 'label',
              value: labelClickMatch[1]
            }
          });
        }
        
        // Parse getByText().click() statements
        const textClickRegex = /await\s+page\.getByText\(['"]([^'"]+)['"]\)\.click\(\)/g;
        let textClickMatch;
        while ((textClickMatch = textClickRegex.exec(authBody)) !== null) {
          authenticationSteps.push({
            type: 'click',
            selector: {
              method: 'text',
              value: textClickMatch[1]
            }
          });
        }
        
        // Parse getByPlaceholder().click() statements
        const placeholderClickRegex = /await\s+page\.getByPlaceholder\(['"]([^'"]+)['"]\)\.click\(\)/g;
        let placeholderClickMatch;
        while ((placeholderClickMatch = placeholderClickRegex.exec(authBody)) !== null) {
          authenticationSteps.push({
            type: 'click',
            selector: {
              method: 'placeholder',
              value: placeholderClickMatch[1]
            }
          });
        }
        
        // Parse getByTestId().click() statements
        const testIdClickRegex = /await\s+page\.getByTestId\(['"]([^'"]+)['"]\)\.click\(\)/g;
        let testIdClickMatch;
        while ((testIdClickMatch = testIdClickRegex.exec(authBody)) !== null) {
          authenticationSteps.push({
            type: 'click',
            selector: {
              method: 'testId',
              value: testIdClickMatch[1]
            }
          });
        }
        
        // Parse waitForTimeout statements
        const waitRegex = /await\s+page\.waitForTimeout\((\d+)\)/g;
        let waitMatch;
        while ((waitMatch = waitRegex.exec(authBody)) !== null) {
          authenticationSteps.push({
            type: 'wait',
            timeout: parseInt(waitMatch[1])
          });
        }
      }
    }
    
    projects.push({
      project: projectName,
      base_url: baseUrl,
      authenticationSteps: authenticationSteps.length > 0 ? authenticationSteps : undefined,
      pages
    });
  }
  
  return projects;
}

// Generate Playwright code from auth steps
function generateAuthCode(steps: AuthStep[]): string {
  const lines: string[] = [];
  
  for (const step of steps) {
    switch (step.type) {
      case 'goto':
        lines.push(`        await page.goto('${step.url}');`);
        break;
      case 'fill':
        if (step.selector) {
          switch (step.selector.method) {
            case 'label':
              lines.push(`        await page.getByLabel('${step.selector.value}').fill('${step.value}');`);
              break;
            case 'placeholder':
              lines.push(`        await page.getByPlaceholder('${step.selector.value}').fill('${step.value}');`);
              break;
            case 'text':
              lines.push(`        await page.getByText('${step.selector.value}').fill('${step.value}');`);
              break;
            case 'testId':
              lines.push(`        await page.getByTestId('${step.selector.value}').fill('${step.value}');`);
              break;
          }
        }
        break;
      case 'click':
        if (step.selector) {
          switch (step.selector.method) {
            case 'role':
              lines.push(`        await page.getByRole('${step.selector.value}', { name: '${step.selector.roleOptions?.name}' }).click();`);
              break;
            case 'label':
              lines.push(`        await page.getByLabel('${step.selector.value}').click();`);
              break;
            case 'text':
              lines.push(`        await page.getByText('${step.selector.value}').click();`);
              break;
            case 'placeholder':
              lines.push(`        await page.getByPlaceholder('${step.selector.value}').click();`);
              break;
            case 'testId':
              lines.push(`        await page.getByTestId('${step.selector.value}').click();`);
              break;
          }
        }
        break;
      case 'wait':
        lines.push(`        await page.waitForTimeout(${step.timeout || 1000});`);
        break;
    }
  }
  
  return lines.join('\n');
}

// Generate the data.ts file content from projects
function generateDataFile(projects: Project[]): string {
  const pagesJson = projects.map(p => {
    const pagesStr = p.pages
      .map(page => `        {\n            label: "${page.label}",\n            url: "${page.url}",\n        }`)
      .join(',\n');
    
    let authSection = '';
    if (p.authenticationSteps && p.authenticationSteps.length > 0) {
      const authCode = generateAuthCode(p.authenticationSteps);
      authSection = `
    authentication: async (page: Page) => {
${authCode}
    },`;
    }
    
    return `  {
    project: "${p.project}",
    base_url: "${p.base_url}",${authSection}
    pages: [
${pagesStr}
    ],
  }`;
  }).join(',\n');

  return `import { Page } from "playwright";

interface PageToScan {
    label: string;
    url: string;
}

interface Project {
    project: string;
    base_url: string;
    authentication?: (page: Page) => Promise<void>;
    pages: PageToScan[];
}

const projects: Project[] = [
${pagesJson}
];

export default projects;
`;
}

export function configApiPlugin(): Plugin {
  const dataFilePath = path.resolve(process.cwd(), 'data.ts');
  
  return {
    name: 'config-api',
    configureServer(server: ViteDevServer) {
      // GET /api/config - Read the current configuration
      server.middlewares.use('/api/config', async (req, res, next) => {
        if (req.method === 'GET') {
          try {
            const projects = await parseDataFile(dataFilePath);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ projects }));
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: String(error) }));
          }
        } else if (req.method === 'POST') {
          // POST /api/config - Save the configuration
          let body = '';
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', async () => {
            try {
              const { projects } = JSON.parse(body) as { projects: Project[] };
              const content = generateDataFile(projects);
              await fs.writeFile(dataFilePath, content, 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (error) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: String(error) }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}
