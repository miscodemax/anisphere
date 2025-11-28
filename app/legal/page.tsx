export default function MentionsLegales() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-16 px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Mentions Légales
          </h1>
          <p className="text-lg opacity-90">Anisphere</p>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12">
          {/* Section 1 - Éditeur */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-600">
              1. Éditeur du site
            </h2>
            <div className="bg-gray-50 border-l-4 border-purple-600 p-6 rounded">
              <p className="mb-2">
                <strong className="text-purple-600">Éditeur :</strong> Mamadou
                Ndir Ndiaye
              </p>
              <p className="mb-2">
                <strong className="text-purple-600">Adresse :</strong>{" "}
                Disponible sur demande
              </p>
              <p className="mb-2">
                <strong className="text-purple-600">Email :</strong>{" "}
                <a
                  href="mailto:contact@anisphere.com"
                  className="text-purple-600 hover:underline"
                >
                  contact@anisphere.com
                </a>
              </p>
              <p>
                <strong className="text-purple-600">
                  Responsable de la publication :
                </strong>{" "}
                Mamadou Ndir Ndiaye
              </p>
            </div>
          </section>

          {/* Section 2 - Hébergement */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-600">
              2. Hébergement
            </h2>
            <div className="bg-gray-50 border-l-4 border-purple-600 p-6 rounded mb-4">
              <p className="mb-2">
                <strong className="text-purple-600">Hébergeur web :</strong>{" "}
                Vercel Inc.
              </p>
              <p className="mb-2">
                <strong className="text-purple-600">Adresse :</strong> 440 N
                Barranca Avenue #4133, Covina, CA 91723, United States
              </p>
              <p>
                <strong className="text-purple-600">Site :</strong>{" "}
                <a
                  href="https://vercel.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  https://vercel.com
                </a>
              </p>
            </div>
            <div className="bg-gray-50 border-l-4 border-purple-600 p-6 rounded">
              <p className="mb-2">
                <strong className="text-purple-600">Base de données :</strong>{" "}
                Supabase
              </p>
              <p>
                <strong className="text-purple-600">Site :</strong>{" "}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  https://supabase.com
                </a>
              </p>
            </div>
          </section>

          {/* Section 3 - Description */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-600">
              3. Description du service
            </h2>
            <p className="text-gray-700 mb-4">
              Anisphere est une plateforme regroupant des informations, résumés,
              images et descriptions d'animes. Les données proviennent d'APIs
              publiques telles que Jikan (MyAnimeList), AniList et d'autres
              sources ouvertes.
            </p>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-gray-700">
                <strong>Important :</strong> Le site ne diffuse aucune vidéo et
                ne stocke aucun fichier protégé par copyright. Anisphere ne
                propose que des métadonnées et des liens vers les sources
                officielles.
              </p>
            </div>
          </section>

          {/* Section 4 - Propriété intellectuelle */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-600">
              4. Propriété intellectuelle
            </h2>
            <p className="text-gray-700 mb-3">
              Le nom "Anisphere", le design, le code source du site ainsi que
              les fonctionnalités développées (embeddings, recherche, etc.) sont
              la propriété exclusive de l'éditeur.
            </p>
            <p className="text-gray-700">
              Les images, descriptions, titres et autres contenus relatifs aux
              animes appartiennent à leurs ayants droits respectifs. Les données
              affichées sur Anisphere proviennent de sources publiques et sont
              utilisées conformément aux conditions d'utilisation de ces APIs.
            </p>
          </section>

          {/* Section 5 - RGPD */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-600">
              5. Données personnelles (RGPD)
            </h2>
            <p className="text-gray-700 mb-4">
              Anisphere ne collecte aucune donnée personnelle directement auprès
              des utilisateurs. Le site ne dispose pas de système
              d'authentification ou d'inscription.
            </p>
            <p className="text-gray-700 mb-4">
              Cependant, des services tiers utilisés pour le fonctionnement du
              site (Vercel, Supabase, APIs externes) peuvent collecter
              automatiquement des données techniques telles que :
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 ml-4">
              <li>Adresses IP</li>
              <li>Type de navigateur et système d'exploitation</li>
              <li>Pages visitées et durée de visite</li>
              <li>Logs de requêtes serveur</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Ces données sont collectées uniquement à des fins techniques
              (sécurité, performance, statistiques anonymes) et ne sont jamais
              revendues à des tiers.
            </p>
            <div className="bg-gray-50 border-l-4 border-purple-600 p-4 rounded">
              <p className="text-gray-700">
                <strong className="text-purple-600">
                  Contact pour vos données :
                </strong>{" "}
                Pour toute demande relative à vos données personnelles (accès,
                rectification, suppression), contactez-nous à :
                <a
                  href="mailto:contact@anisphere.com"
                  className="text-purple-600 hover:underline ml-1"
                >
                  contact@anisphere.com
                </a>
              </p>
            </div>
          </section>

          {/* Section 6 - Cookies */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-600">
              6. Cookies
            </h2>
            <p className="text-gray-700">
              Anisphere n'utilise pas de cookies de tracking, de publicité ou
              d'analyse comportementale. Seuls les cookies strictement
              nécessaires au fonctionnement technique du site peuvent être
              déposés (session, préférences d'affichage).
            </p>
          </section>

          {/* Section 7 - Limite de responsabilité */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-600">
              7. Limite de responsabilité
            </h2>
            <p className="text-gray-700 mb-3">
              L'éditeur s'efforce de maintenir le site accessible et les
              informations à jour. Cependant, il ne peut être tenu responsable
              en cas de :
            </p>
            <ul className="list-disc list-inside text-gray-700 ml-4">
              <li>
                Erreurs ou inexactitudes dans les données fournies par les APIs
                externes
              </li>
              <li>Interruption temporaire ou définitive du service</li>
              <li>
                Problèmes techniques liés aux hébergeurs ou fournisseurs de
                données
              </li>
              <li>Utilisation inappropriée du site par les utilisateurs</li>
            </ul>
          </section>

          {/* Section 8 - Loi applicable */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-600">
              8. Loi applicable
            </h2>
            <p className="text-gray-700">
              Les présentes mentions légales sont régies par le droit français.
              En cas de litige, et après tentative de résolution amiable, les
              tribunaux français seront seuls compétents.
            </p>
          </section>

          {/* Section 9 - Crédits */}
          <section>
            <h2 className="text-2xl font-bold text-purple-600 mb-4 pb-2 border-b-2 border-purple-600">
              9. Crédits et sources
            </h2>
            <p className="text-gray-700 mb-3">
              Les données affichées sur Anisphere proviennent des sources
              suivantes :
            </p>
            <ul className="list-disc list-inside text-gray-700 ml-4">
              <li>
                <a
                  href="https://jikan.moe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  Jikan API
                </a>{" "}
                (MyAnimeList)
              </li>
              <li>
                <a
                  href="https://anilist.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  AniList API
                </a>
              </li>
              <li>Autres APIs publiques d'informations sur les animes</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 text-center py-8 px-4 text-gray-600">
          <p className="text-sm">
            Dernière mise à jour :{" "}
            {new Date().toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-sm mt-2">
            © {new Date().getFullYear()} Anisphere - Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}
