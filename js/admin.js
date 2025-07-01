// js/admin.js
import { supabase } from './supabaseClient.js';
import {
    adminEmailInput, adminPasswordInput, adminLoginBtn, adminLoginMessage,
    licensesTableBody, adminLogoutBtn, refreshLicensesBtn,
    showAdminPanel, showAuthSection
} from './ui.js';
import { checkUserRoleAndRedirect } from './auth.js'; // Untuk redirect setelah admin logout

export async function loadLicensesData() {
    if (!licensesTableBody) {
        console.error('licensesTableBody not found!');
        return;
    }
    const { data, error } = await supabase
        .from('licenses')
        .select(`
            *,
            users ( email )
        `);

    if (error) {
        console.error("Error loading licenses:", error.message);
        licensesTableBody.innerHTML = '<tr><td colspan="5" class="message error">Gagal memuat data lisensi.</td></tr>';
    } else {
        licensesTableBody.innerHTML = '';
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
                            <button onclick="window.adminFunctions.toggleLicenseStatus('${license.id}', ${license.is_active})" class="toggle-btn">
                                ${license.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                            <button onclick="window.adminFunctions.extendLicense('${license.id}')" class="extend-btn">Perpanjang 1 Bulan</button>
                            <button onclick="window.adminFunctions.deleteLicense('${license.id}')" class="delete-btn">Hapus</button>
                        </td>
                    </tr>
                `;
                licensesTableBody.innerHTML += row;
            });
        }
    }
}

export async function toggleLicenseStatus(licenseId, currentStatus) {
    const { error } = await supabase
        .from('licenses')
        .update({ is_active: !currentStatus })
        .eq('id', licenseId);

    if (error) {
        console.error("Error toggling license status:", error.message);
        alert('Gagal mengubah status lisensi: ' + error.message);
    } else {
        alert('Status lisensi berhasil diubah.');
        await loadLicensesData();
    }
}

export async function extendLicense(licenseId) {
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
    currentExpiryDate.setMonth(currentExpiryDate.getMonth() + 1);

    const { error: updateError } = await supabase
        .from('licenses')
        .update({ is_active: true, expiry_date: currentExpiryDate.toISOString() })
        .eq('id', licenseId);

    if (updateError) {
        console.error("Error memperpanjang lisensi:", updateError.message);
        alert('Gagal memperpanjang lisensi: ' + updateError.message);
    } else {
        alert('Lisensi berhasil diperpanjang 1 bulan.');
        await loadLicensesData();
    }
}

export async function deleteLicense(licenseId) {
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
        await loadLicensesData();
    }
}

export function setupAdminListeners() {
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
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', data.user.id)
                    .single();

                if (userError || !userData || userData.role !== 'admin') {
                    await supabase.auth.signOut();
                    adminLoginMessage.textContent = 'Akses ditolak: Hanya admin yang diizinkan.';
                    adminLoginMessage.className = 'message error';
                    console.warn("Unauthorized admin access attempt for user:", email);
                } else {
                    adminLoginMessage.textContent = 'Login admin berhasil!';
                    adminLoginMessage.className = 'message success';
                    adminEmailInput.value = '';
                    adminPasswordInput.value = '';
                    showAdminPanel();
                    await loadLicensesData(); // Muat data lisensi setelah login admin
                }
            }
        });
    }

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Admin logout error:", error.message);
                alert('Gagal logout admin: ' + error.message);
            } else {
                alert('Logout admin berhasil!');
                showAuthSection();
            }
        });
    }

    if (refreshLicensesBtn) {
        refreshLicensesBtn.addEventListener('click', loadLicensesData);
    }
}

// Untuk membuat fungsi-fungsi ini bisa diakses dari atribut onclick di HTML
window.adminFunctions = {
    toggleLicenseStatus,
    extendLicense,
    deleteLicense
};