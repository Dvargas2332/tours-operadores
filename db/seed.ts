import { getDb } from "../api/queries/connection";
import { operadores, tours } from "./schema";

const P =
  "Cancelación sin cargo hasta 24 horas antes del tour. Después aplica 100% de penalidad.";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  await db.delete(tours);
  await db.delete(operadores);

  const ops = await db.insert(operadores).values([
    { nombre: "Sunset Tours", contacto: "2479-9800 · reservas@sunsettourscr.com", comision: 20 },
    { nombre: "Desafío Adventure Company", contacto: "2479-0020 · info@desafiocostarica.com", comision: 20 },
    { nombre: "Ecoterra Costa Rica", contacto: "2479-7070 · sales@ecoterracostarica.com", comision: 15 },
    { nombre: "Wave Expeditions", contacto: "2479-7262 · reservations@waveexpeditions.com", comision: 20 },
    { nombre: "Pure Trek Canyoning", contacto: "2479-1313 · info@puretrek.com", comision: 15 },
    { nombre: "Arenal Paraíso Tours", contacto: "2460-5333 · reservas@arenalparaiso.com", comision: 18 },
    { nombre: "Red Lava TSC", contacto: "2479-9020 · info@redlavatsc.com", comision: 15 },
    { nombre: "Jacamar Naturalist Tours", contacto: "2479-9767 · info@jacamarcr.com", comision: 20 },
  ]).returning({ id: operadores.id });

  const opId = ops[0].id; // ids consecutivos dentro del lote

  await db.insert(tours).values([
    {
      operadorId: opId, // Sunset Tours
      nombre: "Volcán Arenal 1968 + Aguas Termales",
      zona: "Arenal",
      categoria: "termas",
      precioAdulto: 89, precioNino: 69,
      precioNetoAdulto: 71, precioNetoNino: 55,
      duracionHoras: 6, horaSalida: "14:00",
      incluye: ["transporte", "guia", "entradas", "cena"],
      noIncluye: ["bebidas", "propinas"],
      minimoPersonas: 2, aptoNinos: true,
      politicaCancelacion: P,
      observaciones: "Caminata por senderos de lava del 1968 con atardecer y termales al final.",
      fuente: "tarifario-sunset-2026.pdf", fechaActualizacion: "2026-07-10",
    },
    {
      operadorId: opId,
      nombre: "Aguas Termales + Cena",
      zona: "Arenal",
      categoria: "termas",
      precioAdulto: 55, precioNino: 40,
      precioNetoAdulto: 44, precioNetoNino: 32,
      duracionHoras: 4, horaSalida: "17:30",
      incluye: ["transporte", "entradas", "cena"],
      noIncluye: ["guia", "bebidas"],
      minimoPersonas: 2, aptoNinos: true,
      politicaCancelacion: P,
      observaciones: "Tarde relajada en aguas termales con cena buffet incluida.",
      fuente: "tarifario-sunset-2026.pdf", fechaActualizacion: "2026-07-10",
    },
    {
      operadorId: opId + 1, // Desafío
      nombre: "Canopy + Tarzán Swing",
      zona: "Arenal",
      categoria: "aventura",
      precioAdulto: 72, precioNino: 58,
      precioNetoAdulto: 58, precioNetoNino: 46,
      duracionHoras: 3, horaSalida: "08:00",
      incluye: ["transporte", "guia", "equipo"],
      noIncluye: ["almuerzo", "fotos"],
      minimoPersonas: 2, aptoNinos: true,
      politicaCancelacion: P,
      observaciones: "12 cables con vista al volcán. Edad mínima 5 años.",
      fuente: "tarifario-desafio-2026.xlsx", fechaActualizacion: "2026-06-28",
    },
    {
      operadorId: opId + 1,
      nombre: "Rafting Río Balsa Clase II–III",
      zona: "Río Balsa",
      categoria: "acuatico",
      precioAdulto: 65, precioNino: 52,
      precioNetoAdulto: 52, precioNetoNino: 42,
      duracionHoras: 5, horaSalida: "08:30",
      incluye: ["transporte", "guia", "equipo", "almuerzo", "frutas"],
      noIncluye: ["fotos"],
      minimoPersonas: 2, aptoNinos: true,
      politicaCancelacion: P,
      observaciones: "Ideal familias y primerizos. Edad mínima 8 años.",
      fuente: "tarifario-desafio-2026.xlsx", fechaActualizacion: "2026-06-28",
    },
    {
      operadorId: opId + 1,
      nombre: "Rafting Río Sarapiquí Clase III–IV",
      zona: "Sarapiquí",
      categoria: "acuatico",
      precioAdulto: 99, precioNino: null,
      precioNetoAdulto: 79, precioNetoNino: null,
      duracionHoras: 6, horaSalida: "07:00",
      incluye: ["transporte", "guia", "equipo", "almuerzo"],
      noIncluye: ["fotos"],
      minimoPersonas: 4, aptoNinos: false,
      politicaCancelacion: "Cancelación sin cargo hasta 48 horas antes. Después aplica 100%.",
      observaciones: "Alto caudal, solo mayores de 14 años con buena condición física.",
      fuente: "tarifario-desafio-2026.xlsx", fechaActualizacion: "2026-06-28",
    },
    {
      operadorId: opId + 2, // Ecoterra
      nombre: "Puentes Colgantes Místico",
      zona: "Arenal",
      categoria: "naturaleza",
      precioAdulto: 58, precioNino: 42,
      precioNetoAdulto: 49, precioNetoNino: 36,
      duracionHoras: 3, horaSalida: "08:00",
      incluye: ["transporte", "guia", "entradas"],
      noIncluye: ["almuerzo"],
      minimoPersonas: 2, aptoNinos: true,
      politicaCancelacion: P,
      observaciones: "6 puentes colgantes con vista al dosel y al volcán. Guía naturalista.",
      fuente: "tarifario-ecoterra-2026.pdf", fechaActualizacion: "2026-05-15",
    },
    {
      operadorId: opId + 2,
      nombre: "Río Celeste — Parque Tenorio",
      zona: "Río Celeste",
      categoria: "naturaleza",
      precioAdulto: 115, precioNino: 95,
      precioNetoAdulto: 98, precioNetoNino: 81,
      duracionHoras: 9, horaSalida: "06:30",
      incluye: ["transporte", "guia", "entradas", "almuerzo"],
      noIncluye: ["bebidas"],
      minimoPersonas: 2, aptoNinos: true,
      politicaCancelacion: P,
      observaciones: "Día completo. Caminata de 6 km; no recomendado en lluvia fuerte.",
      fuente: "tarifario-ecoterra-2026.pdf", fechaActualizacion: "2026-05-15",
    },
    {
      operadorId: opId + 3, // Wave Expeditions
      nombre: "Safari Caño Negro",
      zona: "Caño Negro",
      categoria: "naturaleza",
      precioAdulto: 68, precioNino: 48,
      precioNetoAdulto: 54, precioNetoNino: 38,
      duracionHoras: 8, horaSalida: "07:00",
      incluye: ["transporte", "guia", "almuerzo", "paseo_bote"],
      noIncluye: ["bebidas"],
      minimoPersonas: 2, aptoNinos: true,
      politicaCancelacion: P,
      observaciones: "Refugio de vida silvestre: aves, monos, caimanes. Bote techado.",
      fuente: "tarifario-wave-2026.docx", fechaActualizacion: "2026-03-20",
    },
    {
      operadorId: opId + 4, // Pure Trek
      nombre: "Canyoning Lost Canyon",
      zona: "Arenal",
      categoria: "aventura",
      precioAdulto: 105, precioNino: 84,
      precioNetoAdulto: 89, precioNetoNino: 71,
      duracionHoras: 4, horaSalida: "07:30",
      incluye: ["transporte", "guia", "equipo", "almuerzo", "fotos"],
      noIncluye: [],
      minimoPersonas: 2, aptoNinos: true,
      politicaCancelacion: P,
      observaciones: "4 rapeles en cascadas (hasta 60 m). Edad mínima 7 años.",
      fuente: "tarifario-puretrek-2026.pdf", fechaActualizacion: "2026-07-01",
    },
    {
      operadorId: opId + 5, // Arenal Paraíso
      nombre: "Tour de Café y Chocolate",
      zona: "La Fortuna",
      categoria: "cultural",
      precioAdulto: 45, precioNino: 30,
      precioNetoAdulto: 37, precioNetoNino: 25,
      duracionHoras: 2.5, horaSalida: "10:00",
      incluye: ["transporte", "guia", "degustacion"],
      noIncluye: ["almuerzo"],
      minimoPersonas: 2, aptoNinos: true,
      politicaCancelacion: P,
      observaciones: "Proceso artesanal del café y el cacao con degustación incluida.",
      fuente: "tarifario-arenalparaiso-2026.xlsx", fechaActualizacion: "2026-02-10",
    },
    {
      operadorId: opId + 6, // Red Lava
      nombre: "Cabalgata Catarata La Fortuna",
      zona: "La Fortuna",
      categoria: "aventura",
      precioAdulto: 67, precioNino: 55,
      precioNetoAdulto: 57, precioNetoNino: 47,
      duracionHoras: 3.5, horaSalida: "08:30",
      incluye: ["guia", "equipo", "entradas"],
      noIncluye: ["transporte", "almuerzo"],
      minimoPersonas: 2, aptoNinos: true,
      politicaCancelacion: P,
      observaciones: "A caballo hasta el mirador + caminata a la catarata. Salida desde el rancho.",
      fuente: "tarifario-redlava-2026.jpg", fechaActualizacion: "2026-01-15",
    },
    {
      operadorId: opId + 7, // Jacamar
      nombre: "Caminata Nocturna",
      zona: "Arenal",
      categoria: "naturaleza",
      precioAdulto: 42, precioNino: 32,
      precioNetoAdulto: 34, precioNetoNino: 26,
      duracionHoras: 2.5, horaSalida: "18:00",
      incluye: ["transporte", "guia", "linternas"],
      noIncluye: ["cena"],
      minimoPersonas: 2, aptoNinos: true,
      politicaCancelacion: P,
      observaciones: "Fauna nocturna: ranas, insectos, perezosos. Guía bilingüe.",
      fuente: "tarifario-jacamar-2026.pdf", fechaActualizacion: "2025-12-05",
    },
  ]);

  console.log("Done.");
  process.exit(0);
}

seed();
