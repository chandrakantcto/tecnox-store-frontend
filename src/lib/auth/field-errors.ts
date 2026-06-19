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

/** Returns all validation errors. Auth flows only. */
export function allFieldErrors<K extends string>(
  checks: ReadonlyArray<{ field: K; message: string | null | undefined }>,
): Partial<Record<K, string>> {
  const errors: Partial<Record<K, string>> = {};
  for (const check of checks) {
    if (check.message && !errors[check.field]) {
      errors[check.field] = check.message;
    }
  }
  return errors;
}

