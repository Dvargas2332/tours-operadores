import type { Diccionario } from '../types';

/** Texts for the main search page (`/buscar`): bar, filters, cards, comparison. */
const buscador: Diccionario = {
  // Page
  'buscador.titulo': 'Search tours',
  'buscador.boton_filtros': 'Filters',
  'buscador.boton_filtros_n': 'Filters ({n})',
  'buscador.chip_zona': 'Area: {zona}',
  'buscador.chip_categoria': 'Category: {categoria}',
  'buscador.chip_horario': 'Departure: {horario}',
  'buscador.chip_incluye': 'Includes: {item}',
  'buscador.chip_ninos': 'Kids friendly',
  'buscador.chip_ninos_edad': 'Kids friendly (age {n})',
  'buscador.chip_operador': 'Operator: {nombre}',

  // Active chips + counter
  'buscador.editar_busqueda': 'Edit search',
  'buscador.quitar_filtro': 'Remove filter {filtro}',
  'buscador.limpiar_todo': 'Clear all',
  'buscador.sin_filtros': 'No active filters',
  'buscador.contador_tours_uno': '{n} tour',
  'buscador.contador_tours_varios': '{n} tours',
  'buscador.contador_total': 'of {total} in the database',

  // Compare bar
  'buscador.quitar_nombre': 'Remove {nombre}',
  'buscador.seleccionados_n': '{n} of {max} selected',
  'buscador.comparar_ahora': 'Compare now',

  // Empty / error states
  'buscador.alt_volcan': 'Volcano',
  'buscador.estado_inicial_titulo': 'Find the perfect tour',
  'buscador.estado_inicial_vacio': 'No tours loaded yet',
  'buscador.alt_binoculares': 'Binoculars over a map with a dotted route',
  'buscador.sin_resultados_titulo': 'No tours match those filters',
  'buscador.sin_resultados_sugerencia': 'Try removing a filter or widening the price range.',
  'buscador.limpiar_filtros': 'Clear filters',
  'buscador.error_titulo': 'We could not load the tours',
  'buscador.error_subtitulo': 'Check your connection and try again.',
  'buscador.reintentar': 'Try again',

  // Filter panel
  'buscador.panel_titulo': 'Filters',
  'buscador.limpiar': 'Clear',
  'buscador.limpiar_n': 'Clear ({n})',
  'buscador.seccion_precio': 'Adult price',
  'buscador.seccion_zona': 'Area',
  'buscador.seccion_categoria': 'Category',
  'buscador.seccion_horario': 'Departure time',
  'buscador.seccion_incluye': 'What it includes',
  'buscador.seccion_ninos': 'Suitable for children',
  'buscador.seccion_operador': 'Operator',
  'buscador.precio_min': 'Minimum price',
  'buscador.precio_max': 'Maximum price',
  'buscador.por_persona': 'per person',
  'buscador.incluye_ayuda': 'The tour must include all checked items.',
  'buscador.ninos_ayuda': 'Only shows tours that accept minors',
  'buscador.edad_nino': 'Child age',
  'buscador.opcional': 'Optional',
  'buscador.todos_operadores': 'All operators',
  'buscador.seleccionado_uno': '{n} selected',
  'buscador.seleccionados_varios': '{n} selected',
  'buscador.buscar_operador': 'Search operator…',
  'buscador.sin_coincidencias': 'No matches',
  'buscador.ver_resultado_uno': 'See {n} result',
  'buscador.ver_resultados_varios': 'See {n} results',

  // Operator card
  'buscador.logo_de': 'Logo of {nombre}',
  'buscador.sin_zona': 'No area defined',
  'buscador.desde': 'from',

  // Results bar (sort and view)
  'buscador.ordenar': 'Sort:',
  'buscador.orden_relevancia': 'Relevance',
  'buscador.orden_precio_asc': 'Price: low to high',
  'buscador.orden_precio_desc': 'Price: high to low',
  'buscador.orden_nombre': 'Name A–Z',
  'buscador.vista_resultados': 'Results view',
  'buscador.vista_tarjetas': 'Cards',
  'buscador.vista_lista': 'List',

  // Free search bar
  'buscador.placeholder_1': 'E.g.: canopy in Arenal for 2 adults and 1 child, under $250…',
  'buscador.placeholder_2': 'E.g.: rafting with lunch that leaves early…',
  'buscador.placeholder_3': 'E.g.: something relaxing with hot springs for this afternoon…',
  'buscador.busqueda_aria': 'Free tour search',
  'buscador.interpretando': 'Interpreting…',

  // Quick suggestions (chip label + search query)
  'buscador.sug_aventura': 'Adventure under $80',
  'buscador.sug_aventura_q': 'adventure under $80',
  'buscador.sug_rafting': 'Rafting with lunch',
  'buscador.sug_rafting_q': 'rafting with lunch',
  'buscador.sug_ninos': 'Young kids friendly',
  'buscador.sug_ninos_q': 'suitable for small children',
  'buscador.sug_tarde': 'Afternoon departures',
  'buscador.sug_tarde_q': 'afternoon departures',
  'buscador.sug_naturaleza': 'Nature full day',
  'buscador.sug_naturaleza_q': 'nature full day',

  // Tour card
  'buscador.tarifario_desactualizado': 'Outdated rate sheet — confirm price with the operator',
  'buscador.categoria_tooltip': 'Category: {categoria}',
  'buscador.apto_ninos': 'Kids friendly',
  'buscador.solo_adultos': 'Adults only',
  'buscador.rack_adulto': 'adult rack rate',
  'buscador.n_tarifas': '{n} rates',
  'buscador.una_tarifa': 'one rate',
  'buscador.tooltip_precio_varios': 'Lowest price per person · {n} age ranges',
  'buscador.tooltip_rack_interno': 'Adult rack rate · the net rate is the operator cost (internal use)',
  'buscador.tooltip_tarifa_adulto': 'Per adult rate',
  'buscador.min_personas': 'min. {n}',

  // Rate freshness
  'buscador.frescura_ok': 'Up to date',
  'buscador.frescura_warn': 'Review',
  'buscador.frescura_danger': 'Outdated',
  'buscador.frescura_hoy': 'today',
  'buscador.frescura_ayer': 'yesterday',
  'buscador.frescura_hace_dias': '{n} days ago',

  // Dynamic suggestion for empty state
  'buscador.sugerencia_quitar_zona': "'{zona}'",
  'buscador.sugerencia_subir_precio': 'raising the maximum price',
  'buscador.sugerencia_quitar_categoria': 'the category',
  'buscador.sugerencia_quitar_horario': 'the departure time',
  'buscador.sugerencia_quitar_incluye': "the '{item}' filter",
  'buscador.sugerencia_quitar_ninos': 'the "kids friendly" filter',
  'buscador.sugerencia_quitar_algo': 'Try removing {item}.',
  'buscador.sugerencia_subir_precio_texto': 'Try raising the maximum price or removing another filter.',

  // Category labels (data keys from tour-meta)
  'buscador.categoria_aventura': 'Adventure',
  'buscador.categoria_naturaleza': 'Nature',
  'buscador.categoria_acuatico': 'Water',
  'buscador.categoria_cultural': 'Cultural',
  'buscador.categoria_termas': 'Hot springs & Relax',

  // "What it includes" labels (data keys from tour-meta)
  'buscador.incluye_transporte': 'Transportation',
  'buscador.incluye_guia': 'Guide',
  'buscador.incluye_almuerzo': 'Lunch or meal',
  'buscador.incluye_entradas': 'Park entrance fees',
  'buscador.incluye_equipo': 'Equipment',
  'buscador.incluye_seguro': 'Insurance',
  'buscador.incluye_toallas': 'Towels',
  'buscador.incluye_hidratacion': 'Hydration',
  'buscador.incluye_frutas': 'Fruits',
  'buscador.incluye_snacks': 'Snacks',

  // Departure time bucket labels (data keys from tour-meta)
  'buscador.horario_antes7': 'Before 7:00',
  'buscador.horario_manana': 'Morning 7–10',
  'buscador.horario_mediodia': 'Midday 10–2',
  'buscador.horario_tarde': 'Afternoon 2–5',
  'buscador.horario_noche': 'Evening 5+',
};

export default buscador;
