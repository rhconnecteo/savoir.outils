// ===============================
// CONFIG LOGIN
// ===============================
const CORRECT_USERNAME = "admin";
const CORRECT_PASSWORD = "outil";

// ===============================
// VÉRIFIER L'AUTHENTIFICATION AU CHARGEMENT
// ===============================
function checkAuthentication() {
  const isAuthenticated = sessionStorage.getItem("isAuthenticated") === "true";
  const loginModal = document.getElementById("loginModal");
  const mainContent = document.getElementById("mainContent");
  
  if (isAuthenticated) {
    loginModal.style.display = "none";
    mainContent.style.display = "block";
    document.body.classList.remove("login-active");
  } else {
    loginModal.style.display = "flex";
    mainContent.style.display = "none";
    document.body.classList.add("login-active");
  }
}

// ===============================
// GÉRER LA CONNEXION
// ===============================
function handleLogin(event) {
  event.preventDefault();
  
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorDiv = document.getElementById("loginError");
  
  if (username === CORRECT_USERNAME && password === CORRECT_PASSWORD) {
    sessionStorage.setItem("isAuthenticated", "true");
    errorDiv.textContent = "";
    document.getElementById("loginModal").style.display = "none";
    document.getElementById("mainContent").style.display = "block";
    document.body.classList.remove("login-active");
    document.getElementById("loginForm").reset();
    loadData();
  } else {
    errorDiv.textContent = "Identifiant ou mot de passe incorrect";
    document.getElementById("password").value = "";
  }
}

// ===============================
// GÉRER LA DÉCONNEXION
// ===============================
function handleLogout() {
  sessionStorage.setItem("isAuthenticated", "false");
  document.getElementById("loginModal").style.display = "flex";
  document.getElementById("mainContent").style.display = "none";
  document.body.classList.add("login-active");
  document.getElementById("loginForm").reset();
  document.getElementById("loginError").textContent = "";
}

// ===============================
// CONFIG API
// ===============================
const API_URL = "https://script.google.com/macros/s/AKfycby9F0yKZquOMRFi0I4pucZtSq7eMjbyqNUUd-nVh6p3PeLhd7YutqiAyborkcMz3MAU2w/exec";

let allData = [];
let filteredData = [];

// ===============================
// NORMALISER LES OUTILS
// ===============================
function normalizeOutil(outil) {
  return {
    outil: outil.outil || "",
    statut: outil.statut || "En cours",
    // Gérer l'ancienne structure (date) et la nouvelle (dateDebut, dateFin)
    dateDebut: outil.dateDebut || outil.dateDebut_old || outil.date || "",
    dateFin: outil.dateFin || outil.dateFin_old || ""
  };
}

// ===============================
// INITIALISER AU CHARGEMENT DE LA PAGE
// ===============================
window.addEventListener("DOMContentLoaded", () => {
  checkAuthentication();
});

// Elements
const tableBody = document.getElementById("tableBody");
const emptyMessage = document.getElementById("emptyMessage");
const matriculeDropdown = document.getElementById("matriculeDropdown");
const fonctionDropdown = document.getElementById("fonctionDropdown");
const rattachementDropdown = document.getElementById("rattachementDropdown");

// ===============================
// GET FILTER VALUE (from searchable dropdown)
// ===============================
function getFilterValue(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return "";
  const selected = dropdown.querySelector(".dropdown-option.selected");
  return selected ? selected.dataset.value : "";
}

// ===============================
// SET FILTER VALUE (in searchable dropdown)
// ===============================
function setFilterValue(dropdownId, value) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;
  
  const input = dropdown.querySelector(".filter-search-input");
  const options = dropdown.querySelectorAll(".dropdown-option");
  
  options.forEach(opt => opt.classList.remove("selected"));
  
  let selectedOption = null;
  options.forEach(opt => {
    if (opt.dataset.value === value) {
      opt.classList.add("selected");
      selectedOption = opt;
    }
  });
  
  if (selectedOption) {
    input.value = selectedOption.textContent.trim();
  } else {
    input.value = "";
  }
}

// ===============================
// POPULATE DROPDOWN OPTIONS
// ===============================
function populateDropdownOptions(dropdownId, options) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;
  
  const optionsContainer = dropdown.querySelector(".dropdown-options");
  
  // Clear all options except the first "all" option
  const firstOption = optionsContainer.querySelector(".dropdown-option");
  optionsContainer.innerHTML = "";
  optionsContainer.appendChild(firstOption);
  
  // Add new options
  options.forEach(optValue => {
    const optElement = document.createElement("div");
    optElement.className = "dropdown-option";
    optElement.dataset.value = optValue;
    optElement.textContent = optValue;
    optElement.onclick = function(e) {
      e.stopPropagation();
      selectDropdownOption(dropdownId, optValue);
    };
    optionsContainer.appendChild(optElement);
  });
}

// ===============================
// SELECT DROPDOWN OPTION
// ===============================
function selectDropdownOption(dropdownId, value) {
  setFilterValue(dropdownId, value);
  const dropdown = document.getElementById(dropdownId);
  const optionsContainer = dropdown.querySelector(".dropdown-options");
  optionsContainer.classList.remove("show");
  applyFilters();
}

// ===============================
// FILTER DROPDOWN OPTIONS (search functionality)
// ===============================
function filterDropdownOptions(input) {
  const dropdownId = input.closest(".searchable-dropdown").id;
  const dropdown = document.getElementById(dropdownId);
  const optionsContainer = dropdown.querySelector(".dropdown-options");
  const options = optionsContainer.querySelectorAll(".dropdown-option");
  
  const searchTerm = input.value.toLowerCase();
  
  // Show/hide options based on search
  options.forEach(option => {
    const text = option.textContent.toLowerCase();
    if (text.includes(searchTerm)) {
      option.classList.remove("hidden");
    } else {
      option.classList.add("hidden");
    }
  });
  
  // Show the dropdown when typing
  if (searchTerm.length > 0 || input.value.length === 0) {
    optionsContainer.classList.add("show");
  }
}

// ===============================
// CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
// ===============================
document.addEventListener("click", function(event) {
  const searchableDropdowns = document.querySelectorAll(".searchable-dropdown");
  searchableDropdowns.forEach(dropdown => {
    if (!dropdown.contains(event.target)) {
      const optionsContainer = dropdown.querySelector(".dropdown-options");
      optionsContainer.classList.remove("show");
    }
  });
});

// ===============================
// OPEN DROPDOWNS WHEN CLICKING ON INPUT
// ===============================
document.addEventListener("click", function(event) {
  if (event.target.classList.contains("filter-search-input")) {
    const dropdown = event.target.closest(".searchable-dropdown");
    const optionsContainer = dropdown.querySelector(".dropdown-options");
    optionsContainer.classList.add("show");
  }
});

// ===============================
// CHARGER LES DONNÉES DEPUIS L'API
// ===============================
async function loadData() {
  try {
    const res = await fetch(`${API_URL}?action=getDashboard`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    allData = data || [];

    // 🔥 DÉBOGAGE : Afficher les données reçues
    console.log("Données brutes reçues :", allData);
    if (allData.length > 0) {
      console.log("Exemple d'outil :", allData[0].outils?.[0]);
    }

    // Remplir les filtres
    populateFilters();

    // Afficher la première fois
    renderTable(allData);

  } catch (err) {
    console.error("Erreur chargement données:", err);
    showError(`Impossible de charger les données: ${err.message}`);
  }
}

// ===============================
// REMPLIR LES FILTRES AVEC LES VALEURS UNIQUES
// ===============================
function populateFilters() {
  // Extraire les matricules uniques
  const matricules = [...new Set(allData.map(u => u.matricule).filter(m => m))].sort();
  populateDropdownOptions('matriculeDropdown', matricules);

  // Extraire les fonctions uniques
  const fonctions = [...new Set(allData.map(u => u.fonction).filter(f => f))].sort();
  populateDropdownOptions('fonctionDropdown', fonctions);

  // Extraire les rattachements uniques - EXCLUSIVEMENT Contact Center MVOLA, Contact Center YAS, et Contact Center OPEN FIELD
  const allRattachements = [...new Set(allData.map(u => u.rattachement).filter(r => r))];
  const filteredRattachements = allRattachements.filter(r => {
    const normalizedR = r.toLowerCase().trim();
    return normalizedR === "contact center mvola" || 
           normalizedR === "contact center yas" || 
           normalizedR === "contact center open field";
  }).sort();
  
  populateDropdownOptions('rattachementDropdown', filteredRattachements);
}

// ===============================
// APPLIQUER LES FILTRES
// ===============================
function applyFilters() {
  const matricule = getFilterValue('matriculeDropdown');
  const fonction = getFilterValue('fonctionDropdown');
  const rattachement = getFilterValue('rattachementDropdown');

  filteredData = allData.filter(u => {
    const matchMatricule = !matricule || u.matricule === matricule;
    const matchFonction = !fonction || u.fonction === fonction;
    const matchRattachement = !rattachement || u.rattachement === rattachement;
    
    // Toujours vérifier que le rattachement est l'un des trois autorisés
    const allowedRattachements = ["contact center mvola", "contact center yas", "contact center open field"];
    const isAllowedRattachement = u.rattachement && allowedRattachements.includes(u.rattachement.toLowerCase().trim());
    
    return matchMatricule && matchFonction && matchRattachement && isAllowedRattachement;
  });

  renderTable(filteredData);
}

// ===============================
// RÉINITIALISER LES FILTRES
// ===============================
function resetFilters() {
  setFilterValue('matriculeDropdown', '');
  setFilterValue('fonctionDropdown', '');
  setFilterValue('rattachementDropdown', '');
  
  // Clear all search inputs
  document.querySelectorAll(".filter-search-input").forEach(input => {
    input.value = '';
  });
  
  // Hide all dropdowns
  document.querySelectorAll(".dropdown-options").forEach(container => {
    container.classList.remove("show");
  });
  
  renderTable(allData);
}

// ===============================
// DÉTERMINER LE STATUT DES OUTILS
// ===============================
function getToolsStatus(user) {
  if (!user.outils || user.outils.length === 0) {
    return { count: 0, status: "empty", label: "0 outil" }; // ROUGE
  }

  const allTerminated = user.outils.every(o => {
    const normalized = normalizeOutil(o);
    return normalized.statut === "Terminé";
  });

  if (allTerminated) {
    return { count: user.outils.length, status: "completed", label: `${user.outils.length} terminé(s)` }; // VERT
  } else {
    return { count: user.outils.length, status: "inProgress", label: `${user.outils.length} en cours` }; // ORANGE
  }
}

// ===============================
// AFFICHER LE TABLEAU
// ===============================
function renderTable(data) {
  tableBody.innerHTML = "";

  // Grouper les utilisateurs par matricule (enlever les doublons)
  const usersByMatricule = {};
  
  data.forEach(user => {
    if (!usersByMatricule[user.matricule]) {
      usersByMatricule[user.matricule] = user;
    }
  });

  // Convertir en array et filtrer les rattachements autorisés
  const allowedRattachements = ["contact center mvola", "contact center yas", "contact center open field"];
  const uniqueUsers = Object.values(usersByMatricule).filter(user => 
    user.rattachement && allowedRattachements.includes(user.rattachement.toLowerCase().trim())
  );

  if (uniqueUsers.length === 0) {
    emptyMessage.style.display = "block";
    tableBody.innerHTML = "";
  } else {
    emptyMessage.style.display = "none";
    uniqueUsers.forEach(user => {
      const toolsInfo = getToolsStatus(user);
      let badgeClass = "status-info";
      
      if (toolsInfo.status === "empty") {
        badgeClass = "status-danger"; // ROUGE
      } else if (toolsInfo.status === "completed") {
        badgeClass = "status-success"; // VERT
      } else if (toolsInfo.status === "inProgress") {
        badgeClass = "status-warning"; // ORANGE
      }
      
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${user.matricule}</strong></td>
        <td>${user.nom}</td>
        <td>${user.fonction}</td>
        <td>${user.rattachement}</td>
        <td>${user.login}</td>
        <td style="text-align: center;">
          <span class="badge ${badgeClass}">${toolsInfo.label}</span>
        </td>
        <td style="text-align: center;">
          <button class="eye-icon-btn" onclick="openDetails('${user.matricule}')" title="Voir les détails">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  }
}

// ===============================
// OUVRIR LES DÉTAILS
// ===============================
function openDetails(matricule) {
  // Trouver l'utilisateur
  const user = allData.find(u => u.matricule === matricule);
  
  if (!user) return;

  // Remplir les détails
  document.getElementById("detailMatricule").textContent = user.matricule || "---";
  document.getElementById("detailNom").textContent = user.nom || "---";
  document.getElementById("detailFonction").textContent = user.fonction || "---";
  document.getElementById("detailRattachement").textContent = user.rattachement || "---";
  document.getElementById("detailLogin").textContent = user.login || "---";

  // Remplir le tableau des outils
  const toolsTableBody = document.getElementById("toolsTableBody");
  const emptyTools = document.getElementById("emptyTools");
  
  toolsTableBody.innerHTML = "";

  if (!user.outils || user.outils.length === 0) {
    emptyTools.style.display = "block";
  } else {
    emptyTools.style.display = "none";
    user.outils.forEach(outil => {
      const outiLNormalisé = normalizeOutil(outil);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${outiLNormalisé.outil || "---"}</td>
        <td>
          <span class="badge ${outiLNormalisé.statut === 'Terminé' ? 'status-success' : 'status-info'}">
            ${outiLNormalisé.statut || "---"}
          </span>
        </td>
        <td>${outiLNormalisé.dateDebut || "---"}</td>
        <td>${outiLNormalisé.dateFin || "---"}</td>
      `;
      toolsTableBody.appendChild(tr);
    });
  }

  // Afficher la modal
  const modal = document.getElementById("detailsModal");
  modal.classList.add("show");
}

// ===============================
// FERMER LA MODAL
// ===============================
function closeModal() {
  const modal = document.getElementById("detailsModal");
  modal.classList.remove("show");
}

// Fermer la modal en cliquant en dehors
window.addEventListener("click", function(event) {
  const modal = document.getElementById("detailsModal");
  if (event.target === modal) {
    closeModal();
  }
});

// ===============================
// AFFICHER ERREUR
// ===============================
function showError(message) {
  emptyMessage.style.display = "block";
  emptyMessage.textContent = `❌ ${message}`;
}

// ===============================
// INITIALISATION
// ===============================
(async function init() {
  await loadData();
})();
