import * as libre from 'libreoffice-convert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import PDFDocument from 'pdfkit';

// Промисификация функции конвертации из libreoffice-convert
const libreConvert = promisify(libre.convert);

/**
 * Конвертирует файл Office в PDF
 * @param fileBuffer Буфер с содержимым файла
 * @param sourceFormat Расширение исходного файла (например, 'xlsx', 'docx', 'pptx')
 * @returns Буфер с содержимым PDF-файла
 */
export async function convertOfficeToPdf(fileBuffer: Buffer, sourceFormat: string): Promise<Buffer> {
  try {
    console.log(`Конвертация файла из формата ${sourceFormat} в PDF...`);
    
    // Настройка формата вывода
    const format = 'pdf';
    
    // Конвертация с использованием libreoffice-convert
    const pdfBuffer = await libreConvert(fileBuffer, format, undefined);
    
    console.log(`Файл успешно конвертирован из ${sourceFormat} в PDF`);
    return pdfBuffer;
  } catch (error: any) {
    console.error(`Ошибка при конвертации файла в PDF:`, error);
    throw new Error(`Ошибка при конвертации файла: ${error.message}`);
  }
}

/**
 * Проверяет, является ли формат файла табличным (Excel, CSV и т.д.)
 * @param extension Расширение файла
 * @returns true, если файл является табличным
 */
export function isSpreadsheetFile(extension: string): boolean {
  const spreadsheetFormats = ['xls', 'xlsx', 'xlsm', 'xlsb', 'csv', 'ods'];
  return spreadsheetFormats.includes(extension.toLowerCase());
}

/**
 * Проверяет, поддерживается ли формат файла OpenAI
 * @param extension Расширение файла
 * @returns true, если формат поддерживается
 */
export function isOpenAISupportedFormat(extension: string): boolean {
  const supportedFormats = ['pdf', 'txt', 'doc', 'docx', 'ppt', 'pptx'];
  return supportedFormats.includes(extension.toLowerCase());
}

/**
 * Конвертирует файл в поддерживаемый OpenAI формат, если это необходимо
 * @param fileBuffer Буфер с содержимым файла
 * @param fileName Имя файла
 * @returns Объект с буфером данных и новым именем файла
 */
export async function convertToSupportedFormat(fileBuffer: Buffer, fileName: string): Promise<{
  buffer: Buffer;
  fileName: string;
}> {
  // Получаем расширение файла
  const fileExt = path.extname(fileName).substring(1).toLowerCase();
  
  // Если файл уже в поддерживаемом формате, возвращаем его как есть
  if (isOpenAISupportedFormat(fileExt)) {
    return { buffer: fileBuffer, fileName };
  }
  
  // Если это табличный файл, конвертируем его в PDF
  if (isSpreadsheetFile(fileExt)) {
    try {
      const pdfBuffer = await convertOfficeToPdf(fileBuffer, fileExt);
      const baseName = path.basename(fileName, path.extname(fileName));
      const newFileName = `${baseName}.pdf`;
      
      console.log(`Файл "${fileName}" конвертирован в "${newFileName}"`);
      return { buffer: pdfBuffer, fileName: newFileName };
    } catch (error: any) {
      console.error(`Ошибка при конвертации табличного файла:`, error);
      throw new Error(`Не удалось конвертировать табличный файл: ${error.message}`);
    }
  }
  
  // Если формат не поддерживается и не является табличным, выбрасываем ошибку
  throw new Error(`Формат файла ${fileExt} не поддерживается OpenAI. Поддерживаемые форматы: pdf, txt, doc, docx`);
}