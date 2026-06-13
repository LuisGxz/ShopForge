export type Lang = 'en' | 'es';

/** Display translations for API enum/catalog values (stored in English in the DB). */
export const ROAST_ES: Record<string, string> = {
  Light: 'Tueste claro', MediumLight: 'Tueste medio-claro', Medium: 'Tueste medio',
  MediumDark: 'Tueste medio-oscuro', Dark: 'Tueste oscuro'
};
export const ROAST_EN: Record<string, string> = {
  Light: 'Light roast', MediumLight: 'Medium-light roast', Medium: 'Medium roast',
  MediumDark: 'Medium-dark roast', Dark: 'Dark roast'
};
export const PROCESS_ES: Record<string, string> = {
  Washed: 'Lavado', Natural: 'Natural', Honey: 'Honey', Anaerobic: 'Anaeróbico'
};
export const PROCESS_EN: Record<string, string> = {
  Washed: 'Washed', Natural: 'Natural', Honey: 'Honey', Anaerobic: 'Anaerobic'
};
export const STATUS_ES: Record<string, string> = {
  PendingPayment: 'Pago pendiente', Paid: 'Pagado', Processing: 'Preparando',
  Shipped: 'Enviado', Delivered: 'Entregado', Cancelled: 'Cancelado'
};
export const GRIND_ES: Record<string, string> = {
  'Whole bean': 'Grano entero', 'Filter': 'Filtro', 'Espresso': 'Espresso', 'Each': 'Unidad'
};

export interface AppCopy {
  header: {
    coffee: string; subscription: string; gear: string; about: string;
    account: string; orders: string; wishlist: string; admin: string;
    signIn: string; signOut: string; cart: string; menu: string; greeting: string;
  };
  footer: { tagline: string; built: string; demoNote: string; };
  common: {
    loading: string; retry: string; error: string; addToBag: string; added: string;
    outOfStock: string; from: string; reviews: string; viewDetails: string;
    search: string; clear: string; close: string;
  };
  login: {
    title: string; subtitle: string; email: string; password: string; signIn: string; signingIn: string;
    noAccount: string; createOne: string; demoLabel: string; demoCustomer: string; demoAdmin: string;
    useThis: string; aboutLink: string; errorFallback: string; backToShop: string;
  };
  register: {
    title: string; subtitle: string; fullName: string; email: string; password: string; passwordHint: string;
    create: string; creating: string; already: string; signIn: string; errorFallback: string;
  };
}

const EN: AppCopy = {
  header: {
    coffee: 'Coffee', subscription: 'Subscription', gear: 'Brew gear', about: 'About',
    account: 'Account', orders: 'My orders', wishlist: 'Wishlist', admin: 'Admin',
    signIn: 'Sign in', signOut: 'Sign out', cart: 'Cart', menu: 'Menu', greeting: 'Hi'
  },
  footer: {
    tagline: 'Single-origin coffee, roasted six blocks from your cup.',
    built: 'A ShopForge demo by Luis Chiquito Vera · Angular + .NET',
    demoNote: 'Demo storefront — payments run in Stripe test mode.'
  },
  common: {
    loading: 'Loading…', retry: 'Try again', error: 'Something went wrong.',
    addToBag: 'Add to bag', added: 'Added', outOfStock: 'Out of stock', from: 'from',
    reviews: 'reviews', viewDetails: 'View details', search: 'Search', clear: 'Clear', close: 'Close'
  },
  login: {
    title: 'Welcome back', subtitle: 'Sign in to track orders and check out faster.',
    email: 'Email', password: 'Password', signIn: 'Sign in', signingIn: 'Signing in…',
    noAccount: "Don't have an account?", createOne: 'Create one',
    demoLabel: 'Demo accounts — one tap to fill', demoCustomer: 'Customer', demoAdmin: 'Admin',
    useThis: 'Use', aboutLink: 'About this project →', backToShop: '← Back to the shop',
    errorFallback: "Couldn't sign in. Please check your details and try again."
  },
  register: {
    title: 'Create your account', subtitle: 'Save your details for a faster checkout.',
    fullName: 'Full name', email: 'Email', password: 'Password',
    passwordHint: 'At least 8 characters, with an uppercase letter and a number.',
    create: 'Create account', creating: 'Creating…', already: 'Already have an account?',
    signIn: 'Sign in', errorFallback: "Couldn't create your account. Please try again."
  }
};

const ES: AppCopy = {
  header: {
    coffee: 'Cafés', subscription: 'Suscripción', gear: 'Equipos', about: 'Acerca de',
    account: 'Cuenta', orders: 'Mis pedidos', wishlist: 'Favoritos', admin: 'Admin',
    signIn: 'Iniciar sesión', signOut: 'Cerrar sesión', cart: 'Carrito', menu: 'Menú', greeting: 'Hola'
  },
  footer: {
    tagline: 'Café de origen, tostado a seis cuadras de tu taza.',
    built: 'Demo ShopForge de Luis Chiquito Vera · Angular + .NET',
    demoNote: 'Tienda demo — los pagos corren en modo de prueba de Stripe.'
  },
  common: {
    loading: 'Cargando…', retry: 'Reintentar', error: 'Algo salió mal.',
    addToBag: 'Añadir al carrito', added: 'Añadido', outOfStock: 'Agotado', from: 'desde',
    reviews: 'reseñas', viewDetails: 'Ver detalle', search: 'Buscar', clear: 'Limpiar', close: 'Cerrar'
  },
  login: {
    title: 'Bienvenido de nuevo', subtitle: 'Inicia sesión para seguir tus pedidos y pagar más rápido.',
    email: 'Email', password: 'Contraseña', signIn: 'Iniciar sesión', signingIn: 'Entrando…',
    noAccount: '¿No tienes cuenta?', createOne: 'Crea una',
    demoLabel: 'Cuentas demo — un toque para rellenar', demoCustomer: 'Cliente', demoAdmin: 'Admin',
    useThis: 'Usar', aboutLink: 'Acerca de este proyecto →', backToShop: '← Volver a la tienda',
    errorFallback: 'No se pudo iniciar sesión. Revisa tus datos e inténtalo de nuevo.'
  },
  register: {
    title: 'Crea tu cuenta', subtitle: 'Guarda tus datos para pagar más rápido.',
    fullName: 'Nombre completo', email: 'Email', password: 'Contraseña',
    passwordHint: 'Al menos 8 caracteres, con una mayúscula y un número.',
    create: 'Crear cuenta', creating: 'Creando…', already: '¿Ya tienes cuenta?',
    signIn: 'Iniciar sesión', errorFallback: 'No se pudo crear tu cuenta. Inténtalo de nuevo.'
  }
};

export const COPY: Record<Lang, AppCopy> = { en: EN, es: ES };
