UPDATE "excel_upload_configurations"
SET
  "nameColumn" = 3,
  "firstDateColumn" = 4,
  "lastDateColumn" = 34,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE
  "name" = 'Default Producer Schedule (Coordonatori)'
  AND "role" = 'PRODUCER'
  AND "dateRow" = 8
  AND "nameColumn" = 1
  AND "firstNameRow" = 9
  AND "lastNameRow" = 11
  AND "firstDateColumn" = 2
  AND "lastDateColumn" = 31;
