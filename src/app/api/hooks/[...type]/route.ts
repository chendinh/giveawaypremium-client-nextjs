import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PARSE_INTERNAL_PORT = process.env.PARSE_INTERNAL_PORT || '4000';
const PARSE_INTERNAL_URL = `http://localhost:${PARSE_INTERNAL_PORT}`;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string[] }> },
): Promise<NextResponse> {
  try {
    const { type } = await params;
    const targetPath = `/hooks/${type.join('/')}`;
    const url = `${PARSE_INTERNAL_URL}${targetPath}`;

    const body = await request.text();
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'host') {
        headers[key] = value;
      }
    });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'transfer-encoding') {
        responseHeaders.set(key, value);
      }
    });

    const responseBody = await response.arrayBuffer();
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Hooks API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
