import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate URL-friendly slug from title based on locale
 * @param title - Product title to slugify
 * @param locale - Locale for slug generation ("en-US" or "pt-BR")
 * @returns URL-safe slug
 */
export function generateSlug(title: string, locale: 'en-US' | 'pt-BR' = 'en-US'): string {
  if (!title) return '';
  
  let slug = title
    .toLowerCase()
    .normalize('NFD') // Normalize to decomposed form
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .trim();
  
  // Replace spaces and special characters with hyphens
  slug = slug.replace(/[^a-z0-9]+/g, '-');
  
  // Remove leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');
  
  // Add locale prefix for PT-BR content
  if (locale === 'pt-BR') {
    slug = `br-${slug}`;
  }
  
  return slug;
}
