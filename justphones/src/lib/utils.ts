import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function unslugify(slug: string): string {
  if (!slug) return '';
  const capitalized = slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  return capitalized.replace(/^Iphone/, 'iPhone');
}

export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '');
}

export function expandModelString(modelStr: string): string[] {
  const parts = modelStr.split('/').map(s => s.trim());
  if (parts.length <= 1) {
    return parts;
  }
  
  const result: string[] = [];
  let baseName = '';
  
  const firstPartWords = parts[0].split(' ');
  
  if (firstPartWords.length > 1) {
    baseName = firstPartWords.slice(0, -1).join(' ');
  }

  for (const part of parts) {
    if (part.toLowerCase().startsWith(baseName.toLowerCase()) || baseName === '') {
      result.push(part);
      const currentPartWords = part.split(' ');
      if (currentPartWords.length > 1) {
         baseName = currentPartWords.slice(0, -1).join(' ');
      }
    } else {
      result.push(`${baseName} ${part}`);
    }
  }
  
  return result;
}
