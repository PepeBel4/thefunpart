import { Component } from '@angular/core';
import { legalPageStyles } from './legal-page.styles';

@Component({
  selector: 'app-terms-page',
  standalone: true,
  styles: [legalPageStyles],
  template: `
    <section class="legal-hero">
      <p class="legal-meta">Laatst bijgewerkt: 17 oktober 2025</p>
      <h1>Algemene voorwaarden</h1>
      <p>
        Deze algemene voorwaarden zijn van toepassing op elk bezoek aan en elk gebruik van het platform van The Fun Part,
        alsook op alle aanbiedingen, bestellingen en overeenkomsten die via het platform tot stand komen. Door gebruik te
        maken van onze diensten gaat u akkoord met deze voorwaarden.
      </p>
    </section>

    <section class="legal-section">
      <h2>1. Definities</h2>
      <p>In deze voorwaarden wordt verstaan onder:</p>
      <ul>
        <li><strong>Platform:</strong> de website, webapplicatie en aanverwante diensten van The Fun Part.</li>
        <li><strong>Gebruiker:</strong> iedere natuurlijke of rechtspersoon die het platform bezoekt of gebruikt.</li>
        <li><strong>Ondernemer:</strong> de horecaonderneming of leverancier die via The Fun Part producten of diensten aanbiedt.</li>
        <li><strong>Overeenkomst:</strong> elke afspraak tussen gebruiker en ondernemer die via het platform wordt gesloten.</li>
      </ul>
    </section>

    <section class="legal-section">
      <h2>2. Toepassingsgebied</h2>
      <p>
        Deze voorwaarden zijn van toepassing op alle vormen van gebruik van het platform. Afwijkingen zijn slechts geldig
        wanneer zij schriftelijk tussen The Fun Part en de gebruiker of ondernemer zijn overeengekomen. Mocht één of meer
        bepalingen nietig of vernietigbaar zijn, dan blijven de overige bepalingen onverminderd van kracht.
      </p>
    </section>

    <section class="legal-section">
      <h2>3. Diensten van The Fun Part</h2>
      <p>
        The Fun Part biedt een digitaal platform waarop ondernemers hun aanbod kunnen beheren en gebruikers bestellingen
        kunnen plaatsen. The Fun Part treedt op als tussenpersoon en faciliteert de transactie, maar is geen partij bij de
        overeenkomst tussen gebruiker en ondernemer.
      </p>
      <p>
        Alle informatie over producten, beschikbaarheid, prijzen en levertijden wordt aangeleverd door de ondernemer. The
        Fun Part spant zich in om deze informatie correct en actueel weer te geven, maar kan de volledigheid niet garanderen.
      </p>
    </section>

    <section class="legal-section">
      <h2>4. Accounts en beveiliging</h2>
      <p>
        Voor het plaatsen van bestellingen kan een account vereist zijn. Gebruikers zijn verantwoordelijk voor het
        vertrouwelijk houden van hun inloggegevens en voor alle activiteiten die onder hun account plaatsvinden. Bij vermoeden
        van misbruik dient de gebruiker dit onmiddellijk te melden via <a href="mailto:hello@thefunpart.be">hello@thefunpart.be</a>.
      </p>
    </section>

    <section class="legal-section">
      <h2>5. Bestellingen en uitvoering</h2>
      <p>
        De ondernemer is verantwoordelijk voor de verwerking en levering van bestellingen. De gebruiker dient de opgegeven
        informatie juist en volledig in te vullen. Wijzigingen of annuleringen zijn alleen mogelijk zolang de ondernemer dit kan
        accepteren. Eventuele vragen over de status van een bestelling worden rechtstreeks met de ondernemer besproken.
      </p>
    </section>

    <section class="legal-section">
      <h2>6. Prijzen en betalingen</h2>
      <p>
        Alle prijzen op het platform worden weergegeven in euro en zijn inclusief btw, tenzij anders aangegeven. The Fun Part
        kan servicekosten of verwerkingskosten aanrekenen wanneer dit duidelijk wordt gecommuniceerd vóór afronding van de
        bestelling. Betalingen verlopen via de beschikbare betaalmethodes en worden verwerkt door onze betaalpartners.
      </p>
    </section>

    <section class="legal-section">
      <h2>7. Facturatie en administratie</h2>
      <p>
        Facturen worden op verzoek digitaal verstrekt. Ondernemers zijn verantwoordelijk voor een correcte btw-verwerking.
        Gebruikers dienen hun facturatiegegevens correct aan te leveren. Bij onduidelijkheden kan contact worden opgenomen met
        onze administratie via <a href="mailto:billing@thefunpart.be">billing@thefunpart.be</a>.
      </p>
    </section>

    <section class="legal-section">
      <h2>8. Annulering en terugbetaling</h2>
      <p>
        Annuleringen worden volgens de voorwaarden van de ondernemer afgehandeld. Indien een bestelling niet kan worden
        uitgevoerd, heeft de gebruiker recht op restitutie van het betaalde bedrag. Eventuele terugbetalingen worden verwerkt
        via dezelfde betaalmethode als waarmee de bestelling is geplaatst.
      </p>
    </section>

    <section class="legal-section">
      <h2>9. Aansprakelijkheid</h2>
      <p>
        The Fun Part is niet aansprakelijk voor schade die voortvloeit uit de overeenkomst tussen gebruiker en ondernemer, tenzij
        er sprake is van opzet of grove schuld van The Fun Part. In alle gevallen is de aansprakelijkheid beperkt tot het bedrag
        van de betreffende bestelling of, indien dit hoger is, tot het bedrag dat door de aansprakelijkheidsverzekeraar wordt uitgekeerd.
      </p>
    </section>

    <section class="legal-section">
      <h2>10. Overmacht</h2>
      <p>
        The Fun Part en de ondernemers zijn niet gehouden tot het nakomen van enige verplichting indien zij daartoe gehinderd
        worden door overmacht, waaronder onder andere wordt verstaan: storingen van telecommunicatie, pandemieën, stakingen,
        brand, overheidsmaatregelen of uitval van energievoorzieningen.
      </p>
    </section>

    <section class="legal-section">
      <h2>11. Intellectuele eigendom</h2>
      <p>
        Alle intellectuele eigendomsrechten met betrekking tot het platform, waaronder maar niet beperkt tot teksten, beelden,
        ontwerpen, software en handelsnamen, behoren toe aan The Fun Part of haar licentiegevers. Zonder schriftelijke toestemming
        is het niet toegestaan onderdelen van het platform te kopiëren, reproduceren of openbaar te maken.
      </p>
    </section>

    <section class="legal-section">
      <h2>12. Wijzigingen van de voorwaarden</h2>
      <p>
        The Fun Part kan deze voorwaarden wijzigen wanneer dat nodig is, bijvoorbeeld in het kader van wetgeving, functionele
        verbeteringen of bedrijfsvoering. De meest recente versie is steeds beschikbaar op het platform. Bij wezenlijke wijzigingen
        wordt de gebruiker tijdig geïnformeerd. Het voortgezet gebruik van het platform betekent dat u de gewijzigde voorwaarden accepteert.
      </p>
    </section>

    <section class="legal-section">
      <h2>13. Toepasselijk recht en bevoegde rechtbank</h2>
      <p>
        Op deze voorwaarden is uitsluitend Belgisch recht van toepassing. Geschillen worden bij voorkeur in onderling overleg
        opgelost. Indien dit niet lukt, worden geschillen voorgelegd aan de bevoegde rechtbank van Antwerpen, afdeling Antwerpen.
      </p>
    </section>

    <section class="legal-section">
      <h2>14. Contact</h2>
      <p>
        Heeft u vragen of opmerkingen over deze voorwaarden? Neem dan contact met ons op via <a href="mailto:hello@thefunpart.be">hello@thefunpart.be</a>
        of per post: The Fun Part BV, Generaal Armstrongweg 1, 2020 Antwerpen, België.
      </p>
    </section>
  `,
})
export class TermsPage {}
