// Cara pakai: node scripts/test-admin-login.js password_yang_mau_dicoba
// Ini baca langsung dari .env.local dan ngecek apakah passwordnya cocok
// sama ADMIN_PASSWORD_HASH_B64 yang tersimpan di situ — buat debug doang,
// gak nyentuh server/browser sama sekali.

const fs = require('fs');
const bcrypt = require('bcryptjs');

const testPassword = process.argv[2];

if (!testPassword) {
    console.log('\nPakai: node scripts/test-admin-login.js password_yang_mau_dicoba\n');
    process.exit(1);
}

if (!fs.existsSync('.env.local')) {
    console.log('\nFile .env.local gak ketemu di folder ini. Pastiin jalanin script ini dari root project.\n');
    process.exit(1);
}

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};

envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    env[key] = value;
});

console.log('\n--- Isi .env.local yang kebaca ---');
console.log('ADMIN_EMAIL:', JSON.stringify(env.ADMIN_EMAIL));
console.log('ADMIN_PASSWORD_HASH_B64 ada?:', Boolean(env.ADMIN_PASSWORD_HASH_B64));
console.log('ADMIN_SESSION_SECRET ada?:', Boolean(env.ADMIN_SESSION_SECRET));

const decodedHash = env.ADMIN_PASSWORD_HASH_B64
    ? Buffer.from(env.ADMIN_PASSWORD_HASH_B64, 'base64').toString('utf8')
    : '';
console.log('Hash setelah di-decode:', decodedHash);
console.log('Panjang hash setelah di-decode:', decodedHash.length, '(harusnya 60)');

console.log('\n--- Hasil tes ---');
const matches = bcrypt.compareSync(testPassword, decodedHash);
console.log(`Password "${testPassword}" cocok?`, matches ? 'YA, COCOK ✅' : 'TIDAK COCOK ❌');
console.log('');