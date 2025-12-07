import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
    private minioClient: Minio.Client;
    private bucketName: string;
    private readonly logger = new Logger(StorageService.name);

    constructor(private configService: ConfigService) {
        this.bucketName = this.configService.get<string>('MINIO_BUCKET', 'documents');
    }

    onModuleInit() {
        this.minioClient = new Minio.Client({
            endPoint: this.configService.get<string>('MINIO_ENDPOINT', 'localhost'),
            port: parseInt(this.configService.get<string>('MINIO_PORT', '9000'), 10),
            useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
            accessKey: this.configService.get<string>('MINIO_ACCESS_KEY'),
            secretKey: this.configService.get<string>('MINIO_SECRET_KEY'),
        });
    }

    async uploadFile(file: Express.Multer.File): Promise<string> {
        const fileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

        try {
            const bucketExists = await this.minioClient.bucketExists(this.bucketName);
            if (!bucketExists) {
                await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
                this.logger.log(`Bucket ${this.bucketName} created`);
            }

            await this.minioClient.putObject(
                this.bucketName,
                fileName,
                file.buffer,
                file.size,
                { 'Content-Type': file.mimetype }
            );

            this.logger.log(`File ${fileName} uploaded successfully`);
            return fileName;
        } catch (error) {
            this.logger.error(`Error uploading file: ${error.message}`, error.stack);
            throw error;
        }
    }
}
