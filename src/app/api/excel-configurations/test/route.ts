import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as XLSX from 'xlsx';

// Test configuration against uploaded file
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Only admins can test configurations' }, { status: 403 });
    }

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
        dateRowData: [],
        nameColumnData: [],
        sampleScheduleData: [],
        errors: [],
        warnings: []
      }
    };

    // Check date row
    try {
      const dateRowData = [];
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
      const nameColumnData = [];
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
      const sampleData = [];
      const sampleRows = Math.min(3, configData.lastNameRow - configData.firstNameRow + 1);
      const sampleCols = Math.min(7, configData.lastDateColumn - configData.firstDateColumn + 1);
      
      for (let r = 0; r < sampleRows; r++) {
        const row = configData.firstNameRow + r;
        for (let c = 0; c < sampleCols; c++) {
          const col = configData.firstDateColumn + c;
          const cell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
          if (cell && cell.v !== undefined) {
            sampleData.push({
              row: row + 1,
              col: String.fromCharCode(65 + col),
              value: cell.v,
              hasStyle: !!cell.s
            });
          }
        }
      }
      testResult.validation.sampleScheduleData = sampleData;
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