/* Base común de todas las plantillas: fotos encuadrables, plantilla, logo de liga,
   escudos, pabellón y exportación.
   Cada plantilla llama a Estudio.iniciar() con un diseño por formato (post y story)
   y su función de textos. Las medidas van en px de un lienzo de 2048 de ancho
   (2048x2048 el post, 2048x3641 el story); al exportar se escala.

   Dos formas de poner fotos:
   - Una sola foto a sangre (por defecto): dentro del cuadro nítida, fuera desenfocada
     y oscurecida, y la plantilla PNG (transparente) encima.
   - Varias fotos en franjas (diseño con `tiras`): primero el `fondo`, luego cada foto
     en su rectángulo (entre franjas se ve el fondo) y, si hay, la plantilla encima. */

const Estudio = (() => {
  // Cuadro de líneas blancas y patrocinadores debajo, pegados al borde de abajo.
  // El story tiene los mismos márgenes que el post: solo cambia el alto.
  const FORMATOS = {
    post: { ancho: 2048, alto: 2048, caja: { x0: 204, y0: 138, x1: 1839, y1: 1892 }, exportar: 2048, vista: 1024 },
    story: { ancho: 2048, alto: 3641, caja: { x0: 204, y0: 138, x1: 1839, y1: 3485 }, exportar: 1080, vista: 576 },
  };

  // Líneas y patrocinadores del story (sacados de la plantilla del post).
  const MARCO_STORY = "assets/plantillas/story-marco.png";

  const EQUIPOS = {
    senior: "CONFECCIONES CARCONGA TORRENUEVA FUTSAL",
    juvenil: "CONFECCIONES CARCONGA TORRENUEVA FUTSAL JUVENIL",
  };

  // Nombre corto para tablas con poco sitio (resultados).
  const EQUIPOS_CORTOS = {
    senior: "TORRENUEVA FUTSAL",
    juvenil: "TORRENUEVA FUTSAL JUVENIL",
  };

  // Valor de "nuestro equipo" en los desplegables de equipos.
  const NUESTRO = "nuestro";

  const LIGAS = {
    senior: "assets/iconos/liga-senior.png", // 1ª Autonómica
    juvenil: "assets/iconos/liga-juvenil.png", // J Autonómico
  };

  const ESCUDO_NUESTRO = "assets/club/escudo-blanco.png";
  const PABELLON_CASA = "PABELLÓN MUNICIPAL TORRENUEVA";

  const MESES = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO",
    "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

  const FUTURA = (peso) => (px) => `${peso} ${px}px "Futura Club"`;
  const FUTURA_CONDENSADA = (px) => `800 ${px}px "Futura Condensada"`;
  const FUTURA_CONDENSADA_MEDIA = (px) => `500 ${px}px "Futura Condensada Media"`;
  const PLAYFAIR = (px) => `400 ${px}px "Playfair Display"`;
  const PLAYFAIR_CURSIVA = (px) => `italic 400 ${px}px "Playfair Display"`;
  const ANTON = (px) => `400 ${px}px "Anton"`;

  const estado = {
    formato: "post", // "post" (2048x2048) o "story" (1080x1920)
    // Una foto por hueco: { img, zoom, dx, dy }. Sin franjas solo se usa fotos[0].
    fotos: [],
    equipo: "senior",
    enCasa: true, // decide el orden local/visitante de nombres, goles y escudos
    rival: "",
    fecha: "", // AAAA-MM-DD
    hora: "19:00",
    pabellon: PABELLON_CASA,
    escudoRival: null,
    arrastrar: "foto", // qué mueve el dedo en la vista previa: "foto" o "bloque" (título + textos)
    bloqueX: 0, // desplazamiento del bloque de textos respecto a su sitio original
    bloqueY: 0,
    desenfoque: 14, // sigma en px a 2048 (equivale al "7" de desenfoque gaussiano)
    brillo: -36, // se resta a cada canal (equivale a bajar el brillo de 50 a 43)
  };

  const recursos = { imagenes: {}, ligas: {}, rivales: [], escudoNuestro: null };
  let config = null;

  const fmt = () => FORMATOS[estado.formato];
  const dis = () => config.disenos[estado.formato];
  const caja = () => fmt().caja;
  const img = (src) => (src ? recursos.imagenes[src] : null);

  // Rectángulos de las fotos: las franjas del diseño o el lienzo entero.
  const huecos = () => dis().tiras || [{ x0: 0, y0: 0, x1: fmt().ancho, y1: fmt().alto }];

  /* ---------- Pintado ---------- */

  // Pinta en `canvas` con `ancho` px reales (el alto sale del formato).
  function pintar(canvas, ancho) {
    const F = fmt();
    const D = dis();
    const alto = Math.round((ancho * F.alto) / F.ancho);
    if (canvas.width !== ancho || canvas.height !== alto) {
      canvas.width = ancho;
      canvas.height = alto;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const s = ancho / F.ancho;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#1d2a1f";
    ctx.fillRect(0, 0, ancho, alto);

    if (D.tiras) pintarFranjas(ctx, s, D);
    else pintarFotoUnica(ctx, ancho, alto, s, D);

    ctx.setTransform(s, 0, 0, s, 0, 0);
    const logo = recursos.ligas[estado.equipo];
    if (logo) ctx.drawImage(logo, D.liga.x, D.liga.y, D.liga.tam, D.liga.tam);
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "alphabetic";
    config.pintarTextos(ctx, D);
  }

  function pintarFotoUnica(ctx, ancho, alto, s, D) {
    const f = estado.fotos[0];
    if (f && f.img) {
      Lienzo.dibujarCubriendoRect(ctx, f.img, 0, 0, ancho, alto, f.zoom, f.dx, f.dy);

      // Se guardan los píxeles del cuadro antes de desenfocar y se reponen después.
      // Nada de lienzos auxiliares: en iPhone Safari se queda sin memoria de lienzo
      // y los nuevos salen vacíos sin avisar (todo acababa desenfocado).
      const c = caja();
      const [x, y] = [Math.round(c.x0 * s), Math.round(c.y0 * s)];
      const [w, h] = [Math.round(c.x1 * s) - x, Math.round(c.y1 * s) - y];
      const nitida = ctx.getImageData(x, y, w, h);

      Lienzo.desenfocarYBrillo(ctx, ancho, alto, estado.desenfoque * s, estado.brillo);
      ctx.putImageData(nitida, x, y);
    }
    if (img(D.plantilla)) ctx.drawImage(img(D.plantilla), 0, 0, ancho, alto);
  }

  // Fondo cubriendo el lienzo; `recorte` [x0, y0, x1, y1] usa solo esa zona de la imagen.
  function pintarFondo(ctx, fondo) {
    const F = fmt();
    const im = img(fondo.src);
    if (!im) return;
    let [x0, y0, x1, y1] = fondo.recorte || [0, 0, im.naturalWidth, im.naturalHeight];
    let [w, h] = [x1 - x0, y1 - y0];
    if (w / h > F.ancho / F.alto) {
      const nw = (h * F.ancho) / F.alto;
      x0 += (w - nw) / 2;
      w = nw;
    } else {
      const nh = (w * F.alto) / F.ancho;
      y0 += (h - nh) / 2;
      h = nh;
    }
    ctx.drawImage(im, x0, y0, w, h, 0, 0, F.ancho, F.alto);
  }

  function pintarFranjas(ctx, s, D) {
    ctx.setTransform(s, 0, 0, s, 0, 0);
    if (D.fondo) pintarFondo(ctx, D.fondo);
    D.tiras.forEach((t, i) => {
      const f = estado.fotos[i];
      if (!f || !f.img) return;
      const [w, h] = [t.x1 - t.x0, t.y1 - t.y0];
      ctx.save();
      ctx.beginPath();
      ctx.rect(t.x0, t.y0, w, h);
      ctx.clip();
      Lienzo.dibujarCubriendoRect(ctx, f.img, t.x0, t.y0, w, h, f.zoom, f.dx, f.dy);
      ctx.restore();
    });
    // Banda oscura bajo los patrocinadores para que se lean sobre el fondo.
    if (D.sombraPatrocinadores) {
      const c = caja();
      ctx.fillStyle = "rgba(40,24,0,0.45)";
      ctx.fillRect(0, c.y1, fmt().ancho, 156);
    }
    if (img(D.plantilla)) ctx.drawImage(img(D.plantilla), 0, 0, fmt().ancho, fmt().alto);
  }

  /* ---------- Ayudas para las plantillas ---------- */

  // [local, visitante] con texto y peso: nuestro nombre siempre en negrita, el rival en normal.
  function equiposEnOrden() {
    const nuestro = { texto: EQUIPOS[estado.equipo], peso: 700, nuestro: true };
    const rival = { texto: estado.rival.trim().toUpperCase(), peso: 400, nuestro: false };
    return estado.enCasa ? [nuestro, rival] : [rival, nuestro];
  }

  // Escribe una línea; si pasa de `anchoMax` reduce la letra hasta que quepa.
  function textoAjustado(ctx, texto, fuente, tam, x, y, anchoMax) {
    ctx.font = fuente(tam);
    const ancho = ctx.measureText(texto).width;
    if (anchoMax && ancho > anchoMax) ctx.font = fuente((tam * anchoMax) / ancho);
    ctx.fillText(texto, x, y);
  }

  // Tamaño de un escudo para una caja de ancho x alto: todos ocupan la misma superficie,
  // así los escudos anchos (Salesianos, Argamasilla) no salen más pequeños que el resto.
  // Pueden pasarse un 25 % de ancho, pero nunca del alto.
  function medidaEscudo(img, ancho, alto) {
    const r = img.naturalWidth / img.naturalHeight;
    let w = Math.min(Math.sqrt(ancho * alto * r), ancho * 1.25);
    let h = w / r;
    if (h > alto) {
      h = alto;
      w = h * r;
    }
    return { w, h };
  }

  // Dibuja un escudo centrado en horizontal y apoyado abajo.
  function dibujarEnCaja(ctx, img, cx, abajo, anchoMax, altoMax) {
    const { w, h } = medidaEscudo(img, anchoMax, altoMax);
    ctx.drawImage(img, cx - w / 2, abajo - h, w, h);
  }

  // Escudos en blanco: local en `cx.local`, visitante en `cx.visitante`.
  // e = { cx: {local, visitante}, abajo, nuestro: {ancho, alto}, rival: {ancho, alto} }
  // Si un escudo ancho se acerca demasiado al nuestro, el del rival se aparta hacia fuera.
  function pintarEscudos(ctx, e) {
    const nuestroCx = estado.enCasa ? e.cx.local : e.cx.visitante;
    let rivalCx = estado.enCasa ? e.cx.visitante : e.cx.local;
    const n = recursos.escudoNuestro;
    const r = estado.escudoRival;
    if (n && r) {
      const separacion = 30;
      const wn = medidaEscudo(n, e.nuestro.ancho, e.nuestro.alto).w;
      const wr = medidaEscudo(r, e.rival.ancho, e.rival.alto).w;
      const falta = separacion - (Math.abs(rivalCx - nuestroCx) - wn / 2 - wr / 2);
      if (falta > 0) rivalCx += Math.sign(rivalCx - nuestroCx) * falta;
    }
    if (n) dibujarEnCaja(ctx, n, nuestroCx, e.abajo, e.nuestro.ancho, e.nuestro.alto);
    if (r) dibujarEnCaja(ctx, r, rivalCx, e.abajo, e.rival.ancho, e.rival.alto);
  }

  /* Piezas de las publicaciones de jornada (clasificación y resultados): mismo título
     y mismo velo para que en el carrusel parezcan una sola pieza. */

  const TITULO_JORNADA = { derecha: 1790, baseCursiva: 395, altoCursiva: 150, baseAnton: 640, altoAnton: 215, anchoMax: 1330 };
  const VELO_JORNADA = { desde: 560, hasta: 900 };

  // En el story todo baja lo mismo que la línea de arriba del cuadro.
  const bajadaStory = () => caja().y0 - FORMATOS.post.caja.y0;

  // "palabra" en Playfair cursiva sobre "JORNADA X" en Anton, alineados a la derecha.
  function pintarTituloJornada(ctx, palabra, jornada) {
    const t = TITULO_JORNADA;
    const dy = bajadaStory();
    ctx.textAlign = "right";
    const cursiva = Lienzo.tamParaAlto(ctx, PLAYFAIR_CURSIVA, "l", t.altoCursiva);
    textoAjustado(ctx, palabra, PLAYFAIR_CURSIVA, cursiva, t.derecha - 40, t.baseCursiva + dy, t.anchoMax);
    const anton = Lienzo.tamParaAlto(ctx, ANTON, "H", t.altoAnton);
    const texto = String(jornada).trim() ? `JORNADA ${String(jornada).trim()}` : "JORNADA";
    textoAjustado(ctx, texto, ANTON, anton, t.derecha, t.baseAnton + dy, t.anchoMax);
  }

  // Degradado oscuro dentro del cuadro (sin tapar las líneas) para que la tabla se lea.
  function pintarVeloJornada(ctx, opacidad) {
    const v = VELO_JORNADA;
    const c = caja();
    const dy = bajadaStory();
    const g = ctx.createLinearGradient(0, v.desde + dy, 0, v.hasta + dy);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${opacidad})`);
    ctx.fillStyle = g;
    ctx.fillRect(c.x0 + 2, v.desde + dy, c.x1 - c.x0 - 4, c.y1 - v.desde - dy);
    ctx.fillStyle = "#fff";
  }

  // Desplegable de equipos: Torrenueva, los rivales conocidos (valor = escudo) y "Otro".
  // Solo los rivales de la categoría marcada (sénior o juvenil).
  const rivalesActuales = () => recursos.rivales.filter((r) => r.categoria === estado.equipo);

  // Desplegables de equipos registrados, para rehacerlos al cambiar de categoría.
  const selectsEquipos = new Set();

  function rellenarEquipos(sel) {
    selectsEquipos.add(sel);
    sel.replaceChildren(new Option("Torrenueva", NUESTRO));
    for (const r of rivalesActuales()) sel.add(new Option(r.nombre, r.escudo));
    sel.add(new Option("Otro (sin escudo)", ""));
  }

  // Al cambiar de categoría: cada desplegable con un rival se queda con el de la nueva
  // categoría que tenga el mismo escudo (mismo club) o pasa a "Otro". El "change" hace
  // que la plantilla recoja el nombre nuevo.
  function rehacerEquipos() {
    for (const sel of selectsEquipos) {
      const antes = sel.value;
      rellenarEquipos(sel);
      if (antes === NUESTRO) {
        sel.value = NUESTRO;
        continue;
      }
      sel.value = [...sel.options].some((o) => o.value === antes) ? antes : "";
      if (antes) sel.dispatchEvent(new Event("change"));
    }
  }

  function fechaLarga(iso) {
    if (!iso) return "";
    const [, m, d] = iso.split("-").map(Number);
    return `${d} ${MESES[m - 1]}`;
  }

  const horaTexto = () => (estado.hora ? estado.hora + "H" : "");

  /* ---------- Interfaz ---------- */

  const $ = (id) => document.getElementById(id);
  let vista;
  let pendiente = false;

  // Quien quiera enterarse de cada cambio (p. ej. el texto de la publicación).
  const oyentes = [];
  const alCambiar = (fn) => oyentes.push(fn);

  function refrescar() {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => {
      pendiente = false;
      pintar(vista, fmt().vista);
      oyentes.forEach((fn) => fn());
    });
  }

  // Enlaza un campo del formulario con una clave del estado (si el campo existe en la página).
  function enlazar(id, clave, convertir = (v) => v) {
    const el = $(id);
    if (!el) return;
    el.value = estado[clave];
    el.addEventListener("input", () => {
      estado[clave] = convertir(el.value);
      refrescar();
    });
  }

  function ponerValor(id, clave) {
    const el = $(id);
    if (el) el.value = estado[clave];
  }

  function marcarCampo() {
    document.querySelectorAll('input[name="campo"]').forEach((el) => {
      el.checked = (el.value === "casa") === estado.enCasa;
    });
  }

  /* Rival y su escudo: elegido de la lista de conocidos, subido, o automático por nombre. */

  // Solo vale la última petición: si se cambia de rival rápido, un escudo que
  // termine de cargar tarde no puede pisar al bueno.
  let peticionEscudo = 0;
  async function ponerEscudoRival(src) {
    const esta = ++peticionEscudo;
    const img = src ? await Lienzo.cargarImagen(src) : null;
    if (esta !== peticionEscudo) return;
    estado.escudoRival = img;
    refrescar();
  }

  // Si el nombre escrito coincide con un rival conocido, se pone su escudo solo.
  function escudoPorNombre() {
    const sel = $("escudo-rival");
    if (!sel) return;
    const r = rivalesActuales().find((r) => r.nombre.toLowerCase() === estado.rival.trim().toLowerCase());
    if (!r) return;
    sel.value = r.escudo;
    ponerEscudoRival(r.escudo);
  }

  // Lista del desplegable "Elegir rival" según la categoría.
  function listaRivales(sel) {
    sel.replaceChildren(new Option("— Otro / sin escudo —", ""));
    for (const r of rivalesActuales()) sel.add(new Option(r.nombre, r.escudo));
  }

  // Al cambiar de categoría con un rival de la lista elegido: si el club también está
  // en la otra categoría se cambia a ese equipo; si no, se quita el rival.
  function rehacerRival() {
    const sel = $("escudo-rival");
    if (!sel) return;
    const antes = sel.value;
    listaRivales(sel);
    if (!antes) return;
    const r = rivalesActuales().find((r) => r.escudo === antes);
    sel.value = r ? r.escudo : "";
    estado.rival = r ? r.nombre : "";
    ponerValor("rival", "rival");
    ponerEscudoRival(r ? r.escudo : null);
    ponerPabellon();
  }

  function enlazarEscudos() {
    const sel = $("escudo-rival");
    if (!sel) return;
    listaRivales(sel);
    // Elegir un rival de la lista pone su escudo y también su nombre.
    sel.addEventListener("change", () => {
      ponerEscudoRival(sel.value);
      if (!sel.value) return;
      estado.rival = sel.selectedOptions[0].text;
      ponerValor("rival", "rival");
      ponerPabellon();
    });
    $("subir-escudo").addEventListener("change", (e) => {
      const archivo = e.target.files[0];
      if (!archivo) return;
      sel.value = "";
      ponerEscudoRival(URL.createObjectURL(archivo));
    });
  }

  /* Pabellón: en casa el nuestro; fuera se recuerda por rival en este dispositivo. */

  const Pabellones = {
    leer(rival) {
      try {
        return JSON.parse(localStorage.getItem("pabellones") || "{}")[rival] || "";
      } catch {
        return "";
      }
    },
    guardar(rival, pabellon) {
      try {
        const todos = JSON.parse(localStorage.getItem("pabellones") || "{}");
        todos[rival] = pabellon;
        localStorage.setItem("pabellones", JSON.stringify(todos));
      } catch {}
    },
  };

  // Pone un partido entero (p. ej. el que viene de la FFCM):
  // { rival, escudo, enCasa, fecha, hora, pabellon }.
  // Fuera, si ya habías escrito a mano el pabellón de ese rival se respeta el tuyo.
  function ponerPartido(p) {
    estado.rival = p.rival;
    estado.enCasa = p.enCasa;
    if (p.fecha) estado.fecha = p.fecha;
    if (p.hora) estado.hora = p.hora;
    for (const k of ["rival", "fecha", "hora"]) ponerValor(k, k);
    marcarCampo();
    if (!p.enCasa && p.pabellon && !Pabellones.leer(p.rival)) Pabellones.guardar(p.rival, p.pabellon);
    ponerPabellon();
    const sel = $("escudo-rival");
    if (sel) sel.value = p.escudo || "";
    ponerEscudoRival(p.escudo || null);
    refrescar();
  }

  // En casa el pabellón es siempre el nuestro y el campo queda bloqueado.
  function ponerPabellon() {
    estado.pabellon = estado.enCasa ? PABELLON_CASA : Pabellones.leer(estado.rival);
    ponerValor("pabellon", "pabellon");
    if ($("pabellon")) $("pabellon").disabled = estado.enCasa;
  }

  /* Fotos: un selector de archivo y un zoom por hueco ("foto"/"zoom" o "foto-0"/"zoom-0"...). */

  const idFoto = (base, i) => (config.disenos.post.tiras ? `${base}-${i}` : base);

  function enlazarFotos() {
    huecos().forEach((_, i) => {
      estado.fotos[i] = { img: null, zoom: 1, dx: 0, dy: 0 };
      const zoom = $(idFoto("zoom", i));
      zoom.value = 1;
      zoom.addEventListener("input", () => {
        estado.fotos[i].zoom = Number(zoom.value);
        refrescar();
      });
      $(idFoto("foto", i)).addEventListener("change", async (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;
        estado.fotos[i] = { img: await Lienzo.cargarImagen(URL.createObjectURL(archivo)), zoom: 1, dx: 0, dy: 0 };
        zoom.value = 1;
        refrescar();
      });
    });
  }

  // Arrastrar sobre la vista previa: encuadra la foto que hay debajo del dedo
  // o mueve el bloque de textos.
  function enlazarArrastre() {
    document.querySelectorAll('input[name="arrastrar"]').forEach((el) => {
      el.checked = el.value === estado.arrastrar;
      el.addEventListener("change", () => (estado.arrastrar = el.value));
    });
    if ($("recolocar")) {
      $("recolocar").addEventListener("click", () => {
        estado.bloqueX = estado.bloqueY = 0;
        refrescar();
      });
    }

    const enLienzo = (e) => {
      const r = vista.getBoundingClientRect();
      return [((e.clientX - r.left) * fmt().ancho) / r.width, ((e.clientY - r.top) * fmt().alto) / r.height];
    };

    let arrastre = null;
    vista.addEventListener("pointerdown", (e) => {
      let foto = -1;
      if (estado.arrastrar === "foto") {
        const [, y] = enLienzo(e);
        foto = huecos().findIndex((t) => y >= t.y0 && y <= t.y1);
        if (foto < 0 || !estado.fotos[foto].img) return;
      }
      vista.setPointerCapture(e.pointerId);
      arrastre = { x: e.clientX, y: e.clientY, foto };
    });
    vista.addEventListener("pointermove", (e) => {
      if (!arrastre) return;
      const porPx = fmt().ancho / vista.getBoundingClientRect().width;
      const [mx, my] = [(e.clientX - arrastre.x) * porPx, (e.clientY - arrastre.y) * porPx];
      arrastre.x = e.clientX;
      arrastre.y = e.clientY;
      if (arrastre.foto < 0) {
        const limitar = (v) => Math.max(-1200, Math.min(1200, v));
        estado.bloqueX = limitar(estado.bloqueX + mx);
        estado.bloqueY = limitar(estado.bloqueY + my);
      } else {
        const f = estado.fotos[arrastre.foto];
        const t = huecos()[arrastre.foto];
        const { sobraX, sobraY } = Lienzo.medidasCubriendo(f.img, t.x1 - t.x0, f.zoom, t.y1 - t.y0);
        const limitar = (v) => Math.max(-1, Math.min(1, v));
        if (sobraX > 0) f.dx = limitar(f.dx + mx / sobraX);
        if (sobraY > 0) f.dy = limitar(f.dy + my / sobraY);
      }
      refrescar();
    });
    const soltar = () => (arrastre = null);
    vista.addEventListener("pointerup", soltar);
    vista.addEventListener("pointercancel", soltar);
  }

  function enlazarComunes() {
    enlazar("rival", "rival");
    enlazar("fecha", "fecha");
    enlazar("hora", "hora");
    enlazar("pabellon", "pabellon");
    enlazar("desenfoque", "desenfoque", Number);
    enlazar("brillo", "brillo", Number);
    // Al terminar de escribir el rival: su escudo si es conocido y, fuera, su pabellón.
    if ($("rival")) {
      $("rival").addEventListener("change", () => {
        escudoPorNombre();
        if (!estado.enCasa) ponerPabellon();
      });
    }
    if ($("pabellon")) {
      $("pabellon").addEventListener("change", () => {
        if (!estado.enCasa) Pabellones.guardar(estado.rival, estado.pabellon);
      });
    }

    document.querySelectorAll('input[name="equipo"]').forEach((el) => {
      el.checked = el.value === estado.equipo;
      el.addEventListener("change", () => {
        estado.equipo = el.value;
        rehacerRival();
        rehacerEquipos();
        refrescar();
      });
    });

    marcarCampo();
    document.querySelectorAll('input[name="campo"]').forEach((el) => {
      el.addEventListener("change", () => {
        estado.enCasa = el.value === "casa";
        ponerPabellon();
        refrescar();
      });
    });

    document.querySelectorAll('input[name="formato"]').forEach((el) => {
      el.checked = el.value === estado.formato;
      el.addEventListener("change", () => {
        estado.formato = el.value;
        refrescar();
      });
    });

    enlazarFotos();
    enlazarArrastre();

    $("exportar").addEventListener("click", async (e) => {
      const boton = e.currentTarget;
      boton.disabled = true;
      boton.textContent = "Generando…";
      const final = document.createElement("canvas");
      try {
        pintar(final, fmt().exportar);
        const sufijo = (config.sufijoArchivo ? config.sufijoArchivo() : estado.rival)
          .trim().toLowerCase().replace(/[^a-z0-9ñáéíóú]+/g, "-") || "partido";
        const story = estado.formato === "story" ? "-story" : "";
        await Lienzo.exportar(final, `${config.nombre}-${estado.equipo}-${sufijo}${story}.jpg`);
      } finally {
        final.width = final.height = 0; // libera la memoria del lienzo en iPhone
        boton.disabled = false;
        boton.textContent = "Guardar imagen";
      }
    });
  }

  async function cargarJSON(src) {
    try {
      const r = await fetch(src);
      return r.ok ? await r.json() : [];
    } catch {
      return [];
    }
  }

  // Se resuelve cuando la página ya tiene cargados rivales, escudos y plantillas.
  let resolverListo;
  const listo = new Promise((r) => (resolverListo = r));

  async function iniciar(opciones) {
    config = opciones;
    vista = $("vista");
    enlazarComunes();
    ponerPabellon();

    await Promise.all(
      [FUTURA(700), FUTURA(400), PLAYFAIR, PLAYFAIR_CURSIVA, ANTON, FUTURA_CONDENSADA, FUTURA_CONDENSADA_MEDIA]
        .map((f) => document.fonts.load(f(40)))
    );
    // Todas las imágenes de los diseños (plantillas y fondos de los dos formatos).
    const fuentes = new Set();
    for (const d of Object.values(opciones.disenos)) {
      if (d.plantilla) fuentes.add(d.plantilla);
      if (d.fondo) fuentes.add(d.fondo.src);
    }
    const [escudoNuestro, rivales, ligas, imagenes] = await Promise.all([
      Lienzo.cargarImagen(ESCUDO_NUESTRO),
      cargarJSON("data/rivales.json"),
      Promise.all(Object.values(LIGAS).map(Lienzo.cargarImagen)),
      Promise.all([...fuentes].map(Lienzo.cargarImagen)),
    ]);
    Object.assign(recursos, { escudoNuestro, rivales });
    [...fuentes].forEach((src, i) => (recursos.imagenes[src] = imagenes[i]));
    Object.keys(LIGAS).forEach((equipo, i) => (recursos.ligas[equipo] = ligas[i]));

    if (opciones.alCargar) await opciones.alCargar();
    enlazarEscudos();
    refrescar();
    resolverListo();
  }

  return {
    FORMATOS, MARCO_STORY, estado, recursos, iniciar, listo, refrescar, alCambiar, enlazar, caja, bajadaStory,
    ponerPartido,
    equiposEnOrden, textoAjustado, dibujarEnCaja, pintarEscudos, fechaLarga, horaTexto,
    FUTURA, FUTURA_CONDENSADA, FUTURA_CONDENSADA_MEDIA, PLAYFAIR, PLAYFAIR_CURSIVA, ANTON,
    EQUIPOS, EQUIPOS_CORTOS, NUESTRO,
    pintarTituloJornada, pintarVeloJornada, rellenarEquipos,
  };
})();
