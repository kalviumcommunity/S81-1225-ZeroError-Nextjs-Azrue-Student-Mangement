import { NextResponse } from 'next/server';
import { getSecrets } from '@/lib/secrets';

export async function GET() {
  try {
    const secrets = await getSecrets();
    const keys = Object.keys(secrets);
    // Log only keys, never values
    console.log('[secrets] Retrieved keys:', keys);
    return NextResponse.json({ success: true, keys });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve secrets', error: String(error) },
      { status: 500 }
    );
  }
}
