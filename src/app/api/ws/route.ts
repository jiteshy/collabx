import { NextResponse } from 'next/server';

export const config = {
  runtime: 'nodejs',
  api: {
    bodyParser: false,
  },
};

export async function GET(req: Request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
