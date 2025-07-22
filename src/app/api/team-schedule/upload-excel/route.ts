import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import Fuse from 'fuse.js';

interface ExcelParseResult {
  success: boolean;
  data?: ScheduleEntry[];
  errors?: string[];
  matchingReport?: MatchingReport;
}

interface ScheduleEntry {
  name: string;
  date: string;
  shiftHours?: string;
  shiftColor?: string;
  matchedUserId?: string;
  matchedUserName?: string;
}

interface MatchingReport {
  totalEntries: number;
  matchedUsers: number;
  unmatchedUsers: number;
  unmatchedNames: string[];
  duplicates: string[];
}

// Helper function to convert RGB to Hex
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Helper function to parse Excel color
function parseExcelColor(cell: any): string | undefined {
  if (!cell?.s) return undefined;
  
  const style = cell.s;
  
  // Debug: log the style information
  console.log('Cell style info:', JSON.stringify(style, null, 2));
  
  // Try different color properties that Excel might use
  
  // Method 1: Check background color (fill) - ARGB format
  if (style.fill?.bgColor?.rgb) {
    const rgb = style.fill.bgColor.rgb;
    if (typeof rgb === 'string' && rgb.length === 8) {
      const r = parseInt(rgb.substr(2, 2), 16);
      const g = parseInt(rgb.substr(4, 2), 16);
      const b = parseInt(rgb.substr(6, 2), 16);
      const colorHex = rgbToHex(r, g, b);
      console.log(`Found background color: ${colorHex}`);
      return colorHex;
    }
  }
  
  // Method 2: Check pattern fill
  if (style.fill?.patternFill?.bgColor?.rgb) {
    const rgb = style.fill.patternFill.bgColor.rgb;
    if (typeof rgb === 'string' && rgb.length === 8) {
      const r = parseInt(rgb.substr(2, 2), 16);
      const g = parseInt(rgb.substr(4, 2), 16);
      const b = parseInt(rgb.substr(6, 2), 16);
      const colorHex = rgbToHex(r, g, b);
      console.log(`Found pattern background color: ${colorHex}`);
      return colorHex;
    }
  }
  
  // Method 3: Check foreground color
  if (style.fgColor?.rgb) {
    const rgb = style.fgColor.rgb;
    if (typeof rgb === 'string' && rgb.length === 8) {
      const r = parseInt(rgb.substr(2, 2), 16);
      const g = parseInt(rgb.substr(4, 2), 16);
      const b = parseInt(rgb.substr(6, 2), 16);
      const colorHex = rgbToHex(r, g, b);
      console.log(`Found foreground color: ${colorHex}`);
      return colorHex;
    }
  }
  
  // Method 4: Check indexed colors (common in .xls files)
  if (style.fill?.bgColor?.indexed !== undefined) {
    const index = style.fill.bgColor.indexed;
    console.log(`Found indexed background color: ${index}`);
    // Map common Excel color indices to hex colors
    const indexedColors: { [key: number]: string } = {
      2: '#FF0000', // red
      3: '#00FF00', // green
      4: '#0000FF', // blue
      5: '#FFFF00', // yellow
      6: '#FF00FF', // magenta
      7: '#00FFFF', // cyan
      10: '#99BB3B', // light green (approximation)
      13: '#FFC000', // orange
      14: '#043E1C', // dark green (approximation)
      // Add more mappings as needed
    };
    
    if (indexedColors[index]) {
      console.log(`Mapped indexed color ${index} to ${indexedColors[index]}`);
      return indexedColors[index];
    }
    
    // Return a placeholder for unmapped indexed colors
    return `#INDEX${index}`;
  }
  
  // Method 5: Check pattern fill indexed color
  if (style.fill?.patternFill?.bgColor?.indexed !== undefined) {
    const index = style.fill.patternFill.bgColor.indexed;
    console.log(`Found pattern indexed color: ${index}`);
    return `#PATTERN${index}`;
  }
  
  return undefined;
}

// Fuzzy match user names
function findMatchingUser(searchName: string, users: any[]): any | null {
  const fuse = new Fuse(users, {
    keys: ['name'],
    threshold: 0.4, // Adjust for fuzzy matching sensitivity
    includeScore: true
  });

  const results = fuse.search(searchName);
  return results.length > 0 && results[0].score! < 0.4 ? results[0].item : null;
}

// Parse Excel file and extract schedule data
function parseExcelSchedule(buffer: Buffer, targetMonth: number, targetYear: number): ExcelParseResult {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellStyles: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const scheduleEntries: ScheduleEntry[] = [];
    const errors: string[] = [];
    
    // Get the range of cells
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z100');
    
    // Step 1: Find header row (contains "NUME", "NAME", etc.)
    let headerRow = -1;
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellRef];
        
        if (cell && typeof cell.v === 'string') {
          const value = cell.v.trim().toUpperCase();
          if (value === 'NUME' || value === 'NAME') {
            headerRow = row;
            break;
          }
        }
      }
      if (headerRow !== -1) break;
    }
    
    // Step 2: Find date row (should contain numbers 1, 2, 3, etc.)
    let dateRow = -1;
    const startSearchRow = headerRow !== -1 ? headerRow + 1 : range.s.r;
    
    for (let row = startSearchRow; row <= range.e.r; row++) {
      let dateCount = 0;
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellRef];
        
        if (cell && typeof cell.v === 'number' && cell.v >= 1 && cell.v <= 31) {
          dateCount++;
        }
      }
      // If we find multiple date numbers in the same row, it's likely the date row
      if (dateCount >= 3) {
        dateRow = row;
        break;
      }
    }
    
    if (dateRow === -1) {
      return { success: false, errors: ['Could not find date row in Excel file'] };
    }
    
    // Step 3: Find name column (first column with actual employee names after date row)
    let nameColumn = -1;
    const invalidNames = ['NUME', 'NAME', 'L', 'M', 'J', 'V', 'S', 'D', 'l', 'm', 'j', 'v', 's', 'd'];
    
    // Start looking from the first data row (after date row)
    const firstDataRow = dateRow + 1;
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      let validNameCount = 0;
      
      // Check multiple rows in this column to see if it contains names
      for (let row = firstDataRow; row <= Math.min(firstDataRow + 5, range.e.r); row++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellRef];
        
        if (cell && typeof cell.v === 'string') {
          const cellValue = cell.v.trim();
          
          // Skip invalid names and check if it looks like a real name
          if (cellValue.length > 2 && 
              !invalidNames.includes(cellValue) && 
              !invalidNames.includes(cellValue.toUpperCase()) &&
              /^[a-zA-ZăâîșțĂÂÎȘȚ\s\-\.]+$/.test(cellValue)) {
            validNameCount++;
          }
        }
      }
      
      // If we found multiple valid names in this column, it's our name column
      if (validNameCount >= 2) {
        nameColumn = col;
        break;
      }
    }
    
    if (nameColumn === -1) {
      return { success: false, errors: ['Could not find name column in Excel file'] };
    }
    
    console.log(`Excel parsing: Found header row at ${headerRow}, date row at ${dateRow}, name column at ${nameColumn}`);
    
    // Parse schedule data - only process rows after the date row
    const dataStartRow = dateRow + 1;
    
    for (let row = dataStartRow; row <= range.e.r; row++) {
      const nameCell = worksheet[XLSX.utils.encode_cell({ r: row, c: nameColumn })];
      if (!nameCell || !nameCell.v) continue;
      
      const employeeName = String(nameCell.v).trim();
      
      // Skip invalid names (headers, day abbreviations, empty, too short)
      if (employeeName.length < 3 || 
          ['NUME', 'NAME', 'L', 'M', 'J', 'V', 'S', 'D'].includes(employeeName.toUpperCase()) ||
          !(/^[a-zA-ZăâîșțĂÂÎȘȚ\s\-\.]+$/.test(employeeName))) {
        console.log(`Skipping invalid name: "${employeeName}"`);
        continue;
      }
      
      // Process each day of the month
      for (let col = nameColumn + 1; col <= range.e.c; col++) {
        const dateCell = worksheet[XLSX.utils.encode_cell({ r: dateRow, c: col })];
        if (!dateCell || typeof dateCell.v !== 'number') continue;
        
        const day = dateCell.v;
        if (day < 1 || day > 31) continue;
        
        const scheduleCell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
        if (!scheduleCell || !scheduleCell.v) continue;
        
        // Extract shift information
        const shiftHours = String(scheduleCell.v).trim();
        
        // Skip day abbreviations and invalid shift data
        const dayAbbreviations = ['l', 'm', 'j', 'v', 's', 'd', 'L', 'M', 'J', 'V', 'S', 'D'];
        if (dayAbbreviations.includes(shiftHours) || shiftHours.length < 1) {
          continue;
        }
        
        const shiftColor = parseExcelColor(scheduleCell);
        
        // Create date string for the target month/year and validate
        try {
          const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const testDate = new Date(dateStr);
          
          // Validate the date is valid
          if (isNaN(testDate.getTime()) || testDate.getMonth() !== targetMonth - 1) {
            console.warn(`Invalid date created: ${dateStr} for day ${day}, month ${targetMonth}, year ${targetYear}`);
            continue;
          }
          
          scheduleEntries.push({
            name: employeeName,
            date: dateStr,
            shiftHours,
            shiftColor
          });
        } catch (dateError) {
          console.error(`Error creating date for ${employeeName} on day ${day}:`, dateError);
          continue;
        }
      }
    }
    
    return { success: true, data: scheduleEntries };
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    return { success: false, errors: [`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`] };
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Only admins can upload schedules' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const month = parseInt(formData.get('month') as string);
    const year = parseInt(formData.get('year') as string);
    const preview = formData.get('preview') === 'true';

    console.log('Excel upload request:', { filename: file?.name, month, year, preview });

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('File parsed, buffer size:', buffer.length);
    
    const parseResult = parseExcelSchedule(buffer, month, year);
    console.log('Parse result:', { success: parseResult.success, dataLength: parseResult.data?.length, errors: parseResult.errors });
    
    if (parseResult.success && parseResult.data && parseResult.data.length > 0) {
      console.log('Sample parsed data:', parseResult.data.slice(0, 5));
    }
    
    if (!parseResult.success || !parseResult.data) {
      return NextResponse.json({ error: 'Failed to parse Excel file', details: parseResult.errors }, { status: 400 });
    }

    // Get all operators from database for fuzzy matching
    console.log('Fetching operators from database...');
    let operators;
    try {
      operators = await prisma.user.findMany({
        where: { role: 'OPERATOR' },
        select: { id: true, name: true, email: true }
      });
      console.log('Found operators:', operators.length);
      console.log('Operator names in database:', operators.map(op => `"${op.name}"`).join(', '));
    } catch (dbError) {
      console.error('Database error fetching operators:', dbError);
      throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`);
    }

    // Match names with existing users
    const matchingReport: MatchingReport = {
      totalEntries: 0,
      matchedUsers: 0,
      unmatchedUsers: 0,
      unmatchedNames: [],
      duplicates: []
    };

    const processedEntries: ScheduleEntry[] = [];
    const duplicateCheck = new Set<string>();

    // Log the unique names extracted from Excel
    const uniqueNamesFromExcel = [...new Set(parseResult.data.map(entry => entry.name))];
    console.log('Unique names extracted from Excel:', uniqueNamesFromExcel.map(name => `"${name}"`).join(', '));

    for (const entry of parseResult.data) {
      matchingReport.totalEntries++;
      
      // Try to match user first
      const matchedUser = findMatchingUser(entry.name, operators);
      
      if (matchedUser) {
        console.log(`✓ Matched "${entry.name}" to "${matchedUser.name}" (${matchedUser.id})`);
        entry.matchedUserId = matchedUser.id;
        entry.matchedUserName = matchedUser.name;
        
        // Check for duplicates using userId and date (same as DB constraint)
        const duplicateKey = `${entry.matchedUserId}-${entry.date}`;
        if (duplicateCheck.has(duplicateKey)) {
          matchingReport.duplicates.push(`${entry.name} on ${entry.date}`);
          continue;
        }
        duplicateCheck.add(duplicateKey);
        
        matchingReport.matchedUsers++;
      } else {
        console.log(`✗ No match found for "${entry.name}"`);
        matchingReport.unmatchedNames.push(entry.name);
        matchingReport.unmatchedUsers++;
      }

      processedEntries.push(entry);
    }

    // If this is just a preview, return the processed data without saving
    if (preview) {
      return NextResponse.json({
        success: true,
        preview: true,
        data: processedEntries,
        matchingReport
      });
    }

    // Save to database - only entries with matched users
    const matchedEntries = processedEntries.filter(entry => entry.matchedUserId);
    
    if (matchedEntries.length === 0) {
      return NextResponse.json({ error: 'No entries could be matched to existing operators' }, { status: 400 });
    }

    // Clear existing schedules for the month (simplified approach)
    console.log('Clearing existing schedules for month:', { year, month });
    
    // Create proper date range - be more explicit about timezone
    const startOfMonth = new Date(year, month - 1, 1); // First day of month
    const endOfMonth = new Date(year, month, 1); // First day of next month
    
    console.log('Date range for deletion:', { 
      start: startOfMonth.toISOString(), 
      end: endOfMonth.toISOString() 
    });
    
    let deleteResult;
    try {
      deleteResult = await prisma.teamSchedule.deleteMany({
        where: {
          date: {
            gte: startOfMonth,
            lt: endOfMonth
          }
        }
      });
      console.log('Deleted existing schedules:', deleteResult.count);
    } catch (deleteError) {
      console.error('Database error deleting schedules:', deleteError);
      throw new Error(`Delete error: ${deleteError instanceof Error ? deleteError.message : 'Unknown delete error'}`);
    }

    // Insert new schedule entries using individual creates to handle duplicates better
    console.log('Creating schedule entries:', matchedEntries.length);
    console.log('Sample entry data:', matchedEntries.slice(0, 3));
    
    let createdCount = 0;
    let skippedCount = 0;
    
    try {
      for (const entry of matchedEntries) {
        try {
          await prisma.teamSchedule.create({
            data: {
              date: new Date(entry.date),
              userId: entry.matchedUserId!,
              shiftColor: entry.shiftColor,
              shiftHours: entry.shiftHours
            }
          });
          createdCount++;
        } catch (createError: any) {
          if (createError.code === 'P2002') {
            // Unique constraint violation - skip this entry
            console.log(`Skipping duplicate entry: ${entry.matchedUserName} on ${entry.date}`);
            skippedCount++;
          } else {
            throw createError;
          }
        }
      }
      console.log(`Created ${createdCount} schedule entries, skipped ${skippedCount} duplicates`);
    } catch (createError) {
      console.error('Database error creating schedules:', createError);
      throw new Error(`Create error: ${createError instanceof Error ? createError.message : 'Unknown create error'}`);
    }

    return NextResponse.json({
      success: true,
      imported: createdCount,
      skipped: skippedCount,
      matchingReport
    });

  } catch (error) {
    console.error('Error uploading schedule:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}