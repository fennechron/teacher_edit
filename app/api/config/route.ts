import { NextResponse } from 'next/server';
import { getSanityConfig, updateSanityConfig, testConnection } from '@/lib/sanity';
import fs from 'fs';
import path from 'path';

export async function GET() {
  return NextResponse.json(getSanityConfig());
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, dataset, token, apiVersion, persistToEnv } = body;

    const updatedConfig = updateSanityConfig({
      projectId,
      dataset,
      token,
      apiVersion,
    });

    if (persistToEnv) {
      const envPath = path.join(process.cwd(), '.env.local');
      const envContent = `PORT=3000
SANITY_PROJECT_ID=${projectId || ''}
SANITY_DATASET=${dataset || 'production'}
SANITY_API_TOKEN=${token || ''}
SANITY_API_VERSION=${apiVersion || '2024-01-01'}
`;
      fs.writeFileSync(envPath, envContent, 'utf8');
    }

    const test = await testConnection();

    return NextResponse.json({
      success: true,
      config: updatedConfig,
      connection: test,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
