import { z } from 'zod';

const bigIntSchema = z.preprocess((val) => {
    if (typeof val === "string" || typeof val === "number") return BigInt(val);
    return val;
}, z.bigint());

export const UserSchema = z.object({
    username: z.string()
        .min(3)
        .max(50)
        .regex(/^[a-zA-Z0-9_]+$/)
        .nullable()
        .optional(),

    email: z.string()
        .email()
        .max(100)
        .nullable()
        .optional(),

    password: z.string()
        .min(8)
        .max(255)
        .nullable()
        .optional(),

    namaLengkap: z.string()
        .max(100)
        .nullable()
        .optional(),

    hp: z.string()
        .max(50)
        .nullable()
        .optional(),

    jabatan: z.string()
        .max(255)
        .nullable()
        .optional(),

    statusAktif: z.enum(['Y', 'N']).default('Y'),

    idUserGroup: z.array(z.number().int())
        .min(1, "Minimal pilih satu grup")
        .optional()
        .or(z.number().int().array().nullable()),
    grup: z.string().max(255).nullable().optional(),

    kodePro: bigIntSchema.nullable().optional(),
    kodeKab: bigIntSchema.nullable().optional(),
    kodeKec: bigIntSchema.nullable().optional(),
    kodeKel: bigIntSchema.nullable().optional(),

    passwordTemp: z.string().max(255).nullable().optional(),
    ktp: z.string().max(50).nullable().optional(),
    jenisKelamin: z.string().max(100).nullable().optional(),
    wilayahTingkat: z.number().int().nullable().optional(),
    photo: z.string().max(255).nullable().optional(),

    namaPro: z.string().max(255).nullable().optional(),
    namaKab: z.string().max(255).nullable().optional(),
    namaKec: z.string().max(255).nullable().optional(),
    namaKel: z.string().max(255).nullable().optional(),

    registeredFrom: z.string().max(100).default("REGISTER"),
    deviceId: z.string().max(200).nullable().optional(),
    flagKetua: z.enum(['Y', 'N']).default('N'),

    createdAt: z.date().optional(),
    sysIpAddress: z.string().max(50).nullable().optional(),
    sysLoginTime: z.date().nullable().optional(),
    lastLogout: z.date().nullable().optional(),
});

export const CreateUserSchema = UserSchema.extend({
    email: z.string().email().max(100),
    username: z.string().min(3).max(50),
    password: z.string().min(8)
});

export const UpdateUserSchema = UserSchema.partial();

export const UserGroupSchema = z.object({
    namaUserGroup: z.string().min(3).max(255)
});

export const UserGroupMappingSchema = z.object({
    userId: z.number().int(),
    idUserGroup: z.number().int()
});