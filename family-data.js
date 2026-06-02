/**
 * family-data.js — Structured family data model for SentinelTree
 *
 * Every person has a unique `id`. Relationships are expressed via
 * `parentIds`, `childIds`, `partnerId`, and `siblingIds` so the
 * data can be traversed in any direction.
 *
 * The FamilyDataRegistry class provides O(1) lookups plus helpers
 * for building the nested view objects the renderer expects.
 */

(function () {
    "use strict";

    // ─── Raw person records ─────────────────────────────────
    //
    // Each record carries everything the UI needs.  Relationships
    // are expressed via ID arrays that the Registry resolves.

    const SEED_PEOPLE = [
        // ── Grandparents (maternal) ──────────────────────────
        {
            id: "gp-yusoff",
            name: "Yusoff",
            birthday: "Jan 1, 1938",
            image: "images/Yusoff.jpg",
            partnerId: "gp-zainab",
            childIds: [
                "p-ismail", "p-maimunah", "p-zainal-abidin"
            ]
        },
        {
            id: "gp-zainab",
            name: "Zainab",
            birthday: "Mar 10, 1940",
            image: "images/Zainab.jpg",
            partnerId: "gp-yusoff",
            childIds: [
                "p-ismail", "p-maimunah", "p-zainal-abidin"
            ]
        },

        // ── Grandparents (paternal) ──────────────────────────
        {
            id: "gp-rodiah",
            name: "Hjh Rodiah",
            fullName: "Hjh Rodiah @ Adi Binti Mohd Yunus",
            title: "Dato Batul",
            birthday: "",
            image: "images/Rodiah.png",
            partnerId: "gp-awang-matsidek",
            childIds: [
                "p-saadiah", "p-fauziah", "p-salina", "p-mohd-jamal",
                "p-md-yacob", "p-salmah", "p-mohd-ariffin", "p-mohd-hairi",
                "p-rosmawati", "p-mohd-zahari", "p-normalina",
                "p-norliana", "p-nur-suhaidah"
            ]
        },
        {
            id: "gp-awang-matsidek",
            name: "Hj Awang Bin Mat Sidek",
            fullName: "Hj Awang Bin Mat Sidek @ Daud",
            title: "Dato Tiri",
            birthday: "",
            image: "images/Awang.png",
            partnerId: "gp-rodiah",
            childIds: [
                "p-saadiah", "p-fauziah", "p-salina", "p-mohd-jamal",
                "p-md-yacob", "p-salmah", "p-mohd-ariffin", "p-mohd-hairi",
                "p-rosmawati", "p-mohd-zahari", "p-normalina",
                "p-norliana", "p-nur-suhaidah"
            ]
        },

        // ── Parents ──────────────────────────────────────────
        {
            id: "p-mohd-jamal",
            name: "Mohd Jamal",
            birthday: "Aug 10, 1967",
            image: "images/Abah.png",
            partnerId: "p-maimunah",
            parentIds: ["gp-rodiah", "gp-awang-matsidek"],
            siblingIds: [
                "p-saadiah", "p-fauziah", "p-salina",
                "p-md-yacob", "p-salmah", "p-mohd-ariffin", "p-mohd-hairi",
                "p-rosmawati", "p-mohd-zahari", "p-normalina",
                "p-norliana", "p-nur-suhaidah"
            ],
            childIds: [
                "c-muizzuddin", "c-fatihah", "c-nasirruddin",
                "c-zahiruddin", "c-faizah", "c-saifudin", "c-farisha"
            ]
        },
        {
            id: "p-maimunah",
            name: "Maimunah",
            birthday: "Apr 5, 1967",
            image: "images/Emak.png",
            partnerId: "p-mohd-jamal",
            parentIds: ["gp-yusoff", "gp-zainab"],
            siblingIds: ["p-ismail", "p-zainal-abidin"],
            childIds: [
                "c-muizzuddin", "c-fatihah", "c-nasirruddin",
                "c-zahiruddin", "c-faizah", "c-saifudin", "c-farisha"
            ]
        },

        // ── Aunts / Uncles ───────────────────────────────────
        {
            id: "p-ismail",
            name: "Ismail",
            birthday: "Jun 5, 1970",
            image: "images/aunt_mary.jpg",
            parentIds: ["gp-yusoff", "gp-zainab"],
            siblingIds: ["p-maimunah", "p-zainal-abidin"],
            childIds: ["cousin-aqil", "cousin-mike"]
        },
        {
            id: "p-zainal-abidin",
            name: "Zainal Abidin",
            birthday: "Feb 22, 1968",
            image: "images/Emak.jpg",
            parentIds: ["gp-yusoff", "gp-zainab"],
            siblingIds: ["p-maimunah", "p-ismail"]
        },
        // ── Paternal Aunts / Uncles (siblings of Mohd Jamal) ────
        {
            id: "p-saadiah",
            name: "Saadiah",
            birthday: "",
            image: "images/default.png",
            parentIds: ["gp-rodiah", "gp-awang-matsidek"],
            siblingIds: [
                "p-fauziah", "p-salina", "p-mohd-jamal",
                "p-md-yacob", "p-salmah", "p-mohd-ariffin", "p-mohd-hairi",
                "p-rosmawati", "p-mohd-zahari", "p-normalina",
                "p-norliana", "p-nur-suhaidah"
            ]
        },
        {
            id: "p-fauziah",
            name: "Fauziah",
            deceased: true,
            birthday: "",
            image: "images/default.png",
            parentIds: ["gp-rodiah", "gp-awang-matsidek"],
            siblingIds: [
                "p-saadiah", "p-salina", "p-mohd-jamal",
                "p-md-yacob", "p-salmah", "p-mohd-ariffin", "p-mohd-hairi",
                "p-rosmawati", "p-mohd-zahari", "p-normalina",
                "p-norliana", "p-nur-suhaidah"
            ]
        },
        {
            id: "p-salina",
            name: "Salina",
            birthday: "",
            image: "images/default.png",
            parentIds: ["gp-rodiah", "gp-awang-matsidek"],
            siblingIds: [
                "p-saadiah", "p-fauziah", "p-mohd-jamal",
                "p-md-yacob", "p-salmah", "p-mohd-ariffin", "p-mohd-hairi",
                "p-rosmawati", "p-mohd-zahari", "p-normalina",
                "p-norliana", "p-nur-suhaidah"
            ]
        },
        {
            id: "p-md-yacob",
            name: "Md Yacob",
            birthday: "",
            image: "images/default.png",
            parentIds: ["gp-rodiah", "gp-awang-matsidek"],
            siblingIds: [
                "p-saadiah", "p-fauziah", "p-salina", "p-mohd-jamal",
                "p-salmah", "p-mohd-ariffin", "p-mohd-hairi",
                "p-rosmawati", "p-mohd-zahari", "p-normalina",
                "p-norliana", "p-nur-suhaidah"
            ]
        },
        {
            id: "p-salmah",
            name: "Salmah",
            birthday: "",
            image: "images/default.png",
            parentIds: ["gp-rodiah", "gp-awang-matsidek"],
            siblingIds: [
                "p-saadiah", "p-fauziah", "p-salina", "p-mohd-jamal",
                "p-md-yacob", "p-mohd-ariffin", "p-mohd-hairi",
                "p-rosmawati", "p-mohd-zahari", "p-normalina",
                "p-norliana", "p-nur-suhaidah"
            ]
        },
        {
            id: "p-mohd-hairi",
            name: "Mohd Hairi",
            deceased: true,
            birthday: "",
            image: "images/default.png",
            parentIds: ["gp-rodiah", "gp-awang-matsidek"],
            siblingIds: [
                "p-saadiah", "p-fauziah", "p-salina", "p-mohd-jamal",
                "p-md-yacob", "p-salmah", "p-mohd-ariffin",
                "p-rosmawati", "p-mohd-zahari", "p-normalina",
                "p-norliana", "p-nur-suhaidah"
            ]
        },
        {
            id: "p-rosmawati",
            name: "Rosmawati",
            birthday: "",
            image: "images/default.png",
            parentIds: ["gp-rodiah", "gp-awang-matsidek"],
            siblingIds: [
                "p-saadiah", "p-fauziah", "p-salina", "p-mohd-jamal",
                "p-md-yacob", "p-salmah", "p-mohd-ariffin", "p-mohd-hairi",
                "p-mohd-zahari", "p-normalina",
                "p-norliana", "p-nur-suhaidah"
            ]
        },
        {
            id: "p-mohd-ariffin",
            name: "Mohd Ariffin",
            deceased: true,
            birthday: "",
            image: "images/default.png",
            parentIds: ["gp-rodiah", "gp-awang-matsidek"],
            siblingIds: [
                "p-saadiah", "p-fauziah", "p-salina", "p-mohd-jamal",
                "p-md-yacob", "p-salmah", "p-mohd-hairi",
                "p-rosmawati", "p-mohd-zahari", "p-normalina",
                "p-norliana", "p-nur-suhaidah"
            ]
        },
        {
            id: "p-mohd-zahari",
            name: "Mohd Zahari",
            birthday: "",
            image: "images/default.png",
            parentIds: ["gp-rodiah", "gp-awang-matsidek"],
            siblingIds: [
                "p-saadiah", "p-fauziah", "p-salina", "p-mohd-jamal",
                "p-md-yacob", "p-salmah", "p-mohd-ariffin", "p-mohd-hairi",
                "p-rosmawati", "p-normalina",
                "p-norliana", "p-nur-suhaidah"
            ]
        },
        {
            id: "p-normalina",
            name: "Normalina",
            birthday: "",
            image: "images/default.png",
            parentIds: ["gp-rodiah", "gp-awang-matsidek"],
            siblingIds: [
                "p-saadiah", "p-fauziah", "p-salina", "p-mohd-jamal",
                "p-md-yacob", "p-salmah", "p-mohd-ariffin", "p-mohd-hairi",
                "p-rosmawati", "p-mohd-zahari",
                "p-norliana", "p-nur-suhaidah"
            ]
        },
        {
            id: "p-norliana",
            name: "Norliana",
            deceased: true,
            birthday: "",
            image: "images/default.png",
            parentIds: ["gp-rodiah", "gp-awang-matsidek"],
            siblingIds: [
                "p-saadiah", "p-fauziah", "p-salina", "p-mohd-jamal",
                "p-md-yacob", "p-salmah", "p-mohd-ariffin", "p-mohd-hairi",
                "p-rosmawati", "p-mohd-zahari", "p-normalina",
                "p-nur-suhaidah"
            ]
        },
        {
            id: "p-nur-suhaidah",
            name: "Nur Suhaidah",
            birthday: "",
            image: "images/default.png",
            parentIds: ["gp-rodiah", "gp-awang-matsidek"],
            siblingIds: [
                "p-saadiah", "p-fauziah", "p-salina", "p-mohd-jamal",
                "p-md-yacob", "p-salmah", "p-mohd-ariffin", "p-mohd-hairi",
                "p-rosmawati", "p-mohd-zahari", "p-normalina",
                "p-norliana"
            ]
        },

        // ── Cousins ──────────────────────────────────────────
        {
            id: "cousin-aqil",
            name: "Aqil",
            birthday: "Jul 15, 1995",
            image: "images/cousin_anna.jpg",
            parentIds: ["p-ismail"]
        },
        {
            id: "cousin-mike",
            name: "Cousin Mike",
            birthday: "Mar 30, 1998",
            image: "images/cousin_mike.jpg",
            parentIds: ["p-ismail"]
        },


        // ── Children (generation 3) ──────────────────────────

        // 1. Mohd Muizzuddin + Farhana
        {
            id: "c-muizzuddin",
            name: "Mohd Muizzuddin",
            birthday: "December 3, 1992",
            image: "images/Along.png",
            partnerId: "c-farhana",
            parentIds: ["p-mohd-jamal", "p-maimunah"],
            siblingIds: [
                "c-fatihah", "c-nasirruddin", "c-zahiruddin",
                "c-faizah", "c-saifudin", "c-farisha"
            ],
            childIds: ["gc-eliya", "gc-syifa", "gc-faeq"]
        },
        {
            id: "c-farhana",
            name: "Farhana",
            birthday: "Dec 15, 1993",
            image: "images/Kfarhana.png",
            partnerId: "c-muizzuddin",
            childIds: ["gc-eliya", "gc-syifa", "gc-faeq"]
        },

        // 2. Nurul Fatihah + Faizal
        {
            id: "c-fatihah",
            name: "Nurul Fatihah",
            birthday: "February 22, 1994",
            image: "images/Kngah.png",
            partnerId: "c-faizal",
            parentIds: ["p-mohd-jamal", "p-maimunah"],
            siblingIds: [
                "c-muizzuddin", "c-nasirruddin", "c-zahiruddin",
                "c-faizah", "c-saifudin", "c-farisha"
            ],
            childIds: ["gc-amani", "gc-aidan-arif", "gc-aidan-ahza"]
        },
        {
            id: "c-faizal",
            name: "Faizal",
            birthday: "Dec 15, 1993",
            image: "images/Afaizal.png",
            partnerId: "c-fatihah",
            childIds: ["gc-amani", "gc-aidan-arif", "gc-aidan-ahza"]
        },

        // 3. Mohd Nasirruddin + Anis
        {
            id: "c-nasirruddin",
            name: "Mohd Nasirruddin",
            birthday: "November 3, 1995",
            image: "images/Alang.png",
            partnerId: "c-anis",
            parentIds: ["p-mohd-jamal", "p-maimunah"],
            siblingIds: [
                "c-muizzuddin", "c-fatihah", "c-zahiruddin",
                "c-faizah", "c-saifudin", "c-farisha"
            ],
            childIds: ["gc-aaira", "gc-aariyan"]
        },
        {
            id: "c-anis",
            name: "Anis",
            birthday: "November 1, 1995",
            image: "images/Kanis.png",
            partnerId: "c-nasirruddin",
            childIds: ["gc-aaira", "gc-aariyan"]
        },

        // 4. Mohd Zahiruddin + Nur Aina Fatihah
        {
            id: "c-zahiruddin",
            name: "Mohd Zahiruddin",
            birthday: "November 20, 1997",
            image: "images/Uteh.png",
            partnerId: "c-aina",
            parentIds: ["p-mohd-jamal", "p-maimunah"],
            siblingIds: [
                "c-muizzuddin", "c-fatihah", "c-nasirruddin",
                "c-faizah", "c-saifudin", "c-farisha"
            ],
            childIds: ["gc-nadra"]
        },
        {
            id: "c-aina",
            name: "Nur Aina Fatihah",
            birthday: "April 9, 1999",
            image: "images/Kaina.png",
            partnerId: "c-zahiruddin",
            childIds: ["gc-nadra"]
        },

        // 5–7. Unmarried children
        {
            id: "c-faizah",
            name: "Nurul Faizah",
            birthday: "November 3, 1999",
            image: "images/Kuda.png",
            parentIds: ["p-mohd-jamal", "p-maimunah"],
            siblingIds: [
                "c-muizzuddin", "c-fatihah", "c-nasirruddin",
                "c-zahiruddin", "c-saifudin", "c-farisha"
            ]
        },
        {
            id: "c-saifudin",
            name: "Muhammad Saifudin",
            birthday: "March 6, 2004",
            image: "images/Adin.png",
            parentIds: ["p-mohd-jamal", "p-maimunah"],
            siblingIds: [
                "c-muizzuddin", "c-fatihah", "c-nasirruddin",
                "c-zahiruddin", "c-faizah", "c-farisha"
            ]
        },
        {
            id: "c-farisha",
            name: "Nurul Farisha",
            birthday: "February 17, 2006",
            image: "images/Asya.png",
            parentIds: ["p-mohd-jamal", "p-maimunah"],
            siblingIds: [
                "c-muizzuddin", "c-fatihah", "c-nasirruddin",
                "c-zahiruddin", "c-faizah", "c-saifudin"
            ]
        },

        // ── Grandchildren (generation 4) ─────────────────────

        // Muizzuddin's children
        {
            id: "gc-eliya",
            name: "Eliya Hana",
            birthday: "November 15, 2018",
            image: "images/Eliya.png",
            parentIds: ["c-muizzuddin", "c-farhana"]
        },
        {
            id: "gc-syifa",
            name: "Syifa Hana",
            birthday: "June 14, 2020",
            image: "images/Syifa.png",
            parentIds: ["c-muizzuddin", "c-farhana"]
        },
        {
            id: "gc-faeq",
            name: "Faeq Mateen",
            birthday: "January 27, 2023",
            image: "images/Faeq.png",
            parentIds: ["c-muizzuddin", "c-farhana"]
        },

        // Fatihah's children
        {
            id: "gc-amani",
            name: "Nur Aliya Amani",
            birthday: "June 1, 2020",
            image: "images/Amani.png",
            parentIds: ["c-fatihah", "c-faizal"]
        },
        {
            id: "gc-aidan-arif",
            name: "Ahmad Aidan Arif",
            birthday: "Mar 10, 2020",
            image: "images/Aidan.png",
            parentIds: ["c-fatihah", "c-faizal"]
        },
        {
            id: "gc-aidan-ahza",
            name: "Ahmad Aidan Ahza",
            birthday: "April 7, 2023",
            image: "images/Ahza.png",
            parentIds: ["c-fatihah", "c-faizal"]
        },

        // Nasirruddin's children
        {
            id: "gc-aaira",
            name: "Aaira Nafisa",
            birthday: "June 19, 2020",
            image: "images/Aaira.png",
            parentIds: ["c-nasirruddin", "c-anis"]
        },
        {
            id: "gc-aariyan",
            name: "Aariyan",
            birthday: "October 10, 2023",
            image: "images/Aariyan.png",
            parentIds: ["c-nasirruddin", "c-anis"]
        },

        // Zahiruddin's children
        {
            id: "gc-nadra",
            name: "Nur Nadra Wardina",
            birthday: "November 1, 2024",
            image: "images/Nadra.png",
            parentIds: ["c-zahiruddin", "c-aina"]
        }
    ];

    // ─── ROOT IDs — the "home view" parents ─────────────────

    const ROOT_PARENT_IDS = ["p-mohd-jamal", "p-maimunah"];

    // ─── FamilyDataRegistry ─────────────────────────────────

    class FamilyDataRegistry {
        constructor(seedRecords, rootParentIds) {
            /** @type {Map<string, object>} */
            this._map = new Map();
            /** @type {string[]} */
            this.rootParentIds = rootParentIds || [];

            (seedRecords || []).forEach((p) => this._index(p));
        }

        // ── Internal ────────────────────────────────────────

        _index(person) {
            if (!person || !person.id) return;
            // Clone so mutations don't affect the seed array
            this._map.set(person.id, { ...person });
        }

        // ── Public API ──────────────────────────────────────

        /** O(1) lookup by ID */
        getById(id) {
            return this._map.get(id) || null;
        }

        /** All indexed people as an array */
        getAll() {
            return Array.from(this._map.values());
        }

        /** Return the children of a person (resolved objects) */
        getChildren(id) {
            const person = this.getById(id);
            if (!person || !person.childIds) return [];
            return person.childIds
                .map((cid) => this.getById(cid))
                .filter(Boolean);
        }

        /** Return the parents of a person (resolved objects) */
        getParents(id) {
            const person = this.getById(id);
            if (!person || !person.parentIds) return [];
            return person.parentIds
                .map((pid) => this.getById(pid))
                .filter(Boolean);
        }

        /** Return the siblings of a person (resolved objects) */
        getSiblings(id) {
            const person = this.getById(id);
            if (!person || !person.siblingIds) return [];
            return person.siblingIds
                .map((sid) => this.getById(sid))
                .filter(Boolean);
        }

        /** Return the partner of a person (resolved object or null) */
        getPartner(id) {
            const person = this.getById(id);
            if (!person || !person.partnerId) return null;
            return this.getById(person.partnerId);
        }

        /**
         * Build a nested tree-view object suitable for the renderer.
         *
         * When called without arguments it returns the "home view"
         * with rootParentIds as parents and their children.
         *
         * @param {string[]} [parentIds]  – IDs to use as the parent row
         * @returns {{ parents: object[], children: object[] }}
         */
        toTreeView(parentIds) {
            const ids = parentIds || this.rootParentIds;
            const parents = ids.map((pid) => this.getById(pid)).filter(Boolean);

            // Collect children — merge child lists from all listed parents, dedupe
            const childIdSet = new Set();
            parents.forEach((p) => {
                (p.childIds || []).forEach((cid) => childIdSet.add(cid));
            });

            const children = Array.from(childIdSet)
                .map((cid) => this.getById(cid))
                .filter(Boolean);

            // Attach resolved partner info onto each parent/child for the renderer
            const enrich = (person) => {
                const copy = { ...person };
                if (copy.partnerId) {
                    copy.partner = this.getById(copy.partnerId) || null;
                }
                return copy;
            };

            return {
                parents: parents.map(enrich),
                children: children.map(enrich)
            };
        }

        /**
         * Build a tree-view navigating *into* a person's branch.
         * Shows the person (+ partner) as parents and their children below.
         */
        branchView(personId) {
            const person = this.getById(personId);
            if (!person) return { parents: [], children: [] };

            const parentIds = [personId];
            if (person.partnerId) parentIds.push(person.partnerId);

            return this.toTreeView(parentIds);
        }

        /**
         * Build a tree-view navigating *up* to a person's parents.
         * Shows the person's parents as the parent row and their siblings
         * (including the person) as children.
         */
        ancestorView(personId) {
            const person = this.getById(personId);
            if (!person) return { parents: [], children: [] };

            const parentObjs = this.getParents(personId);
            if (parentObjs.length === 0) return { parents: [], children: [] };

            // Children = siblings + self, deduped
            const childIdSet = new Set();
            parentObjs.forEach((p) => {
                (p.childIds || []).forEach((cid) => childIdSet.add(cid));
            });

            const enrich = (p) => {
                const copy = { ...p };
                if (copy.partnerId) {
                    copy.partner = this.getById(copy.partnerId) || null;
                }
                return copy;
            };

            return {
                parents: parentObjs.map(enrich),
                children: Array.from(childIdSet)
                    .map((cid) => this.getById(cid))
                    .filter(Boolean)
                    .map(enrich)
            };
        }

        /**
         * Case-insensitive substring search across names.
         */
        search(query) {
            if (!query) return [];
            const q = query.toLowerCase();
            return this.getAll().filter(
                (p) => p.name && p.name.toLowerCase().includes(q)
            );
        }

        /**
         * Merge Supabase-loaded person records into the registry.
         * Does not overwrite existing seed records that share the same ID.
         */
        merge(records) {
            if (!Array.isArray(records)) return;
            records.forEach((r) => {
                if (!r.id) return;
                if (!this._map.has(r.id)) {
                    this._index(r);
                }
            });
        }

        /**
         * Derive a human-readable role label for a person relative
         * to the root family.
         */
        deriveRole(personId) {
            const person = this.getById(personId);
            if (!person) return "Unknown";

            if (this.rootParentIds.includes(personId)) return "Parent";

            // Check if they are a child of the root parents
            for (const rpId of this.rootParentIds) {
                const rp = this.getById(rpId);
                if (rp && rp.childIds && rp.childIds.includes(personId)) {
                    return "Child";
                }
            }

            // Check if they are a partner of a root parent
            for (const rpId of this.rootParentIds) {
                const rp = this.getById(rpId);
                if (rp && rp.partnerId === personId) return "Parent";
            }

            // Check grandparent
            for (const rpId of this.rootParentIds) {
                const rp = this.getById(rpId);
                if (rp && rp.parentIds && rp.parentIds.includes(personId)) {
                    return "Grandparent";
                }
            }

            return "Relative";
        }

        /** Total number of indexed people */
        get size() {
            return this._map.size;
        }
    }

    // ── Create and export the singleton registry ────────────

    const registry = new FamilyDataRegistry(SEED_PEOPLE, ROOT_PARENT_IDS);

    window.FamilyDataRegistry = FamilyDataRegistry;
    window.familyRegistry = registry;

    // Legacy compat: expose the old nested `familyTreeData` shape
    // so `data-store.js` syncExistingDataset still works during migration.
    window.familyTreeData = registry.toTreeView();
})();
