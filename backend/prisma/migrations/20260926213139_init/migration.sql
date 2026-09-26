-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FARMER', 'AGRONOMIST');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'FARMER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Field" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "areaAcres" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "pincode" TEXT,
    "cropType" TEXT,
    "cropVariety" TEXT,
    "growthStage" TEXT,
    "sowingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoilTest" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "n" DOUBLE PRECISION NOT NULL,
    "p" DOUBLE PRECISION NOT NULL,
    "k" DOUBLE PRECISION NOT NULL,
    "ph" DOUBLE PRECISION NOT NULL,
    "organicCarbon" DOUBLE PRECISION NOT NULL,
    "moisture" DOUBLE PRECISION NOT NULL,
    "testedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoilTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FertilizerLog" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantityKgPerAcre" DOUBLE PRECISION NOT NULL,
    "appliedOn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FertilizerLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "soilTestId" TEXT NOT NULL,
    "cropType" TEXT NOT NULL,
    "cropVariety" TEXT,
    "growthStage" TEXT NOT NULL,
    "fertilizerType" TEXT NOT NULL,
    "quantityKgPerAcre" DOUBLE PRECISION NOT NULL,
    "schedule" JSONB NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "riskReason" TEXT NOT NULL,
    "soilHealthImpact" TEXT,
    "yieldImpact" TEXT,
    "explanation" JSONB,
    "weatherSource" TEXT,
    "inputSnapshot" JSONB,
    "topFactors" TEXT[],
    "estimatedCost" DOUBLE PRECISION,
    "estimatedSaving" DOUBLE PRECISION,
    "modelVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "Farm_ownerId_idx" ON "Farm"("ownerId");

-- CreateIndex
CREATE INDEX "Field_farmId_idx" ON "Field"("farmId");

-- CreateIndex
CREATE INDEX "SoilTest_fieldId_testedOn_idx" ON "SoilTest"("fieldId", "testedOn");

-- CreateIndex
CREATE INDEX "FertilizerLog_fieldId_appliedOn_idx" ON "FertilizerLog"("fieldId", "appliedOn");

-- CreateIndex
CREATE INDEX "Recommendation_fieldId_createdAt_idx" ON "Recommendation"("fieldId", "createdAt");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SoilTest" ADD CONSTRAINT "SoilTest_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FertilizerLog" ADD CONSTRAINT "FertilizerLog_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "Field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recommendation" ADD CONSTRAINT "Recommendation_soilTestId_fkey" FOREIGN KEY ("soilTestId") REFERENCES "SoilTest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
