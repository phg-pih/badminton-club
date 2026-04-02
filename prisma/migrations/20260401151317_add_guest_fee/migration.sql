-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "courtCost" REAL NOT NULL DEFAULT 0,
    "shuttleCost" REAL NOT NULL DEFAULT 0,
    "waterCost" REAL NOT NULL DEFAULT 0,
    "guestFee" REAL NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Session" ("courtCost", "createdAt", "date", "id", "notes", "shuttleCost", "waterCost") SELECT "courtCost", "createdAt", "date", "id", "notes", "shuttleCost", "waterCost" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
