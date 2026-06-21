const fs = require('fs');
const path = require('path');

const filesToProcess = [
  'components/Forms/CreateCollectionForm.tsx',
  'components/Forms/CreateLinkBar.tsx',
  'components/Forms/CreateLinkForm.tsx',
  'components/Forms/SettingsForm.tsx',
  'components/Forms/CreateUserForm.tsx',
  'components/Forms/index.ts',
  'components/dashboard/Collections.tsx',
  'components/dashboard/LinkBanner.tsx',
  'components/dashboard/LinkMapper.tsx',
  'components/dashboard/Links.tsx',
  'components/dashboard/index.ts'
];

const dir = '/home/dhvanit/Desktop/Production/linkaroo-app/web';

for (const relPath of filesToProcess) {
  const filePath = path.join(dir, relPath);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Next.js App Router hooks
  content = content.replace(/import \{.*useNavigate.*\} from ['"]react-router-dom['"];?/g, "import { useRouter } from 'next/navigation';");
  content = content.replace(/import \{.*useLocation.*\} from ['"]react-router-dom['"];?/g, "import { usePathname } from 'next/navigation';");
  
  // Special handling for mixed imports
  if (content.includes('react-router-dom')) {
    content = content.replace(/import \{([^}]*)\} from ['"]react-router-dom['"];?/g, (match, imports) => {
      let newImports = imports.replace(/useNavigate/g, 'useRouter').replace(/useLocation/g, 'usePathname');
      if (newImports.includes('useParams')) {
          return "import { useRouter, usePathname, useParams } from 'next/navigation';";
      }
      return `import { ${newImports} } from 'next/navigation';`;
    });
  }

  content = content.replace(/useNavigate\(\)/g, "useRouter()");
  content = content.replace(/useLocation\(\)\.pathname/g, "usePathname()");
  content = content.replace(/useLocation\(\)/g, "usePathname()");

  // 2. Env vars
  content = content.replace(/import\.meta\.env\.VITE_/g, "process.env.NEXT_PUBLIC_");

  // 3. Clerk
  content = content.replace(/@clerk\/clerk-react/g, "@clerk/nextjs");

  // 4. "use client"
  if (!content.includes('"use client"') && relPath.endsWith('.tsx')) {
    content = `"use client";\n\n` + content;
  }

  fs.writeFileSync(filePath, content);
}

console.log("Migration script complete");
