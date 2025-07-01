// Konfigurasi Supabase
const SUPABASE_URL = 'https://sjxhosrvcmejqprooofk.supabase.co'; // Ganti dengan URL Supabase Anda
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqeGhvc3J2Y21lanFwcm9vb2ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyMzIxMzEsImV4cCI6MjA2NjgwODEzMX0.n3RmP7ouaZSPBuymRi6axXWZQc_DJKi2gX0VEeV3o4U'; // Ganti dengan Anon Key Supabase Anda

const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Dapatkan referensi elemen HTML
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const userEmailSpan = document.getElementById('userEmail');
const licenseStatusSpan = document.getElementById('license-status');
const mainLoginBtn = document.getElementById('mainLoginBtn');
const mainLogoutBtn = document.getElementById('mainLogoutBtn');

const signupEmailInput = document.getElementById('signupEmail');
const signupPasswordInput = document.getElementById('signupPassword');
const signupBtn = document.getElementById('signupBtn');
const signupMessage = document.getElementById('signupMessage');

const loginEmailInput = document.getElementById('loginEmail');
const loginPasswordInput = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginMessage = document.getElementById('loginMessage');

const addInventarisBtn = document.getElementById('addInventarisBtn');
const addInventarisForm = document.getElementById('add-inventaris-form');
const itemNameInput = document.getElementById('itemName');
const itemQuantityInput = document.getElementById('itemQuantity');
const itemUnitTypeSelect = document.getElementById('itemUnitType');
const itemCostPriceInput = document.getElementById('itemCostPrice');
const itemSellingPriceInput = document.getElementById('itemSellingPrice');
const saveInventarisBtn = document.getElementById('saveInventarisBtn');
const cancelAddInventarisBtn = document.getElementById('cancelAddInventarisBtn');
const inventarisFormMessage = document.getElementById('inventaris-form-message');

const inventarisTableBody = document.getElementById('inventarisTableBody');
const logoutBtn = document.getElementById('logoutBtn'); // Ini mungkin tidak lagi dipakai karena ada mainLogoutBtn

const editItemModal = document.getElementById('editItemModal');
const closeButton = document.querySelector('.close-button');
const editItemForm = document.getElementById('editItemForm');
const editItemIdInput = document.getElementById('editItemId');
const editItemCodeInput = document.getElementById('editItemCode');
const editItemNameInput = document.getElementById('editItemName');
const editQuantityInput = document.getElementById('editQuantity');
const editUnitTypeSelect = document.getElementById('editUnitType');
const editCostPriceInput = document.getElementById('editCostPrice');
const editSellingPriceInput = document.getElementById('editSellingPrice');
const saveEditBtn = document.getElementById('saveEditBtn');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// Admin Elements
const adminLoginSection = document.getElementById('admin-login-section');
const adminEmailInput = document.getElementById('adminEmail');
const adminPasswordInput = document.getElementById('adminPassword');
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLoginMessage = document.getElementById('adminLoginMessage');
const adminPanelSection = document.getElementById('admin-panel-section');
const refreshLicensesBtn = document.getElementById('refreshLicensesBtn');
const licensesTableBody = document.getElementById('licenses-table-body');
const adminLogoutBtn = document.getElementById('adminLogoutBtn');


// --- BARU: Elemen untuk Pencarian, Filter, dan Paginasi ---
const searchItemInput = document.getElementById('searchItemInput');
const filterUnitTypeSelect = document.getElementById('filterUnitType');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const pageNumbersDiv = document.getElementById('pageNumbers');
const loadingMessage = document.getElementById('loading-message'); // Menggunakan P element yang sudah ada

let currentPage = 1;
const itemsPerPage = 10; // Jumlah item per halaman
let totalItems = 0; // Total item (untuk paginasi)

// --- Fungsi Autentikasi ---
async function handleAuthChange(event) {
    const user = event.data.session?.user;
    if (user) {
        authSection.style.display = 'none';
        adminLoginSection.style.display = 'none';
        appSection.style.display = 'block';
        userEmailSpan.textContent = user.email;
        mainLoginBtn.style.display = 'none';
        mainLogoutBtn.style.display = 'inline-block';
        checkLicenseStatus(user.id);
        fetchInventaris(); // Panggil dengan parameter default saat login
    } else {
        authSection.style.display = 'block';
        adminLoginSection.style.display = 'block'; // Tampilkan lagi admin login
        appSection.style.display = 'none';
        adminPanelSection.style.display = 'none'; // Sembunyikan admin panel jika logout
        userEmailSpan.textContent = '';
        mainLoginBtn.style.display = 'inline-block';
        mainLogoutBtn.style.display = 'none';
    }
}

supabase.auth.onAuthStateChange(handleAuthChange);

async function signUp() {
    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        signupMessage.textContent = `Error: ${error.message}`;
        signupMessage.className = 'message error';
    } else {
        signupMessage.textContent = 'Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.';
        signupMessage.className = 'message success';
        signupEmailInput.value = '';
        signupPasswordInput.value = '';
    }
}

async function login() {
    const email = loginEmailInput.value;
    const password = loginPasswordInput.value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        loginMessage.textContent = `Error: ${error.message}`;
        loginMessage.className = 'message error';
    } else {
        loginMessage.textContent = 'Login berhasil!';
        loginMessage.className = 'message success';
        // handleAuthChange akan dipicu oleh onAuthStateChange
    }
}

async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error.message);
    } else {
        // handleAuthChange akan dipicu
        loginMessage.textContent = 'Anda telah logout.';
        loginMessage.className = 'message success';
        inventarisTableBody.innerHTML = ''; // Kosongkan tabel inventaris
    }
}

// --- Fungsi Lisensi (tidak berubah) ---
async function checkLicenseStatus(userId) {
    const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching license:', error.message);
        licenseStatusSpan.textContent = 'Gagal memuat status lisensi.';
        licenseStatusSpan.className = 'message error';
        return;
    }

    if (data) {
        const expirationDate = new Date(data.expires_at);
        const now = new Date();
        if (expirationDate > now) {
            licenseStatusSpan.textContent = `Lisensi aktif hingga ${expirationDate.toLocaleDateString()}.`;
            licenseStatusSpan.className = 'message success status-active';
        } else {
            licenseStatusSpan.textContent = `Lisensi Anda telah kadaluarsa pada ${expirationDate.toLocaleDateString()}.`;
            licenseStatusSpan.className = 'message error status-expired';
        }
    } else {
        licenseStatusSpan.textContent = 'Tidak ada lisensi aktif ditemukan. Hubungi admin.';
        licenseStatusSpan.className = 'message error status-expired';
    }
}

// --- Fungsi Admin (tidak berubah banyak, hanya bagian logout admin) ---
async function adminLogin() {
    const email = adminEmailInput.value;
    const password = adminPasswordInput.value;
    // Menggunakan fungsi signInWithPassword karena email dan password tetap dari auth.users
    const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        adminLoginMessage.textContent = `Error: ${error.message}`;
        adminLoginMessage.className = 'message error';
        return;
    }

    // Periksa apakah pengguna adalah admin (misal, berdasarkan email tertentu atau role di database)
    // Di sini kita asumsikan admin memiliki email tertentu
    if (user && user.email === 'admin@example.com') { // GANTI DENGAN EMAIL ADMIN ANDA YANG SEBENARNYA
        adminLoginMessage.textContent = 'Login Admin berhasil!';
        adminLoginMessage.className = 'message success';
        adminLoginSection.style.display = 'none';
        authSection.style.display = 'none'; // Sembunyikan juga auth utama
        appSection.style.display = 'none'; // Sembunyikan dashboard user
        adminPanelSection.style.display = 'block';
        fetchLicenses();
    } else {
        adminLoginMessage.textContent = 'Akses ditolak: Bukan admin atau email tidak terdaftar.';
        adminLoginMessage.className = 'message error';
        await supabase.auth.signOut(); // Pastikan logout jika bukan admin
    }
}

async function adminLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error admin logging out:', error.message);
    } else {
        adminPanelSection.style.display = 'none';
        adminLoginSection.style.display = 'block'; // Kembali ke admin login
        authSection.style.display = 'block'; // Tampilkan lagi auth utama
    }
}

async function fetchLicenses() {
    const { data: licenses, error } = await supabase
        .from('licenses')
        .select('*');

    if (error) {
        console.error('Error fetching licenses:', error.message);
        licensesTableBody.innerHTML = '<tr><td colspan="5" class="message error">Gagal memuat lisensi.</td></tr>';
        return;
    }

    licensesTableBody.innerHTML = ''; // Bersihkan tabel
    if (licenses.length === 0) {
        licensesTableBody.innerHTML = '<tr><td colspan="5">Tidak ada lisensi ditemukan.</td></tr>';
        return;
    }

    licenses.forEach(license => {
        const row = document.createElement('tr');
        const expirationDate = new Date(license.expires_at);
        const now = new Date();
        const statusClass = expirationDate > now ? 'status-active' : 'status-expired';
        const statusText = expirationDate > now ? 'Aktif' : 'Kadaluarsa';

        row.innerHTML = `
            <td data-label="Email Pengguna">${license.user_email || 'N/A'}</td>
            <td data-label="ID Lisensi">${license.id}</td>
            <td data-label="Status" class="${statusClass}">${statusText}</td>
            <td data-label="Kadaluarsa">${expirationDate.toLocaleDateString()}</td>
            <td data-label="Aksi">
                <button class="extend-license-btn" data-id="${license.id}" data-user-id="${license.user_id}">Perpanjang 30 Hari</button>
            </td>
        `;
        licensesTableBody.appendChild(row);
    });

    document.querySelectorAll('.extend-license-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            const licenseId = event.target.dataset.id;
            const userId = event.target.dataset.userId;
            const confirmExtend = confirm('Apakah Anda yakin ingin memperpanjang lisensi ini 30 hari?');
            if (confirmExtend) {
                const { data, error } = await supabase.rpc('extend_license', { license_id_param: licenseId });
                if (error) {
                    alert(`Gagal memperpanjang lisensi: ${error.message}`);
                } else {
                    alert('Lisensi berhasil diperpanjang!');
                    fetchLicenses(); // Refresh the list
                    // Trigger license status update for the user if they are logged in
                    const currentUser = await supabase.auth.getUser();
                    if (currentUser.data.user && currentUser.data.user.id === userId) {
                        checkLicenseStatus(userId);
                    }
                }
            }
        });
    });
}

// --- Fungsi Inventaris ---

// MODIFIKASI: fetchInventaris sekarang menerima parameter pencarian, filter, dan paginasi
async function fetchInventaris(searchTerm = '', unitFilter = '', page = 1) {
    loadingMessage.textContent = 'Memuat data inventaris...';
    loadingMessage.style.display = 'block'; // Tampilkan pesan loading
    inventarisTableBody.innerHTML = ''; // Bersihkan tabel saat memuat

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
        loadingMessage.textContent = 'Anda belum login.';
        loadingMessage.className = 'message error';
        return;
    }

    let query = supabase.from('inventaris').select('*', { count: 'exact' });

    // Terapkan filter berdasarkan user_id
    query = query.eq('user_id', user.id);

    // Terapkan pencarian (jika searchTerm ada)
    if (searchTerm) {
        // Menggunakan OR untuk mencari di kode_item ATAU nama_item
        query = query.or(`kode_item.ilike.%${searchTerm}%,nama_item.ilike.%${searchTerm}%`);
    }

    // Terapkan filter satuan (jika unitFilter ada)
    if (unitFilter) {
        query = query.eq('satuan', unitFilter);
    }

    // Hitung offset untuk paginasi
    const offset = (page - 1) * itemsPerPage;
    const limit = offset + itemsPerPage - 1; // Batas akhir range Supabase inklusif

    query = query.order('created_at', { ascending: false }).range(offset, limit);

    const { data: inventarisItems, count, error } = await query;

    if (error) {
        console.error('Error fetching inventaris:', error.message);
        loadingMessage.textContent = `Gagal memuat inventaris: ${error.message}`;
        loadingMessage.className = 'message error';
        return;
    }

    totalItems = count; // Simpan total item untuk paginasi
    loadingMessage.style.display = 'none'; // Sembunyikan pesan loading setelah data diambil
    displayInventaris(inventarisItems);
    setupPagination(totalItems, currentPage);
}

function displayInventaris(items) {
    inventarisTableBody.innerHTML = ''; // Kosongkan tabel sebelum mengisi

    if (items.length === 0) {
        inventarisTableBody.innerHTML = '<tr><td colspan="8">Tidak ada item inventaris ditemukan.</td></tr>';
        return;
    }

    items.forEach(item => {
        const profitPerItem = item.harga_jual - item.harga_modal;
        const profitClass = profitPerItem >= 0 ? 'text-green' : 'text-red';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Kode Item">${item.kode_item}</td>
            <td data-label="Nama Item">${item.nama_item}</td>
            <td data-label="Jumlah">${item.jumlah}</td>
            <td data-label="Satuan">${item.satuan}</td>
            <td data-label="Harga Modal">Rp ${item.harga_modal.toLocaleString('id-ID')}</td>
            <td data-label="Harga Jual">Rp ${item.harga_jual.toLocaleString('id-ID')}</td>
            <td data-label="Keuntungan/Item" class="${profitClass}">Rp ${profitPerItem.toLocaleString('id-ID')}</td>
            <td data-label="Aksi">
                <button class="edit-item-btn" data-id="${item.id}">Edit</button>
                <button class="delete-item-btn" data-id="${item.id}">Hapus</button>
            </td>
        `;
        inventarisTableBody.appendChild(row);
    });

    // Tambahkan event listener untuk tombol Edit dan Hapus setelah tabel di-render
    document.querySelectorAll('.edit-item-btn').forEach(button => {
        button.addEventListener('click', (event) => openEditModal(event.target.dataset.id));
    });

    document.querySelectorAll('.delete-item-btn').forEach(button => {
        button.addEventListener('click', (event) => deleteInventaris(event.target.dataset.id));
    });
}

async function addInventaris() {
    inventarisFormMessage.textContent = ''; // Bersihkan pesan

    const itemName = itemNameInput.value.trim();
    const itemQuantity = parseInt(itemQuantityInput.value);
    const itemUnitType = itemUnitTypeSelect.value;
    const itemCostPrice = parseFloat(itemCostPriceInput.value);
    const itemSellingPrice = parseFloat(itemSellingPriceInput.value);

    // Validasi input
    if (!itemName || isNaN(itemQuantity) || itemQuantity < 0 || isNaN(itemCostPrice) || itemCostPrice < 0 || isNaN(itemSellingPrice) || itemSellingPrice < 0) {
        inventarisFormMessage.textContent = 'Mohon lengkapi semua field dengan nilai yang valid (jumlah/harga tidak boleh negatif).';
        inventarisFormMessage.className = 'message error';
        return;
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
        inventarisFormMessage.textContent = 'Anda harus login untuk menambahkan item.';
        inventarisFormMessage.className = 'message error';
        return;
    }

    const kodeItem = 'INV-' + Date.now(); // Generate kode item unik

    const { error } = await supabase
        .from('inventaris')
        .insert({
            user_id: user.id,
            kode_item: kodeItem,
            nama_item: itemName,
            jumlah: itemQuantity,
            satuan: itemUnitType,
            harga_modal: itemCostPrice,
            harga_jual: itemSellingPrice
        });

    if (error) {
        inventarisFormMessage.textContent = `Error: ${error.message}`;
        inventarisFormMessage.className = 'message error';
    } else {
        inventarisFormMessage.textContent = 'Item berhasil ditambahkan!';
        inventarisFormMessage.className = 'message success';
        itemNameInput.value = '';
        itemQuantityInput.value = '';
        itemUnitTypeSelect.value = 'pcs';
        itemCostPriceInput.value = '';
        itemSellingPriceInput.value = '';
        fetchInventaris(); // Refresh tabel setelah menambahkan item
        hideAddInventarisForm(); // Sembunyikan form setelah sukses
    }
}

async function openEditModal(itemId) {
    const { data: item, error } = await supabase
        .from('inventaris')
        .select('*')
        .eq('id', itemId)
        .single();

    if (error) {
        console.error('Error fetching item for edit:', error.message);
        alert('Gagal memuat data item untuk diedit.');
        return;
    }

    editItemIdInput.value = item.id;
    editItemCodeInput.value = item.kode_item;
    editItemNameInput.value = item.nama_item;
    editQuantityInput.value = item.jumlah;
    editUnitTypeSelect.value = item.satuan;
    editCostPriceInput.value = item.harga_modal;
    editSellingPriceInput.value = item.harga_jual;

    editItemModal.style.display = 'flex'; // Gunakan flex untuk centering
}

async function saveEditInventaris() {
    const itemId = editItemIdInput.value;
    const itemName = editItemNameInput.value.trim();
    const itemQuantity = parseInt(editQuantityInput.value);
    const itemUnitType = editUnitTypeSelect.value;
    const itemCostPrice = parseFloat(editCostPriceInput.value);
    const itemSellingPrice = parseFloat(editSellingPriceInput.value);

    // Validasi input
    if (!itemName || isNaN(itemQuantity) || itemQuantity < 0 || isNaN(itemCostPrice) || itemCostPrice < 0 || isNaN(itemSellingPrice) || itemSellingPrice < 0) {
        alert('Mohon lengkapi semua field dengan nilai yang valid (jumlah/harga tidak boleh negatif).');
        return;
    }

    const { error } = await supabase
        .from('inventaris')
        .update({
            nama_item: itemName,
            jumlah: itemQuantity,
            satuan: itemUnitType,
            harga_modal: itemCostPrice,
            harga_jual: itemSellingPrice
        })
        .eq('id', itemId);

    if (error) {
        console.error('Error saving item:', error.message);
        alert('Gagal menyimpan perubahan item: ' + error.message);
    } else {
        alert('Perubahan item berhasil disimpan!');
        editItemModal.style.display = 'none';
        fetchInventaris(); // Refresh tabel setelah mengedit item
    }
}

async function deleteInventaris(itemId) {
    if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
        const { error } = await supabase
            .from('inventaris')
            .delete()
            .eq('id', itemId);

        if (error) {
            console.error('Error deleting item:', error.message);
            alert('Gagal menghapus item: ' + error.message);
        } else {
            alert('Item berhasil dihapus!');
            fetchInventaris(); // Refresh tabel setelah menghapus item
        }
    }
}

function showAddInventarisForm() {
    addInventarisForm.style.display = 'block';
    inventarisFormMessage.textContent = '';
}

function hideAddInventarisForm() {
    addInventarisForm.style.display = 'none';
    inventarisFormMessage.textContent = '';
    // Reset form fields
    itemNameInput.value = '';
    itemQuantityInput.value = '';
    itemUnitTypeSelect.value = 'pcs';
    itemCostPriceInput.value = '';
    itemSellingPriceInput.value = '';
}

// --- BARU: Fungsi untuk Paginasi ---
function setupPagination(totalItemsCount, currentPageNum) {
    const totalPages = Math.ceil(totalItemsCount / itemsPerPage);
    pageNumbersDiv.innerHTML = ''; // Bersihkan nomor halaman yang ada

    // Nonaktifkan/Aktifkan tombol 'Sebelumnya'
    prevPageBtn.disabled = currentPageNum === 1;
    // Nonaktifkan/Aktifkan tombol 'Berikutnya'
    nextPageBtn.disabled = currentPageNum === totalPages || totalPages === 0;

    // Tampilkan nomor halaman
    for (let i = 1; i <= totalPages; i++) {
        const pageSpan = document.createElement('span');
        pageSpan.textContent = i;
        pageSpan.classList.add('page-number');
        if (i === currentPageNum) {
            pageSpan.classList.add('active');
        }
        pageSpan.addEventListener('click', () => {
            currentPage = i;
            // Panggil fetchInventaris dengan kondisi pencarian/filter saat ini
            fetchInventaris(searchItemInput.value.trim(), filterUnitTypeSelect.value, currentPage);
        });
        pageNumbersDiv.appendChild(pageSpan);
    }

    // Jika tidak ada item sama sekali, sembunyikan kontrol paginasi
    if (totalPages === 0 || totalPages === 1) {
        document.querySelector('.pagination-controls').style.display = 'none';
    } else {
        document.querySelector('.pagination-controls').style.display = 'flex';
    }
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', async () => {
    // Dapatkan sesi saat ini saat DOMContentLoaded
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        handleAuthChange({ data: { session } });
    } else {
        // Tampilkan Auth/Admin Login jika tidak ada sesi
        authSection.style.display = 'block';
        adminLoginSection.style.display = 'block';
        appSection.style.display = 'none';
        adminPanelSection.style.display = 'none';
    }
});

signupBtn.addEventListener('click', signUp);
loginBtn.addEventListener('click', login);
mainLogoutBtn.addEventListener('click', logout);
addInventarisBtn.addEventListener('click', showAddInventarisForm);
saveInventarisBtn.addEventListener('click', addInventaris);
cancelAddInventarisBtn.addEventListener('click', hideAddInventarisForm);

closeButton.addEventListener('click', () => {
    editItemModal.style.display = 'none';
});
cancelEditBtn.addEventListener('click', () => {
    editItemModal.style.display = 'none';
});
editItemForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Mencegah refresh halaman
    await saveEditInventaris();
});

// Admin Event Listeners
adminLoginBtn.addEventListener('click', adminLogin);
adminLogoutBtn.addEventListener('click', adminLogout);
refreshLicensesBtn.addEventListener('click', fetchLicenses);

// --- BARU: Event Listeners untuk Pencarian, Filter, dan Paginasi ---
// Event listener untuk input pencarian
searchItemInput.addEventListener('input', () => {
    currentPage = 1; // Reset ke halaman 1 setiap kali pencarian baru
    fetchInventaris(searchItemInput.value.trim(), filterUnitTypeSelect.value, currentPage);
});

// Event listener untuk dropdown filter satuan
filterUnitTypeSelect.addEventListener('change', () => {
    currentPage = 1; // Reset ke halaman 1 setiap kali filter berubah
    fetchInventaris(searchItemInput.value.trim(), filterUnitTypeSelect.value, currentPage);
});

// Event listener untuk tombol 'Sebelumnya'
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        fetchInventaris(searchItemInput.value.trim(), filterUnitTypeSelect.value, currentPage);
    }
});

// Event listener untuk tombol 'Berikutnya'
nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        fetchInventaris(searchItemInput.value.trim(), filterUnitTypeSelect.value, currentPage);
    }
});

// Pastikan kode_item unik, jika Anda membuat field unik di Supabase.
// Fungsi generate kode item sudah ada di `addInventaris`