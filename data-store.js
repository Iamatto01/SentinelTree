(function () {
    const config = window.FAMILY_TREE_CONFIG || {};
    const baseUrl = String(config.supabaseUrl || "").replace(/\/$/, "");
    const anonKey = String(config.supabaseAnonKey || "");
    const tableName = config.familyTable || "family_members";
    const familyId = config.familyId || "jamal-awang-legacy";
    const configured = Boolean(
        baseUrl &&
        anonKey &&
        !baseUrl.includes("YOUR_") &&
        !anonKey.includes("YOUR_")
    );

    const headers = {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        Accept: "application/json"
    };

    let statusLabel = configured ? "Ready to save" : "Connect to save";

    function makeId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
            notes: source.notes || "",
            parentName: source.parent_name || source.parentName || "",
            partnerName: source.partner_name || source.partnerName || "",
            imageUrl: source.image_url || source.imageUrl || source.photo_url || source.photoUrl || "",
            createdAt: source.created_at || source.createdAt || new Date().toISOString()
        };
    }

    async function request(path, options = {}) {
        const response = await fetch(`${baseUrl}${path}`, {
            ...options,
            headers: {
                ...headers,
                ...(options.headers || {})
            }
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || `Request failed with status ${response.status}`);
        }

        if (response.status === 204) {
            return null;
        }

        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
            return response.json();
        }

        return response.text();
    }

    async function loadPeople() {
        if (!configured) {
            statusLabel = "Connect to save";
            return [];
        }

        try {
            const rows = await request(
                `/rest/v1/${tableName}?select=*&family_id=eq.${encodeURIComponent(familyId)}&order=created_at.desc`,
                { method: "GET" }
            );
            statusLabel = "Ready to save";
            return (rows || []).map(normalizePerson);
        } catch (error) {
            statusLabel = "Save unavailable";
            return [];
        }
    }

    async function addPerson(payload) {
        const record = normalizePerson({
            family_id: familyId,
            name: payload.name,
            relation: payload.relation || "Other",
            birthday: payload.birthday || "",
            birthPlace: payload.birthPlace || "",
            occupation: payload.occupation || "",
            notes: payload.notes || "",
            parentName: payload.parentName || "",
            partnerName: payload.partnerName || "",
            imageUrl: payload.imageUrl || "",
            createdAt: new Date().toISOString()
        });

        if (!configured) {
            statusLabel = "Connect to save";
            throw new Error("Connect your save details before adding a person.");
        }

        try {
            const created = await request(`/rest/v1/${tableName}`, {
                method: "POST",
                headers: {
                    ...headers,
                    Prefer: "return=representation"
                },
                body: JSON.stringify([{ ...record, family_id: familyId }])
            });

            statusLabel = "Saved successfully";
            if (Array.isArray(created) && created.length > 0) {
                return normalizePerson(created[0]);
            }

            return record;
        } catch (error) {
            statusLabel = "Save unavailable";
            throw error;
        }
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
        normalizePerson
    };
})();
