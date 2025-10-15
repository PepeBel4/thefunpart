import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

type TranslationParams = Record<string, string | number | boolean>;

type TranslationDictionary = Record<string, Record<string, string>>;

type SupportedLanguage = {
  code: string;
  label: string;
  locale: string;
};

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'thefunpart:language';

  readonly languages: SupportedLanguage[] = [
    { code: 'en', label: 'English', locale: 'en-US' },
    { code: 'es', label: 'Español', locale: 'es-ES' },
  ];

  private readonly translations: TranslationDictionary = {
    en: {
      'nav.deliveryChip': 'Deliver now • 15-25 min',
      'nav.discover': 'Discover',
      'nav.orders': 'Orders',
      'nav.manage': 'Manage',
      'nav.cart': 'Cart ({{count}})',
      'nav.logout': 'Logout',
      'nav.login': 'Log in',
      'nav.languageLabel': 'Language',
      'nav.languageAria': 'Select website language',

      'cookie.title': 'We use cookies',
      'cookie.message':
        'This website uses cookies to enhance your experience, provide essential site functionality, and analyze traffic. By clicking "Accept all" you agree to the storing of cookies on your device.',
      'cookie.accept': 'Accept all',
      'cookie.decline': 'Decline',

      'cart.title': 'Your cart',
      'cart.itemsOne': '{{count}} item',
      'cart.itemsMany': '{{count}} items',
      'cart.empty': 'Add something tasty from the menu to start an order.',
      'cart.subtotal': 'Subtotal',
      'cart.checkout': 'Go to checkout',
      'cart.decrease': 'Decrease quantity',
      'cart.increase': 'Increase quantity',
      'cart.remove': 'Remove item',

      'checkout.title': 'Checkout',
      'checkout.subtitle': 'Confirm your delivery and get ready for a delicious drop-off.',
      'checkout.total': 'Total',
      'checkout.placeOrder': 'Place order',

      'orders.title': 'Your orders',
      'orders.subtitle': 'Track deliveries and revisit your favourite meals.',
      'orders.totalLabel': 'Total:',
      'orders.view': 'View details',
      'orders.loading': 'Loading orders…',
      'orders.empty': 'No orders yet.',

      'orderDetail.title': 'Order #{{id}}',
      'orderDetail.subtitle': '{{status}} • Placed {{date}}',
      'orderDetail.itemsHeading': 'Items',
      'orderDetail.total': 'Total',
      'orderDetail.customerFavourite': 'Customer favourite',

      'restaurants.heading': 'Discover near you',
      'restaurants.subheading': 'Hand-picked favourites delivering fast, just like the Uber Eats app.',
      'restaurants.defaultDescription': 'Popular choices • Comfort food',
      'restaurants.express': 'Express',
      'restaurants.duration': '20-30 min',
      'restaurants.freeDelivery': 'Free delivery over €15',
      'restaurants.menuHeading': 'Menu',
      'restaurants.otherItems': 'Other items',

      'restaurantDetail.descriptionFallback': 'Fresh meals, crafted for delivery.',
      'restaurantDetail.tagPopular': 'Popular',
      'restaurantDetail.customerFavourite': 'Customer favourite',
      'restaurantDetail.addToCart': 'Add to cart',
      'restaurantDetail.photosUploaded': 'Photos uploaded successfully!',
      'restaurantDetail.photosError': 'Something went wrong while uploading photos. Please try again.',
      'restaurantDetail.photoRemoved': 'Photo removed.',
      'restaurantDetail.photoRemoveError': 'Unable to remove the photo. Please try again.',
      'restaurantDetail.removePhotoConfirm': 'Remove this photo?',

      'login.title': 'Welcome back',
      'login.subtitle': 'Sign in to keep your cravings satisfied.',
      'login.email': 'Email',
      'login.password': 'Password',
      'login.submit': 'Log in',

      'admin.title': 'Restaurant admin',
      'admin.subtitle': 'Upload fresh visuals and keep track of recent orders — all in one convenient place.',
      'admin.manage.heading': 'Manage restaurant',
      'admin.manage.description': "Choose which location you'd like to update.",
      'admin.manage.select': 'Choose restaurant',
      'admin.manage.loading': 'Loading restaurants…',
      'admin.manage.empty': 'No restaurants found.',
      'admin.photos.heading': 'Restaurant photos',
      'admin.photos.description': 'Keep your storefront up to date by refreshing the gallery.',
      'admin.photos.removing': 'Removing…',
      'admin.photos.remove': 'Remove',
      'admin.photos.upload': 'Upload photos',
      'admin.photos.uploading': 'Uploading…',
      'admin.photos.readyOne': '1 file ready',
      'admin.photos.readyMany': '{{count}} files ready',
      'admin.managePlaceholder.title': 'Manage restaurant content',
      'admin.managePlaceholder.description': 'Choose a restaurant above to start uploading photos and editing menus.',

      'admin.orders.heading': 'Recent orders',
      'admin.orders.description': 'Review recent activity to keep operations running smoothly.',
      'admin.orders.unknownRestaurant': 'Unknown restaurant',
      'admin.orders.loading': 'Loading orders…',
      'admin.orders.empty': 'No orders yet.',
      'admin.orders.meta': 'Placed {{date}} · Status: {{status}}',
      'admin.orders.customer': 'Customer: {{email}}',

      'menu.manage.heading': 'Manage menu',
      'menu.manage.description': 'Add new dishes or update existing ones in just a few clicks.',
      'menu.form.nameLabel': 'Item name',
      'menu.form.namePlaceholder': 'e.g. Spicy Tuna Roll',
      'menu.form.descriptionLabel': 'Description',
      'menu.form.descriptionPlaceholder': 'Optional description',
      'menu.form.priceLabel': 'Price (EUR)',
      'menu.form.pricePlaceholder': '9.50',
      'menu.form.add': 'Add item',
      'menu.form.saving': 'Saving…',
      'menu.form.status': 'Menu item added!',
      'menu.form.error.load': 'Could not load menu items. Please try again.',
      'menu.form.error.price': 'Enter a valid price (e.g. 9.99).',
      'menu.form.error.create': 'Unable to add the menu item. Please try again.',
      'menu.form.error.update': 'Unable to save changes. Please try again.',
      'menu.form.error.remove': 'Unable to remove the item. Please try again.',
      'menu.form.loading': 'Loading menu…',
      'menu.items.empty': 'No menu items yet. Start by adding your first dish.',
      'menu.items.name': 'Name',
      'menu.items.description': 'Description',
      'menu.items.price': 'Price (EUR)',
      'menu.items.cancel': 'Cancel',
      'menu.items.save': 'Save changes',
      'menu.items.edit': 'Edit',
      'menu.items.delete': 'Delete',
      'menu.items.removeConfirm': 'Remove this menu item?',

      'status.uploading': 'Uploading…',
      'status.removing': 'Removing…',

      'general.loading': 'Loading…',
    },
    es: {
      'nav.deliveryChip': 'Entregar ahora • 15-25 min',
      'nav.discover': 'Descubrir',
      'nav.orders': 'Pedidos',
      'nav.manage': 'Gestionar',
      'nav.cart': 'Carrito ({{count}})',
      'nav.logout': 'Cerrar sesión',
      'nav.login': 'Iniciar sesión',
      'nav.languageLabel': 'Idioma',
      'nav.languageAria': 'Seleccionar idioma del sitio web',

      'cookie.title': 'Utilizamos cookies',
      'cookie.message':
        'Este sitio web utiliza cookies para mejorar tu experiencia, proporcionar funciones esenciales y analizar el tráfico. Al hacer clic en "Aceptar todo" aceptas que se guarden cookies en tu dispositivo.',
      'cookie.accept': 'Aceptar todo',
      'cookie.decline': 'Rechazar',

      'cart.title': 'Tu carrito',
      'cart.itemsOne': '{{count}} artículo',
      'cart.itemsMany': '{{count}} artículos',
      'cart.empty': 'Añade algo delicioso del menú para empezar un pedido.',
      'cart.subtotal': 'Subtotal',
      'cart.checkout': 'Ir al pago',
      'cart.decrease': 'Disminuir cantidad',
      'cart.increase': 'Aumentar cantidad',
      'cart.remove': 'Eliminar artículo',

      'checkout.title': 'Pago',
      'checkout.subtitle': 'Confirma tu entrega y prepárate para un delicioso reparto.',
      'checkout.total': 'Total',
      'checkout.placeOrder': 'Realizar pedido',

      'orders.title': 'Tus pedidos',
      'orders.subtitle': 'Sigue tus entregas y vuelve a tus platos favoritos.',
      'orders.totalLabel': 'Total:',
      'orders.view': 'Ver detalles',
      'orders.loading': 'Cargando pedidos…',
      'orders.empty': 'Aún no hay pedidos.',

      'orderDetail.title': 'Pedido #{{id}}',
      'orderDetail.subtitle': '{{status}} • Realizado {{date}}',
      'orderDetail.itemsHeading': 'Artículos',
      'orderDetail.total': 'Total',
      'orderDetail.customerFavourite': 'Favorito de los clientes',

      'restaurants.heading': 'Descubre cerca de ti',
      'restaurants.subheading': 'Favoritos seleccionados que llegan rápido, como en la app de Uber Eats.',
      'restaurants.defaultDescription': 'Platos populares • Comida casera',
      'restaurants.express': 'Exprés',
      'restaurants.duration': '20-30 min',
      'restaurants.freeDelivery': 'Envío gratis a partir de 15 €',
      'restaurants.menuHeading': 'Menú',
      'restaurants.otherItems': 'Otros artículos',

      'restaurantDetail.descriptionFallback': 'Platos recién hechos, pensados para el envío.',
      'restaurantDetail.tagPopular': 'Popular',
      'restaurantDetail.customerFavourite': 'Favorito de los clientes',
      'restaurantDetail.addToCart': 'Añadir al carrito',
      'restaurantDetail.photosUploaded': '¡Fotos subidas correctamente!',
      'restaurantDetail.photosError': 'Algo salió mal al subir las fotos. Vuelve a intentarlo.',
      'restaurantDetail.photoRemoved': 'Foto eliminada.',
      'restaurantDetail.photoRemoveError': 'No se pudo eliminar la foto. Vuelve a intentarlo.',
      'restaurantDetail.removePhotoConfirm': '¿Eliminar esta foto?',

      'login.title': 'Bienvenido de nuevo',
      'login.subtitle': 'Inicia sesión para seguir saciando tus antojos.',
      'login.email': 'Correo electrónico',
      'login.password': 'Contraseña',
      'login.submit': 'Iniciar sesión',

      'admin.title': 'Administración del restaurante',
      'admin.subtitle': 'Sube nuevo contenido visual y controla los pedidos recientes en un solo lugar.',
      'admin.manage.heading': 'Gestionar restaurante',
      'admin.manage.description': 'Elige qué local quieres actualizar.',
      'admin.manage.select': 'Elegir restaurante',
      'admin.manage.loading': 'Cargando restaurantes…',
      'admin.manage.empty': 'No se encontraron restaurantes.',
      'admin.photos.heading': 'Fotos del restaurante',
      'admin.photos.description': 'Mantén tu escaparate al día renovando la galería.',
      'admin.photos.removing': 'Eliminando…',
      'admin.photos.remove': 'Eliminar',
      'admin.photos.upload': 'Subir fotos',
      'admin.photos.uploading': 'Subiendo…',
      'admin.photos.readyOne': '1 archivo listo',
      'admin.photos.readyMany': '{{count}} archivos listos',
      'admin.managePlaceholder.title': 'Gestionar contenido del restaurante',
      'admin.managePlaceholder.description': 'Elige un restaurante arriba para empezar a subir fotos y editar menús.',

      'admin.orders.heading': 'Pedidos recientes',
      'admin.orders.description': 'Revisa la actividad reciente para que todo funcione sin problemas.',
      'admin.orders.unknownRestaurant': 'Restaurante desconocido',
      'admin.orders.loading': 'Cargando pedidos…',
      'admin.orders.empty': 'Aún no hay pedidos.',
      'admin.orders.meta': 'Realizado {{date}} · Estado: {{status}}',
      'admin.orders.customer': 'Cliente: {{email}}',

      'menu.manage.heading': 'Gestionar menú',
      'menu.manage.description': 'Añade platos nuevos o actualiza los existentes en pocos clics.',
      'menu.form.nameLabel': 'Nombre del artículo',
      'menu.form.namePlaceholder': 'p. ej. Rollo de atún picante',
      'menu.form.descriptionLabel': 'Descripción',
      'menu.form.descriptionPlaceholder': 'Descripción opcional',
      'menu.form.priceLabel': 'Precio (EUR)',
      'menu.form.pricePlaceholder': '9,50',
      'menu.form.add': 'Añadir artículo',
      'menu.form.saving': 'Guardando…',
      'menu.form.status': '¡Artículo añadido al menú!',
      'menu.form.error.load': 'No se pudieron cargar los artículos del menú. Vuelve a intentarlo.',
      'menu.form.error.price': 'Introduce un precio válido (p. ej. 9,99).',
      'menu.form.error.create': 'No se pudo añadir el artículo del menú. Vuelve a intentarlo.',
      'menu.form.error.update': 'No se pudieron guardar los cambios. Vuelve a intentarlo.',
      'menu.form.error.remove': 'No se pudo eliminar el artículo. Vuelve a intentarlo.',
      'menu.form.loading': 'Cargando menú…',
      'menu.items.empty': 'Aún no hay artículos en el menú. Empieza añadiendo tu primer plato.',
      'menu.items.name': 'Nombre',
      'menu.items.description': 'Descripción',
      'menu.items.price': 'Precio (EUR)',
      'menu.items.cancel': 'Cancelar',
      'menu.items.save': 'Guardar cambios',
      'menu.items.edit': 'Editar',
      'menu.items.delete': 'Eliminar',
      'menu.items.removeConfirm': '¿Eliminar este artículo del menú?',

      'status.uploading': 'Subiendo…',
      'status.removing': 'Eliminando…',

      'general.loading': 'Cargando…',
    },
  };

  private readonly language = signal(this.detectInitialLanguage());

  readonly locale = signal(this.currentLanguage().locale);
  readonly languageSignal = this.language.asReadonly();
  readonly localeSignal = this.locale.asReadonly();

  constructor() {
    effect(() => {
      const current = this.language();
      const lang = this.languages.find((language) => language.code === current) ?? this.languages[0];
      if (this.isBrowser()) {
        try {
          window.localStorage.setItem(this.storageKey, lang.code);
        } catch {
          // ignore storage errors
        }
      }

      if (this.document?.documentElement) {
        this.document.documentElement.lang = lang.code;
      }

      this.locale.set(lang.locale);
    });
  }

  currentLanguage(): SupportedLanguage {
    const code = this.language();
    return this.languages.find((language) => language.code === code) ?? this.languages[0];
  }

  currentLocale(): string {
    return this.locale();
  }

  currentLanguageCode(): string {
    return this.currentLanguage().code;
  }

  setLanguage(code: string): void {
    if (!this.languages.some((lang) => lang.code === code)) {
      return;
    }

    this.language.set(code);
  }

  translate(key: string, fallback = '', params?: TranslationParams): string {
    const langCode = this.language();
    const normalizedKey = key?.trim();

    if (!normalizedKey) {
      return fallback;
    }

    const translation =
      this.translations[langCode]?.[normalizedKey] ??
      this.translations['en']?.[normalizedKey] ??
      fallback ??
      normalizedKey;

    if (!params) {
      return translation;
    }

    return translation.replace(/{{\s*(\w+)\s*}}/g, (_, token: string) => {
      const value = params[token];
      if (value === undefined || value === null) {
        return '';
      }
      if (typeof value === 'boolean') {
        return value ? 'true' : 'false';
      }
      return String(value);
    });
  }

  private detectInitialLanguage(): string {
    if (this.isBrowser()) {
      try {
        const stored = window.localStorage.getItem(this.storageKey);
        if (stored && this.languages.some((lang) => lang.code === stored)) {
          return stored;
        }
      } catch {
        // ignore storage errors
      }

      const navLanguages = Array.from(
        new Set(
          (navigator.languages && navigator.languages.length
            ? navigator.languages
            : [navigator.language])
            .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
            .map((value) => value.toLowerCase()),
        ),
      );

      for (const candidate of navLanguages) {
        const exact = this.languages.find((lang) => lang.locale.toLowerCase() === candidate);
        if (exact) {
          return exact.code;
        }

        const base = candidate.split('-')[0];
        const match = this.languages.find((lang) => lang.code.toLowerCase() === base);
        if (match) {
          return match.code;
        }
      }
    }

    return this.languages[0].code;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }
}
