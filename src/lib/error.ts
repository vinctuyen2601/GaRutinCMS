export function getApiError(e: unknown, fallback = 'Có lỗi xảy ra, thử lại sau'): string {
  if (!e || typeof e !== 'object') return fallback;
  const err = e as Record<string, unknown>;
  const data = (err.response as Record<string, unknown> | undefined)?.data as Record<string, unknown> | undefined;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (typeof data?.error === 'string' && data.error.trim()) return data.error;
  if (typeof err.message === 'string' && err.message.trim()) return err.message;
  return fallback;
}
