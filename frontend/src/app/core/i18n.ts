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

/** Grind options offered in the product picker (coffee only). "Each" is used for non-coffee. */
export const GRIND_OPTIONS = ['Whole bean', 'Filter', 'Espresso'] as const;

/** Maps an order status to one of the shared badge classes. */
export const STATUS_BADGE: Record<string, string> = {
  PendingPayment: 'badge-warn', Paid: 'badge-ok', Processing: 'badge-neutral',
  Shipped: 'badge-neutral', Delivered: 'badge-ok', Cancelled: 'badge-danger'
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
    subtotal: string; shipping: string; discount: string; total: string; free: string;
    quantity: string; remove: string; apply: string; cancel: string; save: string; saving: string;
    back: string; continueLabel: string; signInToContinue: string; verified: string;
    inStock: string; lowStock: string; size: string; grind: string; optional: string;
    page: string; of: string; prev: string; next: string;
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
  home: { featuredTitle: string; featuredSub: string; viewAll: string; empty: string; };
  shop: {
    title: string; resultsOne: string; resultsMany: string; filters: string; sortBy: string;
    sortFeatured: string; sortPriceAsc: string; sortPriceDesc: string; sortRating: string; sortNewest: string;
    category: string; allCategories: string; roast: string; process: string; price: string; minPrice: string; maxPrice: string;
    apply: string; clearAll: string; emptyTitle: string; emptyBody: string; searchPlaceholder: string;
  };
  product: {
    addToBag: string; adding: string; reviewsTitle: string; writeReview: string; noReviews: string; noReviewsBody: string;
    yourRating: string; reviewTitle: string; reviewTitlePh: string; reviewBody: string; reviewBodyPh: string;
    submit: string; submitting: string; signInToReview: string; alreadyReviewed: string; reviewThanks: string;
    tasteNotes: string; origin: string; region: string; altitude: string; roastLabel: string; processLabel: string;
    addToWishlist: string; inWishlist: string; backToShop: string; relatedSize: string; perItem: string;
  };
  cart: {
    title: string; emptyTitle: string; emptyBody: string; startShopping: string; item: string; items: string;
    couponPlaceholder: string; couponApplied: string; couponInvalid: string; orderSummary: string;
    checkout: string; freeShippingHint: string; signInToCheckout: string; remove: string; estShipping: string;
  };
  checkout: {
    title: string; stepShipping: string; stepPayment: string; stepReview: string;
    contact: string; email: string; shippingAddress: string; fullName: string; line1: string; line2: string;
    city: string; state: string; postalCode: string; country: string; phone: string;
    continueToPayment: string; paymentMethod: string; card: string; testMode: string; testModeNote: string;
    cardNumber: string; expires: string; cvc: string; continueToReview: string; reviewOrder: string;
    placeOrder: string; placing: string; backToShipping: string; backToPayment: string; encrypted: string;
    yourOrder: string; orderError: string; shipTo: string; payWith: string; edit: string; emptyRedirect: string;
  };
  confirmation: {
    title: string; subtitle: string; orderNumber: string; whatNext: string; nextBody: string;
    viewOrders: string; keepShopping: string; emailedTo: string;
  };
  account: {
    ordersTitle: string; ordersEmpty: string; ordersEmptyBody: string; orderCol: string; dateCol: string;
    statusCol: string; totalCol: string; itemsCol: string; viewOrder: string; orderDetail: string;
    placedOn: string; paidOn: string; backToOrders: string; itemsHeading: string; shippingHeading: string;
  };
  wishlist: { title: string; empty: string; emptyBody: string; browse: string; moveToBag: string; };
  admin: {
    title: string; navDashboard: string; navProducts: string; navOrders: string;
    revenue: string; paidOrders: string; aov: string; pending: string; topProducts: string; salesByDay: string;
    lowStock: string; unitsSold: string; ordersByStatus: string; allGood: string;
    productCol: string; categoryCol: string; stockCol: string; ratingCol: string; priceCol: string; statusCol: string;
    active: string; inactive: string; featured: string; editVariants: string; variantsFor: string;
    sku: string; priceLabel: string; stockLabel: string; saveVariant: string; saved: string;
    orderCustomer: string; orderStatus: string; orderTotal: string; advance: string; cancel: string;
    advanceConfirm: string; cancelConfirm: string; filterStatus: string; allStatuses: string; noOrders: string; noProducts: string;
  };
  demo: {
    badge: string; title: string; intro: string; tourStart: string; tourSkip: string; tourNext: string;
    tourBack: string; tourDone: string; roleCustomer: string; roleAdmin: string; roleGuest: string;
    guideTitle: string; steps: { title: string; body: string }[];
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
    reviews: 'reviews', viewDetails: 'View details', search: 'Search', clear: 'Clear', close: 'Close',
    subtotal: 'Subtotal', shipping: 'Shipping', discount: 'Discount', total: 'Total', free: 'Free',
    quantity: 'Quantity', remove: 'Remove', apply: 'Apply', cancel: 'Cancel', save: 'Save', saving: 'Saving…',
    back: 'Back', continueLabel: 'Continue', signInToContinue: 'Sign in to continue', verified: 'Verified purchase',
    inStock: 'In stock', lowStock: 'Only a few left', size: 'Size', grind: 'Grind', optional: 'optional',
    page: 'Page', of: 'of', prev: 'Previous', next: 'Next'
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
  },
  home: {
    featuredTitle: "This week's featured lots", featuredSub: 'Roasted this Monday — shipping while supplies last.',
    viewAll: 'View all coffees →', empty: 'No featured coffees right now — browse the full shop.'
  },
  shop: {
    title: 'Shop', resultsOne: 'coffee', resultsMany: 'coffees', filters: 'Filters', sortBy: 'Sort by',
    sortFeatured: 'Featured', sortPriceAsc: 'Price: low to high', sortPriceDesc: 'Price: high to low',
    sortRating: 'Top rated', sortNewest: 'Newest', category: 'Category', allCategories: 'All categories',
    roast: 'Roast level', process: 'Process', price: 'Price', minPrice: 'Min', maxPrice: 'Max',
    apply: 'Apply filters', clearAll: 'Clear all', emptyTitle: 'No coffees match those filters',
    emptyBody: 'Try widening your price range or clearing a filter.', searchPlaceholder: 'Search coffees, origins, notes…'
  },
  product: {
    addToBag: 'Add to bag', adding: 'Adding…', reviewsTitle: 'Reviews', writeReview: 'Write a review',
    noReviews: 'No reviews yet', noReviewsBody: 'Be the first to share your tasting notes.',
    yourRating: 'Your rating', reviewTitle: 'Title', reviewTitlePh: 'Sum it up in a few words',
    reviewBody: 'Your review', reviewBodyPh: 'What did you taste? How did you brew it?',
    submit: 'Post review', submitting: 'Posting…', signInToReview: 'Sign in to write a review',
    alreadyReviewed: "You've already reviewed this coffee.", reviewThanks: 'Thanks — your review is published.',
    tasteNotes: 'Tasting notes', origin: 'Origin', region: 'Region', altitude: 'Altitude', roastLabel: 'Roast',
    processLabel: 'Process', addToWishlist: 'Save to wishlist', inWishlist: 'In your wishlist',
    backToShop: '← Back to shop', relatedSize: 'per', perItem: 'each'
  },
  cart: {
    title: 'Your cart', emptyTitle: 'Your cart is empty', emptyBody: 'Add a bag of fresh-roasted coffee to get started.',
    startShopping: 'Start shopping', item: 'item', items: 'items',
    couponPlaceholder: 'Promo code', couponApplied: 'applied', couponInvalid: "That code isn't valid.",
    orderSummary: 'Order summary', checkout: 'Checkout', freeShippingHint: 'away from free shipping',
    signInToCheckout: 'Sign in to checkout', remove: 'Remove', estShipping: 'Estimated shipping'
  },
  checkout: {
    title: 'Checkout', stepShipping: 'Shipping', stepPayment: 'Payment', stepReview: 'Review',
    contact: 'Contact', email: 'Email', shippingAddress: 'Shipping address', fullName: 'Full name',
    line1: 'Address', line2: 'Apartment, suite, etc.', city: 'City', state: 'State', postalCode: 'Postal code',
    country: 'Country', phone: 'Phone', continueToPayment: 'Continue to payment', paymentMethod: 'Payment method',
    card: 'Credit or debit card', testMode: 'Stripe test mode', testModeNote: 'No real charge — use card 4242 4242 4242 4242.',
    cardNumber: 'Card number', expires: 'Expires', cvc: 'CVC', continueToReview: 'Review order →',
    reviewOrder: 'Review your order', placeOrder: 'Place order', placing: 'Placing your order…',
    backToShipping: '← Edit shipping', backToPayment: '← Edit payment', encrypted: 'Payments encrypted end-to-end',
    yourOrder: 'Your order', orderError: "We couldn't place your order. Please try again.",
    shipTo: 'Ship to', payWith: 'Pay with', edit: 'Edit', emptyRedirect: 'Your cart is empty — nothing to check out.'
  },
  confirmation: {
    title: 'Order confirmed', subtitle: 'Thanks for supporting small-batch roasting.',
    orderNumber: 'Order number', whatNext: "What's next?",
    nextBody: "We'll roast your coffee on the next roast day and email tracking when it ships.",
    viewOrders: 'View my orders', keepShopping: 'Keep shopping', emailedTo: 'A receipt was sent to'
  },
  account: {
    ordersTitle: 'My orders', ordersEmpty: 'No orders yet', ordersEmptyBody: 'When you place an order it will show up here.',
    orderCol: 'Order', dateCol: 'Date', statusCol: 'Status', totalCol: 'Total', itemsCol: 'Items',
    viewOrder: 'View', orderDetail: 'Order', placedOn: 'Placed on', paidOn: 'Paid on',
    backToOrders: '← Back to orders', itemsHeading: 'Items', shippingHeading: 'Shipping'
  },
  wishlist: {
    title: 'Wishlist', empty: 'Your wishlist is empty', emptyBody: 'Tap the heart on any coffee to save it for later.',
    browse: 'Browse coffees', moveToBag: 'Add to bag'
  },
  admin: {
    title: 'Admin', navDashboard: 'Dashboard', navProducts: 'Products', navOrders: 'Orders',
    revenue: 'Revenue', paidOrders: 'Paid orders', aov: 'Avg. order value', pending: 'Pending',
    topProducts: 'Top products', salesByDay: 'Sales (last 14 days)', lowStock: 'Low stock', unitsSold: 'sold',
    ordersByStatus: 'Orders by status', allGood: 'Everything is well stocked.',
    productCol: 'Product', categoryCol: 'Category', stockCol: 'Stock', ratingCol: 'Rating', priceCol: 'From',
    statusCol: 'Status', active: 'Active', inactive: 'Hidden', featured: 'Featured', editVariants: 'Edit variants',
    variantsFor: 'Variants', sku: 'SKU', priceLabel: 'Price', stockLabel: 'Stock', saveVariant: 'Save', saved: 'Saved',
    orderCustomer: 'Customer', orderStatus: 'Status', orderTotal: 'Total', advance: 'Advance status', cancel: 'Cancel',
    advanceConfirm: 'Advance this order to the next status?', cancelConfirm: 'Cancel this order and restock?',
    filterStatus: 'Status', allStatuses: 'All statuses', noOrders: 'No orders match.', noProducts: 'No products found.'
  },
  demo: {
    badge: 'Demo', title: 'Welcome to the ShopForge demo',
    intro: 'A full coffee storefront — browse, add to cart, and check out with Stripe test mode. Two demo accounts let you see both sides.',
    tourStart: 'Take the tour', tourSkip: 'Skip', tourNext: 'Next', tourBack: 'Back', tourDone: 'Got it',
    roleCustomer: 'Customer', roleAdmin: 'Admin', roleGuest: 'Guest', guideTitle: 'Demo guide',
    steps: [
      { title: 'Browse the catalog', body: 'Filter by roast, process and price, or search by origin and tasting notes.' },
      { title: 'Add to your cart', body: 'Pick a size and grind on any coffee. Your cart is saved even before you sign in.' },
      { title: 'Check out with Stripe', body: 'Use test card 4242 4242 4242 4242 — no real charge is ever made.' },
      { title: 'Sign in as Admin', body: 'Use the Admin demo account to see the sales dashboard, products and order fulfilment.' }
    ]
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
    reviews: 'reseñas', viewDetails: 'Ver detalle', search: 'Buscar', clear: 'Limpiar', close: 'Cerrar',
    subtotal: 'Subtotal', shipping: 'Envío', discount: 'Descuento', total: 'Total', free: 'Gratis',
    quantity: 'Cantidad', remove: 'Quitar', apply: 'Aplicar', cancel: 'Cancelar', save: 'Guardar', saving: 'Guardando…',
    back: 'Volver', continueLabel: 'Continuar', signInToContinue: 'Inicia sesión para continuar', verified: 'Compra verificada',
    inStock: 'En stock', lowStock: 'Quedan pocas', size: 'Tamaño', grind: 'Molienda', optional: 'opcional',
    page: 'Página', of: 'de', prev: 'Anterior', next: 'Siguiente'
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
  },
  home: {
    featuredTitle: 'Destacados de la semana', featuredSub: 'Tostados este lunes — hasta agotar existencias.',
    viewAll: 'Ver todos los cafés →', empty: 'Sin destacados por ahora — explora la tienda completa.'
  },
  shop: {
    title: 'Tienda', resultsOne: 'café', resultsMany: 'cafés', filters: 'Filtros', sortBy: 'Ordenar por',
    sortFeatured: 'Destacados', sortPriceAsc: 'Precio: menor a mayor', sortPriceDesc: 'Precio: mayor a menor',
    sortRating: 'Mejor valorados', sortNewest: 'Novedades', category: 'Categoría', allCategories: 'Todas las categorías',
    roast: 'Tueste', process: 'Proceso', price: 'Precio', minPrice: 'Mín', maxPrice: 'Máx',
    apply: 'Aplicar filtros', clearAll: 'Limpiar todo', emptyTitle: 'Ningún café coincide con esos filtros',
    emptyBody: 'Prueba ampliar el rango de precio o quitar un filtro.', searchPlaceholder: 'Busca cafés, orígenes, notas…'
  },
  product: {
    addToBag: 'Añadir al carrito', adding: 'Añadiendo…', reviewsTitle: 'Reseñas', writeReview: 'Escribir reseña',
    noReviews: 'Aún no hay reseñas', noReviewsBody: 'Sé el primero en compartir tus notas de cata.',
    yourRating: 'Tu calificación', reviewTitle: 'Título', reviewTitlePh: 'Resúmelo en pocas palabras',
    reviewBody: 'Tu reseña', reviewBodyPh: '¿Qué notas encontraste? ¿Cómo lo preparaste?',
    submit: 'Publicar reseña', submitting: 'Publicando…', signInToReview: 'Inicia sesión para escribir una reseña',
    alreadyReviewed: 'Ya reseñaste este café.', reviewThanks: 'Gracias — tu reseña está publicada.',
    tasteNotes: 'Notas de cata', origin: 'Origen', region: 'Región', altitude: 'Altitud', roastLabel: 'Tueste',
    processLabel: 'Proceso', addToWishlist: 'Guardar en favoritos', inWishlist: 'En tus favoritos',
    backToShop: '← Volver a la tienda', relatedSize: 'por', perItem: 'c/u'
  },
  cart: {
    title: 'Tu carrito', emptyTitle: 'Tu carrito está vacío', emptyBody: 'Añade una bolsa de café recién tostado para empezar.',
    startShopping: 'Empezar a comprar', item: 'artículo', items: 'artículos',
    couponPlaceholder: 'Código promo', couponApplied: 'aplicado', couponInvalid: 'Ese código no es válido.',
    orderSummary: 'Resumen del pedido', checkout: 'Pagar', freeShippingHint: 'para envío gratis',
    signInToCheckout: 'Inicia sesión para pagar', remove: 'Quitar', estShipping: 'Envío estimado'
  },
  checkout: {
    title: 'Pago', stepShipping: 'Envío', stepPayment: 'Pago', stepReview: 'Confirmar',
    contact: 'Contacto', email: 'Email', shippingAddress: 'Dirección de envío', fullName: 'Nombre completo',
    line1: 'Dirección', line2: 'Apartamento, suite, etc.', city: 'Ciudad', state: 'Estado/Provincia', postalCode: 'Código postal',
    country: 'País', phone: 'Teléfono', continueToPayment: 'Continuar al pago', paymentMethod: 'Método de pago',
    card: 'Tarjeta de crédito o débito', testMode: 'Modo de prueba de Stripe', testModeNote: 'Sin cargo real — usa la tarjeta 4242 4242 4242 4242.',
    cardNumber: 'Número de tarjeta', expires: 'Vence', cvc: 'CVC', continueToReview: 'Revisar pedido →',
    reviewOrder: 'Revisa tu pedido', placeOrder: 'Confirmar pedido', placing: 'Procesando tu pedido…',
    backToShipping: '← Editar envío', backToPayment: '← Editar pago', encrypted: 'Pago cifrado de extremo a extremo',
    yourOrder: 'Tu pedido', orderError: 'No pudimos procesar tu pedido. Inténtalo de nuevo.',
    shipTo: 'Enviar a', payWith: 'Pagar con', edit: 'Editar', emptyRedirect: 'Tu carrito está vacío — nada que pagar.'
  },
  confirmation: {
    title: 'Pedido confirmado', subtitle: 'Gracias por apoyar el tueste de lotes pequeños.',
    orderNumber: 'Número de pedido', whatNext: '¿Qué sigue?',
    nextBody: 'Tostaremos tu café el próximo día de tueste y te enviaremos el seguimiento al despacharlo.',
    viewOrders: 'Ver mis pedidos', keepShopping: 'Seguir comprando', emailedTo: 'Enviamos un recibo a'
  },
  account: {
    ordersTitle: 'Mis pedidos', ordersEmpty: 'Aún no tienes pedidos', ordersEmptyBody: 'Cuando hagas un pedido aparecerá aquí.',
    orderCol: 'Pedido', dateCol: 'Fecha', statusCol: 'Estado', totalCol: 'Total', itemsCol: 'Artículos',
    viewOrder: 'Ver', orderDetail: 'Pedido', placedOn: 'Realizado el', paidOn: 'Pagado el',
    backToOrders: '← Volver a pedidos', itemsHeading: 'Artículos', shippingHeading: 'Envío'
  },
  wishlist: {
    title: 'Favoritos', empty: 'Tu lista de favoritos está vacía', emptyBody: 'Toca el corazón en cualquier café para guardarlo.',
    browse: 'Explorar cafés', moveToBag: 'Añadir al carrito'
  },
  admin: {
    title: 'Admin', navDashboard: 'Panel', navProducts: 'Productos', navOrders: 'Pedidos',
    revenue: 'Ingresos', paidOrders: 'Pedidos pagados', aov: 'Ticket medio', pending: 'Pendientes',
    topProducts: 'Top productos', salesByDay: 'Ventas (últimos 14 días)', lowStock: 'Stock bajo', unitsSold: 'vendidos',
    ordersByStatus: 'Pedidos por estado', allGood: 'Todo bien abastecido.',
    productCol: 'Producto', categoryCol: 'Categoría', stockCol: 'Stock', ratingCol: 'Rating', priceCol: 'Desde',
    statusCol: 'Estado', active: 'Activo', inactive: 'Oculto', featured: 'Destacado', editVariants: 'Editar variantes',
    variantsFor: 'Variantes', sku: 'SKU', priceLabel: 'Precio', stockLabel: 'Stock', saveVariant: 'Guardar', saved: 'Guardado',
    orderCustomer: 'Cliente', orderStatus: 'Estado', orderTotal: 'Total', advance: 'Avanzar estado', cancel: 'Cancelar',
    advanceConfirm: '¿Avanzar este pedido al siguiente estado?', cancelConfirm: '¿Cancelar este pedido y reponer stock?',
    filterStatus: 'Estado', allStatuses: 'Todos los estados', noOrders: 'Ningún pedido coincide.', noProducts: 'No se encontraron productos.'
  },
  demo: {
    badge: 'Demo', title: 'Bienvenido a la demo de ShopForge',
    intro: 'Una tienda de café completa — explora, añade al carrito y paga con el modo de prueba de Stripe. Dos cuentas demo te dejan ver ambos lados.',
    tourStart: 'Hacer el tour', tourSkip: 'Omitir', tourNext: 'Siguiente', tourBack: 'Atrás', tourDone: 'Entendido',
    roleCustomer: 'Cliente', roleAdmin: 'Admin', roleGuest: 'Invitado', guideTitle: 'Guía de la demo',
    steps: [
      { title: 'Explora el catálogo', body: 'Filtra por tueste, proceso y precio, o busca por origen y notas de cata.' },
      { title: 'Añade al carrito', body: 'Elige tamaño y molienda en cualquier café. Tu carrito se guarda incluso antes de iniciar sesión.' },
      { title: 'Paga con Stripe', body: 'Usa la tarjeta de prueba 4242 4242 4242 4242 — nunca se hace un cargo real.' },
      { title: 'Entra como Admin', body: 'Usa la cuenta demo Admin para ver el panel de ventas, productos y la gestión de pedidos.' }
    ]
  }
};

export const COPY: Record<Lang, AppCopy> = { en: EN, es: ES };
