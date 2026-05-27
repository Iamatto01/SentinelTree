/**
 * utils.js — Shared utility functions for SentinelTree
 *
 * Centralises helpers that were previously duplicated across
 * app.js, add-people.js, gallery.js and data-store.js.
 */

(function () {
    "use strict";

    // ── Constants ────────────────────────────────────────────

    const FALLBACK_AVATAR =
        "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='60' fill='%23E5E7EB'/%3E%3Ccircle cx='60' cy='48' r='22' fill='%239CA3AF'/%3E%3Cpath d='M28 102c6-18 22-28 32-28s26 10 32 28' fill='%239CA3AF'/%3E%3C/svg%3E";

    // ── ID Generation ───────────────────────────────────────

    /**
     * Generate a unique ID string.
     * Prefers crypto.randomUUID when available, falls back to timestamp + random.
     */
    function makeId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    // ── HTML Escaping ───────────────────────────────────────

    const ESCAPE_MAP = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    };

    /**
     * Escape HTML-special characters so a value is safe to inject
     * into innerHTML templates.
     */
    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
    }

    // ── Date / Age ──────────────────────────────────────────

    /**
     * Compute the age in whole years from a birthday string.
     * Returns a number, or null when the date is unparsable / in the future.
     */
    function computeAge(birthday) {
        if (!birthday) return null;
        try {
            const dt = new Date(birthday);
            if (isNaN(dt.getTime())) return null;
            if (dt.getTime() > Date.now()) return null; // future date
            const diff = Date.now() - dt.getTime();
            const ageDt = new Date(diff);
            return Math.abs(ageDt.getUTCFullYear() - 1970);
        } catch (_) {
            return null;
        }
    }

    // ── File I/O ────────────────────────────────────────────

    /**
     * Read a File object and return its data-URL representation.
     */
    function fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () =>
                reject(reader.error || new Error("Unable to read the file."));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Upload a File to the configured GitHub image-upload endpoint.
     * Falls back to returning a data-URL if no endpoint is configured.
     *
     * @param {File} file
     * @param {string} uploadUrl  – the GitHub upload endpoint (may be empty)
     * @returns {Promise<string>} the resulting image URL or data-URL
     */
    async function uploadMedia(file, uploadUrl) {
        if (!uploadUrl) {
            return fileToDataUrl(file);
        }

        const formData = new FormData();
        formData.append("file", file, file.name || "family-media");

        const response = await fetch(uploadUrl, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || "Could not upload the file.");
        }

        const result = await response.json().catch(() => ({}));
        const imageUrl = String(
            result.imageUrl || result.url || result.rawUrl || ""
        ).trim();

        if (!imageUrl) {
            throw new Error("The upload service did not return an image link.");
        }

        return imageUrl;
    }

    // ── Media Detection ─────────────────────────────────────

    /**
     * Return true when a URL points to a video resource.
     */
    function isVideoUrl(url) {
        if (!url) return false;
        return (
            /\.(mp4|webm|mov|ogg)(\?|$)/i.test(url) ||
            url.startsWith("data:video")
        );
    }

    // ── Debounce ────────────────────────────────────────────

    /**
     * Return a debounced version of `fn` that delays invocation
     * until `ms` milliseconds after the last call.
     */
    function debounce(fn, ms) {
        let timer = null;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), ms);
        };
    }

    // ── Safe Array ──────────────────────────────────────────

    /**
     * Normalise a value to an array.
     * - null / undefined → []
     * - already an array  → returned as-is
     * - anything else     → wrapped in an array
     */
    function safeArray(v) {
        if (v == null) return [];
        return Array.isArray(v) ? v : [v];
    }

    // ── Export ───────────────────────────────────────────────

    window.SentinelUtils = Object.freeze({
        FALLBACK_AVATAR,
        makeId,
        escapeHtml,
        computeAge,
        fileToDataUrl,
        uploadMedia,
        isVideoUrl,
        debounce,
        safeArray
    });
})();
