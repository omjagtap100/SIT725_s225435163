const API_BASE_URL = window.__CONFIG__?.API_BASE_URL || "http://localhost:5000";
const authToken = localStorage.getItem("vh_token") || "";
const authUser = JSON.parse(localStorage.getItem("vh_user") || "null");
const roleAliases = {
  organizationmanager: "OrganisationManager",
  organisationmanager: "OrganisationManager",
  admin: "Admin",
  volunteer: "Volunteer"
};
 
function normalizeRole(role) {
  const key = String(role || "").replace(/\s+/g, "").toLowerCase();
  return roleAliases[key] || role;
}

if (!authToken || !authUser) window.location.href = "/";

const currentUserEl = document.getElementById("currentUser");
const logoutBtn = document.getElementById("logoutBtn");
const logBox = document.getElementById("logBox");
const eventDetail = document.getElementById("eventDetail");

function log(message) {
  const time = new Date().toLocaleTimeString();
  logBox.textContent = `[${time}] ${message}\n` + logBox.textContent;
}

function getQueryParam(name) {
  return new URL(window.location.href).searchParams.get(name);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function api(path, method = "GET", body = null) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`
    },
    body: body ? JSON.stringify(body) : null
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

function renderRoles(roles) {
  if (!roles.length) return "<li>No roles configured</li>";
  return roles
    .map((role) => {
      const skills = (role.requiredSkills || []).join(", ") || "None listed";
      const filled = role.filled ?? 0;
      const remaining = role.remaining ?? role.capacity;
      return `<li>
        <strong>${escapeHtml(role.roleTitle)}</strong>
        ${role.description ? `<br /><span class="meta">${escapeHtml(role.description)}</span>` : ""}
        <br /><span class="meta">Skills: ${escapeHtml(skills)}</span>
        <br /><span class="meta">Capacity: ${filled} filled, ${remaining} remaining (max ${role.capacity})</span>
      </li>`;
    })
    .join("");
}

async function loadEvent() {
  const eventId = getQueryParam("id");
  if (!eventId) {
    eventDetail.innerHTML = "<p class='subtext'>Missing event id.</p>";
    return;
  }

  try {
    const event = await api(`/events/${eventId}`);
    const cap = event.capacity || {};
    const rolesHtml = renderRoles(event.roles || []);
  const roles = event.roles || [];
    const roleOptions = roles.length
      ? roles.map((r) => `<option value="${escapeHtml(r.roleTitle)}">${escapeHtml(r.roleTitle)} (${r.remaining ?? r.capacity} left)</option>`).join("")
      : `<option value="General Volunteer">General Volunteer</option>`;
 
    const applyBlock =
     normalizeRole(authUser.role) === "Volunteer"
        ? `<div class="manager-form" style="margin-top:16px;">
            <h3>Apply for a role</h3>
            <label for="applyRoleSelect">Select role</label>
            <select id="applyRoleSelect">${roleOptions}</select>
            <button type="button" id="applyBtn" class="ghost" style="margin-top:8px;">Submit application</button>
          </div>`
        : "";

    eventDetail.innerHTML = `
      <h2>${escapeHtml(event.title)}</h2>
      <p class="subtext">${escapeHtml(event.description)}</p>
      <p><strong>Status:</strong> ${escapeHtml(event.status)}</p>
      <p><strong>Date:</strong> ${escapeHtml(event.date)}</p>
      <p><strong>Time:</strong> ${escapeHtml(event.startTime)} - ${escapeHtml(event.endTime)}</p>
      <p><strong>Location:</strong> ${escapeHtml(event.location)}</p>
      <p><strong>Category:</strong> ${escapeHtml(event.category)}</p>
      <p><strong>Overall capacity:</strong> ${cap.filled ?? 0} filled, ${cap.remaining ?? event.maxVolunteers} remaining (max ${event.maxVolunteers})</p>
      <h3>Available roles</h3>
      <ul>${rolesHtml}</ul>
      ${applyBlock}
    `;
    const applyBtn = document.getElementById("applyBtn");
    if (applyBtn) {
      applyBtn.addEventListener("click", async () => {
        try {
          const roleTitle = document.getElementById("applyRoleSelect").value;
          await api("/applications", "POST", { eventId, roleTitle });
          log("Application submitted (Pending). Manager must accept before check-in.");
        } catch (error) {
          log(`Apply failed: ${error.message}`);
        }
      });
    }
    log("Event details loaded.");
  } catch (error) {
    eventDetail.innerHTML = `<p class="meta">Could not load event: ${escapeHtml(error.message)}</p>`;
    log(`Load event failed: ${error.message}`);
  }
}

currentUserEl.textContent = `${authUser.name} (${authUser.role})`;
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("vh_token");
  localStorage.removeItem("vh_user");
  window.location.href = "/";
});

loadEvent();
