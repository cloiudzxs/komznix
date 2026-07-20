// Cara pakai: node scripts/hash-admin-password.js password_kamu
// Hasilnya di-paste ke .env.local sebagai ADMIN_PASSWORD_HASH_B64.
// Password ASLI-nya sendiri gak pernah ditulis di mana pun setelah ini.

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
    console.log('\nPakai: node scripts/hash-admin-password.js password_kamu\n');
    process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);

// Hash bcrypt isinya banyak tanda "$" (mis. $2b$10$...), dan Next.js
// otomatis nerjemahin "$sesuatu" di file .env sebagai referensi ke variabel
// lain — jadi hash-nya bisa kepotong diam-diam. Buat ngehindarin itu
// sepenuhnya (bukan cuma di-escape), hash-nya di-encode ke Base64 dulu,
// yang isinya cuma huruf/angka/+/=, gak ada tanda "$" sama sekali.
const encoded = Buffer.from(hash, 'utf8').toString('base64');

console.log('\nTaruh baris ini di .env.local:\n');
console.log(`ADMIN_PASSWORD_HASH_B64=${encoded}\n`);