/**
 * data-store.js — Supabase + Google Sheets persistence layer
 *
 * Depends on: supabase-config.js, utils.js
 *
 * Exposes window.FamilyTreeStore with:
 *   People:  loadPeople, addPerson, getPerson, updatePerson, removePerson
 *   Gallery: gallery.load, gallery.add
 *   Sync:    syncExistingDataset
 *   Meta:    isConfigured, statusLabel, normalizePerson
 */

(function () {
    "use strict";

    const U = window.SentinelUtils;
    const config = window.FAMILY_TREE_CONFIG || {};

    const baseUrl = String(config.supabaseUrl || "").replace(/\/$/, "");
    const anonKey = String(config.supabaseAnonKey || "");
    const tableName = config.familyTable || "family_members";
    const familyId = config.familyId || "jamal-awang-legacy";
    const googleUrl = String(config.googleWebAppUrl || "").trim();

    const configured = Boolean(
        baseUrl &&
        anonKey &&
        !baseUrl.includes("YOUR_") &&
        !anonKey.includes("YOUR_")
    );

    // ── Shared headers (single source of truth) ─────────────

    const BASE_HEADERS = Object.freeze({
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        Accept: "application/json"
    });

    let statusLabel = configured ? "Ready to save" : "Connect to save";

    // ── Normalize ───────────────────────────────────────────

    /**
     * Normalize a raw record into the canonical person shape.
     * Only generates a new id when the source truly has none.
     */
    function normalizePerson(record) {
        const s = record || {};
        return {
            id: s.id || s.uuid || U.makeId(),
            family_id: s.family_id || s.familyId || familyId,
            name: s.name || s.full_name || s.fullName || "Unnamed person",
            relation: s.relation || "Other",
            birthday: s.birthday || s.birth_date || s.birthDate || "",
            birthPlace: s.birth_place || s.birthPlace || "",
            deathDate: s.death_date || s.deathDate || "",
            occupation: s.occupation || "",
            phone: s.phone || s.phone_number || s.phoneNumber || "",
            notes: s.notes || "",
            parentName: s.parent_name || s.parentName || "",
            partnerName: s.partner_name || s.partnerName || "",
            imageUrl:
                s.image_url || s.imageUrl || s.photo_url || s.photoUrl || "",
            timeline: s.timeline || [],
            createdAt: s.created_at || s.createdAt || new Date().toISOString()
        };
    }

    // ── HTTP helpers ────────────────────────────────────────

    /**
     * Perform a fetch against the Supabase REST API.
     * Merges only *extra* headers on top of BASE_HEADERS to avoid duplication.
     */
    async function request(path, options = {}) {
        const { headers: extraHeaders, ...rest } = options;

        const response = await fetch(`${baseUrl}${path}`, {
            ...rest,
            headers: { ...BASE_HEADERS, ...(extraHeaders || {}) }
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(
                message || `Request failed with status ${response.status}`
            );
        }

        if (response.status === 204) return null;

        const ct = response.headers.get("content-type") || "";
        return ct.includes("application/json")
            ? response.json()
            : response.text();
    }

    /**
     * Retry wrapper — retries once with a 1-second delay on network errors.
     */
    async function withRetry(fn) {
        try {
            return await fn();
        } catch (err) {
            // Only retry network-level failures, not 4xx / 5xx (those throw inside request)
            if (err instanceof TypeError) {
                await new Promise((r) => setTimeout(r, 1000));
                return fn();
            }
            throw err;
        }
    }

    // ── Cache ───────────────────────────────────────────────

    const cache = { people: null, ts: 0 };
    const CACHE_TTL = 30_000; // 30 seconds

    function invalidateCache() {
        cache.people = null;
        cache.ts = 0;
    }

    // ── Google Sheets helper ────────────────────────────────

    async function saveToGoogleSheets(action, payload) {
        if (!googleUrl) return null;
        try {
            const res = await fetch(googleUrl, {
                method: "POST",
                body: JSON.stringify({ action, data: payload })
            });
            return await res.json().catch(() => ({ status: "success" }));
        } catch (err) {
            console.error("Google Sheets sync failed:", err);
            return null;
        }
    }

    // ── People CRUD ─────────────────────────────────────────

    async function loadPeople() {
        if (!configured) {
            statusLabel = "Connect to save";
            return [];
        }

        // Return cached data if fresh
        if (cache.people && Date.now() - cache.ts < CACHE_TTL) {
            return cache.people;
        }

        try {
            const rows = await withRetry(() =>
                request(
                    `/rest/v1/${tableName}?select=*&family_id=eq.${encodeURIComponent(familyId)}&order=created_at.desc`,
                    { method: "GET" }
                )
            );
            statusLabel = "Ready to save";
            const people = (rows || []).map(normalizePerson);
            cache.people = people;
            cache.ts = Date.now();
            return people;
        } catch (_) {
            statusLabel = "Save unavailable";
            return [];
        }
    }

    async function addPerson(payload) {
        // Validate configuration FIRST, before any side-effects
        if (!configured) {
            statusLabel = "Connect to save";
            throw new Error("Connect your save details before adding a person.");
        }

        const record = normalizePerson({
            family_id: familyId,
            name: payload.name,
            relation: payload.relation || "Other",
            birthday: payload.birthday || "",
            birthPlace: payload.birthPlace || "",
            deathDate: payload.deathDate || "",
            occupation: payload.occupation || "",
            phone: payload.phone || "",
            notes: payload.notes || "",
            parentName: payload.parentName || "",
            partnerName: payload.partnerName || "",
            imageUrl: payload.imageUrl || "",
            createdAt: new Date().toISOString()
        });

        // Fire-and-forget Google Sheets sync (after validation)
        saveToGoogleSheets("savePerson", {
            ...record,
            base64Image: payload.base64Image
        }).catch((e) => console.error(e));

        try {
            const created = await withRetry(() =>
                request(`/rest/v1/${tableName}`, {
                    method: "POST",
                    headers: { Prefer: "return=representation" },
                    body: JSON.stringify([{ ...record, family_id: familyId }])
                })
            );

            invalidateCache();
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
            const rows = await request(
                `/rest/v1/${tableName}?select=*&id=eq.${encodeURIComponent(id)}`,
                { method: "GET" }
            );
            return rows && rows.length > 0 ? normalizePerson(rows[0]) : null;
        } catch (_) {
            return null;
        }
    }

    async function updatePerson(id, payload) {
        if (!configured) {
            throw new Error("Connect your save details before updating.");
        }

        const record = normalizePerson({ ...payload, id });

        try {
            const updated = await withRetry(() =>
                request(
                    `/rest/v1/${tableName}?id=eq.${encodeURIComponent(id)}`,
                    {
                        method: "PATCH",
                        headers: { Prefer: "return=representation" },
                        body: JSON.stringify(record)
                    }
                )
            );

            invalidateCache();
            statusLabel = "Saved successfully";
            return Array.isArray(updated) && updated.length > 0
                ? normalizePerson(updated[0])
                : record;
        } catch (error) {
            statusLabel = "Save unavailable";
            throw error;
        }
    }

    async function removePerson(id) {
        if (!configured) {
            throw new Error("Connect your save details before removing.");
        }

        await withRetry(() =>
            request(
                `/rest/v1/${tableName}?id=eq.${encodeURIComponent(id)}`,
                { method: "DELETE" }
            )
        );

        invalidateCache();
        return true;
    }

    // ── Gallery CRUD ────────────────────────────────────────

    async function loadGalleryImages() {
        if (!configured) return [];
        try {
            const rows = await withRetry(() =>
                request(
                    `/rest/v1/gallery_images?select=*&family_id=eq.${encodeURIComponent(familyId)}&order=created_at.desc&limit=50`,
                    { method: "GET" }
                )
            );
            return rows || [];
        } catch (_) {
            console.error("Failed to load gallery images.");
            return [];
        }
    }

    async function addGalleryImage(payload) {
        if (!configured) {
            throw new Error("Connect your save details before adding an image.");
        }

        const record = {
            id: U.makeId(),
            family_id: familyId,
            event_name: payload.event_name || "General",
            image_url: payload.image_url || "",
            created_at: new Date().toISOString()
        };

        try {
            const created = await withRetry(() =>
                request("/rest/v1/gallery_images", {
                    method: "POST",
                    headers: { Prefer: "return=representation" },
                    body: JSON.stringify([record])
                })
            );

            if (Array.isArray(created) && created.length > 0) {
                return created[0];
            }
            return record;
        } catch (error) {
            console.error("Failed to add gallery image:", error);
            throw error;
        }
    }

    // ── Dataset sync ────────────────────────────────────────

    /**
     * Sync the in-memory family data to Google Sheets.
     *
     * @param {object[]} [dataset] – array of person objects to sync.
     *        Defaults to extracting from the global familyRegistry.
     */
    async function syncExistingDataset(dataset) {
        if (!dataset) {
            // Extract from the registry if available
            if (window.familyRegistry) {
                dataset = window.familyRegistry.getAll().map((p) => ({
                    name: p.name,
                    relation: window.familyRegistry.deriveRole(p.id),
                    birthday: p.birthday || "",
                    imageUrl: p.image || ""
                }));
            } else {
                console.error("No familyRegistry found.");
                return;
            }
        }

        if (!googleUrl) {
            alert("Please set googleWebAppUrl in supabase-config.js first.");
            return;
        }

        try {
            await fetch(googleUrl, {
                method: "POST",
                body: JSON.stringify({ action: "syncDataset", data: dataset })
            });
            alert(`Synced ${dataset.length} records to Google Sheets successfully!`);
        } catch (e) {
            console.error("Failed to sync dataset:", e);
            alert("Failed to sync dataset. Check console for details.");
        }
    }

    // ── Export ───────────────────────────────────────────────

    window.FamilyTreeStore = {
        isConfigured() {
            return configured;
        },
        statusLabel() {
            return statusLabel;
        },

        // People
        loadPeople,
        addPerson,
        getPerson,
        updatePerson,
        removePerson,
        normalizePerson,
        syncExistingDataset,

        // Gallery (namespaced)
        gallery: Object.freeze({
            load: loadGalleryImages,
            add: addGalleryImage
        }),

        // Legacy flat aliases for backwards compat
        loadGalleryImages,
        addGalleryImage
    };
})();
