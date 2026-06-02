/**
 * app.js — Main application logic for SentinelTree
 *
 * Depends on: utils.js, family-data.js, data-store.js
 *
 * Contains:
 *   ThemeToggler  – dark / light mode persistence
 *   TreeRenderer  – renders the family tree with navigation
 *   ProfileModal  – shows detailed person info in a modal
 *   renderRecentPeople – populates the "recent additions" section
 */

(function () {
    "use strict";

    const U = window.SentinelUtils;

    // ═══════════════════════════════════════════════════════
    //  Theme Toggler
    // ═══════════════════════════════════════════════════════

    class ThemeToggler {
        constructor(toggleElement) {
            this.el = toggleElement;
            if (!this.el) return;

            const isDark = localStorage.getItem("theme") === "dark";
            document.body.classList.toggle("night", isDark);
            this.el.checked = isDark;
            this.el.addEventListener("change", () => this._toggle());
        }

        _toggle() {
            const isDark = this.el.checked;
            document.body.classList.toggle("night", isDark);
            localStorage.setItem("theme", isDark ? "dark" : "day");
        }
    }

    // ═══════════════════════════════════════════════════════
    //  Profile Modal
    // ═══════════════════════════════════════════════════════

    class ProfileModal {
        constructor() {
            this.modal = document.getElementById("profile-modal");
            if (!this.modal) return;

            this.els = {
                close: document.getElementById("modal-close"),
                name: document.getElementById("modal-name"),
                avatar: document.getElementById("modal-avatar"),
                subtitle: document.getElementById("modal-subtitle"),
                tags: document.getElementById("modal-tags"),
                timeline: document.getElementById("life-timeline"),
                birth: document.getElementById("info-birth"),
                place: document.getElementById("info-place"),
                death: document.getElementById("info-death"),
                occupation: document.getElementById("info-occupation"),
                phone: document.getElementById("info-phone"),
                editBtn: document.getElementById("modal-edit-btn"),
                removeBtn: document.getElementById("modal-remove-btn")
            };

            this.current = null;
            this._bindEvents();
        }

        _bindEvents() {
            if (!this.modal) return;

            if (this.els.close) {
                this.els.close.addEventListener("click", () => this.close());
            }

            const backdrop = this.modal.querySelector(".modal-backdrop");
            if (backdrop) {
                backdrop.addEventListener("click", () => this.close());
            }

            if (this.els.editBtn) {
                this.els.editBtn.addEventListener("click", () =>
                    this._onEdit()
                );
            }

            if (this.els.removeBtn) {
                this.els.removeBtn.addEventListener("click", () =>
                    this._onRemove()
                );
            }
        }

        open(person, role) {
            if (!person || !this.modal) return;
            this.current = person;

            this.modal.classList.remove("hidden");
            this.modal.setAttribute("aria-hidden", "false");

            this.els.name.textContent = person.fullName || person.name || "Unknown";
            this.els.avatar.src = person.image || person.imageUrl || U.FALLBACK_AVATAR;

            // Subtitle: birthday + age
            const age = U.computeAge(person.birthday);
            const parts = [person.birthday || "Unknown"];
            if (age !== null) parts.push(`${age} years`);
            this.els.subtitle.textContent = parts.join(" · ");

            // Tags
            this.els.tags.innerHTML = "";
            const roles = person.roles || (role ? [role] : []);
            U.safeArray(roles).forEach((r) => {
                const span = document.createElement("span");
                span.className = "tag";
                span.textContent = r;
                this.els.tags.appendChild(span);
            });

            // Title (e.g. Dato Batul, Dato Tiri)
            if (person.title) {
                const titleTag = document.createElement("span");
                titleTag.className = "tag tag--title";
                titleTag.textContent = person.title;
                this.els.tags.prepend(titleTag);
            }

            // Deceased indicator
            if (person.deceased) {
                const deceasedTag = document.createElement("span");
                deceasedTag.className = "tag tag--deceased";
                deceasedTag.textContent = "Al-Fatihah";
                this.els.tags.appendChild(deceasedTag);
            }

            // Essential info
            this.els.birth.textContent = person.birthday || "Unknown";
            this.els.place.textContent =
                person.birthPlace || person.birth_place || "Unknown";
            this.els.death.textContent =
                person.deceased ? "Al-Fatihah (Deceased)" :
                person.deathDate || person.death_date || "Living";
            this.els.occupation.textContent = person.occupation || "Unknown";
            if (this.els.phone) {
                this.els.phone.textContent = person.phone || "Unknown";
            }

            // Life timeline
            this.els.timeline.innerHTML = "";
            const events = person.timeline || [
                {
                    year: person.birthday || "",
                    title: "Born",
                    details: person.birthPlace || ""
                }
            ];
            U.safeArray(events).forEach((ev) => {
                const li = document.createElement("li");
                li.innerHTML = `<strong>${U.escapeHtml(ev.year || "")} ${
                    ev.title ? "- " + U.escapeHtml(ev.title) : ""
                }</strong><div class="small">${U.escapeHtml(
                    ev.details || ""
                )}</div>`;
                this.els.timeline.appendChild(li);
            });
        }

        close() {
            if (!this.modal) return;
            this.modal.classList.add("hidden");
            this.modal.setAttribute("aria-hidden", "true");
            this.current = null;
        }

        _onEdit() {
            if (!this.current) return;
            if (
                this.current.id &&
                window.FamilyTreeStore &&
                window.FamilyTreeStore.isConfigured()
            ) {
                window.location.href = `AddPeople.html?edit=${this.current.id}`;
            } else {
                alert("Cannot edit this built-in or static record.");
            }
        }

        async _onRemove() {
            if (!this.current) return;
            if (
                !this.current.id ||
                !window.FamilyTreeStore ||
                !window.FamilyTreeStore.isConfigured()
            ) {
                alert("Cannot remove this built-in or static record.");
                return;
            }

            if (!confirm(`Are you sure you want to remove ${this.current.name}?`)) {
                return;
            }

            const btn = this.els.removeBtn;
            try {
                btn.disabled = true;
                btn.textContent = "Removing...";
                await window.FamilyTreeStore.removePerson(this.current.id);
                this.close();
                // Trigger refresh
                if (typeof window._renderRecentPeople === "function") {
                    window._renderRecentPeople();
                }
            } catch (error) {
                alert(error.message || "Could not remove person.");
            } finally {
                btn.disabled = false;
                btn.textContent = "Remove";
            }
        }
    }

    // ═══════════════════════════════════════════════════════
    //  Tree Renderer
    // ═══════════════════════════════════════════════════════

    class TreeRenderer {
        /**
         * @param {HTMLElement} container
         * @param {FamilyDataRegistry} registry
         * @param {ProfileModal} profileModal
         */
        constructor(container, registry, profileModal) {
            this.container = container;
            this.registry = registry;
            this.modal = profileModal;

            /** @type {{ parentIds: string[] }[]} */
            this._navStack = [];
        }

        /**
         * Render the home (root) view.
         */
        renderHome() {
            this._navStack = [];
            const view = this.registry.toTreeView();
            this._render(view, false);
        }

        /**
         * Navigate into a person's branch (show them + partner as parents,
         * their children below).
         */
        navigateIntoBranch(personId) {
            // Push current state onto nav stack before navigating
            this._navStack.push({
                parentIds: this._currentParentIds || this.registry.rootParentIds
            });
            const view = this.registry.branchView(personId);
            this._currentParentIds = [personId];
            const partner = this.registry.getPartner(personId);
            if (partner) this._currentParentIds.push(partner.id);
            this._render(view, true);
        }

        /**
         * Navigate up to a person's parents.
         */
        navigateToAncestors(personId) {
            this._navStack.push({
                parentIds: this._currentParentIds || this.registry.rootParentIds
            });
            const view = this.registry.ancestorView(personId);
            const person = this.registry.getById(personId);
            this._currentParentIds = person ? person.parentIds || [] : [];
            this._render(view, true);
        }

        /**
         * Go back one level in the navigation stack.
         */
        goBack() {
            if (this._navStack.length === 0) {
                this.renderHome();
                return;
            }
            const prev = this._navStack.pop();
            const view = this.registry.toTreeView(prev.parentIds);
            this._currentParentIds = prev.parentIds;
            this._render(view, this._navStack.length > 0);
        }

        // ── Internal ────────────────────────────────────────

        _render(viewData, showBack) {
            this.container.innerHTML = "";

            // Go Back button
            if (showBack) {
                const btn = document.createElement("button");
                btn.textContent = "Go Back";
                btn.classList.add("go-back");
                btn.addEventListener("click", () => this.goBack());
                this.container.appendChild(btn);
            }

            // Parents row
            if (viewData.parents && viewData.parents.length > 0) {
                const row = document.createElement("div");
                row.classList.add("family-level");

                const renderedIds = new Set();

                viewData.parents.forEach((parent) => {
                    // Skip if already rendered (avoids duplicates)
                    if (renderedIds.has(parent.id)) return;
                    renderedIds.add(parent.id);

                    // Parent bubble
                    const bubble = this._createBubble(parent, "parent");
                    bubble.addEventListener("click", () => {
                        const p = this.registry.getById(parent.id);
                        if (p && p.parentIds && p.parentIds.length > 0) {
                            this.navigateToAncestors(parent.id);
                        }
                    });
                    row.appendChild(bubble);

                    // Partner bubble (inline next to parent)
                    if (parent.partner && !renderedIds.has(parent.partner.id)) {
                        renderedIds.add(parent.partner.id);
                        const partnerBubble = this._createBubble(
                            parent.partner,
                            "parent"
                        );
                        partnerBubble.addEventListener("click", () => {
                            const pt = this.registry.getById(parent.partner.id);
                            if (pt && pt.parentIds && pt.parentIds.length > 0) {
                                this.navigateToAncestors(parent.partner.id);
                            }
                        });
                        row.appendChild(partnerBubble);
                    }
                });

                this.container.appendChild(row);

                // Connector line
                if (viewData.children && viewData.children.length > 0) {
                    const connector = document.createElement("div");
                    connector.classList.add("tree-connector");
                    this.container.appendChild(connector);
                }
            }

            // Children row
            if (viewData.children && viewData.children.length > 0) {
                const row = document.createElement("div");
                row.classList.add("family-level");

                viewData.children.forEach((child) => {
                    const bubble = this._createBubble(child, "child");
                    bubble.addEventListener("click", () => {
                        this.navigateIntoBranch(child.id);
                    });
                    row.appendChild(bubble);
                });

                this.container.appendChild(row);
            }
        }

        /**
         * Create a single person bubble element.
         *
         * @param {object} person
         * @param {"parent"|"child"} role
         * @returns {HTMLElement}
         */
        _createBubble(person, role) {
            const bubble = document.createElement("div");
            bubble.classList.add("bubble", `bubble--${role}`);
            if (person.deceased) {
                bubble.classList.add("bubble--deceased");
            }
            bubble.setAttribute("tabindex", "0");
            bubble.setAttribute("role", "button");
            bubble.title = "Tap to explore this branch";

            bubble.innerHTML = `
                <img src="${U.escapeHtml(person.image || person.imageUrl || U.FALLBACK_AVATAR)}" alt="${U.escapeHtml(person.name)}">
                <span><strong>${U.escapeHtml(person.name)}</strong></span>
                <span class="bubble-meta">${U.escapeHtml(person.birthday || "")}</span>
                <span class="bubble-hint">Tap to explore</span>
            `;

            // Details button
            const detailsBtn = document.createElement("button");
            detailsBtn.type = "button";
            detailsBtn.className = "bubble-details";
            detailsBtn.textContent = "Details";
            detailsBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                const derivedRole = this.registry.deriveRole(person.id);
                // Look up from registry for full data, fall back to what we have
                const full = this.registry.getById(person.id) || person;
                this.modal.open(full, derivedRole);
            });
            bubble.appendChild(detailsBtn);

            return bubble;
        }
    }

    // ═══════════════════════════════════════════════════════
    //  Recent People
    // ═══════════════════════════════════════════════════════

    function renderRecentPeople() {
        const list = document.getElementById("recent-people-list");
        if (!list) return;

        if (!window.FamilyTreeStore) {
            list.innerHTML =
                '<div class="empty-state">Connect your save details to show records here.</div>';
            return;
        }

        window.FamilyTreeStore.loadPeople()
            .then((records) => {
                const people = Array.isArray(records) ? records : [];

                if (!people.length) {
                    list.innerHTML =
                        '<div class="empty-state">No records yet.</div>';
                    return;
                }

                list.innerHTML = "";
                people.slice(0, 6).forEach((person) => {
                    const card = document.createElement("article");
                    card.className = "person-card";
                    card.innerHTML = `
                        <div class="person-card-head">
                            <span class="tag">${U.escapeHtml(person.relation || "Other")}</span>
                            <span class="card-meta">${U.escapeHtml(
                                person.createdAt
                                    ? new Date(person.createdAt).toLocaleDateString()
                                    : "Recently added"
                            )}</span>
                        </div>
                        <img src="${U.escapeHtml(person.imageUrl || U.FALLBACK_AVATAR)}" alt="${U.escapeHtml(person.name || "Unknown person")}">
                        <div class="card-title">${U.escapeHtml(person.name || "Unknown person")}</div>
                        <div class="card-meta">${U.escapeHtml(person.birthday || "Birthday not added")}</div>
                        <div class="card-meta">${U.escapeHtml(person.birthPlace || "Birth place not added")}</div>
                        <p class="card-copy">${U.escapeHtml(person.notes || "No notes yet.")}</p>
                    `;
                    list.appendChild(card);
                });
            })
            .catch(() => {
                list.innerHTML =
                    '<div class="empty-state">Could not load saved people right now.</div>';
            });
    }

    // Expose for external callers (e.g. remove-person handler)
    window._renderRecentPeople = renderRecentPeople;

    // ═══════════════════════════════════════════════════════
    //  Bootstrap
    // ═══════════════════════════════════════════════════════

    document.addEventListener("DOMContentLoaded", () => {
        // Theme
        const themeToggle = document.querySelector("#themeToggle");
        if (themeToggle) new ThemeToggler(themeToggle);

        // Profile modal
        const profileModal = new ProfileModal();

        // Family tree
        const treeContainer = document.getElementById("family-tree-container");
        if (treeContainer && window.familyRegistry) {
            const renderer = new TreeRenderer(
                treeContainer,
                window.familyRegistry,
                profileModal
            );
            renderer.renderHome();

            // Expose renderer globally for potential external use
            window._treeRenderer = renderer;
        }

        // Recent people
        renderRecentPeople();
    });
})();
