// js/ui.js

// Referensi Elemen HTML (yang paling sering berinteraksi dengan UI)
export const authSection = document.getElementById('auth-section');
export const appSection = document.getElementById('app-section');
export const adminLoginSection = document.getElementById('admin-login-section');
export const adminPanelSection = document.getElementById('admin-panel-section');

export const mainLoginBtn = document.getElementById('mainLoginBtn');
export const mainLogoutBtn = document.getElementById('mainLogoutBtn');

export const userEmailSpan = document.getElementById('userEmail');
export const licenseStatusP = document.getElementById('license-status');

// --- REFERENSI AUTENTIKASI (LOGIN/SIGNUP) ---
// Ini adalah elemen-elemen yang memicu error "does not provide an export named 'loginBtn'" dll.
export const signupEmailInput = document.getElementById('signupEmail');
export const signupPasswordInput = document.getElementById('signupPassword');
export const signupBtn = document.getElementById('signupBtn');
export const signupMessage = document.getElementById('signupMessage');

export const loginEmailInput = document.getElementById('loginEmail');
export const loginPasswordInput = document.getElementById('loginPassword');
export const loginBtn = document.getElementById('loginBtn'); // Untuk tombol login di form
export const loginMessage = document.getElementById('loginMessage');

export const logoutBtn = document.getElementById('logoutBtn'); // Tombol Logout di app-section

// --- REFERENSI ADMIN ---
export const adminEmailInput = document.getElementById('adminEmail');
export const adminPasswordInput = document.getElementById('adminPassword');
export const adminLoginBtn = document.getElementById('adminLoginBtn');
export const adminLoginMessage = document.getElementById('adminLoginMessage');
export const licensesTableBody = document.getElementById('licenses-table-body'); // Pastikan ID ini benar di HTML
export const adminLogoutBtn = document.getElementById('adminLogoutBtn');
export const refreshLicensesBtn = document.getElementById('refreshLicensesBtn');


// Referensi Modal Edit
export const editItemModal = document.getElementById('editItemModal');
export const closeEditModalBtn = document.querySelector('#editItemModal .close-button');
export const cancelEditBtn = document.getElementById('cancelEditBtn');
export const editItemForm = document.getElementById('editItemForm');
export const editItemId = document.getElementById('editItemId');
export const editItemCode = document.getElementById('editItemCode');
export const editItemName = document.getElementById('editItemName');
export const editQuantity = document.getElementById('editQuantity');
export const editUnitType = document.getElementById('editUnitType');
export const editCostPrice = document.getElementById('editCostPrice');
export const editSellingPrice = document.getElementById('editSellingPrice');

// Referensi untuk Inventaris User UI
export const inventarisDataDiv = document.getElementById('inventaris-data');
export const addInventarisBtn = document.getElementById('addInventarisBtn');
export const addInventarisForm = document.getElementById('add-inventaris-form');
export const itemNameInput = document.getElementById('itemName');
export const itemQuantityInput = document.getElementById('itemQuantity');
export const itemUnitTypeInput = document.getElementById('itemUnitType');
export const itemCostPriceInput = document.getElementById('itemCostPrice');
export const itemSellingPriceInput = document.getElementById('itemSellingPrice');
export const saveInventarisBtn = document.getElementById('saveInventarisBtn');
export const cancelAddInventarisBtn = document.getElementById('cancelAddInventarisBtn');
export const inventarisFormMessage = document.getElementById('inventaris-form-message');

// Referensi untuk Pencarian dan Paginasi
export const searchInput = document.getElementById('searchItemInput');
export const unitTypeFilter = document.getElementById('filterUnitType');
export const prevPageBtn = document.getElementById('prevPageBtn');
export const nextPageBtn = document.getElementById('nextPageBtn');
export const pageNumbersDiv = document.getElementById('pageNumbers');

// Fungsi untuk menampilkan/menyembunyikan bagian UI
export function showAuthSection() {
    authSection.style.display = 'block';
    appSection.style.display = 'none';
    adminPanelSection.style.display = 'none';
    adminLoginSection.style.display = 'block';
    mainLoginBtn.style.display = 'inline-block';
    mainLogoutBtn.style.display = 'none';
}

export async function showUserApp(userEmail) {
    authSection.style.display = 'none';
    adminLoginSection.style.display = 'none';
    adminPanelSection.style.display = 'none';
    appSection.style.display = 'block';
    addInventarisForm.style.display = 'none';
    mainLoginBtn.style.display = 'none';
    mainLogoutBtn.style.display = 'inline-block';
    if (userEmailSpan) userEmailSpan.textContent = userEmail;
    // loadInventarisData akan dipanggil di main.js atau inventory.js
}

export function showAdminPanel() {
    authSection.style.display = 'none';
    adminLoginSection.style.display = 'none';
    appSection.style.display = 'none';
    adminPanelSection.style.display = 'block';
    mainLoginBtn.style.display = 'none';
    mainLogoutBtn.style.display = 'inline-block';
    // loadLicensesData akan dipanggil di main.js atau admin.js
}

export function updateLicenseStatus(message, type, showAddButton = false) {
    if (licenseStatusP) {
        licenseStatusP.textContent = message;
        licenseStatusP.className = `message ${type}`;
    }
    if (addInventarisBtn) {
        addInventarisBtn.style.display = showAddButton ? 'inline-block' : 'none';
    }
}

// Fungsi untuk menampilkan pesan form
export function displayFormMessage(element, message, type) {
    if (element) {
        element.textContent = message;
        element.className = `message ${type}`;
    }
}

// Fungsi untuk memperbarui kontrol paginasi
export function updatePaginationControls(currentPage, totalPages) {
    if (!pageNumbersDiv || !prevPageBtn || !nextPageBtn) {
        console.error('Pagination elements not found!');
        return;
    }
    pageNumbersDiv.innerHTML = `Halaman ${currentPage} dari ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
}

// Fungsi untuk mengisi dan menampilkan modal edit
export function openEditItemModal(item) {
    if (!item || !editItemModal) {
        console.error('Item or editItemModal not found for openEditItemModal');
        return;
    }

    // Mengisi nilai input
    if (editItemId) editItemId.value = item.id || '';
    if (editItemCode) editItemCode.value = item.item_code || '';
    if (editItemName) editItemName.value = item.item_name || '';
    if (editQuantity) editQuantity.value = item.quantity || 0;
    if (editUnitType) editUnitType.value = item.unit_type || 'pcs';
    if (editCostPrice) editCostPrice.value = item.cost_price || 0;
    if (editSellingPrice) editSellingPrice.value = item.selling_price || 0;

    editItemModal.style.display = 'flex';
}

export function closeEditItemModal() {
    if (editItemModal) editItemModal.style.display = 'none';
}