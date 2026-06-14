import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    if (times > 3) return null
    return Math.min(times * 200, 2000)
  },
  lazyConnect: true,
})

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis

// Helper functions
export async function getCache<T>(key: string): Promise<T | null> {
  const data = await redis.get(key)
  return data ? JSON.parse(data) : null
}

export async function setCache(key: string, value: unknown, ttlSeconds: number = 300): Promise<void> {
  await redis.setex(key, ttlSeconds, JSON.stringify(value))
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}

// Rate limiting
export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now()
  const windowStart = now - windowSeconds * 1000
  
  const pipeline = redis.pipeline()
  pipeline.zremrangebyscore(key, 0, windowStart)
  pipeline.zcard(key)
  pipeline.zadd(key, now, `${now}-${Math.random()}`)
  pipeline.expire(key, windowSeconds)
  
  const results = await pipeline.exec()
  const currentCount = results?.[1]?.[1] as number || 0
  
  return {
    allowed: currentCount < limit,
    remaining: Math.max(0, limit - currentCount - 1),
    resetAt: now + windowSeconds * 1000,
  }
}

// Pub/Sub for real-time updates
export const CHANNELS = {
  STATION_METADATA: 'station:metadata',
  VISUALIZER_DATA: 'visualizer:data',
  LISTENER_COUNT: 'listener:count',
  TRACK_PLAY: 'track:play',
} as const

export function publish(channel: string, data: unknown): Promise<number> {
  return redis.publish(channel, JSON.stringify(data))
}

export function subscribe(channel: string, callback: (data: unknown) => void): () => void {
  const subscriber = redis.duplicate()
  subscriber.subscribe(channel)
  subscriber.on('message', (ch, message) => {
    if (ch === channel) {
      try {
        callback(JSON.parse(message))
      } catch {
        // Ignore parse errors
      }
    }
  })
  return () => {
    subscriber.unsubscribe(channel)
    subscriber.quit()
  }
}