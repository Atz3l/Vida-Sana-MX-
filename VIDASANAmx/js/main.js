// ============================================================
// 🌿 VIDASANA MX - FUNCIONES COMPARTIDAS
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exportar para usar en otros archivos
export { auth, db };

// ============================================================
// FUNCIONES DE NAVEGACIÓN
// ============================================================

export function irA(pagina) {
    window.location.href = pagina;
}

export function cerrarSesion() {
    signOut(auth);
    window.location.href = 'index.html';
}

export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
    if (overlay) {
        overlay.classList.toggle('active');
    }
}

// ============================================================
// FUNCIONES DE MENSAJES
// ============================================================

export function mostrarMensaje(elementId, texto, tipo = 'success') {
    const div = document.getElementById(elementId);
    if (!div) return;
    div.innerHTML = `<div class="message ${tipo}">${texto}</div>`;
    setTimeout(() => {
        if (document.getElementById(elementId)?.innerHTML === `<div class="message ${tipo}">${texto}</div>`) {
            document.getElementById(elementId).innerHTML = '';
        }
    }, 4000);
}

// ============================================================
// FUNCIONES DE USUARIO
// ============================================================

export async function obtenerDatosUsuario(userId) {
    try {
        const userDoc = await getDoc(doc(db, "usuarios", userId));
        if (userDoc.exists()) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error('Error obteniendo datos de usuario:', error);
        return null;
    }
}

export async function actualizarDatosUsuario(userId, data) {
    try {
        await setDoc(doc(db, "usuarios", userId), data, { merge: true });
        return true;
    } catch (error) {
        console.error('Error actualizando usuario:', error);
        return false;
    }
}

// ============================================================
// FUNCIONES DE PESO
// ============================================================

export async function registrarPeso(userId, peso) {
    try {
        await addDoc(collection(db, "pesos"), {
            userId: userId,
            peso: peso,
            fecha: new Date().toISOString()
        });
        await actualizarDatosUsuario(userId, { peso_actual: peso });
        return true;
    } catch (error) {
        console.error('Error registrando peso:', error);
        return false;
    }
}

export async function obtenerHistorialPesos(userId, limite = 10) {
    try {
        const q = query(
            collection(db, "pesos"),
            where("userId", "==", userId),
            orderBy("fecha", "desc"),
            limit(limite)
        );
        const snapshot = await getDocs(q);
        const pesos = [];
        snapshot.forEach(doc => {
            pesos.push({ id: doc.id, ...doc.data() });
        });
        return pesos;
    } catch (error) {
        console.error('Error obteniendo historial de pesos:', error);
        return [];
    }
}

// ============================================================
// FUNCIONES DE ALIMENTOS
// ============================================================

export async function registrarAlimento(userId, nombre, calorias, tipo) {
    try {
        await addDoc(collection(db, "alimentos"), {
            userId: userId,
            nombre: nombre,
            calorias: parseInt(calorias),
            tipo: tipo,
            fecha: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error('Error registrando alimento:', error);
        return false;
    }
}

export async function obtenerAlimentosHoy(userId) {
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);

        const q = query(
            collection(db, "alimentos"),
            where("userId", "==", userId)
        );
        const snapshot = await getDocs(q);
        const alimentos = [];
        let total = 0;
        snapshot.forEach(doc => {
            const data = doc.data();
            const fecha = new Date(data.fecha);
            if (fecha >= hoy && fecha < manana) {
                alimentos.push(data);
                total += data.calorias || 0;
            }
        });
        return { alimentos, total };
    } catch (error) {
        console.error('Error obteniendo alimentos de hoy:', error);
        return { alimentos: [], total: 0 };
    }
}

// ============================================================
// FUNCIONES DE EJERCICIOS
// ============================================================

export async function registrarEjercicio(userId, nombre, duracion, calorias) {
    try {
        await addDoc(collection(db, "ejercicios"), {
            userId: userId,
            nombre: nombre,
            duracion: parseInt(duracion),
            calorias: parseInt(calorias),
            fecha: new Date().toISOString()
        });
        return true;
    } catch (error) {
        console.error('Error registrando ejercicio:', error);
        return false;
    }
}

export async function obtenerEjerciciosHoy(userId) {
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);

        const q = query(
            collection(db, "ejercicios"),
            where("userId", "==", userId)
        );
        const snapshot = await getDocs(q);
        const ejercicios = [];
        let totalMinutos = 0;
        let totalCalorias = 0;
        snapshot.forEach(doc => {
            const data = doc.data();
            const fecha = new Date(data.fecha);
            if (fecha >= hoy && fecha < manana) {
                ejercicios.push(data);
                totalMinutos += data.duracion || 0;
                totalCalorias += data.calorias || 0;
            }
        });
        return { ejercicios, totalMinutos, totalCalorias };
    } catch (error) {
        console.error('Error obteniendo ejercicios de hoy:', error);
        return { ejercicios: [], totalMinutos: 0, totalCalorias: 0 };
    }
}

// ============================================================
// FUNCIONES DE LOGROS
// ============================================================

export async function obtenerLogros(userId) {
    try {
        const alimentosSnap = await getDocs(query(collection(db, "alimentos"), where("userId", "==", userId)));
        const ejerciciosSnap = await getDocs(query(collection(db, "ejercicios"), where("userId", "==", userId)));
        const pesosSnap = await getDocs(query(collection(db, "pesos"), where("userId", "==", userId)));

        const logros = [
            { id: 1, nombre: "Primer Alimento", icono: "🍎", completado: alimentosSnap.size >= 1 },
            { id: 2, nombre: "Explorador", icono: "🍽️", completado: alimentosSnap.size >= 5 },
            { id: 3, nombre: "Primer Ejercicio", icono: "💪", completado: ejerciciosSnap.size >= 1 },
            { id: 4, nombre: "Atleta", icono: "🏃", completado: ejerciciosSnap.size >= 5 },
            { id: 5, nombre: "Primer Peso", icono: "⚖️", completado: pesosSnap.size >= 1 },
            { id: 6, nombre: "Constancia", icono: "📅", completado: pesosSnap.size >= 3 }
        ];

        const completados = logros.filter(l => l.completado).length;
        return { logros, completados, total: logros.length };
    } catch (error) {
        console.error('Error obteniendo logros:', error);
        return { logros: [], completados: 0, total: 0 };
    }
}

// ============================================================
// FUNCIONES DE HISTORIAL
// ============================================================

export async function obtenerHistorialCompleto(userId, tipo = 'all', fecha = null) {
    try {
        let items = [];
        let totalAlimentos = 0;
        let totalEjercicios = 0;
        let totalPesos = 0;

        // Alimentos
        if (tipo === 'all' || tipo === 'alimentos') {
            let q = query(collection(db, "alimentos"), where("userId", "==", userId));
            if (fecha) {
                const inicio = new Date(fecha);
                inicio.setHours(0, 0, 0, 0);
                const fin = new Date(fecha);
                fin.setHours(23, 59, 59, 999);
                q = query(collection(db, "alimentos"), where("userId", "==", userId), where("fecha", ">=", inicio.toISOString()), where("fecha", "<=", fin.toISOString()));
            }
            const snapshot = await getDocs(q);
            totalAlimentos = snapshot.size;
            snapshot.forEach(doc => {
                items.push({ ...doc.data(), tipoItem: 'alimento', id: doc.id });
            });
        }

        // Ejercicios
        if (tipo === 'all' || tipo === 'ejercicios') {
            let q = query(collection(db, "ejercicios"), where("userId", "==", userId));
            if (fecha) {
                const inicio = new Date(fecha);
                inicio.setHours(0, 0, 0, 0);
                const fin = new Date(fecha);
                fin.setHours(23, 59, 59, 999);
                q = query(collection(db, "ejercicios"), where("userId", "==", userId), where("fecha", ">=", inicio.toISOString()), where("fecha", "<=", fin.toISOString()));
            }
            const snapshot = await getDocs(q);
            totalEjercicios = snapshot.size;
            snapshot.forEach(doc => {
                items.push({ ...doc.data(), tipoItem: 'ejercicio', id: doc.id });
            });
        }

        // Pesos
        if (tipo === 'all' || tipo === 'peso') {
            let q = query(collection(db, "pesos"), where("userId", "==", userId));
            if (fecha) {
                const inicio = new Date(fecha);
                inicio.setHours(0, 0, 0, 0);
                const fin = new Date(fecha);
                fin.setHours(23, 59, 59, 999);
                q = query(collection(db, "pesos"), where("userId", "==", userId), where("fecha", ">=", inicio.toISOString()), where("fecha", "<=", fin.toISOString()));
            }
            const snapshot = await getDocs(q);
            totalPesos = snapshot.size;
            snapshot.forEach(doc => {
                items.push({ ...doc.data(), tipoItem: 'peso', id: doc.id });
            });
        }

        items.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

        return {
            items,
            totalAlimentos,
            totalEjercicios,
            totalPesos,
            total: items.length
        };
    } catch (error) {
        console.error('Error obteniendo historial:', error);
        return { items: [], totalAlimentos: 0, totalEjercicios: 0, totalPesos: 0, total: 0 };
    }
}

// ============================================================
// FUNCIONES DE ADMIN
// ============================================================

export async function obtenerEstadisticasAdmin() {
    try {
        const usuariosSnap = await getDocs(collection(db, "usuarios"));
        const alimentosSnap = await getDocs(collection(db, "alimentos"));
        const ejerciciosSnap = await getDocs(collection(db, "ejercicios"));
        const pesosSnap = await getDocs(collection(db, "pesos"));

        return {
            totalUsuarios: usuariosSnap.size,
            totalAlimentos: alimentosSnap.size,
            totalEjercicios: ejerciciosSnap.size,
            totalPesos: pesosSnap.size
        };
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        return { totalUsuarios: 0, totalAlimentos: 0, totalEjercicios: 0, totalPesos: 0 };
    }
}

export async function eliminarUsuario(userId) {
    try {
        await deleteDoc(doc(db, "usuarios", userId));
        return true;
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        return false;
    }
}

// ============================================================
// FUNCIONES DE MENSAJES MOTIVACIONALES
// ============================================================

const mensajesMotivacionales = [
    "El cuerpo logra lo que la mente cree. Cada pequeño paso cuenta hoy.",
    "La disciplina es el puente entre tus metas y tus logros.",
    "No se trata de ser el mejor, se trata de ser mejor que ayer.",
    "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
    "Tu única competencia eres tú mismo. ¡Siempre hacia adelante!",
    "Cada gota de sudor te acerca más a tu mejor versión.",
    "La constancia vence lo que la genialidad no alcanza.",
    "Hoy es el día perfecto para empezar a construir tu mejor versión."
];

export function obtenerMensajeMotivacional() {
    const index = Math.floor(Math.random() * mensajesMotivacionales.length);
    return mensajesMotivacionales[index];
}