/**
 * Print Export Service
 * 
 * Handles print export functionality with multiple sizes and DPI options
 * Generates high-quality print-ready files from user memories
 */

import sharp from 'sharp';
import { supabaseService, supabaseStorage } from '../config/supabase.mjs';
import path from 'path';
import { promises as fs } from 'fs';

export class PrintExportService {
  constructor() {
    this.printSizes = {
      'yotsu-giri': { width: 254, height: 305, name: '四つ切り' }, // 10" x 12"
      'a4': { width: 210, height: 297, name: 'A4' },
      'l-size': { width: 89, height: 127, name: 'L判' },
      'small-cabinet': { width: 102, height: 146, name: '小キャビネ' },
      '2l': { width: 127, height: 178, name: '2L' }
    };

    this.dpiOptions = {
      300: 300, // Standard print quality
      350: 350  // Premium print quality
    };

    this.supportedFormats = ['jpeg', 'png', 'tiff'];
    this.maxProcessingSize = 50 * 1024 * 1024; // 50MB limit
  }

  /**
   * Generate print export for memory
   */
  async generatePrintExport(deviceId, memoryId, exportOptions) {
    try {
      const {
        printSize,
        dpi = 300,
        format = 'jpeg',
        quality = 95,
        colorProfile = 'srgb'
      } = exportOptions;

      // Validate print size
      if (!this.printSizes[printSize]) {
        throw new Error(`Invalid print size: ${printSize}`);
      }

      // Validate DPI
      if (!this.dpiOptions[dpi]) {
        throw new Error(`Invalid DPI: ${dpi}. Supported: ${Object.keys(this.dpiOptions).join(', ')}`);
      }

      // Validate format
      if (!this.supportedFormats.includes(format.toLowerCase())) {
        throw new Error(`Invalid format: ${format}. Supported: ${this.supportedFormats.join(', ')}`);
      }

      // Get memory and verify ownership
      const { data: memory, error: memoryError } = await supabaseService
        .from('memories')
        .select(`
          *,
          vault:vaults(device_id)
        `)
        .eq('id', memoryId)
        .single();

      if (memoryError || !memory) {
        throw new Error('Memory not found');
      }

      if (memory.vault.device_id !== deviceId) {
        throw new Error('Access denied to memory');
      }

      // Get subscription info to check export limits
      const subscription = await this.getSubscriptionInfo(deviceId);
      if (!this.canExportFormat(subscription, format, dpi)) {
        throw new Error('Export format not available with current subscription');
      }

      // Download original image
      const originalImageBuffer = await this.downloadMemoryFile(memory.file_path);
      
      // Process image for print
      const processedImage = await this.processImageForPrint(
        originalImageBuffer,
        printSize,
        dpi,
        format,
        quality,
        colorProfile
      );

      // Generate filename
      const filename = this.generatePrintFilename(memory, printSize, dpi, format);

      // Upload processed image to storage
      const exportPath = `print-exports/${deviceId}/${filename}`;
      const { data: uploadData, error: uploadError } = await supabaseStorage
        .from('vault-storage')
        .upload(exportPath, processedImage, {
          contentType: this.getContentType(format),
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Record export in database
      const exportRecord = await this.recordExport(
        deviceId,
        memoryId,
        exportPath,
        printSize,
        dpi,
        format,
        processedImage.length
      );

      // Get download URL
      const { data: urlData } = await supabaseStorage
        .from('vault-storage')
        .createSignedUrl(exportPath, 3600); // 1 hour expiry

      return {
        exportId: exportRecord.id,
        downloadUrl: urlData.signedUrl,
        filename: filename,
        fileSize: processedImage.length,
        printSize: this.printSizes[printSize],
        dpi: dpi,
        format: format,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
      };
    } catch (error) {
      console.error('❌ Generate print export error:', error);
      throw error;
    }
  }

  /**
   * Process image for print with specific requirements
   */
  async processImageForPrint(imageBuffer, printSize, dpi, format, quality, colorProfile) {
    try {
      const sizeSpec = this.printSizes[printSize];
      
      // Calculate pixel dimensions based on size and DPI
      const pixelWidth = Math.round((sizeSpec.width / 25.4) * dpi); // Convert mm to inches to pixels
      const pixelHeight = Math.round((sizeSpec.height / 25.4) * dpi);

      let sharpInstance = sharp(imageBuffer)
        .resize(pixelWidth, pixelHeight, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .density(dpi);

      // Apply color profile
      if (colorProfile === 'adobe-rgb') {
        // Note: This would require Adobe RGB ICC profile file
        // For now, we'll use sRGB as default
        sharpInstance = sharpInstance.toColorspace('srgb');
      } else {
        sharpInstance = sharpInstance.toColorspace('srgb');
      }

      // Set format-specific options
      switch (format.toLowerCase()) {
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({
            quality: quality,
            progressive: true,
            mozjpeg: true
          });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({
            quality: quality,
            compressionLevel: 6,
            progressive: true
          });
          break;
        case 'tiff':
          sharpInstance = sharpInstance.tiff({
            quality: quality,
            compression: 'lzw'
          });
          break;
      }

      const processedBuffer = await sharpInstance.toBuffer();
      
      return processedBuffer;
    } catch (error) {
      console.error('❌ Process image for print error:', error);
      throw error;
    }
  }

  /**
   * Download memory file from storage
   */
  async downloadMemoryFile(filePath) {
    try {
      const { data, error } = await supabaseStorage
        .from('vault-storage')
        .download(filePath);

      if (error) throw error;

      return Buffer.from(await data.arrayBuffer());
    } catch (error) {
      console.error('❌ Download memory file error:', error);
      throw error;
    }
  }

  /**
   * Record export in database
   */
  async recordExport(deviceId, memoryId, exportPath, printSize, dpi, format, fileSize) {
    try {
      const exportData = {
        device_id: deviceId,
        memory_id: memoryId,
        export_path: exportPath,
        print_size: printSize,
        dpi: dpi,
        format: format,
        file_size: fileSize,
        status: 'completed',
        created_at: new Date(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      const { data: exportRecord, error } = await supabaseService
        .from('print_exports')
        .insert(exportData)
        .select('*')
        .single();

      if (error) throw error;

      return exportRecord;
    } catch (error) {
      console.error('❌ Record export error:', error);
      throw error;
    }
  }

  /**
   * Get user's export history
   */
  async getExportHistory(deviceId, limit = 20) {
    try {
      const { data: exports, error } = await supabaseService
        .from('print_exports')
        .select(`
          *,
          memory:memories(
            id,
            title,
            memory_type,
            created_at
          )
        `)
        .eq('device_id', deviceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Filter out expired exports
      const activeExports = exports?.filter(exp => {
        return !exp.expires_at || new Date(exp.expires_at) > new Date();
      }) || [];

      return activeExports;
    } catch (error) {
      console.error('❌ Get export history error:', error);
      throw error;
    }
  }

  /**
   * Delete expired exports (background job)
   */
  async cleanupExpiredExports() {
    try {
      const now = new Date();

      // Get expired exports
      const { data: expiredExports, error: selectError } = await supabaseService
        .from('print_exports')
        .select('export_path')
        .lt('expires_at', now.toISOString());

      if (selectError) throw selectError;

      if (!expiredExports || expiredExports.length === 0) {
        return { cleaned: 0 };
      }

      // Delete files from storage
      const deletionPromises = expiredExports.map(exp => 
        supabaseStorage
          .from('vault-storage')
          .remove([exp.export_path])
      );

      await Promise.allSettled(deletionPromises);

      // Delete database records
      const { error: deleteError } = await supabaseService
        .from('print_exports')
        .delete()
        .lt('expires_at', now.toISOString());

      if (deleteError) throw deleteError;

      return { cleaned: expiredExports.length };
    } catch (error) {
      console.error('❌ Cleanup expired exports error:', error);
      throw error;
    }
  }

  /**
   * Get available print options for subscription
   */
  async getPrintOptions(deviceId) {
    try {
      const subscription = await this.getSubscriptionInfo(deviceId);
      
      const availableOptions = {
        sizes: [],
        dpiOptions: [],
        formats: [],
        maxExportsPerMonth: 0,
        currentMonthUsage: 0
      };

      // Get current month usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: monthlyUsage, error: usageError } = await supabaseService
        .from('print_exports')
        .select('*', { count: 'exact', head: true })
        .eq('device_id', deviceId)
        .gte('created_at', startOfMonth.toISOString());

      if (!usageError) {
        availableOptions.currentMonthUsage = monthlyUsage || 0;
      }

      // Set options based on subscription tier
      switch (subscription?.tier?.name) {
        case 'pro':
          availableOptions.sizes = Object.keys(this.printSizes);
          availableOptions.dpiOptions = Object.keys(this.dpiOptions);
          availableOptions.formats = this.supportedFormats;
          availableOptions.maxExportsPerMonth = 100;
          break;
        case 'standard':
          availableOptions.sizes = ['l-size', 'small-cabinet', '2l', 'a4'];
          availableOptions.dpiOptions = ['300', '350'];
          availableOptions.formats = ['jpeg', 'png'];
          availableOptions.maxExportsPerMonth = 20;
          break;
        case 'lite':
          availableOptions.sizes = ['l-size', '2l'];
          availableOptions.dpiOptions = ['300'];
          availableOptions.formats = ['jpeg'];
          availableOptions.maxExportsPerMonth = 5;
          break;
        default: // free tier
          availableOptions.sizes = ['l-size'];
          availableOptions.dpiOptions = ['300'];
          availableOptions.formats = ['jpeg'];
          availableOptions.maxExportsPerMonth = 2;
      }

      // Add size details
      availableOptions.sizeDetails = {};
      availableOptions.sizes.forEach(size => {
        availableOptions.sizeDetails[size] = this.printSizes[size];
      });

      return availableOptions;
    } catch (error) {
      console.error('❌ Get print options error:', error);
      throw error;
    }
  }

  /**
   * Check if user can export in specific format/DPI
   */
  canExportFormat(subscription, format, dpi) {
    const tierName = subscription?.tier?.name || 'free';
    
    switch (tierName) {
      case 'pro':
        return true; // All formats and DPI
      case 'standard':
        return ['jpeg', 'png'].includes(format) && [300, 350].includes(dpi);
      case 'lite':
        return format === 'jpeg' && dpi === 300;
      default:
        return format === 'jpeg' && dpi === 300;
    }
  }

  /**
   * Generate print filename
   */
  generatePrintFilename(memory, printSize, dpi, format) {
    const timestamp = new Date().toISOString().slice(0, 10);
    const memoryTitle = memory.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'memory';
    const sizeSpec = this.printSizes[printSize];
    
    return `${memoryTitle}_${sizeSpec.name}_${dpi}dpi_${timestamp}.${format}`;
  }

  /**
   * Get content type for format
   */
  getContentType(format) {
    const contentTypes = {
      jpeg: 'image/jpeg',
      png: 'image/png',
      tiff: 'image/tiff'
    };
    
    return contentTypes[format.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Get subscription info for user
   */
  async getSubscriptionInfo(deviceId) {
    try {
      const { data: subscription, error } = await supabaseService
        .from('subscriptions')
        .select(`
          *,
          tier:subscription_tiers(*)
        `)
        .eq('device_id', deviceId)
        .in('status', ['active', 'trial', 'in_grace'])
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return subscription;
    } catch (error) {
      console.error('❌ Get subscription info error:', error);
      return null; // Return null for free tier
    }
  }

  /**
   * Get print export statistics
   */
  async getExportStatistics() {
    try {
      // Exports by format
      const { data: formatStats, error: formatError } = await supabaseService
        .from('print_exports')
        .select('format')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (formatError) throw formatError;

      const statsByFormat = {};
      formatStats?.forEach(exp => {
        statsByFormat[exp.format] = (statsByFormat[exp.format] || 0) + 1;
      });

      // Exports by size
      const { data: sizeStats, error: sizeError } = await supabaseService
        .from('print_exports')
        .select('print_size')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (sizeError) throw sizeError;

      const statsBySize = {};
      sizeStats?.forEach(exp => {
        statsBySize[exp.print_size] = (statsBySize[exp.print_size] || 0) + 1;
      });

      // Total file size
      const { data: sizeData, error: sizeDataError } = await supabaseService
        .from('print_exports')
        .select('file_size')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (sizeDataError) throw sizeDataError;

      const totalFileSize = sizeData?.reduce((sum, exp) => sum + (exp.file_size || 0), 0) || 0;

      return {
        last30Days: {
          total: formatStats?.length || 0,
          byFormat: statsByFormat,
          bySize: statsBySize,
          totalFileSize: totalFileSize
        },
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Get export statistics error:', error);
      throw error;
    }
  }
}

export default PrintExportService;