window.function = async function (jsonData, githubToken, repoOwner, repoName, filePath) {
    // --- Get values from Glide ---
    const json = jsonData.value ?? "{}";
    const token = githubToken.value;
    const owner = repoOwner.value;
    const repo = repoName.value;
    const path = filePath.value ?? "data.json";
    const responsePath = "response.json";

    // --- Basic validation ---
    if (!token || !owner || !repo || !json) {
        return "Erreur: Token, Propriétaire, Dépôt et Données JSON sont requis.";
    }

    // --- FONCTION POUR ATTENDRE LA RÉPONSE ---
    async function pollForResponse(initialSha) {
        const baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${responsePath}`;
        let attempts = 0;
        // ▼▼▼ MODIFICATION 1 : On attend maintenant jusqu'à 60 secondes ▼▼▼
        const maxAttempts = 20; 
        
        while (attempts < maxAttempts) {
            const urlWithCacheBust = `${baseUrl}?t=${new Date().getTime()}`;
            
            try {
                const res = await fetch(urlWithCacheBust, {
                    method: 'GET',
                    headers: { 'Authorization': `token ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    // ▼▼▼ MODIFICATION 2 : On accepte la réponse que si elle est NOUVELLE ▼▼▼
                    if (data.sha !== initialSha) {
                        const content = decodeURIComponent(escape(atob(data.content)));
                        return `Réponse reçue: ${content}`;
                    }
                }
            } catch (error) { /* Ignorer les erreurs */ }
            
            attempts++;
            // ▼▼▼ MODIFICATION 3 : On attend 3 secondes entre chaque vérification ▼▼▼
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        return "Erreur: Le délai d'attente pour la réponse a été dépassé (60 secondes). Le workflow est peut-être trop long.";
    }


    // --- 1. OBTENIR L'IDENTIFIANT DE L'ANCIENNE RÉPONSE ---
    let initialResponseSha;
    try {
        const initialResponse = await fetch(`${`https://api.github.com/repos/${owner}/${repo}/contents/${responsePath}`}?t=${new Date().getTime()}`, { headers: { 'Authorization': `token ${token}` }});
        if (initialResponse.ok) initialResponseSha = (await initialResponse.json()).sha;
    } catch(e) { /* Le fichier n'existe probablement pas, c'est ok */ }


    // --- 2. ENVOYER LA DONNÉE INITIALE ---
    const initialUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const contentEncoded = btoa(unescape(encodeURIComponent(json)));

    try {
        let sha;
        const existingFile = await fetch(initialUrl, { headers: { 'Authorization': `token ${token}` }});
        if (existingFile.ok) sha = (await existingFile.json()).sha;

        const response = await fetch(initialUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Glide Data Push: ${new Date().toISOString()}`,
                content: contentEncoded,
                sha: sha
            })
        });

        if (!response.ok) {
            const errorResult = await response.json();
            return `Erreur GitHub: ${errorResult.message}`;
        }

        // --- 3. ATTENDRE LA NOUVELLE RÉPONSE ---
        return await pollForResponse(initialResponseSha);

    } catch (error) {
        return `Erreur de Connexion: ${error.message}`;
    }
}
