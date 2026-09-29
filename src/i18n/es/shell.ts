import type { Diccionario } from '../types';

/** Textos del App Shell: Layout (topbar, breadcrumb), Navbar, Dashboard y Login. */
const shell: Diccionario = {
  // Breadcrumbs (se calculan desde el pathname)
  'shell.miga.dashboard': 'Dashboard',
  'shell.miga.buscar': 'Buscar',
  'shell.miga.detalle_tour': 'Detalle de tour',
  'shell.miga.operador': 'Operador',
  'shell.miga.reservar': 'Reservar tour',
  'shell.miga.comparador': 'Comparador',
  'shell.miga.administracion': 'Administración',
  'shell.miga.cargar_tarifario': 'Cargar tarifario',
  'shell.miga.inicio': 'Tours Operadores',

  // Topbar
  'shell.topbar.abrir_menu': 'Abrir menú',
  'shell.topbar.placeholder_buscar': 'Buscar tours…',
  'shell.topbar.aria_buscar': 'Buscar tours',
  'shell.topbar.tema_claro': 'Cambiar a tema claro',
  'shell.topbar.tema_oscuro': 'Cambiar a tema oscuro',
  'shell.topbar.cerrar_sesion': 'Cerrar sesión',
  'shell.topbar.iniciar_sesion': 'Iniciar sesión',
  'shell.topbar.salir': 'Salir',
  'shell.topbar.ingresar': 'Ingresar',

  // Navbar (sidebar)
  'shell.nav.inicio': 'Inicio',
  'shell.nav.comparador': 'Comparador',
  'shell.nav.administracion': 'Administración',

  // Dashboard
  'shell.dash.titulo': 'Dashboard',
  'shell.dash.subtitulo': 'Resumen de Tours Operadores — Lavas Tacotal',
  'shell.dash.operadores_titulo': 'Tour operadores',
  'shell.dash.sin_operadores': 'No hay operadores cargados.',
  'shell.dash.titulo_tours': 'Nuestros tours',
  'shell.dash.subtitulo_tours': 'Explora las experiencias disponibles en Lavas Tacotal',
  'shell.dash.sin_tours': 'No hay tours disponibles por el momento.',

  // Login
  'shell.login.email': 'Email',
  'shell.login.email_placeholder': 'correo@ejemplo.com',
  'shell.login.contrasena': 'Contraseña',
  'shell.login.error_generico': 'No pudimos iniciar sesión',
  'shell.login.entrando': 'Entrando…',
  'shell.login.entrar': 'Entrar',
};

export default shell;
