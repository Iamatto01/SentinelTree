document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("person-form");
    const statusText = document.getElementById("add-person-status");
    const submitButton = document.getElementById("save-person-button");
    const photoInput = document.getElementById("photo-file");
    const photoPreview = document.getElementById("photo-preview");
    const photoUrlInput = document.getElementById("photo-url");
    const relationInput = document.getElementById("relation");
    const parentNameSelect = document.getElementById("parent-name");
    const parentNameHelp = document.getElementById("parent-name-help");
    const familyHeadSelect = document.getElementById("family-head");
    const familyHeadHelp = document.getElementById("family-head-help");
    const saveHint = document.getElementById("save-hint");
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
                : "Connect Google Apps Script to begin.";
        }
    }

    function setConnectionHelp(message) {
        if (parentNameHelp) {
            parentNameHelp.textContent = message;
        }
    }

    function setFamilyHeadHelp(message) {
        if (familyHeadHelp) {
            familyHeadHelp.textContent = message;
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

    function resetFamilyHeadDropdown(promptText) {
        if (!familyHeadSelect) {
            return;
        }

        familyHeadSelect.innerHTML = "";
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = promptText;
        placeholder.disabled = true;
        placeholder.selected = true;
        familyHeadSelect.appendChild(placeholder);
    }

    function getFamilyHeadCandidates(people) {
        const preferred = people.filter((person) => (person.relation || "").toLowerCase() === "parent");
        const source = preferred.length > 0 ? preferred : people;
        const seen = new Set();

        return source
            .map((person) => String(person.name || "").trim())
            .filter((name) => {
                if (!name || seen.has(name)) {
                    return false;
                }
                seen.add(name);
                return true;
            });
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
        if (familyHeadSelect) {
            familyHeadSelect.disabled = true;
        }
        resetConnectionDropdown(configured ? "Loading saved family members..." : "Loading family members...");
        resetFamilyHeadDropdown(configured ? "Loading family heads..." : "Loading family heads...");
        setConnectionHelp(
            configured
                ? "Choose an existing family member so the connection stays attached to a saved record."
                : "Choose a family member from the built-in tree, or connect Google Apps Script to load saved people."
        );
        setFamilyHeadHelp("Choose the main head so records can be grouped in Google Sheet.");

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
        resetFamilyHeadDropdown(
            mergedPeople.length > 0 ? "Select family head" : "No family head options yet"
        );

        if (mergedPeople.length === 0) {
            setConnectionHelp("Save one person first, then choose them here.");
            setFamilyHeadHelp("Save one person first, then choose a family head.");
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

        const familyHeadCandidates = getFamilyHeadCandidates(mergedPeople);
        if (familyHeadSelect) {
            familyHeadCandidates.forEach((name) => {
                const option = document.createElement("option");
                option.value = name;
                option.textContent = name;
                familyHeadSelect.appendChild(option);
            });
            familyHeadSelect.disabled = false;
            familyHeadSelect.value = "";
        }
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

    async function uploadPhotoToDrive(file) {
        if (!window.FamilyTreeStore || !window.FamilyTreeStore.uploadMedia) {
            return fileToDataUrl(file);
        }

        const uploaded = await window.FamilyTreeStore.uploadMedia(file, {
            category: "people"
        });
        const imageUrl = String(uploaded && uploaded.url ? uploaded.url : "").trim();
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
            return uploadPhotoToDrive(selectedFile);
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
            familyHead: familyHeadSelect ? familyHeadSelect.value.trim() : "",
            partnerName: document.getElementById("partner-name").value.trim(),
            notes: document.getElementById("notes").value.trim(),
            imageUrl: imageUrl || "images/placeholder.png"
        };

        if (!payload.familyHead) {
            payload.familyHead = payload.parentName || payload.name;
        }

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
                if (familyHeadSelect) {
                    familyHeadSelect.value = "";
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
                    if (familyHeadSelect) familyHeadSelect.value = person.familyHead || "";
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
