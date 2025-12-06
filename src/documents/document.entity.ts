import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column()
  s3Key: string;

  @Column()
  mimeType: string;

  @Column({ type: 'text', nullable: true })
  extractedText: string;

  @Column({ default: 'pending' }) // pending, processed, analyzed
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  aiMetadata: {
    summary: string;
    type: string;
    attributes: Record<string, any>;
  };

  @CreateDateColumn()
  createdAt: Date;
}