import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🧪 Test endpoint called');
  return NextResponse.json({ 
    status: 'API is working',
    timestamp: new Date().toISOString(),
    puppeteer: 'Available'
  });
}
