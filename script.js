// Konfigurasi Supabase
// GANTI DENGAN KUNCI ANDA!
const SUPABASE_URL = 'https://sjxhosrvcmejqprooofk.supabase.co'; // Contoh: 'https://xyzabcdefg.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGhvc3J2Y21lanFwcm9vb2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzIxMzEsImV4cCI6MjA2NjgwODEzMX0.n3RmP7ouaZSPBuymRi6axXWZQc_DJKi2gX0VEeV3o4U'; // Contoh: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Mendapatkan referensi elemen DOM
const mainLoginBtn = document.getElementById('mainLoginBtn');
const mainLogoutBtn = document.getElementById('mainLogoutBtn');
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const adminLoginSection = document.getElementById('admin-login-section');
const adminPanelSection = document.getElementById('admin-panel-section');

const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');
const signupBtn = document.getElementById('signupBtn');
const signupMessage = document.getElementById('signupMessage');

const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginMessage = document.getElementById('loginMessage');

const userEmailSpan = document.getElementById('userEmail');
const licenseStatusP = document.getElementById('license-status');
const addInventarisBtn = document.getElementById('addInventarisBtn');
const addInventarisForm = document.getElementById('add-inventaris-form');
const itemNameInput = document.getElementById('itemName');
const itemQuantityInput = document.getElementById('itemQuantity');
const itemPriceInput = document.getElementById('itemPrice');
const saveInventarisBtn = document.getElementById('saveInventarisBtn');
const cancelAddInventarisBtn = document.getElementById('cancelAddInventarisBtn');
const inventarisFormMessage = document.getElementById('inventaris-form-message');
const inventoriesTableBody = document.getElementById('inventoriesTableBody'); // Dari HTML yang diperbarui
const logoutBtn = document.getElementById('logoutBtn');

const adminEmailInput = document.getElementById('adminEmail');
const adminPasswordInput = document.getElementById('adminPassword');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLoginMessage = document.getElementById('adminLoginMessage');
const refreshLicensesBtn = document.getElementById('refreshLicensesBtn');
const licensesTableBody = document.getElementById('licenses-table-body');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');

// Referensi elemen untuk modal edit
const editItemModal = document.getElementById('editItemModal');
const closeEditModalBtn = editItemModal.querySelector('.close-button');
const editItemForm = document.getElementById('editItemForm');
const editItemId = document.getElementById('editItemId');
const editItemName = document.getElementById('editItemName');
const editQuantity = document.getElementById('editQuantity');
const editPrice = document.getElementById('editPrice');
const saveEditedItemBtn = document.getElementById('saveEditedItemBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// --- Fungsi Umum UI ---
function showSection(sectionId) {
    // Sembunyikan semua section terlebih dahulu
    authSection.style.display = 'none';
    appSection.style.display = 'none';
    adminLoginSection.style.display = 'none';
    adminPanelSection.style.display = 'none';

    // Tampilkan section yang diminta
    document.getElementById(sectionId).style.display = 'block';
}

function updateAuthUI(user) {
    if (user) {
        mainLoginBtn.style.display = 'none';
        mainLogoutBtn.style.display = 'block';
        userEmailSpan.textContent = user.email;
        showSection('app-section');
        checkLicenseStatus(); // Periksa status lisensi saat login
        loadInventoriesData(); // Muat data inventaris saat login
    } else {
        mainLoginBtn.style.display = 'block';
        mainLogoutBtn.style.display = 'none';
        showSection('auth-section');
        userEmailSpan.textContent = '';
        licenseStatusP.textContent = '';
        addInventarisBtn.style.display = 'none'; // Sembunyikan tombol tambah item
        addInventarisForm.style.display = 'none'; // Sembunyikan form tambah item
        inventoriesTableBody.innerHTML = '<tr><td colspan="4">Silakan login untuk melihat inventaris.</td></tr>';
    }
}

function updateAdminUI(isAdminLoggedIn) {
    if (isAdminLoggedIn) {
        showSection('admin-panel-section');
        loadLicensesData(); // Muat data lisensi untuk admin
    } else {
        showSection('admin-login-section');
    }
}

// --- Fungsi Autentikasi ---
async function handleSignUp() {
    const email = signupEmail.value;
    const password = signupPassword.value;
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        signupMessage.textContent = 'Error: ' + error.message;
        signupMessage.style.color = 'red';
    } else {
        signupMessage.textContent = 'Pendaftaran berhasil! Silakan cek email Anda untuk konfirmasi.';
        signupMessage.style.color = 'green';
        signupEmail.value = '';
        signupPassword.value = '';
    }
}

async function handleLogin() {
    const email = loginEmail.value;
    const password = loginPassword.value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        loginMessage.textContent = 'Login error: ' + error.message;
        loginMessage.style.color = 'red';
    } else {
        loginMessage.textContent = 'Login berhasil!';
        loginMessage.style.color = 'green';
        loginEmail.value = '';
        loginPassword.value = '';
        updateAuthUI(data.user);
    }
}

async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Logout error:', error.message);
    } else {
        updateAuthUI(null);
    }
}

async function handleAdminLogin() {
    const email = adminEmailInput.value;
    const password = adminPasswordInput.value;

    // Untuk demo, kita hardcode admin user. Di produksi, gunakan Role-Based Access Control (RBAC)
    // atau mekanisme admin yang lebih aman.
    if (email === 'admin@admin.com' && password === 'adminpassword') { // Ganti dengan kredensial admin Anda
        adminLoginMessage.textContent = 'Login Admin berhasil!';
        adminLoginMessage.style.color = 'green';
        adminEmailInput.value = '';
        adminPasswordInput.value = '';
        updateAdminUI(true);
    } else {
        adminLoginMessage.textContent = 'Kredensial admin salah.';
        adminLoginMessage.style.color = 'red';
    }
}

async function handleAdminLogout() {
    // Di aplikasi nyata, Anda mungkin memiliki sesi admin yang terpisah atau token.
    // Untuk demo ini, kita hanya akan menyembunyikan panel admin.
    updateAdminUI(false);
    adminLoginMessage.textContent = ''; // Kosongkan pesan
}

// --- Fungsi Lisensi (Pengguna) ---
async function checkLicenseStatus() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        licenseStatusP.textContent = 'Silakan login untuk memeriksa status lisensi.';
        licenseStatusP.style.color = 'orange';
        addInventarisBtn.style.display = 'none'; // Sembunyikan tombol jika tidak login
        return;
    }

    const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', user.id)
        .single(); // Harapannya satu user punya satu lisensi

    if (error && error.code !== 'PGRST116') { // PGRST116 adalah error "No rows found"
        console.error('Error checking license:', error.message);
        licenseStatusP.textContent = 'Gagal memeriksa lisensi. Harap coba lagi. ' + error.message;
        licenseStatusP.style.color = 'red';
        addInventarisBtn.style.display = 'none'; // Sembunyikan tombol jika error
        return;
    }

    if (data && data.is_active) {
        const expiryDate = new Date(data.expiry_date); // Menggunakan expiry_date
        const now = new Date();
        if (expiryDate > now) {
            licenseStatusP.textContent = `Lisensi Anda aktif hingga ${expiryDate.toLocaleDateString()}.`;
            licenseStatusP.style.color = 'green';
            addInventarisBtn.style.display = 'block'; // Tampilkan tombol tambah item jika lisensi aktif
        } else {
            licenseStatusP.textContent = `Lisensi Anda tidak aktif atau sudah kadaluarsa pada ${expiryDate.toLocaleDateString()}.`;
            licenseStatusP.style.color = 'red';
            addInventarisBtn.style.display = 'none'; // Sembunyikan tombol jika kadaluarsa
        }
    } else {
        licenseStatusP.textContent = 'Lisensi Anda belum aktif. Hubungi admin untuk aktivasi.';
        licenseStatusP.style.color = 'red';
        addInventarisBtn.style.display = 'none'; // Sembunyikan tombol jika tidak aktif
    }
}


// --- Fungsi Inventaris (Pengguna) ---
async function addInventarisItem() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        inventarisFormMessage.textContent = 'Anda harus login untuk menambah item.';
        inventarisFormMessage.style.color = 'red';
        return;
    }

    const itemName = itemNameInput.value;
    const quantity = parseInt(itemQuantityInput.value);
    const price = parseInt(itemPriceInput.value);

    if (!itemName || isNaN(quantity) || isNaN(price)) {
        inventarisFormMessage.textContent = 'Mohon lengkapi semua kolom.';
        inventarisFormMessage.style.color = 'red';
        return;
    }

    const { data, error } = await supabase
        .from('inventories')
        .insert([
            {
                user_id: user.id, // User ID dari user yang sedang login
                item_name: itemName,
                quantity: quantity,
                price: price
            }
        ]);

    if (error) {
        console.error('Error saving inventory item:', error.message);
        inventarisFormMessage.textContent = 'Gagal menyimpan item: ' + error.message;
        inventarisFormMessage.style.color = 'red';
    } else {
        inventarisFormMessage.textContent = 'Item inventaris berhasil disimpan!';
        inventarisFormMessage.style.color = 'green';
        itemNameInput.value = '';
        itemQuantityInput.value = '';
        itemPriceInput.value = '';
        addInventarisForm.style.display = 'none'; // Sembunyikan form setelah sukses
        loadInventoriesData(); // Muat ulang data untuk menampilkan item baru
    }
}

async function loadInventoriesData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        inventoriesTableBody.innerHTML = '<tr><td colspan="4">Silakan login untuk melihat inventaris.</td></tr>';
        return;
    }

    // Periksa status lisensi sebelum memuat inventaris, dan sesuaikan UI
    // Variabel licenseStatusP dan addInventarisBtn sudah dihandle di checkLicenseStatus()
    // Jadi cukup cek di sini apakah tombol Tambah Item sudah ditampilkan atau belum
    if (addInventarisBtn.style.display === 'none') {
        inventoriesTableBody.innerHTML = '<tr><td colspan="4">Akses inventaris ditolak: Lisensi tidak aktif atau sudah kadaluarsa.</td></tr>';
        return;
    }


    const { data, error } = await supabase
        .from('inventories')
        .select('*')
        .eq('user_id', user.id) // Filter inventaris berdasarkan user_id
        .order('created_at', { ascending: false }); // Urutkan berdasarkan tanggal terbaru

    if (error) {
        console.error('Error loading inventories:', error.message);
        inventoriesTableBody.innerHTML = `<tr><td colspan="4">Gagal memuat data inventaris: ${error.message}</td></tr>`;
        return;
    }

    inventoriesTableBody.innerHTML = ''; // Kosongkan tabel sebelum mengisi ulang
    if (data.length === 0) {
        inventoriesTableBody.innerHTML = '<tr><td colspan="4">Belum ada item inventaris.</td></tr>';
        return;
    }

    data.forEach(item => {
        const row = inventoriesTableBody.insertRow();
        row.insertCell(0).textContent = item.item_name;
        row.insertCell(1).textContent = item.quantity;
        row.insertCell(2).textContent = `Rp ${item.price.toLocaleString('id-ID')}`; // Format mata uang

        const actionsCell = row.insertCell(3); // Sel untuk tombol Aksi
        actionsCell.className = 'actions-cell'; // Tambahkan class untuk styling jika perlu

        // Tombol Edit
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.className = 'btn-edit';
        editButton.addEventListener('click', () => {
            openEditModal(item);
        });
        actionsCell.appendChild(editButton);

        // Tombol Hapus
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Hapus';
        deleteButton.className = 'btn-delete';
        deleteButton.addEventListener('click', () => {
            deleteInventarisItem(item.id);
        });
        actionsCell.appendChild(deleteButton);
    });
}

// --- Fungsi Edit Inventaris (Pengguna) ---
function openEditModal(item) {
    editItemId.value = item.id;
    editItemName.value = item.item_name;
    editQuantity.value = item.quantity;
    editPrice.value = item.price;
    editItemModal.style.display = 'block'; // Tampilkan modal
}

function closeEditModal() {
    editItemModal.style.display = 'none'; // Sembunyikan modal
    editItemForm.reset(); // Reset form setelah ditutup
}

async function updateInventarisItem(event) {
    event.preventDefault(); // Mencegah form submit secara default

    const itemId = editItemId.value;
    const itemName = editItemName.value;
    const quantity = parseInt(editQuantity.value);
    const price = parseInt(editPrice.value);

    if (!itemName || isNaN(quantity) || isNaN(price)) {
        alert("Nama Item, Jumlah, dan Harga Satuan harus diisi dengan benar.");
        return;
    }

    const { data, error } = await supabase
        .from('inventories')
        .update({
            item_name: itemName,
            quantity: quantity,
            last_updated: new Date().toISOString(),
            price: price
        })
        .eq('id', itemId); // Kriteria update berdasarkan ID item

    if (error) {
        console.error('Error updating inventory item:', error.message);
        alert('Gagal memperbarui item: ' + error.message);
    } else {
        alert('Item inventaris berhasil diperbarui!');
        closeEditModal();
        loadInventoriesData(); // Muat ulang data untuk menampilkan perubahan
    }
}

// --- Fungsi Hapus Inventaris (Pengguna) ---
async function deleteInventarisItem(itemId) {
    if (!confirm('Apakah Anda yakin ingin menghapus item ini?')) {
        return; // Batalkan jika user tidak yakin
    }

    const { error } = await supabase
        .from('inventories')
        .delete()
        .eq('id', itemId); // Hapus berdasarkan ID item

    if (error) {
        console.error('Error deleting inventory item:', error.message);
        alert('Gagal menghapus item: ' + error.message);
    } else {
        alert('Item inventaris berhasil dihapus!');
        loadInventoriesData(); // Muat ulang data untuk menampilkan item yang tersisa
    }
}

// --- Fungsi Admin (Lisensi) ---
async function loadLicensesData() {
    licensesTableBody.innerHTML = '<tr><td colspan="5">Memuat daftar lisensi...</td></tr>';
    // Di aplikasi nyata, admin mungkin memiliki cara berbeda untuk autentikasi.
    // Pastikan admin token/session valid sebelum memanggil ini.

    // Untuk demo ini, kita berasumsi admin sudah login dan bisa mengakses tabel `licenses`.
    // Di Supabase, pastikan RLS untuk tabel `licenses` memungkinkan admin untuk SELECT semua baris.
    const { data: licenses, error } = await supabase
        .from('licenses')
        .select(`
            *,
            users:user_id (email) // Join dengan tabel auth.users untuk mendapatkan email
        `);

    if (error) {
        console.error('Error loading licenses:', error.message);
        licensesTableBody.innerHTML = `<tr><td colspan="5">Gagal memuat daftar lisensi: ${error.message}</td></tr>`;
        return;
    }

    licensesTableBody.innerHTML = '';
    if (licenses.length === 0) {
        licensesTableBody.innerHTML = '<tr><td colspan="5">Belum ada data lisensi.</td></tr>';
        return;
    }

    licenses.forEach(license => {
        const row = licensesTableBody.insertRow();
        row.insertCell(0).textContent = license.users ? license.users.email : 'N/A'; // Tampilkan email pengguna
        row.insertCell(1).textContent = license.id;
        row.insertCell(2).textContent = license.is_active ? 'Aktif' : 'Tidak Aktif';
        row.insertCell(3).textContent = new Date(license.expiry_date).toLocaleDateString(); // Menggunakan expiry_date

        const actionsCell = row.insertCell(4);
        const toggleButton = document.createElement('button');
        toggleButton.textContent = license.is_active ? 'Nonaktifkan' : 'Aktifkan';
        toggleButton.className = license.is_active ? 'btn-deactivate' : 'btn-activate';
        toggleButton.addEventListener('click', () => toggleLicenseStatus(license.id, !license.is_active));
        actionsCell.appendChild(toggleButton);
    });
}

async function toggleLicenseStatus(licenseId, newStatus) {
    const { error } = await supabase
        .from('licenses')
        .update({ is_active: newStatus })
        .eq('id', licenseId);

    if (error) {
        console.error('Error updating license status:', error.message);
        alert('Gagal memperbarui status lisensi: ' + error.message);
    } else {
        alert('Status lisensi berhasil diperbarui!');
        loadLicensesData(); // Muat ulang data untuk menampilkan perubahan
    }
}

// --- Event Listeners ---
// Global Auth/App UI
mainLoginBtn.addEventListener('click', () => updateAuthUI(null)); // Kembali ke form login/daftar
mainLogoutBtn.addEventListener('click', handleLogout);

// User Auth
signupBtn.addEventListener('click', handleSignUp);
loginBtn.addEventListener('click', handleLogin);
logoutBtn.addEventListener('click', handleLogout);

// Inventaris
addInventarisBtn.addEventListener('click', () => {
    addInventarisForm.style.display = 'block';
    itemNameInput.focus();
});
cancelAddInventarisBtn.addEventListener('click', () => {
    addInventarisForm.style.display = 'none';
    inventarisFormMessage.textContent = ''; // Clear message
    itemNameInput.value = ''; // Clear input
    itemQuantityInput.value = '';
    itemPriceInput.value = '';
});
saveInventarisBtn.addEventListener('click', addInventarisItem);

// Event listener untuk modal edit (tutup)
closeEditModalBtn.addEventListener('click', closeEditModal);
cancelEditBtn.addEventListener('click', closeEditModal);
window.addEventListener('click', (event) => {
    if (event.target == editItemModal) {
        closeEditModal();
    }
});
editItemForm.addEventListener('submit', updateInventarisItem); // Event saat form edit disubmit

// Admin
adminLoginBtn.addEventListener('click', handleAdminLogin);
adminLogoutBtn.addEventListener('click', handleAdminLogout);
refreshLicensesBtn.addEventListener('click', loadLicensesData);

// --- Inisialisasi Aplikasi ---
async function initApp() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        updateAuthUI(user);
    } else {
        updateAuthUI(null);
    }

    // Inisialisasi admin panel jika admin sudah login (atau sesuai mekanisme Anda)
    // Untuk demo ini, admin perlu login ulang setiap kali refresh halaman
    updateAdminUI(false); // Sembunyikan panel admin di awal
}

// Panggil inisialisasi saat DOMContentLoaded
document.addEventListener('DOMContentLoaded', initApp);

// Dengar perubahan status autentikasi dari Supabase
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        updateAuthUI(session.user);
    } else if (event === 'SIGNED_OUT') {
        updateAuthUI(null);
    }
});