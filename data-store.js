(function () {
    const config = window.FAMILY_TREE_CONFIG || {};
    const appsScriptUrl = String(config.googleAppsScriptUrl || "").trim();
    const sheetId = String(config.googleSheetId || "").trim();
    const driveFolderId = String(config.googleDriveFolderId || "").trim();
    const drivePublicView = config.googleDrivePublicView !== false;
    const familyId = config.familyId || "jamal-awang-legacy";
    const configured = Boolean(appsScriptUrl && !appsScriptUrl.includes("YOUR_"));

    let statusLabel = configured ? "Google Sheets ready" : "Connect Google Apps Script";

    function makeId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function toIsoDate(value) {
        if (!value) return "";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return date.toISOString();
    }

    function normalizePerson(record) {
        const source = record || {};

        return {
            id: source.id || makeId(),
            family_id: source.family_id || source.familyId || familyId,
            name: source.name || source.full_name || source.fullName || "Unnamed person",
            relation: source.relation || "Other",
            birthday: source.birthday || source.birth_date || source.birthDate || "",
            birthPlace: source.birth_place || source.birthPlace || "",
            occupation: source.occupation || "",
            phone: source.phone || source.phone_number || source.phoneNumber || "",
            notes: source.notes || "",
            parentName: source.parent_name || source.parentName || "",
            partnerName: source.partner_name || source.partnerName || "",
            familyHead: source.family_head || source.familyHead || "",
            imageUrl: source.image_url || source.imageUrl || source.photo_url || source.photoUrl || "",
            createdAt: source.created_at || source.createdAt || new Date().toISOString(),
            updatedAt: source.updated_at || source.updatedAt || ""
        };
    }

    function normalizeGalleryImage(record) {
        const source = record || {};

        return {
            id: source.id || makeId(),
            family_id: source.family_id || source.familyId || familyId,
            event_name: source.event_name || source.eventName || "General",
            image_url: source.image_url || source.imageUrl || "",
            created_at: source.created_at || source.createdAt || new Date().toISOString()
        };
    }

    function resolveFamilyHead(payload) {
        return payload.familyHead || payload.parentName || payload.name || "";
    }

    async function request(action, payload = {}) {
        if (!configured) {
            statusLabel = "Connect Google Apps Script";
            throw new Error("Connect your Google Apps Script web app URL before saving.");
        }

        const response = await fetch(appsScriptUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify({
                action,
                sheetId,
                familyId,
                ...payload
            })
        });

        const raw = await response.text();
        let data = {};

        try {
            data = raw ? JSON.parse(raw) : {};
        } catch (error) {
            throw new Error("Google endpoint returned invalid JSON.");
        }

        if (!response.ok || data.success === false) {
            throw new Error(data.error || `Request failed with status ${response.status}`);
        }

        return data;
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const value = String(reader.result || "");
                const commaIndex = value.indexOf(",");
                const base64 = commaIndex >= 0 ? value.slice(commaIndex + 1) : "";
                if (!base64) {
                    reject(new Error("Could not encode file."));
                    return;
                }
                resolve(base64);
            };
            reader.onerror = () => reject(reader.error || new Error("Could not read file."));
            reader.readAsDataURL(file);
        });
    }

    async function loadPeople() {
        if (!configured) {
            statusLabel = "Connect Google Apps Script";
            return [];
        }

        try {
            const result = await request("listPeople", {});
            const rows = Array.isArray(result.people) ? result.people : [];
            statusLabel = "Google Sheets ready";
            return rows.map(normalizePerson);
        } catch (error) {
            statusLabel = "Google Sheets unavailable";
            return [];
        }
    }

    async function addPerson(payload) {
        const now = new Date().toISOString();
        const record = normalizePerson({
            family_id: familyId,
            name: payload.name,
            relation: payload.relation || "Other",
            birthday: payload.birthday || "",
            birthPlace: payload.birthPlace || "",
            occupation: payload.occupation || "",
            phone: payload.phone || "",
            notes: payload.notes || "",
            parentName: payload.parentName || "",
            partnerName: payload.partnerName || "",
            familyHead: resolveFamilyHead(payload),
            imageUrl: payload.imageUrl || "",
            createdAt: now,
            updatedAt: now
        });

        try {
            const result = await request("addPerson", {
                record: {
                    ...record,
                    family_id: familyId
                }
            });
            statusLabel = "Saved successfully";
            return normalizePerson(result.person || record);
        } catch (error) {
            statusLabel = "Google Sheets unavailable";
            throw error;
        }
    }

    async function getPerson(id) {
        if (!configured) return null;

        try {
            const result = await request("getPerson", { id });
            if (!result.person) return null;
            return normalizePerson(result.person);
        } catch (error) {
            return null;
        }
    }

    async function updatePerson(id, payload) {
        const now = new Date().toISOString();
        const record = normalizePerson({
            ...payload,
            id,
            family_id: familyId,
            familyHead: resolveFamilyHead(payload),
            updatedAt: now
        });

        try {
            const result = await request("updatePerson", {
                id,
                record
            });
            statusLabel = "Saved successfully";
            return normalizePerson(result.person || record);
        } catch (error) {
            statusLabel = "Google Sheets unavailable";
            throw error;
        }
    }

    async function removePerson(id) {
        try {
            await request("removePerson", { id });
            return true;
        } catch (error) {
            throw error;
        }
    }

    async function loadGalleryImages() {
        if (!configured) return [];

        try {
            const result = await request("listGalleryImages", { limit: 5 });
            const rows = Array.isArray(result.images) ? result.images : [];
            return rows.map(normalizeGalleryImage);
        } catch (error) {
            console.error("Failed to load gallery images:", error);
            return [];
        }
    }

    async function addGalleryImage(payload) {
        const record = {
            id: makeId(),
            family_id: familyId,
            event_name: payload.event_name || "General",
            image_url: payload.image_url || "",
            created_at: toIsoDate(payload.created_at) || new Date().toISOString()
        };

        try {
            const result = await request("addGalleryImage", { record });
            return normalizeGalleryImage(result.image || record);
        } catch (error) {
            console.error("Failed to add gallery image:", error);
            throw error;
        }
    }

    async function uploadMedia(file, options = {}) {
        if (!(file instanceof File)) {
            throw new Error("Missing media file.");
        }

        if (!configured) {
            throw new Error("Connect Google Apps Script before uploading media.");
        }

        const base64Data = await fileToBase64(file);
        const result = await request("uploadMedia", {
            folderId: options.folderId || driveFolderId,
            fileName: file.name || "family-media",
            mimeType: file.type || "application/octet-stream",
            category: options.category || "general",
            makePublic: options.makePublic !== undefined ? Boolean(options.makePublic) : drivePublicView,
            base64Data
        });

        return {
            id: result.fileId || "",
            url: result.fileUrl || result.url || ""
        };
    }

    window.FamilyTreeStore = {
        isConfigured() {
            return configured;
        },
        statusLabel() {
            return statusLabel;
        },
        loadPeople,
        addPerson,
        getPerson,
        updatePerson,
        removePerson,
        normalizePerson,
        loadGalleryImages,
        addGalleryImage,
        uploadMedia
    };
})();
