document.addEventListener('DOMContentLoaded', async () => {
// --- 1. INISIALISASI SUPABASE ---
// GANTI DENGAN KREDENSIAL PROYEK SUPABASE ANDA YANG BARU!
const SUPABASE_URL = 'https://sjxhosrvcmejqprooofk.supabase.co'; // Contoh: 'https://abcdefghijk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGhvc3J2Y21lanFwcm9vb2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzIxMzEsImV4cCI6MjA2NjgwODEzMX0.n3RmP7ouaZSPBuymRi6axXWZQc_DJKi2gX0VEeV3o4U'; // Contoh: 'eyJhbGciOiJIUzI1NiI...'

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 2. REFERENSI ELEMEN HTML ---
// Pastikan ID ini cocok persis dengan yang ada di index.html
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const adminLoginSection = document.getElementById('admin-login-section');
const adminPanelSection = document.getElementById('admin-panel-section');

// Autentikasi
const signupEmailInput = document.getElementById('signupEmail');
const signupPasswordInput = document.getElementById('signupPassword');
const signupBtn = document.getElementById('signupBtn');
const signupMessage = document.getElementById('signupMessage');

const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn'); // Untuk tombol login di form
const loginMessage = document.getElementById('loginMessage');

const mainLoginBtn = document.getElementById('mainLoginBtn'); // Tombol Login/Daftar di header
const mainLogoutBtn = document.getElementById('mainLogoutBtn'); // Tombol Logout di header

const logoutBtn = document.getElementById('logoutBtn'); // Tombol Logout di app-section
const userEmailSpan = document.getElementById('userEmail');
const licenseStatusP = document.getElementById('license-status');

// Admin
const adminEmailInput = document.getElementById('adminEmail');
const adminPasswordInput = document.getElementById('adminPassword');
const adminLoginBtn = document.getElementById('adminLoginBtn'); // ID diperbaiki
const adminLoginMessage = document.getElementById('adminLoginMessage'); // ID diperbaiki

const licensesTableBody = document.getElementById('licenses-table-body'); // ID diperbaiki
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const refreshLicensesBtn = document.getElementById('refreshLicensesBtn');

// Inventaris User
const inventarisDataDiv = document.getElementById('inventaris-data');
const addInventarisBtn = document.getElementById('addInventarisBtn');

const addInventarisForm = document.getElementById('add-inventaris-form');
const itemNameInput = document.getElementById('itemName');
const itemQuantityInput = document.getElementById('itemQuantity');

// HAPUS BARIS INI: const itemPriceInput = document.getElementById('itemPrice');
// GANTI DENGAN YANG BARU INI:
const itemUnitTypeInput = document.getElementById('itemUnitType'); // <-- BARU: PASTIKAN INI ADA
const itemCostPriceInput = document.getElementById('itemCostPrice'); // <-- BARU: PASTIKAN INI ADA
const itemSellingPriceInput = document.getElementById('itemSellingPrice'); // <-- BARU: PASTIKAN INI ADA (ini menggantikan itemPriceInput)

const saveInventarisBtn = document.getElementById('saveInventarisBtn');
const cancelAddInventarisBtn = document.getElementById('cancelAddInventarisBtn');
const inventarisFormMessage = document.getElementById('inventaris-form-message');

// --- Referensi Elemen Modal Edit ---
const editItemModal = document.getElementById('editItemModal');
const closeEditModalBtn = document.querySelector('#editItemModal .close-button');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editItemForm = document.getElementById('editItemForm');
const editItemId = document.getElementById('editItemId');
const editItemCode = document.getElementById('editItemCode'); // <-- Sudah benar
const editItemName = document.getElementById('editItemName');
const editQuantity = document.getElementById('editQuantity');
const editUnitType = document.getElementById('editUnitType'); // <-- Sudah benar
const editCostPrice = document.getElementById('editCostPrice'); // <-- Sudah benar
// const editPrice = document.getElementById('editPrice'); // <-- Ini sudah benar dikomentari/dihapus
const editSellingPrice = document.getElementById('editSellingPrice'); // <-- Sudah benar

// --- Fungsi Pembantu ---
function generateUniqueItemCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const length = 8; // Anda bisa sesuaikan panjang kode item
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
// --- 3. FUNGSI UTAMA ---

// Cek Status Autentikasi Saat Memuat Halaman
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        // Jika user sudah login, cek peran
        await checkUserRoleAndRedirect(user);
    } else {
        // Jika belum login, tampilkan halaman autentikasi
        authSection.style.display = 'block';
        appSection.style.display = 'none';
        adminPanelSection.style.display = 'none';
        adminLoginSection.style.display = 'block'; // Tampilkan juga form admin login
        mainLoginBtn.style.display = 'inline-block';
        mainLogoutBtn.style.display = 'none';
    }
});

// Periksa Peran User dan Redirect
async function checkUserRoleAndRedirect(user) {
    if (!user) {
        console.error("User is null in checkUserRoleAndRedirect");
        return;
    }

    const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error("Error fetching user role:", error.message);
        // Jika error atau role tidak ditemukan, asumsikan user biasa
        showUserApp();
        return;
    }

    if (data && data.role === 'admin') {
        showAdminPanel();
    } else {
        showUserApp();
    }
}

// Tampilkan Aplikasi User (setelah login)
async function showUserApp() {
    authSection.style.display = 'none';
    adminLoginSection.style.display = 'none';
    adminPanelSection.style.display = 'none';
    appSection.style.display = 'block';
    addInventarisForm.style.display = 'none'; // Pastikan form inventaris tersembunyi
    mainLoginBtn.style.display = 'none';
    mainLogoutBtn.style.display = 'inline-block';

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        userEmailSpan.textContent = user.email;
    }
    await checkLicenseStatus();
    await loadInventarisData(); // Muat data inventaris saat user masuk
}

// Tampilkan Panel Admin (setelah admin login)
async function showAdminPanel() {
    authSection.style.display = 'none';
    adminLoginSection.style.display = 'none';
    appSection.style.display = 'none';
    adminPanelSection.style.display = 'block';
    mainLoginBtn.style.display = 'none';
    mainLogoutBtn.style.display = 'inline-block'; // Admin juga bisa logout dari header

    await loadLicensesData();
}

// Periksa Status Lisensi User
async function checkLicenseStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        licenseStatusP.textContent = 'Tidak ada user login.';
        licenseStatusP.className = 'message error';
        addInventarisBtn.style.display = 'none'; // Sembunyikan tombol tambah jika tidak ada user
        return;
    }

    const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error("Error checking license:", error.message);
        licenseStatusP.textContent = 'Gagal memeriksa lisensi. Harap coba lagi.';
        licenseStatusP.className = 'message error';
        addInventarisBtn.style.display = 'none';
    } else if (!data) {
        licenseStatusP.textContent = 'Lisensi Anda belum aktif. Hubungi admin untuk aktivasi.';
        licenseStatusP.className = 'message error';
        addInventarisBtn.style.display = 'none'; // Sembunyikan tombol tambah jika lisensi tidak aktif
    } else if (!data.is_active || new Date(data.expiry_date) < new Date()) {
        licenseStatusP.textContent = `Lisensi Anda tidak aktif atau sudah kadaluarsa pada ${new Date(data.expiry_date).toLocaleDateString()}.`;
        licenseStatusP.className = 'message error';
        addInventarisBtn.style.display = 'none'; // Sembunyikan tombol tambah jika lisensi tidak aktif/kadaluarsa
    } else {
        licenseStatusP.textContent = `Lisensi Anda aktif hingga ${new Date(data.expiry_date).toLocaleDateString()}.`;
        licenseStatusP.className = 'message success';
        addInventarisBtn.style.display = 'inline-block'; // Tampilkan tombol tambah jika lisensi aktif
    }
}

// Muat Data Lisensi untuk Admin Panel
async function loadLicensesData() {
    const { data, error } = await supabase
        .from('licenses')
        .select(`
            *,
            users ( email ) // Join dengan tabel users untuk mendapatkan email
        `);

    if (error) {
        console.error("Error loading licenses:", error.message);
        licensesTableBody.innerHTML = '<tr><td colspan="5" class="message error">Gagal memuat data lisensi.</td></tr>';
    } else {
        licensesTableBody.innerHTML = ''; // Kosongkan tabel
        if (data.length === 0) {
            licensesTableBody.innerHTML = '<tr><td colspan="5">Belum ada lisensi terdaftar.</td></tr>';
        } else {
            data.forEach(license => {
                const row = `
                    <tr>
                        <td>${license.users ? license.users.email : 'N/A'}</td>
                        <td>${license.id}</td>
                        <td>${license.is_active ? 'Aktif' : 'Tidak Aktif'}</td>
                        <td>${license.expiry_date ? new Date(license.expiry_date).toLocaleDateString() : 'N/A'}</td>
                        <td>
                            <button onclick="toggleLicenseStatus('${license.id}', ${license.is_active})" class="toggle-btn">
                                ${license.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                            <button onclick="extendLicense('${license.id}')" class="extend-btn">Perpanjang 1 Bulan</button>
                            <button onclick="deleteLicense('${license.id}')" class="delete-btn">Hapus</button>
                        </td>
                    </tr>
                `;
                licensesTableBody.innerHTML += row;
            });
        }
    }
}

// Toggle Status Lisensi (Aktif/Nonaktif)
async function toggleLicenseStatus(licenseId, currentStatus) {
    const { error } = await supabase
        .from('licenses')
        .update({ is_active: !currentStatus })
        .eq('id', licenseId);

    if (error) {
        console.error("Error toggling license status:", error.message);
        alert('Gagal mengubah status lisensi: ' + error.message);
    } else {
        alert('Status lisensi berhasil diubah.');
        await loadLicensesData(); // Muat ulang data
    }
}

// Perpanjang Lisensi
async function extendLicense(licenseId) {
    const { data: license, error: fetchError } = await supabase
        .from('licenses')
        .select('expiry_date')
        .eq('id', licenseId)
        .single();

    if (fetchError) {
        console.error("Error fetching license for extension:", fetchError.message);
        alert('Gagal mengambil data lisensi: ' + fetchError.message);
        return;
    }

    let currentExpiryDate = license.expiry_date ? new Date(license.expiry_date) : new Date();
    currentExpiryDate.setMonth(currentExpiryDate.getMonth() + 1); // Tambah 1 bulan

    const { error: updateError } = await supabase
        .from('licenses')
        .update({ is_active: true, expiry_date: currentExpiryDate.toISOString() })
        .eq('id', licenseId);

    if (updateError) {
        console.error("Error memperpanjang lisensi:", updateError.message);
        alert('Gagal memperpanjang lisensi: ' + updateError.message);
    } else {
        alert('Lisensi berhasil diperpanjang 1 bulan.');
        await loadLicensesData(); // Muat ulang data
    }
}

// Hapus Lisensi
async function deleteLicense(licenseId) {
    if (!confirm('Anda yakin ingin menghapus lisensi ini?')) {
        return;
    }
    const { error } = await supabase
        .from('licenses')
        .delete()
        .eq('id', licenseId);

    if (error) {
        console.error("Error menghapus lisensi:", error.message);
        alert('Gagal menghapus lisensi: ' + error.message);
    } else {
        alert('Lisensi berhasil dihapus.');
        await loadLicensesData(); // Muat ulang data
    }
}

// --- PASTIkan tidak ada 'let inventarisDataCache = [];' atau 'const loadedInventaris = ...' di atas ini ---

// --- Fungsi Pembantu (Harus ada di tempat lain di script Anda, sebelum dipanggil) ---
// Fungsi ini penting karena dipanggil di 'saveInventarisBtn' click handler.
// Jika belum ada di script lengkap Anda, pastikan untuk menambahkannya.
function generateUniqueItemCode() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 7);
    return `ITEM-${timestamp}-${randomPart}`.toUpperCase();
}

// Fungsi untuk memeriksa peran pengguna dan mengarahkan (juga harus ada di script lengkap Anda)
async function checkUserRoleAndRedirect(user) {
    const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error("Error fetching user role:", error.message);
        // Default ke tampilan user jika ada error atau role tidak ditemukan
        // Pastikan fungsi showAppSection() didefinisikan di tempat lain
        showAppSection();
        return;
    }

    if (userData && userData.role === 'admin') {
        // Pastikan fungsi showAdminPanel() didefinisikan di tempat lain
        showAdminPanel();
    } else {
        showAppSection();
    }
}

// Fungsi placeholder untuk loadLicensesData (juga harus ada di script lengkap Anda)
async function loadLicensesData() {
    console.log("Memuat data lisensi (untuk admin)...");
    // Implementasi detailnya harus Anda tambahkan
}

// Fungsi placeholder untuk showAppSection dan showAdminPanel
// Pastikan fungsi-fungsi ini didefinisikan di script lengkap Anda
function showAppSection() {
    console.log("Menampilkan bagian aplikasi user.");
    // Tambahkan logika untuk menampilkan/menyembunyikan elemen HTML yang relevan
    // authSection.style.display = 'none';
    // appSection.style.display = 'block';
    // adminPanelSection.style.display = 'none';
    // mainLoginBtn.style.display = 'none';
    // mainLogoutBtn.style.display = 'inline-block';
    // loadInventarisData(); // Panggil dengan parameter default setelah login
}

function showAdminPanel() {
    console.log("Menampilkan panel admin.");
    // Tambahkan logika untuk menampilkan/menyembunyikan elemen HTML yang relevan
    // authSection.style.display = 'none';
    // appSection.style.display = 'none';
    // adminPanelSection.style.display = 'block';
    // mainLoginBtn.style.display = 'none';
    // mainLogoutBtn.style.display = 'inline-block';
    // loadLicensesData();
}

// --- BARU: Deklarasi Variabel DOM untuk Pencarian dan Filter ---
// Asumsi variabel-variabel DOM lainnya (inventarisDataDiv, addInventarisBtn, dll.)
// sudah dideklarasikan di bagian atas script Anda.
// Anda perlu menambahkan ini:
const searchInput = document.getElementById('search-item-input');
const unitTypeFilter = document.getElementById('unit-type-filter');


// Muat Data Inventaris
async function loadInventarisData(searchTerm = '', filterUnitType = '') { // <<<--- MODIFIKASI: Tambah parameter dengan nilai default
    const { data: { user } = {} } = await supabase.auth.getUser(); // Tambah default empty object untuk data
    if (!user) {
        inventarisDataDiv.innerHTML = '<p>Anda harus login untuk melihat inventaris.</p>';
        addInventarisBtn.style.display = 'none';
        return;
    }

    // Cek lagi status lisensi, kalau belum aktif, jangan muat data
    const { data: license } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!license || !license.is_active || new Date(license.expiry_date) < new Date()) {
        inventarisDataDiv.innerHTML = '<p>Akses inventaris ditolak: Lisensi tidak aktif atau sudah kadaluarsa.</p>';
        addInventarisBtn.style.display = 'none';
        return;
    } else {
        addInventarisBtn.style.display = 'inline-block';
    }

    let query = supabase
        .from('inventories')
        .select('*')
        .eq('user_id', user.id);

    // --- MULAI PENAMBAHAN LOGIKA PENCARIAN & FILTER DI SINI ---
    if (searchTerm) {
        query = query.or(`item_code.ilike.%${searchTerm}%,item_name.ilike.%${searchTerm}%`);
    }

    if (filterUnitType) {
        query = query.eq('unit_type', filterUnitType);
    }
    // --- AKHIR PENAMBAHAN LOGIKA PENCARIAN & FILTER ---

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
        console.error("Error loading inventaris:", error.message);
        inventarisDataDiv.innerHTML = '<p class="message error">Gagal memuat data inventaris. Pastikan RLS diatur dengan benar.</p>';
    } else {
        if (data.length === 0) {
            // MODIFIKASI: Pesan berbeda jika ada pencarian/filter tapi tidak ada hasil
            if (searchTerm || filterUnitType) {
                inventarisDataDiv.innerHTML = '<p>Tidak ada item inventaris yang cocok dengan kriteria pencarian/filter Anda.</p>';
            } else {
                inventarisDataDiv.innerHTML = '<p>Anda belum memiliki item inventaris. Klik "Tambah Item" untuk memulai.</p>';
            }
        } else {
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Kode Item</th>
                            <th>Nama Item</th>
                            <th>Jumlah</th>
                            <th>Satuan</th>
                            <th>Harga Modal</th>
                            <th>Harga Jual</th>
                            <th>Keuntungan/Item</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            data.forEach(item => {
                const profitPerItem = (item.selling_price || 0) - (item.cost_price || 0);
                const formattedCostPrice = item.cost_price ? `Rp ${item.cost_price.toLocaleString('id-ID')}` : 'Rp 0';
                const formattedSellingPrice = item.selling_price ? `Rp ${item.selling_price.toLocaleString('id-ID')}` : 'Rp 0';
                const formattedProfit = `Rp ${profitPerItem.toLocaleString('id-ID')}`;

                html += `
                    <tr>
                        <td data-label="Kode Item">${item.item_code || 'N/A'}</td>
                        <td data-label="Nama Item">${item.item_name}</td>
                        <td data-label="Jumlah">${item.quantity}</td>
                        <td data-label="Satuan">${item.unit_type || 'pcs'}</td>
                        <td data-label="Harga Modal">${formattedCostPrice}</td>
                        <td data-label="Harga Jual">${formattedSellingPrice}</td>
                        <td data-label="Keuntungan/Item" class="${profitPerItem < 0 ? 'text-red' : (profitPerItem > 0 ? 'text-green' : '')}">${formattedProfit}</td>
                        <td data-label="Aksi">
                            <button class="edit-item-btn" data-id="${item.id}">Edit</button>
                            <button class="delete-item-btn" data-id="${item.id}">Hapus</button>
                        </td>
                    </tr>
                `;
            });
            html += `
                    </tbody>
                </table>
            `;
            inventarisDataDiv.innerHTML = html;

            // --- PENTING: TIDAK ADA lagi event listener .forEach() di sini ---
        }
    }
}

// --- Event Listener Delegasi Baru (yang menggantikan forEach lama) ---
// Letakkan blok kode ini SETELAH fungsi loadInventarisData() Anda,
// di tempat yang akan dijalankan ketika halaman dimuat (misalnya, di dekat bagian bawah file script.js Anda).
inventarisDataDiv.addEventListener('click', async (e) => {
    // Cek apakah yang diklik adalah tombol Edit
    if (e.target.matches('.edit-item-btn')) {
        const itemId = e.target.dataset.id;
        console.log('ID Item yang diklik:', itemId); // Untuk debugging

        // Ambil data item yang spesifik dari Supabase (ini yang mengatasi masalah 'data.find')
        const { data: itemToEdit, error } = await supabase
            .from('inventories')
            .select('*')
            .eq('id', itemId)
            .single(); // Mengambil hanya satu item berdasarkan ID-nya

        if (error) {
            console.error("Error fetching item for edit:", error.message);
            alert('Gagal mengambil detail item untuk diedit. Pastikan RLS Supabase Anda benar.');
            return;
        }

        if (itemToEdit) {
            console.log('Item berhasil ditemukan:', itemToEdit); // Untuk debugging
            openEditModal(itemToEdit);
        } else {
            console.error('Item with ID not found (after re-fetch):', itemId);
            alert('Item tidak ditemukan atau ada masalah saat memuat data. Mohon cek kembali.');
        }
    }

    // Cek apakah yang diklik adalah tombol Hapus
    if (e.target.matches('.delete-item-btn')) {
        const itemId = e.target.dataset.id;
        console.log('Tombol Hapus diklik untuk ID:', itemId); // Untuk debugging

        if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
            const { error: deleteError } = await supabase
                .from('inventories')
                .delete()
                .eq('id', itemId);

            if (deleteError) {
                console.error("Error deleting inventaris:", deleteError.message);
                alert('Gagal menghapus item: ' + deleteError.message);
            } else {
                alert('Item berhasil dihapus!');
                loadInventarisData(); // Muat ulang data setelah penghapusan
            }
        }
    }
});
// Letakkan kode ini SETELAH fungsi loadInventarisData() Anda,
// di tempat yang akan dijalankan ketika halaman dimuat (misalnya, paling bawah file).

inventarisDataDiv.addEventListener('touchend', async (e) => {
    // Cek apakah yang diklik adalah tombol Edit
    if (e.target.matches('.edit-item-btn')) {
        const itemId = e.target.dataset.id;
        // console.log('Tombol Edit diklik untuk ID:', itemId); // Baris ini bisa dihapus nanti setelah yakin berfungsi

        // Penting: Ambil data item yang spesifik dari Supabase (ini yang mengatasi masalah 'data.find')
        const { data: itemToEdit, error } = await supabase
            .from('inventories')
            .select('*')
            .eq('id', itemId)
            .single(); // Mengambil hanya satu item berdasarkan ID-nya

        if (error) {
            console.error("Error fetching item for edit:", error.message);
            alert('Gagal mengambil detail item untuk diedit. Pastikan RLS Anda benar.');
            return;
        }

        if (itemToEdit) {
            openEditModal(itemToEdit);
        } else {
            console.error('Item with ID not found (after re-fetch):', itemId);
            alert('Item tidak ditemukan atau ada masalah saat memuat data. Mohon cek kembali.');
        }
    }

    // Cek apakah yang diklik adalah tombol Hapus
    if (e.target.matches('.delete-item-btn')) {
        const itemId = e.target.dataset.id;
        // console.log('Tombol Hapus diklik untuk ID:', itemId); // Baris ini bisa dihapus nanti setelah yakin berfungsi

        if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
            const { error: deleteError } = await supabase
                .from('inventories')
                .delete()
                .eq('id', itemId);

            if (deleteError) {
                console.error("Error deleting inventaris:", deleteError.message);
                alert('Gagal menghapus item: ' + deleteError.message);
            } else {
                alert('Item berhasil dihapus!');
                loadInventarisData(); // Muat ulang data setelah penghapusan
            }
        }
    }
});

// --- FUNGSI MODAL EDIT ITEM ---
function openEditModal(item) {
    console.log('--- openEditModal Dipanggil ---');
    console.log('Item yang diterima:', item);

    // Pastikan properti item ada sebelum mencoba menggunakannya
    const itemId = item ? item.id : null;
    const itemCode = item ? item.item_code : '';
    const itemName = item ? item.item_name : '';
    const itemQuantity = item ? item.quantity : 0;
    const itemUnitType = item ? item.unit_type : 'pcs';
    const itemCostPrice = item ? item.cost_price : 0;
    const itemSellingPrice = item ? item.selling_price : 0;

    // Mengisi nilai input
    if (editItemId) {
        editItemId.value = itemId;
        console.log(`Set editItemId.value to: ${editItemId.value}`);
    } else {
        console.error('ERROR: Elemen editItemId tidak ditemukan!');
    }

    if (editItemCode) {
        editItemCode.value = itemCode;
        console.log(`Set editItemCode.value to: ${editItemCode.value}`);
    } else {
        console.error('ERROR: Elemen editItemCode tidak ditemukan!');
    }

    if (editItemName) {
        editItemName.value = itemName;
        console.log(`Set editItemName.value to: ${editItemName.value}`);
    } else {
        console.error('ERROR: Elemen editItemName tidak ditemukan!');
    }

    if (editQuantity) {
        editQuantity.value = itemQuantity;
        console.log(`Set editQuantity.value to: ${editQuantity.value}`);
    } else {
        console.error('ERROR: Elemen editQuantity tidak ditemukan!');
    }

    if (editUnitType) {
        editUnitType.value = itemUnitType;
        console.log(`Set editUnitType.value to: ${editUnitType.value}`);
    } else {
        console.error('ERROR: Elemen editUnitType tidak ditemukan!');
    }

    if (editCostPrice) {
        editCostPrice.value = itemCostPrice;
        console.log(`Set editCostPrice.value to: ${editCostPrice.value}`);
    } else {
        console.error('ERROR: Elemen editCostPrice tidak ditemukan!');
    }

    if (editSellingPrice) {
        editSellingPrice.value = itemSellingPrice;
        console.log(`Set editSellingPrice.value to: ${editSellingPrice.value}`);
    } else {
        console.error('ERROR: Elemen editSellingPrice tidak ditemukan!');
    }

    // Tampilkan modal
    if (editItemModal) {
        editItemModal.style.display = 'flex';
        console.log('Modal display set to flex.');
    } else {
        console.error('ERROR: Elemen editItemModal tidak ditemukan!');
    }
    console.log('--- openEditModal Selesai ---');
}

// --- EVENT LISTENERS MODAL EDIT ITEM ---
if (closeEditModalBtn) {
    closeEditModalBtn.onclick = () => {
        if (editItemModal) editItemModal.style.display = 'none';
        console.log('Modal ditutup via tombol X.');
    };
}

if (cancelEditBtn) {
    cancelEditBtn.onclick = () => {
        if (editItemModal) editItemModal.style.display = 'none';
        console.log('Modal ditutup via tombol Batal.');
    };
}

if (editItemForm) {
    editItemForm.onsubmit = async (e) => {
        e.preventDefault();
        const itemId = editItemId ? editItemId.value : null;
        const itemName = editItemName ? editItemName.value.trim() : '';
        const quantity = editQuantity ? parseInt(editQuantity.value) : NaN;
        const unitType = editUnitType ? editUnitType.value : '';
        const costPrice = editCostPrice ? parseFloat(editCostPrice.value) : NaN;
        const sellingPrice = editSellingPrice ? parseFloat(editSellingPrice.value) : NaN;

        if (!itemId || !itemName || isNaN(quantity) || isNaN(costPrice) || isNaN(sellingPrice) || quantity < 0 || costPrice < 0 || sellingPrice < 0) {
            alert('Semua bidang harus diisi dengan nilai yang valid (jumlah/harga tidak boleh negatif).');
            return;
        }

        try {
            const { data: { user } = {} } = await supabase.auth.getUser();
            if (!user) {
                alert('Anda harus login untuk memperbarui item.');
                return;
            }

            const { data, error } = await supabase
                .from('inventories')
                .update({
                    item_name: itemName,
                    quantity: quantity,
                    unit_type: unitType,
                    cost_price: costPrice,
                    selling_price: sellingPrice,
                    last_updated: new Date().toISOString()
                })
                .eq('id', itemId)
                .eq('user_id', user.id);

            if (error) throw error;

            alert('Item inventaris berhasil diperbarui!');
            if (editItemModal) editItemModal.style.display = 'none';
            await loadInventarisData(); // Muat ulang data setelah update
        } catch (error) {
            console.error('Error updating inventory item:', error.message);
            alert('Gagal memperbarui item inventaris: ' + error.message);
        }
    };
}

// --- 4. EVENT LISTENERS UTAMA (NON-MODAL) ---

// Tombol Login/Daftar Utama (Header)
if (mainLoginBtn) { // <<<--- Tambahkan if check untuk menghindari error jika elemen tidak ada
    mainLoginBtn.addEventListener('click', () => {
        authSection.style.display = 'block';
        appSection.style.display = 'none';
        adminPanelSection.style.display = 'none';
        adminLoginSection.style.display = 'block'; // Tampilkan juga form admin login
        mainLoginBtn.style.display = 'none';
        mainLogoutBtn.style.display = 'none';
    });
}


// Tombol Logout Utama (Header)
if (mainLogoutBtn) { // <<<--- Tambahkan if check
    mainLogoutBtn.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Logout error:", error.message);
            alert('Gagal logout: ' + error.message);
        } else {
            alert('Logout berhasil!');
            // Kembali ke halaman autentikasi
            authSection.style.display = 'block';
            appSection.style.display = 'none';
            adminPanelSection.style.display = 'none';
            adminLoginSection.style.display = 'block';
            mainLoginBtn.style.display = 'inline-block';
            mainLogoutBtn.style.display = 'none';
        }
    });
}


// Daftar User
if (signupBtn) { // <<<--- Tambahkan if check
    signupBtn.addEventListener('click', async () => {
        const email = signupEmailInput.value;
        const password = signupPasswordInput.value;
        signupMessage.textContent = ''; // Reset pesan

        if (!email || !password) {
            signupMessage.textContent = 'Email dan password harus diisi.';
            signupMessage.className = 'message error';
            return;
        }

        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
            signupMessage.textContent = 'Daftar gagal: ' + error.message;
            signupMessage.className = 'message error';
            console.error("Signup error:", error.message);
        } else if (data.user) {
            // Setelah user berhasil terdaftar di auth.users, buat entri di public.users
            const { error: userInsertError } = await supabase
                .from('users')
                .insert([
                    { id: data.user.id, email: data.user.email, role: 'user' }
                ]);

            if (userInsertError) {
                console.error("Error inserting into public.users:", userInsertError.message);
                signupMessage.textContent = 'Daftar berhasil tapi gagal menyimpan profil user. Harap hubungi admin.';
                signupMessage.className = 'message error';
            } else {
                signupMessage.textContent = 'Daftar berhasil! Silakan cek email Anda untuk konfirmasi (jika diaktifkan).';
                signupMessage.className = 'message success';
                signupEmailInput.value = '';
                signupPasswordInput.value = '';
                // await checkUserRoleAndRedirect(data.user); // Opsional: langsung login
            }
        } else {
            signupMessage.textContent = 'Pendaftaran berhasil. Silakan cek email Anda untuk konfirmasi.';
            signupMessage.className = 'message info';
            signupEmailInput.value = '';
            signupPasswordInput.value = '';
        }
    });
}


// Login User
if (loginBtn) { // <<<--- Tambahkan if check
    loginBtn.addEventListener('click', async () => {
        const email = loginEmailInput.value;
        const password = loginPasswordInput.value;
        loginMessage.textContent = ''; // Reset pesan

        if (!email || !password) {
            loginMessage.textContent = 'Email dan password harus diisi.';
            loginMessage.className = 'message error';
            return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            loginMessage.textContent = 'Login gagal: ' + error.message;
            loginMessage.className = 'message error';
            console.error("Login error:", error.message);
        } else {
            loginMessage.textContent = 'Login berhasil!';
            loginMessage.className = 'message success';
            loginEmailInput.value = '';
            loginPasswordInput.value = '';
            await checkUserRoleAndRedirect(data.user);
        }
    });
}

// Logout User dari App Section
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Logout error:", error.message);
            alert('Gagal logout: ' + error.message);
        } else {
            alert('Logout berhasil!');
            // Kembali ke halaman autentikasi
            authSection.style.display = 'block';
            appSection.style.display = 'none';
            adminPanelSection.style.display = 'none';
            adminLoginSection.style.display = 'block';
            mainLoginBtn.style.display = 'inline-block';
            mainLogoutBtn.style.display = 'none';
        }
    });
} // <<<--- PERBAIKAN SYNTAX: Kurung kurawal penutup yang hilang


// Admin Login
if (adminLoginBtn) { // <<<--- Tambahkan if check
    adminLoginBtn.addEventListener('click', async () => {
        const email = adminEmailInput.value;
        const password = adminPasswordInput.value;
        adminLoginMessage.textContent = '';

        if (!email || !password) {
            adminLoginMessage.textContent = 'Email dan password admin harus diisi.';
            adminLoginMessage.className = 'message error';
            return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            adminLoginMessage.textContent = 'Login admin gagal: ' + error.message;
            adminLoginMessage.className = 'message error';
            console.error("Admin login error:", error.message);
        } else {
            // Cek peran user setelah login
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .single();

            if (userError || !userData || userData.role !== 'admin') {
                await supabase.auth.signOut(); // Langsung logout jika bukan admin
                adminLoginMessage.textContent = 'Akses ditolak: Hanya admin yang diizinkan.';
                adminLoginMessage.className = 'message error';
                console.warn("Unauthorized admin access attempt for user:", email);
            } else {
                adminLoginMessage.textContent = 'Login admin berhasil!';
                adminLoginMessage.className = 'message success';
                adminEmailInput.value = '';
                adminPasswordInput.value = '';
                showAdminPanel();
            }
        }
    });
}


// Admin Logout
if (adminLogoutBtn) { // <<<--- Tambahkan if check
    adminLogoutBtn.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Admin logout error:", error.message);
            alert('Gagal logout admin: ' + error.message);
        } else {
            alert('Logout admin berhasil!');
            // Kembali ke halaman autentikasi
            authSection.style.display = 'block';
            appSection.style.display = 'none';
            adminPanelSection.style.display = 'none';
            adminLoginSection.style.display = 'block';
            mainLoginBtn.style.display = 'inline-block';
            mainLogoutBtn.style.display = 'none';
        }
    });
}


if (refreshLicensesBtn) { // <<<--- Tambahkan if check
    refreshLicensesBtn.addEventListener('click', loadLicensesData);
}


/// Event listener untuk tombol "Tambah Item"
if (addInventarisBtn) { // <<<--- Tambahkan if check
    addInventarisBtn.addEventListener('click', () => {
        addInventarisForm.style.display = 'block'; // Tampilkan form
        addInventarisBtn.style.display = 'none'; // Sembunyikan tombol "Tambah Item"

        // Kosongkan dan reset semua input form tambah item
        itemNameInput.value = '';
        itemQuantityInput.value = '';
        itemUnitTypeInput.value = 'pcs'; // Atur nilai default 'pcs'
        itemCostPriceInput.value = '';
        itemSellingPriceInput.value = '';

        inventarisFormMessage.textContent = ''; // Kosongkan pesan
        inventarisFormMessage.className = 'message';
    });
}


// Event listener untuk tombol "Batal" di form tambah item
if (cancelAddInventarisBtn) { // <<<--- Tambahkan if check
    cancelAddInventarisBtn.addEventListener('click', () => {
        addInventarisForm.style.display = 'none'; // Sembunyikan form
        addInventarisBtn.style.display = 'inline-block'; // Tampilkan kembali tombol "Tambah Item"
    });
}


// Event listener untuk tombol "Simpan Item"
if (saveInventarisBtn) { // <<<--- Tambahkan if check
    saveInventarisBtn.addEventListener('click', async () => {
        const itemName = itemNameInput.value.trim();
        const itemQuantity = parseInt(itemQuantityInput.value);
        const itemUnitType = itemUnitTypeInput.value;
        const itemCostPrice = parseFloat(itemCostPriceInput.value);
        const itemSellingPrice = parseFloat(itemSellingPriceInput.value);

        inventarisFormMessage.textContent = '';

        if (!itemName || isNaN(itemQuantity) || isNaN(itemCostPrice) || isNaN(itemSellingPrice) || itemQuantity < 0 || itemCostPrice < 0 || itemSellingPrice < 0) {
            inventarisFormMessage.textContent = 'Semua bidang harus diisi dengan nilai yang valid (jumlah/harga tidak boleh negatif).';
            inventarisFormMessage.className = 'message error';
            return;
        }

        const { data: { user } = {} } = await supabase.auth.getUser();
        if (!user) {
            inventarisFormMessage.textContent = 'Anda harus login untuk menambah item.';
            inventarisFormMessage.className = 'message error';
            return;
        }

        // Pastikan user memiliki lisensi aktif sebelum menambah item inventaris
        const { data: license, error: licenseError } = await supabase
            .from('licenses')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (licenseError || !license || !license.is_active || new Date(license.expiry_date) < new Date()) {
            inventarisFormMessage.textContent = 'Anda tidak memiliki lisensi aktif untuk menambah item inventaris.';
            inventarisFormMessage.className = 'message error';
            console.error("License check failed for inventory add:", licenseError ? licenseError.message : "No active license.");
            return;
        }

        const newItemCode = generateUniqueItemCode();

        const { data, error } = await supabase
            .from('inventories')
            .insert([
                {
                    item_name: itemName,
                    quantity: itemQuantity,
                    unit_type: itemUnitType,
                    cost_price: itemCostPrice,
                    selling_price: itemSellingPrice,
                    item_code: newItemCode
                }
            ]);

        if (error) {
            console.error("Error saving inventory item:", error.message);
            inventarisFormMessage.textContent = 'Error: Gagal menyimpan item inventaris. ' + error.message;
            inventarisFormMessage.className = 'message error';
        } else {
            console.log("Inventory item saved successfully:", data);
            inventarisFormMessage.textContent = 'Item berhasil disimpan!';
            inventarisFormMessage.className = 'message success';
            itemNameInput.value = '';
            itemQuantityInput.value = '';
            itemUnitTypeInput.value = 'pcs';
            itemCostPriceInput.value = '';
            itemSellingPriceInput.value = '';

            addInventarisForm.style.display = 'none';
            addInventarisBtn.style.display = 'inline-block';

            await loadInventarisData(); // Muat ulang data inventaris untuk menampilkan yang baru
        }
    });
}
// <<<--- PERBAIKAN SYNTAX: Hapus }); yang tidak pada tempatnya di sini.
// Potongan script Anda diakhiri dengan }); yang merupakan penutup dari addEventListener sebelumnya.
// Jika ini adalah akhir file Anda, pastikan tidak ada karakter sisa.


// --- BARU: Event Listener untuk Pencarian dan Filter ---
// Letakkan ini setelah semua definisi fungsi dan variabel DOM utama.
if (searchInput) {
    searchInput.addEventListener('keyup', () => {
        const searchTerm = searchInput.value.trim();
        // Pastikan unitTypeFilter juga ada saat memanggil loadInventarisData
        const filterUnitType = unitTypeFilter ? unitTypeFilter.value : '';
        loadInventarisData(searchTerm, filterUnitType);
    });
} else {
    console.error('ERROR: Elemen searchInput tidak ditemukan! Pastikan ID HTML sudah benar.');
}

if (unitTypeFilter) {
    unitTypeFilter.addEventListener('change', () => {
        // Pastikan searchInput juga ada saat memanggil loadInventarisData
        const searchTerm = searchInput ? searchInput.value.trim() : '';
        const filterUnitType = unitTypeFilter.value;
        loadInventarisData(searchTerm, filterUnitType);
    });
} else {
    console.error('ERROR: Elemen unitTypeFilter tidak ditemukan! Pastikan ID HTML sudah benar.');
}

// --- Contoh Pemanggilan Awal (Jika script Anda dijalankan saat DOM siap) ---
// Jika Anda memanggil loadInventarisData() secara langsung di awal, pastikan
// untuk memanggilnya tanpa parameter atau dengan parameter default yang kosong
// agar tidak ada error di awal.
// Contoh:
// document.addEventListener('DOMContentLoaded', () => {
//     loadInventarisData(); // Panggil pertama kali saat halaman dimuat
//     // ... logika inisialisasi lainnya
// });