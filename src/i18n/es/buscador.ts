import type { Diccionario } from '../types';

/** Textos del buscador principal (`/buscar`): barra, filtros, tarjetas, comparación. */
const buscador: Diccionario = {
  // Página
  'buscador.titulo': 'Buscar tours',
  'buscador.boton_filtros': 'Filtros',
  'buscador.boton_filtros_n': 'Filtros ({n})',
  'buscador.chip_zona': 'Zona: {zona}',
  'buscador.chip_categoria': 'Categoría: {categoria}',
  'buscador.chip_horario': 'Salida: {horario}',
  'buscador.chip_incluye': 'Incluye: {item}',
  'buscador.chip_ninos': 'Apto para niños',
  'buscador.chip_ninos_edad': 'Apto niños ({n} años)',
  'buscador.chip_operador': 'Operador: {nombre}',

  // Chips activos + contador
  'buscador.editar_busqueda': 'Editar búsqueda',
  'buscador.quitar_filtro': 'Quitar filtro {filtro}',
  'buscador.limpiar_todo': 'Limpiar todo',
  'buscador.sin_filtros': 'Sin filtros activos',
  'buscador.contador_tours_uno': '{n} tour',
  'buscador.contador_tours_varios': '{n} tours',
  'buscador.contador_total': 'de {total} en la base de datos',

  // Barra de comparación
  'buscador.quitar_nombre': 'Quitar {nombre}',
  'buscador.seleccionados_n': '{n} de {max} seleccionados',
  'buscador.comparar_ahora': 'Comparar ahora',

  // Estados vacíos / error
  'buscador.alt_volcan': 'Volcán',
  'buscador.estado_inicial_titulo': 'Encuentra el tour perfecto',
  'buscador.estado_inicial_vacio': 'Aún no hay tours cargados',
  'buscador.alt_binoculares': 'Binoculares sobre un mapa con ruta punteada',
  'buscador.sin_resultados_titulo': 'Sin tours con esos filtros',
  'buscador.sin_resultados_sugerencia': 'Prueba quitar algún filtro o ampliar el rango de precio.',
  'buscador.limpiar_filtros': 'Limpiar filtros',
  'buscador.error_titulo': 'No pudimos cargar los tours',
  'buscador.error_subtitulo': 'Revisa la conexión y reintenta.',
  'buscador.reintentar': 'Reintentar',

  // Panel de filtros
  'buscador.panel_titulo': 'Filtros',
  'buscador.limpiar': 'Limpiar',
  'buscador.limpiar_n': 'Limpiar ({n})',
  'buscador.seccion_precio': 'Precio adulto',
  'buscador.seccion_zona': 'Zona',
  'buscador.seccion_categoria': 'Categoría',
  'buscador.seccion_horario': 'Horario de salida',
  'buscador.seccion_incluye': 'Qué incluye',
  'buscador.seccion_ninos': 'Apto para niños',
  'buscador.seccion_operador': 'Operador',
  'buscador.precio_min': 'Precio mínimo',
  'buscador.precio_max': 'Precio máximo',
  'buscador.por_persona': 'por persona',
  'buscador.incluye_ayuda': 'El tour debe incluir todos los marcados.',
  'buscador.ninos_ayuda': 'Muestra solo tours que aceptan menores',
  'buscador.edad_nino': 'Edad del niño',
  'buscador.opcional': 'Opcional',
  'buscador.todos_operadores': 'Todos los operadores',
  'buscador.seleccionado_uno': '{n} seleccionado',
  'buscador.seleccionados_varios': '{n} seleccionados',
  'buscador.buscar_operador': 'Buscar operador…',
  'buscador.sin_coincidencias': 'Sin coincidencias',
  'buscador.ver_resultado_uno': 'Ver {n} resultado',
  'buscador.ver_resultados_varios': 'Ver {n} resultados',

  // Tarjeta de operador
  'buscador.logo_de': 'Logo de {nombre}',
  'buscador.sin_zona': 'Sin zona definida',
  'buscador.desde': 'desde',

  // Barra de resultados (orden y vista)
  'buscador.ordenar': 'Ordenar:',
  'buscador.orden_relevancia': 'Relevancia',
  'buscador.orden_precio_asc': 'Precio: menor a mayor',
  'buscador.orden_precio_desc': 'Precio: mayor a menor',
  'buscador.orden_nombre': 'Nombre A–Z',
  'buscador.vista_resultados': 'Vista de resultados',
  'buscador.vista_tarjetas': 'Tarjetas',
  'buscador.vista_lista': 'Lista',

  // Barra de búsqueda libre
  'buscador.placeholder_1': 'Ej.: canopy en Arenal para 2 adultos y 1 niño, menos de $250…',
  'buscador.placeholder_2': 'Ej.: rafting con almuerzo que salga temprano…',
  'buscador.placeholder_3': 'Ej.: algo tranquilo con aguas termales para hoy en la tarde…',
  'buscador.busqueda_aria': 'Búsqueda libre de tours',
  'buscador.interpretando': 'Interpretando…',

  // Sugerencias rápidas (label del chip + consulta de búsqueda)
  'buscador.sug_aventura': 'Aventura bajo $80',
  'buscador.sug_aventura_q': 'aventura bajo $80',
  'buscador.sug_rafting': 'Rafting con almuerzo',
  'buscador.sug_rafting_q': 'rafting con almuerzo',
  'buscador.sug_ninos': 'Apto niños pequeños',
  'buscador.sug_ninos_q': 'apto para niños pequeños',
  'buscador.sug_tarde': 'Salidas en la tarde',
  'buscador.sug_tarde_q': 'salidas en la tarde',
  'buscador.sug_naturaleza': 'Naturaleza día completo',
  'buscador.sug_naturaleza_q': 'naturaleza día completo',

  // Tarjeta de tour
  'buscador.tarifario_desactualizado': 'Tarifario desactualizado — confirmar precio con el operador',
  'buscador.categoria_tooltip': 'Categoría: {categoria}',
  'buscador.apto_ninos': 'Apto niños',
  'buscador.solo_adultos': 'Solo adultos',
  'buscador.rack_adulto': 'rack adulto',
  'buscador.n_tarifas': '{n} tarifas',
  'buscador.una_tarifa': 'una tarifa',
  'buscador.tooltip_precio_varios': 'Precio más bajo por persona · {n} rangos de edad',
  'buscador.tooltip_rack_interno': 'Tarifa rack por adulto · la neta es el costo del operador (uso interno)',
  'buscador.tooltip_tarifa_adulto': 'Tarifa por adulto',
  'buscador.min_personas': 'mín. {n}',

  // Frescura de la tarifa
  'buscador.frescura_ok': 'Actualizado',
  'buscador.frescura_warn': 'Revisar',
  'buscador.frescura_danger': 'Desactualizado',
  'buscador.frescura_hoy': 'hoy',
  'buscador.frescura_ayer': 'ayer',
  'buscador.frescura_hace_dias': 'hace {n} días',

  // Sugerencia dinámica del estado vacío
  'buscador.sugerencia_quitar_zona': "'{zona}'",
  'buscador.sugerencia_subir_precio': 'subir el precio máximo',
  'buscador.sugerencia_quitar_categoria': 'la categoría',
  'buscador.sugerencia_quitar_horario': 'el horario',
  'buscador.sugerencia_quitar_incluye': "'{item}' de \"incluye\"",
  'buscador.sugerencia_quitar_ninos': '"Apto para niños"',
  'buscador.sugerencia_quitar_algo': 'Prueba quitar {item}.',
  'buscador.sugerencia_subir_precio_texto': 'Prueba subir el precio máximo o quitar otro filtro.',

  // Etiquetas de categorías (claves de datos de tour-meta)
  'buscador.categoria_aventura': 'Aventura',
  'buscador.categoria_naturaleza': 'Naturaleza',
  'buscador.categoria_acuatico': 'Acuático',
  'buscador.categoria_cultural': 'Cultural',
  'buscador.categoria_termas': 'Termas & Relax',

  // Etiquetas de "qué incluye" (claves de datos de tour-meta)
  'buscador.incluye_transporte': 'Transporte',
  'buscador.incluye_guia': 'Guía',
  'buscador.incluye_almuerzo': 'Almuerzo o comida',
  'buscador.incluye_entradas': 'Entradas/parques',
  'buscador.incluye_equipo': 'Equipo',
  'buscador.incluye_seguro': 'Seguro',
  'buscador.incluye_toallas': 'Toallas',
  'buscador.incluye_hidratacion': 'Hidratación',
  'buscador.incluye_frutas': 'Frutas',
  'buscador.incluye_snacks': 'Snacks',

  // Etiquetas de buckets de horario (claves de datos de tour-meta)
  'buscador.horario_antes7': 'Antes de 7:00',
  'buscador.horario_manana': 'Mañana 7–10',
  'buscador.horario_mediodia': 'Mediodía 10–14',
  'buscador.horario_tarde': 'Tarde 14–17',
  'buscador.horario_noche': 'Noche 17+',
};

export default buscador;
