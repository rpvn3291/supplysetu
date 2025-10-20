/*
  Warnings:

  - You are about to drop the `supplier_profiles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vendor_profiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'ADMIN';

-- DropForeignKey
ALTER TABLE "public"."supplier_profiles" DROP CONSTRAINT "supplier_profiles_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."vendor_profiles" DROP CONSTRAINT "vendor_profiles_userId_fkey";

-- DropTable
DROP TABLE "public"."supplier_profiles";

-- DropTable
DROP TABLE "public"."users";

-- DropTable
DROP TABLE "public"."vendor_profiles";

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 3.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VendorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "foodType" TEXT,
    "operatingHours" JSONB,

    CONSTRAINT "VendorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SupplierProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "warehouseAddress" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "gstId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "deliveryVehicles" TEXT[],
    "minOrderValue" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "SupplierProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VendorProfile_userId_key" ON "public"."VendorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProfile_userId_key" ON "public"."SupplierProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProfile_gstId_key" ON "public"."SupplierProfile"("gstId");

-- AddForeignKey
ALTER TABLE "public"."VendorProfile" ADD CONSTRAINT "VendorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SupplierProfile" ADD CONSTRAINT "SupplierProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
