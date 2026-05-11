// Vercel Node serverless function: wraps the TanStack Start SSR fetch handler
// produced by `vite build` (dist/server/server.js).
//
// Vercel passes Node IncomingMessage/ServerResponse; we adapt to/from a Web
// Request/Response so the same handler that runs on Cloudflare/Workers also
// runs here without changes.

import type { IncomingMessage, ServerResponse } from "node:http";

// dist is created by `npm run build`; resolved relative to this file at runtime.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - built artifact, no types
import handler from "../dist/server/server.js";

type WebHandler = {
  fetch: (request: Request, env?: unknown, ctx?: unknown) => Promise<Response> | Response;
};

function buildUrl(req: IncomingMessage): string {
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost";
  const proto = (req.headers["x-forwarded-proto"] as string | undefined) ?? "https";
  return `${proto}://${host}${req.url ?? "/"}`;
}

async function readBody(req: IncomingMessage): Promise<Buffer | undefined> {
  if (req.method === "GET" || req.method === "HEAD") return undefined;
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function toRequest(req: IncomingMessage, body: Buffer | undefined): Request {
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (Array.isArray(v)) v.forEach((vv) => headers.append(k, vv));
    else if (typeof v === "string") headers.set(k, v);
  }
  return new Request(buildUrl(req), {
    method: req.method ?? "GET",
    headers,
    body: body && body.length > 0 ? body : undefined,
  });
}

async function sendResponse(res: ServerResponse, webRes: Response): Promise<void> {
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => res.setHeader(key, value));
  if (!webRes.body) {
    res.end();
    return;
  }
  const buf = Buffer.from(await webRes.arrayBuffer());
  res.end(buf);
}

export default async function vercelHandler(req: IncomingMessage, res: ServerResponse) {
  try {
    const body = await readBody(req);
    const request = toRequest(req, body);
    const webRes = await (handler as WebHandler).fetch(request);
    await sendResponse(res, webRes);
  } catch (err) {
    console.error("[vercel] SSR handler error", err);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Internal Server Error");
  }
}
