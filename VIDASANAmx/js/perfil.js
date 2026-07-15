// ============================================================
// 🌿 VIDASANA MX - LÓGICA PERFIL (CORREGIDO)
// ============================================================

import { auth, db, irA, cerrarSesion, toggleSidebar, mostrarMensaje } from './main.js';
import { getDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ============================================================
// 1. VARIABLES GLOBALES
// ============================================================

let userData = {};
let isEditMode = false;

// ============================================================
// 2. FUNCIONES DE DOM
// ============================================================

function getElement(id) {
    return document.getElementById(id);
}

function getValue(id) {
    const el = getElement(id);
    return el ? el.value : '';
}

function setText(id, text) {
    const el = getElement(id);
    if (el) el.textContent = text;
}

function setValue(id, value) {
    const el = getElement(id);
    if (el) el.value = value || '';
}

function showView() {
    const viewMode = getElement('viewMode');
    const editMode = getElement('editMode');
    if (viewMode) viewMode.style.display = 'block';
    if (editMode) editMode.style.display = 'none';
}

function showEdit() {
    const viewMode = getElement('viewMode');
    const editMode = getElement('editMode');
    if (viewMode) viewMode.style.display = 'none';
    if (editMode) editMode.style.display = 'block';
}

function togglePasswordForm() {
    const form = getElement('passwordForm');
    if (form) {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    }
    const msg = getElement('passwordMessage');
    if (msg) msg.innerHTML = '';
}

// ============================================================
// 3. MOSTRAR DATOS EN VISTA
// ============================================================

function mostrarDatos(data) {
    if (!data) return;

    // Header
    const nombre = data.nombre || 'Usuario';
    setText('displayName', nombre);
    setText('displayEmail', auth.currentUser?.email || '');

    const avatar = getElement('avatarDisplay');
    if (avatar) {
        avatar.textContent = nombre.charAt(0).toUpperCase();
    }

    // Fecha de registro
    if (data.created_at) {
        const fecha = new Date(data.created_at);
        setText('displayMemberSince', fecha.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }));
    }

    // Estadísticas
    setText('statWeight', data.peso_actual ? `${data.peso_actual} kg` : '--');
    setText('statGoal', data.peso_meta ? `${data.peso_meta} kg` : '--');
    setText('statHeight', data.altura ? `${data.altura} cm` : '--');

    // Progreso
    if (data.peso_actual && data.peso_meta) {
        const progreso = ((data.peso_actual - data.peso_meta) / data.peso_actual) * 100;
        const pct = Math.max(0, Math.min(100, progreso));
        setText('statProgress', `${pct.toFixed(0)}%`);
        setText('viewProgressText', `${pct.toFixed(0)}%`);

        const bar = getElement('metaProgressBar');
        if (bar) bar.style.width = `${pct}%`;
    }

    // Información personal - Vista
    setText('viewNombre', data.nombre || 'No especificado');
    setText('viewNacimiento', data.fecha_nacimiento ? new Date(data.fecha_nacimiento).toLocaleDateString('es-MX') : 'No especificada');
    setText('viewGenero', data.genero || 'No especificado');
    setText('viewAltura', data.altura ? `${data.altura} cm` : 'No especificada');
    setText('viewActividad', data.nivel_actividad || 'No especificado');
    setText('viewCondiciones', data.condiciones_salud || 'Ninguna especificada');
    setText('viewPesoActual', data.peso_actual ? `${data.peso_actual} kg` : 'No especificado');
    setText('viewPesoMeta', data.peso_meta ? `${data.peso_meta} kg` : 'No especificado');

    // Llenar campos de edición
    const fields = {
        editNombre: data.nombre || '',
        editNacimiento: data.fecha_nacimiento || '',
        editGenero: data.genero || '',
        editAltura: data.altura || '',
        editActividad: data.nivel_actividad || '',
        editCondiciones: data.condiciones_salud || '',
        editPesoActual: data.peso_actual || '',
        editPesoMeta: data.peso_meta || '',
        editNombreInput: data.nombre || '',
        editNacimientoInput: data.fecha_nacimiento || '',
        editGeneroInput: data.genero || '',
        editAlturaInput: data.altura || '',
        editActividadInput: data.nivel_actividad || '',
        editCondicionesInput: data.condiciones_salud || '',
        editPesoActualInput: data.peso_actual || '',
        editPesoMetaInput: data.peso_meta || ''
    };

    for (const [id, value] of Object.entries(fields)) {
        setValue(id, value);
    }
}

// ============================================================
// 4. CARGAR DATOS DEL USUARIO
// ============================================================

export async function cargarDatosUsuario(userId) {
    try {
        const userDoc = await getDoc(doc(db, "usuarios", userId));
        if (userDoc.exists()) {
            userData = userDoc.data();
            mostrarDatos(userData);
        } else {
            // Crear perfil por defecto
            await setDoc(doc(db, "usuarios", userId), {
                nombre: auth.currentUser?.displayName || 'Usuario',
                email: auth.currentUser?.email,
                peso_actual: 70,
                peso_meta: 65,
                created_at: new Date().toISOString()
            });
            await cargarDatosUsuario(userId);
        }
    } catch (error) {
        console.error('Error cargando perfil:', error);
        mostrarMensaje('profileMessage', '❌ Error cargando datos: ' + error.message, 'error');
    }
}

// ============================================================
// 5. CAMBIAR MODO EDICIÓN
// ============================================================

export function toggleEditMode() {
    isEditMode = !isEditMode;

    if (isEditMode) {
        showEdit();
        const fields = {
            editNombreInput: userData.nombre || '',
            editNacimientoInput: userData.fecha_nacimiento || '',
            editGeneroInput: userData.genero || '',
            editAlturaInput: userData.altura || '',
            editActividadInput: userData.nivel_actividad || '',
            editCondicionesInput: userData.condiciones_salud || '',
            editPesoActualInput: userData.peso_actual || '',
            editPesoMetaInput: userData.peso_meta || ''
        };
        for (const [id, value] of Object.entries(fields)) {
            setValue(id, value);
        }
    } else {
        showView();
        mostrarDatos(userData);
    }

    const msg = getElement('profileMessage');
    if (msg) msg.innerHTML = '';
}

// ============================================================
// 6. GUARDAR PERFIL (CORREGIDO - usa auth.currentUser)
// ============================================================

export async function guardarPerfil() {
    // Obtener usuario actual directamente de auth
    const user = auth.currentUser;
    
    if (!user) {
        mostrarMensaje('profileMessage', '❌ No hay usuario autenticado', 'error');
        return;
    }

    const nombre = getValue('editNombreInput').trim();
    if (!nombre) {
        mostrarMensaje('profileMessage', '❌ El nombre es obligatorio', 'error');
        return;
    }

    const data = {
        nombre: nombre,
        fecha_nacimiento: getValue('editNacimientoInput') || null,
        genero: getValue('editGeneroInput') || null,
        altura: parseFloat(getValue('editAlturaInput')) || null,
        nivel_actividad: getValue('editActividadInput') || null,
        condiciones_salud: getValue('editCondicionesInput') || null,
        peso_actual: parseFloat(getValue('editPesoActualInput')) || null,
        peso_meta: parseFloat(getValue('editPesoMetaInput')) || null,
        updated_at: new Date().toISOString()
    };

    try {
        await setDoc(doc(db, "usuarios", user.uid), data, { merge: true });
        userData = { ...userData, ...data };
        mostrarMensaje('profileMessage', '✅ Perfil actualizado exitosamente', 'success');
        setTimeout(() => {
            toggleEditMode();
        }, 1500);
    } catch (error) {
        console.error('Error guardando perfil:', error);
        mostrarMensaje('profileMessage', '❌ Error guardando cambios: ' + error.message, 'error');
    }
}

// ============================================================
// 7. CAMBIAR CONTRASEÑA (CORREGIDO - usa auth.currentUser)
// ============================================================

export async function cambiarPassword() {
    const user = auth.currentUser;
    
    if (!user) {
        mostrarMensaje('passwordMessage', '❌ No hay usuario autenticado', 'error');
        return;
    }

    const currentPass = getValue('currentPassword');
    const newPass = getValue('newPassword');
    const confirmPass = getValue('confirmPassword');

    if (!currentPass || !newPass || !confirmPass) {
        mostrarMensaje('passwordMessage', '❌ Todos los campos son obligatorios', 'error');
        return;
    }

    if (newPass.length < 6) {
        mostrarMensaje('passwordMessage', '❌ La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    if (newPass !== confirmPass) {
        mostrarMensaje('passwordMessage', '❌ Las contraseñas no coinciden', 'error');
        return;
    }

    try {
        const credential = EmailAuthProvider.credential(user.email, currentPass);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPass);

        mostrarMensaje('passwordMessage', '✅ Contraseña actualizada exitosamente', 'success');
        setValue('currentPassword', '');
        setValue('newPassword', '');
        setValue('confirmPassword', '');

        setTimeout(togglePasswordForm, 2000);
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        if (error.code === 'auth/wrong-password') {
            mostrarMensaje('passwordMessage', '❌ Contraseña actual incorrecta', 'error');
        } else {
            mostrarMensaje('passwordMessage', '❌ Error: ' + error.message, 'error');
        }
    }
}

// ============================================================
// 8. EXPONER FUNCIONES AL SCOPE GLOBAL
// ============================================================

// Navegación
window.irA = irA;
window.cerrarSesion = cerrarSesion;
window.toggleSidebar = toggleSidebar;

// Perfil
window.toggleEditMode = toggleEditMode;
window.guardarPerfil = guardarPerfil;
window.togglePasswordForm = togglePasswordForm;
window.cambiarPassword = cambiarPassword;