const logBox = document.getElementById("logBox");
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");
const API_BASE_URL = "http://localhost:5000";
function log(message) {
  const time = new Date().toLocaleTimeString();
  logBox.textContent = `[${time}] ${message}\n` + logBox.textContent;
}
 
function decodeJwtPayload(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch (_e) {
    return null;
  }
}
 
async function api(path, method = "GET", body = null) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : null
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}
 
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await api("/auth/register", "POST", {
      name: document.getElementById("regName").value,
      email: document.getElementById("regEmail").value,
      password: document.getElementById("regPassword").value,
      role: document.getElementById("regRole").value
    });
    log("Registration successful. Please log in.");
    e.target.reset();
  } catch (error) {
    log(`Registration failed: ${error.message}`);
  }
});
 
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const data = await api("/auth/login", "POST", {
      email: document.getElementById("loginEmail").value,
      password: document.getElementById("loginPassword").value
    });
    localStorage.setItem("vh_token", data.token);
    localStorage.setItem("vh_user", JSON.stringify(decodeJwtPayload(data.token)));
    window.location.href = "/dashboard";
  } catch (error) {
    log(`Login failed: ${error.message}`);
  }
});
const forgotForm = document.getElementById("forgotForm");
if (forgotForm) {
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const data = await api("/auth/forgot-password", "POST", {
        email: document.getElementById("forgotEmail").value
      });
      log(data.message);
      if (data.devToken) {
        log(`Dev reset token: ${data.devToken}`);
        const resetTokenInput = document.getElementById("resetToken");
        if (resetTokenInput) resetTokenInput.value = data.devToken;
      }
    } catch (error) {
      log(`Forgot password failed: ${error.message}`);
    }
  });
}
 
const resetForm = document.getElementById("resetForm");
if (resetForm) {
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const data = await api("/auth/reset-password", "POST", {
        token: document.getElementById("resetToken").value.trim(),
        password: document.getElementById("resetPassword").value
      });
      log(data.message);
      resetForm.reset();
    } catch (error) {
      log(`Reset password failed: ${error.message}`);
    }
  });
} 
 
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.dataset.tab;
    tabContents.forEach((content) => content.classList.toggle("hidden", content.id !== target));
  });
});
const clearLogBtn = document.getElementById("clearLogBtn");
if (clearLogBtn) clearLogBtn.addEventListener("click", () => { logBox.textContent = ""; });

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("vh_token");
    localStorage.removeItem("vh_user");
    window.location.href = "/";
  });
}
