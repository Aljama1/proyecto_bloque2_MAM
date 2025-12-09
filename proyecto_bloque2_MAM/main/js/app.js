// 1. SELECTORES Y VARIABLES GLOBALES

// Menú y Navegación
const hamburguesa = document.getElementById('hamburguesa');
const menuNav = document.getElementById('menu-nav');
const btnTema = document.getElementById('btn-tema'); // Botón Modo Oscuro
const enlaceBuscar = document.getElementById('enlace-buscar');
const enlaceAleatorio = document.getElementById('enlace-aleatorio');
const enlaceFavoritos = document.getElementById('enlace-favoritos'); // Enlace Favoritos

// Funcionalidad Principal
const entradaBusqueda = document.getElementById('entrada-busqueda');
const botonBuscar = document.getElementById('boton-buscar');
const botonAleatorio = document.getElementById('boton-aleatorio');
const contenedorResultados = document.getElementById('contenedor-resultados');

// Modal (Bootstrap)
const modalElemento = document.getElementById('modalCoctel');
let myModal; 
if (modalElemento) {
    myModal = new bootstrap.Modal(modalElemento);
}

// 2. LÓGICA DEL MENÚ HAMBURGUESA
if (hamburguesa && menuNav) {
    hamburguesa.addEventListener('click', () => {
        hamburguesa.classList.toggle('activo');
        menuNav.classList.toggle('activo');
    });
}

// 3. MODO CLARO / OSCURO

// Al cargar la página, revisar preferencia guardada
if (localStorage.getItem('tema') === 'oscuro') {
    document.body.classList.add('dark-mode');
    if (btnTema) btnTema.textContent = 'Claro';
}

// Boton para cambiar el tema
if (btnTema) {
    btnTema.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const esOscuro = document.body.classList.contains('dark-mode');
        btnTema.textContent = esOscuro ? 'Claro' : 'Oscuro';
        localStorage.setItem('tema', esOscuro ? 'oscuro' : 'claro');
    });
}

// 4. FUNCIONES DE LA API (Buscar y Aleatorio)

async function buscarCocteles() {
    const termino = entradaBusqueda.value.trim();
    if (termino === "") {
        alert("Por favor, escribe el nombre de un cóctel.");
        return;
    }
    mostrarCargando(); // Skeleton Loader
    try {
        const respuesta = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${termino}`);
        const datos = await respuesta.json();
        renderizarResultados(datos.drinks);
    } catch (error) {
        console.error(error);
        mostrarError("Error de conexión. Inténtalo de nuevo.");
    }
}

async function obtenerAleatorio() {
    mostrarCargando(); // Skeleton Loader
    try {
        const respuesta = await fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php');
        const datos = await respuesta.json();
        renderizarResultados(datos.drinks);
    } catch (error) {
        console.error(error);
        mostrarError("No se pudo obtener el cóctel aleatorio.");
    }
}

async function verDetalles(id) {
    try {
        const respuesta = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${id}`);
        const datos = await respuesta.json();
        llenarYMostrarModal(datos.drinks[0]);
    } catch (error) {
        console.error(error);
        alert("Error al cargar detalles.");
    }
}

// 5. FUNCIONES VISUALES

// Muestra el Skeleton Loader (Cajas grises animadas)
function mostrarCargando() {
    let skeletonHTML = "";
    for (let i = 0; i < 3; i++) {
        skeletonHTML += `
            <div class="col-md-4 col-sm-6 mb-4">
                <div class="card h-100 shadow-sm">
                    <div class="skeleton" style="height: 250px; width: 100%;"></div>
                    <div class="card-body">
                        <div class="skeleton" style="height: 25px; width: 70%; margin-bottom: 15px;"></div>
                        <div class="skeleton" style="height: 15px; width: 40%; margin-bottom: 30px;"></div>
                        <div class="skeleton" style="height: 35px; width: 100%; border-radius: 5px;"></div>
                    </div>
                </div>
            </div>`;
    }
    contenedorResultados.innerHTML = skeletonHTML;
}

// Muestra un error de Bootstrap
function mostrarError(mensaje) {
    contenedorResultados.innerHTML = `
        <div class="col-12 my-4">
            <div class="alert alert-danger">${mensaje}</div>
        </div>`;
}

// Pinta las tarjetas REALES (con Favoritos)
function renderizarResultados(cocteles) {
    contenedorResultados.innerHTML = ""; 

    if (!cocteles || cocteles.length === 0) {
        contenedorResultados.innerHTML = `
            <div class="col-12"><div class="alert alert-warning text-center">No hay resultados.</div></div>`;
        return;
    }

    // Leemos favoritos para saber cuál marcar en rojo
    const favoritosGuardados = JSON.parse(localStorage.getItem('favoritos')) || [];

    cocteles.forEach(coctel => {
        // Comprobamos si es favorito
        const esFav = favoritosGuardados.some(fav => fav.idDrink === coctel.idDrink);
        const claseCorazon = esFav ? 'es-favorito' : '';

        const div = document.createElement('div');
        div.className = "col-md-4 col-sm-6 mb-4";
        div.innerHTML = `
            <div class="card h-100 shadow-sm tarjeta-coctel">
                <div class="position-relative">
                    <img src="${coctel.strDrinkThumb}" class="card-img-top" alt="${coctel.strDrink}">
                    <button class="btn-favorito ${claseCorazon} position-absolute top-0 end-0 m-2 p-2 bg-white rounded-circle shadow-sm" 
                            data-id="${coctel.idDrink}" title="Añadir a favoritos">♥</button>
                </div>
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${coctel.strDrink}</h5>
                    <p class="card-text text-muted">${coctel.strCategory}</p>
                    <div class="mt-auto">
                        <button class="btn btn-primary w-100 btn-detalle" data-id="${coctel.idDrink}">Ver más</button>
                    </div>
                </div>
            </div>`;
        contenedorResultados.appendChild(div);
    });

    // Eventos para botones creados dinámicamente
    document.querySelectorAll('.btn-detalle').forEach(btn => {
        btn.addEventListener('click', (e) => verDetalles(e.target.dataset.id));
    });

    document.querySelectorAll('.btn-favorito').forEach(btn => {
        btn.addEventListener('click', (e) => {
            
            // Buscamos el objeto completo en el array actual
            const coctelData = cocteles.find(c => c.idDrink === e.target.dataset.id);
            toggleFavorito(coctelData, e.target);
        });
    });
}

// Rellena el Modal con detalles e ingredientes
function llenarYMostrarModal(coctel) {
    document.getElementById('titulo-modal').innerText = coctel.strDrink;
    document.getElementById('img-modal').src = coctel.strDrinkThumb;
    document.getElementById('categoria-modal').innerText = coctel.strCategory;
    document.getElementById('alcohol-modal').innerText = coctel.strAlcoholic;
    document.getElementById('instrucciones-modal').innerText = coctel.strInstructions;

    const lista = document.getElementById('lista-ingredientes');
    lista.innerHTML = "";

    for (let i = 1; i <= 15; i++) {
        const ing = coctel[`strIngredient${i}`];
        const med = coctel[`strMeasure${i}`];
        if (ing) {
            const li = document.createElement('li');
            li.className = "list-group-item";
            li.textContent = med ? `${med} - ${ing}` : ing;
            lista.appendChild(li);
        } else break;
    }
    if (myModal) myModal.show();
}

// 6. LÓGICA DE FAVORITOS (Guardar/Borrar)

function toggleFavorito(coctel, btnElemento) {
    let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
    const index = favoritos.findIndex(item => item.idDrink === coctel.idDrink);

    if (index > -1) {
        // Borrar
        favoritos.splice(index, 1);
        btnElemento.classList.remove('es-favorito');
        
        

    } else {
        // Guardar
        const nuevoFavorito = {
            idDrink: coctel.idDrink,
            strDrink: coctel.strDrink,
            strDrinkThumb: coctel.strDrinkThumb,
            strCategory: coctel.strCategory
        };
        favoritos.push(nuevoFavorito);
        btnElemento.classList.add('es-favorito');
    }
    localStorage.setItem('favoritos', JSON.stringify(favoritos));
}

function mostrarFavoritos() {
    const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
    
    if (favoritos.length === 0) {
        contenedorResultados.innerHTML = `
            <div class="col-12 text-center mt-5">
                <h3>No tienes favoritos aún</h3>
                <p class="text-muted">Dale al corazón en los cócteles que más te gusten.</p>
            </div>`;
    } else {
        renderizarResultados(favoritos);
        const titulo = document.createElement('div');
        titulo.className = "col-12 mb-3";
        titulo.innerHTML = `<h3 class="text-center text-primary">Tus Cócteles Favoritos (${favoritos.length})</h3>`;
        contenedorResultados.prepend(titulo);
    }
}

// 7. EVENT LISTENERS (Clicks)


if (botonBuscar) botonBuscar.addEventListener('click', buscarCocteles);

if (entradaBusqueda) {
    entradaBusqueda.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarCocteles();
    });
}

if (botonAleatorio) botonAleatorio.addEventListener('click', obtenerAleatorio);

// Enlace "Buscar" del menú
if (enlaceBuscar) {
    enlaceBuscar.addEventListener('click', () => {
        if (menuNav.classList.contains('activo')) hamburguesa.click();
        entradaBusqueda.focus();
    });
}

// Enlace "Aleatorio" del menú
if (enlaceAleatorio) {
    enlaceAleatorio.addEventListener('click', (e) => {
        e.preventDefault();
        if (menuNav.classList.contains('activo')) hamburguesa.click();
        obtenerAleatorio();
    });
}

if (enlaceFavoritos) {
    enlaceFavoritos.addEventListener('click', (e) => {
        e.preventDefault(); // Evita recarga
        mostrarFavoritos();
        if (menuNav.classList.contains('activo')) {
            hamburguesa.click();
        }
    });
}