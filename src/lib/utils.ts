import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  const merged = clsx(inputs)
  // Ensure we strictly pass a primitive string to twMerge
  // This protects against rare edge cases where clsx might return non-string types
  // or if tailwind-merge receives unexpected input
  if (typeof merged !== 'string') {
    return ''
  }
  return twMerge(merged)
}
