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
  timeRange?: string;
  matchedUserId?: string;
  matchedUserName?: string;
  colorLegendMatch?: unknown;
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
function parseExcelColor(cell: unknown, workbook: unknown): string | undefined {
  if (!(cell as {s?: unknown})?.s) {
    console.log('No style object found in cell');
    return undefined;
  }
  
  const style = (cell as {s: unknown}).s;
  console.log('Cell style object:', JSON.stringify(style, null, 2));
  
  // Method 1: Check background color (fill) - ARGB format
  const styleObj = style as {fill?: {bgColor?: {rgb?: unknown, indexed?: number}, fgColor?: {rgb?: unknown}, patternFill?: {bgColor?: {rgb?: unknown, indexed?: number}}}, fgColor?: {rgb?: unknown}};
  if (styleObj.fill?.bgColor?.rgb) {
    const rgb = styleObj.fill.bgColor.rgb;
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
  if (styleObj.fill?.patternFill?.bgColor?.rgb) {
    const rgb = styleObj.fill.patternFill.bgColor.rgb;
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
  if (styleObj.fgColor?.rgb) {
    const rgb = styleObj.fgColor.rgb;
    if (typeof rgb === 'string' && rgb.length === 8) {
      const r = parseInt(rgb.substr(2, 2), 16);
      const g = parseInt(rgb.substr(4, 2), 16);
      const b = parseInt(rgb.substr(6, 2), 16);
      const colorHex = rgbToHex(r, g, b);
      console.log(`✓ Found foreground color: ${colorHex}`);
      return colorHex;
    } else if (typeof rgb === 'string' && rgb.length === 6) {
      const colorHex = `#${rgb.toUpperCase()}`;
      console.log(`✓ Found 6-char foreground color: ${colorHex}`);
      return colorHex;
    }
  }
  
  // Method 3a: Direct check for fgColor.rgb (Excel .xls format)
  const directStyle = style as any;
  if (directStyle.fgColor?.rgb) {
    const rgb = String(directStyle.fgColor.rgb);
    // Skip default colors (white/black text)
    if (rgb && rgb !== 'FFFFFF' && rgb !== 'ffffff' && rgb !== '000000' && rgb !== '000000') {
      const colorHex = rgb.startsWith('#') ? rgb : `#${rgb}`;
      console.log(`✓ Found direct fgColor from .xls: ${colorHex}`);
      return colorHex.toUpperCase();
    }
  }
  
  // Method 4: Enhanced indexed color mapping with workbook theme support
  if (styleObj.fill?.bgColor?.indexed !== undefined) {
    const index = styleObj.fill.bgColor.indexed;
    console.log(`Found indexed background color: ${index}`);
    
    // First try to get color from workbook theme
    let themeColor = undefined;
    const wb = workbook as {Themes?: unknown[]};
    if (wb.Themes && wb.Themes[0]) {
      const themeElement = wb.Themes[0] as {themeElements?: {clrScheme?: {colors?: unknown[]}}};
      if (themeElement.themeElements?.clrScheme?.colors?.[index]) {
        themeColor = themeElement.themeElements.clrScheme.colors[index];
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
      10: '#99BB3B', // light green - matches your color legend
      11: '#00FF00', // green
      12: '#0000FF', // blue  
      13: '#FFC000', // orange - matches your color legend  
      14: '#FF00FF', // magenta
      15: '#00FFFF', // cyan
      16: '#800000', // dark red
      17: '#843E1C', // dark green - matches your color legend
      18: '#000080', // dark blue
      19: '#808000', // olive
      20: '#800080', // purple
      21: '#008080', // teal
      22: '#C0C0C0', // silver
      23: '#808080', // gray
      // Add more common Excel indexed colors
      40: '#FF99CC', // light pink
      41: '#FFCC99', // light orange
      42: '#FFFF00', // yellow - matches your color legend
      43: '#99BB3B', // light green - duplicate for safety
      44: '#CCFFFF', // light cyan
      45: '#99CCFF', // light blue
      46: '#CC99FF', // light purple
      // Add specific mappings for your color legend
      50: '#99BB3B', // light green Morning Shift
      51: '#843E1C', // dark green Day Shift
      52: '#FFFF00', // yellow Weekend Night
      53: '#FFC000', // orange Weekend Morning
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
  if (styleObj.fill?.patternFill?.bgColor?.indexed !== undefined) {
    const index = styleObj.fill.patternFill.bgColor.indexed;
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
  if (styleObj.fill?.fgColor?.rgb) {
    const rgb = styleObj.fill.fgColor.rgb;
    if (typeof rgb === 'string') {
      const colorHex = rgb.length === 8 ? `#${rgb.substr(2)}` : `#${rgb}`;
      console.log(`✓ Found fill foreground color: ${colorHex}`);
      return colorHex.toUpperCase();
    }
  }
  
  // Method 7: Check for legacy Excel .xls color formats
  const legacyStyle = style as any;
  if (legacyStyle.bgColor) {
    console.log('Found legacy bgColor:', JSON.stringify(legacyStyle.bgColor));
    if (legacyStyle.bgColor.rgb) {
      const rgb = String(legacyStyle.bgColor.rgb);
      if (rgb && rgb !== 'FFFFFF' && rgb !== 'ffffff') {
        const colorHex = rgb.startsWith('#') ? rgb : `#${rgb}`;
        console.log(`✓ Found legacy background color: ${colorHex}`);
        return colorHex.toUpperCase();
      }
    }
    if (legacyStyle.bgColor.indexed !== undefined) {
      const index = legacyStyle.bgColor.indexed;
      console.log(`Found legacy indexed color: ${index}`);
      // Use same indexed color mapping
      const indexedColors: { [key: number]: string } = {
        0: '#000000', 1: '#FFFFFF', 2: '#FF0000', 3: '#00FF00', 4: '#0000FF', 5: '#FFFF00',
        6: '#FF00FF', 7: '#00FFFF', 8: '#000000', 9: '#FFFFFF', 10: '#99BB3B', 11: '#00FF00',
        12: '#0000FF', 13: '#FFC000', 14: '#FF00FF', 15: '#00FFFF', 16: '#800000', 17: '#843E1C',
        18: '#000080', 19: '#808000', 20: '#800080', 21: '#008080', 22: '#C0C0C0', 23: '#808080',
        40: '#FF99CC', 41: '#FFCC99', 42: '#FFFF00', 43: '#99BB3B', 44: '#CCFFFF', 45: '#99CCFF',
        46: '#CC99FF', 50: '#99BB3B', 51: '#843E1C', 52: '#FFFF00', 53: '#FFC000'
      };
      if (indexedColors[index]) {
        console.log(`✓ Mapped legacy indexed color ${index} to ${indexedColors[index]}`);
        return indexedColors[index];
      }
    }
  }

  // Method 8: Check for any color-related properties in the style object
  const allKeys = Object.keys(legacyStyle);
  console.log('All style keys:', allKeys);
  for (const key of allKeys) {
    if (key.toLowerCase().includes('color') || key.toLowerCase().includes('fill')) {
      console.log(`Found color-related key "${key}":`, JSON.stringify(legacyStyle[key]));
    }
  }

  console.log('❌ No color found in cell style');
  return undefined;
}

// Fuzzy match user names
function findMatchingUser(searchName: string, users: {id: string, name: string | null, email: string}[]): {id: string, name: string | null, email: string} | null {
  // Filter out users without names before searching
  const usersWithNames = users.filter((user): user is {id: string, name: string, email: string} => 
    user.name !== null && user.name.trim().length > 0
  );
  
  const fuse = new Fuse(usersWithNames, {
    keys: ['name'],
    threshold: 0.4, // Adjust for fuzzy matching sensitivity
    includeScore: true
  });

  const results = fuse.search(searchName);
  return results.length > 0 && results[0].score! < 0.4 ? results[0].item : null;
}

// Helper function to find closest matching color legend
function findMatchingColorLegend(detectedColor: string, colorLegends: unknown[]): unknown | null {
  if (!detectedColor || !colorLegends.length) return null;
  
  console.log(`🎨 Looking for color legend match for: ${detectedColor}`);
  console.log(`Available legends: ${colorLegends.map((l: unknown) => `${(l as {colorCode: string, shiftName: string}).colorCode} (${(l as {colorCode: string, shiftName: string}).shiftName})`).join(', ')}`);
  
  // First try exact match (case insensitive)
  const exactMatch = colorLegends.find((legend: unknown) => 
    (legend as {colorCode: string}).colorCode.toLowerCase() === detectedColor.toLowerCase()
  );
  
  if (exactMatch) {
    const match = exactMatch as {colorCode: string, shiftName: string};
    console.log(`✓ Exact color legend match: ${match.colorCode} -> ${match.shiftName}`);
    return exactMatch;
  }
  
  // For indexed colors like #INDEX42, try to find a reasonable match
  if (detectedColor.startsWith('#INDEX') || detectedColor.startsWith('#PATTERN')) {
    console.log(`⚠ Detected indexed/pattern color: ${detectedColor}, no exact match found`);
    return null;
  }
  
  // Try color similarity matching for slight variations
  const colorLegendsList = colorLegends as {colorCode: string, shiftName: string}[];
  for (const legend of colorLegendsList) {
    const distance = calculateColorDistance(detectedColor, legend.colorCode);
    if (distance < 50) { // Allow small color variations
      console.log(`✓ Similar color legend match: ${detectedColor} ≈ ${legend.colorCode} -> ${legend.shiftName} (distance: ${distance})`);
      return legend;
    }
  }
  
  console.log(`❌ No matching color legend found for: ${detectedColor}`);
  return null;
}

// Helper function to calculate color distance between two hex colors
function calculateColorDistance(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return Infinity;
  
  return Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) + 
    Math.pow(rgb1.g - rgb2.g, 2) + 
    Math.pow(rgb1.b - rgb2.b, 2)
  );
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


// Role-specific parsing configuration
interface ParsingConfig {
  dateRow: number;
  nameColumn: number;
  firstNameRow: number;
  lastNameRow: number;
  firstDateColumn: number;
  lastDateColumn: number;
  role: string;
  skipValues: string[]; // Values to skip (like "co" for holidays)
}

const PARSING_CONFIGS: { [key: string]: ParsingConfig } = {
  OPERATOR: {
    dateRow: 12,        // Row 13 in Excel (0-based = 12)
    nameColumn: 1,      // Column B in Excel (0-based = 1)
    firstNameRow: 14,   // Row 15 in Excel (0-based = 14)
    lastNameRow: 17,    // Row 18 in Excel (0-based = 17)
    firstDateColumn: 2, // Column C in Excel (0-based = 2)
    lastDateColumn: 32, // Column AG in Excel (0-based = 32)
    role: 'OPERATOR',
    skipValues: []
  },
  PRODUCER: {
    dateRow: 4,         // Row 5 in Excel (0-based = 4)
    nameColumn: 1,      // Column B in Excel (0-based = 1)
    firstNameRow: 5,    // Row 6 in Excel (0-based = 5)
    lastNameRow: 7,     // Row 8 in Excel (0-based = 7)
    firstDateColumn: 2, // Column C in Excel (0-based = 2)
    lastDateColumn: 32, // Column AG in Excel (0-based = 32)
    role: 'PRODUCER',
    skipValues: ['co']  // Skip "co" (concediu de odihnă - holiday)
  }
};

// Parse Excel file and extract schedule data using role-specific configuration
async function parseExcelSchedule(buffer: Buffer, targetMonth: number, targetYear: number, role: string = 'OPERATOR'): Promise<ExcelParseResult> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellStyles: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Get role-specific configuration
    const config = PARSING_CONFIGS[role];
    if (!config) {
      return { success: false, errors: [`Unsupported role: ${role}`] };
    }

    // Fetch role-specific color legends from database
    let colorLegends: any[] = [];
    try {
      colorLegends = await prisma.shiftColorLegend.findMany({
        where: { role },
        orderBy: { createdAt: 'asc' }
      });
      console.log(`📊 Loaded ${colorLegends.length} color legends for ${role} role from database`);
    } catch (error) {
      console.warn('Could not load color legends from database:', error);
    }
    
    const scheduleEntries: ScheduleEntry[] = [];
    // const errors: string[] = []; // Uncomment if error handling is added later
    
    console.log(`Using ${role} Excel layout: Names in ${String.fromCharCode(65 + config.nameColumn)}${config.firstNameRow + 1}:${String.fromCharCode(65 + config.nameColumn)}${config.lastNameRow + 1}, Dates in ${String.fromCharCode(65 + config.firstDateColumn)}${config.dateRow + 1}:${String.fromCharCode(65 + config.lastDateColumn)}${config.dateRow + 1}`);
    
    // Use role-specific configuration
    const { dateRow: DATE_ROW, nameColumn: NAME_COLUMN, firstNameRow: FIRST_NAME_ROW, lastNameRow: LAST_NAME_ROW, firstDateColumn: FIRST_DATE_COLUMN, lastDateColumn: LAST_DATE_COLUMN } = config;
    
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
          console.log(`Processing cell ${XLSX.utils.encode_cell({ r: row, c: col })} for ${operatorName}: "${shiftHours}"`);
          const shiftColor = parseExcelColor(scheduleCell, workbook);
          
          // Skip empty cells, day abbreviations, and role-specific skip values
          const dayAbbreviations = ['l', 'm', 'j', 'v', 's', 'd', 'L', 'M', 'J', 'V', 'S', 'D'];
          const shouldSkip = shiftHours.length === 0 || 
                           dayAbbreviations.includes(shiftHours) || 
                           config.skipValues.includes(shiftHours.toLowerCase());
          
          if (!shouldSkip) {
            
            // Try to match color with legend
            let colorLegendMatch = null;
            let shiftName = undefined;
            let timeRange = undefined;
            
            if (shiftColor) {
              colorLegendMatch = findMatchingColorLegend(shiftColor, colorLegends);
              if (colorLegendMatch) {
                const legend = colorLegendMatch as {shiftName: string, startTime: string, endTime: string};
                shiftName = legend.shiftName;
                timeRange = `${legend.startTime} - ${legend.endTime}`;
                console.log(`🎯 Color ${shiftColor} matched to shift: ${shiftName} (${timeRange})`);
              }
            }
            
            // Create date string for the target month/year
            try {
              const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const testDate = new Date(dateStr + 'T00:00:00');
              
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
                timeRange,
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
    let role = (formData.get('role') as string) || 'OPERATOR';
    
    // Auto-detect role from filename if not explicitly provided
    if (!formData.get('role') && file?.name) {
      const filename = file.name.toLowerCase();
      if (filename.includes('coordonator') || filename.includes('coordinator') || filename.includes('producer')) {
        role = 'PRODUCER';
        console.log('Auto-detected PRODUCER role from filename:', file.name);
      }
    }

    console.log('Excel upload request:', { filename: file?.name, month, year, preview, role });

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid month or year' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    console.log('File parsed, buffer size:', buffer.length);
    
    const parseResult = await parseExcelSchedule(buffer, month, year, role);
    console.log('Parse result:', { success: parseResult.success, dataLength: parseResult.data?.length, errors: parseResult.errors });
    
    if (parseResult.success && parseResult.data && parseResult.data.length > 0) {
      console.log('Sample parsed data:', parseResult.data.slice(0, 5));
    }
    
    if (!parseResult.success || !parseResult.data) {
      return NextResponse.json({ error: 'Failed to parse Excel file', details: parseResult.errors }, { status: 400 });
    }

    // Get all users of the specified role from database for fuzzy matching
    console.log(`Fetching ${role} users from database...`);
    let users: {id: string, name: string | null, email: string}[];
    try {
      users = await prisma.user.findMany({
        where: { role },
        select: { id: true, name: true, email: true }
      });
      console.log(`Found ${role} users:`, users.length);
      console.log(`${role} names in database:`, users.map(user => `"${user.name}"`).join(', '));
    } catch (dbError) {
      console.error(`Database error fetching ${role} users:`, dbError);
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
      const matchedUser = findMatchingUser(entry.name, users);
      
      if (matchedUser) {
        console.log(`✓ Matched "${entry.name}" to "${matchedUser.name}" (${matchedUser.id})`);
        entry.matchedUserId = matchedUser.id;
        entry.matchedUserName = matchedUser.name || matchedUser.email;
        
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

    // Collect unique colors for auto-detection and legend management
    const detectedColors = [...new Set(processedEntries
      .filter(entry => entry.shiftColor && !entry.shiftColor.startsWith('#INDEX') && !entry.shiftColor.startsWith('#PATTERN'))
      .map(entry => entry.shiftColor!)
    )];
    
    // Fetch existing color legends for this role to check for new colors
    let existingColorLegends: any[] = [];
    try {
      existingColorLegends = await prisma.shiftColorLegend.findMany({
        where: { role },
        select: { colorCode: true },
        orderBy: { createdAt: 'asc' }
      });
    } catch (error) {
      console.warn('Could not load color legends from database:', error);
    }
    
    // Check for new colors not in legend for this role
    const newColors = detectedColors.filter(color => 
      !existingColorLegends.some((legend: any) => legend.colorCode.toLowerCase() === color.toLowerCase())
    );
    
    // Auto-save new colors to legend for user to configure later
    if (newColors.length > 0) {
      console.log(`🎨 Auto-detecting ${newColors.length} new colors:`, newColors);
      for (const color of newColors) {
        try {
          await prisma.shiftColorLegend.create({
            data: {
              colorCode: color,
              colorName: `Auto-detected ${color}`,
              shiftName: 'Unnamed Shift',
              startTime: '00:00',
              endTime: '00:00',
              role: role,
              description: `Automatically detected from ${role} Excel import. Please configure this color meaning.`
            }
          });
          console.log(`✓ Created auto-legend entry for color: ${color}`);
        } catch (error) {
          console.warn(`Could not create legend for color ${color}:`, error);
        }
      }
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
              date: new Date(entry.date + 'T00:00:00'),
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
      matchingReport,
      newColorsDetected: newColors.length,
      detectedColors: newColors
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