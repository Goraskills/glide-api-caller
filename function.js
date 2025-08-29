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
    async function pollForResponse() {
        // ▼▼▼ LA LIGNE MODIFIÉE ▼▼▼
        const baseUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${responsePath}`;
        let attempts = 0;
        const maxAttempts = 15;
        
        while (attempts < maxAttempts) {
            // Ajout d'un paramètre unique pour déjouer le cache
            const urlWithCacheBust = `${baseUrl}?t=${new Date().getTime()}`;
            
            try {
                const res = await fetch(urlWithCacheBust, {
                    method: 'GET',
                    headers: { 'Authorization': `token ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    const content = decodeURIComponent(escape(atob(data.content)));
                    return `Réponse reçue: ${content}`;
                }
            } catch (error) { /* Ignorer les erreurs */ }
            
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        return "Erreur: Le délai d'attente pour la réponse a été dépassé.";
    }


    // --- 1. ENVOYER LA DONNÉE INITIALE ---
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

        // --- 2. ATTENDRE LA RÉPONSE ---
        return await pollForResponse();

    } catch (error) {
        return `Erreur de Connexion: ${error.message}`;
    }
}
