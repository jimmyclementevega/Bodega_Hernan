document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginSection = document.getElementById('login-section');
    const panelSection = document.getElementById('panel-section');
    const logoutButton = document.getElementById('logout-btn');
    const formAdmin = document.getElementById('form-admin');
    const tablaInventario = document.getElementById('tabla-inventario');
    const categoriaSelect = document.getElementById('admin-categoria');
    const campoDescuento = document.getElementById('campo-descuento');
    const descuentoInput = document.getElementById('admin-descuento');
    const adminTabs = document.querySelectorAll('#admin-tabs button[data-tab]');
    const productosSection = document.getElementById('productos-section');
    const pedidosSection = document.getElementById('pedidos-section');
    const tablaPedidos = document.getElementById('tabla-pedidos');
    const refreshPedidos = document.getElementById('refresh-pedidos');

 const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : ''; // Deja una cadena vacía para que use el mismo dominio de la web

    const construirUrl = (ruta) => `${API_BASE_URL}${ruta}`;
    const URL_PRODUCTOS = '/api/productos';

    let productosDinamicos = [];

    function normalizarProductos(lista) {
        return lista.map((prod) => ({
            ...prod,
            categoria: prod.categoria || 'destacado',
            descuento: Number(prod.descuento) || 0,
            precio: Number(prod.precio) || 0,
        }));
    }

    async function cargarProductos() {
        if (!tablaInventario) return [];

        try {
            const respuesta = await fetch(construirUrl(URL_PRODUCTOS));
            if (!respuesta.ok) {
                throw new Error('Error obteniendo productos del servidor.');
            }

            productosDinamicos = normalizarProductos(await respuesta.json());
            actualizarTabla();
            return productosDinamicos;
        } catch (error) {
            console.error(error);
            tablaInventario.innerHTML = '<tr><td colspan="5" class="text-center text-danger">No se pudieron cargar los productos desde el servidor.</td></tr>';
            return [];
        }
    }

    async function guardarProductosEnBackend(productos) {
        const respuesta = await fetch(construirUrl(URL_PRODUCTOS), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productos),
        });

        if (!respuesta.ok) {
            throw new Error('Error guardando los productos en el servidor.');
        }

        return respuesta.json();
    }

    function mostrarPanel() {
        if (loginSection) loginSection.classList.add('d-none');
        if (panelSection) panelSection.classList.remove('d-none');
    }

    function mostrarLogin() {
        if (panelSection) panelSection.classList.add('d-none');
        if (loginSection) loginSection.classList.remove('d-none');
    }

    function verificarSesion() {
        return sessionStorage.getItem('isLoggedIn') === 'true';
    }

    window.onload = () => {
        if (verificarSesion()) {
            mostrarPanel();
            cargarPedidos();
            cargarProductos();
        } else {
            mostrarLogin();
        }
    };

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const usuario = document.getElementById('login-user')?.value.trim() || '';
            const password = document.getElementById('login-password')?.value.trim() || '';

            try {
                const respuesta = await fetch(construirUrl('/api/login'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ usuario, password }),
                });

                const data = await respuesta.json();

                if (respuesta.ok && data.ok) {
                    sessionStorage.setItem('isLoggedIn', 'true');
                    mostrarPanel();
                    cargarPedidos();
                    cargarProductos();
                } else {
                    alert(data.mensaje || 'Usuario o contraseña incorrectos.');
                }
            } catch (error) {
                console.error(error);
                alert('No se pudo validar el acceso en este momento.');
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.removeItem('isLoggedIn');
            window.location.reload();
        });
    }

    function mostrarSeccion(tab) {
        if (tab === 'pedidos') {
            pedidosSection?.classList.remove('d-none');
            productosSection?.classList.add('d-none');
        } else {
            productosSection?.classList.remove('d-none');
            pedidosSection?.classList.add('d-none');
        }

        adminTabs.forEach((boton) => {
            if (boton.dataset.tab === tab) {
                boton.classList.add('active');
            } else {
                boton.classList.remove('active');
            }
        });
    }

    async function cargarPedidos() {
        if (!tablaPedidos) return;

        tablaPedidos.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Cargando pedidos...</td></tr>';

        try {
            const respuesta = await fetch(construirUrl('/api/pedidos'));
            if (!respuesta.ok) {
                throw new Error('Error obteniendo pedidos del servidor.');
            }

            const pedidos = await respuesta.json();
            if (!Array.isArray(pedidos) || pedidos.length === 0) {
                tablaPedidos.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay pedidos registrados.</td></tr>';
                return;
            }

            tablaPedidos.innerHTML = '';
            pedidos.forEach((pedido) => {
                const fila = document.createElement('tr');
                const itemsTexto = pedido.items?.map((item) => `${item.nombre} x${item.cantidad}`).join(', ') || 'Sin items';
                fila.innerHTML = `
                    <td>${pedido.clienteNombre || '---'}</td>
                    <td>${pedido.horaRecojo || '---'}</td>
                    <td>${pedido.telefono || '---'}</td>
                    <td>${itemsTexto}</td>
                    <td>${pedido.fecha ? new Date(pedido.fecha).toLocaleString() : '---'}</td>
                `;
                tablaPedidos.appendChild(fila);
            });
        } catch (error) {
            tablaPedidos.innerHTML = '<tr><td colspan="5" class="text-center text-danger">No se pudieron cargar los pedidos.</td></tr>';
            console.error(error);
        }
    }

    if (adminTabs) {
        adminTabs.forEach((boton) => {
            boton.addEventListener('click', () => {
                mostrarSeccion(boton.dataset.tab);
                if (boton.dataset.tab === 'pedidos') {
                    cargarPedidos();
                }
            });
        });
    }

    if (refreshPedidos) {
        refreshPedidos.addEventListener('click', cargarPedidos);
    }

    function mostrarCampoDescuento() {
        if (!campoDescuento || !descuentoInput || !categoriaSelect) return;
        const mostrar = categoriaSelect.value === 'promocion';
        campoDescuento.style.display = mostrar ? 'block' : 'none';
        if (!mostrar) {
            descuentoInput.value = '0';
        }
    }

    function actualizarTabla() {
        if (!tablaInventario) return;

        tablaInventario.innerHTML = '';

        if (productosDinamicos.length === 0) {
            tablaInventario.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No has agregado productos nuevos.</td></tr>';
            return;
        }

        productosDinamicos.forEach((prod, index) => {
            const fila = document.createElement('tr');
            const categoriaTexto = prod.categoria === 'normal'
                ? 'Producto normal'
                : prod.categoria === 'promocion'
                    ? 'Promoción'
                    : 'Destacado';

            fila.innerHTML = `
                <td><strong>${prod.nombre}</strong></td>
                <td>S/. ${parseFloat(prod.precio).toFixed(2)}</td>
                <td>${categoriaTexto}</td>
                <td>${prod.descuento > 0 ? `${prod.descuento}%` : '—'}</td>
                <td>
                    <button class="btn btn-danger btn-sm btn-eliminar" data-index="${index}">Eliminar</button>
                </td>
            `;
            tablaInventario.appendChild(fila);
        });
    }

    if (formAdmin) {
        formAdmin.addEventListener('submit', async (event) => {
            event.preventDefault();

            const nombre = document.getElementById('admin-nombre')?.value.trim() || '';
            const precio = parseFloat(document.getElementById('admin-precio')?.value || 0);
            const descripcion = document.getElementById('admin-desc')?.value.trim() || '';
            const imagen = document.getElementById('admin-imagen')?.value.trim() || 'imagenes/defecto.webp';
            const categoria = categoriaSelect ? categoriaSelect.value : 'destacado';
            const descuento = categoria === 'promocion'
                ? Math.max(0, Math.min(100, Number(descuentoInput?.value) || 0))
                : 0;

            if (!nombre || Number.isNaN(precio)) return;

            const nuevoProd = {
                id: `dinamico_${Date.now()}`,
                nombre,
                precio,
                descripcion,
                imagen,
                categoria,
                descuento,
            };

            try {
                await guardarProductosEnBackend(nuevoProd);
                await cargarProductos();
                formAdmin.reset();
                if (categoriaSelect) categoriaSelect.value = 'destacado';
                mostrarCampoDescuento();
            } catch (error) {
                console.error(error);
                alert('No se pudo guardar el producto en el servidor. Intenta de nuevo.');
            }
        });
    }

    if (tablaInventario) {
        tablaInventario.addEventListener('click', async (event) => {
            if (event.target.classList.contains('btn-eliminar')) {
                const index = Number(event.target.dataset.index);
                if (Number.isNaN(index)) return;

                productosDinamicos.splice(index, 1);

                try {
                    await guardarProductosEnBackend(productosDinamicos);
                    await cargarProductos();
                } catch (error) {
                    console.error(error);
                    alert('No se pudo eliminar el producto en el servidor. Intenta de nuevo.');
                }
            }
        });
    }

    if (categoriaSelect) {
        categoriaSelect.addEventListener('change', mostrarCampoDescuento);
    }

    productosDinamicos = normalizarProductos(productosDinamicos);
    mostrarCampoDescuento();
    actualizarTabla();
});
