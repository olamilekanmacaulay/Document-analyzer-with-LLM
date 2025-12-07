import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './document.entity';
import * as mammoth from 'mammoth';
import { GoogleGenerativeAI } from '@google/generative-ai';
const pdf = require('pdf-parse');

import { ConfigService } from '@nestjs/config';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class DocumentService {
  private genAI: GoogleGenerativeAI;

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private configService: ConfigService,
    private storageService: StorageService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async create(file: Express.Multer.File): Promise<Document> {
    const text = await this.extractText(file);
    const storagePath = await this.storageService.uploadFile(file);

    const doc = this.documentRepository.create({
      filename: file.originalname,
      mimeType: file.mimetype,
      extractedText: text,
      status: 'pending',
      storagePath: storagePath,
    });

    return this.documentRepository.save(doc);
  }

  async extractText(file: Express.Multer.File): Promise<string> {
    if (file.mimetype === 'application/pdf') {
      const data = await pdf(file.buffer);
      return data.text;
    } else if (
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    }
    return '';
  }

  async analyze(id: string): Promise<Document> {
    const doc = await this.documentRepository.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');

    if (!doc.extractedText) {
      return doc;
    }

    const prompt = `
      Analyze the following text and return a JSON object with these fields:
      - summary: A concise summary of the document.
      - type: The type of document (e.g., invoice, CV, report).
      - attributes: Key metadata extracted (e.g., date, sender, amount).
      
      Text:
      ${doc.extractedText.substring(0, 10000)}
    `;

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
      });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Clean up markdown code blocks if present
      const jsonStr = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      const metadata = JSON.parse(jsonStr);

      doc.aiMetadata = metadata;
      doc.status = 'analyzed';
      return this.documentRepository.save(doc);
    } catch (error) {
      console.error('LLM Error:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Document> {
    const doc = await this.documentRepository.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return doc;
  }
}
