export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  debug: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
}

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(current: LogLevel, messageLevel: LogLevel): boolean {
  return levelOrder[messageLevel] >= levelOrder[current];
}

function write(
  level: LogLevel,
  message: string,
  meta: Record<string, unknown> | undefined,
  jsonMode: boolean,
): void {
  if (jsonMode) {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };
    const line = JSON.stringify(payload);

    if (level === "error") {
      console.error(line);
      return;
    }

    if (level === "warn") {
      console.warn(line);
      return;
    }

    console.log(line);
    return;
  }

  const payload = meta ? `${message} ${JSON.stringify(meta)}` : message;
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${payload}`;

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function createLogger(level: LogLevel = "info", nodeEnv = "development"): Logger {
  const jsonMode = nodeEnv === "production" || nodeEnv === "staging";

  return {
    debug: (message, meta) => {
      if (shouldLog(level, "debug")) write("debug", message, meta, jsonMode);
    },
    info: (message, meta) => {
      if (shouldLog(level, "info")) write("info", message, meta, jsonMode);
    },
    warn: (message, meta) => {
      if (shouldLog(level, "warn")) write("warn", message, meta, jsonMode);
    },
    error: (message, meta) => {
      if (shouldLog(level, "error")) write("error", message, meta, jsonMode);
    },
  };
}
