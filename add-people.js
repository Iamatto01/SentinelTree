/**
 * add-people.js — Form logic for adding / editing family members
 *
 * Depends on: utils.js, family-data.js, data-store.js, app.js
 *
 * Uses FamilyDataRegistry for the connection dropdown instead of
 * recursively crawling the old hardcoded tree on every refresh.
 * Shared file-upload logic comes from SentinelUtils.
 */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const U = window.SentinelUtils;
    const config = window.FAMILY_TREE_CONFIG || {};
    const githubImageUploadUrl = String(config.githubImageUploadUrl || "").trim();

    // ── DOM refs ────────────────────────────────────────────
    const form = document.getElementById("person-form");
    const statusText = document.getElementById("add-person-status");
    const submitButton = document.getElementById("save-person-button");
    const photoInput = document.getElementById("photo-file");
    const photoPreview = document.getElementById("photo-preview");
    const photoUrlInput = document.getElementById("photo-url");
    const relationInput = document.getElementById("relation");
    const parentNameSelect = document.getElementById("parent-name");
    const parentNameHelp = document.getElementById("parent-name-help");
    const saveHint = document.getElementById("save-hint");

    const connectionOrder = ["Parent", "Sibling", "Partner", "Child", "Other"];

    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get("edit");

    if (!form || !window.FamilyTreeStore) return;

    // ── Status helpers ──────────────────────────────────────

    function updateStatus() {
        if (statusText) {
            statusText.textContent = window.FamilyTreeStore.statusLabel();
        }
        if (saveHint) {
            saveHint.textContent = window.FamilyTreeStore.isConfigured()
                ? "Your details are ready to save."
                : "Connect your save details to begin.";
        }
    }

    function setConnectionHelp(message) {
        if (parentNameHelp) parentNameHelp.textContent = message;
    }

    function resetConnectionDropdown(promptText) {
        if (!parentNameSelect) return;
        parentNameSelect.innerHTML = "";
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = promptText;
        placeholder.disabled = true;
        placeholder.selected = true;
        parentNameSelect.appendChild(placeholder);
    }

    // ── Dropdown population using FamilyDataRegistry ────────

    function groupPeopleByRelation(people) {
        const grouped = new Map(connectionOrder.map((r) => [r, []]));
        people.forEach((person) => {
            const rel = person.relation || "Other";
            if (!grouped.has(rel)) grouped.set(rel, []);
            grouped.get(rel).push(person);
        });
        return grouped;
    }

    /**
     * Build the list of people for the connection dropdown.
     * Uses the FamilyDataRegistry (O(1) lookups) instead of
     * the old recursive tree crawl.
     */
    function getSeedPeople() {
        if (!window.familyRegistry) return [];

        return window.familyRegistry.getAll().map((p) => ({
            name: p.name,
            relation: window.familyRegistry.deriveRole(p.id)
        }));
    }

    function dedupePeople(people) {
        const seen = new Set();
        return people.filter((p) => {
            const key = `${p.name || ""}::${p.relation || "Other"}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    async function refreshConnectionDropdown() {
        if (!parentNameSelect) return;

        const configured = window.FamilyTreeStore.isConfigured();
        parentNameSelect.disabled = true;
        resetConnectionDropdown(
            configured
                ? "Loading saved family members..."
                : "Loading family members..."
        );
        setConnectionHelp(
            configured
                ? "Choose an existing family member so the connection stays attached to a saved record."
                : "Choose a family member from the built-in tree, or connect the database to load saved people."
        );

        let people = getSeedPeople();

        if (configured) {
            try {
                const savedPeople = await window.FamilyTreeStore.loadPeople();
                people = [...savedPeople, ...people];
            } catch (_) {
                // keep seed people only
            }
        }

        const merged = dedupePeople(people);

        resetConnectionDropdown(
            merged.length > 0
                ? "Select connected parent or sibling"
                : "No saved family members yet"
        );

        if (merged.length === 0) {
            setConnectionHelp("Save one person first, then choose them here.");
            return;
        }

        const grouped = groupPeopleByRelation(merged);
        connectionOrder.forEach((relation) => {
            const entries = grouped.get(relation) || [];
            if (entries.length === 0) return;

            const group = document.createElement("optgroup");
            group.label = relation;

            entries.forEach((person) => {
                const option = document.createElement("option");
                option.value = person.name;
                option.textContent = person.name;
                group.appendChild(option);
            });

            parentNameSelect.appendChild(group);
        });

        parentNameSelect.disabled = false;
        parentNameSelect.value = "";
    }

    // ── Photo helpers (using shared utils) ──────────────────

    async function syncPreviewFromFile() {
        const file =
            photoInput && photoInput.files ? photoInput.files[0] : null;
        if (!file) {
            if (photoPreview) {
                photoPreview.classList.add("hidden");
                photoPreview.removeAttribute("src");
            }
            return "";
        }

        const dataUrl = await U.fileToDataUrl(file);
        if (photoPreview) {
            photoPreview.src = dataUrl;
            photoPreview.classList.remove("hidden");
        }
        return dataUrl;
    }

    async function resolveImageUrl() {
        const selectedFile =
            photoInput && photoInput.files ? photoInput.files[0] : null;

        if (photoUrlInput && photoUrlInput.value.trim()) {
            return photoUrlInput.value.trim();
        }

        if (selectedFile) {
            return U.uploadMedia(selectedFile, githubImageUploadUrl);
        }

        return "";
    }

    // ── Events ──────────────────────────────────────────────

    if (photoInput) {
        photoInput.addEventListener("change", () => {
            syncPreviewFromFile().catch(() => {
                if (statusText)
                    statusText.textContent = "Could not read that image file.";
            });
        });
    }

    if (relationInput) {
        relationInput.addEventListener("change", () => {
            if (saveHint && relationInput.value) {
                saveHint.textContent = `Saving this person as ${relationInput.value.toLowerCase()}.`;
            }
        });
    }

    // ── Form submission (with double-submit protection) ─────

    let submitting = false;

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (submitting) return;
        submitting = true;

        // Client-side validation
        const nameInput = document.getElementById("name");
        if (!nameInput || !nameInput.value.trim()) {
            if (statusText) statusText.textContent = "Name is required.";
            submitting = false;
            return;
        }

        await syncPreviewFromFile().catch(() => "");

        let imageUrl;
        try {
            imageUrl = await resolveImageUrl();
        } catch (err) {
            if (statusText)
                statusText.textContent =
                    err.message || "Could not process the photo.";
            submitting = false;
            return;
        }

        const phoneInput = document.getElementById("phone");
        const payload = {
            name: nameInput.value.trim(),
            relation: document.getElementById("relation").value,
            birthday: document.getElementById("birthday").value.trim(),
            birthPlace: document.getElementById("birth-place").value.trim(),
            occupation: document.getElementById("occupation").value.trim(),
            phone: phoneInput ? phoneInput.value.trim() : "",
            parentName: parentNameSelect
                ? parentNameSelect.value.trim()
                : "",
            partnerName: document.getElementById("partner-name").value.trim(),
            notes: document.getElementById("notes").value.trim(),
            imageUrl: imageUrl || "images/placeholder.png"
        };

        submitButton.disabled = true;
        submitButton.textContent = "Saving...";

        try {
            if (editId && window.FamilyTreeStore.updatePerson) {
                await window.FamilyTreeStore.updatePerson(editId, payload);
                if (statusText)
                    statusText.textContent = "Record updated successfully.";
                submitButton.textContent = "Saved";
                setTimeout(
                    () => (window.location.href = "index.html"),
                    1500
                );
            } else {
                await window.FamilyTreeStore.addPerson(payload);
                updateStatus();
                form.reset();

                if (photoPreview) {
                    photoPreview.classList.add("hidden");
                    photoPreview.removeAttribute("src");
                }
                if (photoUrlInput) photoUrlInput.value = "";
                if (relationInput) relationInput.value = "Other";

                await refreshConnectionDropdown();
                if (parentNameSelect) parentNameSelect.value = "";

                if (statusText) {
                    statusText.textContent =
                        "Saved. Return to the tree to see the latest additions.";
                }

                // Dispatch event so other open tabs / components can react
                window.dispatchEvent(
                    new CustomEvent("family-person-added", {
                        detail: payload
                    })
                );
            }
        } catch (error) {
            if (statusText) {
                statusText.textContent =
                    error && error.message
                        ? error.message
                        : "Could not save this person.";
            }
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Save person";
            submitting = false;
        }
    });

    // ── Initialisation ──────────────────────────────────────

    updateStatus();

    refreshConnectionDropdown().then(async () => {
        if (editId && window.FamilyTreeStore.getPerson) {
            try {
                const person = await window.FamilyTreeStore.getPerson(editId);
                if (person) {
                    document.getElementById("name").value =
                        person.name || "";
                    if (relationInput)
                        relationInput.value = person.relation || "Other";
                    document.getElementById("birthday").value =
                        person.birthday || "";
                    document.getElementById("birth-place").value =
                        person.birthPlace || "";
                    document.getElementById("occupation").value =
                        person.occupation || "";
                    const phoneInput = document.getElementById("phone");
                    if (phoneInput) phoneInput.value = person.phone || "";
                    if (parentNameSelect)
                        parentNameSelect.value = person.parentName || "";
                    document.getElementById("partner-name").value =
                        person.partnerName || "";
                    document.getElementById("notes").value =
                        person.notes || "";

                    if (
                        person.imageUrl &&
                        photoPreview &&
                        person.imageUrl !== "images/placeholder.png"
                    ) {
                        photoPreview.src = person.imageUrl;
                        photoPreview.classList.remove("hidden");
                        if (
                            photoUrlInput &&
                            person.imageUrl.startsWith("http")
                        ) {
                            photoUrlInput.value = person.imageUrl;
                        }
                    }

                    submitButton.textContent = "Update person";
                    const pageTitle = document.querySelector(
                        ".hero-copy h1"
                    );
                    if (pageTitle)
                        pageTitle.textContent = "Edit relative.";
                    const eyebrow =
                        document.querySelector(".eyebrow");
                    if (eyebrow) eyebrow.textContent = "Edit person";
                }
            } catch (err) {
                console.error("Failed to load person for edit:", err);
            }
        }
    });
});
