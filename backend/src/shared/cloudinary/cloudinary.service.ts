/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  original_filename: string;
  bytes: number;
  format: string;
  resource_type: string;
  created_at: string;
  width?: number;
  height?: number;
  folder: string;
}

export enum DropSecureUploadType {
  PROOF_PICKUP = 'proof_pickup',
  PROOF_DELIVERY = 'proof_delivery',
  USER_AVATAR = 'user_avatar',
}

export interface DropSecureUploadConfig {
  uploadType: DropSecureUploadType;
  maxSizeBytes: number;
  allowedFormats: string[];
  folder: string;
  transformations?: any;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_SECRET_KEY,
    });
    this.logger.log('Cloudinary service initialized successfully');
  }

  private getUploadConfig(
    uploadType: DropSecureUploadType,
  ): DropSecureUploadConfig {
    const configs: Record<DropSecureUploadType, DropSecureUploadConfig> = {
      [DropSecureUploadType.PROOF_PICKUP]: {
        uploadType: DropSecureUploadType.PROOF_PICKUP,
        maxSizeBytes: 5 * 1024 * 1024,
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'dropsecure/proof/pickup',
        transformations: {
          width: 800,
          height: 600,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        },
      },
      [DropSecureUploadType.PROOF_DELIVERY]: {
        uploadType: DropSecureUploadType.PROOF_DELIVERY,
        maxSizeBytes: 5 * 1024 * 1024,
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'dropsecure/proof/delivery',
        transformations: {
          width: 800,
          height: 600,
          crop: 'fill',
          quality: 'auto',
          format: 'auto',
        },
      },
      [DropSecureUploadType.USER_AVATAR]: {
        uploadType: DropSecureUploadType.USER_AVATAR,
        maxSizeBytes: 2 * 1024 * 1024,
        allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        folder: 'dropsecure/users/avatars',
        transformations: {
          width: 400,
          height: 400,
          crop: 'fill',
          gravity: 'face',
          quality: 'auto',
          format: 'auto',
        },
      },
    };
    return configs[uploadType];
  }

  private validateFile(
    file: Express.Multer.File,
    config: DropSecureUploadConfig,
  ): void {
    if (!file) throw new BadRequestException('No file provided');
    this.logger.log('File validation details:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer_length: file.buffer?.length,
      fieldname: file.fieldname,
      encoding: file.encoding,
    });
    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('File buffer is empty or missing');
    }
    if (file.size > config.maxSizeBytes) {
      const maxSizeMB = (config.maxSizeBytes / (1024 * 1024)).toFixed(1);
      throw new BadRequestException(
        `File size exceeds ${maxSizeMB}MB for ${config.uploadType}`,
      );
    }
    const fileExtension = file.originalname?.split('.').pop()?.toLowerCase();
    if (!fileExtension || !config.allowedFormats.includes(fileExtension)) {
      throw new BadRequestException(
        `Invalid file format. Allowed: ${config.allowedFormats.join(', ')}`,
      );
    }
    const allowedMimeTypes = this.getMimeTypesForFormats(config.allowedFormats);
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid MIME type. Expected: ${allowedMimeTypes.join(', ')}`,
      );
    }
  }

  private getMimeTypesForFormats(formats: string[]): string[] {
    const mimeTypeMap: Record<string, string[]> = {
      jpg: ['image/jpeg'],
      jpeg: ['image/jpeg'],
      png: ['image/png'],
      webp: ['image/webp'],
    };
    return formats.flatMap((format) => mimeTypeMap[format] || []);
  }

  private generatePublicId(
    config: DropSecureUploadConfig,
    entityId?: string | number,
    entityType?: string,
  ): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    if (entityId && entityType) {
      return `${config.folder}/${entityType}/${entityId}/${config.uploadType}_${timestamp}_${randomString}`;
    }
    return `${config.folder}/${config.uploadType}_${timestamp}_${randomString}`;
  }

  async uploadImage(
    file: Express.Multer.File,
    uploadType: DropSecureUploadType,
    entityId?: string | number,
    entityType?: string,
  ): Promise<CloudinaryUploadResult> {
    const config = this.getUploadConfig(uploadType);
    this.validateFile(file, config);

    const publicId = this.generatePublicId(config, entityId, entityType);

    const uploadOptions: any = {
      public_id: publicId,
      resource_type: 'image',
      folder: config.folder,
      tags: [
        uploadType,
        ...(entityType ? [entityType] : []),
        ...(entityId ? [`${entityType}-${entityId}`] : []),
      ].filter(Boolean),
      context: {
        upload_type: uploadType,
        uploaded_at: new Date().toISOString(),
        entity_id: entityId,
        entity_type: entityType,
      },
      invalidate: true,
      overwrite: false,
      unique_filename: true,
    };

    if (config.transformations) {
      uploadOptions.transformation = config.transformations;
    }

    return new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const bufferToUpload = Buffer.isBuffer(file.buffer)
        ? file.buffer
        : Buffer.from(file.buffer);

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error: any, result: any) => {
          if (error) {
            this.logger.error(`Cloudinary upload failed: ${error.message}`, {
              error_details: error,
              upload_options: uploadOptions,
              file_info: {
                size: file.size,
                mimetype: file.mimetype,
                buffer_length: file.buffer?.length,
                originalname: file.originalname,
              },
            });
            reject(new BadRequestException(`Upload failed: ${error.message}`));
          } else if (result) {
            this.logger.log(`Upload successful: ${result.secure_url}`);
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              url: result.url,
              original_filename: result.original_filename || file.originalname,
              bytes: result.bytes,
              format: result.format,
              resource_type: result.resource_type,
              created_at: result.created_at,
              width: result.width,
              height: result.height,
              folder: result.folder || config.folder,
            });
          } else {
            reject(
              new BadRequestException('Upload failed: No result returned'),
            );
          }
        },
      );

      uploadStream.on('error', (streamError) => {
        this.logger.error('Upload stream error:', streamError);
        reject(new BadRequestException(`Stream error: ${streamError.message}`));
      });

      try {
        uploadStream.write(bufferToUpload);
        uploadStream.end();
      } catch (streamWriteError: any) {
        this.logger.error('Error writing to upload stream:', streamWriteError);
        reject(
          new BadRequestException(
            `Stream write error: ${streamWriteError.message}`,
          ),
        );
      }
    });
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    uploadType: DropSecureUploadType,
    entityId?: string | number,
    entityType?: string,
  ): Promise<CloudinaryUploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    const results: CloudinaryUploadResult[] = [];
    for (const file of files) {
      try {
        const result = await this.uploadImage(
          file,
          uploadType,
          entityId,
          entityType,
        );
        results.push(result);
      } catch (error) {
        this.logger.error(
          `Failed to upload one of the images: ${error.message}`,
        );
        // Optionally, you can throw here to fail all if any fails
        // throw error;
      }
    }
    return results;
  }

  async deleteImage(publicId: string): Promise<void> {
    try {
      this.logger.log(`Deleting file with public_id: ${publicId}`);
      const result: any = await cloudinary.uploader.destroy(publicId);
      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new BadRequestException(
          `Failed to delete file: ${result.result}`,
        );
      }
      this.logger.log(`Successfully deleted file: ${publicId}`);
    } catch (error: any) {
      this.logger.error(
        `File deletion failed: ${error?.message || 'Unknown error'}`,
      );
      throw error;
    }
  }

  extractPublicIdFromUrl(url: string): string {
    try {
      if (!url || !url.includes('cloudinary.com')) return '';
      const matches = url.match(/\/([^\/]+)\.[^\/]+$/);
      if (matches && matches[1]) return matches[1];
      const parts = url.split('/');
      const fileWithExtension = parts[parts.length - 1];
      const publicId = fileWithExtension.split('.')[0];
      const dropsecureIndex = parts.indexOf('dropsecure');
      if (dropsecureIndex !== -1) {
        const folderParts = parts.slice(dropsecureIndex);
        folderParts[folderParts.length - 1] = publicId;
        return folderParts.join('/');
      }
      return publicId;
    } catch {
      this.logger.warn(`Failed to extract public_id from URL: ${url}`);
      return '';
    }
  }
}
