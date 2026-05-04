const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
        }
    });
}

function toBase64(bytes: Uint8Array) {
    let binary = "";
    const chunkSize = 0x8000;

    for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }

    return btoa(binary);
}

function slugify(value: string) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48) || "family-photo";
}

function getExtension(file: File) {
    const contentType = (file.type || "").toLowerCase();

    if (contentType.includes("png")) return ".png";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) return ".jpg";
    if (contentType.includes("webp")) return ".webp";
    if (contentType.includes("gif")) return ".gif";
    if (contentType.includes("svg")) return ".svg";

    const nameParts = file.name.split(".");
    if (nameParts.length > 1) {
        return `.${nameParts[nameParts.length - 1].toLowerCase()}`;
    }

    return ".png";
}

function buildGithubPath(prefix: string, filename: string) {
    const cleanedPrefix = prefix.replace(/^\/+|\/+$/g, "");
    return cleanedPrefix ? `${cleanedPrefix}/${filename}` : filename;
}

function encodePath(path: string) {
    return path.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

Deno.serve(async (request) => {
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const token = Deno.env.get("GITHUB_TOKEN") || "";
    const owner = Deno.env.get("GITHUB_OWNER") || "";
    const repo = Deno.env.get("GITHUB_REPO") || "";
    const branch = Deno.env.get("GITHUB_BRANCH") || "main";
    const pathPrefix = Deno.env.get("GITHUB_IMAGE_PATH_PREFIX") || "family-images";

    if (!token || !owner || !repo) {
        return jsonResponse({ error: "GitHub upload is not configured." }, 500);
    }

    const formData = await request.formData();
    const fileEntry = formData.get("file");

    if (!(fileEntry instanceof File)) {
        return jsonResponse({ error: "Missing image file." }, 400);
    }

    const bytes = new Uint8Array(await fileEntry.arrayBuffer());
    if (!bytes.length) {
        return jsonResponse({ error: "Image file is empty." }, 400);
    }

    const fileName = `${new Date().toISOString().replace(/[:.]/g, "-")}-${slugify(fileEntry.name || "family-photo")}-${crypto.randomUUID().slice(0, 8)}${getExtension(fileEntry)}`;
    const githubPath = buildGithubPath(pathPrefix, fileName);

    const uploadResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodePath(githubPath)}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: `Upload family image ${fileName}`,
            content: toBase64(bytes),
            branch
        })
    });

    const responseText = await uploadResponse.text();
    if (!uploadResponse.ok) {
        return jsonResponse({ error: "GitHub upload failed", details: responseText }, uploadResponse.status);
    }

    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${githubPath}`;

    return jsonResponse({
        imageUrl: rawUrl,
        path: githubPath,
        provider: "github"
    });
});