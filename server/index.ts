import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { ApiError, respond, validateRequest } from "./chat.js";
const apiOnly = process.argv.includes("--api-only");
const root = resolve(process.cwd(), "dist");
const limits = new Map<string, { started: number; count: number }>();
const server = createServer(async (req, res) => {
  const send = (status: number, body: unknown) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(body));
  };
  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  if ((pathname === "/api/chat" || pathname === "/api/assistant")) {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      send(405, {
        error: {
          code: "METHOD_NOT_ALLOWED",
          message: "Use POST for chat requests.",
        },
      });
      return;
    }
    try {
      if (!req.headers["content-type"]?.startsWith("application/json"))
        throw new ApiError(415, "JSON_REQUIRED", "Send a JSON request.");
      // Local demo server: trust the socket address, never arbitrary forwarded headers.
      const ip = req.socket.remoteAddress ?? "local";
      const now = Date.now();
      for (const [key, limit] of limits)
        if (now - limit.started >= 60000) limits.delete(key);
      const limit = limits.get(ip) ?? { started: now, count: 0 };
      if (limit.count >= 12) {
        res.setHeader("Retry-After", "60");
        throw new ApiError(
          429,
          "RATE_LIMITED",
          "Too many questions. Wait a minute and try again.",
        );
      }
      if (!limits.has(ip) && limits.size >= 1000)
        throw new ApiError(
          429,
          "RATE_LIMITED",
          "The demo is busy. Please try again shortly.",
        );
      limit.count++;
      limits.set(ip, limit);
      let size = 0;
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 131072)
          throw new ApiError(
            413,
            "REQUEST_TOO_LARGE",
            "This conversation is too large. Start a shorter question.",
          );
        chunks.push(Buffer.from(chunk));
      }
      let body: unknown;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString());
      } catch {
        throw new ApiError(400, "INVALID_JSON", "Send a valid JSON request.");
      }
      send(200, await respond(validateRequest(body)));
    } catch (error) {
      const failure =
        error instanceof ApiError
          ? error
          : new ApiError(
              500,
              "SERVER_ERROR",
              "The assistant is unavailable. Please retry.",
            );
      send(failure.status, {
        error: { code: failure.code, message: failure.message },
      });
    }
    return;
  }
  if (pathname.startsWith("/api/")) {
    send(404, {
      error: { code: "NOT_FOUND", message: "API route not found." },
    });
    return;
  }
  if (apiOnly) {
    send(404, {
      error: { code: "NOT_FOUND", message: "Use the Vite frontend address." },
    });
    return;
  }
  if (!["GET", "HEAD"].includes(req.method ?? "")) {
    send(405, { error: { message: "Method not allowed." } });
    return;
  }
  try {
    const path = resolve(root, `.${decodeURIComponent(pathname)}`);
    if (path !== root && !path.startsWith(root + sep)) {
      send(403, { error: { message: "Forbidden." } });
      return;
    }
    const file = path === root ? resolve(root, "index.html") : path;
    if (!(await stat(file)).isFile()) throw new Error("not a file");
    const mime: Record<string, string> = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".woff2": "font/woff2",
    };
    res.writeHead(200, {
      "Content-Type": mime[extname(file)] ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : await readFile(file));
  } catch {
    send(404, {
      error: { message: "File not found. Build the frontend first." },
    });
  }
});
server.requestTimeout = 30000;
server.headersTimeout = 10000;
const port = Number(process.env.PORT ?? 8787);
server.on("error", (error) => {
  console.error(`Health Insight server could not start: ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, process.env.HOST ?? "127.0.0.1", () => {
  const address = server.address();
  console.log(
    `Health Insight ${apiOnly ? "API" : "app"}: http://127.0.0.1:${typeof address === "object" && address ? address.port : port}`,
  );
});
