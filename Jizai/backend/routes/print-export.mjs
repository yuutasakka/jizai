// Print Export API Routes
// Handles memory export to various print formats with multiple DPI options
import express from 'express';
import { supabase } from '../config/supabase.mjs';
import { PrintExportService } from '../services/print-export-service.mjs';
import { StorageQuotaService } from '../services/storage-quota-service.mjs';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const printExportService = new PrintExportService();
const storageQuotaService = new StorageQuotaService();

// Rate limiting for export requests (resource intensive)
const exportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 exports per hour
    message: {
        error: 'Too Many Requests',
        message: 'Export rate limit exceeded. Please try again later.',
        code: 'EXPORT_RATE_LIMIT_EXCEEDED'
    },
    keyGenerator: (req) => {
        return req.headers['x-device-id'] || req.ip;
    }
});

// ========================================
// PRINT EXPORT CREATION
// ========================================

/**
 * POST /v1/print-export/create
 * Create new print export job
 */
router.post('/create', exportLimiter, async (req, res) => {
    try {
        const {
            deviceId,
            vaultId,
            exportType,
            memoryIds,
            settings = {}
        } = req.body;

        // Validation
        if (!deviceId || !vaultId || !exportType || !memoryIds?.length) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId, vaultId, exportType, and memoryIds are required',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }

        // Validate export type
        const validExportTypes = ['photo_book', 'calendar', 'poster', 'cards'];
        if (!validExportTypes.includes(exportType)) {
            return res.status(400).json({
                error: 'Bad Request',
                message: `Invalid export type. Must be one of: ${validExportTypes.join(', ')}`,
                code: 'INVALID_EXPORT_TYPE'
            });
        }

        // Check subscription permissions
        const hasPermission = await printExportService.checkPrintExportPermission(deviceId, exportType);
        if (!hasPermission.allowed) {
            return res.status(403).json({
                error: 'Forbidden',
                message: hasPermission.reason,
                code: 'PRINT_EXPORT_NOT_ALLOWED'
            });
        }

        // Validate memory access
        const memoryAccess = await printExportService.validateMemoryAccess(deviceId, vaultId, memoryIds);
        if (!memoryAccess.allowed) {
            return res.status(403).json({
                error: 'Forbidden',
                message: memoryAccess.reason,
                code: 'MEMORY_ACCESS_DENIED'
            });
        }

        // Create export job
        const exportJob = await printExportService.createExportJob({
            deviceId,
            vaultId,
            exportType,
            memoryIds,
            settings: {
                pageSize: settings.pageSize || 'A4',
                dpi: settings.dpi || 300,
                colorMode: settings.colorMode || 'color',
                layoutTemplate: settings.layoutTemplate,
                ...settings
            }
        });

        res.json({
            success: true,
            exportJob: {
                id: exportJob.id,
                exportType: exportJob.export_type,
                status: exportJob.status,
                settings: exportJob.settings,
                memoryCount: memoryIds.length,
                estimatedSize: exportJob.estimated_size,
                expiresAt: exportJob.expires_at,
                createdAt: exportJob.created_at
            }
        });

    } catch (error) {
        console.error('❌ Create print export error:', error);
        
        if (error.code === 'MEMORIES_NOT_FOUND') {
            return res.status(404).json({
                error: 'Not Found',
                message: 'One or more memories not found',
                code: 'MEMORIES_NOT_FOUND'
            });
        }

        if (error.code === 'EXPORT_LIMIT_EXCEEDED') {
            return res.status(429).json({
                error: 'Too Many Requests',
                message: 'Export limit exceeded for your subscription tier',
                code: 'EXPORT_LIMIT_EXCEEDED'
            });
        }

        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to create print export',
            code: 'PRINT_EXPORT_CREATE_FAILED'
        });
    }
});

// ========================================
// EXPORT STATUS & MANAGEMENT
// ========================================

/**
 * GET /v1/print-export/:exportId/status
 * Get export job status and progress
 */
router.get('/:exportId/status', async (req, res) => {
    try {
        const { exportId } = req.params;
        const { deviceId } = req.query;

        if (!deviceId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId query parameter is required',
                code: 'MISSING_DEVICE_ID'
            });
        }

        const exportStatus = await printExportService.getExportStatus(exportId, deviceId);

        if (!exportStatus) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Export job not found or access denied',
                code: 'EXPORT_NOT_FOUND'
            });
        }

        res.json({
            exportJob: {
                id: exportStatus.id,
                exportType: exportStatus.export_type,
                status: exportStatus.status,
                progress: exportStatus.progress || 0,
                settings: exportStatus.settings,
                memoryCount: exportStatus.memory_count,
                exportUrl: exportStatus.export_url,
                exportSize: exportStatus.export_size,
                expiresAt: exportStatus.expires_at,
                createdAt: exportStatus.created_at,
                completedAt: exportStatus.completed_at,
                errorMessage: exportStatus.error_message
            }
        });

    } catch (error) {
        console.error('❌ Get export status error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve export status',
            code: 'EXPORT_STATUS_FAILED'
        });
    }
});

/**
 * GET /v1/print-export/my-exports
 * Get user's export history
 */
router.get('/my-exports', async (req, res) => {
    try {
        const { deviceId, limit = 20, offset = 0, status } = req.query;

        if (!deviceId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId query parameter is required',
                code: 'MISSING_DEVICE_ID'
            });
        }

        const exports = await printExportService.getUserExports(deviceId, {
            limit: parseInt(limit),
            offset: parseInt(offset),
            status
        });

        res.json({
            exports: exports.data.map(exp => ({
                id: exp.id,
                exportType: exp.export_type,
                status: exp.status,
                memoryCount: exp.memory_count,
                settings: exp.settings,
                exportSize: exp.export_size,
                expiresAt: exp.expires_at,
                createdAt: exp.created_at,
                completedAt: exp.completed_at,
                vaultInfo: {
                    id: exp.vault_id,
                    name: exp.vault_name
                }
            })),
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: exports.total,
                hasMore: (parseInt(offset) + parseInt(limit)) < exports.total
            }
        });

    } catch (error) {
        console.error('❌ Get user exports error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve export history',
            code: 'EXPORT_HISTORY_FAILED'
        });
    }
});

/**
 * POST /v1/print-export/:exportId/download
 * Generate secure download URL for completed export
 */
router.post('/:exportId/download', async (req, res) => {
    try {
        const { exportId } = req.params;
        const { deviceId } = req.body;

        if (!deviceId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId is required',
                code: 'MISSING_DEVICE_ID'
            });
        }

        const downloadInfo = await printExportService.generateDownloadUrl(exportId, deviceId);

        res.json({
            success: true,
            download: {
                url: downloadInfo.downloadUrl,
                filename: downloadInfo.filename,
                fileSize: downloadInfo.fileSize,
                expiresAt: downloadInfo.expiresAt,
                downloadCount: downloadInfo.downloadCount,
                maxDownloads: downloadInfo.maxDownloads
            }
        });

    } catch (error) {
        console.error('❌ Generate download URL error:', error);
        
        if (error.code === 'EXPORT_NOT_COMPLETED') {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Export is not yet completed',
                code: 'EXPORT_NOT_COMPLETED'
            });
        }

        if (error.code === 'EXPORT_EXPIRED') {
            return res.status(410).json({
                error: 'Gone',
                message: 'Export has expired and is no longer available',
                code: 'EXPORT_EXPIRED'
            });
        }

        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to generate download URL',
            code: 'DOWNLOAD_URL_FAILED'
        });
    }
});

/**
 * DELETE /v1/print-export/:exportId
 * Cancel or delete export job
 */
router.delete('/:exportId', async (req, res) => {
    try {
        const { exportId } = req.params;
        // Some clients/proxies drop DELETE bodies; accept query/header as well
        const deviceId = (req.body && req.body.deviceId) || req.query.deviceId || req.headers['x-device-id'];

        if (!deviceId) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId is required',
                code: 'MISSING_DEVICE_ID'
            });
        }

        await printExportService.cancelExport(exportId, deviceId);

        res.json({
            success: true,
            message: 'Export job cancelled successfully'
        });

    } catch (error) {
        console.error('❌ Cancel export error:', error);
        
        if (error.code === 'EXPORT_NOT_FOUND') {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Export job not found',
                code: 'EXPORT_NOT_FOUND'
            });
        }

        if (error.code === 'CANNOT_CANCEL') {
            return res.status(409).json({
                error: 'Conflict',
                message: 'Export cannot be cancelled in current state',
                code: 'CANNOT_CANCEL'
            });
        }

        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to cancel export',
            code: 'EXPORT_CANCEL_FAILED'
        });
    }
});

// ========================================
// EXPORT TEMPLATES & OPTIONS
// ========================================

/**
 * GET /v1/print-export/templates
 * Get available export templates and options
 */
router.get('/templates', async (req, res) => {
    try {
        const { exportType } = req.query;

        const templates = await printExportService.getExportTemplates(exportType);

        res.json({
            templates: templates.map(template => ({
                id: template.id,
                name: template.name,
                description: template.description,
                exportType: template.export_type,
                previewUrl: template.preview_url,
                settings: template.default_settings,
                supportedSizes: template.supported_sizes,
                supportedDpi: template.supported_dpi
            }))
        });

    } catch (error) {
        console.error('❌ Get export templates error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve export templates',
            code: 'TEMPLATES_FAILED'
        });
    }
});

/**
 * GET /v1/print-export/options
 * Get available print options (sizes, DPI, etc.)
 */
router.get('/options', async (req, res) => {
    try {
        const printOptions = await printExportService.getPrintOptions();

        res.json({
            options: {
                pageSizes: [
                    { id: 'A4', name: 'A4 (210×297mm)', width: 2480, height: 3508 },
                    { id: 'Letter', name: 'Letter (8.5×11")', width: 2550, height: 3300 },
                    { id: '4x6', name: '4×6 inch', width: 1200, height: 1800 },
                    { id: '5x7', name: '5×7 inch', width: 1500, height: 2100 },
                    { id: '8x10', name: '8×10 inch', width: 2400, height: 3000 },
                    { id: '11x14', name: '11×14 inch', width: 3300, height: 4200 },
                    { id: 'Square', name: 'Square (8×8")', width: 2400, height: 2400 }
                ],
                dpiOptions: [
                    { value: 150, name: '150 DPI (Web)', description: 'Good for digital viewing' },
                    { value: 300, name: '300 DPI (Standard Print)', description: 'Standard print quality' },
                    { value: 600, name: '600 DPI (High Quality)', description: 'High quality prints' },
                    { value: 1200, name: '1200 DPI (Professional)', description: 'Professional printing' }
                ],
                colorModes: [
                    { id: 'color', name: 'Full Color', description: 'Full color printing' },
                    { id: 'grayscale', name: 'Grayscale', description: 'Black and white with grays' },
                    { id: 'bw', name: 'Black & White', description: 'Pure black and white' }
                ],
                exportTypes: [
                    { 
                        id: 'photo_book', 
                        name: 'Photo Book', 
                        description: 'Multi-page photo book with layouts',
                        maxMemories: 100,
                        estimatedProcessingTime: '5-15 minutes'
                    },
                    { 
                        id: 'calendar', 
                        name: 'Calendar', 
                        description: 'Monthly calendar with photos',
                        maxMemories: 12,
                        estimatedProcessingTime: '3-8 minutes'
                    },
                    { 
                        id: 'poster', 
                        name: 'Poster', 
                        description: 'Large format poster or collage',
                        maxMemories: 50,
                        estimatedProcessingTime: '2-5 minutes'
                    },
                    { 
                        id: 'cards', 
                        name: 'Greeting Cards', 
                        description: 'Individual greeting cards',
                        maxMemories: 20,
                        estimatedProcessingTime: '1-3 minutes'
                    }
                ]
            }
        });

    } catch (error) {
        console.error('❌ Get print options error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve print options',
            code: 'PRINT_OPTIONS_FAILED'
        });
    }
});

// ========================================
// EXPORT PREVIEW
// ========================================

/**
 * POST /v1/print-export/preview
 * Generate preview for export configuration
 */
router.post('/preview', async (req, res) => {
    try {
        const {
            deviceId,
            vaultId,
            exportType,
            memoryIds,
            settings = {}
        } = req.body;

        // Validation
        if (!deviceId || !vaultId || !exportType || !memoryIds?.length) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'deviceId, vaultId, exportType, and memoryIds are required',
                code: 'MISSING_REQUIRED_FIELDS'
            });
        }

        // Limit preview to prevent abuse
        if (memoryIds.length > 10) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Preview limited to 10 memories maximum',
                code: 'PREVIEW_LIMIT_EXCEEDED'
            });
        }

        const preview = await printExportService.generatePreview({
            deviceId,
            vaultId,
            exportType,
            memoryIds: memoryIds.slice(0, 10), // Safety limit
            settings
        });

        res.json({
            success: true,
            preview: {
                previewUrl: preview.previewUrl,
                layoutInfo: preview.layoutInfo,
                pageCount: preview.pageCount,
                estimatedSize: preview.estimatedSize,
                expiresAt: preview.expiresAt
            }
        });

    } catch (error) {
        console.error('❌ Generate preview error:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to generate preview',
            code: 'PREVIEW_FAILED'
        });
    }
});

export default router;
