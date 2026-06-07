-- CreateTable
CREATE TABLE "econ_params" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "econ_params_pkey" PRIMARY KEY ("key")
);
