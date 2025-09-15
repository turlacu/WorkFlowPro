-- CreateTable
CREATE TABLE "excel_upload_configurations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "dateRow" INTEGER NOT NULL,
    "dayLabelRow" INTEGER,
    "nameColumn" INTEGER NOT NULL,
    "firstNameRow" INTEGER NOT NULL,
    "lastNameRow" INTEGER NOT NULL,
    "firstDateColumn" INTEGER NOT NULL,
    "lastDateColumn" INTEGER NOT NULL,
    "dynamicColumns" BOOLEAN NOT NULL DEFAULT true,
    "skipValues" JSONB NOT NULL DEFAULT '[]',
    "validPatterns" JSONB NOT NULL DEFAULT '[]',
    "colorDetection" BOOLEAN NOT NULL DEFAULT true,
    "defaultShift" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "excel_upload_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_configuration_logs" (
    "id" TEXT NOT NULL,
    "configurationId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "entriesCount" INTEGER NOT NULL,
    "successCount" INTEGER NOT NULL,
    "errorCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_configuration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "excel_upload_configurations_name_role_key" ON "excel_upload_configurations"("name", "role");

-- AddForeignKey
ALTER TABLE "excel_upload_configurations" ADD CONSTRAINT "excel_upload_configurations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_configuration_logs" ADD CONSTRAINT "upload_configuration_logs_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "excel_upload_configurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_configuration_logs" ADD CONSTRAINT "upload_configuration_logs_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;