/* Rellena las plantillas con los datos de la FFCM.
   Los lee de data/ffcm-<equipo>.json, que deja la GitHub Action de los lunes
   (herramientas/ffcm.mjs). Al abrir la página y al cambiar de sénior a juvenil cada
   plantilla aplica los suyos; todo queda editable. Los marcadores no vienen
   (la FFCM los protege), así que los goles siguen siendo a mano. */

const Ffcm = (() => {
  const sinTildes = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
  const esNuestro = (nombre) => sinTildes(nombre).includes("TORRENUEVA");

  // "CONSTR. NACO F.S. PIEDRABUENA" -> rival de la lista (por su palabra clave). Si hay
  // varias claves que encajan, gana la más larga ("CIUDAD DE PUERTOLLANO" a "PUERTOLLANO").
  function rival(nombre) {
    const n = sinTildes(nombre);
    const r = Estudio.recursos.rivales
      .filter((r) => r.categoria === Estudio.estado.equipo && r.clave && n.includes(r.clave))
      .sort((a, b) => b.clave.length - a.clave.length)[0];
    return r ? { nombre: r.nombre, escudo: r.escudo } : { nombre: Textos.capitalizar(nombre), escudo: "" };
  }

  // "P.M. DE MORAL DE CALATRAVA" -> "PABELLÓN MUNICIPAL DE MORAL DE CALATRAVA"
  const pabellon = (campo) =>
    campo.toUpperCase().replace(/^P\.\s*M\.\s*/, "PABELLÓN MUNICIPAL ").replace(/\bPABELLON\b/, "PABELLÓN");

  // Nuestro partido de una jornada, listo para Estudio.ponerPartido().
  function nuestroPartido(jornada) {
    const p = jornada && jornada.partidos.find((p) => esNuestro(p.local) || esNuestro(p.visitante));
    if (!p) return null;
    const enCasa = esNuestro(p.local);
    const r = rival(enCasa ? p.visitante : p.local);
    return { rival: r.nombre, escudo: r.escudo, enCasa, fecha: p.fecha, hora: p.hora, pabellon: pabellon(p.campo) };
  }

  // Última jornada ya llegada y próxima (hoy incluido; el día de partido son la misma),
  // con sus partidos si están en los datos.
  function situar(datos) {
    const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
    const conPartidos = (j) => (j && datos.partidos[j.n] ? { ...j, ...datos.partidos[j.n] } : null);
    const ultima = [...datos.jornadas].reverse().find((j) => j.fecha <= hoy);
    const proxima = datos.jornadas.find((j) => j.fecha >= hoy);
    return { ...datos, ultima: conPartidos(ultima), proxima: conPartidos(proxima) };
  }

  const cache = {};
  function cargar(equipo) {
    if (!cache[equipo]) {
      cache[equipo] = fetch(`data/ffcm-${equipo}.json`, { cache: "no-cache" }).then((r) => {
        if (!r.ok) throw new Error(`Aún no hay datos de la FFCM del ${equipo === "juvenil" ? "juvenil" : "sénior"}`);
        return r.json();
      });
      cache[equipo].catch(() => delete cache[equipo]);
    }
    return cache[equipo];
  }

  /* `aplicar(datos)` rellena la plantilla y devuelve un resumen para mostrar
     (p. ej. "Jornada 4: fuera contra CD Ciudad de Puertollano"). Recibe los datos con
     `ultima` y `proxima` ya calculadas; si falta alguna, debe lanzar un error. */
  function iniciar(aplicar) {
    const caja = document.createElement("div");
    caja.className = "ffcm";
    caja.innerHTML = `
      <button type="button" class="boton boton-secundario">↻ Rellenar con la FFCM</button>
      <p class="nota" aria-live="polite"></p>`;
    const boton = caja.querySelector("button");
    const nota = caja.querySelector(".nota");
    document.querySelector("form").prepend(caja);

    async function rellenar() {
      const equipo = Estudio.estado.equipo;
      boton.disabled = true;
      nota.textContent = "Cargando los datos de la FFCM…";
      try {
        const datos = situar(await cargar(equipo));
        if (Estudio.estado.equipo !== equipo) return; // se cambió de categoría mientras tanto
        const resumen = aplicar(datos);
        const dia = new Date(datos.actualizado).toLocaleDateString("es-ES", { day: "numeric", month: "numeric" });
        nota.textContent = `${resumen} · FFCM a ${dia}. Todo se puede cambiar a mano.`;
      } catch (e) {
        nota.textContent = `${e.message}. Puedes rellenarlo a mano.`;
      } finally {
        boton.disabled = false;
      }
    }

    boton.addEventListener("click", rellenar);
    document.querySelectorAll('input[name="equipo"]').forEach((el) => el.addEventListener("change", rellenar));
    Estudio.listo.then(rellenar);
  }

  const falta = () => {
    throw new Error("Los datos de la FFCM no llegan a esta jornada (se actualizan los lunes)");
  };

  return { iniciar, rival, esNuestro, nuestroPartido, falta };
})();
