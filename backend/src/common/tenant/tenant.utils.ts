export function applyTenantWhere<T extends Record<string, unknown>>(
  where: T,
  pharmacyId: string,
): T & { pharmacyId: string } {
  return {
    ...where,
    pharmacyId,
  };
}
