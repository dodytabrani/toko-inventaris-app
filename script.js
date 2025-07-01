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

// Muat Data Inventaris
async function loadInventarisData() {
    const { data: { user } } = await supabase.auth.getUser();
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
        addInventarisBtn.style.display = 'none'; // Sembunyikan tombol tambah jika lisensi tidak aktif
        return;
    } else {
        addInventarisBtn.style.display = 'inline-block'; // Tampilkan tombol tambah jika lisensi aktif
    }

    const { data, error } = await supabase
        .from('inventories')
        .select('*')
        .eq('user_id', user.id) // Penting: Hanya ambil data user yang login
        .order('created_at', { ascending: false }); // Urutkan berdasarkan tanggal terbaru

    if (error) {
        console.error("Error loading inventaris:", error.message);
        inventarisDataDiv.innerHTML = '<p class="message error">Gagal memuat data inventaris. Pastikan RLS diatur dengan benar.</p>';
    } else {
        if (data.length === 0) {
            inventarisDataDiv.innerHTML = '<p>Anda belum memiliki item inventaris. Klik "Tambah Item" untuk memulai.</p>';
        } else {
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Nama Item</th>
                            <th>Jumlah</th>
                            <th>Harga Satuan</th>
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

            // Tambahkan event listener untuk tombol edit/hapus setelah elemen dibuat
            document.querySelectorAll('.edit-item-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const itemId = e.target.dataset.id;
                    const itemToEdit = data.find(item => item.id === itemId);
                    if (itemToEdit) {
                        console.log('Item ditemukan:', itemToEdit);
                        openEditModal(itemToEdit);
                    } else {
                        console.error('Item with ID not found:', itemId);
                        alert('Gagal menemukan item untuk diedit.'); // Alert ini hanya untuk kasus error, bukan pop-up biasa.
                    }
                });
            });

            document.querySelectorAll('.delete-item-btn').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const itemId = e.target.dataset.id;
                    if (confirm('Anda yakin ingin menghapus item ini?')) {
                        const { error: deleteError } = await supabase
                            .from('inventories')
                            .delete()
                            .eq('id', itemId);

                        if (deleteError) {
                            console.error("Error deleting item:", deleteError.message);
                            alert('Gagal menghapus item: ' + deleteError.message);
                        } else {
                            alert('Item berhasil dihapus.');
                            await loadInventarisData(); // Muat ulang data
                        }
                    }
                });
            });
        }
    }
}
// Letakkan kode ini SETELAH fungsi loadInventarisData() Anda,
// di tempat yang akan dijalankan ketika halaman dimuat (misalnya, paling bawah file).

inventarisDataDiv.addEventListener('click', async (e) => {
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
    const itemCode = item ? item.item_code : ''; // <-- BARU
    const itemName = item ? item.item_name : '';
    const itemQuantity = item ? item.quantity : 0;
    const itemUnitType = item ? item.unit_type : 'pcs'; // <-- BARU
    const itemCostPrice = item ? item.cost_price : 0; // <-- BARU
    const itemSellingPrice = item ? item.selling_price : 0; // <-- BARU

    // HAPUS BARIS INI KARENA TIDAK DIGUNAKAN LAGI JIKA SUDAH ADA selling_price
    // const itemPrice = item ? item.price : 0; 

    // Debugging keberadaan elemen DOM
    console.log('Cek Elemen DOM:');
    console.log('editItemId:', editItemId);
    console.log('editItemCode:', editItemCode); // <-- BARU
    console.log('editItemName:', editItemName);
    console.log('editQuantity:', editQuantity);
    console.log('editUnitType:', editUnitType); // <-- BARU
    console.log('editCostPrice:', editCostPrice); // <-- BARU
    console.log('editSellingPrice:', editSellingPrice); // <-- BARU
    
    // HAPUS BARIS INI KARENA VARIABEL 'editPrice' SUDAH TIDAK ADA
    // console.log('editPrice:', editPrice); 
    
    console.log('editItemModal:', editItemModal);

    // Mengisi nilai input
    if (editItemId) {
        editItemId.value = itemId;
        console.log(`Set editItemId.value to: ${editItemId.value}`);
    } else {
        console.error('ERROR: Elemen editItemId tidak ditemukan!');
    }

    if (editItemCode) { // <-- BARU
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

    if (editUnitType) { // <-- BARU
        editUnitType.value = itemUnitType;
        console.log(`Set editUnitType.value to: ${editUnitType.value}`);
    } else {
        console.error('ERROR: Elemen editUnitType tidak ditemukan!');
    }
    
    if (editCostPrice) { // <-- BARU
        editCostPrice.value = itemCostPrice;
        console.log(`Set editCostPrice.value to: ${editCostPrice.value}`);
    } else {
        console.error('ERROR: Elemen editCostPrice tidak ditemukan!');
    }
    
    if (editSellingPrice) { // <-- BARU
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
        const unitType = editUnitType ? editUnitType.value : ''; // <-- Ini sudah benar
        const costPrice = editCostPrice ? parseFloat(editCostPrice.value) : NaN; // <-- Ini sudah benar
        const sellingPrice = editSellingPrice ? parseFloat(editSellingPrice.value) : NaN; // <-- Ini sudah benar
        // const price = editPrice ? parseFloat(editPrice.value) : NaN; // <-- HAPUS BARIS INI!

        // Perbarui validasi untuk menggunakan costPrice dan sellingPrice
        if (!itemId || !itemName || isNaN(quantity) || isNaN(costPrice) || isNaN(sellingPrice) || quantity < 0 || costPrice < 0 || sellingPrice < 0) {
            alert('Semua bidang harus diisi dengan nilai yang valid (jumlah/harga tidak boleh negatif).');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser(); 
            if (!user) {
                alert('Anda harus login untuk memperbarui item.');
                return;
            }

            // Perbarui payload update untuk menggunakan cost_price dan selling_price
            const { data, error } = await supabase
                .from('inventories')
                .update({
                    item_name: itemName,
                    quantity: quantity,
                    unit_type: unitType, // <-- Tambahkan ini
                    cost_price: costPrice, // <-- Ganti dari 'price'
                    selling_price: sellingPrice, // <-- Tambahkan ini
                    last_updated: new Date().toISOString()
                })
                .eq('id', itemId)
                .eq('user_id', user.id); // Penting: Pastikan user_id cocok

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
mainLoginBtn.addEventListener('click', () => {
    authSection.style.display = 'block';
    appSection.style.display = 'none';
    adminPanelSection.style.display = 'none';
    adminLoginSection.style.display = 'block'; // Tampilkan juga form admin login
    mainLoginBtn.style.display = 'none';
    mainLogoutBtn.style.display = 'none';
});

// Tombol Logout Utama (Header)
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

// Daftar User
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
            // Setelah daftar berhasil, langsung coba login atau tampilkan UI yang sesuai
            // await checkUserRoleAndRedirect(data.user); // Opsional: langsung login
        }
    } else {
        // Ini mungkin terjadi jika email confirmation diaktifkan dan user belum konfirmasi
        signupMessage.textContent = 'Pendaftaran berhasil. Silakan cek email Anda untuk konfirmasi.';
        signupMessage.className = 'message info';
        signupEmailInput.value = '';
        signupPasswordInput.value = '';
    }
});


// Login User
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

// Logout User dari App Section
if (logoutBtn) { // <--- Ini awal if statement
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
    }); // Ini akhir dari addEventListener
} // <--- INI KURUNG KURAWAL PENUTUP YANG HILANG DAN PERLU DITAMBAHKAN

// Admin Login
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

// Admin Logout
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

refreshLicensesBtn.addEventListener('click', loadLicensesData);


/// Event listener untuk tombol "Tambah Item"
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

// Event listener untuk tombol "Batal" di form tambah item
cancelAddInventarisBtn.addEventListener('click', () => {
    addInventarisForm.style.display = 'none'; // Sembunyikan form
    addInventarisBtn.style.display = 'inline-block'; // Tampilkan kembali tombol "Tambah Item"
});

// Event listener untuk tombol "Simpan Item"
saveInventarisBtn.addEventListener('click', async () => {
    const itemName = itemNameInput.value.trim();
    const itemQuantity = parseInt(itemQuantityInput.value);
    const itemUnitType = itemUnitTypeInput.value; // Ambil nilai satuan
    const itemCostPrice = parseFloat(itemCostPriceInput.value); // Ambil harga modal
    const itemSellingPrice = parseFloat(itemSellingPriceInput.value); // Ambil harga jual

    inventarisFormMessage.textContent = '';

    // Perbarui validasi
    if (!itemName || isNaN(itemQuantity) || isNaN(itemCostPrice) || isNaN(itemSellingPrice) || itemQuantity < 0 || itemCostPrice < 0 || itemSellingPrice < 0) {
        inventarisFormMessage.textContent = 'Semua bidang harus diisi dengan nilai yang valid (jumlah/harga tidak boleh negatif).';
        inventarisFormMessage.className = 'message error';
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();
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

    // --- KODE UNTUK MENYIMPAN INVENTARIS YANG BENAR ---
    const newItemCode = generateUniqueItemCode(); // Buat kode item baru

    const { data, error } = await supabase
        .from('inventories')
        .insert([
            {
                item_name: itemName,
                quantity: itemQuantity,
                unit_type: itemUnitType, // <-- Tambah satuan
                cost_price: itemCostPrice, // <-- Tambah harga modal
                selling_price: itemSellingPrice, // <-- Tambah harga jual
                item_code: newItemCode // <-- Tambah kode item
                // created_at dan last_updated seharusnya otomatis diurus oleh DB jika default valuenya NOW()
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
        itemUnitTypeInput.value = 'pcs'; // Reset ke default
        itemCostPriceInput.value = '';
        itemSellingPriceInput.value = '';

        addInventarisForm.style.display = 'none';
        addInventarisBtn.style.display = 'inline-block';

        await loadInventarisData(); // Muat ulang data inventaris untuk menampilkan yang baru
    }
});
});