import { Page } from "playwright";

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
  {
    project: "Tailwind accessiblity",
    base_url: "https://tailwindcss.com",
    pages: [
        {
            label: "Home",
            url: "/",
        },
        {
            label: "Documentation",
            url: "/docs/installation/using-vite",
        },
        {
            label: "Showcase",
            url: "/showcase",
        }
    ],
  },
  {
    project: "React.dev",
    base_url: "https://react.dev",
    pages: [
        {
            label: "Home",
            url: "/",
        },
        {
            label: "Learn",
            url: "/learn",
        }
    ],
  }
];

export default projects;
