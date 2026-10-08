import "./style.css";
import { ListaDoble } from "./ListaDoble";
import type { Cancion } from "./types";

const $ = (id: string): HTMLElement => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`No existe #${id}`);
  return el;
};
const $btn = (id: string) => $(id) as HTMLButtonElement;
const $inp = (id: string) => $(id) as HTMLInputElement;
const $sel = (id: string) => $(id) as HTMLSelectElement;
const $frm = (id: string) => $(id) as HTMLFormElement;

const hashDe = (t: string): number => {
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
  return Math.abs(h);
};
const fmtTiempo = (s: number) =>
  !isFinite(s) || s < 0 ? "0:00" : `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
const imagenPara = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/400/400`;

const ICONO_PLAY = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>`;
const ICONO_PAUSA = `<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>`;
const ICONO_MAS = `<svg viewBox="0 0 24 24"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" fill="currentColor"/></svg>`;
const ICONO_CHECK = `<svg viewBox="0 0 24 24"><path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

interface ItemCat {
  id: string;
  titulo: string;
  artista: string;
  album: string;
  preview?: string;
  cover?: string;
}

const CATALOGO: ItemCat[] = [
  { id: "cat-01", titulo: "Amanecer en Pasto", artista: "Los Andinos", album: "Raíces" },
  { id: "cat-02", titulo: "Brisa de Lavanda", artista: "Cielo Claro", album: "Cielo Abierto" },
  { id: "cat-03", titulo: "Nodo a Nodo", artista: "Punteros", album: "Compilar" },
  { id: "cat-04", titulo: "Madrugada", artista: "Luna Violeta", album: "Madrugada" },
  { id: "cat-05", titulo: "Raíces", artista: "Los Andinos", album: "Raíces" },
  { id: "cat-06", titulo: "Cielo Abierto", artista: "Cielo Claro", album: "Cielo Abierto" },
  { id: "cat-07", titulo: "Compilar", artista: "Punteros", album: "Compilar" },
  { id: "cat-08", titulo: "Asfalto", artista: "Eco Urbano", album: "Asfalto" },
  { id: "cat-09", titulo: "Pleamar", artista: "Marea Alta", album: "Pleamar" },
  { id: "cat-10", titulo: "Neblina", artista: "Neblina", album: "Azul Eléctrico" },
  { id: "cat-11", titulo: "Vals del Sur", artista: "Valle Sonoro", album: "Selva" },
  { id: "cat-12", titulo: "Costa Dorada", artista: "Marea Alta", album: "Pleamar" },
  { id: "cat-13", titulo: "Cinta Negra", artista: "Eco Urbano", album: "Asfalto" },
  { id: "cat-14", titulo: "Noche Estrellada", artista: "Luna Violeta", album: "Madrugada" },
  { id: "cat-15", titulo: "Instrucciones", artista: "Punteros", album: "Compilar" },
  { id: "cat-16", titulo: "Cielo Gris", artista: "Cielo Claro", album: "Cielo Abierto" },
  { id: "cat-17", titulo: "Camino al Mar", artista: "Marea Alta", album: "Pleamar" },
  { id: "cat-18", titulo: "Selva", artista: "Valle Sonoro", album: "Selva" },
  { id: "cat-19", titulo: "Rutina", artista: "Eco Urbano", album: "Asfalto" },
  { id: "cat-20", titulo: "Azul Eléctrico", artista: "Neblina", album: "Azul Eléctrico" },
];

const usuarioCat: ItemCat[] = [];
const catalogoCompleto = (): ItemCat[] => [...CATALOGO, ...usuarioCat];

const audioUrls = new Map<string, string>();
const coverUrls = new Map<string, string>();

function artistasDelCatalogo(): string[] {
  return [...new Set(catalogoCompleto().map((c) => c.artista))].sort((a, b) => a.localeCompare(b, "es"));
}
function albumesDelCatalogo(): { album: string; artista: string; id: string }[] {
  const mapa = new Map<string, { album: string; artista: string; id: string }>();
  for (const c of catalogoCompleto()) {
    const clave = `${c.album}::${c.artista}`;
    if (!mapa.has(clave)) mapa.set(clave, { album: c.album, artista: c.artista, id: "al-" + hashDe(clave) });
  }
  return [...mapa.values()];
}

interface Playlist {
  id: string;
  nombre: string;
  lista: ListaDoble<Cancion>;
}

const playlists: Playlist[] = [];
const playlistInicial: Playlist = { id: "pl-default", nombre: "Mi playlist", lista: new ListaDoble<Cancion>() };
playlists.push(playlistInicial);

let playlistActivaId: string = playlistInicial.id;
let lista: ListaDoble<Cancion> = playlistInicial.lista;
const seleccionadas = new Set<string>();

function getPlaylistActiva(): Playlist {
  return playlists.find((p) => p.id === playlistActivaId) ?? playlists[0];
}
function getPlaylistPorId(id: string): Playlist | undefined {
  return playlists.find((p) => p.id === id);
}
function crearPlaylist(nombre: string): void {
  const p: Playlist = {
    id: `pl-${Date.now()}`,
    nombre: nombre.trim() || `Playlist ${playlists.length + 1}`,
    lista: new ListaDoble<Cancion>(),
  };
  playlists.push(p);
  cambiarPlaylist(p.id);
}

let pausado = true;
let toastTimer: number | null = null;
let duracionActual = 0;

const audio = $("audio-player") as HTMLAudioElement;
const inputBuscar = $inp("input-buscar");
const resultados = $("resultados");
const contador = $("contador");
const contadorHome = $("contador-home");
const ulLista = $("lista");
const vacio = $("vacio");
const tituloPlaylistActiva = $("titulo-playlist-activa");
const vistaHome = $("vista-home");
const vistaPlaylist = $("vista-playlist");
const carruselArtistas = $("carrusel-artistas");
const carruselAlbumes = $("carrusel-albumes");
const listaCatalogo = $("lista-catalogo");
const sidebarPlaylists = $("sidebar-playlists");
const btnCrearPlaylist = $btn("btn-crear-playlist");
const navHome = $btn("nav-home");
const toolbarSeleccion = $("toolbar-seleccion");
const contadorSeleccion = $("contador-seleccion");
const btnEliminarSeleccion = $btn("btn-eliminar-seleccion");
const btnCancelarSeleccion = $btn("btn-cancelar-seleccion");
const toast = $("toast");
const pickerPlaylist = $("picker-playlist");
const miniFill = $("mini-fill");
const miniInfo = $btn("mini-info");
const miniCover = $("mini-cover");
const miniTitulo = $("mini-titulo");
const miniArtista = $("mini-artista");
const miniPrev = $btn("mini-prev");
const miniPlay = $btn("mini-play");
const miniNext = $btn("mini-next");
const np = $("np");
const npCerrar = $btn("np-cerrar");
const npCover = $("np-cover");
const npTitulo = $("np-titulo");
const npArtista = $("np-artista");
const npFill = $("np-fill");
const npActual = $("np-t-actual");
const npTotal = $("np-t-total");
const npPrev = $btn("np-prev");
const npPlay = $btn("np-play");
const npNext = $btn("np-next");
const npLetras = $("np-letras");
const modalAgregar = $("modal-agregar");
const btnAbrirAgregar = $btn("btn-abrir-agregar");
const btnCerrarAgregar = $btn("btn-cerrar-agregar");
const form = $frm("form-cancion");
const inputTitulo = $inp("input-titulo");
const inputArtista = $inp("input-artista");
const selectPlaylistModal = $sel("select-playlist");
const selectModo = $sel("select-modo");
const grupoPosicion = $("grupo-posicion");
const inputPosicion = $inp("input-posicion");
const mensaje = $("mensaje");
const modalPlaylist = $("modal-playlist");
const btnCerrarPlaylist = $btn("btn-cerrar-playlist");
const formPlaylist = $frm("form-playlist");
const inputNombrePlaylist = $inp("input-nombre-playlist");
const mensajePlaylist = $("mensaje-playlist");

function mostrarToast(texto: string): void {
  toast.innerHTML = `<span style="display:grid;place-items:center;width:18px;height:18px;color:#8be8a8">${ICONO_CHECK}</span><span></span>`;
  (toast.querySelectorAll("span")[1] as HTMLElement).textContent = texto;
  toast.classList.add("visible");
  if (toastTimer !== null) clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2200);
}

function cerrarPicker(): void {
  pickerPlaylist.hidden = true;
  pickerPlaylist.replaceChildren();
}

function abrirPickerPlaylist(x: number, y: number, onSelect: (playlistId: string) => void): void {
  pickerPlaylist.replaceChildren();
  const titulo = document.createElement("div");
  titulo.className = "picker-titulo";
  titulo.textContent = "Agregar a...";
  pickerPlaylist.appendChild(titulo);
  for (const p of playlists) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "picker-item" + (p.id === playlistActivaId ? " activo" : "");
    btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13M6 21a3 3 0 100-6 3 3 0 000 6zm12-2a3 3 0 100-6 3 3 0 000 6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg><span></span>`;
    (btn.querySelector("span") as HTMLElement).textContent = p.nombre;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      cerrarPicker();
      onSelect(p.id);
    });
    pickerPlaylist.appendChild(btn);
  }
  const crearBtn = document.createElement("button");
  crearBtn.type = "button";
  crearBtn.className = "picker-add";
  crearBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" fill="currentColor"/></svg> Nueva playlist...`;
  crearBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    cerrarPicker();
    abrirModalPlaylist();
  });
  pickerPlaylist.appendChild(crearBtn);
  const rect = pickerPlaylist.getBoundingClientRect();
  const ancho = 220;
  const alto = rect.height || 200;
  pickerPlaylist.style.left = Math.min(x, window.innerWidth - ancho - 12) + "px";
  pickerPlaylist.style.top = Math.min(y, window.innerHeight - alto - 12) + "px";
  pickerPlaylist.hidden = false;
}

document.addEventListener("click", (e) => {
  const t = e.target as HTMLElement;
  if (!t.closest(".picker-playlist") && !t.closest("[data-picker-trigger]")) cerrarPicker();
});

let contadorUsuario = 0;

function crearCancionUsuario(titulo: string, artista: string): Cancion {
  contadorUsuario++;
  return { id: `u${contadorUsuario}-${Date.now()}`, titulo, artista };
}

function cancionDesdeItem(item: ItemCat): Cancion {
  const id = item.id + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
  if (item.preview) audioUrls.set(id, item.preview);
  if (item.cover) coverUrls.set(id, item.cover);
  return { id, titulo: item.titulo, artista: item.artista };
}

function renderSinHome(): void {
  renderPlaylist();
  renderSidebarPlaylists();
}

function agregarItem(item: ItemCat, playlistId?: string, silent = false): void {
  const p = playlistId ? getPlaylistPorId(playlistId) : getPlaylistActiva();
  if (!p) return;
  p.lista.agregarAlFinal(cancionDesdeItem(item));
  if (!silent) mostrarToast(`"${item.titulo}" → ${p.nombre}`);
  renderSinHome();
}

function agregarArtista(nombreArtista: string, playlistId?: string): void {
  const p = playlistId ? getPlaylistPorId(playlistId) : getPlaylistActiva();
  if (!p) return;
  const canciones = catalogoCompleto().filter((c) => c.artista === nombreArtista);
  for (const c of canciones) p.lista.agregarAlFinal(cancionDesdeItem(c));
  mostrarToast(`${canciones.length} de ${nombreArtista} → ${p.nombre}`);
  renderSinHome();
}

function agregarAlbum(album: string, artista: string, playlistId?: string): void {
  const p = playlistId ? getPlaylistPorId(playlistId) : getPlaylistActiva();
  if (!p) return;
  const canciones = catalogoCompleto().filter((c) => c.album === album && c.artista === artista);
  for (const c of canciones) p.lista.agregarAlFinal(cancionDesdeItem(c));
  mostrarToast(`Álbum "${album}" → ${p.nombre} (${canciones.length})`);
  renderSinHome();
}

function moverCancion(id: string, delta: -1 | 1): void {
  const idActual = lista.current?.data.id ?? null;
  let index = -1;
  let cancion: Cancion | null = null;
  lista.recorrer((c, i) => { if (c.id === id) { index = i; cancion = c; } });
  if (index === -1 || cancion === null) return;
  const destino = index + delta;
  if (destino < 0 || destino >= lista.size) return;
  lista.eliminarCancion(id);
  lista.agregarEnPosicion(destino, cancion);
  if (idActual !== null) lista.seleccionar(idActual);
  renderPlaylist();
}

function toggleSeleccion(id: string): void {
  if (seleccionadas.has(id)) seleccionadas.delete(id);
  else seleccionadas.add(id);
  renderPlaylist();
}
function limpiarSeleccion(): void {
  if (seleccionadas.size === 0) return;
  seleccionadas.clear();
  renderPlaylist();
}
function eliminarSeleccionadas(): void {
  if (seleccionadas.size === 0) return;
  const total = seleccionadas.size;
  for (const id of [...seleccionadas]) lista.eliminarCancion(id);
  seleccionadas.clear();
  mostrarToast(`${total} canción(es) eliminada(s)`);
  renderSinHome();
}
btnEliminarSeleccion.addEventListener("click", eliminarSeleccionadas);
btnCancelarSeleccion.addEventListener("click", limpiarSeleccion);

function mostrarHome(): void {
  vistaHome.classList.add("activa");
  vistaPlaylist.classList.remove("activa");
  navHome.classList.add("activo");
  renderSidebarPlaylists();
}
function mostrarPlaylist(): void {
  vistaHome.classList.remove("activa");
  vistaPlaylist.classList.add("activa");
  navHome.classList.remove("activo");
  renderSidebarPlaylists();
}
function cambiarPlaylist(id: string): void {
  playlistActivaId = id;
  lista = getPlaylistActiva().lista;
  seleccionadas.clear();
  pausado = true;
  audio.pause();
  cerrarNowPlaying();
  render();
  mostrarPlaylist();
}

function renderSidebarPlaylists(): void {
  sidebarPlaylists.replaceChildren();
  for (const p of playlists) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sidebar-item" + (p.id === playlistActivaId && vistaPlaylist.classList.contains("activa") ? " activo" : "");
    btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13M6 21a3 3 0 100-6 3 3 0 000 6zm12-2a3 3 0 100-6 3 3 0 000 6z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg><span></span>`;
    (btn.querySelector("span") as HTMLElement).textContent = p.nombre;
    btn.addEventListener("click", () => cambiarPlaylist(p.id));
    li.appendChild(btn);
    sidebarPlaylists.appendChild(li);
  }
}

function botonAgregar(onOpenPicker: (x: number, y: number, done: () => void) => void): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "card-add";
  b.dataset.pickerTrigger = "1";
  b.innerHTML = ICONO_MAS;
  b.title = "Agregar a playlist...";
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    const rect = b.getBoundingClientRect();
    onOpenPicker(rect.right + 8, rect.top, () => {
      b.innerHTML = ICONO_CHECK;
      b.classList.add("agregado");
      b.disabled = true;
    });
  });
  return b;
}

function renderHome(): void {
  // Artistas con carátula girando
  carruselArtistas.replaceChildren();
  for (const a of artistasDelCatalogo()) {
    const card = document.createElement("div");
    card.className = "card-artista";
    const wrap = document.createElement("div");
    wrap.className = "estrella-wrap";
    const img = document.createElement("img");
    img.src = imagenPara("art-" + a);
    img.alt = a;
    img.loading = "lazy";
    wrap.appendChild(img);
    const nombre = document.createElement("div");
    nombre.className = "nombre";
    nombre.textContent = a;
    card.append(wrap, nombre);
    card.addEventListener("click", () => agregarArtista(a));
    carruselArtistas.appendChild(card);
  }

  // Álbumes
  carruselAlbumes.replaceChildren();
  for (const al of albumesDelCatalogo()) {
    const card = document.createElement("div");
    card.className = "card-album";
    const img = document.createElement("div");
    img.className = "imagen";
    img.style.position = "relative";
    img.style.backgroundImage = `url("${imagenPara("alb-" + al.album + "-" + al.artista)}")`;
    const titulo = document.createElement("div");
    titulo.className = "titulo";
    titulo.textContent = al.album;
    const sub = document.createElement("div");
    sub.className = "sub";
    sub.textContent = al.artista;
    const btnAdd = botonAgregar((x, y, done) =>
      abrirPickerPlaylist(x, y, (plId) => { agregarAlbum(al.album, al.artista, plId); done(); })
    );
    img.appendChild(btnAdd);
    card.append(img, titulo, sub);
    carruselAlbumes.appendChild(card);
  }

  // Canciones
  listaCatalogo.replaceChildren();
  const canciones = catalogoCompleto();
  contadorHome.textContent = `${canciones.length} canciones disponibles`;
  for (const item of canciones.slice(0, 10)) {
    const li = document.createElement("li");
    li.className = "item";
    li.style.gridTemplateColumns = "1fr auto";
    const info = document.createElement("button");
    info.type = "button";
    info.className = "item-info";
    const cover = document.createElement("div");
    cover.className = "cover";
    cover.style.backgroundImage = `url("${imagenPara("sng-" + item.titulo + "-" + item.artista)}")`;
    const textos = document.createElement("div");
    textos.className = "textos";
    const t = document.createElement("strong");
    t.textContent = item.titulo;
    const a = document.createElement("small");
    a.textContent = item.artista + " · " + item.album;
    textos.append(t, a);
    info.append(cover, textos);
    const acciones = document.createElement("div");
    acciones.className = "item-acciones";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ctrl-mini agregar";
    btn.dataset.pickerTrigger = "1";
    btn.title = "Agregar a playlist...";
    btn.innerHTML = ICONO_MAS;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const rect = btn.getBoundingClientRect();
      abrirPickerPlaylist(rect.right + 8, rect.top, (plId) => {
        agregarItem(item, plId);
        btn.innerHTML = ICONO_CHECK;
        btn.classList.add("agregado");
        btn.disabled = true;
      });
    });
    acciones.appendChild(btn);
    li.append(info, acciones);
    listaCatalogo.appendChild(li);
  }
}

function renderPlaylist(): void {
  const p = getPlaylistActiva();
  tituloPlaylistActiva.textContent = p.nombre;
  contador.textContent = lista.size > 0 ? `${lista.size} canción(es)` : "";
  if (seleccionadas.size > 0) {
    toolbarSeleccion.hidden = false;
    contadorSeleccion.textContent = `${seleccionadas.size} seleccionada${seleccionadas.size !== 1 ? "s" : ""}`;
  } else {
    toolbarSeleccion.hidden = true;
  }
  ulLista.replaceChildren();
  vacio.hidden = lista.size > 0;

  lista.recorrer((cancion, index, esActual) => {
    const estaSeleccionada = seleccionadas.has(cancion.id);
    const li = document.createElement("li");
    li.className = "item" + (esActual ? " activo" : "") + (estaSeleccionada ? " seleccionado" : "");

    const check = document.createElement("button");
    check.type = "button";
    check.className = "item-check";
    if (estaSeleccionada) check.innerHTML = ICONO_CHECK;
    else check.textContent = String(index + 1);
    check.addEventListener("click", (e) => { e.stopPropagation(); toggleSeleccion(cancion.id); });

    const info = document.createElement("button");
    info.type = "button";
    info.className = "item-info";
    const cover = document.createElement("div");
    cover.className = "cover";
    const coverCustom = coverUrls.get(cancion.id);
    if (coverCustom) cover.style.backgroundImage = `url("${coverCustom}")`;
    else cover.style.backgroundImage = `url("${imagenPara("sng-" + cancion.titulo + "-" + cancion.artista)}")`;
    const textos = document.createElement("div");
    textos.className = "textos";
    const t = document.createElement("strong");
    t.textContent = cancion.titulo;
    const a = document.createElement("small");
    a.textContent = cancion.artista;
    textos.append(t, a);
    info.append(cover, textos);
    info.addEventListener("click", () => {
      lista.seleccionar(cancion.id);
      abrirNowPlaying();
    });

    const acciones = document.createElement("div");
    acciones.className = "item-acciones";
    const btnUp = document.createElement("button");
    btnUp.type = "button";
    btnUp.className = "ctrl-mini";
    btnUp.title = "Subir";
    btnUp.disabled = index === 0;
    btnUp.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 5l7 8h-4v6h-6v-6H5z" fill="currentColor"/></svg>`;
    btnUp.addEventListener("click", (e) => { e.stopPropagation(); moverCancion(cancion.id, -1); });

    const btnDown = document.createElement("button");
    btnDown.type = "button";
    btnDown.className = "ctrl-mini";
    btnDown.title = "Bajar";
    btnDown.disabled = index === lista.size - 1;
    btnDown.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 19l-7-8h4V5h6v6h4z" fill="currentColor"/></svg>`;
    btnDown.addEventListener("click", (e) => { e.stopPropagation(); moverCancion(cancion.id, 1); });

    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.className = "ctrl-mini peligro";
    btnDel.title = "Eliminar";
    btnDel.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 7h12l-1 13H7L6 7zm3-3h6l1 1H8l1-1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`;
    btnDel.addEventListener("click", (e) => {
      e.stopPropagation();
      lista.eliminarCancion(cancion.id);
      seleccionadas.delete(cancion.id);
      renderSinHome();
    });

    acciones.append(btnUp, btnDown, btnDel);
    li.append(check, info, acciones);
    ulLista.appendChild(li);
  });

  actualizarReproductor();
}

function render(): void {
  renderPlaylist();
  renderHome();
  renderSidebarPlaylists();
}

function urlAudioLocal(titulo: string, artista: string): string {
  const n = (hashDe(titulo + "::" + artista) % 17) + 1;
  return `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${n}.mp3`;
}

function urlAudioDe(cancion: Cancion): string {
  return audioUrls.get(cancion.id) ?? urlAudioLocal(cancion.titulo, cancion.artista);
}

audio.addEventListener("timeupdate", () => {
  const dur = audio.duration || duracionActual;
  if (dur > 0) {
    const pct = (audio.currentTime / dur) * 100;
    miniFill.style.width = pct + "%";
    npFill.style.width = pct + "%";
    npActual.textContent = fmtTiempo(audio.currentTime);
    npTotal.textContent = fmtTiempo(dur);
  }
});

audio.addEventListener("loadedmetadata", () => {
  duracionActual = audio.duration;
  npTotal.textContent = fmtTiempo(audio.duration);
});

audio.addEventListener("ended", () => {
  const sig = lista.siguiente();
  if (sig) {
    if (lista.current) void cargarLetras(lista.current.data);
    cargarYReproducir();
    renderPlaylist();
  } else {
    pausado = true;
    actualizarReproductor();
  }
});

audio.addEventListener("play", () => { pausado = false; actualizarReproductor(); });
audio.addEventListener("pause", () => { pausado = true; actualizarReproductor(); });

function cargarYReproducir(): void {
  const actual = lista.current?.data;
  if (!actual) return;
  audio.src = urlAudioDe(actual);
  audio.currentTime = 0;
  audio.play().catch((err) => {
    console.warn("No se pudo reproducir:", err);
    pausado = true;
    actualizarReproductor();
  });
}

function actualizarReproductor(): void {
  const actual = lista.current?.data ?? null;
  if (actual) {
    miniTitulo.textContent = actual.titulo;
    miniArtista.textContent = actual.artista;
    const coverCustom = coverUrls.get(actual.id);
    miniCover.style.backgroundImage = coverCustom
      ? `url("${coverCustom}")`
      : `url("${imagenPara("sng-" + actual.titulo + "-" + actual.artista)}")`;
  } else {
    miniTitulo.textContent = "Nada sonando";
    miniArtista.textContent = "—";
    miniCover.style.backgroundImage = "none";
    miniCover.style.background = "var(--borde)";
  }
  miniPlay.innerHTML = pausado ? ICONO_PLAY : ICONO_PAUSA;
  npPlay.innerHTML = pausado ? ICONO_PLAY : ICONO_PAUSA;
  miniPrev.disabled = !lista.tieneAnterior();
  miniNext.disabled = !lista.tieneSiguiente();
  npPrev.disabled = !lista.tieneAnterior();
  npNext.disabled = !lista.tieneSiguiente();
  if (actual) {
    npTitulo.textContent = actual.titulo;
    npArtista.textContent = actual.artista;
    const coverCustom = coverUrls.get(actual.id);
    npCover.style.backgroundImage = coverCustom
      ? `url("${coverCustom}")`
      : `url("${imagenPara("sng-" + actual.titulo + "-" + actual.artista)}")`;
  } else {
    npTitulo.textContent = "—";
    npArtista.textContent = "—";
    npCover.style.backgroundImage = "none";
    npCover.style.background = "var(--borde)";
    npFill.style.width = "0%";
    miniFill.style.width = "0%";
    npActual.textContent = "0:00";
    npTotal.textContent = "0:00";
  }
}

async function cargarLetras(cancion: Cancion): Promise<void> {
  npLetras.replaceChildren();
  const cargando = document.createElement("p");
  cargando.textContent = "Buscando letra...";
  npLetras.appendChild(cargando);

  const esOnline = audioUrls.has(cancion.id);
  if (!esOnline) {
    npLetras.replaceChildren();
    const empty = document.createElement("p");
    empty.textContent = "Letra no disponible para esta canción.";
    npLetras.appendChild(empty);
    return;
  }

  try {
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(cancion.artista)}/${encodeURIComponent(cancion.titulo)}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Sin letra");
    const data = (await resp.json()) as { lyrics?: string };
    const texto = (data.lyrics || "").trim();
    if (!texto) throw new Error("Sin letra");
    const limpio = texto.replace(/^.*?Paroles.*?\n/i, "").trim();
    npLetras.replaceChildren();
    for (const linea of limpio.split("\n")) {
      const p = document.createElement("p");
      p.textContent = linea || "\u00A0";
      npLetras.appendChild(p);
    }
  } catch {
    npLetras.replaceChildren();
    const empty = document.createElement("p");
    empty.textContent = "No se encontró la letra de esta canción.";
    npLetras.appendChild(empty);
  }
}

function abrirNowPlaying(): void {
  const actual = lista.current?.data;
  if (!actual) return;
  void cargarLetras(actual);
  np.classList.add("abierto");
  np.setAttribute("aria-hidden", "false");
  actualizarReproductor();
  const url = urlAudioDe(actual);
  if (!audio.src || audio.src.indexOf(url) === -1) cargarYReproducir();
  else if (audio.paused && !pausado) audio.play().catch(() => {});
}
function cerrarNowPlaying(): void {
  np.classList.remove("abierto");
  np.setAttribute("aria-hidden", "true");
}

function accionSiguiente(): void {
  lista.siguiente();
  if (lista.current) void cargarLetras(lista.current.data);
  cargarYReproducir();
  renderPlaylist();
}
function accionAnterior(): void {
  lista.anterior();
  if (lista.current) void cargarLetras(lista.current.data);
  cargarYReproducir();
  renderPlaylist();
}
function togglePausa(): void {
  if (!audio.src) {
    const actual = lista.current?.data;
    if (actual) cargarYReproducir();
    return;
  }
  if (audio.paused) audio.play().catch(() => {});
  else audio.pause();
}

miniNext.addEventListener("click", accionSiguiente);
miniPrev.addEventListener("click", accionAnterior);
miniPlay.addEventListener("click", togglePausa);
npNext.addEventListener("click", accionSiguiente);
npPrev.addEventListener("click", accionAnterior);
npPlay.addEventListener("click", togglePausa);
miniInfo.addEventListener("click", abrirNowPlaying);
npCerrar.addEventListener("click", cerrarNowPlaying);

interface ResultadoOnline {
  id: string;
  titulo: string;
  artista: string;
  album: string;
  preview?: string;
  cover?: string;
}

let busquedaTimer: number | null = null;
let ultimaQuery = "";

interface iTunesResult {
  trackId: number;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  previewUrl?: string;
  artworkUrl100?: string;
}

async function buscarEnItunes(q: string): Promise<ResultadoOnline[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=15&media=music`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Error en la búsqueda");
  const data = (await resp.json()) as { results?: iTunesResult[] };
  return (data.results ?? []).map((r) => ({
    id: `it-${r.trackId}`,
    titulo: r.trackName || "Sin título",
    artista: r.artistName || "Desconocido",
    album: r.collectionName || "—",
    preview: r.previewUrl,
    cover: r.artworkUrl100 ? r.artworkUrl100.replace("100x100", "300x300") : undefined,
  }));
}

function filaCatalogo(item: ItemCat): HTMLElement {
  const row = document.createElement("div");
  row.className = "res-item";
  const cover = document.createElement("div");
  cover.className = "res-cover";
  cover.style.backgroundImage = `url("${imagenPara("sng-" + item.titulo + "-" + item.artista)}")`;
  const textos = document.createElement("div");
  textos.className = "res-textos";
  const strong = document.createElement("strong");
  strong.textContent = item.titulo;
  const small = document.createElement("small");
  small.textContent = item.artista + " · " + item.album;
  textos.append(strong, small);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "res-add";
  btn.dataset.pickerTrigger = "1";
  btn.innerHTML = ICONO_MAS;
  btn.title = "Agregar a playlist...";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const rect = btn.getBoundingClientRect();
    abrirPickerPlaylist(rect.right + 8, rect.top, (plId) => {
      agregarItem(item, plId);
      btn.innerHTML = ICONO_CHECK;
      btn.classList.add("agregado");
      btn.disabled = true;
    });
  });
  row.append(cover, textos, btn);
  return row;
}

function filaArtista(artista: string): HTMLElement {
  const row = document.createElement("div");
  row.className = "res-item";
  const cover = document.createElement("div");
  cover.className = "res-cover artista-cover";
  cover.style.backgroundImage = `url("${imagenPara("art-" + artista)}")`;
  const textos = document.createElement("div");
  textos.className = "res-textos";
  const strong = document.createElement("strong");
  strong.textContent = artista;
  const small = document.createElement("small");
  const cuenta = catalogoCompleto().filter((c) => c.artista === artista).length;
  small.textContent = `${cuenta} canción(es)`;
  textos.append(strong, small);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "res-add";
  btn.dataset.pickerTrigger = "1";
  btn.innerHTML = ICONO_MAS;
  btn.title = "Agregar a playlist...";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const rect = btn.getBoundingClientRect();
    abrirPickerPlaylist(rect.right + 8, rect.top, (plId) => {
      agregarArtista(artista, plId);
      btn.innerHTML = ICONO_CHECK;
      btn.classList.add("agregado");
      btn.disabled = true;
    });
  });
  row.append(cover, textos, btn);
  return row;
}

function filaOnline(res: ResultadoOnline): HTMLElement {
  const row = document.createElement("div");
  row.className = "res-item";
  const cover = document.createElement("div");
  cover.className = "res-cover";
  if (res.cover) cover.style.backgroundImage = `url("${res.cover}")`;
  else cover.style.background = "var(--lavanda)";
  const textos = document.createElement("div");
  textos.className = "res-textos";
  const strong = document.createElement("strong");
  strong.textContent = res.titulo;
  const small = document.createElement("small");
  small.textContent = res.artista + " · " + res.album;
  textos.append(strong, small);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "res-add";
  btn.dataset.pickerTrigger = "1";
  btn.innerHTML = ICONO_MAS;
  btn.title = "Agregar a playlist...";
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const rect = btn.getBoundingClientRect();
    abrirPickerPlaylist(rect.right + 8, rect.top, (plId) => {
      const nuevoItem: ItemCat = {
        id: res.id,
        titulo: res.titulo,
        artista: res.artista,
        album: res.album,
        preview: res.preview,
        cover: res.cover,
      };
      agregarItem(nuevoItem, plId);
      btn.innerHTML = ICONO_CHECK;
      btn.classList.add("agregado");
      btn.disabled = true;
    });
  });
  row.append(cover, textos, btn);
  return row;
}

function renderResultados(query: string): void {
  const q = query.trim().toLowerCase();
  if (q.length === 0) {
    resultados.hidden = true;
    resultados.replaceChildren();
    return;
  }
  const cancionesMatch = catalogoCompleto().filter(
    (c) => c.titulo.toLowerCase().includes(q) || c.artista.toLowerCase().includes(q) || c.album.toLowerCase().includes(q)
  );
  const artistasMatch = artistasDelCatalogo().filter((a) => a.toLowerCase().includes(q));
  resultados.replaceChildren();
  resultados.hidden = false;

  if (cancionesMatch.length > 0) {
    const t = document.createElement("div");
    t.className = "resultados-titulo";
    t.textContent = "Tu catálogo";
    resultados.appendChild(t);
    for (const item of cancionesMatch.slice(0, 6)) resultados.appendChild(filaCatalogo(item));
  }
  if (artistasMatch.length > 0) {
    const t = document.createElement("div");
    t.className = "resultados-titulo";
    t.textContent = "Artistas (catálogo)";
    resultados.appendChild(t);
    for (const artista of artistasMatch.slice(0, 4)) resultados.appendChild(filaArtista(artista));
  }

  const seccionOnline = document.createElement("div");
  seccionOnline.className = "resultados-titulo";
  seccionOnline.innerHTML = `Apple Music <span class="res-badge">PREVIEW 30s</span>`;
  resultados.appendChild(seccionOnline);

  const cargando = document.createElement("div");
  cargando.className = "res-cargando";
  cargando.textContent = "Buscando en Apple Music...";
  resultados.appendChild(cargando);

  if (busquedaTimer !== null) clearTimeout(busquedaTimer);
  busquedaTimer = window.setTimeout(async () => {
    ultimaQuery = q;
    try {
      const items = await buscarEnItunes(q);
      if (ultimaQuery !== q) return;
      cargando.remove();
      if (items.length === 0) {
        const v = document.createElement("div");
        v.className = "res-vacio";
        v.textContent = "Sin resultados en Apple Music.";
        resultados.appendChild(v);
        return;
      }
      for (const item of items) resultados.appendChild(filaOnline(item));
    } catch {
      cargando.textContent = "No se pudo conectar a Apple Music.";
    }
  }, 400);
}

inputBuscar.addEventListener("input", () => renderResultados(inputBuscar.value));
inputBuscar.addEventListener("focus", () => {
  if (inputBuscar.value.trim().length > 0) renderResultados(inputBuscar.value);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    resultados.hidden = true;
    cerrarNowPlaying();
    cerrarModalAgregar();
    cerrarModalPlaylist();
    limpiarSeleccion();
    cerrarPicker();
  }
});

function llenarSelectPlaylists(): void {
  selectPlaylistModal.replaceChildren();
  for (const p of playlists) {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.nombre;
    if (p.id === playlistActivaId) opt.selected = true;
    selectPlaylistModal.appendChild(opt);
  }
}

function abrirModalAgregar(): void {
  modalAgregar.classList.add("abierto");
  modalAgregar.setAttribute("aria-hidden", "false");
  mensaje.textContent = "";
  form.reset();
  grupoPosicion.hidden = true;
  llenarSelectPlaylists();
  inputPosicion.max = String(lista.size + 1);
  inputTitulo.focus();
}
function cerrarModalAgregar(): void {
  modalAgregar.classList.remove("abierto");
  modalAgregar.setAttribute("aria-hidden", "true");
}
btnAbrirAgregar.addEventListener("click", abrirModalAgregar);
btnCerrarAgregar.addEventListener("click", cerrarModalAgregar);
modalAgregar.addEventListener("click", (e) => { if (e.target === modalAgregar) cerrarModalAgregar(); });
selectModo.addEventListener("change", () => {
  grupoPosicion.hidden = selectModo.value !== "posicion";
  inputPosicion.max = String(lista.size + 1);
});
form.addEventListener("submit", (e) => {
  e.preventDefault();
  mensaje.textContent = "";
  const titulo = inputTitulo.value.trim();
  const artista = inputArtista.value.trim();
  if (!titulo || !artista) { mensaje.textContent = "Escribe título y artista."; return; }
  const destino = getPlaylistPorId(selectPlaylistModal.value);
  if (!destino) { mensaje.textContent = "Playlist no válida."; return; }
  const cancion = crearCancionUsuario(titulo, artista);
  if (selectModo.value === "inicio") destino.lista.agregarAlInicio(cancion);
  else if (selectModo.value === "final") destino.lista.agregarAlFinal(cancion);
  else {
    const pos = Number(inputPosicion.value);
    try { destino.lista.agregarEnPosicion(pos - 1, cancion); }
    catch { mensaje.textContent = `Posición entre 1 y ${destino.lista.size + 1}.`; return; }
  }
  usuarioCat.push({ id: cancion.id, titulo: cancion.titulo, artista: cancion.artista, album: "Singles" });
  mostrarToast(`"${titulo}" → ${destino.nombre}`);
  cerrarModalAgregar();
  renderSinHome();
});

function abrirModalPlaylist(): void {
  modalPlaylist.classList.add("abierto");
  modalPlaylist.setAttribute("aria-hidden", "false");
  mensajePlaylist.textContent = "";
  formPlaylist.reset();
  inputNombrePlaylist.focus();
}
function cerrarModalPlaylist(): void {
  modalPlaylist.classList.remove("abierto");
  modalPlaylist.setAttribute("aria-hidden", "true");
}
btnCrearPlaylist.addEventListener("click", abrirModalPlaylist);
btnCerrarPlaylist.addEventListener("click", cerrarModalPlaylist);
modalPlaylist.addEventListener("click", (e) => { if (e.target === modalPlaylist) cerrarModalPlaylist(); });
formPlaylist.addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = inputNombrePlaylist.value.trim();
  if (!nombre) { mensajePlaylist.textContent = "Ponle un nombre a tu playlist."; return; }
  crearPlaylist(nombre);
  cerrarModalPlaylist();
  mostrarToast(`Playlist "${nombre}" creada`);
});

navHome.addEventListener("click", mostrarHome);

lista.agregarAlFinal({ id: "cat-01-demo", titulo: "Amanecer en Pasto", artista: "Los Andinos" });
lista.agregarAlFinal({ id: "cat-03-demo", titulo: "Nodo a Nodo", artista: "Punteros" });

render();
renderSidebarPlaylists();
mostrarHome();
actualizarReproductor();