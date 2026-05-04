class ThemeToggler {
    constructor(toggleElement) {
        this.toggleElement = toggleElement;
        this.init();
    }

    init() {
        if (!this.toggleElement) {
            return;
        }

        // Check localStorage for saved theme
        const isDarkMode = localStorage.getItem("theme") === "dark";
        document.body.classList.toggle("night", isDarkMode);
        this.toggleElement.checked = isDarkMode;

        this.toggleElement.addEventListener("change", () => this.toggleTheme());
    }

    toggleTheme() {
        if (!this.toggleElement) {
            return;
        }

        const isDarkMode = this.toggleElement.checked;
        document.body.classList.toggle("night", isDarkMode);
        // Save theme preference to localStorage
        localStorage.setItem("theme", isDarkMode ? "dark" : "day");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.querySelector("#themeToggle");
    if (themeToggle) {
        new ThemeToggler(themeToggle);
    }
});





// Enhanced Family Tree Data Structure with 30+ members
const familyTreeData = {
    parents: [
        {
                name: "Mohd Jamal",
                birthday: "10 Aug 1967",
                image: "images/Abah.png",
        partner: {
                name: "Maimunah",
                birthday: "5 Apr 1967",
                image: "images/Emak.png",
            parents: [
               
                {
                    name: "Yusoff",
                    birthday: "Jan 1, 1938",
                    image: "images/Yusoff.jpg",
            partner :  {
                        name: "Zainab",
                        birthday: "Mar 10, 1940",
                        image: "images/Zainab.jpg"
                    },
                }   
            ],
            siblings: [
                {
                    name: "Ismail",
                    birthday: "Jun 5, 1970",
                    image: "images/aunt_mary.jpg",
                    children: [
                        {
                            name: "Aqil",
                            birthday: "Jul 15, 1995",
                            image: "images/cousin_anna.jpg"
                        },
                        {
                            name: "Cousin Mike",
                            birthday: "Mar 30, 1998",
                            image: "images/cousin_mike.jpg"
                        }
                    ]
                },
                
                {
                    name: "Maimunah", // Adds Mom as a sibling in Grandparent tree
                    birthday: "Feb 14, 1968",
                    image: "images/Emak.jpg"
                },
                {
                    name: "Zainal Abidin", // Adds Mom as a sibling in Grandparent tree
                    birthday: "February 22, 1968",
                    image: "images/Emak.jpg"
                },
                {
                    name: "Maimunah", // Adds Mom as a sibling in Grandparent tree
                    birthday: "Feb 14, 1968",
                    image: "images/Emak.jpg"
                },
                {
                    name: "Maimunah", // Adds Mom as a sibling in Grandparent tree
                    birthday: "Feb 14, 1968",
                    image: "images/Emak.jpg"
                },
                {
                    name: "Maimunah", // Adds Mom as a sibling in Grandparent tree
                    birthday: "Feb 14, 1968",
                    image: "images/Emak.jpg"
                },
                {
                    name: "Maimunah", // Adds Mom as a sibling in Grandparent tree
                    birthday: "Feb 14, 1968",
                    image: "images/Emak.jpg"
                },
                {
                    name: "Maimunah", // Adds Mom as a sibling in Grandparent tree
                    birthday: "Feb 14, 1968",
                    image: "images/Emak.jpg"
                },
                {
                    name: "Maimunah", // Adds Mom as a sibling in Grandparent tree
                    birthday: "Feb 14, 1968",
                    image: "images/Emak.jpg"
                },
                {
                    name: "Maimunah", // Adds Mom as a sibling in Grandparent tree
                    birthday: "Feb 14, 1968",
                    image: "images/Emak.jpg"
                },
            ]
        },
            parents: [
                {
                    name: "Adi",
                    birthday: "Feb 20, 1942",
                    image: "images/Adi.png"
                },
                {
                    name: "Awang",
                    birthday: "Dec 15, 1939",
                    image: "images/Awang.png"
                }
            ],
            siblings: [
                {
                    name: "Uncle Bob",
                    birthday: "May 12, 1967",
                    image: "image/uncle_bob.jpg",
                    children: [
                        {
                            name: "Cousin Jake",
                            birthday: "Oct 10, 1993",
                            image: "images/cousin_jake.jpg"
                        },
                        {
                            name: "Cousin Lily",
                            birthday: "Dec 25, 2000",
                            image: "images/cousin_lily.jpg"
                        }
                    ]
                },
                {
                    name: "Maimunah", // Adds Mom as a sibling in Grandparent tree
                    birthday: "Feb 14, 1968",
                    image: "images/Emak.jpg"
                },
                {
                    name: "Maimunah", // Adds Mom as a sibling in Grandparent tree
                    birthday: "Feb 14, 1968",
                    image: "images/Emak.jpg"
                },
                {
                    name: "Maimunah", // Adds Mom as a sibling in Grandparent tree
                    birthday: "Feb 14, 1968",
                    image: "images/Emak.jpg"
                },
                {
                    name: "Maimunah", // Adds Mom as a sibling in Grandparent tree
                    birthday: "Feb 14, 1968",
                    image: "images/Emak.jpg"
                },
                {
                    name: "Maimunah", // Adds Mom as a sibling in Grandparent tree
                    birthday: "Feb 14, 1968",
                    image: "images/Emak.jpg"
                },
                {
                    name: "Maimunah", // Adds Mom as a sibling in Grandparent tree
                    birthday: "Feb 14, 1968",
                    image: "images/Emak.jpg"
                },
                {
                    name: "Maimunah", // Adds Mom as a sibling in Grandparent tree
                    birthday: "Feb 14, 1968",
                    image: "images/Emak.jpg"
                },
                {
                    name: "Maimunah", // Adds Mom as a sibling in Grandparent tree
                    birthday: "Feb 14, 1968",
                    image: "images/Emak.jpg"
                },
                {
                    name: "Maimunah", // Adds Mom as a sibling in Grandparent tree
                    birthday: "Feb 14, 1968",
                    image: "images/Emak.jpg"
                },
                {
                    name: "Maimunah", // Adds Mom as a sibling in Grandparent tree
                    birthday: "Feb 14, 1968",
                    image: "images/Emak.jpg"
                },
            ]
        }
    ],
    children: [
        {
            name: "Mohd Muizzuddin",
            birthday: "December 3, 1992",
            image: "images/Along.png",
            partner : { name: "Farhana",
                birthday: "Dec 15, 1939",
                image: "images/Kfarhana.png"},
          
            children: [
                {
                    name: "Eliya Hana",
                    birthday: "November 15, 2018",
                    image: "images/Eliya.png",
                    
                },
                {
                    name: "Syifa Hana",
                    birthday: "June 14, 2020",
                    image: "images/Syifa.png",
                },
                {
                    name: "Faeq Mateen",
                    birthday: "January 27, 2023",
                    image: "images/Faeq.png",
                },
                
            ]
        },
        {
            name: "Nurul Fatihah",
            birthday: "February 22, 1994",
            image: "images/Kngah.png",
            partner : { name: "Faizal",
                birthday: "Dec 15, 1939",
                image: "images/Afaizal.png"},
          
            children: [
                {
                    name: "Nur Aliya Amani",
                    birthday: "June 1 , 2020",
                    image: "images/Amani.png",
                    
                },
                {
                    name: "Ahmad Aidan Arif",
                    birthday: "Mar 10, 2020",
                    image: "images/Aidan.png",
                },
                {
                    name: "Ahmad Aidan Ahza",
                    birthday: "April 7, 2023",
                    image: "images/Ahza.png",
                },
                
            ]
        }, 
        {  name: "Mohd Nasirruddin",
            birthday: "November 3, 1995",
            image: "images/Alang.png",
            partner : { name: "Anis",
                birthday: "November 1 1995, ",
                image: "images/Kanis.png"},
          
            children: [
                {
                    name: "Aaira Nafisa",
                    birthday: "June 19, 2020",
                    image: "images/Aaira.png",
                    
                },
                {
                    name: "Aariyan",
                    birthday: "October 10, 2023",
                    image: "images/Aariyan.png",
                },
               
                
            ]
        },
        {
            name: "Mohd Zahiruddin",
            birthday: "November 20, 1997",
            image: "images/Uteh.png",
            partner : { name: "Nur Aina Fatihah",
                birthday: "April 9, 1999",
                image: "images/Kaina.png"},
          
            children: [
                {
                    name: "Nur Nadra Wardina",
                    birthday: "November 1, 2024",
                    image: "images/Nadra.png",
                    
                },
               
            ]
        }, 
        {
            name: "Nurul Faizah",
            birthday: "November 3, 1999",
            image: "images/Kuda.png"
        },
        {
            name: "Muhammad Saifudin",
            birthday: "March 6, 2004",
            image: "images/Adin.png"
        },
        {
            name: "Nurul Farisha",
            birthday: "February 17, 2006",
            image: "images/Asya.png"
        }
    ]
};

// Render Family Tree with "Go Back" functionality
function renderFamilyTree(data, container, previousView = null) {
    // Clear existing content
    container.innerHTML = "";

    // "Go Back" Button
    if (previousView) {
        const backButton = document.createElement("button");
        backButton.textContent = "Go Back";
        backButton.classList.add("go-back");
        backButton.addEventListener("click", () => {
            renderFamilyTree(previousView.data, container, previousView.previousView);
        });
        container.appendChild(backButton);
    }

    // Render Parents
    if (data.parents && data.parents.length > 0) {
        const parentsContainer = document.createElement("div");
        parentsContainer.classList.add("family-level");

       // Inside the "Render Parents" section
data.parents.forEach(parent => {
    const parentBubble = document.createElement("div");
    parentBubble.classList.add("bubble");
    parentBubble.innerHTML = `
        <img src="${parent.image}" alt="${parent.name}">
        <span><strong>${parent.name}</strong></span>
        <span>${parent.birthday}</span>
    `;
    parentsContainer.appendChild(parentBubble);

    parentBubble.addEventListener("click", () => {
        renderFamilyTree({
            parents: parent.parents || [],
            children: parent.siblings || []
        }, container, { data, previousView });
    });

    // Render Partner Bubble
    if (parent.partner) {
        const partnerBubble = document.createElement("div");
        partnerBubble.classList.add("bubble");
        partnerBubble.innerHTML = `
            <img src="${parent.partner.image}" alt="${parent.partner.name}">
            <span><strong>${parent.partner.name}</strong></span>
            <span>${parent.partner.birthday}</span>
        `;
        parentsContainer.appendChild(partnerBubble);

        // Add click event for the partner
        partnerBubble.addEventListener("click", () => {
            renderFamilyTree({
                parents: parent.partner.parents || [],
                children: parent.partner.siblings || []
            }, container, { data, previousView });
        });
    }
});



        

        container.appendChild(parentsContainer);

        if (data.children && data.children.length > 0) {
            const connector = document.createElement("div");
            connector.classList.add("tree-connector");
            container.appendChild(connector);
        }
    }

    // Render Children
    if (data.children && data.children.length > 0) {
        const childrenContainer = document.createElement("div");
        childrenContainer.classList.add("family-level");

        data.children.forEach(child => {
            const childBubble = document.createElement("div");
            childBubble.classList.add("bubble");
            childBubble.innerHTML = `
                <img src="${child.image}" alt="${child.name}">
                <span><strong>${child.name}</strong></span>
                <span>${child.birthday}</span>
            `;

            childBubble.addEventListener("click", () => {
                renderFamilyTree({
                    parents: [child], // Pass the current parents data
                    children: child.children || []
                }, container, { data, previousView });
                
            });

            childrenContainer.appendChild(childBubble);
        });

        container.appendChild(childrenContainer);
    }
}

// Initialize on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    const familyTreeContainer = document.getElementById("family-tree-container");
    if (familyTreeContainer) {
        familyTreeContainer.innerHTML = ""; // Clear any existing content
        renderFamilyTree(familyTreeData, familyTreeContainer);
    }
});

// ----- Profile modal logic -----
const modal = document.getElementById('profile-modal');
const modalClose = modal ? document.getElementById('modal-close') : null;
const modalName = modal ? document.getElementById('modal-name') : null;
const modalAvatar = modal ? document.getElementById('modal-avatar') : null;
const modalSubtitle = modal ? document.getElementById('modal-subtitle') : null;
const modalTags = modal ? document.getElementById('modal-tags') : null;
const lifeTimeline = modal ? document.getElementById('life-timeline') : null;
const infoBirth = modal ? document.getElementById('info-birth') : null;
const infoPlace = modal ? document.getElementById('info-place') : null;
const infoDeath = modal ? document.getElementById('info-death') : null;
const infoOcc = modal ? document.getElementById('info-occupation') : null;

function computeAge(bday) {
    if (!bday) return '';
    try {
        const dt = new Date(bday);
        if (isNaN(dt)) return '';
        const diff = Date.now() - dt.getTime();
        const ageDt = new Date(diff);
        return Math.abs(ageDt.getUTCFullYear() - 1970);
    } catch (e) {
        return '';
    }
}

function safeArray(v) {
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
}

const FALLBACK_AVATAR = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='60' fill='%23E5E7EB'/%3E%3Ccircle cx='60' cy='48' r='22' fill='%239CA3AF'/%3E%3Cpath d='M28 102c6-18 22-28 32-28s26 10 32 28' fill='%239CA3AF'/%3E%3C/svg%3E";

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[character];
    });
}

function openProfile(person, derivedRole) {
    if (!person || !modal || !modalName || !modalAvatar || !modalSubtitle || !modalTags || !lifeTimeline || !infoBirth || !infoPlace || !infoDeath || !infoOcc) {
        return;
    }

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    modalName.textContent = person.name || 'Unknown';
    modalAvatar.src = person.image || FALLBACK_AVATAR;
    const age = computeAge(person.birthday);
    const subtitleParts = [person.birthday || 'Unknown'];
    if (age) {
        subtitleParts.push(`${age} years`);
    }
    modalSubtitle.textContent = subtitleParts.join(' · ');

    // Tags: prefer explicit roles field, fall back to derived role
    modalTags.innerHTML = '';
    const roles = person.roles || (derivedRole ? [derivedRole] : []);
    safeArray(roles).forEach(r => {
        const s = document.createElement('span');
        s.className = 'tag';
        s.textContent = r;
        modalTags.appendChild(s);
    });

    // Essential info
    infoBirth.textContent = person.birthday || 'Unknown';
    infoPlace.textContent = person.birthPlace || 'Unknown';
    infoDeath.textContent = person.deathDate || 'Living';
    infoOcc.textContent = person.occupation || 'Unknown';

    // Life timeline: if person.timeline exists, render it; otherwise render a short default
    lifeTimeline.innerHTML = '';
    const events = person.timeline || [
        { year: person.birthday || '', title: 'Born', details: person.birthPlace || '' }
    ];
    safeArray(events).forEach(ev => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${escapeHtml(ev.year || '')} ${ev.title ? '- ' + escapeHtml(ev.title) : ''}</strong><div class="small">${escapeHtml(ev.details || '')}</div>`;
        lifeTimeline.appendChild(li);
    });
}

function closeProfile() {
    if (!modal) {
        return;
    }

    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
}

if (modal && modalClose) {
    modalClose.addEventListener('click', closeProfile);
    const backdrop = modal.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', closeProfile);
    }
}

function findPersonByName(root, targetName) {
    if (!root || !targetName) {
        return null;
    }

    if (Array.isArray(root)) {
        for (const item of root) {
            const found = findPersonByName(item, targetName);
            if (found) {
                return found;
            }
        }
        return null;
    }

    if (typeof root === 'object') {
        if (root.name === targetName) {
            return root;
        }

        for (const key of ['children', 'parents', 'siblings']) {
            if (root[key]) {
                const found = findPersonByName(root[key], targetName);
                if (found) {
                    return found;
                }
            }
        }
    }

    return null;
}

const enhancedRenderFamilyTree = renderFamilyTree;
renderFamilyTree = function(data, container, previousView = null) {
    enhancedRenderFamilyTree(data, container, previousView);

    const rows = container.querySelectorAll('.family-level');
    rows.forEach((row, rowIndex) => {
        const bubbles = row.querySelectorAll('.bubble');
        bubbles.forEach((bubble, bubbleIndex) => {
            if (bubble.dataset.enhanced === 'true') {
                return;
            }

            bubble.dataset.enhanced = 'true';
            const roleLabel = rowIndex === 0
                ? (bubbleIndex % 2 === 1 ? 'Mother' : 'Father')
                : 'Child';

            bubble.classList.add(`bubble--${roleLabel.toLowerCase()}`);
            bubble.setAttribute('tabindex', '0');
            bubble.setAttribute('role', 'button');
            bubble.title = 'Tap to explore this branch';



            if (!bubble.querySelector('.bubble-hint')) {
                const hint = document.createElement('span');
                hint.className = 'bubble-hint';
                hint.textContent = 'Tap to explore';
                const detailsButton = bubble.querySelector('.bubble-details');
                if (detailsButton) {
                    bubble.insertBefore(hint, detailsButton);
                } else {
                    bubble.appendChild(hint);
                }
            }

            let detailsButton = bubble.querySelector('.bubble-details');
            if (!detailsButton) {
                detailsButton = document.createElement('button');
                detailsButton.type = 'button';
                detailsButton.className = 'bubble-details';
                detailsButton.textContent = 'Details';
                bubble.appendChild(detailsButton);
            }

            detailsButton.addEventListener('click', (event) => {
                event.stopPropagation();
                const name = bubble.querySelector('strong') ? bubble.querySelector('strong').textContent : '';
                const birthday = bubble.querySelector('.bubble-meta') ? bubble.querySelector('.bubble-meta').textContent : '';
                const image = bubble.querySelector('img') ? bubble.querySelector('img').src : '';
                const person = findPersonByName(familyTreeData, name) || { name, birthday, image };
                openProfile(person, roleLabel);
            });
        });
    });
};

function renderRecentPeople() {
    const statusElement = document.getElementById('database-status');
    const peopleList = document.getElementById('recent-people-list');

    if (!peopleList) {
        return;
    }

    if (!window.FamilyTreeStore) {
        if (statusElement) {
            statusElement.textContent = 'Connect to save';
        }
        peopleList.innerHTML = '<div class="empty-state">Connect your save details to show records here.</div>';
        return;
    }

    if (statusElement) {
        statusElement.textContent = window.FamilyTreeStore.statusLabel();
    }

    window.FamilyTreeStore.loadPeople().then(records => {
        const people = Array.isArray(records) ? records : [];

        if (!people.length) {
            peopleList.innerHTML = '<div class="empty-state">No records yet.</div>';
            return;
        }

        peopleList.innerHTML = '';
        people.slice(0, 6).forEach(person => {
            const card = document.createElement('article');
            card.className = 'person-card';
            card.innerHTML = `
                <div class="person-card-head">
                    <span class="tag">${escapeHtml(person.relation || 'Other')}</span>
                    <span class="card-meta">${escapeHtml(person.createdAt ? new Date(person.createdAt).toLocaleDateString() : 'Recently added')}</span>
                </div>
                <img src="${escapeHtml(person.imageUrl || FALLBACK_AVATAR)}" alt="${escapeHtml(person.name || 'Unknown person')}">
                <div class="card-title">${escapeHtml(person.name || 'Unknown person')}</div>
                <div class="card-meta">${escapeHtml(person.birthday || 'Birthday not added')}</div>
                <div class="card-meta">${escapeHtml(person.birthPlace || 'Birth place not added')}</div>
                <p class="card-copy">${escapeHtml(person.notes || 'No notes yet.')}</p>
            `;
            peopleList.appendChild(card);
        });
    }).catch(() => {
        if (statusElement) {
            statusElement.textContent = 'Saved records unavailable';
        }
        peopleList.innerHTML = '<div class="empty-state">Could not load saved people right now.</div>';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    void renderRecentPeople();
});

