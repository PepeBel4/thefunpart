import { Component } from '@angular/core';
import { legalPageStyles } from './legal-page.styles';

@Component({
  selector: 'app-privacy-page',
  standalone: true,
  styles: [legalPageStyles],
  template: `
    <section class="legal-hero">
      <p class="legal-meta">Laatst bijgewerkt: 17 oktober 2025</p>
      <h1>Privacyverklaring</h1>
      <p>
        The Fun Part respecteert uw privacy en verwerkt persoonsgegevens uitsluitend in overeenstemming met de Algemene
        Verordening Gegevensbescherming (AVG) en de Belgische privacywetgeving. In deze verklaring leest u welke gegevens we
        verzamelen, waarom we dat doen en hoe we daarmee omgaan.
      </p>
    </section>

    <section class="legal-section">
      <h2>1. Verantwoordelijke voor de verwerking</h2>
      <p>
        The Fun Part BV, gevestigd aan Generaal Armstrongweg 1, 2020 Antwerpen (België), is de verantwoordelijke voor de
        verwerking van uw persoonsgegevens. U kunt ons bereiken via <a href="mailto:privacy@thefunpart.be">privacy@thefunpart.be</a>.
      </p>
    </section>

    <section class="legal-section">
      <h2>2. Welke gegevens verzamelen wij?</h2>
      <p>We verzamelen enkel gegevens die noodzakelijk zijn voor onze dienstverlening, zoals:</p>
      <ul>
        <li>Identificatiegegevens (naam, bedrijfsnaam, btw-nummer, contactpersoon);</li>
        <li>Contactgegevens (adres, e-mailadres, telefoonnummer);</li>
        <li>Accountgegevens (inloggegevens, voorkeuren, communicatie-instellingen);</li>
        <li>Bestel- en transactiegegevens (bestelgeschiedenis, betaalstatus, facturatiegegevens);</li>
        <li>Technische gegevens (IP-adres, browsertype, apparaatkenmerken) voor het verbeteren van onze beveiliging en prestaties.</li>
      </ul>
    </section>

    <section class="legal-section">
      <h2>3. Doeleinden van de verwerking</h2>
      <p>We verwerken uw persoonsgegevens voor de volgende doelen:</p>
      <ul>
        <li>Het aanbieden en onderhouden van ons platform en uw account;</li>
        <li>Het verwerken en opvolgen van bestellingen en betalingen;</li>
        <li>Klantenondersteuning en communicatie over onze diensten;</li>
        <li>Het verbeteren van onze producten, diensten en beveiliging;</li>
        <li>Het voldoen aan wettelijke verplichtingen, zoals fiscale bewaarplichten.</li>
      </ul>
    </section>

    <section class="legal-section">
      <h2>4. Rechtsgrond voor verwerking</h2>
      <p>
        Wij verwerken persoonsgegevens op basis van één of meer van de volgende rechtsgronden: uitvoering van een overeenkomst,
        wettelijke verplichting, gerechtvaardigd belang of uw uitdrukkelijke toestemming. Wanneer toestemming vereist is, kunt u
        deze op elk moment intrekken zonder dat dit afbreuk doet aan de rechtmatigheid van de verwerking vóór de intrekking.
      </p>
    </section>

    <section class="legal-section">
      <h2>5. Delen van gegevens met derden</h2>
      <p>
        Wij delen uw gegevens uitsluitend met derden wanneer dit noodzakelijk is voor onze dienstverlening, zoals betaal- en
        logistieke partners, of wanneer we hiertoe wettelijk verplicht zijn. Met elke partij die namens ons persoonsgegevens
        verwerkt sluiten wij een verwerkersovereenkomst om uw privacy te waarborgen.
      </p>
    </section>

    <section class="legal-section">
      <h2>6. Bewaartermijn</h2>
      <p>
        We bewaren uw gegevens niet langer dan noodzakelijk is voor de doeleinden waarvoor ze zijn verzameld. Facturatie- en
        transactiegegevens worden conform de fiscale verplichtingen minimaal zeven jaar bewaard. Wanneer gegevens niet langer
        nodig zijn, worden ze veilig verwijderd of geanonimiseerd.
      </p>
    </section>

    <section class="legal-section">
      <h2>7. Beveiliging</h2>
      <p>
        We nemen passende technische en organisatorische maatregelen om uw gegevens te beschermen tegen ongeoorloofde of
        onrechtmatige verwerking, verlies, vernietiging of beschadiging. Toegang tot persoonsgegevens is beperkt tot medewerkers
        en partners die de gegevens nodig hebben om onze diensten uit te voeren.
      </p>
    </section>

    <section class="legal-section">
      <h2>8. Uw rechten</h2>
      <p>U beschikt over de volgende rechten met betrekking tot uw persoonsgegevens:</p>
      <ul>
        <li>Recht op inzage en correctie van uw gegevens;</li>
        <li>Recht op beperking of verwijdering van uw gegevens, voor zover wettelijk toegestaan;</li>
        <li>Recht om bezwaar te maken tegen verwerking op basis van gerechtvaardigd belang;</li>
        <li>Recht op overdraagbaarheid van gegevens die u zelf hebt verstrekt;</li>
        <li>Recht om een klacht in te dienen bij de Gegevensbeschermingsautoriteit (<a href="https://www.gegevensbeschermingsautoriteit.be">www.gegevensbeschermingsautoriteit.be</a>).</li>
      </ul>
      <p>U kunt uw rechten uitoefenen door een verzoek te sturen naar <a href="mailto:privacy@thefunpart.be">privacy@thefunpart.be</a>.</p>
    </section>

    <section class="legal-section">
      <h2>9. Cookies en vergelijkbare technologieën</h2>
      <p>
        Ons platform maakt gebruik van functionele, analytische en voorkeurcookies om de gebruikerservaring te verbeteren. Voor
        meer informatie over de soorten cookies en de wijze waarop u uw voorkeuren kunt beheren, verwijzen wij naar ons apart
        cookiebeleid binnen de applicatie.
      </p>
    </section>

    <section class="legal-section">
      <h2>10. Internationale gegevensoverdracht</h2>
      <p>
        Wanneer we gegevens doorgeven buiten de Europese Economische Ruimte, zorgen we voor passende waarborgen, zoals
        standaardcontractbepalingen of een adequaatheidsbesluit van de Europese Commissie. U kunt hierover meer informatie
        opvragen via <a href="mailto:privacy@thefunpart.be">privacy@thefunpart.be</a>.
      </p>
    </section>

    <section class="legal-section">
      <h2>11. Wijzigingen in deze privacyverklaring</h2>
      <p>
        We kunnen deze privacyverklaring van tijd tot tijd bijwerken om rekening te houden met veranderingen in wetgeving of in
        onze diensten. We zullen wijzigingen duidelijk communiceren via het platform. De datum "Laatst bijgewerkt" geeft aan
        wanneer de verklaring voor het laatst is herzien.
      </p>
    </section>

    <section class="legal-section">
      <h2>12. Contact</h2>
      <p>
        Heeft u vragen, opmerkingen of klachten over ons privacybeleid? Neem dan contact met ons op via
        <a href="mailto:privacy@thefunpart.be">privacy@thefunpart.be</a> of per post: The Fun Part BV, Generaal Armstrongweg 1,
        2020 Antwerpen, België.
      </p>
    </section>
  `,
})
export class PrivacyPage {}
