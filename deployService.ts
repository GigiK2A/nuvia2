// server/deployService.ts
import axios from 'axios';

export async function deployToVercel(projectName: string, files: { [filename: string]: string }) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error("Vercel token mancante nel .env");

  const payload = {
    name: projectName,
    files: Object.entries(files).map(([name, content]) => ({
      file: name,
      data: Buffer.from(content).toString('base64')
    })),
    projectSettings: {
      framework: 'other'
    }
  };

  const response = await axios.post('https://api.vercel.com/v13/deployments', payload, {
    headers: { Authorization: `Bearer ${token}` }
  });

  return response.data;
}