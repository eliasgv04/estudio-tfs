/* Plantilla ESCUELAS · PARTIDOS: los partidos del fin de semana de las cinco categorías.
   Diseño propio de las escuelas (js/escuelas.js): en cada tarjeta, local y visitante como
   en un marcador y a la derecha el día y la hora; o "descansa". */

const { estado } = Estudio;
Object.assign(estado, { velo: 0.85 }); // fuerza del tinte verde sobre la foto

Estudio.enlazar("velo", "velo", Number);

Estudio.iniciar({
  nombre: "escuelas-partidos",
  disenos: Escuelas.DISENOS,
  sufijoArchivo: () => estado.escuelas.find((e) => e.juega && e.fecha)?.fecha || "fin-de-semana",
  async alCargar() {
    await Escuelas.cargarLogos();
    Escuelas.crearFormulario("partidos");
  },
  pintarTextos(ctx, D) {
    Escuelas.pintar(ctx, D, "partidos");
  },
});

Textos.iniciar(() => {
  const bloques = Escuelas.CATEGORIAS.map((c, i) => {
    const e = estado.escuelas[i];
    if (!e.juega) return [`🔹 {f:${Escuelas.categoria(i)}}: descansa`];
    const [local, visitante] = Escuelas.enOrdenTexto(i);
    const fecha = Textos.fechaTexto(e.fecha);
    const cuando = [fecha && fecha.charAt(0).toUpperCase() + fecha.slice(1), e.hora && `${e.hora}h`].filter(Boolean).join(" · ");
    return [`🔹 {f:${Escuelas.categoria(i)}}: ${local} vs ${visitante}`, cuando && `📅 ${cuando}`, e.lugar.trim() && `📍 ${Textos.capitalizar(e.lugar)}`];
  });
  return Textos.unir(["{c:escuelas} {f:DEPORTIVAS} ⚽️", "Partidos del fin de semana"], ...bloques, ["¡Vamos, chavales! 💛💚"]);
});
