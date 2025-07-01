// js/utils.js

export function generateUniqueItemCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const length = 8;
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Fungsi pembantu lainnya bisa ditambahkan di sini
// Misalnya, fungsi format mata uang, dll.