// ============================================================
// KCBA Login Module - Sistem Login Multi-Juri
// ============================================================

export const JUDGES = [
    { id: "mput",    name: "MPUT",    criteria: "Kualitas Vocal", field: "vocal",      label: "Kualitas Vocal (MPUT)",   color: "#a855f7" },
    { id: "nur",     name: "NUR",     criteria: "Artikulasi",     field: "artikulasi", label: "Artikulasi (NUR)",         color: "#3b82f6" },
    { id: "khrisna", name: "KHRISNA", criteria: "Pronounce",      field: "pronounce",  label: "Pronounce (KHRISNA)",      color: "#06b6d4" },
    { id: "dewi",    name: "DEWI",    criteria: "Pitch Control",  field: "pitch",      label: "Pitch Control (DEWI)",     color: "#ec4899" },
    { id: "cecep",   name: "CECEP",   criteria: "Tempo",          field: "tempo",      label: "Tempo (CECEP)",            color: "#f97316" },
    { id: "wildan",  name: "WILDAN",  criteria: "Penghayatan",    field: "feel",       label: "Penghayatan (WILDAN)",     color: "#22c55e" },
    { id: "way",     name: "WAY",     criteria: "Teknik Vocal",   field: "teknik",     label: "Teknik Vocal (WAY)",       color: "#eab308" },
];

const OWNER_PASSWORD = "00000";

export function getCurrentRole() {
    return sessionStorage.getItem("kcba_role") || null;
}

export function getJudgeInfo(role) {
    if (!role || role === "owner") return null;
    return JUDGES.find(j => j.id === role) || null;
}

export function logout() {
    sessionStorage.removeItem("kcba_role");
    location.reload();
}

export function initLogin(onLoginSuccess) {
    const existingRole = getCurrentRole();
    if (existingRole) {
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("main-app-container").style.display = "";
        onLoginSuccess(existingRole);
        return;
    }

    const loginScreen = document.getElementById("login-screen");
    const mainApp = document.getElementById("main-app-container");

    loginScreen.style.display = "flex";
    mainApp.style.display = "none";

    const ownerPasswordInput = document.getElementById("owner-password-input");
    const ownerBtn = document.getElementById("btn-owner-login");
    const ownerError = document.getElementById("owner-error");
    const judgeSelect = document.getElementById("judge-select");
    const judgeLoginBtn = document.getElementById("btn-judge-login");

    function tryOwnerLogin() {
        const pw = ownerPasswordInput.value.trim();
        if (pw === OWNER_PASSWORD) {
            sessionStorage.setItem("kcba_role", "owner");
            loginScreen.style.display = "none";
            mainApp.style.display = "";
            onLoginSuccess("owner");
        } else {
            ownerError.style.display = "flex";
            ownerPasswordInput.value = "";
            ownerPasswordInput.classList.add("shake");
            setTimeout(() => ownerPasswordInput.classList.remove("shake"), 500);
        }
    }

    ownerBtn.addEventListener("click", tryOwnerLogin);
    ownerPasswordInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") tryOwnerLogin();
        ownerError.style.display = "none";
    });

    judgeLoginBtn.addEventListener("click", () => {
        const selectedId = judgeSelect.value;
        if (!selectedId) {
            judgeSelect.classList.add("shake");
            setTimeout(() => judgeSelect.classList.remove("shake"), 500);
            return;
        }
        sessionStorage.setItem("kcba_role", selectedId);
        loginScreen.style.display = "none";
        mainApp.style.display = "";
        onLoginSuccess(selectedId);
    });

    const tabOwner = document.getElementById("login-tab-owner");
    const tabJudge = document.getElementById("login-tab-judge");
    const panelOwner = document.getElementById("login-panel-owner");
    const panelJudge = document.getElementById("login-panel-judge");

    tabOwner.addEventListener("click", () => {
        tabOwner.classList.add("active");
        tabJudge.classList.remove("active");
        panelOwner.style.display = "block";
        panelJudge.style.display = "none";
        ownerError.style.display = "none";
    });

    tabJudge.addEventListener("click", () => {
        tabJudge.classList.add("active");
        tabOwner.classList.remove("active");
        panelJudge.style.display = "block";
        panelOwner.style.display = "none";
        ownerError.style.display = "none";
    });
}
