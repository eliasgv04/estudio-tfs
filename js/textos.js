/* Texto de la publicación para Instagram.
   Instagram no deja elegir fuente: las "letras en negrita" son símbolos Unicode
   (Mathematical Alphanumeric Symbols). Cada plantilla genera su texto marcando
   trozos con {c:...} (cursiva, como "final"/"próximo" en Playfair) y {f:...}
   (fuerte, como "PARTIDO" en Anton); aquí se convierten según el estilo elegido.
   Esos alfabetos no tienen tildes ni ñ: se descompone la letra y se le pone la
   tilde combinada encima. */

const Textos = (() => {
  // Primer código de A, a y 0 de cada alfabeto Unicode.
  const ALFABETOS = {
    serifNegrita: { A: 0x1d400, a: 0x1d41a, cero: 0x1d7ce },
    serifCursivaNegrita: { A: 0x1d468, a: 0x1d482, cero: 0x1d7ce },
    sansNegrita: { A: 0x1d5d4, a: 0x1d5ee, cero: 0x1d7ec },
  };

  // Qué alfabeto usa cada marca en cada estilo.
  const ESTILOS = {
    identidad: { nombre: "Como las imágenes (cursiva + negrita)", c: "serifCursivaNegrita", f: "sansNegrita" },
    serif: { nombre: "Serif negrita", c: "serifNegrita", f: "serifNegrita" },
    sans: { nombre: "Sans negrita", c: "sansNegrita", f: "sansNegrita" },
    normal: { nombre: "Sin formato", c: null, f: null },
  };

  function convertir(texto, alfabeto) {
    const a = ALFABETOS[alfabeto];
    if (!a) return texto;
    let out = "";
    for (const ch of texto.normalize("NFD")) {
      const c = ch.codePointAt(0);
      if (c >= 65 && c <= 90) out += String.fromCodePoint(a.A + c - 65);
      else if (c >= 97 && c <= 122) out += String.fromCodePoint(a.a + c - 97);
      else if (c >= 48 && c <= 57) out += String.fromCodePoint(a.cero + c - 48);
      else out += ch; // tildes combinadas, espacios, signos y emojis tal cual
    }
    return out.normalize("NFC");
  }

  // Sustituye {c:...} y {f:...} por el alfabeto del estilo.
  function formatear(plantilla, estilo) {
    const e = ESTILOS[estilo] || ESTILOS.identidad;
    return plantilla.replace(/\{([cf]):([^}]*)\}/g, (_, marca, texto) => convertir(texto, e[marca]));
  }

  const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto",
    "septiembre", "octubre", "noviembre", "diciembre"];

  // "sábado 24 de octubre" a partir de AAAA-MM-DD.
  function fechaTexto(iso) {
    if (!iso) return "";
    const [a, m, d] = iso.split("-").map(Number);
    const dia = DIAS[new Date(a, m - 1, d).getDay()];
    return `${dia} ${d} de ${MESES[m - 1]}`;
  }

  // "PABELLÓN MUNICIPAL TORRENUEVA" -> "Pabellón Municipal Torrenueva"
  function capitalizar(texto) {
    const menores = new Set(["de", "del", "la", "las", "los", "el", "y"]);
    return texto
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .map((p, i) => (i > 0 && menores.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
      .join(" ");
  }

  const NUESTRO = { senior: "Torrenueva Futsal", juvenil: "Torrenueva Futsal Juvenil" };

  const nuestro = () => NUESTRO[Estudio.estado.equipo];

  // [local, visitante] con nuestro nombre en negrita.
  function equipos() {
    const e = Estudio.estado;
    const rival = e.rival.trim() || "Rival";
    const n = `{f:${nuestro()}}`;
    return e.enCasa ? [n, rival] : [rival, n];
  }

  // Une bloques (listas de líneas) quitando las líneas vacías; los bloques van separados
  // por una línea en blanco.
  const unir = (...bloques) =>
    bloques.map((b) => b.filter(Boolean).join("\n")).filter(Boolean).join("\n\n");

  /* ---------- Interfaz: se añade sola encima de "Guardar imagen" ---------- */

  function iniciar(generar) {
    const caja = document.createElement("fieldset");
    caja.className = "texto-publicacion";
    caja.innerHTML = `
      <legend>Texto de la publicación</legend>
      <label>Estilo de letra
        <select></select>
      </label>
      <textarea rows="10" spellcheck="false" aria-label="Texto de la publicación"></textarea>
      <div class="fila">
        <button type="button" class="boton boton-secundario" data-accion="rehacer">Rehacer</button>
        <button type="button" class="boton" data-accion="copiar">Copiar texto</button>
      </div>
      <p class="nota" hidden>Has editado el texto: ya no se actualiza solo. «Rehacer» lo vuelve a generar.</p>`;
    const sel = caja.querySelector("select");
    const area = caja.querySelector("textarea");
    const nota = caja.querySelector(".nota");
    const copiar = caja.querySelector('[data-accion="copiar"]');

    for (const [clave, e] of Object.entries(ESTILOS)) sel.add(new Option(e.nombre, clave));
    try {
      sel.value = localStorage.getItem("estiloTexto") || "identidad";
    } catch {
      sel.value = "identidad";
    }

    let editado = false;
    const actualizar = () => {
      if (editado) return;
      area.value = formatear(generar(), sel.value);
    };

    sel.addEventListener("change", () => {
      try {
        localStorage.setItem("estiloTexto", sel.value);
      } catch {}
      editado = false;
      nota.hidden = true;
      actualizar();
    });
    area.addEventListener("input", () => {
      editado = true;
      nota.hidden = false;
    });
    caja.querySelector('[data-accion="rehacer"]').addEventListener("click", () => {
      editado = false;
      nota.hidden = true;
      actualizar();
    });
    copiar.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(area.value);
      } catch {
        area.select();
        document.execCommand("copy");
      }
      copiar.textContent = "¡Copiado!";
      setTimeout(() => (copiar.textContent = "Copiar texto"), 1500);
    });

    document.getElementById("exportar").before(caja);
    Estudio.alCambiar(actualizar);
    actualizar();
  }

  return { iniciar, fechaTexto, capitalizar, nuestro, equipos, unir };
})();
