import type { Diccionario } from '../types';

/** App Shell copy: Layout (topbar, breadcrumb), Navbar, Dashboard and Login. */
const shell: Diccionario = {
  // Breadcrumbs (computed from pathname)
  'shell.miga.dashboard': 'Dashboard',
  'shell.miga.buscar': 'Search',
  'shell.miga.detalle_tour': 'Tour details',
  'shell.miga.operador': 'Operator',
  'shell.miga.reservar': 'Book tour',
  'shell.miga.comparador': 'Comparison',
  'shell.miga.administracion': 'Administration',
  'shell.miga.cargar_tarifario': 'Upload rate sheet',
  'shell.miga.inicio': 'Tours Operadores',

  // Topbar
  'shell.topbar.abrir_menu': 'Open menu',
  'shell.topbar.placeholder_buscar': 'Search tours…',
  'shell.topbar.aria_buscar': 'Search tours',
  'shell.topbar.tema_claro': 'Switch to light theme',
  'shell.topbar.tema_oscuro': 'Switch to dark theme',
  'shell.topbar.cerrar_sesion': 'Log out',
  'shell.topbar.iniciar_sesion': 'Log in',
  'shell.topbar.salir': 'Log out',
  'shell.topbar.ingresar': 'Log in',

  // Navbar (sidebar)
  'shell.nav.inicio': 'Home',
  'shell.nav.comparador': 'Comparison',
  'shell.nav.administracion': 'Administration',

  // Dashboard
  'shell.dash.titulo': 'Dashboard',
  'shell.dash.subtitulo': 'Tours Operadores overview — Lavas Tacotal',
  'shell.dash.operadores_titulo': 'Tour operators',
  'shell.dash.sin_operadores': 'No operators loaded yet.',
  'shell.dash.titulo_tours': 'Our tours',
  'shell.dash.subtitulo_tours': 'Explore the available experiences at Lavas Tacotal',
  'shell.dash.sin_tours': 'No tours available right now.',

  // Login
  'shell.login.email': 'Email',
  'shell.login.email_placeholder': 'email@example.com',
  'shell.login.contrasena': 'Password',
  'shell.login.error_generico': 'We could not log you in',
  'shell.login.entrando': 'Signing in…',
  'shell.login.entrar': 'Log in',
};

export default shell;
