document.addEventListener('DOMContentLoaded', () => {
    const carrito = [];
    const listaCarrito = document.getElementById('cart-items');
    const contadorCarrito = document.getElementById('cart-count');
    const totalCarrito = document.getElementById('total-monto') || document.getElementById('cart-total');
    const botonFinalizar = document.getElementById('checkout');
    const formularioCheckout = document.getElementById('checkout-form');
    const botonGuardarPedido = document.getElementById('guardar-pedido');
    const botonAlternarCarrito = document.getElementById('cart-toggle');
    const contenedorCarrito = document.getElementById('cart');
    const contenedorDestacados = document.getElementById('grid-destacados');
    const contenedorNormales = document.getElementById('grid-normales');
    const contenedorPromociones = document.getElementById('grid-promociones');
    const contenedorTienda = document.getElementById('grid-tienda');
    const numeroWhatsApp = '+51 918 961 684';

    function formatearPrecio(monto) {
        return `S/. ${Number(monto).toFixed(2)}`;
    }

    function resetearVistaCheckout() {
        if (botonFinalizar) {
            botonFinalizar.classList.remove('d-none');
        }

        if (formularioCheckout) {
            formularioCheckout.classList.add('d-none');
            formularioCheckout.reset();
        }
    }

    function renderizarCarrito() {
        if (!listaCarrito || !contadorCarrito || !totalCarrito) return;

        listaCarrito.innerHTML = '';

        if (carrito.length === 0) {
            const itemVacio = document.createElement('li');
            itemVacio.className = 'empty';
            itemVacio.textContent = 'El carrito está vacío.';
            listaCarrito.appendChild(itemVacio);

            contadorCarrito.textContent = '0';
            totalCarrito.textContent = `Total: ${formatearPrecio(0)}`;
            resetearVistaCheckout();
            return;
        }

        let sumaTotal = 0;
        let cantidadTotalProductos = 0;

        carrito.forEach((producto) => {
            const subtotal = producto.precio * producto.cantidad;
            const itemLista = document.createElement('li');
            itemLista.className = 'd-flex justify-content-between align-items-start gap-2 mb-2';
            itemLista.innerHTML = `
                <div>
                    <strong>${producto.nombre}</strong><br>
                    <small>${producto.cantidad} x ${formatearPrecio(producto.precio)}</small>
                </div>
                <div class="text-end">
                    <div>${formatearPrecio(subtotal)}</div>
                    <button type="button" class="btn btn-link btn-sm p-0 remove-item" data-id="${producto.id}">Eliminar</button>
                </div>
            `;
            listaCarrito.appendChild(itemLista);

            sumaTotal += subtotal;
            cantidadTotalProductos += producto.cantidad;
        });

        contadorCarrito.textContent = String(cantidadTotalProductos);
        totalCarrito.textContent = `Total: ${formatearPrecio(sumaTotal)}`;
    }

    function agregarAlCarrito(id, nombre, precio) {
        const productoExistente = carrito.find((item) => item.id === id);

        if (productoExistente) {
            productoExistente.cantidad += 1;
        } else {
            carrito.push({
                id,
                nombre,
                precio,
                cantidad: 1,
            });
        }

        renderizarCarrito();
    }

    document.body.addEventListener('click', (evento) => {
        const botonAgregar = evento.target.closest('.add-to-cart');
        if (botonAgregar) {
            const tarjetaProducto = botonAgregar.closest('article') || botonAgregar.closest('.producto');
            if (!tarjetaProducto) return;

            const id = tarjetaProducto.dataset.id;
            const nombre = tarjetaProducto.dataset.name;
            const precio = Number(tarjetaProducto.dataset.price || 0);
            agregarAlCarrito(id, nombre, precio);
            return;
        }

        const botonEliminar = evento.target.closest('.remove-item');
        if (!botonEliminar) return;

        const id = botonEliminar.dataset.id;
        const index = carrito.findIndex((item) => item.id === id);
        if (index !== -1) {
            carrito.splice(index, 1);
            renderizarCarrito();
        }
    });

    if (botonFinalizar) {
        botonFinalizar.addEventListener('click', () => {
            if (carrito.length === 0) {
                alert('El carrito está vacío.');
                return;
            }

            botonFinalizar.classList.add('d-none');
            if (formularioCheckout) {
                formularioCheckout.classList.remove('d-none');
            }
        });
    }

    if (formularioCheckout) {
        formularioCheckout.addEventListener('submit', (evento) => {
            evento.preventDefault();

            const nombre = document.getElementById('cliente-nombre')?.value.trim() || '';
            const horaRecojo = document.getElementById('cliente-hora')?.value.trim() || '';
            const telefono = document.getElementById('cliente-telefono')?.value.trim() || '';

            if (!nombre || !horaRecojo || !telefono) {
                alert('Por favor completa tus datos para continuar.');
                return;
            }

            const detalleCompra = carrito.map((producto) => `• ${producto.nombre} (${producto.cantidad} x ${formatearPrecio(producto.precio)})`).join('\n');
            const totalCompra = carrito.reduce((suma, producto) => suma + producto.precio * producto.cantidad, 0);
            const mensaje = [
                'Hola, quiero programar un pedido para RECOJO EN TIENDA.',
                '',
                detalleCompra,
                '',
                `Total: ${formatearPrecio(totalCompra)}`,
                '',
                `Mi nombre es ${nombre}`,
                `Pasaré a recogerlo a las ${horaRecojo}`,
                `Teléfono: ${telefono}`,
            ].join('\n');

            const numeroLimpio = String(numeroWhatsApp).replace(/\D/g, '');
            const urlWhatsApp = `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
            const ventana = window.open(urlWhatsApp, '_blank', 'noopener,noreferrer');

            if (!ventana) {
                window.location.href = urlWhatsApp;
            }

            carrito.splice(0, carrito.length);
            renderizarCarrito();
        });
    }

    async function guardarPedidoEnBackend() {
        if (!formularioCheckout) return;

        const nombre = document.getElementById('cliente-nombre')?.value.trim() || '';
        const horaRecojo = document.getElementById('cliente-hora')?.value.trim() || '';
        const telefono = document.getElementById('cliente-telefono')?.value.trim() || '';

        if (carrito.length === 0) {
            alert('El carrito está vacío. Agrega productos antes de guardar el pedido.');
            return;
        }

        if (!nombre || !horaRecojo || !telefono) {
            alert('Por favor completa tus datos antes de guardar el pedido.');
            return;
        }

        const pedido = {
            clienteNombre: nombre,
            horaRecojo,
            telefono,
            items: carrito.map((producto) => ({
                id: producto.id,
                nombre: producto.nombre,
                cantidad: producto.cantidad,
                precio: producto.precio,
            })),
            total: carrito.reduce((suma, producto) => suma + producto.precio * producto.cantidad, 0),
            fecha: new Date().toISOString(),
        };

        try {
            const respuesta = await fetch('/api/pedidos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pedido),
            });

            if (!respuesta.ok) {
                throw new Error('No se pudo guardar el pedido en el servidor.');
            }

            alert('Pedido guardado correctamente.');
            formularioCheckout.reset();
        } catch (error) {
            console.error(error);
            alert('Ocurrió un error guardando el pedido. Intenta de nuevo.');
        }
    }

    if (botonGuardarPedido) {
        botonGuardarPedido.addEventListener('click', guardarPedidoEnBackend);
    }

    if (botonAlternarCarrito && contenedorCarrito) {
        botonAlternarCarrito.addEventListener('click', () => {
            const estaAbierto = contenedorCarrito.classList.toggle('open');
            botonAlternarCarrito.setAttribute('aria-expanded', String(estaAbierto));
        });
    }

    function crearTarjetaProducto(producto) {
        const article = document.createElement('article');
        article.className = 'producto producto-dinamico';
        article.setAttribute('data-id', producto.id);
        article.setAttribute('data-name', producto.nombre);
        article.setAttribute('data-price', producto.precio);

        const descuento = Number(producto.descuento) || 0;
        const precioFinal = descuento > 0 ? producto.precio * (1 - descuento / 100) : producto.precio;

        article.innerHTML = `
            <figure class="producto-imagen">
              <img src="${producto.imagen || 'imagenes/defecto.webp'}" alt="${producto.nombre}">
            </figure>
            <h4>${producto.nombre}</h4>
            <p class="precio">S/${precioFinal.toFixed(2)}</p>
            ${descuento > 0 ? `<p class="precio-anterior">Antes S/${producto.precio.toFixed(2)}</p>` : ''}
            <p class="desc">${producto.descripcion || 'Sin descripción'}</p>
            ${descuento > 0 ? `<p class="promo-badge">Oferta ${descuento}%</p>` : ''}
            <button class="add-to-cart">Agregar</button>
        `;

        return article;
    }

    async function cargarProductosDesdeAdmin() {
        const paginaActual = window.location.pathname.split('/').pop().toLowerCase();

        try {
            const respuesta = await fetch('/api/productos');
            if (!respuesta.ok) {
                throw new Error('No se pudieron cargar los productos desde el servidor.');
            }

            const productosDinamicos = await respuesta.json();
            const productos = productosDinamicos.map((prod) => ({
                ...prod,
                categoria: prod.categoria || 'destacado',
                descuento: Number(prod.descuento) || 0,
                precio: Number(prod.precio) || 0,
            }));

            productos.forEach((producto) => {
                if (paginaActual.includes('promociones')) {
                    if (producto.categoria === 'promocion' && contenedorPromociones) {
                        contenedorPromociones.appendChild(crearTarjetaProducto(producto));
                    }
                } else if (paginaActual.includes('productos')) {
                    if (producto.categoria === 'normal' && contenedorNormales) {
                        contenedorNormales.appendChild(crearTarjetaProducto(producto));
                    } else if (producto.categoria === 'destacado' && contenedorDestacados) {
                        contenedorDestacados.appendChild(crearTarjetaProducto(producto));
                    }
                } else if (producto.categoria === 'destacado' && contenedorTienda) {
                    contenedorTienda.appendChild(crearTarjetaProducto(producto));
                }
            });

            if (paginaActual.includes('promociones') && contenedorPromociones && contenedorPromociones.children.length === 0) {
                contenedorPromociones.innerHTML = '<p class="text-muted">No hay promociones activas todavía.</p>';
            }
        } catch (error) {
            console.error(error);
            if (paginaActual.includes('promociones') && contenedorPromociones) {
                contenedorPromociones.innerHTML = '<p class="text-muted">No se pudieron cargar las promociones.</p>';
            }
        }
    }

    cargarProductosDesdeAdmin();
    renderizarCarrito();
});