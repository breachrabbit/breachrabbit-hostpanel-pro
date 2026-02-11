import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';
import { RESTART_COMMAND, SYSTEM_CHANGES_ALLOWED, commandParts } from '@/app/lib/panel-config';

const execFileAsync = promisify(execFile);

export async function POST() {
  if (!SYSTEM_CHANGES_ALLOWED) {
    return NextResponse.json({
      status: 'dry-run',
      message:
        'System actions are disabled. Set PANEL_ALLOW_SYSTEM_CHANGES=true to execute restart commands.',
      command: RESTART_COMMAND
    });
  }

  try {
    const { bin, args } = commandParts(RESTART_COMMAND);
    const { stdout, stderr } = await execFileAsync(bin, args, { timeout: 30_000 });

    return NextResponse.json({
      status: 'ok',
      command: RESTART_COMMAND,
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      message: 'Server restart command executed.'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown restart error';
    return NextResponse.json(
      {
        status: 'error',
        command: RESTART_COMMAND,
        message
      },
      { status: 500 }
    );
  }
}
