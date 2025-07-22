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
  
  // Try different color properties that Excel might use
  const style = cell.s;
  
  // Check background color (fill)
  if (style.fill?.bgColor?.rgb) {
    const rgb = style.fill.bgColor.rgb;
    if (rgb.length === 8) {
      const r = parseInt(rgb.substr(2, 2), 16);
      const g = parseInt(rgb.substr(4, 2), 16);
      const b = parseInt(rgb.substr(6, 2), 16);
      return rgbToHex(r, g, b);
    }
  }
  
  // Check foreground color
  if (style.fgColor?.rgb) {
    const rgb = style.fgColor.rgb;
    if (rgb.length === 8) {
      const r = parseInt(rgb.substr(2, 2), 16);
      const g = parseInt(rgb.substr(4, 2), 16);
      const b = parseInt(rgb.substr(6, 2), 16);
      return rgbToHex(r, g, b);
    }
  }
  
  // Check indexed colors
  if (style.fill?.bgColor?.indexed) {
    // For now, return a placeholder - you might need to map indexed colors
    return `#INDEX${style.fill.bgColor.indexed}`;
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
    
    // Look for date row (should contain numbers 1, 2, 3, etc.)
    let dateRow = -1;
    let nameColumn = -1;
    
    // Find the row with dates
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellRef];
        
        if (cell && typeof cell.v === 'number' && cell.v >= 1 && cell.v <= 31) {
          dateRow = row;
          break;
        }
      }
      if (dateRow !== -1) break;
    }
    
    if (dateRow === -1) {
      return { success: false, errors: ['Could not find date row in Excel file'] };
    }
    
    // Find name column - look for columns with actual names, not "NUME" or day abbreviations
    const invalidNames = ['NUME', 'NAME', 'L', 'M', 'J', 'V', 'S', 'D', 'l', 'm', 'j', 'v', 's', 'd'];
    
    for (let col = range.s.c; col <= range.e.c; col++) {
      for (let row = dateRow + 1; row <= range.e.r; row++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellRef];
        
        if (cell && typeof cell.v === 'string') {
          const cellValue = cell.v.trim();
          // Must be longer than 2 characters and not a header/day abbreviation
          if (cellValue.length > 2 && !invalidNames.includes(cellValue) && !invalidNames.includes(cellValue.toUpperCase())) {
            // Check if it looks like a real name (contains letters and possibly spaces)
            if (/^[a-zA-ZăâîșțĂÂÎȘȚ\s]+$/.test(cellValue)) {
              nameColumn = col;
              break;
            }
          }
        }
      }
      if (nameColumn !== -1) break;
    }
    
    if (nameColumn === -1) {
      return { success: false, errors: ['Could not find name column in Excel file'] };
    }
    
    console.log(`Excel parsing: Found date row at ${dateRow}, name column at ${nameColumn}`);
    
    // Parse schedule data
    for (let row = dateRow + 1; row <= range.e.r; row++) {
      const nameCell = worksheet[XLSX.utils.encode_cell({ r: row, c: nameColumn })];
      if (!nameCell || !nameCell.v) continue;
      
      const employeeName = String(nameCell.v).trim();
      if (employeeName.length < 2) continue;
      
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

    for (const entry of parseResult.data) {
      matchingReport.totalEntries++;
      
      // Try to match user first
      const matchedUser = findMatchingUser(entry.name, operators);
      
      if (matchedUser) {
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