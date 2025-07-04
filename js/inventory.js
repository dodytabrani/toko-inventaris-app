// js/inventory.js

import { supabase } from './supabaseClient.js';
import { generateUniqueItemCode } from './utils.js';
import {
    inventarisDataDiv, addInventarisBtn, addInventarisForm,
    itemNameInput, itemQuantityInput, itemUnitTypeInput,
    itemCostPriceInput, itemSellingPriceInput, saveInventarisBtn,
    cancelAddInventarisBtn, inventarisFormMessage,
    licenseStatusP, searchInput, unitTypeFilter,
    prevPageBtn, nextPageBtn,
    updatePaginationControls, displayFormMessage,
    openEditItemModal, closeEditItemModal,
    closeEditModalBtn, cancelEditBtn,
    editItemForm, editItemId, editItemCode, editItemName, editQuantity, // Tambahkan editItemCode
    editUnitType, editCostPrice, editSellingPrice,
    // IMPOR ELEMEN UI BARU UNTUK HISTORI MODAL
    historyModal, closeHistoryModalBtn, cancelHistoryBtn,
    historyItemName, historyTableBody, inventarisTableBody // Penting untuk me-render tabel inventaris
} from './ui.js';

let currentPage = 1;
const ITEMS_PER_PAGE = 5;
let totalPages = 1;

export async function checkLicenseStatusAndToggleAddButton() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        if (licenseStatusP) licenseStatusP.textContent = 'Tidak ada user login.';
        if (licenseStatusP) licenseStatusP.className = 'message error';
        if (addInventarisBtn) addInventarisBtn.style.display = 'none';
        return false;
    }

    const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 adalah kode untuk "Row not found"
        console.error("Error checking license:", error.message);
        if (licenseStatusP) licenseStatusP.textContent = 'Gagal memeriksa lisensi. Harap coba lagi.';
        if (licenseStatusP) licenseStatusP.className = 'message error';
        if (addInventarisBtn) addInventarisBtn.style.display = 'none';
        return false;
    } else if (!data) { // Jika tidak ada data lisensi ditemukan untuk user ini
        if (licenseStatusP) licenseStatusP.textContent = 'Lisensi Anda belum aktif. Hubungi admin untuk aktivasi.';
        if (licenseStatusP) licenseStatusP.className = 'message error';
        if (addInventarisBtn) addInventarisBtn.style.display = 'none';
        return false;
    } else if (!data.is_active || new Date(data.expiry_date) < new Date()) { // Jika lisensi tidak aktif atau sudah kadaluarsa
        if (licenseStatusP) licenseStatusP.textContent = `Lisensi Anda tidak aktif atau sudah kadaluarsa pada ${new Date(data.expiry_date).toLocaleDateString()}.`;
        if (licenseStatusP) licenseStatusP.className = 'message error';
        if (addInventarisBtn) addInventarisBtn.style.display = 'none';
        return false;
    } else { // Jika lisensi aktif dan belum kadaluarsa
        if (licenseStatusP) licenseStatusP.textContent = `Lisensi Anda aktif hingga ${new Date(data.expiry_date).toLocaleDateString()}.`;
        if (licenseStatusP) licenseStatusP.className = 'message success';
        if (addInventarisBtn) addInventarisBtn.style.display = 'inline-block';
        return true;
    }
}

export async function loadInventarisData(searchTerm = '', filterUnitType = '') {
    if (!inventarisDataDiv) {
        console.error('inventarisDataDiv element not found!');
        return;
    }

    inventarisDataDiv.innerHTML = '<p>Memuat data inventaris...</p>';

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        inventarisDataDiv.innerHTML = '<p>Anda harus login untuk melihat inventaris.</p>';
        return;
    }

    const hasActiveLicense = await checkLicenseStatusAndToggleAddButton();
    if (!hasActiveLicense) {
        inventarisDataDiv.innerHTML = '<p>Akses inventaris ditolak: Lisensi tidak aktif atau sudah kadaluarsa.</p>';
        return;
    }

    let query = supabase.from('inventories').select('*', { count: 'exact' });
    query = query.eq('user_id', user.id);

    if (searchTerm) {
        query = query.or(`item_name.ilike.%${searchTerm}%,item_code.ilike.%${searchTerm}%`);
    }

    if (filterUnitType) {
        query = query.eq('unit_type', filterUnitType);
    }

    const { count, error: countError } = await query.range(0, 0); // Perform count without fetching data
    if (countError) {
        console.error("Error fetching inventory count:", countError.message);
        inventarisDataDiv.innerHTML = `<p class="message error">Error memuat jumlah item: ${countError.message}</p>`;
        return;
    }
    totalPages = Math.ceil(count / ITEMS_PER_PAGE);

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    // Default sorting (misalnya by created_at)
    query = supabase.from('inventories').select('*').eq('user_id', user.id); // Re-initialize query for actual data fetch
    if (searchTerm) {
        query = query.or(`item_name.ilike.%${searchTerm}%,item_code.ilike.%${searchTerm}%`);
    }
    if (filterUnitType) {
        query = query.eq('unit_type', filterUnitType);
    }
    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data: inventories, error } = await query;

    if (error) {
        console.error("Error loading inventaris:", error.message);
        inventarisDataDiv.innerHTML = '<p class="message error">Gagal memuat data inventaris. Pastikan RLS diatur dengan benar.</p>';
    } else {
        if (inventories.length === 0) {
            inventarisDataDiv.innerHTML = '<p>Tidak ada item inventaris yang ditemukan. Klik "Tambah Item" untuk memulai.</p>';
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
                    <tbody id="inventarisTableBody">
            `;

            inventories.forEach(item => {
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
                            <button class="history-item-btn" data-id="${item.id}" data-name="${item.item_name}">Histori</button>
                        </td>
                    </tr>
                `;
            });
            html += `
                    </tbody>
                </table>
                <div class="pagination-controls">
                    <button id="prevPageBtn">Sebelumnya</button>
                    <span id="pageNumbers"></span>
                    <button id="nextPageBtn">Selanjutnya</button>
                </div>
            `;
            inventarisDataDiv.innerHTML = html;

            updatePaginationControls(currentPage, totalPages);
        }
    }
}

// Fungsi untuk menampilkan histori perubahan item
export async function showItemHistory(itemId, itemName) {
    if (!historyModal || !historyTableBody || !historyItemName) {
        console.error('History modal elements not found!');
        return;
    }

    historyItemName.textContent = `Histori Perubahan: ${itemName}`;
    historyTableBody.innerHTML = '<tr><td colspan="4">Memuat histori...</td></tr>';
    historyModal.style.display = 'flex'; // Tampilkan modal

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        historyTableBody.innerHTML = '<tr><td colspan="4" class="message error">Anda harus login untuk melihat histori.</td></tr>';
        return;
    }

    const { data: history, error } = await supabase
        .from('item_history')
        .select('*')
        .eq('item_id', itemId)
        .eq('user_id', user.id) // Penting: Filter berdasarkan user_id juga
        .order('changed_at', { ascending: false });

    if (error) {
        console.error("Error loading item history:", error.message);
        historyTableBody.innerHTML = `<tr><td colspan="4" class="message error">Gagal memuat histori: ${error.message}</td></tr>`;
    } else {
        if (history.length === 0) {
            historyTableBody.innerHTML = '<tr><td colspan="4">Tidak ada histori perubahan untuk item ini.</td></tr>';
        } else {
            let historyHtml = '';
            history.forEach(record => {
                const changedAt = new Date(record.changed_at).toLocaleString();
                // Mengubah objek old_data dan new_data menjadi string yang lebih mudah dibaca
                const oldData = JSON.stringify(record.old_data, null, 2);
                const newData = JSON.stringify(record.new_data, null, 2);

                historyHtml += `
                    <tr>
                        <td>${changedAt}</td>
                        <td>${record.action}</td>
                        <td><pre>${oldData}</pre></td>
                        <td><pre>${newData}</pre></td>
                    </tr>
                `;
            });
            historyTableBody.innerHTML = historyHtml;
        }
    }
}

// Fungsi untuk menutup modal histori
export function closeHistoryModal() {
    if (historyModal) {
        historyModal.style.display = 'none';
    }
}


export function setupInventoryListeners() {
    if (addInventarisBtn) {
        addInventarisBtn.addEventListener('click', () => {
            if (addInventarisForm) addInventarisForm.style.display = 'block';
            if (addInventarisBtn) addInventarisBtn.style.display = 'none';

            // Kosongkan dan reset semua input form tambah item
            if (itemNameInput) itemNameInput.value = '';
            if (itemQuantityInput) itemQuantityInput.value = '';
            if (itemUnitTypeInput) itemUnitTypeInput.value = 'pcs';
            if (itemCostPriceInput) itemCostPriceInput.value = '';
            if (itemSellingPriceInput) itemSellingPriceInput.value = '';

            displayFormMessage(inventarisFormMessage, '', '');
        });
    }

    if (cancelAddInventarisBtn) {
        cancelAddInventarisBtn.addEventListener('click', () => {
            if (addInventarisForm) addInventarisForm.style.display = 'none';
            if (addInventarisBtn) addInventarisBtn.style.display = 'inline-block';
        });
    }

    if (saveInventarisBtn) {
        saveInventarisBtn.addEventListener('click', async () => {
            const itemName = itemNameInput ? itemNameInput.value.trim() : '';
            const itemQuantity = itemQuantityInput ? parseInt(itemQuantityInput.value) : NaN;
            const itemUnitType = itemUnitTypeInput ? itemUnitTypeInput.value : '';
            const itemCostPrice = itemCostPriceInput ? parseFloat(itemCostPriceInput.value) : NaN;
            const itemSellingPrice = itemSellingPriceInput ? parseFloat(itemSellingPriceInput.value) : NaN;

            displayFormMessage(inventarisFormMessage, '', '');

            // Validasi Input
            if (!itemName || isNaN(itemQuantity) || isNaN(itemCostPrice) || isNaN(itemSellingPrice) || itemQuantity < 0 || itemCostPrice < 0 || itemSellingPrice < 0) {
                displayFormMessage(inventarisFormMessage, 'Semua bidang harus diisi dengan nilai yang valid (jumlah/harga tidak boleh negatif).', 'error');
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                displayFormMessage(inventarisFormMessage, 'Anda harus login untuk menambah item.', 'error');
                return;
            }

            const hasActiveLicense = await checkLicenseStatusAndToggleAddButton();
            if (!hasActiveLicense) {
                displayFormMessage(inventarisFormMessage, 'Anda tidak memiliki lisensi aktif untuk menambah item inventaris.', 'error');
                return;
            }

            const newItemCode = generateUniqueItemCode();

            const { data, error } = await supabase // Capture data to get the new item's ID
                .from('inventories')
                .insert([
                    {
                        item_name: itemName,
                        quantity: itemQuantity,
                        unit_type: itemUnitType,
                        cost_price: itemCostPrice,
                        selling_price: itemSellingPrice,
                        item_code: newItemCode,
                        user_id: user.id
                    }
                ]).select(); // Select the inserted data to get its ID

            if (error) {
                console.error("Error saving inventory item:", error.message);
                displayFormMessage(inventarisFormMessage, 'Error: Gagal menyimpan item inventaris. ' + error.message, 'error');
            } else {
                displayFormMessage(inventarisFormMessage, 'Item berhasil disimpan!', 'success');
                if (itemNameInput) itemNameInput.value = '';
                if (itemQuantityInput) itemQuantityInput.value = '';
                if (itemUnitTypeInput) itemUnitTypeInput.value = 'pcs';
                if (itemCostPriceInput) itemCostPriceInput.value = '';
                if (itemSellingPriceInput) itemSellingPriceInput.value = '';

                if (addInventarisForm) addInventarisForm.style.display = 'none';
                if (addInventarisBtn) addInventarisBtn.style.display = 'inline-block';

                // Rekam histori penambahan item baru
                if (data && data.length > 0) {
                    const newItem = data[0];
                    await supabase.from('item_history').insert([
                        {
                            item_id: newItem.id,
                            user_id: user.id,
                            action: 'Ditambah',
                            old_data: {}, // Data lama kosong untuk penambahan
                            new_data: {
                                item_name: newItem.item_name,
                                quantity: newItem.quantity,
                                unit_type: newItem.unit_type,
                                cost_price: newItem.cost_price,
                                selling_price: newItem.selling_price
                            }
                        }
                    ]);
                }
                await loadInventarisData(searchInput ? searchInput.value.trim() : '', unitTypeFilter ? unitTypeFilter.value : '');
            }
        });
    }

    if (inventarisDataDiv) {
        inventarisDataDiv.addEventListener('click', async (e) => {
            if (e.target.matches('.edit-item-btn')) {
                const itemId = e.target.dataset.id;
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
                if (itemToEdit) openEditItemModal(itemToEdit);
            }

            if (e.target.matches('.delete-item-btn')) {
                const itemId = e.target.dataset.id;
                const { data: itemToDelete, error: fetchError } = await supabase // Ambil data sebelum dihapus untuk histori
                    .from('inventories')
                    .select('*')
                    .eq('id', itemId)
                    .single();

                if (fetchError) {
                    console.error("Error fetching item for deletion history:", fetchError.message);
                    alert('Gagal mengambil detail item untuk dihapus. Coba lagi.');
                    return;
                }

                if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) {
                        alert('Anda harus login untuk menghapus item.');
                        return;
                    }

                    const { error: deleteError } = await supabase
                        .from('inventories')
                        .delete()
                        .eq('id', itemId)
                        .eq('user_id', user.id); // Pastikan user_id juga cocok

                    if (deleteError) {
                        console.error("Error deleting inventaris:", deleteError.message);
                        alert('Gagal menghapus item: ' + deleteError.message);
                    } else {
                        alert('Item berhasil dihapus!');
                        // Rekam histori penghapusan item
                        await supabase.from('item_history').insert([
                            {
                                item_id: itemId,
                                user_id: user.id,
                                action: 'Dihapus',
                                old_data: {
                                    item_name: itemToDelete.item_name,
                                    quantity: itemToDelete.quantity,
                                    unit_type: itemToDelete.unit_type,
                                    cost_price: itemToDelete.cost_price,
                                    selling_price: itemToDelete.selling_price
                                },
                                new_data: {} // Data baru kosong untuk penghapusan
                            }
                        ]);
                        await loadInventarisData(searchInput ? searchInput.value.trim() : '', unitTypeFilter ? unitTypeFilter.value : '');
                    }
                }
            }

            // Event listener untuk tombol Histori
            if (e.target.matches('.history-item-btn')) {
                const itemId = e.target.dataset.id;
                const itemName = e.target.dataset.name;
                showItemHistory(itemId, itemName);
            }
        });
        // Tambahkan event listener touchend juga jika diperlukan untuk mobile
        inventarisDataDiv.addEventListener('touchend', async (e) => {
            if (e.target.matches('.edit-item-btn')) {
                const itemId = e.target.dataset.id;
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
                if (itemToEdit) openEditItemModal(itemToEdit);
            }

            if (e.target.matches('.delete-item-btn')) {
                const itemId = e.target.dataset.id;
                const { data: itemToDelete, error: fetchError } = await supabase
                    .from('inventories')
                    .select('*')
                    .eq('id', itemId)
                    .single();

                if (fetchError) {
                    console.error("Error fetching item for deletion history:", fetchError.message);
                    alert('Gagal mengambil detail item untuk dihapus. Coba lagi.');
                    return;
                }

                if (confirm('Apakah Anda yakin ingin menghapus item ini?')) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) {
                        alert('Anda harus login untuk menghapus item.');
                        return;
                    }
                    const { error: deleteError } = await supabase
                        .from('inventories')
                        .delete()
                        .eq('id', itemId)
                        .eq('user_id', user.id);

                    if (deleteError) {
                        console.error("Error deleting inventaris:", deleteError.message);
                        alert('Gagal menghapus item: ' + deleteError.message);
                    } else {
                        alert('Item berhasil dihapus!');
                        await supabase.from('item_history').insert([
                            {
                                item_id: itemId,
                                user_id: user.id,
                                action: 'Dihapus',
                                old_data: {
                                    item_name: itemToDelete.item_name,
                                    quantity: itemToDelete.quantity,
                                    unit_type: itemToDelete.unit_type,
                                    cost_price: itemToDelete.cost_price,
                                    selling_price: itemToDelete.selling_price
                                },
                                new_data: {}
                            }
                        ]);
                        await loadInventarisData(searchInput ? searchInput.value.trim() : '', unitTypeFilter ? unitTypeFilter.value : '');
                    }
                }
            }

            // Event listener touchend untuk tombol Histori
            if (e.target.matches('.history-item-btn')) {
                const itemId = e.target.dataset.id;
                const itemName = e.target.dataset.name;
                showItemHistory(itemId, itemName);
            }
        });
    }

    // Modal Edit Item Listeners
    if (closeEditModalBtn) closeEditModalBtn.onclick = closeEditItemModal;
    if (cancelEditBtn) cancelEditBtn.onclick = closeEditItemModal;

    if (editItemForm) {
        editItemForm.onsubmit = async (e) => {
            e.preventDefault();
            const itemId = editItemId ? editItemId.value : null;
            // Ambil data item sebelum diedit untuk histori
            const { data: oldItemData, error: fetchOldDataError } = await supabase
                .from('inventories')
                .select('*')
                .eq('id', itemId)
                .single();

            if (fetchOldDataError) {
                console.error("Error fetching old item data for history:", fetchOldDataError.message);
                alert('Gagal mengambil data lama item. Pembaharuan dibatalkan.');
                return;
            }

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
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    alert('Anda harus login untuk memperbarui item.');
                    return;
                }

                const { data: updatedData, error } = await supabase // Capture updated data for history
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
                    .eq('user_id', user.id)
                    .select(); // Select the updated data

                if (error) throw error;

                alert('Item inventaris berhasil diperbarui!');
                closeEditItemModal();
                await loadInventarisData(searchInput ? searchInput.value.trim() : '', unitTypeFilter ? unitTypeFilter.value : '');

                // Rekam histori perubahan item
                if (updatedData && updatedData.length > 0) {
                    const newItemData = updatedData[0];
                    await supabase.from('item_history').insert([
                        {
                            item_id: itemId,
                            user_id: user.id,
                            action: 'Diperbarui',
                            old_data: {
                                item_name: oldItemData.item_name,
                                quantity: oldItemData.quantity,
                                unit_type: oldItemData.unit_type,
                                cost_price: oldItemData.cost_price,
                                selling_price: oldItemData.selling_price
                            },
                            new_data: {
                                item_name: newItemData.item_name,
                                quantity: newItemData.quantity,
                                unit_type: newItemData.unit_type,
                                cost_price: newItemData.cost_price,
                                selling_price: newItemData.selling_price
                            }
                        }
                    ]);
                }
            } catch (error) {
                console.error('Error updating inventory item:', error.message);
                alert('Gagal memperbarui item inventaris: ' + error.message);
            }
        };
    }

    // Modal History Item Listeners
    if (closeHistoryModalBtn) closeHistoryModalBtn.onclick = closeHistoryModal;
    if (cancelHistoryBtn) cancelHistoryBtn.onclick = closeHistoryModal;


    // Event listeners untuk Pencarian dan Paginasi
    if (searchInput) {
        searchInput.addEventListener('keyup', () => {
            const searchTerm = searchInput.value.trim();
            const filterUnitTypeVal = unitTypeFilter ? unitTypeFilter.value : '';
            currentPage = 1;
            loadInventarisData(searchTerm, filterUnitTypeVal);
        });
    }

    if (unitTypeFilter) {
        unitTypeFilter.addEventListener('change', () => {
            const searchTerm = searchInput ? searchInput.value.trim() : '';
            const filterUnitTypeVal = unitTypeFilter.value;
            currentPage = 1;
            loadInventarisData(searchTerm, filterUnitTypeVal);
        });
    }

    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadInventarisData(searchInput ? searchInput.value.trim() : '', unitTypeFilter ? unitTypeFilter.value : '');
            }
        });
    }

    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadInventarisData(searchInput ? searchInput.value.trim() : '', unitTypeFilter ? unitTypeFilter.value : '');
            }
        });
    }

    // Export Inventaris Button (Pastikan tombol ini ada di index.html dan diimpor di ui.js)
    if (exportInventarisBtn) {
        exportInventarisBtn.addEventListener('click', async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Anda harus login untuk mengekspor data.');
                return;
            }

            const hasActiveLicense = await checkLicenseStatusAndToggleAddButton();
            if (!hasActiveLicense) {
                alert('Anda tidak memiliki lisensi aktif untuk mengekspor data inventaris.');
                return;
            }

            const { data: inventories, error } = await supabase
                .from('inventories')
                .select('item_code, item_name, quantity, unit_type, cost_price, selling_price')
                .eq('user_id', user.id);

            if (error) {
                console.error("Error fetching data for export:", error.message);
                alert('Gagal mengekspor data: ' + error.message);
                return;
            }

            if (inventories.length === 0) {
                alert('Tidak ada data inventaris untuk diekspor.');
                return;
            }

            // Buat header CSV
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Kode Item,Nama Item,Jumlah,Satuan,Harga Modal,Harga Jual,Keuntungan Per Item\n";

            // Tambahkan data
            inventories.forEach(item => {
                const profitPerItem = (item.selling_price || 0) - (item.cost_price || 0);
                const row = [
                    `"${item.item_code || 'N/A'}"`, // Pastikan dikelilingi kutip untuk mencegah masalah koma
                    `"${item.item_name || ''}"`,
                    item.quantity || 0,
                    `"${item.unit_type || 'pcs'}"`,
                    item.cost_price || 0,
                    item.selling_price || 0,
                    profitPerItem
                ].join(',');
                csvContent += row + "\n";
            });

            // Buat link download
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "inventaris_data.csv");
            document.body.appendChild(link); // Diperlukan untuk Firefox
            link.click();
            document.body.removeChild(link); // Hapus setelah klik
            alert('Data inventaris berhasil diekspor ke inventaris_data.csv!');
        });
    }
}