const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
    ];

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }

    next();
});

app.use(express.static(path.join(__dirname, '../frontend')));

const pathProductos = path.join(__dirname, 'productos.json');
const pathPedidos = path.join(__dirname, 'pedidos.json');

const ADMIN_USUARIO = 'admin';
const ADMIN_PASSWORD_SALT = 'bodega-ernan-salt-v1';
const ADMIN_PASSWORD_HASH = crypto.pbkdf2Sync('admin123', ADMIN_PASSWORD_SALT, 100000, 64, 'sha512').toString('hex');

const verificarCredencialesAdmin = (usuario, password) => {
    if (!usuario || !password) return false;

    const hashIngresado = crypto.pbkdf2Sync(password, ADMIN_PASSWORD_SALT, 100000, 64, 'sha512').toString('hex');
    return usuario === ADMIN_USUARIO && hashIngresado === ADMIN_PASSWORD_HASH;
};

// Función auxiliar para leer los productos del archivo JSON
const leerProductos = () => {
    try {
        const datos = fs.readFileSync(pathProductos, 'utf-8');
        return JSON.parse(datos);
    } catch (error) {
        return [];
    }
};

// Función auxiliar para escribir/guardar los productos en el archivo JSON
const guardarProductos = (productos) => {
    fs.writeFileSync(pathProductos, JSON.stringify(productos, null, 2), 'utf-8');
};

// Función auxiliar para leer los pedidos del archivo JSON
const leerPedidos = () => {
    try {
        const datos = fs.readFileSync(pathPedidos, 'utf-8');
        return JSON.parse(datos);
    } catch (error) {
        return [];
    }
};

// Función auxiliar para escribir/guardar los pedidos en el archivo JSON
const guardarPedidos = (pedidos) => {
    fs.writeFileSync(pathPedidos, JSON.stringify(pedidos, null, 2), 'utf-8');
};

// 2. RUTA GET: Obtener todos los productos para mostrarlos en la tienda
app.get('/api/productos', (req, res) => {
    const productos = leerProductos();
    res.json(productos);
});

// RUTA POST: Validar credenciales de administrador de forma segura
app.post('/api/login', (req, res) => {
    const { usuario, password } = req.body || {};

    if (verificarCredencialesAdmin(usuario, password)) {
        return res.json({ ok: true, mensaje: 'Acceso concedido.' });
    }

    return res.status(401).json({ ok: false, mensaje: 'Usuario o contraseña incorrectos.' });
});

// RUTA GET: Obtener pedidos guardados
app.get('/api/pedidos', (req, res) => {
    const pedidos = leerPedidos();
    res.json(pedidos);
});

// 3. RUTA POST: Recibir un nuevo producto desde el panel de Admin y guardarlo
app.post('/api/productos', (req, res) => {
    const nuevosProductos = req.body; // El frontend enviará la lista actualizada o el nuevo item
    
    if (Array.isArray(nuevosProductos)) {
        guardarProductos(nuevosProductos);
    } else {
        const listaActual = leerProductos();
        listaActual.push(nuevosProductos);
        guardarProductos(listaActual);
    }
    
    res.status(201).json({ mensaje: "Inventario actualizado con éxito en el servidor" });
});

// 4. RUTA POST: Guardar pedido en el backend
app.post('/api/pedidos', (req, res) => {
    const nuevoPedido = req.body;
    if (!nuevoPedido || typeof nuevoPedido !== 'object') {
        return res.status(400).json({ error: 'Datos de pedido inválidos.' });
    }

    const pedidosActuales = leerPedidos();
    pedidosActuales.push(nuevoPedido);
    guardarPedidos(pedidosActuales);

    res.status(201).json({ mensaje: 'Pedido guardado correctamente.' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`¡Ya puedes probar la Tienda Hernán desde esa URL!`);
});