import { Injectable } from '@nestjs/common';
import IORedis from 'ioredis';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async check() {
    const db = await this.checkDatabase();
    const redis = await this.checkRedis();
    const smtp = this.checkSmtp();

    return {
      status: db.status === 'ok' && redis.status !== 'down' ? 'ok' : 'degraded',
      database: db,
      redis,
      smtp,
      timestamp: new Date().toISOString(),
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok' as const };
    } catch (error) {
      return { status: 'down' as const, error: 'database unavailable' };
    }
  }

  private async checkRedis() {
    const url = process.env.REDIS_URL;
    if (!url) {
      return { status: 'skipped' as const };
    }

    const client = new IORedis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });

    try {
      await client.connect();
      await client.ping();
      return { status: 'ok' as const };
    } catch {
      return { status: 'down' as const, error: 'redis unavailable' };
    } finally {
      await client.quit().catch(() => undefined);
    }
  }

  private checkSmtp() {
    const configured = Boolean(process.env.SMTP_HOST);
    return {
      status: configured ? ('configured' as const) : ('not_configured' as const),
    };
  }
}
