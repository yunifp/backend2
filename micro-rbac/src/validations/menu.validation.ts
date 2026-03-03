import { link } from 'node:fs';
import { z } from 'zod';

export const CreateMenuSchema = z.object({
    namaMenu: z.string().min(1, "Nama menu wajib diisi").max(255),
    link: z.string().nullable().optional().transform(val => val === "" ? null : val),
    linkEndpoint: z.string().nullable().optional().transform(val => val === "" ? null : val),
    urutan: z.preprocess((val) => Number(val), z.number().int()),
    parent: z.preprocess((val) => (val === "" || val === null ? null : Number(val)), z.number().int().nullable()),
    icon: z.string().nullable().optional(),
    classActive: z.string().nullable().optional(),
    permissions: z.array(z.string()).default(['R']) // Default Read
});

// Update schema menggunakan partial() agar field yang tidak diubah tidak error
export const UpdateMenuSchema = CreateMenuSchema.partial().extend({
    // Pastikan urutan dan parent tetap bisa diproses jika ada
    urutan: z.preprocess((val) => Number(val), z.number().int()).optional(),
    parent: z.preprocess((val) => (val === "" || val === null ? null : Number(val)), z.number().int().nullable()).optional(),
});

export const GroupMenuSchema = z.object({
    idUserGroup: z.number().int(),
    idMenu: z.number().int(),
    // Di skema baru, role mungkin dikirim sebagai string gabungan ('CRUD')
    role: z.string().max(10).optional(),
});

export const GroupMenuActionPayloadSchema = z.object({
    action: z.enum(['GET_BY_GROUP', 'ASSIGN_MENU', 'REMOVE_MENU', 'SYNC_ACCESS']),
    idUserGroup: z.number().int().optional(),
    idGroupMenu: z.number().int().optional(),
    data: z.any().optional()
});