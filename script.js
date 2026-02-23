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
const filterMatricule = document.getElementById("filterMatricule");
const filterFonction = document.getElementById("filterFonction");
const filterRattachement = document.getElementById("filterRattachement");

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
  const matricules = [...new Set(allData.map(u => u.matricule).filter(m => m))];
  matricules.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    filterMatricule.appendChild(opt);
  });

  // Extraire les fonctions uniques
  const fonctions = [...new Set(allData.map(u => u.fonction).filter(f => f))];
  fonctions.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f;
    opt.textContent = f;
    filterFonction.appendChild(opt);
  });

  // Extraire les rattachements uniques
  const rattachements = [...new Set(allData.map(u => u.rattachement).filter(r => r))];
  rattachements.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    filterRattachement.appendChild(opt);
  });
}

// ===============================
// APPLIQUER LES FILTRES
// ===============================
function applyFilters() {
  const matricule = filterMatricule.value;
  const fonction = filterFonction.value;
  const rattachement = filterRattachement.value;

  filteredData = allData.filter(u => {
    const matchMatricule = !matricule || u.matricule === matricule;
    const matchFonction = !fonction || u.fonction === fonction;
    const matchRattachement = !rattachement || u.rattachement === rattachement;
    return matchMatricule && matchFonction && matchRattachement;
  });

  renderTable(filteredData);
}

// ===============================
// RÉINITIALISER LES FILTRES
// ===============================
function resetFilters() {
  filterMatricule.value = "";
  filterFonction.value = "";
  filterRattachement.value = "";
  renderTable(allData);
}

// ===============================
// AFFICHER LE TABLEAU
// ===============================
function renderTable(data) {
  tableBody.innerHTML = "";

  // Créer une liste d'outils (déploiement)
  const rows = [];

  data.forEach(user => {
    if (!user.outils || user.outils.length === 0) {
      // Afficher une ligne vide si pas d'outils
      rows.push({
        matricule: user.matricule,
        nom: user.nom,
        fonction: user.fonction,
        rattachement: user.rattachement,
        login: user.login,
        outil: "---",
        statut: "---",
        dateDebut: "---",
        dateFin: "---"
      });
    } else {
      // Créer une ligne par outil
      user.outils.forEach(outil => {
        // 🔥 Normaliser l'outil pour gérer les deux structures
        const outiLNormalisé = normalizeOutil(outil);
        
        rows.push({
          matricule: user.matricule,
          nom: user.nom,
          fonction: user.fonction,
          rattachement: user.rattachement,
          login: user.login,
          outil: outiLNormalisé.outil || "---",
          statut: outiLNormalisé.statut || "---",
          dateDebut: outiLNormalisé.dateDebut || "---",
          dateFin: outiLNormalisé.dateFin || "---"
        });
      });
    }
  });

  // Afficher les lignes
  if (rows.length === 0) {
    emptyMessage.style.display = "block";
    tableBody.innerHTML = "";
  } else {
    emptyMessage.style.display = "none";
    rows.forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${row.matricule}</strong></td>
        <td>${row.nom}</td>
        <td>${row.fonction}</td>
        <td>${row.rattachement}</td>
        <td>${row.login}</td>
        <td>${row.outil}</td>
        <td>
          <span class="badge ${row.statut === 'Terminé' ? 'status-success' : 'status-info'}">
            ${row.statut}
          </span>
        </td>
        <td>${row.dateDebut}</td>
        <td>${row.dateFin}</td>
      `;
      tableBody.appendChild(tr);
    });
  }
}

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
