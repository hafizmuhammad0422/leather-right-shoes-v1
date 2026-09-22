/**
 * Leather Right Shoes — Cloudflare Pages Function
 *
 * Dedicated R2 image API.
 *
 * Route:
 *   GET  /api/r2-image?key=<object-key>
 *   POST /api/r2-image
 *
 * This file intentionally does NOT use D1, /api/state, LocalStorage,
 * or any frontend image/storage logic.
 *
 * R2 binding:
 *   env.R2_IMAGES
 *
 * Upload authorization secret:
 *   env.R2_UPLOAD_TOKEN
 *
 * POST expects:
 *   Authorization: Bearer <R2_UPLOAD_TOKEN>
 *   Content-Type: multipart/form-data
 *
 * Multipart fields:
 *   file = image file
 *   key  = optional object key
 *
 * Existing Base64 images are not read, migrated, replaced, or deleted.
 * Existing R2 objects are not overwritten.
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
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  const maxLength = Math.max(aBytes.length, bBytes.length);
  let difference = aBytes.length ^ bBytes.length;

  for (let i = 0; i < maxLength; i += 1) {
    const aByte = i < aBytes.length ? aBytes[i] : 0;
    const bByte = i < bBytes.length ? bBytes[i] : 0;
    difference |= aByte ^ bByte;
  }

  return difference === 0;
}

function authorizeUpload(env, request) {
  const configuredToken = env?.R2_UPLOAD_TOKEN;

  if (
    typeof configuredToken !== "string" ||
    configuredToken.length === 0
  ) {
    return {
      ok: false,
      response: json(
        { error: "Image upload is not configured." },
        503
      ),
    };
  }

  const authorization = request.headers.get("Authorization");

  if (
    typeof authorization !== "string" ||
    !authorization.startsWith("Bearer ")
  ) {
    return {
      ok: false,
      response: json({ error: "Unauthorized." }, 401, {
        "WWW-Authenticate": "Bearer",
      }),
    };
  }

  const suppliedToken = authorization.slice("Bearer ".length);

  if (
    suppliedToken.length === 0 ||
    !constantTimeEqual(suppliedToken, configuredToken)
  ) {
    return {
      ok: false,
      response: json({ error: "Unauthorized." }, 401, {
        "WWW-Authenticate": "Bearer",
      }),
    };
  }

  return { ok: true };
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
    return {
      ok: false,
      error: "Image key contains an invalid character.",
    };
  }

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

  if (!key.startsWith("images/")) {
    return {
      ok: false,
      error: 'Image key must start with "images/".',
    };
  }

  if (!/^images\/[A-Za-z0-9._/-]+$/.test(key)) {
    return {
      ok: false,
      error: "Image key contains unsupported characters.",
    };
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

  if (!result.ok) {
    return result;
  }

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
    typeof contentType === "string"
      ? contentType.toLowerCase()
      : ""
  );
}

function isValidImageMagicBytes(bytes, contentType) {
  if (!bytes || bytes.length < 12) {
    return false;
  }

  const b = bytes;

  if (contentType === "image/jpeg") {
    return (
      b[0] === 0xff &&
      b[1] === 0xd8 &&
      b[2] === 0xff
    );
  }

  if (contentType === "image/png") {
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

function contentDispositionFilename(key) {
  const name = key.split("/").pop() || "image";
  return name.replace(/["\\\r\n]/g, "_");
}

async function handleGet({ env, request }) {
  if (!env?.R2_IMAGES) {
    return json(
      { error: "R2 binding R2_IMAGES is not configured." },
      500
    );
  }

  const url = new URL(request.url);
  const validation = sanitizeKey(
    url.searchParams.get("key")
  );

  if (!validation.ok) {
    return json({ error: validation.error }, 400);
  }

  try {
    const object = await env.R2_IMAGES.get(
      validation.key
    );

    if (!object) {
      return json({ error: "Image not found." }, 404);
    }

    const headers = new Headers();

    object.writeHttpMetadata(headers);

    headers.set("ETag", object.httpEtag);
    headers.set(
      "Cache-Control",
      "private, max-age=3600"
    );
    headers.set(
      "Content-Disposition",
      `inline; filename="${contentDispositionFilename(
        validation.key
      )}"`
    );

    return new Response(object.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error(
      "GET /api/r2-image failed:",
      error
    );

    return json(
      { error: "R2 image read failed." },
      500
    );
  }
}

async function handlePost({ env, request }) {
  if (!env?.R2_IMAGES) {
    return json(
      { error: "R2 binding R2_IMAGES is not configured." },
      500
    );
  }

  const authorization = authorizeUpload(
    env,
    request
  );

  if (!authorization.ok) {
    return authorization.response;
  }

  const contentTypeHeader =
    request.headers.get("Content-Type") || "";

  if (
    !contentTypeHeader
      .toLowerCase()
      .startsWith("multipart/form-data")
  ) {
    return json(
      { error: "Upload must use multipart/form-data." },
      415
    );
  }

  let form;

  try {
    form = await request.formData();
  } catch {
    return json(
      { error: "Invalid multipart/form-data request." },
      400
    );
  }

  const file = form.get("file");

  if (!(file instanceof File)) {
    return json(
      { error: 'Multipart field "file" is required.' },
      400
    );
  }

  if (file.size <= 0) {
    return json(
      { error: "Image file is empty." },
      400
    );
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return json(
      {
        error:
          "Image file is too large. Maximum size is 10 MB.",
      },
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

  const keyValidation = validateUploadKey(
    typeof requestedKey === "string"
      ? requestedKey
      : null,
    imageType
  );

  if (!keyValidation.ok) {
    return json(
      { error: keyValidation.error },
      400
    );
  }

  const body = await file.arrayBuffer();
  const bytes = new Uint8Array(body);

  if (!isValidImageMagicBytes(bytes, imageType)) {
    return json(
      {
        error:
          "File contents do not match the declared image type.",
      },
      415
    );
  }

  try {
    const existing = await env.R2_IMAGES.head(
      keyValidation.key
    );

    if (existing) {
      return json(
        {
          error:
            "An image already exists with this key.",
        },
        409
      );
    }

    const result = await env.R2_IMAGES.put(
      keyValidation.key,
      body,
      {
        onlyIf: {
          etagDoesNotMatch: "*",
        },
        httpMetadata: {
          contentType: imageType,
          contentDisposition:
            `inline; filename="${contentDispositionFilename(
              keyValidation.key
            )}"`,
        },
      }
    );

    if (!result) {
      return json(
        {
          error:
            "An image already exists with this key.",
        },
        409
      );
    }

    return json(
      {
        ok: true,
        key: keyValidation.key,
        contentType: imageType,
        size: file.size,
      },
      201
    );
  } catch (error) {
    console.error(
      "POST /api/r2-image failed:",
      error
    );

    return json(
      { error: "R2 image upload failed." },
      500
    );
  }
}

export async function onRequest(context) {
  const method =
    context.request.method.toUpperCase();

  const originValidation = validateOrigin(
    context.request
  );

  if (!originValidation.ok) {
    return originValidation.response;
  }

  if (method === "GET") {
    return handleGet(context);
  }

  if (method === "POST") {
    return handlePost(context);
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: {
      Allow: "GET, POST",
      "Cache-Control": "no-store",
    },
  });
}
