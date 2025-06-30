// --- Inisialisasi Supabase Client ---
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Ganti dengan URL Supabase Anda
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Ganti dengan Anon Key Anda

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Referensi Elemen UI Umum ---
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const mainLoginBtn = document.getElementById('mainLoginBtn');
const mainLogoutBtn = document.getElementById('mainLogoutBtn');
const adminPanelSection = document.getElementById('admin-panel-section');
const adminLoginSection = document.getElementById('admin-login-section');
const showAddInventarisFormBtn = document.getElementById('showAddInventarisFormBtn');
const addInventarisFormSection = document.getElementById('add-inventaris-form');
const cancelAddInventarisBtn = document.getElementById('cancelAddInventarisBtn');


// --- Referensi Elemen Login/Register ---
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const loginMessage = document.getElementById('login-message');
const registerForm = document.getElementById('register-form');
const registerEmailInput = document.getElementById('registerEmail');
const registerPasswordInput = document.getElementById('registerPassword');
const registerMessage = document.getElementById('register-message');
const toggleToRegisterBtn = document.getElementById('toggleToRegister');
const toggleToLoginBtn = document.getElementById('toggleToLogin');

// --- Referensi Elemen Form Tambah Item (PASTIKAN HANYA ADA SATU SET INI) ---
const itemNameInput = document.getElementById('itemName');
const itemQuantityInput = document.getElementById('itemQuantity');
const itemUnitTypeInput = document.getElementById('itemUnitType');
const itemCostPriceInput = document.getElementById('itemCostPrice');
const itemSellingPriceInput = document.getElementById('itemSellingPrice');
const saveInventarisBtn = document.getElementById('saveInventarisBtn');
const inventarisFormMessage = document.getElementById('inventaris-form-message');
const inventarisTableBody = document.getElementById('inventarisTableBody');


// --- Referensi Elemen Modal Edit (PASTIKAN HANYA ADA SATU SET INI) ---
const editItemModal = document.getElementById('editItemModal');
const closeEditModalBtn = document.querySelector('#editItemModal .close-button');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const editItemForm = document.getElementById('editItemForm');
const editItemId = document.getElementById('editItemId');
const editItemCode = document.getElementById('editItemCode');
const editItemName = document.getElementById('editItemName');
const editQuantity = document.getElementById('editQuantity');
const editUnitType = document.getElementById('editUnitType');
const editCostPrice = document.getElementById('editCostPrice');
const editSellingPrice = document.getElementById('editSellingPrice');

// --- Referensi Elemen Form Tambah Item (VERIFIKASI INI JUGA) ---
// Pastikan ini juga ada di bagian atas script.js Anda
const itemNameInput = document.getElementById('itemName');
const itemQuantityInput = document.getElementById('itemQuantity');
const itemUnitTypeInput = document.getElementById('itemUnitType');
const itemCostPriceInput = document.getElementById('itemCostPrice');
const itemSellingPriceInput = document.getElementById('itemSellingPrice');
const saveInventarisBtn = document.getElementById('saveInventarisBtn');
const inventarisFormMessage = document.getElementById('inventaris-form-message');
const inventarisTableBody = document.getElementById('inventarisTableBody');


// --- Fungsi Pembantu (Ini sudah benar, tidak perlu diubah) ---
function generateUniqueItemCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const length = 8; // Anda bisa sesuaikan panjang kode item
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Fungsi untuk format mata uang
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

// --- FUNGSI UTAMA (Diperbarui) ---

// Fungsi untuk memuat data inventaris
async function loadInventarisData() {
    console.log("Memuat data inventaris...");
    inventarisTableBody.innerHTML = '<tr><td colspan="8">Memuat data...</td></tr>';
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.log('Pengguna belum login saat memuat data inventaris.');
            inventarisTableBody.innerHTML = '<tr><td colspan="8">Silakan login untuk melihat inventaris.</td></tr>';
            return;
        }

        const { data, error } = await supabase
            .from('inventories')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error memuat data inventaris:', error.message);
            inventarisTableBody.innerHTML = `<tr><td colspan="8">Gagal memuat data: ${error.message}</td></tr>`;
            return;
        }

        inventarisTableBody.innerHTML = ''; // Kosongkan tabel
        if (data.length === 0) {
            inventarisTableBody.innerHTML = '<tr><td colspan="8">Belum ada item di inventaris Anda.</td></tr>';
        } else {
            data.forEach(item => {
                const row = document.createElement('tr');

                // Hitung keuntungan per item
                const profitPerItem = item.selling_price - item.cost_price;

                row.innerHTML = `
                    <td>${item.item_code || 'N/A'}</td>
                    <td>${item.item_name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit_type || 'pcs'}</td>
                    <td>${formatCurrency(item.cost_price || 0)}</td>
                    <td>${formatCurrency(item.selling_price || 0)}</td>
                    <td>${formatCurrency(profitPerItem || 0)}</td>
                    <td>
                        <button class="btn btn-info btn-sm edit-btn" data-id="${item.id}">Edit</button>
                        <button class="btn btn-danger btn-sm delete-btn" data-id="${item.id}">Hapus</button>
                    </td>
                `;
                inventarisTableBody.appendChild(row);
            });

            // Tambahkan event listener untuk tombol edit dan hapus
            document.querySelectorAll('.edit-btn').forEach(button => {
                button.addEventListener('click', (e) => openEditModal(e.target.dataset.id));
            });
            document.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', (e) => deleteInventoryItem(e.target.dataset.id));
            });
        }
        console.log('Data inventaris berhasil dimuat.');
    } catch (error) {
        console.error('Error tak terduga saat memuat data inventaris:', error.message);
        inventarisTableBody.innerHTML = `<tr><td colspan="8">Terjadi kesalahan: ${error.message}</td></tr>`;
    }
}

// Fungsi untuk membuka modal edit
async function openEditModal(itemId) {
    console.log("--- openEditModal Dipanggil ---");
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Anda harus login untuk mengedit item.');
            return;
        }

        const { data: item, error } = await supabase
            .from('inventories')
            .select('*')
            .eq('id', itemId)
            .eq('user_id', user.id)
            .single();

        if (error) {
            console.error('Error mengambil item untuk diedit:', error.message);
            alert('Gagal mengambil item untuk diedit: ' + error.message);
            return;
        }

        if (!item) {
            alert('Item tidak ditemukan atau Anda tidak memiliki izin untuk mengeditnya.');
            return;
        }
        console.log("Item ditemukan:", item);

        console.log("Item yang diterima:", item);

        // Debugging: Cek apakah elemen DOM ada sebelum mencoba menggunakannya
        console.log("Cek Elemen DOM:");
        console.log("editItemId:", editItemId);
        console.log("editItemCode:", editItemCode);
        console.log("editItemName:", editItemName);
        console.log("editQuantity:", editQuantity);
        console.log("editUnitType:", editUnitType);
        console.log("editCostPrice:", editCostPrice);
        console.log("editSellingPrice:", editSellingPrice);
        console.log("editItemModal:", editItemModal);

        // Mengisi formulir modal edit dengan data item
        if (editItemId) {
            editItemId.value = item.id;
            console.log("Set editItemId.value to:", item.id);
        }
        if (editItemCode) {
            editItemCode.value = item.item_code || ''; // Pastikan mengisi item_code
            console.log("Set editItemCode.value to:", item.item_code);
        }
        if (editItemName) {
            editItemName.value = item.item_name;
            console.log("Set editItemName.value to:", item.item_name);
        }
        if (editQuantity) {
            editQuantity.value = item.quantity;
            console.log("Set editQuantity.value to:", item.quantity);
        }
        if (editUnitType) {
            editUnitType.value = item.unit_type || 'pcs'; // Default 'pcs' jika kosong
            console.log("Set editUnitType.value to:", item.unit_type);
        }
        if (editCostPrice) {
            editCostPrice.value = item.cost_price || 0; // Menggunakan cost_price
            console.log("Set editCostPrice.value to:", item.cost_price);
        }
        if (editSellingPrice) {
            editSellingPrice.value = item.selling_price || 0; // Menggunakan selling_price
            console.log("Set editSellingPrice.value to:", item.selling_price);
        }


        // Tampilkan modal
        if (editItemModal) {
            editItemModal.style.display = 'flex'; // Menggunakan flex untuk centering
        }
        console.log("Modal display set to flex.");
        console.log("--- openEditModal Selesai ---");

    } catch (error) {
        console.error('Error saat membuka modal edit:', error.message);
        alert('Gagal membuka modal edit: ' + error.message);
    }
}

// --- Event Listener Form Tambah Item (Ini sudah benar) ---
if (saveInventarisBtn) {
    saveInventarisBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        console.log("Tombol Simpan Item ditekan.");

        const itemName = itemNameInput.value.trim();
        const quantity = parseInt(itemQuantityInput.value);
        const itemCode = generateUniqueItemCode(); // Hasilkan kode unik
        const unitType = itemUnitTypeInput.value;
        const costPrice = parseFloat(itemCostPriceInput.value);
        const sellingPrice = parseFloat(itemSellingPriceInput.value);

        // Validasi
        if (!itemName || isNaN(quantity) || isNaN(costPrice) || isNaN(sellingPrice) || quantity < 0 || costPrice < 0 || sellingPrice < 0) {
            inventarisFormMessage.textContent = 'Semua bidang harus diisi dengan nilai yang valid (jumlah/harga tidak boleh negatif).';
            inventarisFormMessage.style.color = 'red';
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                inventarisFormMessage.textContent = 'Anda harus login untuk menambahkan item.';
                inventarisFormMessage.style.color = 'red';
                return;
            }

            const { data, error } = await supabase
                .from('inventories')
                .insert([
                    {
                        user_id: user.id,
                        item_name: itemName,
                        quantity: quantity,
                        item_code: itemCode, // Sertakan item_code
                        unit_type: unitType,
                        cost_price: costPrice,
                        selling_price: sellingPrice
                    }
                ]);

            if (error) {
                console.error('Error saving inventory item:', error.message);
                inventarisFormMessage.textContent = 'Gagal menyimpan item inventaris: ' + error.message;
                inventarisFormMessage.style.color = 'red';
                return;
            }

            inventarisFormMessage.textContent = 'Item inventaris berhasil disimpan!';
            inventarisFormMessage.style.color = 'green';

            // Reset form
            itemNameInput.value = '';
            itemQuantityInput.value = '';
            itemUnitTypeInput.value = 'pcs'; // Reset ke default
            itemCostPriceInput.value = '';
            itemSellingPriceInput.value = '';

            await loadInventarisData(); // Muat ulang data setelah simpan

        } catch (error) {
            console.error('Error saving inventory item:', error.message);
            inventarisFormMessage.textContent = 'Gagal menyimpan item inventaris: ' + error.message;
            inventarisFormMessage.style.color = 'red';
        }
    });
}

// --- Event Listener Form Edit Item (INI ADALAH BAGIAN UTAMA YANG DIREVISI) ---
if (editItemForm) {
    editItemForm.onsubmit = async (e) => {
        e.preventDefault();
        console.log("Edit form submitted!"); // <-- LOGGING BARU

        // Pastikan semua elemen input diambil dengan benar
        const itemId = editItemId ? editItemId.value : null;
        const itemName = editItemName ? editItemName.value.trim() : '';
        const quantity = editQuantity ? parseInt(editQuantity.value) : NaN;
        const unitType = editUnitType ? editUnitType.value : '';
        const costPrice = editCostPrice ? parseFloat(editCostPrice.value) : NaN;
        const sellingPrice = editSellingPrice ? parseFloat(editSellingPrice.value) : NaN; // <-- Pastikan ini yang diambil

        // Perbarui validasi: Pastikan TIDAK ADA referensi ke 'editPrice' di sini.
        if (!itemId || !itemName || isNaN(quantity) || isNaN(costPrice) || isNaN(sellingPrice) || quantity < 0 || costPrice < 0 || sellingPrice < 0) {
            console.log("Validation failed in edit form!"); // <-- LOGGING BARU
            alert('Semua bidang harus diisi dengan nilai yang valid (jumlah/harga tidak boleh negatif).');
            return;
        }
        console.log("Validation passed. Attempting update..."); // <-- LOGGING BARU

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.log("User not logged in for edit!"); // <-- LOGGING BARU
                alert('Anda harus login untuk memperbarui item.');
                return;
            }

            // Payload untuk update
            // Pastikan TIDAK ADA "price" di sini, hanya "cost_price" dan "selling_price"
            const updatePayload = {
                item_name: itemName,
                quantity: quantity,
                unit_type: unitType,
                cost_price: costPrice,
                selling_price: sellingPrice,
                last_updated: new Date().toISOString()
                // item_code TIDAK di-update karena kita set readonly
            };
            console.log("Update payload:", updatePayload); // <-- LOGGING BARU

            const { data, error } = await supabase
                .from('inventories')
                .update(updatePayload)
                .eq('id', itemId)
                .eq('user_id', user.id); // Pastikan user_id juga cocok

            if (error) {
                console.error('Supabase update error:', error); // <-- LOGGING LEBIH DETAIL
                throw error;
            }

            alert('Item inventaris berhasil diperbarui!');
            if (editItemModal) editItemModal.style.display = 'none'; // Sembunyikan modal
            await loadInventarisData(); // Muat ulang data setelah update
        } catch (error) {
            console.error('Error updating inventory item (catch block):', error.message);
            alert('Gagal memperbarui item inventaris: ' + error.message);
        }
    };
}


// --- Event Listener Lainnya ---
if (closeEditModalBtn) {
    closeEditModalBtn.addEventListener('click', () => {
        if (editItemModal) editItemModal.style.display = 'none';
        console.log("Modal ditutup via tombol X.");
    });
}

if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', () => {
        if (editItemModal) editItemModal.style.display = 'none';
        console.log("Modal ditutup via tombol Batal.");
    });
}

// ... (lanjutkan dengan event listener untuk delete, login, logout, dll. yang sudah Anda miliki)
// Pastikan tombol delete memanggil deleteInventoryItem
async function deleteInventoryItem(itemId) {
    if (!confirm('Apakah Anda yakin ingin menghapus item ini?')) {
        return;
    }

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert('Anda harus login untuk menghapus item.');
            return;
        }

        const { error } = await supabase
            .from('inventories')
            .delete()
            .eq('id', itemId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error menghapus item inventaris:', error.message);
            alert('Gagal menghapus item inventaris: ' + error.message);
            return;
        }

        alert('Item berhasil dihapus.');
        await loadInventarisData();
    } catch (error) {
        console.error('Error tak terduga saat menghapus item:', error.message);
        alert('Gagal menghapus item inventaris: ' + error.message);
    }
}


// *** CATATAN PENTING ***
// Pastikan Anda sudah menghapus kolom 'price' di Supabase.
// Pastikan file index.html Anda sudah diperbarui dengan semua input baru dan tampilan tabel yang benar.
// Kedua poin di atas sudah dikonfirmasi "beres" dari log dan gambar terakhir Anda, jadi fokus pada script.js ini.
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
		const unitType = editUnitType ? editUnitType.value : ''; // <-- BARU
		const costPrice = editCostPrice ? parseFloat(editCostPrice.value) : NaN; // <-- BARU
        const sellingPrice = editSellingPrice ? parseFloat(editSellingPrice.value) : NaN; // <-- BARU
        const price = editPrice ? parseFloat(editPrice.value) : NaN;

        if (!itemId || !itemName || isNaN(quantity) || isNaN(price) || quantity < 0 || price < 0) {
            alert('Semua bidang harus diisi dengan nilai yang valid (jumlah/harga tidak boleh negatif).');
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser(); 
            if (!user) {
                alert('Anda harus login untuk memperbarui item.');
                return;
            }

            const { data, error } = await supabase
                .from('inventories')
                .update({
                    item_name: itemName,
                    quantity: quantity,
                    price: price,
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