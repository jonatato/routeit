import DOMPurify from 'dompurify';

export const sanitizeHtml = (value: string) =>
  DOMPurify.sanitize(value, {
    USE_PROFILES: { html: true },
  });
