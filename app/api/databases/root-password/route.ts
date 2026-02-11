import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_CHANGES_ALLOWED } from '@/app/lib/panel-config';

const execFileAsync = promisify(execFile);

function escapeSqlString(input: string) {
  return input.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  const password = (body?.password ?? '').trim();

  if (password.length < 8) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Password must be at least 8 characters.'
      },
      { status: 400 }
    );
  }

  if (!SYSTEM_CHANGES_ALLOWED) {
    return NextResponse.json({
      status: 'dry-run',
      message:
        'System actions are disabled. Set PANEL_ALLOW_SYSTEM_CHANGES=true to update MariaDB/MySQL users.',
      sql: "ALTER USER 'root'@'localhost' IDENTIFIED BY '********'; FLUSH PRIVILEGES;"
    });
  }

  const dbHost = process.env.DB_HOST ?? '127.0.0.1';
  const dbPort = process.env.DB_PORT ?? '3306';
  const dbUser = process.env.DB_USER ?? 'root';
  const dbPassword = process.env.DB_PASSWORD ?? '';

  const escapedPassword = escapeSqlString(password);
  const sql = `ALTER USER 'root'@'localhost' IDENTIFIED BY '${escapedPassword}'; FLUSH PRIVILEGES;`;

  try {
    await execFileAsync(
      'mysql',
      ['-h', dbHost, '-P', dbPort, '-u', dbUser, `-p${dbPassword}`, '-e', sql],
      { timeout: 30_000 }
    );

    return NextResponse.json({
      status: 'ok',
      message: 'MySQL root password updated for root@localhost.'
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Root password update failed'
      },
      { status: 500 }
    );
  }
}
