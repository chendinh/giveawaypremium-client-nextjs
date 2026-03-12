import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PARSE_INTERNAL_PORT = process.env.PARSE_INTERNAL_PORT || '4000';
const PARSE_INTERNAL_URL = `http://localhost:${PARSE_INTERNAL_PORT}`;

/**
 * Maps incoming /api/* paths to internal Parse Server endpoints:
 *   /api/parse/*     → :4000/api/*      (Parse REST API)
 *   /api/media       → :4000/media      (file upload)
 *   /api/hooks/*     → :4000/hooks/*    (webhooks)
 *   /api/dashboard/* → :4000/dashboard/* (Parse Dashboard)
 */
function resolveInternalUrl(
  segments: string[],
  searchParams: URLSearchParams,
): string {
  const [prefix, ...rest] = segments;
  let targetPath: string;

  switch (prefix) {
    case 'parse':
      targetPath = `/api/${rest.join('/')}`;
      break;
    case 'media':
      targetPath = `/media${rest.length ? '/' + rest.join('/') : ''}`;
      break;
    case 'hooks':
      targetPath = `/hooks/${rest.join('/')}`;
      break;
    case 'dashboard':
      targetPath = `/dashboard/${rest.join('/')}`;
      break;
    default:
      targetPath = `/${segments.join('/')}`;
      break;
  }

  const url = new URL(targetPath, PARSE_INTERNAL_URL);
  searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

function forwardHeaders(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== 'host') {
      headers[key] = value;
    }
  });
  return headers;
}

async function proxy(
  request: NextRequest,
  path: string[],
): Promise<NextResponse> {
  try {
    const url = resolveInternalUrl(path, request.nextUrl.searchParams);
    const headers = forwardHeaders(request);

    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    // Forward body for non-GET/HEAD requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      // Use arrayBuffer to support both JSON and multipart bodies
      const body = await request.arrayBuffer();
      if (body.byteLength > 0) {
        fetchOptions.body = body;
      }
    }

    const response = await fetch(url, fetchOptions);

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
    console.error('[API Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxy(request, path);
}
