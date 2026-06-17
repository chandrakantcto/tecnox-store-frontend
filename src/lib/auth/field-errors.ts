/** Returns only the first validation error in field order. Auth flows only. */
export function firstFieldError<K extends string>(
  checks: ReadonlyArray<{ field: K; message: string | null | undefined }>,
): Partial<Record<K, string>> {
  for (const check of checks) {
    if (check.message) {
      return { [check.field]: check.message } as Partial<Record<K, string>>;
    }
  }
  return {};
}
