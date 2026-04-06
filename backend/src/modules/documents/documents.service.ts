import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import { DocumentTemplate } from './entities/document-template.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { SearchDocumentsDto } from './dto/search-documents.dto';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(DocumentTemplate)
    private readonly templateRepository: Repository<DocumentTemplate>,
  ) {}

  async create(createDocumentDto: CreateDocumentDto): Promise<Document> {
    const document = this.documentRepository.create(createDocumentDto);
    return this.documentRepository.save(document);
  }

  async findAll(searchDto: SearchDocumentsDto) {
    const {
      patientId,
      type,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = searchDto;

    const qb = this.documentRepository.createQueryBuilder('document');

    if (patientId) {
      qb.andWhere('document.patientId = :patientId', { patientId });
    }

    if (type) {
      qb.andWhere('document.type = :type', { type });
    }

    if (dateFrom) {
      qb.andWhere('document.createdAt >= :dateFrom', { dateFrom });
    }

    if (dateTo) {
      qb.andWhere('document.createdAt <= :dateTo', { dateTo });
    }

    qb.orderBy(`document.${sortBy}`, sortOrder);
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({ where: { id } });
    if (!document) {
      throw new NotFoundException(`Document with ID "${id}" not found`);
    }
    return document;
  }

  async update(id: string, updateDto: Partial<CreateDocumentDto>): Promise<Document> {
    const document = await this.findOne(id);
    Object.assign(document, updateDto);
    return this.documentRepository.save(document);
  }

  async remove(id: string): Promise<void> {
    const document = await this.findOne(id);
    await this.documentRepository.softRemove(document);
  }

  /**
   * Placeholder method for PDF generation.
   * In a real implementation, this would use a library like puppeteer or pdfkit
   * to render the HTML template with variables and save to S3/MinIO.
   */
  async generatePdf(templateId: string, variables: Record<string, any>): Promise<string> {
    const template = await this.templateRepository.findOne({ where: { id: templateId } });
    if (!template) {
      throw new NotFoundException(`Template with ID "${templateId}" not found`);
    }

    // Placeholder: in production, render template.content with variables and generate PDF
    const filePath = `/documents/generated/${Date.now()}-${template.name}.pdf`;
    return filePath;
  }

  // Template CRUD

  async findAllTemplates() {
    return this.templateRepository.find({ where: { isActive: true } });
  }

  async findOneTemplate(id: string): Promise<DocumentTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`Template with ID "${id}" not found`);
    }
    return template;
  }
}
