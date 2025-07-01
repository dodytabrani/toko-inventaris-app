// js/auth.js
import { supabase } from './supabaseClient.js';
import {
    showAuthSection,
    showUserApp,
    showAdminPanel,
    mainLoginBtn,
    mainLogoutBtn,
    loginEmailInput,
    loginPasswordInput,
    loginBtn,
    loginMessage,
    signupEmailInput,
    signupPasswordInput,
    signupBtn,
    signupMessage,
    logoutBtn
} from './ui.js';
import { loadInventarisData } from './inventory.js'; // Akan diimplementasikan sebentar lagi
import { loadLicensesData } from './admin.js'; // Akan diimplementasikan sebentar lagi

export async function checkUserRoleAndRedirect(user) {
    if (!user) {
        console.error("User is null in checkUserRoleAndRedirect");
        showAuthSection(); // Kembali ke auth jika user null
        return;
    }

    const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error("Error fetching user role:", error.message);
        showUserApp(user.email); // Asumsi user biasa jika error
        return;
    }

    if (data && data.role === 'admin') {
        showAdminPanel();
        await loadLicensesData(); // Muat data lisensi untuk admin
    } else {
        showUserApp(user.email);
        await loadInventarisData(); // Muat data inventaris untuk user
    }
}

export function setupAuthListeners() {
    if (mainLoginBtn) {
        mainLoginBtn.addEventListener('click', showAuthSection);
    }

    if (mainLogoutBtn) {
        mainLogoutBtn.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Logout error:", error.message);
                alert('Gagal logout: ' + error.message);
            } else {
                alert('Logout berhasil!');
                showAuthSection();
            }
        });
    }

    if (signupBtn) {
        signupBtn.addEventListener('click', async () => {
            const email = signupEmailInput.value;
            const password = signupPasswordInput.value;
            signupMessage.textContent = '';

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
                }
            } else {
                signupMessage.textContent = 'Pendaftaran berhasil. Silakan cek email Anda untuk konfirmasi.';
                signupMessage.className = 'message info';
                signupEmailInput.value = '';
                signupPasswordInput.value = '';
            }
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = loginEmailInput.value;
            const password = loginPasswordInput.value;
            loginMessage.textContent = '';

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

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Logout error:", error.message);
                alert('Gagal logout: ' + error.message);
            } else {
                alert('Logout berhasil!');
                showAuthSection();
            }
        });
    }
}