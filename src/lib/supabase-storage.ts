import { supabase } from './supabase';

// Supabase Storage configuration
const STORAGE_BUCKET = 'images';
const USE_SIGNED_URLS = ((import.meta as any)?.env?.VITE_SUPABASE_STORAGE_SIGNED ?? 'false') === 'true';
const PUBLIC_BASE_URL = supabase ? `${supabase.supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}` : '';
const SIGNED_BASE_URL = supabase ? `${supabase.supabaseUrl}/storage/v1/object/sign/${STORAGE_BUCKET}` : '';

// simple in-memory cache for signed URLs
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

// Image upload utility
export class SupabaseImageStorage {
  // Upload image to Supabase Storage
  static async uploadImage(file: File, folder: string = 'general'): Promise<{ url: string; path: string } | null> {
    if (!supabase) {
      console.warn('Supabase not configured - cannot upload image');
      return null;
    }

    try {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExtension}`;
      const filePath = `${folder}/${fileName}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Image upload error:', error);
        return null;
      }

      // Return public URL and path
      const publicUrl = `${PUBLIC_BASE_URL}/${filePath}`;
      return {
        url: publicUrl,
        path: filePath
      };

    } catch (error) {
      console.error('Image upload failed:', error);
      return null;
    }
  }

  // Get public URL for stored image
  static getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path; // Already a full URL
    return `${PUBLIC_BASE_URL}/${path}`;
  }

  // Get signed URL for private buckets
  static async getSignedImageUrl(path: string, expiresInSec: number = 60 * 60): Promise<string | null> {
    if (!supabase || !path) return null;
    // cache hit and not expired
    const cached = signedUrlCache.get(path);
    const now = Date.now();
    if (cached && cached.expiresAt > now + 10_000) { // 10s safety window
      return cached.url;
    }
    try {
      const { data, error } = await supabase.storage.from(STORAGE_BUCKET).createSignedUrl(path, expiresInSec);
      if (error || !data?.signedUrl) return null;
      // Note: supabase returns a full URL already
      const url = data.signedUrl;
      signedUrlCache.set(path, { url, expiresAt: now + expiresInSec * 1000 });
      return url;
    } catch {
      return null;
    }
  }

  // Delete image from storage
  static async deleteImage(path: string): Promise<boolean> {
    if (!supabase || !path) return false;

    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([path]);

      if (error) {
        console.error('Image deletion error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Image deletion failed:', error);
      return false;
    }
  }

  // Upload multiple images
  static async uploadMultipleImages(files: File[], folder: string = 'general'): Promise<Array<{ url: string; path: string }>> {
    const uploadPromises = files.map(file => this.uploadImage(file, folder));
    const results = await Promise.all(uploadPromises);
    return results.filter(result => result !== null) as Array<{ url: string; path: string }>;
  }

  // Validate image file
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'ファイルサイズが大きすぎます（最大10MB）' };
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'サポートされていないファイル形式です（JPEG, PNG, WebP, GIF のみ）' };
    }

    return { valid: true };
  }
}

// Image folders for organization
export const IMAGE_FOLDERS = {
  ORIGINALS: 'originals',
  GENERATED: 'generated', 
  THUMBNAILS: 'thumbnails',
  PROFILES: 'profiles',
  GALLERY: 'gallery',
  EXAMPLES: 'examples'
} as const;

// Default fallback images
export const FALLBACK_IMAGES = {
  ERROR: '/images/error-placeholder.png',
  LOADING: '/images/loading-placeholder.png',
  NO_IMAGE: '/images/no-image-placeholder.png'
} as const;

// Helper function to get optimized image URL with transformations
export function getOptimizedImageUrl(path: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
}): string {
  if (!path) return '';
  
  const baseUrl = SupabaseImageStorage.getImageUrl(path);
  
  // If Supabase is not configured, return as-is
  if (!supabase) return baseUrl;
  
  // Add image transformation parameters if needed
  if (options && Object.keys(options).length > 0) {
    const params = new URLSearchParams();
    
    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.quality) params.append('quality', options.quality.toString());
    if (options.format) params.append('format', options.format);
    
    return `${baseUrl}?${params.toString()}`;
  }
  
  return baseUrl;
}

// Export singleton instance
export const imageStorage = SupabaseImageStorage;
export { STORAGE_BUCKET, USE_SIGNED_URLS };
