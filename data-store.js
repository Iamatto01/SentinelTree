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
            phone: source.phone || source.phone_number || source.phoneNumber || "",
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
            phone: payload.phone || "",
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

    async function getPerson(id) {
        if (!configured) return null;
        try {
            const rows = await request(`/rest/v1/${tableName}?select=*&id=eq.${encodeURIComponent(id)}`, { method: "GET" });
            if (rows && rows.length > 0) return normalizePerson(rows[0]);
            return null;
        } catch (error) {
            return null;
        }
    }

    async function updatePerson(id, payload) {
        if (!configured) throw new Error("Connect your save details before updating.");
        const record = normalizePerson({ ...payload, id });
        try {
            const updated = await request(`/rest/v1/${tableName}?id=eq.${encodeURIComponent(id)}`, {
                method: "PATCH",
                headers: { ...headers, Prefer: "return=representation" },
                body: JSON.stringify(record)
            });
            statusLabel = "Saved successfully";
            return Array.isArray(updated) && updated.length > 0 ? normalizePerson(updated[0]) : record;
        } catch (error) {
            statusLabel = "Save unavailable";
            throw error;
        }
    }

    async function removePerson(id) {
        if (!configured) throw new Error("Connect your save details before removing.");
        try {
            await request(`/rest/v1/${tableName}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
            return true;
        } catch (error) {
            throw error;
        }
    }

    async function loadGalleryImages() {
        if (!configured) return [];
        try {
            const rows = await request(
                `/rest/v1/gallery_images?select=*&family_id=eq.${encodeURIComponent(familyId)}&order=created_at.desc&limit=5`,
                { method: "GET" }
            );
            return rows || [];
        } catch (error) {
            console.error("Failed to load gallery images:", error);
            return [];
        }
    }

    async function addGalleryImage(payload) {
        if (!configured) throw new Error("Connect your save details before adding an image.");
        const record = {
            id: makeId(),
            family_id: familyId,
            event_name: payload.event_name || "General",
            image_url: payload.image_url || "",
            created_at: new Date().toISOString()
        };

        try {
            const created = await request(`/rest/v1/gallery_images`, {
                method: "POST",
                headers: {
                    ...headers,
                    Prefer: "return=representation"
                },
                body: JSON.stringify([record])
            });

            if (Array.isArray(created) && created.length > 0) {
                return created[0];
            }
            return record;
        } catch (error) {
            console.error("Failed to add gallery image:", error);
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
        getPerson,
        updatePerson,
        removePerson,
        normalizePerson,
        loadGalleryImages,
        addGalleryImage
    };
})();
