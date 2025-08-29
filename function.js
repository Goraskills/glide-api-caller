window.function = async function (jsonData, githubToken, repoOwner, repoName, filePath) {
    // --- Get values from Glide ---
    const json = jsonData.value ?? "{}";
    const token = githubToken.value;
    const owner = repoOwner.value;
    const repo = repoName.value;
    const path = filePath.value ?? "data.json";

    // --- Basic validation ---
    if (!token || !owner || !repo || !json) {
        return "Error: Token, Owner, Repo, and JSON data are required.";
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    // Encode JSON content to Base64 (UTF-8 safe)
    const contentEncoded = btoa(unescape(encodeURIComponent(json)));

    try {
        // --- 1. Check if the file already exists to get its SHA ---
        let sha;
        const existingFileResponse = await fetch(url, {
            method: 'GET',
            headers: { 'Authorization': `token ${token}` }
        });
        if (existingFileResponse.ok) {
            const fileData = await existingFileResponse.json();
            sha = fileData.sha;
        }

        // --- 2. Create or Update the file ---
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Glide Data Push: ${new Date().toISOString()}`,
                content: contentEncoded,
                sha: sha // Include SHA if updating an existing file
            })
        });

        const result = await response.json();

        if (!response.ok) {
            return `Error from GitHub: ${result.message}`;
        }

        // Return a success message
        return `Success! Commit SHA: ${result.commit.sha}`;

    } catch (error) {
        return `Connection Error: ${error.message}`;
    }
}
