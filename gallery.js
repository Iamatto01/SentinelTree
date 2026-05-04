document.addEventListener("DOMContentLoaded", () => {
    const galleryContainer = document.getElementById("gallery-container");
    const emptyState = document.getElementById("gallery-empty");
    const sortSelect = document.getElementById("gallery-sort");
    
    // Modal elements
    const addImageBtn = document.getElementById("add-image-button");
    const uploadModal = document.getElementById("upload-modal");
    const fileInput = document.getElementById("upload-file-input");
    const previewImg = document.getElementById("upload-preview");
    const eventSelect = document.getElementById("upload-event-select");
    const newEventInput = document.getElementById("upload-new-event-input");
    const statusText = document.getElementById("upload-status");
    const submitBtn = document.getElementById("upload-submit-btn");
    const cancelBtn = document.getElementById("upload-cancel-btn");

    const config = window.FAMILY_TREE_CONFIG || {};
    const githubImageUploadUrl = String(config.githubImageUploadUrl || "").trim();

    let allImages = [];

    // Utility: Convert File to Data URL
    function fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(reader.error || new Error("Unable to read the image."));
            reader.readAsDataURL(file);
        });
    }

    // Utility: Upload to external URL or fallback to Data URL
    async function uploadPhotoToGitHub(file) {
        if (!githubImageUploadUrl) {
            return fileToDataUrl(file);
        }

        const formData = new FormData();
        formData.append("file", file, file.name || "gallery-photo");

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

    // Load and Render Gallery
    async function refreshGallery() {
        if (!window.FamilyTreeStore) return;

        allImages = await window.FamilyTreeStore.loadGalleryImages();
        renderGallery(allImages);
        updateSortDropdowns(allImages);
    }

    function renderGallery(images) {
        if (!images || images.length === 0) {
            galleryContainer.innerHTML = '';
            galleryContainer.appendChild(emptyState);
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        galleryContainer.innerHTML = '';

        // Group by event_name
        const grouped = images.reduce((acc, img) => {
            const event = img.event_name || 'General';
            if (!acc[event]) acc[event] = [];
            acc[event].push(img);
            return acc;
        }, {});

        // Sort keys (events) alphabetically, or maybe by most recent? Let's do alphabetical
        const events = Object.keys(grouped).sort();

        events.forEach(eventName => {
            const eventDiv = document.createElement("div");
            eventDiv.className = "gallery-event";
            eventDiv.setAttribute("data-category", eventName);
            
            const title = document.createElement("h2");
            title.textContent = eventName;
            eventDiv.appendChild(title);

            const scrollDiv = document.createElement("div");
            scrollDiv.className = "gallery-scroll";

            grouped[eventName].forEach(imgData => {
                const img = document.createElement("img");
                img.src = imgData.image_url;
                img.alt = eventName;
                img.style.objectFit = 'cover';
                scrollDiv.appendChild(img);
            });

            eventDiv.appendChild(scrollDiv);
            galleryContainer.appendChild(eventDiv);
        });

        // Apply current sort filter if any
        if (sortSelect) {
            applySort(sortSelect.value);
        }
    }

    function updateSortDropdowns(images) {
        const eventsSet = new Set(images.map(img => img.event_name || 'General'));
        const events = Array.from(eventsSet).sort();

        // Update Sort Select
        if (sortSelect) {
            const currentVal = sortSelect.value;
            sortSelect.innerHTML = '<option value="all">All Events</option>';
            events.forEach(ev => {
                const opt = document.createElement("option");
                opt.value = ev;
                opt.textContent = ev;
                sortSelect.appendChild(opt);
            });
            if (events.includes(currentVal)) {
                sortSelect.value = currentVal;
            } else {
                sortSelect.value = 'all';
            }
        }

        // Update Modal Event Select
        if (eventSelect) {
            const currentVal = eventSelect.value;
            eventSelect.innerHTML = '<option value="">-- Select Existing Event --</option>';
            events.forEach(ev => {
                const opt = document.createElement("option");
                opt.value = ev;
                opt.textContent = ev;
                eventSelect.appendChild(opt);
            });
            if (events.includes(currentVal)) {
                eventSelect.value = currentVal;
            } else {
                eventSelect.value = '';
            }
        }
    }

    function applySort(selected) {
        const eventsElements = document.querySelectorAll(".gallery-event");
        eventsElements.forEach(eventEl => {
            const category = eventEl.getAttribute("data-category");
            if (selected === "all" || category === selected) {
                eventEl.style.display = "block";
            } else {
                eventEl.style.display = "none";
            }
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => applySort(e.target.value));
    }

    // Modal logic
    function openModal() {
        uploadModal.classList.remove("hidden");
        uploadModal.style.display = "flex";
        statusText.textContent = "";
        statusText.style.color = "#c2410c";
        // Reset form
        fileInput.value = "";
        previewImg.src = "";
        previewImg.style.display = "none";
        previewImg.classList.add("hidden");
        eventSelect.value = "";
        newEventInput.value = "";
    }

    function closeModal() {
        uploadModal.classList.add("hidden");
        uploadModal.style.display = "none";
    }

    if (addImageBtn) {
        addImageBtn.addEventListener("click", openModal);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener("click", closeModal);
    }

    if (fileInput) {
        fileInput.addEventListener("change", async () => {
            const file = fileInput.files[0];
            if (!file) {
                previewImg.style.display = "none";
                previewImg.classList.add("hidden");
                return;
            }
            try {
                const dataUrl = await fileToDataUrl(file);
                previewImg.src = dataUrl;
                previewImg.style.display = "block";
                previewImg.classList.remove("hidden");
            } catch (err) {
                statusText.textContent = "Could not preview the image.";
            }
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener("click", async () => {
            const file = fileInput.files[0];
            const evName = newEventInput.value.trim() || eventSelect.value || "General";

            if (!file) {
                statusText.textContent = "Please select an image file first.";
                return;
            }

            if (!window.FamilyTreeStore || !window.FamilyTreeStore.isConfigured()) {
                statusText.textContent = "Database not connected. Cannot save.";
                return;
            }

            try {
                submitBtn.disabled = true;
                submitBtn.textContent = "Uploading...";
                statusText.textContent = "Uploading image...";
                statusText.style.color = "#0e7490";

                const imageUrl = await uploadPhotoToGitHub(file);

                statusText.textContent = "Saving to database...";
                await window.FamilyTreeStore.addGalleryImage({
                    event_name: evName,
                    image_url: imageUrl
                });

                statusText.textContent = "Success!";
                statusText.style.color = "#16a34a"; // Green

                setTimeout(() => {
                    closeModal();
                    refreshGallery();
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Save Image";
                }, 1000);

            } catch (err) {
                console.error(err);
                statusText.style.color = "#c2410c";
                statusText.textContent = err.message || "Something went wrong during upload.";
                submitBtn.disabled = false;
                submitBtn.textContent = "Save Image";
            }
        });
    }

    // Initial load
    refreshGallery();
});
