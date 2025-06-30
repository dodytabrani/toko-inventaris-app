// --- 1. INISIALISASI SUPABASE ---
// Ganti dengan URL dan Anon Key Supabase Anda
const SUPABASE_URL = 'https://sjxhosrvcmejqprooofk.supabase.co'; // <-- GANTI INI
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGhvc3J2Y21lanFwcm9vb2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzIxMzEsImV4cCI6MjA2NjgwODEzMX0.n3RmP7ouaZSPBuymRi6axXWZQc_DJKi2gX0VEeV3o4U'; // <-- GANTI INI

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 2. REFERENSI ELEMEN DOM ---
const mainLoginBtn = document.getElementById('mainLoginBtn');
const mainLogoutBtn = document.getElementById('mainLogoutBtn');

const authSection = document.getElementById('auth-section');
const signupEmailInput = document.getElementById('signupEmail');
const signupPasswordInput = document.getElementById('signupPassword');
const signupBtn = document.getElementById('signupBtn');
const signupMessage = document.getElementById('signupMessage');

const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginMessage = document.getElementById('loginMessage');

const appSection = document.getElementById('app-section');
const userEmailSpan = document.getElementById('userEmail');
const licenseStatusDiv = document.getElementById('license-status');
const logoutBtn = document.getElementById('logoutBtn');
const inventarisDataDiv = document.getElementById('inventaris-data');
const inventarisTableBody = document.getElementById('inventarisTableBody'); // Pastikan ID ini ada di HTML

const addInventarisBtn = document.getElementById('addInventarisBtn');
const addInventarisForm = document.getElementById('add-inventaris-form');
const itemNameInput = document.getElementById('itemName');
const itemQuantityInput = document.getElementById('itemQuantity');
const itemUnitTypeInput = document.getElementById('itemUnitType'); // BARU
const itemCostPriceInput = document.getElementById('itemCostPrice'); // BARU
const itemSellingPriceInput = document.getElementById('itemSellingPrice'); // BARU
const saveInventarisBtn = document.getElementById('saveInventarisBtn');
const cancelAddInventarisBtn = document.getElementById('cancelAddInventarisBtn');
const inventarisFormMessage = document.getElementById('inventaris-form-message');

const editItemModal = document.getElementById('editItemModal');
const closeEditModalBtn = editItemModal ? editItemModal.querySelector('.close-button') : null;
const editItemForm = document.getElementById('editItemForm');
const editItemId = document.getElementById('editItemId');
const editItemCode = document.getElementById('editItemCode'); // BARU
const editItemName = document.getElementById('editItemName');
const editQuantity = document.getElementById('editQuantity');
const editUnitType = document.getElementById('editUnitType'); // BARU
const editCostPrice = document.getElementById('editCostPrice'); // BARU
const editSellingPrice = document.getElementById('editSellingPrice'); // BARU
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

const adminLoginSection = document.getElementById('admin-login-section');
const adminEmailInput = document.getElementById('adminEmail');
const adminPasswordInput = document.getElementById('adminPassword');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLoginMessage = document.getElementById('adminLoginMessage');

const adminPanelSection = document.getElementById('admin-panel-section');
const refreshLicensesBtn = document.getElementById('refreshLicensesBtn');
const licensesTableBody = document.getElementById('licenses-table-body');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');


// --- 3. FUNGSI UTAMA APLIKASI ---

// Fungsi untuk memeriksa status autentikasi dan mengarahkan user
async function checkUserRoleAndRedirect(user) {
    if (user) {
        userEmailSpan.textContent = user.email;
        mainLoginBtn.style.display = 'none';
        mainLogoutBtn.style.display = 'inline-block';

        // Ambil peran user dari tabel 'users'
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (userError || !userData) {
            console.error("Error fetching user role:", userError ? userError.message : "User data not found.");
            // Jika ada error atau user tidak ditemukan di tabel public.users, logout saja
            await supabase.auth.signOut();
            alert("Gagal memuat peran pengguna. Silakan login kembali.");
            showAuthSection();
            return;
        }

        if (userData.role === 'admin') {
            showAdminPanel();
            loadLicensesData();
        } else {
            showAppSection();
            await checkLicenseStatus(user.id);
            await loadInventarisData();
        }
    } else {
        showAuthSection();
    }
}

// Fungsi untuk menampilkan bagian autentikasi
function showAuthSection() {
    authSection.style.display = 'block';
    appSection.style.display = 'none';
    adminPanelSection.style.display = 'none';
    adminLoginSection.style.display = 'block'; // Tampilkan juga form admin login
    mainLoginBtn.style.display = 'inline-block';
    mainLogoutBtn.style.display = 'none';
}

// Fungsi untuk menampilkan bagian aplikasi user
function showAppSection() {
    authSection.style.display = 'none';
    appSection.style.display = 'block';
    adminPanelSection.style.display = 'none';
    adminLoginSection.style.display = 'none';
    mainLoginBtn.style.display = 'none';
    mainLogoutBtn.style.display = 'inline-block';
}

// Fungsi untuk menampilkan panel admin
function showAdminPanel() {
    authSection.style.display = 'none';
    appSection.style.display = 'none';
    adminPanelSection.style.display = 'block';
    adminLoginSection.style.display = 'none';
    mainLoginBtn.style.display = 'none';
    mainLogoutBtn.style.display = 'inline-block';
}

// Fungsi untuk memeriksa status lisensi user
async function checkLicenseStatus(userId) {
    const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 indicates no rows found
        console.error("Error fetching license:", error.message);
        licenseStatusDiv.textContent = 'Error memuat status lisensi.';
        licenseStatusDiv.className = 'message error';
        addInventarisBtn.style.display = 'none';
        return;
    }

    if (!data || !data.is_active || new Date(data.expiry_date) < new Date()) {
        licenseStatusDiv.textContent = 'Lisensi Anda TIDAK AKTIF atau sudah kadaluarsa.';
        licenseStatusDiv.className = 'message error';
        addInventarisBtn.style.display = 'none';
    } else {
        const expiryDate = new Date(data.expiry_date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        licenseStatusDiv.textContent = `Lisensi Anda aktif hingga ${expiryDate}.`;
        licenseStatusDiv.className = 'message success';
        addInventarisBtn.style.display = 'inline-block'; // Tampilkan tombol tambah item
    }
}

// Fungsi untuk memuat data lisensi (untuk admin)
async function loadLicensesData() {
    if (!licensesTableBody) {
        console.error("Elemen licensesTableBody tidak ditemukan.");
        return;
    }
    licensesTableBody.innerHTML = '<tr><td colspan="5">Memuat daftar lisensi...</td></tr>';

    try {
        // Hanya ambil lisensi yang dimiliki oleh user dengan role 'user'
        const { data, error } = await supabase
            .from('licenses')
            .select('*, users(email, role)'); // Join dengan tabel users untuk mendapatkan email

        if (error) {
            console.error('Error loading licenses:', error.message);
            licensesTableBody.innerHTML = `<tr><td colspan="5">Gagal memuat lisensi: ${error.message}</td></tr>`;
            return;
        }

        let html = '';
        if (data.length === 0) {
            html = '<tr><td colspan="5">Tidak ada lisensi terdaftar.</td></tr>';
        } else {
            data.forEach(license => {
                const expiryDate = new Date(license.expiry_date).toLocaleDateString('id-ID');
                const status = license.is_active ? 'Aktif' : 'Tidak Aktif';
                const email = license.users ? license.users.email : 'N/A'; // Dapatkan email dari join
                html += `
                    <tr>
                        <td>${email}</td>
                        <td>${license.id}</td>
                        <td>${status}</td>
                        <td>${expiryDate}</td>
                        <td>
                            <button class="toggle-license-btn" data-id="${license.id}" data-status="${license.is_active ? 'active' : 'inactive'}">
                                ${license.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                        </td>
                    </tr>
                `;
            });
        }
        licensesTableBody.innerHTML = html;

        // Tambahkan event listener untuk tombol toggle lisensi
        document.querySelectorAll('.toggle-license-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const licenseId = e.target.dataset.id;
                const currentStatus = e.target.dataset.status === 'active';
                const newStatus = !currentStatus;

                const { error: updateError } = await supabase
                    .from('licenses')
                    .update({ is_active: newStatus })
                    .eq('id', licenseId);

                if (updateError) {
                    console.error('Error toggling license status:', updateError.message);
                    alert('Gagal mengubah status lisensi: ' + updateError.message);
                } else {
                    alert('Status lisensi berhasil diubah.');
                    await loadLicensesData(); // Muat ulang data lisensi
                }
            });
        });

    } catch (error) {
        console.error('Error in loadLicensesData (catch block):', error.message);
        licensesTableBody.innerHTML = `<tr><td colspan="5">Terjadi kesalahan: ${error.message}</td></tr>`;
    }
}


// Muat Data Inventaris
async function loadInventarisData() {
    console.log("Memuat data inventaris...");
    // Periksa apakah inventarisDataDiv ada sebelum menggunakannya
    if (!inventarisDataDiv) {
        console.error("Elemen 'inventaris-data' tidak ditemukan. Pastikan ID-nya benar di HTML.");
        return;
    }
    
    // Tampilkan pesan loading di dalam elemen inventarisDataDiv
    inventarisDataDiv.innerHTML = '<p>Memuat data inventaris...</p>';

    try {
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

        // --- PENTING: SELECTION KOLOM YANG BENAR ---
        const { data, error } = await supabase
            .from('inventories')
            .select('id, item_code, item_name, quantity, unit_type, cost_price, selling_price') // <- Pastikan semua kolom harga dan unit_type dipilih
            .eq('user_id', user.id) // Penting: Hanya ambil data user yang login
            .order('created_at', { ascending: false }); // Urutkan berdasarkan tanggal terbaru

        if (error) {
            console.error("Error loading inventaris:", error.message);
            inventarisDataDiv.innerHTML = '<p class="message error">Gagal memuat data inventaris. Pastikan RLS diatur dengan benar.</p>';
        } else {
            let html = `
                <table>
                    <thead>
                        <tr>
                            <th>Kode Item</th> <th>Nama Item</th>
                            <th>Jumlah</th>
                            <th>Satuan</th> <th>Harga Modal</th> <th>Harga Jual</th> <th>Keuntungan/Item</th> <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            if (data.length === 0) {
                html += `<tr><td colspan="8">Anda belum memiliki item inventaris. Klik "Tambah Item" untuk memulai.</td></tr>`;
            } else {
                data.forEach(item => {
                    const profitPerItem = (item.selling_price || 0) - (item.cost_price || 0);
                    const formattedCostPrice = item.cost_price ? `Rp ${item.cost_price.toLocaleString('id-ID')}` : 'Rp 0';
                    const formattedSellingPrice = item.selling_price ? `Rp ${item.selling_price.toLocaleString('id-ID')}` : 'Rp 0';
                    const formattedProfit = `Rp ${profitPerItem.toLocaleString('id-ID')}`;

                    html += `
                        <tr>
                            <td>${item.item_code || 'N/A'}</td> <td>${item.item_name}</td>
                            <td>${item.quantity}</td>
                            <td>${item.unit_type || 'pcs'}</td> <td>${formattedCostPrice}</td> <td>${formattedSellingPrice}</td> <td class="${profitPerItem < 0 ? 'text-red' : (profitPerItem > 0 ? 'text-green' : '')}">${formattedProfit}</td> <td>
                                <button class="edit-item-btn" data-id="${item.id}">Edit</button>
                                <button class="delete-item-btn" data-id="${item.id}">Hapus</button>
                            </td>
                        </tr>
                    `;
                });
            }
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
                        alert('Gagal menemukan item untuk diedit.');
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
    } catch (error) {
        console.error("Error dalam loadInventarisData (catch block):", error.message);
        inventarisDataDiv.innerHTML = `<p class="message error">Terjadi kesalahan: ${error.message}</p>`;
    }
}


// --- FUNGSI GENERATE KODE ITEM UNIK ---
function generateUniqueItemCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < 8; i++) { // Generate 8 karakter kode
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


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

    // Debugging keberadaan elemen DOM
    console.log('Cek Elemen DOM:');
    console.log('editItemId:', editItemId);
    console.log('editItemCode:', editItemCode);
    console.log('editItemName:', editItemName);
    console.log('editQuantity:', editQuantity);
    console.log('editUnitType:', editUnitType);
    console.log('editCostPrice:', editCostPrice);
    console.log('editSellingPrice:', editSellingPrice);
    
    console.log('editItemModal:', editItemModal);

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
} else {
    console.warn("closeEditModalBtn not found. Check if .close-button exists inside #editItemModal.");
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
        console.log("Edit form submitted!"); // Debugging
        
        const itemId = editItemId ? editItemId.value : null;
        const itemName = editItemName ? editItemName.value.trim() : '';
        const quantity = editQuantity ? parseInt(editQuantity.value) : NaN;
        const unitType = editUnitType ? editUnitType.value : '';
        const costPrice = editCostPrice ? parseFloat(editCostPrice.value) : NaN;
        const sellingPrice = editSellingPrice ? parseFloat(editSellingPrice.value) : NaN;

        // Validasi input
        if (!itemId || !itemName || isNaN(quantity) || isNaN(costPrice) || isNaN(sellingPrice) || quantity < 0 || costPrice < 0 || sellingPrice < 0) {
            alert('Semua bidang harus diisi dengan nilai yang valid (jumlah/harga tidak boleh negatif).');
            console.log("Validation failed in edit form! ItemId:", itemId, "itemName:", itemName, "quantity:", quantity, "costPrice:", costPrice, "sellingPrice:", sellingPrice); // Debugging
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser(); 
            if (!user) {
                alert('Anda harus login untuk memperbarui item.');
                return;
            }

            const updatePayload = {
                item_name: itemName,
                quantity: quantity,
                unit_type: unitType,
                cost_price: costPrice,
                selling_price: sellingPrice,
                last_updated: new Date().toISOString()
            };
            console.log("Update payload:", updatePayload); // Debugging

            const { data, error } = await supabase
                .from('inventories')
                .update(updatePayload)
                .eq('id', itemId)
                .eq('user_id', user.id); // Penting: Pastikan user_id cocok

            if (error) {
                console.error('Supabase update error:', error.message); // Debugging
                throw error;
            }

            alert('Item inventaris berhasil diperbarui!');
            if (editItemModal) editItemModal.style.display = 'none';
            await loadInventarisData(); // Muat ulang data setelah update
        } catch (error) {
            console.error('Error updating inventory item (catch block):', error.message); // Debugging
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
                unit_type: itemUnitType,
                cost_price: itemCostPrice,
                selling_price: itemSellingPrice,
                item_code: newItemCode,
                user_id: user.id // Penting: Pastikan user_id disimpan saat insert
                // created_at dan last_updated seharusnya otomatis diurus oleh DB jika default valuenya NOW()
            }
        ])
        .select(); // Tambahkan .select() untuk mendapatkan data yang baru diinsert

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


// --- INITIAL LOAD PADA SAAT HALAMAN DIMUAT ---
document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    await checkUserRoleAndRedirect(user);
});

// Event listener untuk perubahan auth state (misal: setelah login/logout)
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session);
    if (session) {
        checkUserRoleAndRedirect(session.user);
    } else {
        showAuthSection();
    }
});