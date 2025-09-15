const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateConfigurations() {
  console.log('🔄 Starting Excel configuration migration...');
  
  try {
    // Find a user with ADMIN role to set as the creator
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      console.error('❌ No admin user found. Please create an admin user first.');
      process.exit(1);
    }
    
    console.log(`Using admin user: ${adminUser.name || adminUser.email}`);
    
    // Define the configurations to migrate
    const configurations = [
      {
        name: 'OPERATOR Schedule Configuration',
        role: 'OPERATOR',
        description: 'Default configuration for OPERATOR schedule imports. Names in column B (rows 15-18), dates in row 13 (columns C-AG).',
        active: true,
        dateRow: 12,        // Row 13 in Excel (0-based = 12)
        dayLabelRow: null,
        nameColumn: 1,      // Column B in Excel (0-based = 1)
        firstNameRow: 14,   // Row 15 in Excel (0-based = 14)
        lastNameRow: 17,    // Row 18 in Excel (0-based = 17)
        firstDateColumn: 2, // Column C in Excel (0-based = 2)
        lastDateColumn: 32, // Column AG in Excel (0-based = 32)
        dynamicColumns: true,
        skipValues: [],
        validPatterns: ['coordonator', 'coordinator', 'operator'],
        colorDetection: true,
        defaultShift: null,
        createdById: adminUser.id
      },
      {
        name: 'PRODUCER Schedule Configuration',
        role: 'PRODUCER',
        description: 'Default configuration for PRODUCER schedule imports. Names in column B (rows 10-12), dates in row 9 (columns C-AF). Skips "co" (holiday) entries.',
        active: true,
        dateRow: 8,         // Row 9 in Excel (0-based = 8)
        dayLabelRow: null,
        nameColumn: 1,      // Column B in Excel (0-based = 1)
        firstNameRow: 9,    // Row 10 in Excel (0-based = 9)
        lastNameRow: 11,    // Row 12 in Excel (0-based = 11)
        firstDateColumn: 2, // Column C in Excel (0-based = 2)
        lastDateColumn: 31, // Column AF in Excel (0-based = 31)
        dynamicColumns: true,
        skipValues: ['co'],
        validPatterns: ['coordonator', 'coordinator', 'producer', 'coord'],
        colorDetection: true,
        defaultShift: null,
        createdById: adminUser.id
      }
    ];
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const config of configurations) {
      try {
        // Check if configuration already exists
        const existing = await prisma.excelUploadConfiguration.findUnique({
          where: {
            name_role: {
              name: config.name,
              role: config.role
            }
          }
        });
        
        if (existing) {
          console.log(`⚠️  Configuration "${config.name}" for ${config.role} already exists, skipping...`);
          skippedCount++;
          continue;
        }
        
        // Create the configuration
        const created = await prisma.excelUploadConfiguration.create({
          data: config
        });
        
        console.log(`✅ Created configuration: "${created.name}" for ${created.role}`);
        console.log(`   - Coordinates: Names in ${String.fromCharCode(65 + created.nameColumn)}${created.firstNameRow + 1}:${String.fromCharCode(65 + created.nameColumn)}${created.lastNameRow + 1}, Dates in row ${created.dateRow + 1}`);
        console.log(`   - Skip values: ${created.skipValues.length > 0 ? created.skipValues.join(', ') : 'None'}`);
        createdCount++;
        
      } catch (error) {
        console.error(`❌ Error creating configuration "${config.name}":`, error.message);
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`   - Created: ${createdCount} configurations`);
    console.log(`   - Skipped: ${skippedCount} existing configurations`);
    
    if (createdCount > 0) {
      console.log(`\n📋 Next steps:`);
      console.log(`   1. Visit /admin/excel-configurations to review the migrated configurations`);
      console.log(`   2. Test each configuration with sample Excel files`);
      console.log(`   3. Adjust coordinates if needed using the configuration wizard`);
      console.log(`   4. The system will now use these database configurations instead of hardcoded ones`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateConfigurations();