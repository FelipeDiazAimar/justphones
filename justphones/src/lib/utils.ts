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
  if (!modelStr) return [];
  const parts = modelStr.split('/').map(s => s.trim());
  if (parts.length <= 1) {
    return parts;
  }
  
  const result: string[] = [];
  let baseName = '';
  
  const firstPartWords = parts[0].split(' ');
  
  // Heuristic to find the base name, e.g., "iPhone" from "iPhone 13"
  if (firstPartWords.length > 1) {
    baseName = firstPartWords.slice(0, -1).join(' ');
  } else {
    // If the first part is a single word, it could be the base name itself
    const firstWord = firstPartWords[0];
    if (isNaN(parseInt(firstWord, 10))) { // Check if it's not just a number
      baseName = firstWord;
    }
  }

  for (const part of parts) {
    // If a part already contains the base name (e.g., "iPhone 14 Pro"), use it as is.
    // Also handles the initial case where baseName might be empty.
    if (part.toLowerCase().startsWith(baseName.toLowerCase()) || baseName === '') {
      result.push(part);
      const currentPartWords = part.split(' ');
      if (currentPartWords.length > 1) {
         baseName = currentPartWords.slice(0, -1).join(' ');
      }
    } else {
      // If the part is just a suffix (e.g., "14" after "iPhone 13"), prepend the base name.
      result.push(`${baseName} ${part}`);
    }
  }
  
  return result;
}
