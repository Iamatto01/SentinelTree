document.addEventListener("DOMContentLoaded", () => {
    const config = window.FAMILY_TREE_CONFIG || {};
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
    const githubImageUploadUrl = String(config.githubImageUploadUrl || "").trim();
    const connectionOrder = ["Parent", "Sibling", "Partner", "Child", "Other"];
    
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');

    if (!form || !window.FamilyTreeStore) {
        return;
    }

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
        if (parentNameHelp) {
            parentNameHelp.textContent = message;
        }
    }

    function resetConnectionDropdown(promptText) {
        if (!parentNameSelect) {
            return;
        }

        parentNameSelect.innerHTML = "";
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = promptText;
        placeholder.disabled = true;
        placeholder.selected = true;
        parentNameSelect.appendChild(placeholder);
    }

    function groupPeopleByRelation(people) {
        const grouped = new Map(connectionOrder.map((relation) => [relation, []]));

        people.forEach((person) => {
            const relation = person.relation || "Other";
            if (!grouped.has(relation)) {
                grouped.set(relation, []);
            }

            grouped.get(relation).push(person);
        });

        return grouped;
    }

    function collectSeedPeople(root, relation = "Other", collection = [], seen = new Set()) {
        if (!root) {
            return collection;
        }

        if (Array.isArray(root)) {
            root.forEach((item) => collectSeedPeople(item, relation, collection, seen));
            return collection;
        }

        if (typeof root !== "object") {
            return collection;
        }

        if (root.name) {
            const key = `${root.name}::${relation}`;
            if (!seen.has(key)) {
                seen.add(key);
                collection.push({
                    name: root.name,
                    relation
                });
            }
        }

        const relationMap = {
            parents: "Parent",
            siblings: "Sibling",
            children: "Child",
            partner: "Partner"
        };

        Object.entries(relationMap).forEach(([key, nextRelation]) => {
            if (root[key]) {
                collectSeedPeople(root[key], nextRelation, collection, seen);
            }
        });

        return collection;
    }

    function getSeedPeople() {
        if (typeof familyTreeData === "undefined") {
            return [];
        }

        return collectSeedPeople(familyTreeData);
    }

    function dedupePeople(people) {
        const seen = new Set();

        return people.filter((person) => {
            const key = `${person.name || ""}::${person.relation || "Other"}`;
            if (seen.has(key)) {
                return false;
            }

            seen.add(key);
            return true;
        });
    }

    async function refreshConnectionDropdown() {
        if (!parentNameSelect) {
            return;
        }

        const configured = window.FamilyTreeStore.isConfigured();
        parentNameSelect.disabled = true;
        resetConnectionDropdown(configured ? "Loading saved family members..." : "Loading family members...");
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
            } catch (error) {
                people = [...people];
            }
        }

        const mergedPeople = dedupePeople(people);

        resetConnectionDropdown(
            mergedPeople.length > 0 ? "Select connected parent or sibling" : "No saved family members yet"
        );

        if (mergedPeople.length === 0) {
            setConnectionHelp("Save one person first, then choose them here.");
            return;
        }

        const groupedPeople = groupPeopleByRelation(mergedPeople);
        connectionOrder.forEach((relation) => {
            const entries = groupedPeople.get(relation) || [];
            if (entries.length === 0) {
                return;
            }

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

    function fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(reader.error || new Error("Unable to read the image."));
            reader.readAsDataURL(file);
        });
    }

    async function syncPreviewFromFile() {
        const file = photoInput && photoInput.files ? photoInput.files[0] : null;
        if (!file) {
            if (photoPreview) {
                photoPreview.classList.add("hidden");
                photoPreview.removeAttribute("src");
            }
            return "";
        }

        const dataUrl = await fileToDataUrl(file);
        if (photoPreview) {
            photoPreview.src = dataUrl;
            photoPreview.classList.remove("hidden");
        }

        return dataUrl;
    }

    async function uploadPhotoToGitHub(file) {
        if (!githubImageUploadUrl) {
            return fileToDataUrl(file);
        }

        const formData = new FormData();
        formData.append("file", file, file.name || "family-photo");

        const response = await fetch(githubImageUploadUrl, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const message = await response.text();
            throw new Error(message || "Could not upload the image.");
        }

        const result = await response.json().catch(() => ({}));
        const imageUrl = String(result.imageUrl || result.url || result.rawUrl || "").trim();

        if (!imageUrl) {
            throw new Error("The upload service did not return an image link.");
        }

        return imageUrl;
    }

    async function resolveImageUrl() {
        const selectedFile = photoInput && photoInput.files ? photoInput.files[0] : null;

        if (photoUrlInput && photoUrlInput.value.trim()) {
            return photoUrlInput.value.trim();
        }

        if (selectedFile) {
            return uploadPhotoToGitHub(selectedFile);
        }

        return "";
    }

    if (photoInput) {
        photoInput.addEventListener("change", () => {
            syncPreviewFromFile().catch(() => {
                if (statusText) {
                    statusText.textContent = "Could not read that image file.";
                }
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

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        await syncPreviewFromFile().catch(() => "");
        const imageUrl = await resolveImageUrl().catch((error) => {
            throw error;
        });
        const phoneInput = document.getElementById("phone");
        const payload = {
            name: document.getElementById("name").value.trim(),
            relation: document.getElementById("relation").value,
            birthday: document.getElementById("birthday").value.trim(),
            birthPlace: document.getElementById("birth-place").value.trim(),
            occupation: document.getElementById("occupation").value.trim(),
            phone: phoneInput ? phoneInput.value.trim() : "",
            parentName: parentNameSelect ? parentNameSelect.value.trim() : "",
            partnerName: document.getElementById("partner-name").value.trim(),
            notes: document.getElementById("notes").value.trim(),
            imageUrl: imageUrl || "images/placeholder.png"
        };

        submitButton.disabled = true;
        submitButton.textContent = "Saving...";

        try {
            if (editId && window.FamilyTreeStore.updatePerson) {
                await window.FamilyTreeStore.updatePerson(editId, payload);
                if (statusText) statusText.textContent = "Record updated successfully.";
                submitButton.textContent = "Saved";
                setTimeout(() => window.location.href = "index.html", 1500);
            } else {
                await window.FamilyTreeStore.addPerson(payload);
                updateStatus();
                form.reset();
                if (photoPreview) {
                    photoPreview.classList.add("hidden");
                    photoPreview.removeAttribute("src");
                }
                if (photoUrlInput) {
                    photoUrlInput.value = "";
                }
                if (relationInput) {
                    relationInput.value = "Other";
                }
                await refreshConnectionDropdown();
                if (parentNameSelect) {
                    parentNameSelect.value = "";
                }
                if (statusText) {
                    statusText.textContent = "Saved. Return to the tree to see the latest additions.";
                }
            }
        } catch (error) {
            if (statusText) {
                statusText.textContent = error && error.message ? error.message : "Could not save this person.";
            }
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = "Save person";
        }
    });

    updateStatus();
    refreshConnectionDropdown().then(async () => {
        if (editId && window.FamilyTreeStore.getPerson) {
            try {
                const person = await window.FamilyTreeStore.getPerson(editId);
                if (person) {
                    document.getElementById("name").value = person.name || "";
                    if (relationInput) relationInput.value = person.relation || "Other";
                    document.getElementById("birthday").value = person.birthday || "";
                    document.getElementById("birth-place").value = person.birthPlace || "";
                    document.getElementById("occupation").value = person.occupation || "";
                    const phoneInput = document.getElementById("phone");
                    if (phoneInput) phoneInput.value = person.phone || "";
                    if (parentNameSelect) parentNameSelect.value = person.parentName || "";
                    document.getElementById("partner-name").value = person.partnerName || "";
                    document.getElementById("notes").value = person.notes || "";
                    if (person.imageUrl && photoPreview && person.imageUrl !== "images/placeholder.png") {
                        photoPreview.src = person.imageUrl;
                        photoPreview.classList.remove("hidden");
                        if (photoUrlInput && person.imageUrl.startsWith("http")) {
                            photoUrlInput.value = person.imageUrl;
                        }
                    }
                    submitButton.textContent = "Update person";
                    const pageTitle = document.querySelector(".hero-copy h1");
                    if (pageTitle) pageTitle.textContent = "Edit relative.";
                    const eyebrow = document.querySelector(".eyebrow");
                    if (eyebrow) eyebrow.textContent = "Edit person";
                }
            } catch (err) {
                console.error("Failed to load person for edit", err);
            }
        }
    });
});
