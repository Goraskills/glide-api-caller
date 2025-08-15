async function callMyApi(html_content) {
  // C'est ici qu'on appelle votre API personnelle !
  const MY_API_URL = "https://mon-api-pdf.vercel.app/api/generate-pdf";

  const response = await fetch(MY_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html: html_content.value })
  });

  // On reçoit le PDF, on le transforme en Blob puis en Base64 pour que Glide puisse l'afficher
  const blob = await response.blob();
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

window.function = callMyApi;
