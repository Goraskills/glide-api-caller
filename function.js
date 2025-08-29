window.function = async function (jsonData, githubToken, repoOwner, repoName, filePath) {
    // --- Get values from Glide ---
    const json = jsonData.value ?? "{}";
    const token = githubToken.value;
    const owner = repoOwner.value;
    const repo = repoName.value;
    const path = filePath.value ?? "data.json";
    const responsePath = "response.json"; // Le fichier que nous allons attendre

    // --- Basic validation ---
    if (!token || !owner || !repo || !json) {
        return "Erreur: Token, Propriétaire, Dépôt et Données JSON sont requis.";
    }

    // --- FONCTION POUR ATTENDRE LA RÉPONSE ---
    async function pollForResponse() {
        const responseUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${responsePath}`;
        let attempts = 0;
        const maxAttempts = 15; // Attendre au maximum 30 secondes (15 x 2s)
        
        while (attempts < maxAttempts) {
            try {
                const res = await fetch(responseUrl, {
                    method: 'GET',
                    headers: { 'Authorization': `token ${token}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    // Le contenu est en Base64, il faut le décoder
                    const content = atob(data.content);
                    return `Réponse reçue: ${content}`;
                }
            } catch (error) { /* Ignorer les erreurs de réseau pendant le polling */ }
            
            attempts++;
            // Attendre 2 secondes avant de réessayer
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        return "Erreur: Le délai d'attente pour la réponse a été dépassé.";
    }


    // --- 1. ENVOYER LA DONNÉE INITIALE (votre code existant) ---
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

        // --- 2. SI L'ENVOI RÉUSSIT, COMMENCER À ATTENDRE LA RÉPONSE ---
        return await pollForResponse();

    } catch (error) {
        return `Erreur de Connexion: ${error.message}`;
    }
}
