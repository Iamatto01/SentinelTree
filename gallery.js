document.addEventListener("DOMContentLoaded", () => {
    const galleryContainer = document.getElementById("gallery-container");
    const emptyState = document.getElementById("gallery-empty");
    const sortSelect = document.getElementById("gallery-sort");
    
    // Modal elements
    const addImageBtn = document.getElementById("add-image-button");
    const uploadModal = document.getElementById("upload-modal");
    
    const modeRadios = document.querySelectorAll('input[name="upload-mode"]');
    const uploadInputLabel = document.getElementById("upload-input-label");
    const fileInput = document.getElementById("upload-file-input");
    const folderInput = document.getElementById("upload-folder-input");
    const selectionCount = document.getElementById("upload-selection-count");

    const eventSelect = document.getElementById("upload-event-select");
    const newEventInput = document.getElementById("upload-new-event-input");
    const statusText = document.getElementById("upload-status");
    const submitBtn = document.getElementById("upload-submit-btn");
    const cancelBtn = document.getElementById("upload-cancel-btn");

    let allImages = [];

    function isVideoUrl(url) {
        return url.match(/\.(mp4|webm|mov|ogg)$/i) || url.startsWith('data:video');
    }

    // Utility: Convert File to Data URL
    function fileToDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(reader.error || new Error("Unable to read the file."));
            reader.readAsDataURL(file);
        });
    }

    // Utility: Upload to Google Drive or fallback to Data URL
    async function uploadPhotoToDrive(file) {
        if (!window.FamilyTreeStore || !window.FamilyTreeStore.uploadMedia) {
            return fileToDataUrl(file);
        }
        const uploaded = await window.FamilyTreeStore.uploadMedia(file, {
            category: "gallery"
        });
        const imageUrl = String(uploaded && uploaded.url ? uploaded.url : "").trim();

        if (!imageUrl) {
            throw new Error("The upload service did not return a valid link.");
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

        // Sort keys (events) alphabetically
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
                let media;
                if (isVideoUrl(imgData.image_url)) {
                    media = document.createElement("video");
                    media.controls = true;
                    // Preload metadata to avoid fetching full video immediately
                    media.preload = "metadata";
                } else {
                    media = document.createElement("img");
                    media.alt = eventName;
                }
                media.src = imgData.image_url;
                media.title = eventName;
                media.style.objectFit = 'cover';
                scrollDiv.appendChild(media);
            });

            eventDiv.appendChild(scrollDiv);
            galleryContainer.appendChild(eventDiv);
        });

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
    function updateInputMode() {
        const mode = document.querySelector('input[name="upload-mode"]:checked').value;
        if (mode === 'files') {
            uploadInputLabel.textContent = "Select Files (Images or Videos)";
            fileInput.style.display = "block";
            folderInput.style.display = "none";
            folderInput.value = "";
        } else {
            uploadInputLabel.textContent = "Select Folder";
            fileInput.style.display = "none";
            folderInput.style.display = "block";
            fileInput.value = "";
        }
        selectionCount.textContent = "";
    }

    modeRadios.forEach(radio => radio.addEventListener('change', updateInputMode));

    function updateSelectionCount(files) {
        const valid = Array.from(files).filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));
        selectionCount.textContent = valid.length > 0 ? `Selected ${valid.length} media file(s)` : "";
    }

    if (fileInput) fileInput.addEventListener('change', () => updateSelectionCount(fileInput.files));
    if (folderInput) folderInput.addEventListener('change', () => updateSelectionCount(folderInput.files));

    function openModal() {
        uploadModal.classList.remove("hidden");
        uploadModal.style.display = "flex";
        statusText.textContent = "";
        statusText.style.color = "#c2410c";
        
        fileInput.value = "";
        folderInput.value = "";
        selectionCount.textContent = "";
        eventSelect.value = "";
        newEventInput.value = "";
        
        document.querySelector('input[name="upload-mode"][value="files"]').checked = true;
        updateInputMode();
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

    // Submit logic
    if (submitBtn) {
        submitBtn.addEventListener("click", async () => {
            const mode = document.querySelector('input[name="upload-mode"]:checked').value;
            const activeInput = mode === 'files' ? fileInput : folderInput;
            
            let allFiles = Array.from(activeInput.files);
            let validFiles = allFiles.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/'));

            if (validFiles.length === 0) {
                statusText.textContent = "Please select at least one valid image or video file.";
                return;
            }

            const evName = newEventInput.value.trim() || eventSelect.value || "General";

            if (!window.FamilyTreeStore || !window.FamilyTreeStore.isConfigured()) {
                statusText.textContent = "Google Apps Script not connected. Cannot save.";
                return;
            }

            try {
                submitBtn.disabled = true;
                statusText.style.color = "#0e7490";
                
                let uploadedCount = 0;
                const totalFiles = validFiles.length;

                for (let i = 0; i < totalFiles; i++) {
                    const file = validFiles[i];
                    submitBtn.textContent = `Uploading ${i + 1} of ${totalFiles}...`;
                    statusText.textContent = `Uploading "${file.name}"...`;

                    // Upload to Google Drive / convert
                    const imageUrl = await uploadPhotoToDrive(file);

                    // Save to DB
                    await window.FamilyTreeStore.addGalleryImage({
                        event_name: evName,
                        image_url: imageUrl
                    });

                    uploadedCount++;
                }

                statusText.textContent = `Success! Uploaded ${uploadedCount} file(s).`;
                statusText.style.color = "#16a34a"; // Green
                submitBtn.textContent = "Done";

                setTimeout(() => {
                    closeModal();
                    refreshGallery();
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Upload Media";
                }, 1500);

            } catch (err) {
                console.error(err);
                statusText.style.color = "#c2410c";
                statusText.textContent = err.message || "Something went wrong during upload.";
                submitBtn.disabled = false;
                submitBtn.textContent = "Retry Upload";
            }
        });
    }

    // Initial load
    refreshGallery();
});
