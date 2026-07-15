// ============================================================
// 🌿 VIDASANA MX - LÓGICA LOGIN/REGISTRO
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 🔥 REEMPLAZA CON TU CONFIGURACIÓN DE FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyAj491vMui-Ey6jVnIstBf_n0OiSfhplAg",
  authDomain: "vida-sana-mx.firebaseapp.com",
  databaseURL: "https://vida-sana-mx-default-rtdb.firebaseio.com",
  projectId: "vida-sana-mx",
  storageBucket: "vida-sana-mx.firebasestorage.app",
  messagingSenderId: "525615173137",
  appId: "1:525615173137:web:908556c4945e8ccbc6ebb0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

function mostrarMensaje(elementId, texto, tipo) {
    const div = document.getElementById(elementId);
    if (!div) return;
    div.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        if (div.innerHTML === `<div class="message ${tipo}">${texto}</div>`) {
            div.innerHTML = '';
        }
    }, 5000);
}

function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (loading) {
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.setAttribute('data-original', originalText);
        btn.innerHTML = '<span class="spinner"></span> Cargando...';
    } else {
        btn.disabled = false;
        btn.innerHTML = btn.getAttribute('data-original') || btn.innerHTML;
    }
}

function irA(pagina) {
    window.location.href = pagina;
}

// ============================================================
// CERRAR SESIÓN (para usuarios que vuelven al login)
// ============================================================

export async function cerrarSesionForzada() {
    try {
        await signOut(auth);
        console.log('Sesión cerrada correctamente');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// ============================================================
// SWITCH TABS
// ============================================================

export function switchTab(tab) {
    document.querySelectorAll('.form-panel, .recovery-panel').forEach(p => p.classList.remove('active'));

    const panels = {
        login: 'loginPanel',
        register: 'registerPanel',
        admin: 'adminPanel'
    };

    if (tab === 'recovery') {
        document.getElementById('recoveryPanel').classList.add('active');
        document.getElementById('authTabs').style.display = 'none';
        document.getElementById('formTitle').textContent = 'Recuperar Contraseña';
        document.getElementById('formSubtitle').textContent = 'Te ayudaremos a restablecerla';
        return;
    }

    document.getElementById(panels[tab]).classList.add('active');
    document.getElementById('authTabs').style.display = 'flex';
    document.getElementById('recoveryPanel').classList.remove('active');

    const titles = {
        login: { title: 'Bienvenido', subtitle: 'Inicia sesión para continuar' },
        register: { title: 'Crear Cuenta', subtitle: 'Comienza tu viaje hacia una vida más saludable' },
        admin: { title: 'Panel de Administración', subtitle: 'Ingresa con tus credenciales de administrador' }
    };

    document.getElementById('formTitle').textContent = titles[tab].title;
    document.getElementById('formSubtitle').textContent = titles[tab].subtitle;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    document.querySelectorAll('.message').forEach(m => m.innerHTML = '');
}

// ============================================================
// LOGIN
// ============================================================

export async function login() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        mostrarMensaje('loginMessage', '❌ Completa todos los campos', 'error');
        return;
    }

    setLoading('loginBtn', true);

    try {
        await signInWithEmailAndPassword(auth, email, password);
        mostrarMensaje('loginMessage', '✅ ¡Bienvenido! Redirigiendo...', 'success');
        // Redirige al dashboard después del login
        setTimeout(() => irA('dashboard.html'), 1500);
    } catch (error) {
        console.error('Error login:', error);
        if (error.code === 'auth/user-not-found') {
            mostrarMensaje('loginMessage', '❌ No existe una cuenta con este correo', 'error');
        } else if (error.code === 'auth/wrong-password') {
            mostrarMensaje('loginMessage', '❌ Contraseña incorrecta', 'error');
        } else {
            mostrarMensaje('loginMessage', '❌ Error: ' + error.message, 'error');
        }
        setLoading('loginBtn', false);
    }
}

// ============================================================
// REGISTRO
// ============================================================

export async function register() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const birthdate = document.getElementById('regBirthdate').value;
    const gender = document.getElementById('regGender').value;
    const height = parseFloat(document.getElementById('regHeight').value);
    const weight = parseFloat(document.getElementById('regWeight').value);
    const activity = document.getElementById('regActivity').value;
    const goal = document.getElementById('regGoal').value;
    const conditions = document.getElementById('regConditions').value.trim();

    if (!name || !email || !password) {
        mostrarMensaje('registerMessage', '❌ Los campos con * son obligatorios', 'error');
        return;
    }

    if (password.length < 6) {
        mostrarMensaje('registerMessage', '❌ La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    setLoading('registerBtn', true);

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        await setDoc(doc(db, "usuarios", userCredential.user.uid), {
            nombre: name,
            email: email,
            fecha_nacimiento: birthdate || null,
            genero: gender || null,
            altura: height || null,
            peso_actual: weight || 70,
            peso_meta: weight ? weight - 5 : 65,
            nivel_actividad: activity || null,
            objetivo: goal || null,
            condiciones_salud: conditions || null,
            created_at: new Date().toISOString()
        });

        mostrarMensaje('registerMessage', '✅ ¡Cuenta creada exitosamente! Redirigiendo...', 'success');
        // Redirige al dashboard después del registro
        setTimeout(() => irA('dashboard.html'), 1500);
    } catch (error) {
        console.error('Error registro:', error);
        if (error.code === 'auth/email-already-in-use') {
            mostrarMensaje('registerMessage', '⚠️ Esta cuenta ya existe. Ve a "Iniciar Sesión"', 'info');
        } else {
            mostrarMensaje('registerMessage', '❌ Error: ' + error.message, 'error');
        }
        setLoading('registerBtn', false);
    }
}

// ============================================================
// LOGIN CON GOOGLE
// ============================================================

export async function loginWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, "usuarios", user.uid), {
                nombre: user.displayName || 'Usuario',
                email: user.email,
                peso_actual: 70,
                peso_meta: 65,
                created_at: new Date().toISOString()
            });
        }

        mostrarMensaje('loginMessage', '✅ ¡Bienvenido! Redirigiendo...', 'success');
        // Redirige al dashboard después del login con Google
        setTimeout(() => irA('dashboard.html'), 1500);
    } catch (error) {
        console.error('Error Google:', error);
        if (error.code === 'auth/popup-blocked') {
            mostrarMensaje('loginMessage', '❌ Permite popups para este sitio', 'error');
        } else {
            mostrarMensaje('loginMessage', '❌ Error: ' + error.message, 'error');
        }
    }
}

// ============================================================
// RECUPERAR CONTRASEÑA
// ============================================================

export function showRecovery() {
    document.getElementById('recoveryPanel').classList.add('active');
    document.getElementById('authTabs').style.display = 'none';
    document.getElementById('loginPanel').classList.remove('active');
    document.getElementById('registerPanel').classList.remove('active');
    document.getElementById('adminPanel').classList.remove('active');
    document.getElementById('formTitle').textContent = 'Recuperar Contraseña';
    document.getElementById('formSubtitle').textContent = 'Te ayudaremos a restablecerla';
}

export function hideRecovery() {
    document.getElementById('recoveryPanel').classList.remove('active');
    document.getElementById('authTabs').style.display = 'flex';
    document.getElementById('loginPanel').classList.add('active');
    document.getElementById('formTitle').textContent = 'Bienvenido';
    document.getElementById('formSubtitle').textContent = 'Inicia sesión para continuar';
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === 'login');
    });
    document.getElementById('recoveryMessage').innerHTML = '';
}

export async function resetPassword() {
    const email = document.getElementById('recoveryEmail').value.trim();
    if (!email) {
        mostrarMensaje('recoveryMessage', '❌ Ingresa tu correo electrónico', 'error');
        return;
    }

    try {
        await sendPasswordResetEmail(auth, email);
        mostrarMensaje('recoveryMessage', '✅ Revisa tu correo para restablecer la contraseña', 'success');
        setTimeout(hideRecovery, 3000);
    } catch (error) {
        console.error('Error recovery:', error);
        if (error.code === 'auth/user-not-found') {
            mostrarMensaje('recoveryMessage', '❌ No existe una cuenta con este correo', 'error');
        } else {
            mostrarMensaje('recoveryMessage', '❌ Error: ' + error.message, 'error');
        }
    }
}

// ============================================================
// ADMIN LOGIN
// ============================================================

export function adminLogin() {
    const user = document.getElementById('adminUser').value.trim();
    const pass = document.getElementById('adminPassword').value.trim();

    const adminCredentials = {
        user: 'admin',
        pass: 'admin123'
    };

    if (user === adminCredentials.user && pass === adminCredentials.pass) {
        mostrarMensaje('adminMessage', '✅ Acceso de administrador concedido. Redirigiendo...', 'success');
        setTimeout(() => irA('admin.html'), 1500);
    } else {
        mostrarMensaje('adminMessage', '❌ Credenciales de administrador incorrectas', 'error');
    }
}

// ============================================================
// INICIALIZAR - VERIFICAR SESIÓN
// ============================================================

onAuthStateChanged(auth, (user) => {
    if (user) {
        // ✅ SOLO REDIRIGE SI EL USUARIO ESTÁ EN LA PÁGINA DE LOGIN
        // Verificamos que estamos en login.html o index.html
        const currentPage = window.location.pathname.split('/').pop();
        if (currentPage === 'login.html' || currentPage === 'index.html' || currentPage === '') {
            console.log('Usuario autenticado, redirigiendo a dashboard...');
            irA('index.html');
        }
    }
});

// ============================================================
// EXPONER FUNCIONES AL SCOPE GLOBAL
// ============================================================

window.login = login;
window.register = register;
window.loginWithGoogle = loginWithGoogle;
window.resetPassword = resetPassword;
window.adminLogin = adminLogin;
window.showRecovery = showRecovery;
window.hideRecovery = hideRecovery;
window.switchTab = switchTab;
window.irA = irA;
window.cerrarSesionForzada = cerrarSesionForzada;