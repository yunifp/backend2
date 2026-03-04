import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100, 
    message: {
        status: 429,
        message: 'Terlalu banyak permintaan, silakan coba lagi setelah 15 menit'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 25,
    message: {
        status: 429,
        message: 'Terlalu banyak percobaan login, silakan coba lagi setelah 1 jam'
    },
    standardHeaders: true,
    legacyHeaders: false,
});