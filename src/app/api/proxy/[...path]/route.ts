import { NextRequest, NextResponse } from 'next/server';

/**
 * API Proxy Route
 * Proxies all API requests to the HTTP backend server
 * This solves the Mixed Content issue when frontend is served over HTTPS
 * 
 * Usage: /api/proxy/business/123 -> http://20.42.90.94/flowcartapi/api/business/123
 */

// Backend API URL - this is the HTTP endpoint we're proxying to
// Use API_BASE_URL env var, or fallback to the default HTTP API URL
const API_BASE_URL = process.env.API_BASE_URL || 'http://20.42.90.94/flowcartapi/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest(request, params, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    // Reconstruct the API path
    const path = params.path.join('/');
    const url = new URL(request.url);
    const queryString = url.search;
    
    // Build the target URL
    const targetUrl = `${API_BASE_URL}/${path}${queryString}`;

    // Get request body if present
    let body: any = null;
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.json();
      } catch {
        // No body or not JSON
        body = null;
      }
    }

    // Forward headers (excluding host and connection)
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== 'host' &&
        lowerKey !== 'connection' &&
        lowerKey !== 'content-length'
      ) {
        headers[key] = value;
      }
    });

    // Make the request to the backend API
    const response = await fetch(targetUrl, {
      method,
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    // Get response data
    const data = await response.text();
    let jsonData: any;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }

    // Forward response with same status and headers
    return NextResponse.json(jsonData, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', message: error.message },
      { status: 500 }
    );
  }
}

