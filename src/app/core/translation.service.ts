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
    { code: 'nl', label: 'Nederlands', locale: 'nl-NL' },
    { code: 'fr', label: 'Français', locale: 'fr-FR' },
    { code: 'de', label: 'Deutsch', locale: 'de-DE' },
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
      'admin.details.heading': 'Restaurant details',
      'admin.details.description': 'Edit the name and multi-language description guests see on the site.',
      'admin.details.nameLabel': 'Name ({{language}})',
      'admin.details.namePlaceholder': 'Enter the restaurant name',
      'admin.details.descriptionLabel': 'Description ({{language}})',
      'admin.details.descriptionPlaceholder': 'Describe the restaurant in {{language}}',
      'admin.details.save': 'Save details',
      'admin.details.saving': 'Saving…',
      'admin.details.saved': 'Restaurant details updated!',
      'admin.details.error': 'Unable to update the restaurant. Please try again.',
      'admin.details.requiredName': 'Enter at least one restaurant name.',

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
      'menu.photos.label': 'Item photos',
      'menu.photos.noteCreate': 'Optional: upload images to highlight this dish.',
      'menu.photos.noteEdit': 'New photos upload when you save changes.',
      'menu.photos.readyOne': '1 photo ready to upload',
      'menu.photos.readyMany': '{{count}} photos ready to upload',
      'menu.photos.clear': 'Clear selection',
      'menu.photos.empty': 'No photos yet.',
      'menu.photos.remove': 'Remove',
      'menu.photos.removeQueued': 'Remove photo',
      'menu.photos.removing': 'Removing…',
      'menu.photos.error.upload': 'Could not upload item photos. Please try again.',
      'menu.photos.error.delete': 'Could not remove the photo. Please try again.',

      'status.uploading': 'Uploading…',
      'status.removing': 'Removing…',

      'general.loading': 'Loading…',
    },
    nl: {
      'nav.deliveryChip': 'Nu bezorgen • 15-25 min',
      'nav.discover': 'Ontdek',
      'nav.orders': 'Bestellingen',
      'nav.manage': 'Beheren',
      'nav.cart': 'Winkelwagen ({{count}})',
      'nav.logout': 'Afmelden',
      'nav.login': 'Inloggen',
      'nav.languageLabel': 'Taal',
      'nav.languageAria': 'Selecteer website-taal',

      'cookie.title': 'Wij gebruiken cookies',
      'cookie.message':
        'Deze website gebruikt cookies om je ervaring te verbeteren, essentiële functionaliteit te bieden en het verkeer te analyseren. Door op "Alles accepteren" te klikken ga je akkoord met het opslaan van cookies op je apparaat.',
      'cookie.accept': 'Alles accepteren',
      'cookie.decline': 'Weigeren',

      'cart.title': 'Je winkelwagen',
      'cart.itemsOne': '{{count}} artikel',
      'cart.itemsMany': '{{count}} artikelen',
      'cart.empty': 'Voeg iets lekkers van het menu toe om een bestelling te starten.',
      'cart.subtotal': 'Subtotaal',
      'cart.checkout': 'Ga naar afrekenen',
      'cart.decrease': 'Aantal verlagen',
      'cart.increase': 'Aantal verhogen',
      'cart.remove': 'Item verwijderen',

      'checkout.title': 'Afrekenen',
      'checkout.subtitle': 'Bevestig je bezorging en maak je klaar voor een heerlijke levering.',
      'checkout.total': 'Totaal',
      'checkout.placeOrder': 'Bestelling plaatsen',

      'orders.title': 'Je bestellingen',
      'orders.subtitle': 'Volg bezorgingen en ontdek je favoriete gerechten opnieuw.',
      'orders.totalLabel': 'Totaal:',
      'orders.view': 'Details bekijken',
      'orders.loading': 'Bestellingen laden…',
      'orders.empty': 'Nog geen bestellingen.',

      'orderDetail.title': 'Bestelling #{{id}}',
      'orderDetail.subtitle': '{{status}} • Geplaatst {{date}}',
      'orderDetail.itemsHeading': 'Artikelen',
      'orderDetail.total': 'Totaal',
      'orderDetail.customerFavourite': 'Favoriet bij klanten',

      'restaurants.heading': 'Ontdek in jouw buurt',
      'restaurants.subheading': 'Met zorg geselecteerde favorieten die razendsnel bezorgen, net als in de Uber Eats-app.',
      'restaurants.defaultDescription': 'Populaire keuzes • Comfort food',
      'restaurants.express': 'Express',
      'restaurants.duration': '20-30 min',
      'restaurants.freeDelivery': 'Gratis bezorging boven €15',
      'restaurants.menuHeading': 'Menu',
      'restaurants.otherItems': 'Andere gerechten',

      'restaurantDetail.descriptionFallback': 'Verse maaltijden, gemaakt voor bezorging.',
      'restaurantDetail.tagPopular': 'Populair',
      'restaurantDetail.customerFavourite': 'Favoriet bij klanten',
      'restaurantDetail.addToCart': 'Toevoegen aan winkelwagen',
      'restaurantDetail.photosUploaded': 'Foto’s succesvol geüpload!',
      'restaurantDetail.photosError': 'Er is iets misgegaan bij het uploaden van de foto’s. Probeer het opnieuw.',
      'restaurantDetail.photoRemoved': 'Foto verwijderd.',
      'restaurantDetail.photoRemoveError': 'Foto kon niet worden verwijderd. Probeer het opnieuw.',
      'restaurantDetail.removePhotoConfirm': 'Deze foto verwijderen?',

      'login.title': 'Welkom terug',
      'login.subtitle': 'Log in om je trek tevreden te blijven stellen.',
      'login.email': 'E-mail',
      'login.password': 'Wachtwoord',
      'login.submit': 'Inloggen',

      'admin.title': 'Restaurantbeheer',
      'admin.subtitle': 'Upload nieuwe visuals en houd recente bestellingen bij — allemaal op één plek.',
      'admin.manage.heading': 'Restaurant beheren',
      'admin.manage.description': 'Kies welke locatie je wilt bijwerken.',
      'admin.manage.select': 'Selecteer restaurant',
      'admin.manage.loading': 'Restaurants laden…',
      'admin.manage.empty': 'Geen restaurants gevonden.',
      'admin.photos.heading': 'Restaurantfoto’s',
      'admin.photos.description': 'Houd je etalage up-to-date door de galerij te vernieuwen.',
      'admin.photos.removing': 'Verwijderen…',
      'admin.photos.remove': 'Verwijderen',
      'admin.photos.upload': 'Foto’s uploaden',
      'admin.photos.uploading': 'Uploaden…',
      'admin.photos.readyOne': '1 bestand klaar',
      'admin.photos.readyMany': '{{count}} bestanden klaar',
      'admin.managePlaceholder.title': 'Restaurantinhoud beheren',
      'admin.managePlaceholder.description': 'Kies hierboven een restaurant om foto’s te uploaden en menu’s te bewerken.',
      'admin.details.heading': 'Restaurantgegevens',
      'admin.details.description': 'Werk de naam en meertalige beschrijving bij die gasten zien.',
      'admin.details.nameLabel': 'Naam ({{language}})',
      'admin.details.namePlaceholder': 'Voer de restaurantnaam in',
      'admin.details.descriptionLabel': 'Beschrijving ({{language}})',
      'admin.details.descriptionPlaceholder': 'Beschrijf het restaurant in {{language}}',
      'admin.details.save': 'Gegevens opslaan',
      'admin.details.saving': 'Opslaan…',
      'admin.details.saved': 'Restaurantgegevens bijgewerkt!',
      'admin.details.error': 'Restaurant kon niet worden bijgewerkt. Probeer het opnieuw.',
      'admin.details.requiredName': 'Voer ten minste één restaurantnaam in.',

      'admin.orders.heading': 'Recente bestellingen',
      'admin.orders.description': 'Bekijk recente activiteit om alles soepel te laten verlopen.',
      'admin.orders.unknownRestaurant': 'Onbekend restaurant',
      'admin.orders.loading': 'Bestellingen laden…',
      'admin.orders.empty': 'Nog geen bestellingen.',
      'admin.orders.meta': 'Geplaatst {{date}} · Status: {{status}}',
      'admin.orders.customer': 'Klant: {{email}}',

      'menu.manage.heading': 'Menu beheren',
      'menu.manage.description': 'Voeg nieuwe gerechten toe of werk bestaande bij in slechts een paar klikken.',
      'menu.form.nameLabel': 'Naam van het item',
      'menu.form.namePlaceholder': 'bijv. Spicy Tuna Roll',
      'menu.form.descriptionLabel': 'Beschrijving',
      'menu.form.descriptionPlaceholder': 'Optionele beschrijving',
      'menu.form.priceLabel': 'Prijs (EUR)',
      'menu.form.pricePlaceholder': '9,50',
      'menu.form.add': 'Item toevoegen',
      'menu.form.saving': 'Opslaan…',
      'menu.form.status': 'Menu-item toegevoegd!',
      'menu.form.error.load': 'Menu-items konden niet worden geladen. Probeer het opnieuw.',
      'menu.form.error.price': 'Voer een geldige prijs in (bijv. 9,99).',
      'menu.form.error.create': 'Menu-item kan niet worden toegevoegd. Probeer het opnieuw.',
      'menu.form.error.update': 'Wijzigingen kunnen niet worden opgeslagen. Probeer het opnieuw.',
      'menu.form.error.remove': 'Item kan niet worden verwijderd. Probeer het opnieuw.',
      'menu.form.loading': 'Menu laden…',
      'menu.items.empty': 'Nog geen menu-items. Begin met het toevoegen van je eerste gerecht.',
      'menu.items.name': 'Naam',
      'menu.items.description': 'Beschrijving',
      'menu.items.price': 'Prijs (EUR)',
      'menu.items.cancel': 'Annuleren',
      'menu.items.save': 'Wijzigingen opslaan',
      'menu.items.edit': 'Bewerken',
      'menu.items.delete': 'Verwijderen',
      'menu.items.removeConfirm': 'Dit menu-item verwijderen?',
      'menu.photos.label': 'Itemfoto’s',
      'menu.photos.noteCreate': 'Optioneel: upload afbeeldingen om dit gerecht uit te lichten.',
      'menu.photos.noteEdit': 'Nieuwe foto’s worden geüpload wanneer je de wijzigingen opslaat.',
      'menu.photos.readyOne': '1 foto klaar om te uploaden',
      'menu.photos.readyMany': '{{count}} foto’s klaar om te uploaden',
      'menu.photos.clear': 'Selectie wissen',
      'menu.photos.empty': 'Nog geen foto’s.',
      'menu.photos.remove': 'Verwijderen',
      'menu.photos.removeQueued': 'Foto verwijderen',
      'menu.photos.removing': 'Wordt verwijderd…',
      'menu.photos.error.upload': 'Menu-itemfoto’s konden niet worden geüpload. Probeer het opnieuw.',
      'menu.photos.error.delete': 'De foto kon niet worden verwijderd. Probeer het opnieuw.',

      'status.uploading': 'Uploaden…',
      'status.removing': 'Verwijderen…',

      'general.loading': 'Laden…',
    },
    fr: {
      'nav.deliveryChip': 'Livrer maintenant • 15-25 min',
      'nav.discover': 'Découvrir',
      'nav.orders': 'Commandes',
      'nav.manage': 'Gérer',
      'nav.cart': 'Panier ({{count}})',
      'nav.logout': 'Se déconnecter',
      'nav.login': 'Se connecter',
      'nav.languageLabel': 'Langue',
      'nav.languageAria': 'Sélectionner la langue du site',

      'cookie.title': 'Nous utilisons des cookies',
      'cookie.message':
        'Ce site utilise des cookies pour améliorer votre expérience, fournir des fonctionnalités essentielles et analyser le trafic. En cliquant sur « Tout accepter », vous acceptez le stockage de cookies sur votre appareil.',
      'cookie.accept': 'Tout accepter',
      'cookie.decline': 'Refuser',

      'cart.title': 'Votre panier',
      'cart.itemsOne': '{{count}} article',
      'cart.itemsMany': '{{count}} articles',
      'cart.empty': 'Ajoutez quelque chose de délicieux au menu pour commencer une commande.',
      'cart.subtotal': 'Sous-total',
      'cart.checkout': 'Passer au paiement',
      'cart.decrease': 'Diminuer la quantité',
      'cart.increase': 'Augmenter la quantité',
      'cart.remove': 'Supprimer l’article',

      'checkout.title': 'Paiement',
      'checkout.subtitle': 'Confirmez votre livraison et préparez-vous à une arrivée gourmande.',
      'checkout.total': 'Total',
      'checkout.placeOrder': 'Passer la commande',

      'orders.title': 'Vos commandes',
      'orders.subtitle': 'Suivez vos livraisons et retrouvez vos plats préférés.',
      'orders.totalLabel': 'Total :',
      'orders.view': 'Voir les détails',
      'orders.loading': 'Chargement des commandes…',
      'orders.empty': 'Aucune commande pour le moment.',

      'orderDetail.title': 'Commande n°{{id}}',
      'orderDetail.subtitle': '{{status}} • Passée le {{date}}',
      'orderDetail.itemsHeading': 'Articles',
      'orderDetail.total': 'Total',
      'orderDetail.customerFavourite': 'Favori des clients',

      'restaurants.heading': 'Découvrez près de chez vous',
      'restaurants.subheading': 'Des favoris soigneusement sélectionnés livrés rapidement, comme sur l’application Uber Eats.',
      'restaurants.defaultDescription': 'Choix populaires • Comfort food',
      'restaurants.express': 'Express',
      'restaurants.duration': '20-30 min',
      'restaurants.freeDelivery': 'Livraison gratuite dès 15 €',
      'restaurants.menuHeading': 'Menu',
      'restaurants.otherItems': 'Autres articles',

      'restaurantDetail.descriptionFallback': 'Des repas frais, pensés pour la livraison.',
      'restaurantDetail.tagPopular': 'Populaire',
      'restaurantDetail.customerFavourite': 'Favori des clients',
      'restaurantDetail.addToCart': 'Ajouter au panier',
      'restaurantDetail.photosUploaded': 'Photos téléchargées avec succès !',
      'restaurantDetail.photosError': 'Une erreur est survenue lors du téléchargement des photos. Veuillez réessayer.',
      'restaurantDetail.photoRemoved': 'Photo supprimée.',
      'restaurantDetail.photoRemoveError': 'Impossible de supprimer la photo. Veuillez réessayer.',
      'restaurantDetail.removePhotoConfirm': 'Supprimer cette photo ?',

      'login.title': 'Bon retour',
      'login.subtitle': 'Connectez-vous pour continuer à satisfaire vos envies.',
      'login.email': 'E-mail',
      'login.password': 'Mot de passe',
      'login.submit': 'Se connecter',

      'admin.title': 'Administration du restaurant',
      'admin.subtitle': 'Mettez en ligne de nouveaux visuels et suivez les commandes récentes — tout au même endroit.',
      'admin.manage.heading': 'Gérer le restaurant',
      'admin.manage.description': 'Choisissez l’établissement que vous souhaitez mettre à jour.',
      'admin.manage.select': 'Choisir un restaurant',
      'admin.manage.loading': 'Chargement des restaurants…',
      'admin.manage.empty': 'Aucun restaurant trouvé.',
      'admin.photos.heading': 'Photos du restaurant',
      'admin.photos.description': 'Gardez votre vitrine à jour en rafraîchissant la galerie.',
      'admin.photos.removing': 'Suppression…',
      'admin.photos.remove': 'Supprimer',
      'admin.photos.upload': 'Télécharger des photos',
      'admin.photos.uploading': 'Téléchargement…',
      'admin.photos.readyOne': '1 fichier prêt',
      'admin.photos.readyMany': '{{count}} fichiers prêts',
      'admin.managePlaceholder.title': 'Gérer le contenu du restaurant',
      'admin.managePlaceholder.description': 'Choisissez un restaurant ci-dessus pour téléverser des photos et modifier les menus.',
      'admin.details.heading': 'Informations sur le restaurant',
      'admin.details.description': 'Mettez à jour le nom et la description multilingue visibles par les clients.',
      'admin.details.nameLabel': 'Nom ({{language}})',
      'admin.details.namePlaceholder': 'Saisissez le nom du restaurant',
      'admin.details.descriptionLabel': 'Description ({{language}})',
      'admin.details.descriptionPlaceholder': 'Décrivez le restaurant en {{language}}',
      'admin.details.save': 'Enregistrer les informations',
      'admin.details.saving': 'Enregistrement…',
      'admin.details.saved': 'Informations du restaurant mises à jour !',
      'admin.details.error': 'Impossible de mettre à jour le restaurant. Veuillez réessayer.',
      'admin.details.requiredName': 'Indiquez au moins un nom de restaurant.',

      'admin.orders.heading': 'Commandes récentes',
      'admin.orders.description': 'Consultez l’activité récente pour assurer la fluidité des opérations.',
      'admin.orders.unknownRestaurant': 'Restaurant inconnu',
      'admin.orders.loading': 'Chargement des commandes…',
      'admin.orders.empty': 'Aucune commande pour le moment.',
      'admin.orders.meta': 'Passée le {{date}} · Statut : {{status}}',
      'admin.orders.customer': 'Client : {{email}}',

      'menu.manage.heading': 'Gérer le menu',
      'menu.manage.description': 'Ajoutez de nouveaux plats ou mettez à jour les existants en quelques clics.',
      'menu.form.nameLabel': 'Nom de l’article',
      'menu.form.namePlaceholder': 'ex. Spicy Tuna Roll',
      'menu.form.descriptionLabel': 'Description',
      'menu.form.descriptionPlaceholder': 'Description optionnelle',
      'menu.form.priceLabel': 'Prix (EUR)',
      'menu.form.pricePlaceholder': '9,50',
      'menu.form.add': 'Ajouter un article',
      'menu.form.saving': 'Enregistrement…',
      'menu.form.status': 'Article ajouté au menu !',
      'menu.form.error.load': 'Impossible de charger les articles du menu. Veuillez réessayer.',
      'menu.form.error.price': 'Entrez un prix valide (ex. 9,99).',
      'menu.form.error.create': 'Impossible d’ajouter l’article du menu. Veuillez réessayer.',
      'menu.form.error.update': 'Impossible d’enregistrer les modifications. Veuillez réessayer.',
      'menu.form.error.remove': 'Impossible de supprimer l’article. Veuillez réessayer.',
      'menu.form.loading': 'Chargement du menu…',
      'menu.items.empty': 'Aucun article au menu pour le moment. Ajoutez votre premier plat.',
      'menu.items.name': 'Nom',
      'menu.items.description': 'Description',
      'menu.items.price': 'Prix (EUR)',
      'menu.items.cancel': 'Annuler',
      'menu.items.save': 'Enregistrer les modifications',
      'menu.items.edit': 'Modifier',
      'menu.items.delete': 'Supprimer',
      'menu.items.removeConfirm': 'Supprimer cet article du menu ?',
      'menu.photos.label': 'Photos de l’article',
      'menu.photos.noteCreate': 'Facultatif : téléchargez des images pour mettre ce plat en valeur.',
      'menu.photos.noteEdit': 'Les nouvelles photos seront téléversées lorsque vous enregistrerez les modifications.',
      'menu.photos.readyOne': '1 photo prête à être téléversée',
      'menu.photos.readyMany': '{{count}} photos prêtes à être téléversées',
      'menu.photos.clear': 'Effacer la sélection',
      'menu.photos.empty': 'Pas encore de photos.',
      'menu.photos.remove': 'Supprimer',
      'menu.photos.removeQueued': 'Supprimer la photo',
      'menu.photos.removing': 'Suppression…',
      'menu.photos.error.upload': 'Impossible de téléverser les photos de l’article. Veuillez réessayer.',
      'menu.photos.error.delete': 'Impossible de supprimer la photo. Veuillez réessayer.',

      'status.uploading': 'Téléchargement…',
      'status.removing': 'Suppression…',

      'general.loading': 'Chargement…',
    },
    de: {
      'nav.deliveryChip': 'Jetzt liefern • 15-25 Min',
      'nav.discover': 'Entdecken',
      'nav.orders': 'Bestellungen',
      'nav.manage': 'Verwalten',
      'nav.cart': 'Warenkorb ({{count}})',
      'nav.logout': 'Abmelden',
      'nav.login': 'Anmelden',
      'nav.languageLabel': 'Sprache',
      'nav.languageAria': 'Website-Sprache auswählen',

      'cookie.title': 'Wir verwenden Cookies',
      'cookie.message':
        'Diese Website verwendet Cookies, um dein Erlebnis zu verbessern, essentielle Funktionen bereitzustellen und den Traffic zu analysieren. Mit einem Klick auf „Alle akzeptieren“ stimmst du der Speicherung von Cookies auf deinem Gerät zu.',
      'cookie.accept': 'Alle akzeptieren',
      'cookie.decline': 'Ablehnen',

      'cart.title': 'Dein Warenkorb',
      'cart.itemsOne': '{{count}} Artikel',
      'cart.itemsMany': '{{count}} Artikel',
      'cart.empty': 'Füge dem Menü etwas Leckeres hinzu, um eine Bestellung zu starten.',
      'cart.subtotal': 'Zwischensumme',
      'cart.checkout': 'Zur Kasse',
      'cart.decrease': 'Menge verringern',
      'cart.increase': 'Menge erhöhen',
      'cart.remove': 'Artikel entfernen',

      'checkout.title': 'Zur Kasse',
      'checkout.subtitle': 'Bestätige deine Lieferung und freu dich auf eine köstliche Ankunft.',
      'checkout.total': 'Summe',
      'checkout.placeOrder': 'Bestellung aufgeben',

      'orders.title': 'Deine Bestellungen',
      'orders.subtitle': 'Verfolge Lieferungen und entdecke deine Lieblingsgerichte erneut.',
      'orders.totalLabel': 'Summe:',
      'orders.view': 'Details anzeigen',
      'orders.loading': 'Bestellungen werden geladen…',
      'orders.empty': 'Noch keine Bestellungen.',

      'orderDetail.title': 'Bestellung #{{id}}',
      'orderDetail.subtitle': '{{status}} • Bestellt am {{date}}',
      'orderDetail.itemsHeading': 'Artikel',
      'orderDetail.total': 'Summe',
      'orderDetail.customerFavourite': 'Kundenliebling',

      'restaurants.heading': 'Entdecke in deiner Nähe',
      'restaurants.subheading': 'Handverlesene Favoriten, schnell geliefert – genau wie in der Uber Eats App.',
      'restaurants.defaultDescription': 'Beliebte Auswahl • Soulfood',
      'restaurants.express': 'Express',
      'restaurants.duration': '20-30 Min',
      'restaurants.freeDelivery': 'Kostenlose Lieferung ab 15 €',
      'restaurants.menuHeading': 'Speisekarte',
      'restaurants.otherItems': 'Weitere Artikel',

      'restaurantDetail.descriptionFallback': 'Frische Mahlzeiten, perfekt für die Lieferung.',
      'restaurantDetail.tagPopular': 'Beliebt',
      'restaurantDetail.customerFavourite': 'Kundenliebling',
      'restaurantDetail.addToCart': 'In den Warenkorb',
      'restaurantDetail.photosUploaded': 'Fotos erfolgreich hochgeladen!',
      'restaurantDetail.photosError': 'Beim Hochladen der Fotos ist etwas schiefgelaufen. Bitte versuche es erneut.',
      'restaurantDetail.photoRemoved': 'Foto entfernt.',
      'restaurantDetail.photoRemoveError': 'Foto konnte nicht entfernt werden. Bitte versuche es erneut.',
      'restaurantDetail.removePhotoConfirm': 'Dieses Foto entfernen?',

      'login.title': 'Willkommen zurück',
      'login.subtitle': 'Melde dich an, um deine Gelüste weiterhin zu stillen.',
      'login.email': 'E-Mail',
      'login.password': 'Passwort',
      'login.submit': 'Anmelden',

      'admin.title': 'Restaurantverwaltung',
      'admin.subtitle': 'Lade neue Visuals hoch und behalte aktuelle Bestellungen im Blick – alles an einem Ort.',
      'admin.manage.heading': 'Restaurant verwalten',
      'admin.manage.description': 'Wähle den Standort, den du aktualisieren möchtest.',
      'admin.manage.select': 'Restaurant auswählen',
      'admin.manage.loading': 'Restaurants werden geladen…',
      'admin.manage.empty': 'Keine Restaurants gefunden.',
      'admin.photos.heading': 'Restaurantfotos',
      'admin.photos.description': 'Halte dein Schaufenster aktuell, indem du die Galerie auffrischst.',
      'admin.photos.removing': 'Wird entfernt…',
      'admin.photos.remove': 'Entfernen',
      'admin.photos.upload': 'Fotos hochladen',
      'admin.photos.uploading': 'Wird hochgeladen…',
      'admin.photos.readyOne': '1 Datei bereit',
      'admin.photos.readyMany': '{{count}} Dateien bereit',
      'admin.managePlaceholder.title': 'Restaurantinhalte verwalten',
      'admin.managePlaceholder.description': 'Wähle oben ein Restaurant, um Fotos hochzuladen und Speisekarten zu bearbeiten.',
      'admin.details.heading': 'Restaurantdetails',
      'admin.details.description': 'Aktualisiere den Namen und die mehrsprachige Beschreibung, die Gäste sehen.',
      'admin.details.nameLabel': 'Name ({{language}})',
      'admin.details.namePlaceholder': 'Gib den Restaurantnamen ein',
      'admin.details.descriptionLabel': 'Beschreibung ({{language}})',
      'admin.details.descriptionPlaceholder': 'Beschreibe das Restaurant auf {{language}}',
      'admin.details.save': 'Details speichern',
      'admin.details.saving': 'Speichern…',
      'admin.details.saved': 'Restaurantdetails aktualisiert!',
      'admin.details.error': 'Restaurant konnte nicht aktualisiert werden. Bitte versuche es erneut.',
      'admin.details.requiredName': 'Gib mindestens einen Restaurantnamen ein.',

      'admin.orders.heading': 'Neueste Bestellungen',
      'admin.orders.description': 'Überprüfe aktuelle Aktivitäten, damit der Betrieb reibungslos läuft.',
      'admin.orders.unknownRestaurant': 'Unbekanntes Restaurant',
      'admin.orders.loading': 'Bestellungen werden geladen…',
      'admin.orders.empty': 'Noch keine Bestellungen.',
      'admin.orders.meta': 'Bestellt am {{date}} · Status: {{status}}',
      'admin.orders.customer': 'Kunde: {{email}}',

      'menu.manage.heading': 'Speisekarte verwalten',
      'menu.manage.description': 'Füge neue Gerichte hinzu oder aktualisiere bestehende mit nur wenigen Klicks.',
      'menu.form.nameLabel': 'Name des Artikels',
      'menu.form.namePlaceholder': 'z. B. Spicy Tuna Roll',
      'menu.form.descriptionLabel': 'Beschreibung',
      'menu.form.descriptionPlaceholder': 'Optionale Beschreibung',
      'menu.form.priceLabel': 'Preis (EUR)',
      'menu.form.pricePlaceholder': '9,50',
      'menu.form.add': 'Artikel hinzufügen',
      'menu.form.saving': 'Speichern…',
      'menu.form.status': 'Menüartikel hinzugefügt!',
      'menu.form.error.load': 'Menüartikel konnten nicht geladen werden. Bitte versuche es erneut.',
      'menu.form.error.price': 'Gib einen gültigen Preis ein (z. B. 9,99).',
      'menu.form.error.create': 'Menüartikel konnte nicht hinzugefügt werden. Bitte versuche es erneut.',
      'menu.form.error.update': 'Änderungen konnten nicht gespeichert werden. Bitte versuche es erneut.',
      'menu.form.error.remove': 'Artikel konnte nicht entfernt werden. Bitte versuche es erneut.',
      'menu.form.loading': 'Speisekarte wird geladen…',
      'menu.items.empty': 'Noch keine Menüartikel. Beginne mit deinem ersten Gericht.',
      'menu.items.name': 'Name',
      'menu.items.description': 'Beschreibung',
      'menu.items.price': 'Preis (EUR)',
      'menu.items.cancel': 'Abbrechen',
      'menu.items.save': 'Änderungen speichern',
      'menu.items.edit': 'Bearbeiten',
      'menu.items.delete': 'Löschen',
      'menu.items.removeConfirm': 'Diesen Menüartikel entfernen?',
      'menu.photos.label': 'Artikelbilder',
      'menu.photos.noteCreate': 'Optional: Lade Bilder hoch, um dieses Gericht hervorzuheben.',
      'menu.photos.noteEdit': 'Neue Fotos werden hochgeladen, wenn du die Änderungen speicherst.',
      'menu.photos.readyOne': '1 Foto zum Hochladen bereit',
      'menu.photos.readyMany': '{{count}} Fotos zum Hochladen bereit',
      'menu.photos.clear': 'Auswahl löschen',
      'menu.photos.empty': 'Noch keine Fotos.',
      'menu.photos.remove': 'Entfernen',
      'menu.photos.removeQueued': 'Foto entfernen',
      'menu.photos.removing': 'Wird entfernt…',
      'menu.photos.error.upload': 'Artikelbilder konnten nicht hochgeladen werden. Bitte versuche es erneut.',
      'menu.photos.error.delete': 'Das Foto konnte nicht entfernt werden. Bitte versuche es erneut.',

      'status.uploading': 'Wird hochgeladen…',
      'status.removing': 'Wird entfernt…',

      'general.loading': 'Wird geladen…',
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
