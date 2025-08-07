/**
 * 将小版本转换为中版本
 * 例如：15.13.1 -> 15.13
 */
export function getMajorVersion(version: string): string {
  const parts = version.split('.');
  return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : version;
}
