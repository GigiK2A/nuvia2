// File: utils/deploy.ts

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface Project {
  id: string;
  name: string;
  type: string;
  codes: CodeSnippet[];
}

interface CodeSnippet {
  id: string;
  filename: string;
  code: string;
  language: string;
}

export function writeProjectToDisk(project: Project, basePath: string): string {
  const projectDir = path.join(basePath, project.id);
  
  // Create project directory
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
  }

  // Write package.json for Node.js projects
  const packageJson = {
    name: project.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    version: "1.0.0",
    description: `Generated project: ${project.name}`,
    main: "index.js",
    scripts: {
      start: "node index.js",
      dev: "node index.js",
      build: "echo 'Build complete'"
    },
    dependencies: {
      express: "^4.18.0"
    }
  };

  fs.writeFileSync(
    path.join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Write code files
  project.codes.forEach(code => {
    const filePath = path.join(projectDir, code.filename);
    const fileDir = path.dirname(filePath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, code.code);
  });

  // Create a basic index.js if none exists
  const indexPath = path.join(projectDir, 'index.js');
  if (!fs.existsSync(indexPath)) {
    const basicServer = `const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('<h1>Welcome to ${project.name}</h1><p>Project deployed successfully!</p>');
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});`;
    
    fs.writeFileSync(indexPath, basicServer);
  }

  // Create a basic HTML file
  const publicDir = path.join(projectDir, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.name}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .code-file { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
        .filename { font-weight: bold; color: #333; margin-bottom: 10px; }
        pre { background: #fff; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${project.name}</h1>
        <p>Generated project with ${project.codes.length} files</p>
    </div>
    
    ${project.codes.map(code => `
    <div class="code-file">
        <div class="filename">${code.filename}</div>
        <pre><code>${code.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>
    </div>
    `).join('')}
</body>
</html>`;

  fs.writeFileSync(path.join(publicDir, 'index.html'), htmlContent);

  return projectDir;
}

export async function deployToVercel(projectDir: string): Promise<string> {
  try {
    // Check if Vercel CLI is available
    await execAsync('vercel --version');
    
    // Deploy to Vercel
    const { stdout, stderr } = await execAsync(`cd ${projectDir} && vercel --prod --yes`);
    
    if (stderr && !stderr.includes('Warning')) {
      throw new Error(`Vercel deployment failed: ${stderr}`);
    }
    
    return stdout;
  } catch (error) {
    throw new Error(`Vercel deployment error: ${error.message}`);
  }
}

export async function deployToRender(repoPath: string): Promise<string> {
  try {
    // This would typically involve Git operations to push to a Render-connected repository
    const { stdout, stderr } = await execAsync(`cd ${repoPath} && git add . && git commit -m "Deploy update" && git push origin main`);
    
    if (stderr && !stderr.includes('up-to-date')) {
      throw new Error(`Render deployment failed: ${stderr}`);
    }
    
    return stdout || 'Successfully pushed to repository';
  } catch (error) {
    throw new Error(`Render deployment error: ${error.message}`);
  }
}