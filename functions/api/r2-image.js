/**
 * Leather Right Shoes — Cloudflare Pages Function
 *
 * Dedicated R2 image API.
 *
 * Route:
 *   GET  /api/r2-image?key=<object-key>
 *   POST /api/r2-image
 *   DELETE /api/r2-image
 *
 * This file intentionally does NOT use D1, /api/state, LocalStorage,
 * or any frontend image/storage logic.
 *
 * R2 binding:
 *   env.R2_IMAGES
 *
 * POST expects multipart/form-data with:
 *   file = image file
 *   key  = optional object key
 *
 * Existing Base64 images are not read, migrated, replaced, or deleted.
 */

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_KEY_LENGTH = 240;
const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const EXTENSIONS = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

function text(data, status = 200, extraHeaders = {}) {
  return new Response(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

function getAllowedOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return null;

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);

    if (
      originUrl.protocol !== requestUrl.protocol ||
      originUrl.host !== requestUrl.host
    ) {
      return false;
    }

    return origin;
  } catch {
    return false;
  }
}

function validateOrigin(request) {
  const origin = getAllowedOrigin(request);

  if (origin === false) {
    return {
      ok: false,
      response: json(
        { error: "Cross-origin requests are not allowed." },
        403
      ),
    };
  }

  return { ok: true };
}

function constantTimeEqual(a, b) {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const length = Math.max(aBytes.length, bBytes.length);
  let difference = aBytes.length ^ bBytes.length;

  for (let i = 0; i < length; i += 1) {
    difference |= (aBytes[i] || 0) ^ (bBytes[i] || 0);
  }

  return difference === 0;
}

const SESSION_COOKIE_NAME = "lrs_r2_session";
function b64url(bytes) {
  let s = ""; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
async function signSession(secret, value) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}
function getCookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) { const i = part.indexOf("="); if (i >= 0 && part.slice(0,i).trim() === name) return part.slice(i+1).trim(); }
  return "";
}
async function hasValidSession(env, request) {
  const secret = env?.R2_SESSION_SECRET;
  if (typeof secret !== "string" || !secret) return false;
  const parts = getCookie(request, SESSION_COOKIE_NAME).split(".");
  if (parts.length !== 3) return false;
  const [exp, nonce, sig] = parts;
  if (!Number.isFinite(Number(exp)) || Number(exp) <= Math.floor(Date.now()/1000)) return false;
  return constantTimeEqual(sig, await signSession(secret, `${exp}.${nonce}`));
}
async function authorizeUpload(env, request) {
  if (await hasValidSession(env, request)) return { ok: true };
  const configuredSecret = env?.R2_UPLOAD_TOKEN;
  const authorization = request.headers.get("Authorization") || "";
  if (typeof configuredSecret === "string" && configuredSecret && authorization.startsWith("Bearer ")) {
    const suppliedSecret = authorization.slice(7);
    if (suppliedSecret && constantTimeEqual(suppliedSecret, configuredSecret)) return { ok: true };
  }
  return { ok: false, response: json({ error: "Unauthorized." }, 401) };
}

function sanitizeKey(rawKey) {
  if (typeof rawKey !== "string") {
    return { ok: false, error: "Image key is required." };
  }

  const key = rawKey.trim();

  if (!key) {
    return { ok: false, error: "Image key is required." };
  }

  if (key.length > MAX_KEY_LENGTH) {
    return { ok: false, error: "Image key is too long." };
  }

  if (key.includes("\0")) {
    return { ok: false, error: "Image key contains an invalid character." };
  }

  // R2 object keys are not filesystem paths, but rejecting traversal-like
  // syntax prevents accidental use of unsafe path semantics by clients.
  if (
    key.startsWith("/") ||
    key.endsWith("/") ||
    key.includes("\\") ||
    key.includes("//") ||
    key === "." ||
    key === ".." ||
    key.includes("/./") ||
    key.includes("/../") ||
    key.startsWith("../") ||
    key.includes("../")
  ) {
    return { ok: false, error: "Invalid image key." };
  }

  // Keep this endpoint limited to an image namespace. This also prevents
  // arbitrary application objects from being accessed through this API.
  if (!key.startsWith("images/")) {
    return {
      ok: false,
      error: 'Image key must start with "images/".',
    };
  }

  // Allow only predictable object-key characters. Spaces and encoded/control
  // characters are intentionally excluded.
  if (!/^images\/[A-Za-z0-9._/-]+$/.test(key)) {
    return { ok: false, error: "Image key contains unsupported characters." };
  }

  return { ok: true, key };
}

function validateUploadKey(rawKey, contentType) {
  if (rawKey == null || rawKey === "") {
    const extension = EXTENSIONS.get(contentType);
    const id =
      typeof crypto?.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    return {
      ok: true,
      key: `images/${id}.${extension}`,
    };
  }

  const result = sanitizeKey(rawKey);
  if (!result.ok) return result;

  const expectedExtension = EXTENSIONS.get(contentType);
  const lowerKey = result.key.toLowerCase();

  if (!lowerKey.endsWith(`.${expectedExtension}`)) {
    return {
      ok: false,
      error: `Image key extension must match ${contentType}.`,
    };
  }

  return result;
}

function contentTypeIsAllowed(contentType) {
  return IMAGE_TYPES.has(
    typeof contentType === "string" ? contentType.toLowerCase() : ""
  );
}

function isValidImageMagicBytes(bytes, contentType) {
  if (!bytes || bytes.length < 12) return false;

  const b = bytes;

  if (
    contentType === "image/jpeg"
  ) {
    return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  }

  if (
    contentType === "image/png"
  ) {
    return (
      b[0] === 0x89 &&
      b[1] === 0x50 &&
      b[2] === 0x4e &&
      b[3] === 0x47 &&
      b[4] === 0x0d &&
      b[5] === 0x0a &&
      b[6] === 0x1a &&
      b[7] === 0x0a
    );
  }

  if (contentType === "image/gif") {
    return (
      b[0] === 0x47 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x38 &&
      (b[4] === 0x37 || b[4] === 0x39) &&
      b[5] === 0x61
    );
  }

  if (contentType === "image/webp") {
    return (
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50
    );
  }

  return false;
}

async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
}

function contentDispositionFilename(key) {
  const name = key.split("/").pop() || "image";
  return name.replace(/["\\\r\n]/g, "_");
}

async function handleGet({ env, request }) {
  if (!env?.R2_IMAGES) {
    return json({ error: "R2 binding R2_IMAGES is not configured." }, 500);
  }

  const url = new URL(request.url);
  const validation = sanitizeKey(url.searchParams.get("key"));

  if (!validation.ok) {
    return json({ error: validation.error }, 400);
  }

  try {
    const object = await env.R2_IMAGES.get(validation.key);

    if (!object) {
      return json({ error: "Image not found." }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("ETag", object.httpEtag);
    headers.set("Cache-Control", "private, max-age=3600");
    headers.set(
      "Content-Disposition",
      `inline; filename="${contentDispositionFilename(validation.key)}"`
    );

    return new Response(object.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("GET /api/r2-image failed:", error);
    return json({ error: "R2 image read failed." }, 500);
  }
}

async function handlePost({ env, request }) {
  if (!env?.R2_IMAGES) {
    return json({ error: "R2 binding R2_IMAGES is not configured." }, 500);
  }

  const authorization = await authorizeUpload(env, request);
  if (!authorization.ok) {
    return authorization.response;
  }

  const contentTypeHeader = request.headers.get("Content-Type") || "";

  if (!contentTypeHeader.toLowerCase().startsWith("multipart/form-data")) {
    return json(
      { error: "Upload must use multipart/form-data." },
      415
    );
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Invalid multipart/form-data request." }, 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return json({ error: 'Multipart field "file" is required.' }, 400);
  }

  if (file.size <= 0) {
    return json({ error: "Image file is empty." }, 400);
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return json(
      { error: "Image file is too large. Maximum size is 10 MB." },
      413
    );
  }

  const imageType = file.type.toLowerCase();

  if (!contentTypeIsAllowed(imageType)) {
    return json(
      {
        error:
          "Unsupported image type. Only JPEG, PNG, WebP, and GIF are allowed.",
      },
      415
    );
  }

  const requestedKey = form.get("key");
  const body = await file.arrayBuffer();
  const bytes = new Uint8Array(body);

  if (!isValidImageMagicBytes(bytes, imageType)) {
    return json(
      { error: "File contents do not match the declared image type." },
      415
    );
  }

  // Content-addressed keys prevent the same processed image bytes from being
  // stored more than once. Existing callers that explicitly provide a key keep
  // their requested-key behavior; the app frontend does not provide one.
  let keyValidation;
  if (typeof requestedKey === "string" && requestedKey.trim()) {
    keyValidation = validateUploadKey(requestedKey, imageType);
  } else {
    const hash = await sha256Hex(body);
    keyValidation = { ok: true, key: `images/sha256-${hash}.${EXTENSIONS.get(imageType)}` };
  }

  if (!keyValidation.ok) {
    return json({ error: keyValidation.error }, 400);
  }

  try {
    const existingObject = await env.R2_IMAGES.head(keyValidation.key);

    if (existingObject) {
      return json({
        ok: true,
        key: keyValidation.key,
        contentType: imageType,
        size: file.size,
        duplicate: true
      }, 200);
    }

    const uploadedObject = await env.R2_IMAGES.put(keyValidation.key, body, {
      onlyIf: {
        etagDoesNotMatch: "*",
      },
      httpMetadata: {
        contentType: imageType,
        contentDisposition: `inline; filename="${contentDispositionFilename(
          keyValidation.key
        )}"`,
      },
    });

    if (!uploadedObject) {
      return json({ error: "Image key already exists." }, 409);
    }

    return json(
      {
        ok: true,
        key: keyValidation.key,
        contentType: imageType,
        size: file.size,
        duplicate: false,
      },
      201
    );
  } catch (error) {
    console.error("POST /api/r2-image failed:", error);
    return json({ error: "R2 image upload failed." }, 500);
  }
}

async function handleDelete({ env, request }) {
  if (!env?.R2_IMAGES) return json({ error: "R2 binding R2_IMAGES is not configured." }, 500);
  const authorization = await authorizeUpload(env, request);
  if (!authorization.ok) return authorization.response;

  let payload;
  try { payload = await request.json(); }
  catch { return json({ error: "Invalid JSON request." }, 400); }

  const validation = sanitizeKey(payload?.key);
  if (!validation.ok) return json({ error: validation.error }, 400);

  try {
    const existing = await env.R2_IMAGES.head(validation.key);
    if (!existing) return json({ ok: true, deleted: false, key: validation.key }, 200);
    await env.R2_IMAGES.delete(validation.key);
    return json({ ok: true, deleted: true, key: validation.key }, 200);
  } catch (error) {
    console.error("DELETE /api/r2-image failed:", error);
    return json({ error: "R2 image delete failed." }, 500);
  }
}

export async function onRequest(context) {
  const method = context.request.method.toUpperCase();

  const originValidation = validateOrigin(context.request);
  if (!originValidation.ok) {
    return originValidation.response;
  }

  if (method === "GET") {
    return handleGet(context);
  }

  if (method === "POST") {
    return handlePost(context);
  }

  if (method === "DELETE") {
    return handleDelete(context);
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: {
      Allow: "GET, POST, DELETE",
      "Cache-Control": "no-store",
    },
  });
}
