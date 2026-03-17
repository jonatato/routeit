const BASE64_DATA_URL_REGEX = /^data:([^;]+);base64,(.*)$/i;
const HTTP_URL_REGEX = /^https?:\/\//i;

export const SUPPORTED_DOCUMENT_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'] as const;
export const SUPPORTED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

const MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const normalizeMimeType = (mimeType: string | null | undefined) => mimeType?.split(';')[0]?.trim().toLowerCase() ?? '';

export const isBase64Document = (value: string) => /^data:[^;]+;base64,/i.test(value);

export const isRemoteDocumentUrl = (value: string) => HTTP_URL_REGEX.test(value.trim());

export const parseBase64DataUrl = (value: string) => {
  const match = value.match(BASE64_DATA_URL_REGEX);
  if (!match) return null;

  return {
    mimeType: normalizeMimeType(match[1]),
    data: match[2],
  };
};

export const extractDataUrlMimeType = (value: string) => normalizeMimeType(value.match(BASE64_DATA_URL_REGEX)?.[1]);

export const detectExtensionFromUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const parsed = new URL(trimmed, window.location.origin);
    const fileName = parsed.pathname.split('/').pop() ?? '';
    const extension = fileName.includes('.') ? fileName.split('.').pop() : '';
    return extension?.toLowerCase() ?? '';
  } catch {
    const sanitized = trimmed.split('?')[0]?.split('#')[0] ?? trimmed;
    const fileName = sanitized.split('/').pop() ?? sanitized;
    const extension = fileName.includes('.') ? fileName.split('.').pop() : '';
    return extension?.toLowerCase() ?? '';
  }
};

export const inferMimeTypeFromUrl = (value: string) => MIME_TYPE_BY_EXTENSION[detectExtensionFromUrl(value)] ?? '';

export const base64ToBlob = (base64: string, mimeType: string) => {
  const binary = window.atob(base64);
  const length = binary.length;
  const bytes = new Uint8Array(length);

  for (let index = 0; index < length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
};

export const isPdfMimeType = (mimeType: string) => normalizeMimeType(mimeType) === 'application/pdf';

export const isImageMimeType = (mimeType: string) => normalizeMimeType(mimeType).startsWith('image/');

export const isSupportedDocumentMimeType = (mimeType: string) =>
  SUPPORTED_DOCUMENT_MIME_TYPES.includes(normalizeMimeType(mimeType) as (typeof SUPPORTED_DOCUMENT_MIME_TYPES)[number]);

export const isAllowedDocumentValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;

  if (isBase64Document(trimmed)) {
    return isSupportedDocumentMimeType(extractDataUrlMimeType(trimmed));
  }

  return Boolean(inferMimeTypeFromUrl(trimmed)) || isRemoteDocumentUrl(trimmed);
};

export const detectRemoteMimeType = async (value: string, signal?: AbortSignal) => {
  const inferredMimeType = inferMimeTypeFromUrl(value);
  if (inferredMimeType) {
    return inferredMimeType;
  }

  if (!isRemoteDocumentUrl(value)) {
    return '';
  }

  try {
    const response = await fetch(value, {
      method: 'HEAD',
      signal,
    });

    const contentType = normalizeMimeType(response.headers.get('content-type'));
    if (contentType) {
      return contentType;
    }

    return inferMimeTypeFromUrl(response.url);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    return '';
  }
};