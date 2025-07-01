// 1. Inisialisasi Supabase
const SUPABASE_URL = 'https://sjxhosrvcmejqprooofk.supabase.co'; // Ganti dengan URL Supabase Anda
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGhvc3J2Y21lanFwcm9vb2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzIxMzEsImV4cCI6MjA2NjgwODEzMX0.n3RmP7ouaZSPBuymRi6axXWZQc_DJKi2gX0VEeV3o4U'; // Ganti dengan Anon Key Supabase Anda

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 2. Deklarasi Elemen DOM (Pastikan ID ini cocok dengan HTML Anda)
// Autentikasi
const authSection = document.getElementById('auth-section');
const signupEmailInput = document.getElementById('signupEmail');
const signupPasswordInput = document.getElementById('signupPassword');
const signupBtn = document.getElementById('signupBtn');
const signupMessage = document.getElementById('signupMessage');
const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginMessage = document.getElementById('loginMessage');

// App Section (User Dashboard)
const appSection = document.getElementById('app-section');
const userEmailSpan = document.getElementById('userEmail');
const licenseStatus = document.getElementById('license-status');
const logoutBtn = document.getElementById('logoutBtn'); // Logout di dalam app-section

// Admin Login Section
const adminLoginSection = document.getElementById('admin-login-section');
const adminEmailInput = document.getElementById('adminEmail');
const adminPasswordInput = document.getElementById('adminPassword');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLoginMessage = document.getElementById('adminLoginMessage');

// Admin Panel Section
const adminPanelSection = document.getElementById('admin-panel-section');
const refreshLicensesBtn = document.getElementById('refreshLicensesBtn');
const licensesTableBody = document.getElementById('licenses-table-body');
const adminLogoutBtn = document.getElementById('adminLogoutBtn'); // Logout di dalam admin panel

// Main Header Buttons
const mainLoginBtn = document.getElementById('mainLoginBtn');
const mainLogoutBtn = document.getElementById('mainLogoutBtn');

// Inventaris User
const addInventarisBtn = document.getElementById('addInventarisBtn');
const addInventarisForm = document.getElementById('add-inventaris-form');
const itemNameInput = document.getElementById('itemName');
const itemQuantityInput = document.getElementById('itemQuantity');
const itemUnitTypeInput = document.getElementById('itemUnitType');
const itemCostPriceInput = document.getElementById('itemCostPrice');
const itemSellingPriceInput = document.getElementById('itemSellingPrice');
const saveInventarisBtn = document.getElementById('saveInventarisBtn');
const cancelAddInventarisBtn = document.getElementById('cancelAddInventarisBtn');
const inventarisFormMessage = document.getElementById('inventaris-form-message');
const inventarisDataDiv = document.getElementById('inventaris-data');
const inventarisTableBody = document.getElementById('inventarisTableBody');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageNumbersDiv = document.getElementById('pageNumbers');

// Filter & Search (ID SESUAI HTML)
const searchInput = document.getElementById('searchItemInput'); // ID disesuaikan
const unitTypeFilter = document.getElementById('filterUnitType'); // ID disesuaikan

// Modal Edit Item
const editItemModal = document.getElementById('editItemModal');
const closeEditModalBtn = editItemModal ? editItemModal.querySelector('.close-button') : null;
const editItemForm = document.getElementById('editItemForm');
const editItemId = document.getElementById('editItemId');
const editItemCode = document.getElementById('editItemCode');
const editItemName = document.getElementById('editItemName');
const editQuantity = document.getElementById('editQuantity');
const editUnitType = document.getElementById('editUnitType');
const editCostPrice = document.getElementById('editCostPrice');
const editSellingPrice = document.getElementById('editSellingPrice');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// 3. Variabel Global untuk Paginasi
const ITEMS_PER_PAGE = 5; // Jumlah item per halaman
let currentPage = 1;
let totalPages = 1;

// 4. Fungsi-fungsi Bantuan
function generateUniqueItemCode() {
    const timestamp = Date.now().toString().slice(-6); // 6 digit terakhir dari timestamp
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 3 digit random
    return `INV-${timestamp}-${random}`;
}

async function checkUserRoleAndRedirect(user) {
    console.log('--- checkUserRoleAndRedirect: Dipanggil untuk user:', user ? user.email : 'null', '---');
    if (!user) {
        console.log('--- checkUserRoleAndRedirect: Tidak ada user, menampilkan auth section ---');
        authSection.style.display = 'block';
        appSection.style.display = 'none';
        adminPanelSection.style.display = 'none';
        adminLoginSection.style.display = 'block';
        mainLoginBtn.style.display = 'inline-block';
        mainLogoutBtn.style.display = 'none';
        return;
    }

    const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (error || !data) {
        console.error("--- checkUserRoleAndRedirect: Error fetching user role:", error ? error.message : 'No data', '---');
        // Fallback to app-section or force logout if role cannot be determined
        showUserApp(); // Default to user app if role not found
        return;
    }

    console.log('--- checkUserRoleAndRedirect: User role:', data.role, '---');
    if (data.role === 'admin') {
        showAdminPanel();
    } else {
        showUserApp();
    }
}

async function showUserApp() {
    console.log('--- showUserApp: Memulai tampilan aplikasi user ---');
    authSection.style.display = 'none';
    adminLoginSection.style.display = 'none';
    adminPanelSection.style.display = 'none';
    appSection.style.display = 'block'; // Pastikan ini 'block'
    addInventarisForm.style.display = 'none'; // Pastikan form inventaris tersembunyi
    mainLoginBtn.style.display = 'none';
    mainLogoutBtn.style.display = 'inline-block';
    console.log('--- showUserApp: Elemen tampilan diatur ---');

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        userEmailSpan.textContent = user.email;
        console.log('--- showUserApp: Email user disetel:', user.email, '---');
    } else {
        console.log('--- showUserApp: Tidak ada user setelah login (ini aneh, seharusnya ada) ---');
        // Optional: force logout if user somehow disappears
        // supabase.auth.signOut();
    }

    await checkLicenseStatus();
    console.log('--- showUserApp: checkLicenseStatus selesai ---');

    // Pastikan loadInventarisData dipanggil dengan parameter kosong/default saat pertama kali load
    await loadInventarisData('', '');
    console.log('--- showUserApp: loadInventarisData selesai ---');
    console.log('--- showUserApp: Selesai ---');
}

async function showAdminPanel() {
    console.log('--- showAdminPanel: Memulai tampilan panel admin ---');
    authSection.style.display = 'none';
    appSection.style.display = 'none';
    adminLoginSection.style.display = 'none';
    adminPanelSection.style.display = 'block'; // Pastikan ini 'block'
    mainLoginBtn.style.display = 'none';
    mainLogoutBtn.style.display = 'inline-block';
    console.log('--- showAdminPanel: Elemen tampilan diatur ---');
    await loadLicensesData();
    console.log('--- showAdminPanel: loadLicensesData selesai ---');
}

async function checkLicenseStatus() {
    console.log('--- checkLicenseStatus: Memeriksa status lisensi ---');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        licenseStatus.textContent = 'Tidak login.';
        licenseStatus.className = 'message error';
        console.log('--- checkLicenseStatus: User tidak login ---');
        return;
    }

    const { data: license, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
        console.error("--- checkLicenseStatus: Error fetching license:", error.message, '---');
        licenseStatus.textContent = 'Gagal memuat status lisensi.';
        licenseStatus.className = 'message error';
        return;
    }

    if (license && license.is_active && new Date(license.expiry_date) > new Date()) {
        licenseStatus.textContent = `Lisensi aktif hingga: ${new Date(license.expiry_date).toLocaleDateString()}`;
        licenseStatus.className = 'message success';
        console.log('--- checkLicenseStatus: Lisensi aktif ---');
    } else {
        licenseStatus.textContent = 'Lisensi tidak aktif atau sudah kadaluarsa. Harap hubungi admin.';
        licenseStatus.className = 'message error';
        console.log('--- checkLicenseStatus: Lisensi tidak aktif atau kadaluarsa ---');
    }
}

async function loadLicensesData() {
    console.log('--- loadLicensesData: Memuat data lisensi ---');
    if (!licensesTableBody) {
        console.error('--- loadLicensesData: licensesTableBody element not found! ---');
        return;
    }

    licensesTableBody.innerHTML = '<tr><td colspan="5">Memuat data...</td></tr>';

    const { data: licenses, error } = await supabase
        .from('licenses')
        .select(`
            *,
            users (email)
        `); // Fetch related user email

    if (error) {
        console.error("--- loadLicensesData: Error fetching licenses:", error.message, '---');
        licensesTableBody.innerHTML = `<tr><td colspan="5">Error: ${error.message}</td></tr>`;
        return;
    }

    if (licenses.length === 0) {
        licensesTableBody.innerHTML = '<tr><td colspan="5">Tidak ada lisensi terdaftar.</td></tr>';
        console.log('--- loadLicensesData: Tidak ada lisensi ditemukan ---');
        return;
    }

    licensesTableBody.innerHTML = '';
    licenses.forEach(license => {
        const row = licensesTableBody.insertRow();
        const expiryDate = new Date(license.expiry_date);
        const isActive = license.is_active && expiryDate > new Date();
        const statusText = isActive ? 'Aktif' : 'Tidak Aktif / Kadaluarsa';
        const statusClass = isActive ? 'status-active' : 'status-inactive';

        row.insertCell(0).textContent = license.users ? license.users.email : 'N/A'; // Display user email
        row.insertCell(1).textContent = license.id;
        row.insertCell(2).innerHTML = `<span class="${statusClass}">${statusText}</span>`;
        row.insertCell(3).textContent = expiryDate.toLocaleDateString();

        const actionCell = row.insertCell(4);
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = isActive ? 'Nonaktifkan' : 'Aktifkan';
        toggleBtn.className = isActive ? 'btn-danger' : 'btn-success';
        toggleBtn.onclick = async () => {
            const { error: updateError } = await supabase
                .from('licenses')
                .update({ is_active: !isActive, expiry_date: isActive ? expiryDate.toISOString() : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString() }) // Toggle status, extend by 1 year if activating
                .eq('id', license.id);

            if (updateError) {
                console.error("--- loadLicensesData: Error updating license:", updateError.message, '---');
                alert('Gagal memperbarui status lisensi: ' + updateError.message);
            } else {
                alert('Status lisensi berhasil diperbarui!');
                loadLicensesData(); // Reload data
            }
        };
        actionCell.appendChild(toggleBtn);
    });
    console.log('--- loadLicensesData: Data lisensi dimuat selesai ---');
}

async function loadInventarisData(searchTerm = '', filterUnitType = '') {
    console.log(`--- loadInventarisData: Memuat data inventaris (search: "${searchTerm}", filter: "${filterUnitType}") ---`);

    if (!inventarisTableBody) {
        console.error('--- loadInventarisData: inventarisTableBody element not found! ---');
        return;
    }

    inventarisTableBody.innerHTML = '<tr><td colspan="9">Memuat data...</td></tr>';
    let query = supabase.from('inventories').select('*', { count: 'exact' });

    const { data: { user } = {} } = await supabase.auth.getUser();
    if (user) {
        query = query.eq('user_id', user.id);
    } else {
        inventarisTableBody.innerHTML = '<tr><td colspan="9">Silakan login untuk melihat inventaris Anda.</td></tr>';
        console.log('--- loadInventarisData: User tidak login, tidak bisa memuat inventaris ---');
        return;
    }

    // Apply search filter
    if (searchTerm) {
        query = query.or(`item_name.ilike.%${searchTerm}%,item_code.ilike.%${searchTerm}%`);
    }

    // Apply unit type filter
    if (filterUnitType) {
        query = query.eq('unit_type', filterUnitType);
    }

    // Paginasi
    const { count, error: countError } = await query.range(0, 0); // Get count without fetching data
    if (countError) {
        console.error("--- loadInventarisData: Error fetching inventory count:", countError.message, '---');
        inventarisTableBody.innerHTML = `<tr><td colspan="9">Error memuat jumlah item: ${countError.message}</td></tr>`;
        return;
    }
    totalPages = Math.ceil(count / ITEMS_PER_PAGE);

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data: inventories, error } = await query;

    if (error) {
        console.error("--- loadInventarisData: Error fetching inventories:", error.message, '---');
        inventarisTableBody.innerHTML = `<tr><td colspan="9">Error: ${error.message}</td></tr>`;
        return;
    }

    inventarisTableBody.innerHTML = '';
    if (inventories.length === 0) {
        inventarisTableBody.innerHTML = '<tr><td colspan="9">Tidak ada item inventaris yang ditemukan.</td></tr>';
        console.log('--- loadInventarisData: Tidak ada item inventaris ditemukan ---');
        return;
    }

    inventories.forEach(item => {
        const row = inventarisTableBody.insertRow();
        const profitPerItem = item.selling_price - item.cost_price;

        row.insertCell(0).textContent = item.item_code;
        row.insertCell(1).textContent = item.item_name;
        row.insertCell(2).textContent = item.quantity;
        row.insertCell(3).textContent = item.unit_type;
        row.insertCell(4).textContent = `Rp ${item.cost_price.toLocaleString('id-ID')}`;
        row.insertCell(5).textContent = `Rp ${item.selling_price.toLocaleString('id-ID')}`;
        row.insertCell(6).textContent = `Rp ${profitPerItem.toLocaleString('id-ID')}`;

        const actionCell = row.insertCell(7);
        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.className = 'edit-item-btn';
        editButton.dataset.id = item.id;
        actionCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Hapus';
        deleteButton.className = 'delete-item-btn';
        deleteButton.dataset.id = item.id;
        actionCell.appendChild(deleteButton);
    });

    updatePaginationControls();
    console.log('--- loadInventarisData: Data inventaris dimuat selesai ---');
}

function updatePaginationControls() {
    if (!pageNumbersDiv || !prevPageBtn || !nextPageBtn) {
        console.error('--- updatePaginationControls: Pagination elements not found! ---');
        return;
    }

    pageNumbersDiv.innerHTML = `Halaman ${currentPage} dari ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
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


// 5. Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    console.log('--- DOMContentLoaded: Skrip dimulai ---');

    // Cek sesi Supabase saat aplikasi dimuat
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        console.log('--- DOMContentLoaded: Sesi ditemukan, mengarahkan berdasarkan peran ---');
        await checkUserRoleAndRedirect(session.user);
    } else {
        console.log('--- DOMContentLoaded: Tidak ada sesi, menampilkan auth section ---');
        authSection.style.display = 'block';
        adminLoginSection.style.display = 'block';
        appSection.style.display = 'none';
        adminPanelSection.style.display = 'none';
        mainLoginBtn.style.display = 'inline-block';
        mainLogoutBtn.style.display = 'none';
    }

    // Navigasi Paginasi
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadInventarisData(searchInput.value.trim(), unitTypeFilter.value);
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadInventarisData(searchInput.value.trim(), unitTypeFilter.value);
            }
        });
    }

    // Event Listener untuk Edit/Delete (delegasi event)
    if (inventarisDataDiv) {
        inventarisDataDiv.addEventListener('touchend', async (e) => { // Menggunakan touchend untuk mobile
            console.log('--- inventarisDataDiv touchend dipicu ---');
            console.log('Target event:', e.target);

            // Cek apakah yang diklik adalah tombol Edit
            if (e.target.matches('.edit-item-btn')) {
                console.log('Tombol Edit diklik!');
                const itemId = e.target.dataset.id;
                console.log('Tombol Edit diklik untuk ID:', itemId);

                const { data: itemToEdit, error } = await supabase
                    .from('inventories')
                    .select('*')
                    .eq('id', itemId)
                    .single();

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
                console.log('Tombol Hapus diklik!');
                const itemId = e.target.dataset.id;
                console.log('Tombol Hapus diklik untuk ID:', itemId);

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
                        loadInventarisData(searchInput.value.trim(), unitTypeFilter.value); // Muat ulang data setelah penghapusan
                    }
                }
            }
        });
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
            console.log('--- editItemForm submit dipicu ---');

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
                await loadInventarisData(searchInput.value.trim(), unitTypeFilter.value); // Muat ulang data setelah update
            } catch (error) {
                console.error('Error updating inventory item:', error.message);
                alert('Gagal memperbarui item inventaris: ' + error.message);
            }
        };
    }

    // --- EVENT LISTENERS UTAMA (NON-MODAL) ---

    // Tombol Login/Daftar Utama (Header)
    if (mainLoginBtn) {
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
    if (mainLogoutBtn) {
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
    if (signupBtn) {
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
                // Ini mungkin terjadi jika email confirmation diaktifkan dan user belum konfirmasi
                signupMessage.textContent = 'Pendaftaran berhasil. Silakan cek email Anda untuk konfirmasi.';
                signupMessage.className = 'message info';
                signupEmailInput.value = '';
                signupPasswordInput.value = '';
            }
        });
    }

    // Login User
    if (loginBtn) {
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
    }

    // Admin Login
    if (adminLoginBtn) {
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
    if (adminLogoutBtn) {
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

    if (refreshLicensesBtn) {
        refreshLicensesBtn.addEventListener('click', loadLicensesData);
    }

    /// Event listener untuk tombol "Tambah Item"
    if (addInventarisBtn) {
        addInventarisBtn.addEventListener('click', () => {
            addInventarisForm.style.display = 'block'; // Tampilkan form
            addInventarisBtn.style.display = 'none'; // Sembunyikan tombol "Tambah Item"

            // Kosongkan dan reset semua input form tambah item
            if (itemNameInput) itemNameInput.value = '';
            if (itemQuantityInput) itemQuantityInput.value = '';
            if (itemUnitTypeInput) itemUnitTypeInput.value = 'pcs'; // Atur nilai default 'pcs'
            if (itemCostPriceInput) itemCostPriceInput.value = '';
            if (itemSellingPriceInput) itemSellingPriceInput.value = '';

            if (inventarisFormMessage) {
                inventarisFormMessage.textContent = ''; // Kosongkan pesan
                inventarisFormMessage.className = 'message';
            }
        });
    }

    // Event listener untuk tombol "Batal" di form tambah item
    if (cancelAddInventarisBtn) {
        cancelAddInventarisBtn.addEventListener('click', () => {
            addInventarisForm.style.display = 'none'; // Sembunyikan form
            addInventarisBtn.style.display = 'inline-block'; // Tampilkan kembali tombol "Tambah Item"
        });
    }

    // Event listener untuk tombol "Simpan Item"
    if (saveInventarisBtn) {
        saveInventarisBtn.addEventListener('click', async () => {
            const itemName = itemNameInput ? itemNameInput.value.trim() : '';
            const itemQuantity = itemQuantityInput ? parseInt(itemQuantityInput.value) : NaN;
            const itemUnitType = itemUnitTypeInput ? itemUnitTypeInput.value : '';
            const itemCostPrice = itemCostPriceInput ? parseFloat(itemCostPriceInput.value) : NaN;
            const itemSellingPrice = itemSellingPriceInput ? parseFloat(itemSellingPriceInput.value) : NaN;

            if (inventarisFormMessage) inventarisFormMessage.textContent = '';

            if (!itemName || isNaN(itemQuantity) || isNaN(itemCostPrice) || isNaN(itemSellingPrice) || itemQuantity < 0 || itemCostPrice < 0 || itemSellingPrice < 0) {
                if (inventarisFormMessage) {
                    inventarisFormMessage.textContent = 'Semua bidang harus diisi dengan nilai yang valid (jumlah/harga tidak boleh negatif).';
                    inventarisFormMessage.className = 'message error';
                }
                return;
            }

            const { data: { user } = {} } = await supabase.auth.getUser();
            if (!user) {
                if (inventarisFormMessage) {
                    inventarisFormMessage.textContent = 'Anda harus login untuk menambah item.';
                    inventarisFormMessage.className = 'message error';
                }
                return;
            }

            // Pastikan user memiliki lisensi aktif sebelum menambah item inventaris
            const { data: license, error: licenseError } = await supabase
                .from('licenses')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (licenseError || !license || !license.is_active || new Date(license.expiry_date) < new Date()) {
                if (inventarisFormMessage) {
                    inventarisFormMessage.textContent = 'Anda tidak memiliki lisensi aktif untuk menambah item inventaris.';
                    inventarisFormMessage.className = 'message error';
                }
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
                if (inventarisFormMessage) {
                    inventarisFormMessage.textContent = 'Error: Gagal menyimpan item inventaris. ' + error.message;
                    inventarisFormMessage.className = 'message error';
                }
            } else {
                console.log("Inventory item saved successfully:", data);
                if (inventarisFormMessage) {
                    inventarisFormMessage.textContent = 'Item berhasil disimpan!';
                    inventarisFormMessage.className = 'message success';
                }
                if (itemNameInput) itemNameInput.value = '';
                if (itemQuantityInput) itemQuantityInput.value = '';
                if (itemUnitTypeInput) itemUnitTypeInput.value = 'pcs';
                if (itemCostPriceInput) itemCostPriceInput.value = '';
                if (itemSellingPriceInput) itemSellingPriceInput.value = '';

                addInventarisForm.style.display = 'none';
                addInventarisBtn.style.display = 'inline-block';

                await loadInventarisData(searchInput.value.trim(), unitTypeFilter.value); // Muat ulang data inventaris untuk menampilkan yang baru
            }
        });
    }

    // --- BARU: Event Listener untuk Pencarian dan Filter ---
    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            const searchTerm = searchInput.value.trim();
            const filterUnitType = unitTypeFilter ? unitTypeFilter.value : '';
            currentPage = 1; // Reset to first page on new search/filter
            loadInventarisData(searchTerm, filterUnitType);
        });
    } else {
        console.error('ERROR: Elemen searchInput tidak ditemukan! Pastikan ID HTML sudah benar (ID: searchItemInput).');
    }

    if (unitTypeFilter) {
        unitTypeFilter.addEventListener('change', () => {
            const searchTerm = searchInput ? searchInput.value.trim() : '';
            const filterUnitType = unitTypeFilter.value;
            currentPage = 1; // Reset to first page on new search/filter
            loadInventarisData(searchTerm, filterUnitType);
        });
    } else {
        console.error('ERROR: Elemen unitTypeFilter tidak ditemukan! Pastikan ID HTML sudah benar (ID: filterUnitType).');
    }

    console.log('--- DOMContentLoaded: Event listeners disiapkan ---');
});