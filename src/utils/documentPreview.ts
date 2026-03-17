const BASE64_DATA_URL_REGEX = /^data:([^;]+);base64,(.*)$/i;

export const isBase64Document = (value: string) => /^data:[^;]+;base64,/i.test(value);

export const parseBase64DataUrl = (value: string) => {
  const match = value.match(BASE64_DATA_URL_REGEX);
  if (!match) return null;

  return {
    mimeType: match[1].toLowerCase(),
    data: match[2],
  };
};

export const base64ToBlob = (base64: string, mimeType: string) => {
  const binary = window.atob(base64);
  const length = binary.length;
  const bytes = new Uint8Array(length);

  for (let index = 0; index < length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
};

export const isPdfMimeType = (mimeType: string) => mimeType.toLowerCase() === 'application/pdf';

export const isImageMimeType = (mimeType: string) => mimeType.toLowerCase().startsWith('image/');