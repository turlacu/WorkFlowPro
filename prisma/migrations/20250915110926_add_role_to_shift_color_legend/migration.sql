-- AddColumn
ALTER TABLE "shift_color_legends" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'OPERATOR';

-- DropIndex
DROP INDEX "shift_color_legends_colorCode_key";

-- CreateIndex
CREATE UNIQUE INDEX "shift_color_legends_colorCode_role_key" ON "shift_color_legends"("colorCode", "role");