import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentService } from './document.service';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({
            fileType:
              /(application\/pdf|application\/vnd.openxmlformats-officedocument.wordprocessingml.document)/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const doc = await this.documentService.create(file);
    return { id: doc.id };
  }

  @Post(':id/analyze')
  @HttpCode(200)
  async analyze(@Param('id') id: string) {
    await this.documentService.analyze(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.documentService.findOne(id);
  }
}
