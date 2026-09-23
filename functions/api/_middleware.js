// Performance-only middleware for R2 image GET requests.
// It does not modify D1, uploads, deletes, application state, or image objects.
export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

  // Preserve every existing API path/method exactly as-is except public GET
  // delivery of content-addressed R2 images.
  if (request.method !== "GET" || url.pathname !== "/api/r2-image") {
    return context.next();
  }

  const key = url.searchParams.get("key") || "";
  const isContentAddressed = /^images\/sha256-[a-f0-9]{64}\.(?:jpg|jpeg|png|webp|gif)$/i.test(key);

  // Only immutable SHA-256 image keys are safe for long-lived caching.
  if (!isContentAddressed) {
    return context.next();
  }

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: "GET" });
  const cached = await cache.match(cacheKey);

  if (cached) {
    const response = new Response(cached.body, cached);
    response.headers.set("X-LRS-Image-Cache", "HIT");
    return response;
  }

  const originResponse = await context.next();

  // Never cache errors or non-image responses.
  if (!originResponse.ok || !(originResponse.headers.get("Content-Type") || "").toLowerCase().startsWith("image/")) {
    return originResponse;
  }

  const response = new Response(originResponse.body, originResponse);
  response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  response.headers.set("X-LRS-Image-Cache", "MISS");

  // Populate Cloudflare's edge cache without delaying the response.
  context.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}
