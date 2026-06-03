/**
 * gallery.js — Gallery page logic for SentinelTree
 *
 * Depends on: utils.js, data-store.js
 *
 * Uses shared file-upload and media-detection utilities from
 * SentinelUtils instead of maintaining local copies.
 * Modal open/close uses CSS classes only — no inline style toggles.
 */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const U = window.SentinelUtils;
    const config = window.FAMILY_TREE_CONFIG || {};
    const githubImageUploadUrl = String(config.githubImageUploadUrl || "").trim();

    // ── DOM refs ────────────────────────────────────────────
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

    // ═══════════════════════════════════════════════════════
    //  Gallery Rendering
    // ═══════════════════════════════════════════════════════

    async function refreshGallery() {
        if (!window.FamilyTreeStore) return;

        // Use the namespaced gallery API, fall back to flat alias
        const loader = window.FamilyTreeStore.gallery
            ? window.FamilyTreeStore.gallery.load
            : window.FamilyTreeStore.loadGalleryImages;

        allImages = await loader();
        renderGallery(allImages);
        updateSortDropdowns(allImages);
    }

    function renderGallery(images) {
        if (!images || images.length === 0) {
            galleryContainer.innerHTML = "";
            galleryContainer.appendChild(emptyState);
            emptyState.style.display = "block";
            return;
        }

        emptyState.style.display = "none";
        galleryContainer.innerHTML = "";

        const scatterContainer = document.createElement("div");
        scatterContainer.className = "gallery-scatter-container";

        // Optional central quote (like the demo)
        const quote = document.createElement("p");
        quote.className = "gallery-quote";
        quote.innerHTML = "Family memories,<br>scattered in time.";
        scatterContainer.appendChild(quote);

        // Pre-defined scatter regions to spread them out roughly
        // If there are many images, they will overlap, which is fine and intended.
        images.forEach((imgData, index) => {
            const card = document.createElement("div");
            card.className = "draggable-card gallery-event"; 
            card.setAttribute("data-category", imgData.event_name || "General");

            // Random scatter layout
            const top = 10 + Math.random() * 60; // 10% to 70%
            const left = 5 + Math.random() * 70; // 5% to 75%
            const rot = -15 + Math.random() * 30; // -15deg to 15deg
            
            card.style.top = `${top}%`;
            card.style.left = `${left}%`;
            card.style.transform = `translate3d(0px, 0px, 0) rotate(${rot}deg) rotateX(0deg) rotateY(0deg) scale(1)`;

            let media;
            if (U.isVideoUrl(imgData.image_url)) {
                media = document.createElement("video");
                media.controls = true;
                media.preload = "metadata";
            } else {
                media = document.createElement("img");
                media.alt = imgData.event_name || "Memory";
                media.loading = "lazy";
            }
            media.src = imgData.image_url;
            card.appendChild(media);

            const title = document.createElement("h3");
            title.textContent = imgData.event_name || "Memory";
            card.appendChild(title);

            initDraggableCard(card, rot);
            scatterContainer.appendChild(card);
        });

        galleryContainer.appendChild(scatterContainer);

        if (sortSelect) applySort(sortSelect.value);
    }

    function initDraggableCard(card, baseRotate) {
        let isDragging = false;
        let startX, startY;
        let currentX = 0, currentY = 0;

        const glare = document.createElement("div");
        glare.className = "draggable-card-glare";
        card.appendChild(glare);

        let lastMouseX = 0, lastMouseY = 0;
        let velocityX = 0, velocityY = 0;
        let lastTime = Date.now();

        card.addEventListener("pointerdown", (e) => {
            isDragging = true;
            startX = e.clientX - currentX;
            startY = e.clientY - currentY;
            card.style.zIndex = "100";
            card.style.transition = "none";
            document.body.style.cursor = "grabbing";
            card.setPointerCapture(e.pointerId);
        });

        card.addEventListener("pointermove", (e) => {
            if (!isDragging) {
                // 3D Tilt on hover
                const rect = card.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                const deltaX = Math.max(-300, Math.min(300, e.clientX - centerX));
                const deltaY = Math.max(-300, Math.min(300, e.clientY - centerY));
                
                const rotateX = -(deltaY / 300) * 25;
                const rotateY = (deltaX / 300) * 25;
                const glareOp = Math.max(0, 0.2 - Math.abs(deltaX / 300) * 0.2);
                
                card.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) rotate(${baseRotate}deg) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
                glare.style.opacity = glareOp.toString();
                return;
            }

            const now = Date.now();
            const dt = Math.max(1, now - lastTime);
            
            velocityX = (e.clientX - lastMouseX) / dt;
            velocityY = (e.clientY - lastMouseY) / dt;

            currentX = e.clientX - startX;
            currentY = e.clientY - startY;
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            lastTime = now;

            // Apply 3D tilt while dragging
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const deltaX = Math.max(-300, Math.min(300, e.clientX - centerX));
            const deltaY = Math.max(-300, Math.min(300, e.clientY - centerY));
            const rotateX = -(deltaY / 300) * 25;
            const rotateY = (deltaX / 300) * 25;

            card.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) rotate(${baseRotate}deg) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener("pointerleave", () => {
            if (isDragging) return;
            card.style.transition = "transform 0.5s cubic-bezier(0.2, 0, 0, 1)";
            card.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) rotate(${baseRotate}deg) rotateX(0deg) rotateY(0deg) scale(1)`;
            glare.style.opacity = "0";
        });

        card.addEventListener("pointerup", (e) => {
            if (!isDragging) return;
            isDragging = false;
            document.body.style.cursor = "default";
            card.releasePointerCapture(e.pointerId);
            card.style.zIndex = "10";

            // Momentum throw
            currentX += velocityX * 120;
            currentY += velocityY * 120;

            card.style.transition = "transform 0.8s cubic-bezier(0.2, 0, 0, 1)";
            card.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) rotate(${baseRotate}deg) rotateX(0deg) rotateY(0deg) scale(1)`;
            glare.style.opacity = "0";
        });
    }

    function updateSortDropdowns(images) {
        const eventsSet = new Set(
            images.map((img) => img.event_name || "General")
        );
        const events = Array.from(eventsSet).sort();

        // Sort select
        if (sortSelect) {
            const currentVal = sortSelect.value;
            sortSelect.innerHTML =
                '<option value="all">All Events</option>';
            events.forEach((ev) => {
                const opt = document.createElement("option");
                opt.value = ev;
                opt.textContent = ev;
                sortSelect.appendChild(opt);
            });
            sortSelect.value = events.includes(currentVal)
                ? currentVal
                : "all";
        }

        // Modal event select
        if (eventSelect) {
            const currentVal = eventSelect.value;
            eventSelect.innerHTML =
                '<option value="">-- Select Existing Event --</option>';
            events.forEach((ev) => {
                const opt = document.createElement("option");
                opt.value = ev;
                opt.textContent = ev;
                eventSelect.appendChild(opt);
            });
            eventSelect.value = events.includes(currentVal)
                ? currentVal
                : "";
        }
    }

    function applySort(selected) {
        document.querySelectorAll(".gallery-event").forEach((el) => {
            const cat = el.getAttribute("data-category");
            el.style.display =
                selected === "all" || cat === selected ? "block" : "none";
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", (e) =>
            applySort(e.target.value)
        );
    }

    // ═══════════════════════════════════════════════════════
    //  Upload Modal
    // ═══════════════════════════════════════════════════════

    function updateInputMode() {
        const mode = document.querySelector(
            'input[name="upload-mode"]:checked'
        ).value;
        if (mode === "files") {
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

    modeRadios.forEach((radio) =>
        radio.addEventListener("change", updateInputMode)
    );

    function updateSelectionCount(files) {
        const valid = Array.from(files).filter(
            (f) =>
                f.type.startsWith("image/") || f.type.startsWith("video/")
        );
        selectionCount.textContent =
            valid.length > 0
                ? `Selected ${valid.length} media file(s)`
                : "";
    }

    if (fileInput)
        fileInput.addEventListener("change", () =>
            updateSelectionCount(fileInput.files)
        );
    if (folderInput)
        folderInput.addEventListener("change", () =>
            updateSelectionCount(folderInput.files)
        );

    function openModal() {
        uploadModal.classList.remove("hidden");
        uploadModal.classList.add("modal-visible");
        statusText.textContent = "";
        statusText.style.color = "#c2410c";

        fileInput.value = "";
        folderInput.value = "";
        selectionCount.textContent = "";
        eventSelect.value = "";
        newEventInput.value = "";

        document.querySelector(
            'input[name="upload-mode"][value="files"]'
        ).checked = true;
        updateInputMode();
    }

    function closeModal() {
        uploadModal.classList.add("hidden");
        uploadModal.classList.remove("modal-visible");
    }

    if (addImageBtn) addImageBtn.addEventListener("click", openModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    // ── Upload submission ───────────────────────────────────

    if (submitBtn) {
        submitBtn.addEventListener("click", async () => {
            const mode = document.querySelector(
                'input[name="upload-mode"]:checked'
            ).value;
            const activeInput = mode === "files" ? fileInput : folderInput;

            const allFiles = Array.from(activeInput.files);
            const validFiles = allFiles.filter(
                (f) =>
                    f.type.startsWith("image/") ||
                    f.type.startsWith("video/")
            );

            if (validFiles.length === 0) {
                statusText.textContent =
                    "Please select at least one valid image or video file.";
                return;
            }

            const evName =
                newEventInput.value.trim() ||
                eventSelect.value ||
                "General";

            if (
                !window.FamilyTreeStore ||
                !window.FamilyTreeStore.isConfigured()
            ) {
                statusText.textContent =
                    "Database not connected. Cannot save.";
                return;
            }

            // Use the namespaced gallery API, fall back to flat alias
            const addFn = window.FamilyTreeStore.gallery
                ? window.FamilyTreeStore.gallery.add
                : window.FamilyTreeStore.addGalleryImage;

            try {
                submitBtn.disabled = true;
                statusText.style.color = "#0e7490";

                let uploadedCount = 0;
                const total = validFiles.length;

                for (let i = 0; i < total; i++) {
                    const file = validFiles[i];
                    submitBtn.textContent = `Uploading ${i + 1} of ${total}...`;
                    statusText.textContent = `Uploading "${file.name}"...`;

                    // Upload via shared utility
                    const imageUrl = await U.uploadMedia(
                        file,
                        githubImageUploadUrl
                    );

                    await addFn({
                        event_name: evName,
                        image_url: imageUrl
                    });

                    uploadedCount++;
                }

                statusText.textContent = `Success! Uploaded ${uploadedCount} file(s).`;
                statusText.style.color = "#16a34a";
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
                statusText.textContent =
                    err.message || "Something went wrong during upload.";
                submitBtn.disabled = false;
                submitBtn.textContent = "Retry Upload";
            }
        });
    }

    // ── Initial load ────────────────────────────────────────

    refreshGallery();
});
