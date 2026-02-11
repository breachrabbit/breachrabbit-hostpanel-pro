import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextRequest, NextResponse } from 'next/server';
import { DATABASE_PATTERN, SYSTEM_CHANGES_ALLOWED } from '@/app/lib/panel-config';

const execFileAsync = promisify(execFile);

function normalizeDbName(input: string) {
  return input.trim();
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { database?: string } | null;
  const database = normalizeDbName(body?.database ?? '');

  if (!DATABASE_PATTERN.test(database)) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Invalid database name. Use letters, numbers and underscores, max 63 chars.'
      },
      { status: 400 }
    );
  }

  if (!SYSTEM_CHANGES_ALLOWED) {
    return NextResponse.json({
      status: 'dry-run',
      message:
        'System actions are disabled. Set PANEL_ALLOW_SYSTEM_CHANGES=true to execute SQL changes.',
      sql: `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    });
  }

  const dbHost = process.env.DB_HOST ?? '127.0.0.1';
  const dbPort = process.env.DB_PORT ?? '3306';
  const dbUser = process.env.DB_USER ?? 'root';
  const dbPassword = process.env.DB_PASSWORD ?? '';

  const sql = `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`;

  try {
    await execFileAsync(
      'mysql',
      ['-h', dbHost, '-P', dbPort, '-u', dbUser, `-p${dbPassword}`, '-e', sql],
      { timeout: 30_000 }
    );

    return NextResponse.json({
      status: 'ok',
      message: `Database ${database} created or already exists.`,
      database
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Database creation failed'
      },
      { status: 500 }
    );
  }
}
