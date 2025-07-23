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
  shiftName?: string;
  matchedUserId?: string;
  matchedUserName?: string;
  colorLegendMatch?: any;
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

// Helper function to parse Excel color with enhanced detection
function parseExcelColor(cell: any, workbook: any): string | undefined {
  if (!cell?.s) return undefined;
  
  const style = cell.s;
  console.log('Cell style object:', JSON.stringify(style, null, 2));
  
  // Method 1: Check background color (fill) - ARGB format
  if (style.fill?.bgColor?.rgb) {
    const rgb = style.fill.bgColor.rgb;
    if (typeof rgb === 'string' && rgb.length === 8) {
      const r = parseInt(rgb.substr(2, 2), 16);
      const g = parseInt(rgb.substr(4, 2), 16);
      const b = parseInt(rgb.substr(6, 2), 16);
      const colorHex = rgbToHex(r, g, b);
      console.log(`✓ Found ARGB background color: ${colorHex}`);
      return colorHex;
    } else if (typeof rgb === 'string' && rgb.length === 6) {
      // Handle RGB format (6 chars)
      const colorHex = `#${rgb.toUpperCase()}`;
      console.log(`✓ Found RGB background color: ${colorHex}`);
      return colorHex;
    }
  }
  
  // Method 2: Check pattern fill background
  if (style.fill?.patternFill?.bgColor?.rgb) {
    const rgb = style.fill.patternFill.bgColor.rgb;
    if (typeof rgb === 'string' && rgb.length === 8) {
      const r = parseInt(rgb.substr(2, 2), 16);
      const g = parseInt(rgb.substr(4, 2), 16);
      const b = parseInt(rgb.substr(6, 2), 16);
      const colorHex = rgbToHex(r, g, b);
      console.log(`✓ Found pattern fill background color: ${colorHex}`);
      return colorHex;
    } else if (typeof rgb === 'string' && rgb.length === 6) {
      const colorHex = `#${rgb.toUpperCase()}`;
      console.log(`✓ Found pattern fill RGB color: ${colorHex}`);
      return colorHex;
    }
  }

  // Method 3: Check foreground color (font color, but sometimes used for cell highlighting)
  if (style.fgColor?.rgb) {
    const rgb = style.fgColor.rgb;
    if (typeof rgb === 'string' && rgb.length === 8) {
      const r = parseInt(rgb.substr(2, 2), 16);
      const g = parseInt(rgb.substr(4, 2), 16);
      const b = parseInt(rgb.substr(6, 2), 16);
      const colorHex = rgbToHex(r, g, b);
      console.log(`✓ Found foreground color: ${colorHex}`);
      return colorHex;
    }
  }
  
  // Method 4: Enhanced indexed color mapping with workbook theme support
  if (style.fill?.bgColor?.indexed !== undefined) {
    const index = style.fill.bgColor.indexed;
    console.log(`Found indexed background color: ${index}`);
    
    // First try to get color from workbook theme
    let themeColor = undefined;
    if (workbook.Themes && workbook.Themes[0] && workbook.Themes[0].themeElements) {
      const theme = workbook.Themes[0].themeElements;
      if (theme.clrScheme && theme.clrScheme.colors && theme.clrScheme.colors[index]) {
        themeColor = theme.clrScheme.colors[index];
        console.log(`Found theme color for index ${index}:`, themeColor);
      }
    }
    
    // Extended indexed color mapping for common Excel colors
    const indexedColors: { [key: number]: string } = {
      0: '#000000', // black
      1: '#FFFFFF', // white
      2: '#FF0000', // red
      3: '#00FF00', // green  
      4: '#0000FF', // blue
      5: '#FFFF00', // yellow
      6: '#FF00FF', // magenta
      7: '#00FFFF', // cyan
      8: '#000000', // black
      9: '#FFFFFF', // white
      10: '#FF0000', // red
      11: '#00FF00', // green
      12: '#0000FF', // blue  
      13: '#FFFF00', // yellow
      14: '#FF00FF', // magenta
      15: '#00FFFF', // cyan
      16: '#800000', // dark red
      17: '#008000', // dark green
      18: '#000080', // dark blue
      19: '#808000', // olive
      20: '#800080', // purple
      21: '#008080', // teal
      22: '#C0C0C0', // silver
      23: '#808080', // gray
      // Add more common Excel indexed colors
      40: '#FF99CC', // light pink
      41: '#FFCC99', // light orange
      42: '#FFFF99', // light yellow
      43: '#CCFFCC', // light green
      44: '#CCFFFF', // light cyan
      45: '#99CCFF', // light blue
      46: '#CC99FF', // light purple
    };
    
    if (indexedColors[index]) {
      console.log(`✓ Mapped indexed color ${index} to ${indexedColors[index]}`);
      return indexedColors[index];
    }
    
    // Return a placeholder for unmapped indexed colors for debugging
    console.log(`⚠ Unmapped indexed color: ${index}`);
    return `#INDEX${index}`;
  }
  
  // Method 5: Check pattern fill indexed color
  if (style.fill?.patternFill?.bgColor?.indexed !== undefined) {
    const index = style.fill.patternFill.bgColor.indexed;
    console.log(`Found pattern indexed color: ${index}`);
    // Use same mapping as above
    const indexedColors: { [key: number]: string } = {
      2: '#FF0000', 3: '#00FF00', 4: '#0000FF', 5: '#FFFF00',
      6: '#FF00FF', 7: '#00FFFF', 10: '#99BB3B', 13: '#FFC000'
    };
    if (indexedColors[index]) {
      console.log(`✓ Mapped pattern indexed color ${index} to ${indexedColors[index]}`);
      return indexedColors[index];
    }
    return `#PATTERN${index}`;
  }

  // Method 6: Check for modern Excel color formats
  if (style.fill?.fgColor?.rgb) {
    const rgb = style.fill.fgColor.rgb;
    if (typeof rgb === 'string') {
      let colorHex = rgb.length === 8 ? `#${rgb.substr(2)}` : `#${rgb}`;
      console.log(`✓ Found fill foreground color: ${colorHex}`);
      return colorHex.toUpperCase();
    }
  }
  
  console.log('❌ No color found in cell style');
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

// Helper function to find closest matching color legend
function findMatchingColorLegend(detectedColor: string, colorLegends: any[]): any | null {
  if (!detectedColor || !colorLegends.length) return null;
  
  console.log(`🎨 Looking for color legend match for: ${detectedColor}`);
  console.log(`Available legends: ${colorLegends.map(l => `${l.colorCode} (${l.shiftName})`).join(', ')}`);
  
  // First try exact match
  const exactMatch = colorLegends.find(legend => 
    legend.colorCode.toLowerCase() === detectedColor.toLowerCase()
  );
  
  if (exactMatch) {
    console.log(`✓ Exact color legend match: ${exactMatch.colorCode} -> ${exactMatch.shiftName}`);
    return exactMatch;
  }
  
  // For indexed colors like #INDEX42, try to find a reasonable match
  if (detectedColor.startsWith('#INDEX') || detectedColor.startsWith('#PATTERN')) {
    console.log(`⚠ Detected indexed/pattern color: ${detectedColor}, no exact match found`);
    return null;
  }
  
  // If no exact match, could implement color similarity matching here
  // For now, return null to avoid incorrect mappings
  console.log(`❌ No matching color legend found for: ${detectedColor}`);
  return null;
}

// Helper function to convert hex to RGB for color comparison
function hexToRgb(hex: string): {r: number, g: number, b: number} | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Helper function to calculate color distance
function colorDistance(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return Infinity;
  
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) + 
    Math.pow(rgb1.g - rgb2.g, 2) + 
    Math.pow(rgb1.b - rgb2.b, 2)
  );
}

// Parse Excel file and extract schedule data using specific known locations
async function parseExcelSchedule(buffer: Buffer, targetMonth: number, targetYear: number): Promise<ExcelParseResult> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellStyles: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Fetch color legends from database
    let colorLegends: any[] = [];
    try {
      colorLegends = await prisma.shiftColorLegend.findMany({
        orderBy: { createdAt: 'asc' }
      });
      console.log(`📊 Loaded ${colorLegends.length} color legends from database`);
    } catch (error) {
      console.warn('Could not load color legends from database:', error);
    }
    
    const scheduleEntries: ScheduleEntry[] = [];
    const errors: string[] = [];
    
    console.log('Using specific Excel layout: Names in B15:B18, Dates in C13:AG13');
    
    // Define the specific cell locations based on your Excel structure
    const DATE_ROW = 12; // Row 13 in Excel (0-based = 12)
    const NAME_COLUMN = 1; // Column B in Excel (0-based = 1)
    const FIRST_NAME_ROW = 14; // Row 15 in Excel (0-based = 14)
    const LAST_NAME_ROW = 17; // Row 18 in Excel (0-based = 17)
    const FIRST_DATE_COLUMN = 2; // Column C in Excel (0-based = 2)
    const LAST_DATE_COLUMN = 32; // Column AG in Excel (0-based = 32)
    
    console.log(`Parsing Excel with fixed structure:
      - Date row: ${DATE_ROW + 1} (Excel row 13)
      - Name column: ${String.fromCharCode(65 + NAME_COLUMN)} (Excel column B)
      - Name rows: ${FIRST_NAME_ROW + 1}-${LAST_NAME_ROW + 1} (Excel rows 15-18)
      - Date columns: ${String.fromCharCode(65 + FIRST_DATE_COLUMN)}-${String.fromCharCode(65 + LAST_DATE_COLUMN)} (Excel columns C-AG)`);
    
    // First, extract and validate the date row
    const dates: { [col: number]: number } = {};
    for (let col = FIRST_DATE_COLUMN; col <= LAST_DATE_COLUMN; col++) {
      const dateCell = worksheet[XLSX.utils.encode_cell({ r: DATE_ROW, c: col })];
      if (dateCell && typeof dateCell.v === 'number' && dateCell.v >= 1 && dateCell.v <= 31) {
        dates[col] = dateCell.v;
      }
    }
    
    console.log(`Found ${Object.keys(dates).length} valid dates in date row`);
    
    if (Object.keys(dates).length === 0) {
      return { success: false, errors: ['No valid dates found in row 13 (C13:AG13)'] };
    }
    
    // Extract names from the name column
    const operators: { [row: number]: string } = {};
    for (let row = FIRST_NAME_ROW; row <= LAST_NAME_ROW; row++) {
      const nameCell = worksheet[XLSX.utils.encode_cell({ r: row, c: NAME_COLUMN })];
      if (nameCell && typeof nameCell.v === 'string') {
        const employeeName = nameCell.v.trim();
        
        // Validate it's a real name
        if (employeeName.length > 2 && 
            /^[a-zA-ZăâîșțĂÂÎȘȚ\s\-\.]+$/.test(employeeName)) {
          operators[row] = employeeName;
          console.log(`Found operator "${employeeName}" in row ${row + 1} (Excel row ${row + 1})`);
        }
      }
    }
    
    console.log(`Found ${Object.keys(operators).length} operators in name column`);
    
    if (Object.keys(operators).length === 0) {
      return { success: false, errors: ['No valid operator names found in column B (B15:B18)'] };
    }
    
    // Now parse the schedule grid
    for (const [rowStr, operatorName] of Object.entries(operators)) {
      const row = parseInt(rowStr);
      
      for (const [colStr, day] of Object.entries(dates)) {
        const col = parseInt(colStr);
        
        const scheduleCell = worksheet[XLSX.utils.encode_cell({ r: row, c: col })];
        
        // Check if there's any content in this cell (shift data)
        if (scheduleCell && scheduleCell.v !== undefined && scheduleCell.v !== null && scheduleCell.v !== '') {
          const shiftHours = String(scheduleCell.v).trim();
          const shiftColor = parseExcelColor(scheduleCell, workbook);
          
          // Skip empty cells and day abbreviations
          const dayAbbreviations = ['l', 'm', 'j', 'v', 's', 'd', 'L', 'M', 'J', 'V', 'S', 'D'];
          if (shiftHours.length > 0 && !dayAbbreviations.includes(shiftHours)) {
            
            // Try to match color with legend
            let colorLegendMatch = null;
            let shiftName = undefined;
            
            if (shiftColor) {
              colorLegendMatch = findMatchingColorLegend(shiftColor, colorLegends);
              if (colorLegendMatch) {
                shiftName = colorLegendMatch.shiftName;
                console.log(`🎯 Color ${shiftColor} matched to shift: ${shiftName}`);
              }
            }
            
            // Create date string for the target month/year
            try {
              const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const testDate = new Date(dateStr);
              
              // Validate the date is valid
              if (isNaN(testDate.getTime()) || testDate.getMonth() !== targetMonth - 1) {
                console.warn(`Invalid date created: ${dateStr} for day ${day}, month ${targetMonth}, year ${targetYear}`);
                continue;
              }
              
              scheduleEntries.push({
                name: operatorName,
                date: dateStr,
                shiftHours,
                shiftColor,
                shiftName,
                colorLegendMatch
              });
              
              if (shiftColor && shiftName) {
                console.log(`✓ Entry with matched shift: ${operatorName} on ${dateStr} - ${shiftHours} (${shiftName}, Color: ${shiftColor})`);
              } else if (shiftColor) {
                console.log(`⚠ Entry with unmatched color: ${operatorName} on ${dateStr} - ${shiftHours} (Color: ${shiftColor})`);
              } else {
                console.log(`❌ Entry without color: ${operatorName} on ${dateStr} - ${shiftHours}`);
              }
              
            } catch (dateError) {
              console.error(`Error creating date for ${operatorName} on day ${day}:`, dateError);
              continue;
            }
          }
        }
      }
    }
    
    console.log(`Total schedule entries extracted: ${scheduleEntries.length}`);
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
    
    const parseResult = await parseExcelSchedule(buffer, month, year);
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