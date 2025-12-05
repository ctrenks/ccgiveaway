-- DropIndex (remove old unique constraint on tcgPlayerId alone)
DROP INDEX IF EXISTS "Product_tcgPlayerId_key";

-- CreateIndex (add composite unique constraint on tcgPlayerId + isFoil)
CREATE UNIQUE INDEX "Product_tcgPlayerId_isFoil_key" ON "Product"("tcgPlayerId", "isFoil");
