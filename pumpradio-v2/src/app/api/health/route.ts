import { NextResponse } from 'next/server'

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    node: process.version,
    env: process.env.NODE_ENV,
  }
  
  return NextResponse.json(health, { status: 200 })
}
