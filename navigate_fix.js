const fs = require('fs');

const files = [
  'web/components/dashboard/Links.tsx',
  'web/app/auth/createuser/page.tsx',
  'web/components/layouts/AppLayout.tsx',
  'web/app/auth/signup/page.tsx',
  'web/app/shared/[collectionId]/page.tsx',
  'web/app/auth/signin/page.tsx',
  'web/components/Forms/CreateLinkForm.tsx',
  'web/components/Forms/CreateLinkBar.tsx',
  'web/components/Forms/CreateCollectionForm.tsx'
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  // Handle replace
  content = content.replace(/navigate\(([^,]+),\s*\{\s*replace:\s*true\s*\}\)/g, 'navigate.replace($1)');
  // Handle standard push
  content = content.replace(/navigate\(/g, 'navigate.push(');
  fs.writeFileSync(f, content);
}
