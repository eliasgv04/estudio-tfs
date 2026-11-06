/* Plantilla ESCUELAS · RESULTADOS: los resultados del fin de semana de las cinco categorías.
   Diseño propio de las escuelas (js/escuelas.js): en cada tarjeta, local y visitante con
   sus goles a la derecha, como un marcador; o "descansa". Rivales, casa/fuera y descansos
   vienen de lo puesto en Partidos (en este dispositivo). */

const { estado } = Estudio;
Object.assign(estado, { velo: 0.85 }); // fuerza del tinte verde sobre la foto

Estudio.enlazar("velo", "velo", Number);

Estudio.iniciar({
  nombre: "escuelas-resultados",
  disenos: Escuelas.DISENOS,
  sufijoArchivo: () => estado.escuelas.find((e) => e.juega && e.fecha)?.fecha || "fin-de-semana",
  async alCargar() {
    await Escuelas.cargarLogos();
    Escuelas.crearFormulario("resultados");
  },
  pintarTextos(ctx, D) {
    Escuelas.pintar(ctx, D, "resultados");
  },
});

Textos.iniciar(() => {
  const lineas = Escuelas.CATEGORIAS.map((c, i) => {
    const e = estado.escuelas[i];
    if (!e.juega) return `🔹 {f:${Escuelas.categoria(i)}}: descansa`;
    const [local, visitante] = Escuelas.enOrdenTexto(i);
    const [gl, gv] = e.enCasa ? [e.gn, e.gr] : [e.gr, e.gn];
    const marcador = String(gl) !== "" || String(gv) !== "" ? ` {f:${gl || 0} - ${gv || 0}} ` : " vs ";
    return `🔹 {f:${Escuelas.categoria(i)}}: ${local}${marcador}${visitante}`;
  });
  return Textos.unir(["{c:escuelas} {f:DEPORTIVAS} ⚽️", "Resultados del fin de semana"], lineas, ["¡Bien, chavales! 💛💚"]);
});
