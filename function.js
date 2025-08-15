// function.js (Version améliorée avec débogage)

async function callMyApi(html_content) {
  // ▼▼▼ VÉRIFIEZ QUE CETTE URL EST BIEN LA VÔTRE ▼▼▼
  const MY_API_URL = "https://mon-api-pdf.vercel.app/api/generate-pdf";

  if (!html_content || !html_content.value) {
    return "ERREUR GLIDE: Le contenu HTML est vide. Vérifiez la colonne Template.";
  }

  try {
    const response = await fetch(MY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html: html_content.value })
    });

    // On vérifie si l'API a répondu correctement
    if (!response.ok) {
      // Si l'API renvoie une erreur (ex: 500), on l'affiche
      const errorText = await response.text();
      return `ERREUR VERCEL (Status ${response.status}): ${errorText}`;
    }

    const blob = await response.blob();
    
    // On vérifie si le fichier reçu n'est pas vide
    if (blob.size === 0) {
      return "ERREUR: L'API a renvoyé un fichier PDF vide.";
    }

    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });

  } catch (error) {
    // Si la connexion à l'API échoue, on l'affiche
    return `ERREUR DE CONNEXION: Impossible de joindre l'API. Détails: ${error.message}`;
  }
}

window.function = callMyApi;
