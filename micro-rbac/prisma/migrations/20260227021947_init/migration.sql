/*
  Warnings:

  - You are about to drop the `Permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_RolePermissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_UserRoles` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_RolePermissions` DROP FOREIGN KEY `_RolePermissions_A_fkey`;

-- DropForeignKey
ALTER TABLE `_RolePermissions` DROP FOREIGN KEY `_RolePermissions_B_fkey`;

-- DropForeignKey
ALTER TABLE `_UserRoles` DROP FOREIGN KEY `_UserRoles_A_fkey`;

-- DropForeignKey
ALTER TABLE `_UserRoles` DROP FOREIGN KEY `_UserRoles_B_fkey`;

-- DropTable
DROP TABLE `Permission`;

-- DropTable
DROP TABLE `Role`;

-- DropTable
DROP TABLE `User`;

-- DropTable
DROP TABLE `_RolePermissions`;

-- DropTable
DROP TABLE `_UserRoles`;

-- CreateTable
CREATE TABLE `ref_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_user_group` INTEGER NULL,
    `id_kategori_grup` INTEGER NULL,
    `grup` VARCHAR(191) NULL,
    `username` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `nama_lengkap` VARCHAR(191) NULL,
    `hp` VARCHAR(191) NULL,
    `jabatan` VARCHAR(191) NULL,
    `status_aktif` ENUM('Y', 'N') NOT NULL DEFAULT 'Y',
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sys_ip_address` VARCHAR(191) NULL,
    `sys_login_time` DATETIME(3) NULL,
    `last_logout` DATETIME(3) NULL,

    UNIQUE INDEX `ref_users_id_user_group_key`(`id_user_group`),
    UNIQUE INDEX `ref_users_username_key`(`username`),
    UNIQUE INDEX `ref_users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_menu` (
    `id_menu` INTEGER NOT NULL AUTO_INCREMENT,
    `parrent` INTEGER NULL,
    `nama_menu` VARCHAR(191) NULL,
    `link` VARCHAR(191) NULL,
    `urutan` INTEGER NULL,
    `icon` TEXT NULL,
    `class_active` VARCHAR(191) NULL,

    PRIMARY KEY (`id_menu`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ref_group_menu` (
    `id_group_menu` INTEGER NOT NULL AUTO_INCREMENT,
    `id_user_group` INTEGER NULL,
    `id_menu` INTEGER NULL,
    `role` VARCHAR(10) NULL,

    INDEX `ref_group_menu_id_user_group_idx`(`id_user_group`),
    INDEX `ref_group_menu_id_menu_idx`(`id_menu`),
    PRIMARY KEY (`id_group_menu`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ref_group_menu` ADD CONSTRAINT `ref_group_menu_id_user_group_fkey` FOREIGN KEY (`id_user_group`) REFERENCES `ref_users`(`id_user_group`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ref_group_menu` ADD CONSTRAINT `ref_group_menu_id_menu_fkey` FOREIGN KEY (`id_menu`) REFERENCES `ref_menu`(`id_menu`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `ref_users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
