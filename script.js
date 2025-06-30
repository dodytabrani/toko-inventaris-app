// --- 1. INISIALISASI SUPABASE ---
// GANTI DENGAN KREDENSIAL PROYEK SUPABASE ANDA YANG BARU!
const SUPABASE_URL = 'https://sjxhosrvcmejqprooofk.supabase.co'; // Contoh: 'https://abcdefghijk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGhvc3J2Y21lanFwcm9vb2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzIxMzEsImV4cCI6MjA2NjgwODEzMX0.n3RmP7ouaZSPBuymRi6axXWZQc_DJKi2gX0VEeV3o4U'; // Contoh: 'eyJhbGciOiJIUzI1NiI...'

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 2. REFERENSI ELEMEN HTML ---
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const adminLoginSection = document.getElementById('admin-login-section');
const adminPanelSection = document.getElementById('admin-panel-section');

const signupEmailInput = document.getElementById('signupEmail');
const signupPasswordInput = document.getElementById('signupPassword');
const signupBtn = document.getElementById('signupBtn');
const signupMessage = document.getElementById('signupMessage');

const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginMessage = document.getElementById('loginMessage');

const logoutBtn = document.getElementById('logoutBtn');
const userEmailSpan = document.getElementById('userEmail');
const licenseStatusP = document.getElementById('license-status');

const adminEmailInput = document.getElementById('adminEmail');
const adminPasswordInput = document.getElementById('adminPassword');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLoginMessage = document.getElementById('adminLoginMessage');

const licensesTableBody = document.getElementById('licenses-table-body');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');
const refreshLicensesBtn = document.getElementById('refreshLicensesBtn');

const inventarisDataDiv = document.getElementById('inventaris-data');
const addInventarisBtn = document.getElementById('addInventarisBtn');

// Referensi baru untuk form inventaris
const addInventarisForm = document.getElementById('add-inventaris-form');
const itemNameInput = document.getElementById('itemName');
const itemQuantityInput = document.getElementById('itemQuantity');
const itemPriceInput = document.getElementById('itemPrice');
const saveInventarisBtn = document.getElementById('saveInventarisBtn');
const cancelAddInventarisBtn = document.getElementById('cancelAddInventarisBtn');
const inventarisFormMessage = document.getElementById('inventaris-form-message');


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
        console.error("Error extending license:", updateError.message);
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
        console.error("Error deleting license:", error.message);
        alert('Gagal menghapus lisensi: ' + error.message);
    } else {
        alert('Lisensi berhasil dihapus.');
        await loadLicensesData(); // Muat ulang data
    }
}

// Muat Data Inventaris
async function loadInventarisData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Pastikan user login

    // Cek lagi status lisensi, kalau belum aktif, jangan muat data
    const { data: license } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (!license || !license.is_active || new Date(license.expiry_date) < new Date()) {
        inventarisDataDiv.innerHTML = '<p>Akses inventaris ditolak: Lisensi tidak aktif/kadaluarsa.</p>';
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
                html += `
                    <tr>
                        <td>${item.item_name}</td>
                        <td>${item.quantity}</td>
                        <td>Rp ${item.price ? item.price.toLocaleString('id-ID') : '0'}</td>
                        <td>
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

            // TODO: Tambahkan event listener untuk tombol edit/hapus di langkah selanjutnya
        }
    }
}


// --- 4. EVENT LISTENERS ---

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
            // Anda bisa tambahkan logik rollback atau pesan error ke user di sini
            signupMessage.textContent = 'Daftar berhasil tapi gagal menyimpan profil user. Harap hubungi admin.';
            signupMessage.className = 'message error';
        } else {
            signupMessage.textContent = 'Daftar berhasil! Silakan cek email Anda untuk konfirmasi (jika diaktifkan).';
            signupMessage.className = 'message success';
            signupEmailInput.value = '';
            signupPasswordInput.value = '';
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

// Logout User
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
        adminLoginSection.style.display = 'block'; // Tampilkan juga form admin login
    }
});

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
    }
});

refreshLicensesBtn.addEventListener('click', loadLicensesData);


// Event listener untuk tombol "Tambah Item"
addInventarisBtn.addEventListener('click', () => {
    addInventarisForm.style.display = 'block'; // Tampilkan form
    addInventarisBtn.style.display = 'none'; // Sembunyikan tombol "Tambah Item"
    itemNameInput.value = ''; // Kosongkan input
    itemQuantityInput.value = '';
    itemPriceInput.value = '';
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
    const itemPrice = parseFloat(itemPriceInput.value);

    inventarisFormMessage.textContent = '';

    if (!itemName || isNaN(itemQuantity) || isNaN(itemPrice) || itemQuantity < 0 || itemPrice < 0) {
        inventarisFormMessage.textContent = 'Semua bidang harus diisi dengan nilai yang valid.';
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


    const { data, error } = await supabase
        .from('inventories')
        .insert([
            {
                user_id: user.id,
                item_name: itemName,
                quantity: itemQuantity,
                price: itemPrice
            }
        ]);

    if (error) {
        inventarisFormMessage.textContent = 'Error menyimpan item: ' + error.message;
        inventarisFormMessage.className = 'message error';
        console.error("Error saving inventory item:", error.message);
    } else {
        inventarisFormMessage.textContent = 'Item berhasil disimpan!';
        inventarisFormMessage.className = 'message success';
        itemNameInput.value = '';
        itemQuantityInput.value = '';
        itemPriceInput.value = '';

        // Sembunyikan form dan tampilkan kembali tombol "Tambah Item" setelah berhasil
        addInventarisForm.style.display = 'none';
        addInventarisBtn.style.display = 'inline-block';

        await loadInventarisData(); // Muat ulang data inventaris untuk menampilkan yang baru
    }
});