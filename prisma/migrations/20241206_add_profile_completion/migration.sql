-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileCompletedAt" TIMESTAMP(3),
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "shippingCity" TEXT,
ADD COLUMN     "shippingCountry" TEXT,
ADD COLUMN     "shippingName" TEXT,
ADD COLUMN     "shippingState" TEXT,
ADD COLUMN     "shippingZip" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "device_fingerprints" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_fingerprints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "device_fingerprints_fingerprint_key" ON "device_fingerprints"("fingerprint");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "device_fingerprints_user_id_idx" ON "device_fingerprints"("user_id");

-- AddForeignKey
ALTER TABLE "device_fingerprints" ADD CONSTRAINT "device_fingerprints_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

