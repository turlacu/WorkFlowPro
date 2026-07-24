import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/server-auth';
import * as XLSX from 'xlsx';
import { extractExcelFillColor } from '@/lib/excel-colors';

// Test configuration against uploaded file
export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(['ADMIN']);
    if (auth.response) return auth.response;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const configData = JSON.parse(formData.get('config') as string);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer', cellStyles: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Test the configuration
    const testResult = {
      filename: file.name,
      sheetName,
      config: configData,
      validation: {
        dateRowData: [] as Array<{ column: number; value: any; type: string }>,
        nameColumnData: [] as Array<{ row: number; value: any; type: string }>,
        sampleScheduleData: [] as Array<{ row: number; col: string; value: any; hasStyle: boolean; color?: string }>,
        detectedColors: [] as string[],
        errors: [] as string[],
        warnings: [] as string[]
      }
    };

    // Check date row
    try {
      const dateRowData: Array<{ column: number; value: any; type: string }> = [];
      for (let col = configData.firstDateColumn; col <= configData.lastDateColumn; col++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: configData.dateRow, c: col })];
        if (cell && cell.v !== undefined) {
          dateRowData.push({ column: col, value: cell.v, type: typeof cell.v });
        }
      }
      testResult.validation.dateRowData = dateRowData;
      
      if (dateRowData.length === 0) {
        testResult.validation.errors.push(`No data found in date row ${configData.dateRow + 1}`);
      } else {
        const validDates = dateRowData.filter(d => typeof d.value === 'number' && d.value >= 1 && d.value <= 31);
        if (validDates.length === 0) {
          testResult.validation.warnings.push(`Date row contains data but no valid dates (1-31) found`);
        }
      }
    } catch (error) {
      testResult.validation.errors.push(`Error reading date row: ${error}`);
    }

    // Check name column
    try {
      const nameColumnData: Array<{ row: number; value: any; type: string }> = [];
      for (let row = configData.firstNameRow; row <= configData.lastNameRow; row++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: configData.nameColumn })];
        if (cell && cell.v !== undefined) {
          nameColumnData.push({ row, value: cell.v, type: typeof cell.v });
        }
      }
      testResult.validation.nameColumnData = nameColumnData;
      
      if (nameColumnData.length === 0) {
        testResult.validation.errors.push(`No names found in column ${String.fromCharCode(65 + configData.nameColumn)}, rows ${configData.firstNameRow + 1}-${configData.lastNameRow + 1}`);
      }
    } catch (error) {
      testResult.validation.errors.push(`Error reading name column: ${error}`);
    }

    // Sample schedule data (first few intersections)
    try {
      const sampleData: Array<{ row: number; col: string; value: any; hasStyle: boolean; color?: string }> = [];
      const detectedColors = new Set<string>();
      const sampleRows = Math.min(3, configData.lastNameRow - configData.firstNameRow + 1);
      const sampleCols = Math.min(7, configData.lastDateColumn - configData.firstDateColumn + 1);

      if (configData.colorDetection !== false) {
        for (let row = configData.firstNameRow; row <= configData.lastNameRow; row++) {
          for (let col = configData.firstDateColumn; col <= configData.lastDateColumn; col++) {
            const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
            const color = extractExcelFillColor(cell);
            if (color) detectedColors.add(color);
          }
        }
      }
      
      for (let r = 0; r < sampleRows; r++) {
        const row = configData.firstNameRow + r;
        for (let c = 0; c < sampleCols; c++) {
          const col = configData.firstDateColumn + c;
          const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
          const color = configData.colorDetection === false ? undefined : extractExcelFillColor(cell);
          if (cell && (cell.v !== undefined || color)) {
            sampleData.push({
              row: row + 1,
              col: XLSX.utils.encode_col(col),
              value: cell.v ?? '',
              hasStyle: !!cell.s,
              color,
            });
          }
        }
      }
      testResult.validation.sampleScheduleData = sampleData;
      testResult.validation.detectedColors = [...detectedColors];

      if (configData.colorDetection !== false && detectedColors.size === 0) {
        testResult.validation.warnings.push('Color detection is enabled, but no non-white fill colors were found in the configured schedule range.');
      }
    } catch (error) {
      testResult.validation.errors.push(`Error reading schedule data: ${error}`);
    }

    // Configuration validation
    if (configData.firstNameRow >= configData.lastNameRow) {
      testResult.validation.errors.push('First name row must be less than last name row');
    }
    if (configData.firstDateColumn >= configData.lastDateColumn) {
      testResult.validation.errors.push('First date column must be less than last date column');
    }

    return NextResponse.json(testResult);
  } catch (error) {
    console.error('Error testing configuration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
