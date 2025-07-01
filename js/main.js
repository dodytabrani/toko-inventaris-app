// js/main.js
import { supabase } from './supabaseClient.js';
import { checkUserRoleAndRedirect, setupAuthListeners } from './auth.js';
import { setupAdminListeners } from './admin.js';
import { setupInventoryListeners } from './inventory.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Setup semua event listeners dari modul
    setupAuthListeners();
    setupAdminListeners();
    setupInventoryListeners();

    // Inisialisasi status aplikasi berdasarkan sesi user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await checkUserRoleAndRedirect(user);
    } else {
        // Jika belum login, tampilkan halaman autentikasi
        // Ini akan ditangani oleh showAuthSection di ui.js yang dipanggil via setupAuthListeners
    }
});