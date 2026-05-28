const API_BASE_URL = window.__CONFIG__?.API_BASE_URL || "http://localhost:5000";
const authToken = localStorage.getItem("vh_token") || "";
let authUser = JSON.parse(localStorage.getItem("vh_user") || "null");

if (!authToken || !authUser) window.location.href = "/";

const currentUserEl = document.getElementById("currentUser");
const logoutBtn = document.getElementById("logoutBtn");
const logBox = document.getElementById("logBox");
const managerPanel = document.getElementById("managerPanel");
const managerOrgStatus = document.getElementById("managerOrgStatus");
const volunteerPanel = document.getElementById("volunteerPanel");
const adminPanel = document.getElementById("adminPanel");
const adminDataList = document.getElementById("adminDataList");
const clearLogBtn = document.getElementById("clearLogBtn");
const eventsList = document.getElementById("eventsList");
const refreshEventsBtn = document.getElementById("refreshEventsBtn");
const createEventForm = document.getElementById("createEventForm");
const createEventBtn = document.getElementById("createEventBtn");
const editEventForm = document.getElementById("editEventForm");
const cancelEditEventBtn = document.getElementById("cancelEditEventBtn");
const profileForm = document.getElementById("profileForm");
const profileNameInput = document.getElementById("profileName");
const profileEmailInput = document.getElementById("profileEmail");
const profilePhoneInput = document.getElementById("profilePhone");
const profileBioInput = document.getElementById("profileBio");
const profileSkillsInput = document.getElementById("profileSkills");
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

function getUserRole() {
  return normalizeRole(authUser?.role);
}

function log(message) {
  const time = new Date().toLocaleTimeString();
  logBox.textContent = `[${time}] ${message}\n` + logBox.textContent;
}

async function api(path, method = "GET", body = null) {
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` };
  const res = await fetch(`${API_BASE_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : null });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

function syncStoredUser(profile = {}) {
  authUser = {
    ...authUser,
    ...(profile._id ? { id: profile._id } : {}),
    ...(profile.name !== undefined ? { name: profile.name } : {}),
    ...(profile.email !== undefined ? { email: profile.email } : {}),
    ...(profile.role !== undefined ? { role: normalizeRole(profile.role) } : {})
  };
  localStorage.setItem("vh_user", JSON.stringify(authUser));
  updateUserUI();
}

function skillsToInputValue(skills) {
  if (Array.isArray(skills)) return skills.join(", ");
  if (typeof skills === "string") return skills;
  return "";
}

function parseSkills(value) {
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function populateProfileForm(profile) {
  profileNameInput.value = profile?.name || "";
  profileEmailInput.value = profile?.email || "";
  profilePhoneInput.value = profile?.phone || "";
  profileBioInput.value = profile?.bio || "";
  profileSkillsInput.value = skillsToInputValue(profile?.skills);
}

function updateUserUI() {
  const role = getUserRole();
  currentUserEl.textContent = `${authUser.name} (${role})`;
  managerPanel.classList.toggle("hidden", role !== "OrganisationManager");
  volunteerPanel.classList.toggle("hidden", role !== "Volunteer");
  adminPanel.classList.toggle("hidden", role !== "Admin");
}

async function loadProfile() {
  try {
    const profile = await api("/auth/profile");
    populateProfileForm(profile);
    syncStoredUser(profile);
  } catch (error) {
    log(`Profile load failed: ${error.message}`);
  }
}

async function loadManagerOrganizationStatus() {
  if (getUserRole() !== "OrganisationManager") return;
  try {
    const org = await api("/auth/organizations/me");
    if (!org) {
      managerOrgStatus.innerHTML = `
        <h4>No organisation linked</h4>
        <p class="meta">Register your organisation below. It stays <strong>Pending</strong> until an admin approves it.</p>
      `;
      if (createEventBtn) createEventBtn.disabled = true;
      return;
    }
    managerOrgStatus.innerHTML = `
      <h4>My organisation</h4>
      <p class="meta"><strong>Name:</strong> ${org.name}</p>
      <p class="meta"><strong>Status:</strong> ${org.status}</p>
      <p class="meta"><strong>Category:</strong> ${org.category}</p>
      <p class="meta"><strong>Contact:</strong> ${org.contactEmail}</p>
    `;
    if (createEventBtn) {
      createEventBtn.disabled = org.status !== "Approved";
      if (org.status !== "Approved") {
        log(`Event creation disabled until organisation is Approved (current: ${org.status}).`);
      }
    }
  } catch (error) {
    managerOrgStatus.innerHTML = `<p class="meta">Could not load organisation: ${error.message}</p>`;
    if (createEventBtn) createEventBtn.disabled = true;
  }
}



const rolesListEl = document.getElementById("rolesList");
const addRoleBtn = document.getElementById("addRoleBtn");
const eventFilterForm = document.getElementById("eventFilterForm");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");
const loadMyAppsBtn = document.getElementById("loadMyAppsBtn");
const loadHistoryBtn = document.getElementById("loadHistoryBtn");
const participationSummary = document.getElementById("participationSummary");
const participationHistoryList = document.getElementById("participationHistoryList");
const myApplicationsList = document.getElementById("myApplicationsList");
const exportEventCsvBtn = document.getElementById("exportEventCsvBtn");
const loadEventAppsBtn = document.getElementById("loadEventAppsBtn");
const managerApplicationsList = document.getElementById("managerApplicationsList");
 const eventsPrevBtn = document.getElementById("eventsPrevBtn");
const eventsNextBtn = document.getElementById("eventsNextBtn");
const eventsPageInfo = document.getElementById("eventsPageInfo");
const eventsLimitSelect = document.getElementById("eventsLimitSelect");
let eventsPage = 1;

function createRoleRow(role = {}) {
  const div = document.createElement("div");
  div.className = "event-card role-row";
  div.innerHTML = `
    <label>Role title</label>
    <input type="text" class="role-title" placeholder="e.g. General Volunteer" value="${role.roleTitle || ""}" required />
    <label>Description</label>
    <input type="text" class="role-description" placeholder="What volunteers will do" value="${role.description || ""}" />
    <label>Required skills (comma-separated)</label>
    <input type="text" class="role-skills" placeholder="Teamwork, First aid" value="${(role.requiredSkills || []).join(", ")}" />
    <label>Capacity</label>
    <input type="number" class="role-capacity" min="1" value="${role.capacity || 10}" required />
    <button type="button" class="ghost remove-role-btn" style="margin-top:8px;">Remove role</button>
  `;
  div.querySelector(".remove-role-btn").addEventListener("click", () => div.remove());
  return div;
}
 
function collectRolesFromForm() {
  const rows = rolesListEl ? [...rolesListEl.querySelectorAll(".role-row")] : [];
  if (!rows.length) {
    return [{ roleTitle: "General Volunteer", description: "General support", requiredSkills: [], capacity: 10 }];
  }
  return rows.map((row) => ({
    roleTitle: row.querySelector(".role-title").value.trim(),
    description: row.querySelector(".role-description").value.trim(),
    requiredSkills: parseSkills(row.querySelector(".role-skills").value),
    capacity: Number(row.querySelector(".role-capacity").value)
  }));
}
 
function getEventFilterQuery() {
  const limit = eventsLimitSelect?.value || "10";
  const params = new URLSearchParams({ page: String(eventsPage), limit });
  const category = document.getElementById("filterCategory")?.value.trim();
  const location = document.getElementById("filterLocation")?.value.trim();
  const startDate = document.getElementById("filterStartDate")?.value;
  const endDate = document.getElementById("filterEndDate")?.value;
  if (category) params.set("category", category);
  if (location) params.set("location", location);
  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);
  return params.toString();
}

function updateEventsPaginationUI(meta = {}) {
  const total = meta.total ?? 0;
  const page = meta.page ?? eventsPage;
  const limit = meta.limit ?? Number(eventsLimitSelect?.value || 10);
  const totalPages = total ? Math.max(1, Math.ceil(total / limit)) : 1;
  if (eventsPageInfo) {
    eventsPageInfo.textContent = total
      ? `Page ${page} of ${totalPages} (${total} events)`
      : "No events";
  }
  if (eventsPrevBtn) eventsPrevBtn.disabled = page <= 1;
  if (eventsNextBtn) eventsNextBtn.disabled = !total || page >= totalPages;
}

function hideEditForm() {
  editEventForm.classList.add("hidden");
  editEventForm.reset();
}

function showEditForm(event) {
  document.getElementById("editEventId").value = event._id;
  document.getElementById("editEventTitle").value = event.title;
  document.getElementById("editEventDescription").value = event.description;
  document.getElementById("editEventDate").value = event.date;
  document.getElementById("editEventStartTime").value = event.startTime;
  document.getElementById("editEventEndTime").value = event.endTime;
  document.getElementById("editEventLocation").value = event.location;
  document.getElementById("editEventCategory").value = event.category;
  document.getElementById("editEventMaxVolunteers").value = event.maxVolunteers;
  editEventForm.classList.remove("hidden");
}

async function loadEvents() {
  eventsList.innerHTML = "";
  eventsList.classList.add("events-loading");
  try {
    const response = await api(`/events?${getEventFilterQuery()}`);
    const events = Array.isArray(response) ? response : response.items || [];
     if (!Array.isArray(response)) {
      updateEventsPaginationUI(response);
    } else {
      updateEventsPaginationUI({ total: events.length, page: 1, limit: events.length || 1 });
    }
    if (!events.length) {
      eventsList.innerHTML = "<p class='subtext'>No published events yet.</p>";
      return;
    }

    const isManager = getUserRole() === "OrganisationManager";
    const isAdmin = getUserRole() === "Admin";
    const canManage = isManager || isAdmin;

    eventsList.innerHTML = events
      .map((event) => {
       const adminDelete = isAdmin
          ? `<button class="ghost" data-action="deleteEvent" data-id="${event._id}">Delete (FR-24)</button>`
          : ""; 
        const manageActions = canManage
          ? `<button class="ghost" data-action="editEvent" data-id="${event._id}">Edit</button>
              <button class="ghost" data-action="cancelEvent" data-id="${event._id}">Cancel</button>
        <button class="ghost" data-action="viewApps" data-id="${event._id}">Applications</button>
             ${adminDelete}`
          : adminDelete;     
        return `<div class="event-card">
          <h3>${event.title}</h3>
          <p class="meta">${event.description}</p>
          <p class="meta"><strong>Date:</strong> ${event.date} &nbsp; <strong>Time:</strong> ${event.startTime} - ${event.endTime}</p>
          <p class="meta"><strong>Location:</strong> ${event.location} &nbsp; <strong>Category:</strong> ${event.category}</p>
          <p class="meta"><strong>Max volunteers:</strong> ${event.maxVolunteers}</p>
          <div class="actions">
            <a href="/event?id=${event._id}" class="ghost" style="text-decoration:none;padding:7px 10px;">View details</a>
            ${manageActions}
          </div>
        </div>`;
      })
      .join("");
     const pageLabel = Array.isArray(response) ? 1 : response.page ?? eventsPage;
    log(`Loaded ${events.length} event(s) on page ${pageLabel}.`);
  } catch (error) {
    log(`Load events failed: ${error.message}`);
    } finally {
    eventsList.classList.remove("events-loading");
  }
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("vh_token");
  localStorage.removeItem("vh_user");
  window.location.href = "/";
});

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const payload = {
      name: profileNameInput.value.trim(),
      phone: profilePhoneInput.value.trim(),
      bio: profileBioInput.value.trim(),
      skills: parseSkills(profileSkillsInput.value)
    };
    const updatedProfile = await api("/auth/profile", "PATCH", payload);
    populateProfileForm(updatedProfile);
    syncStoredUser(updatedProfile);
    log("Profile updated successfully.");
  } catch (error) {
    log(`Profile update failed: ${error.message}`);
  }
});

document.getElementById("orgForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await api("/auth/organizations", "POST", {
      name: document.getElementById("orgName").value,
      description: document.getElementById("orgDescription").value,
      category: document.getElementById("orgCategory").value,
      address: document.getElementById("orgAddress").value,
      contactEmail: document.getElementById("orgEmail").value
    });
    log("Organisation submitted (Pending).");
    e.target.reset();
    loadManagerOrganizationStatus();
  } catch (error) {
    log(`Organisation submit failed: ${error.message}`);
  }
});

document.getElementById("loadOrgsBtn").addEventListener("click", async () => {
  try {
    const orgs = await api("/auth/organizations");
    adminDataList.innerHTML = orgs
      .map(
        (o) =>
          `<div class="event-card"><h3>${o.name}</h3><p class="meta">${o.category}</p><p class="meta">Status: ${o.status}</p><div class="actions"><button class="ghost" data-action="approveOrg" data-id="${o._id}">Approve</button><button class="ghost" data-action="rejectOrg" data-id="${o._id}">Reject</button><button class="ghost" data-action="deleteOrg" data-id="${o._id}">Delete</button></div></div>`
      )
      .join("");
    log(`Loaded ${orgs.length} organisation(s).`);
  } catch (error) {
    log(`Load organisations failed: ${error.message}`);
  }
});

adminDataList.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  try {
  if (action === "approveOrg") {
      await api(`/auth/organizations/${id}/review`, "PATCH", { status: "Approved" });
      log("Organisation approved.");
    } else if (action === "rejectOrg") {
      await api(`/auth/organizations/${id}/review`, "PATCH", { status: "Rejected" });
      log("Organisation rejected.");
    } else if (action === "deleteOrg") {
      if (!confirm("Permanently delete this organisation and its events?")) return;
      await api(`/auth/organizations/${id}`, "DELETE");
      log("Organisation deleted");
    }  
    document.getElementById("loadOrgsBtn").click();
  } catch (error) {
    log(`Action failed: ${error.message}`);
  }
});

clearLogBtn.addEventListener("click", () => {
  logBox.textContent = "";
});

if (createEventForm) {
  createEventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {

      const roles = collectRolesFromForm();
      await api("/events", "POST", {
        title: document.getElementById("eventTitle").value.trim(),
        description: document.getElementById("eventDescription").value.trim(),
        date: document.getElementById("eventDate").value,
        startTime: document.getElementById("eventStartTime").value,
        endTime: document.getElementById("eventEndTime").value,
        location: document.getElementById("eventLocation").value.trim(),
        category: document.getElementById("eventCategory").value.trim(),
        maxVolunteers: Number(document.getElementById("eventMaxVolunteers").value),
        roles
      });
      log("Event created.");
      createEventForm.reset();
        if (rolesListEl) {
        rolesListEl.innerHTML = "";
        rolesListEl.appendChild(createRoleRow());
      }
      
      loadEvents();
    } catch (error) {

      log(`Create event failed: ${error.message}`);
    }
  });
}

if (editEventForm) {
  editEventForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const eventId = document.getElementById("editEventId").value;
    try {
      await api(`/events/${eventId}`, "PUT", {
        title: document.getElementById("editEventTitle").value.trim(),
        description: document.getElementById("editEventDescription").value.trim(),
        date: document.getElementById("editEventDate").value,
        startTime: document.getElementById("editEventStartTime").value,
        endTime: document.getElementById("editEventEndTime").value,
        location: document.getElementById("editEventLocation").value.trim(),
        category: document.getElementById("editEventCategory").value.trim(),
        maxVolunteers: Number(document.getElementById("editEventMaxVolunteers").value)
      });
      log("Event updated.");
      hideEditForm();
      loadEvents();
    } catch (error) {
      log(`Edit event failed: ${error.message}`);
    }
  });
}

if (cancelEditEventBtn) {
  cancelEditEventBtn.addEventListener("click", hideEditForm);
}

if (refreshEventsBtn) {
  refreshEventsBtn.addEventListener("click", loadEvents);
}

eventsList.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const eventId = btn.dataset.id;
  const action = btn.dataset.action;
  if (!eventId || !action) return;

  try {
    if (action === "cancelEvent") {
      await api(`/events/${eventId}/cancel`, "PATCH", {});
      log("Event cancelled; registered volunteers notified.");
      hideEditForm();
      loadEvents();
    } else if (action === "editEvent") {
      const event = await api(`/events/${eventId}`);
      showEditForm(event);
      log("Edit form opened.");
    }
    else if (action === "viewApps") {
      document.getElementById("reviewEventId").value = eventId;
      await loadManagerApplications(eventId);
      log("Loaded applications for event.");
    } else if (action === "deleteEvent") {
      if (!confirm("Permanently delete this event and its applications?")) return;
      await api(`/events/${eventId}`, "DELETE");
      log("Event deleted (FR-24).");
      hideEditForm();
      loadEvents();
    }
  } catch (error) {
    log(`Action failed: ${error.message}`);
  }
});
async function loadParticipationHistory() {
  if (!participationHistoryList) return;
  try {
    const { summary, items } = await api("/applications/me/history");
    if (participationSummary) {
      participationSummary.classList.remove("hidden");
      participationSummary.innerHTML = `
        <h4>Participation summary (FR-21)</h4>
        <p class="meta"><strong>Total applications:</strong> ${summary.totalApplications}</p>
        <p class="meta"><strong>Accepted:</strong> ${summary.acceptedCount} &nbsp; <strong>Check-ins:</strong> ${summary.completedCheckIns}</p>
        <p class="meta"><strong>Total hours contributed:</strong> ${summary.totalHours}</p>
      `;
    }
    if (!items.length) {
      participationHistoryList.innerHTML =
        "<p class='subtext'>No participation history yet. Apply to events and check in after acceptance.</p>";
      return;
    }
    participationHistoryList.innerHTML = items
      .map((item) => {
        const checked = item.checkedInAt
          ? `<p class="meta">Checked in: ${new Date(item.checkedInAt).toLocaleString()} — ${item.hoursContributed}h</p>`
          : "<p class='meta'>Not checked in yet</p>";
        return `<div class="event-card">
          <h3>${item.eventTitle}</h3>
          <p class="meta">${item.eventDate} · ${item.eventLocation} · ${item.eventCategory}</p>
          <p class="meta"><strong>Role:</strong> ${item.roleTitle} &nbsp; <strong>Status:</strong> ${item.status}</p>
          ${checked}
        </div>`;
      })
      .join("");
    log(`Loaded participation history (${items.length} record(s), ${summary.totalHours}h total).`);
  } catch (error) {
    log(`Participation history failed: ${error.message}`);
  }
}
async function loadMyApplications() {
  if (!myApplicationsList) return;
  try {
    const apps = await api("/applications/me");
    if (!apps.length) {
      myApplicationsList.innerHTML = "<p class='subtext'>No applications yet. Apply from an event details page.</p>";
      return;
    }
    myApplicationsList.innerHTML = apps
      .map((app) => {
        const checkInBtn =
          app.status === "Accepted" && !app.checkedInAt
            ? `<button class="ghost" data-check-in="${app._id}">Check in (FR-19)</button>`
            : "";
        const checked = app.checkedInAt ? `<p class="meta">Checked in: ${new Date(app.checkedInAt).toLocaleString()} (${app.hoursContributed}h)</p>` : "";
        return `<div class="event-card">
          <h3>${app.roleTitle}</h3>
          <p class="meta">Event ID: ${app.eventId}</p>
          <p class="meta">Status: ${app.status}</p>
          ${checked}
          <div class="actions">${checkInBtn}</div>
        </div>`;
      })
      .join("");
    log(`Loaded ${apps.length} application(s).`);
  } catch (error) {
    log(`Load applications failed: ${error.message}`);
  }
}
 
async function loadManagerApplications(eventId) {
  if (!managerApplicationsList || !eventId) return;
  try {
    const apps = await api(`/applications/event/${eventId}`);
    if (!apps.length) {
      managerApplicationsList.innerHTML = "<p class='subtext'>No applications for this event.</p>";
      return;
    }
    managerApplicationsList.innerHTML = apps
      .map(
        (app) => `<div class="event-card">
          <h3>${app.volunteerName}</h3>
          <p class="meta">${app.roleTitle} — ${app.status}</p>
          <div class="actions">
            <button class="ghost" data-app-status="Accepted" data-app-id="${app._id}">Accept</button>
            <button class="ghost" data-app-status="Declined" data-app-id="${app._id}">Decline</button>
          </div>
        </div>`
      )
      .join("");
  } catch (error) {
    log(`Load event applications failed: ${error.message}`);
  }
}
 
if (addRoleBtn && rolesListEl) {
  addRoleBtn.addEventListener("click", () => rolesListEl.appendChild(createRoleRow()));
  rolesListEl.appendChild(createRoleRow());
}
 
if (eventFilterForm) {
  eventFilterForm.addEventListener("submit", (e) => {
    e.preventDefault();
     eventsPage = 1;
    loadEvents();
  });
}
 
if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener("click", () => {
    eventFilterForm.reset();
     eventsPage = 1;
    loadEvents();
  });
}
 
if (eventsPrevBtn) {
  eventsPrevBtn.addEventListener("click", () => {
    if (eventsPage > 1) {
      eventsPage -= 1;
      loadEvents();
    }
  });
}
 
if (eventsNextBtn) {
  eventsNextBtn.addEventListener("click", () => {
    eventsPage += 1;
    loadEvents();
  });
}
 
if (eventsLimitSelect) {
  eventsLimitSelect.addEventListener("change", () => {
    eventsPage = 1;
    loadEvents();
  });
}
 
if (loadHistoryBtn) {
  loadHistoryBtn.addEventListener("click", loadParticipationHistory);
}

if (loadMyAppsBtn) {
  loadMyAppsBtn.addEventListener("click", loadMyApplications);
}

if (exportEventCsvBtn) {
  exportEventCsvBtn.addEventListener("click", async () => {
    const eventId = document.getElementById("reviewEventId")?.value.trim();
    if (!eventId) {
      log("Enter an event ID before exporting CSV.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/applications/event/${eventId}/export`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `participation-${eventId}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      log("Participation CSV downloaded (FR-22).");
    } catch (error) {
      log(`CSV export failed: ${error.message}`);
    }
  });
}
if (myApplicationsList) {
  myApplicationsList.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-check-in]");
    if (!btn) return;
    try {
      await api(`/applications/${btn.dataset.checkIn}/check-in`, "PATCH", {});
      log("Checked in successfully.");
      loadMyApplications();
    } catch (error) {
      log(`Check-in failed: ${error.message}`);
    }
  });
}
 
if (loadEventAppsBtn) {
  loadEventAppsBtn.addEventListener("click", () => {
    const eventId = document.getElementById("reviewEventId").value.trim();
    loadManagerApplications(eventId);
  });
}
 
if (managerApplicationsList) {
  managerApplicationsList.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-app-status]");
    if (!btn) return;
    try {
      await api(`/applications/${btn.dataset.appId}/status`, "PATCH", { status: btn.dataset.appStatus });
      log(`Application ${btn.dataset.appStatus.toLowerCase()}.`);
      const eventId = document.getElementById("reviewEventId").value.trim();
      loadManagerApplications(eventId);
    } catch (error) {
      log(`Update application failed: ${error.message}`);
    }
  });
}
function connectNotificationStream() {
  const toast = document.getElementById("notificationToast");
  if (!authToken || typeof EventSource === "undefined") return;

  const source = new EventSource(
    `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(authToken)}`
  );

  source.addEventListener("open", () => {
    if (toast) {
      toast.classList.remove("hidden");
      toast.textContent = "Notifications on";
    }
  });

  source.addEventListener("application_updated", (event) => {
    try {
      const data = JSON.parse(event.data);
      const msg = `Application ${data.status} for ${data.roleTitle}`;
      log(msg);
      if (toast) toast.textContent = msg;
      if (getUserRole() === "Volunteer") {
        loadMyApplications();
        loadParticipationHistory();
      }
    } catch (_error) {
      /* ignore */
    }
  });

  source.addEventListener("event_cancelled", (event) => {
    try {
      const data = JSON.parse(event.data);
      const msg = `Event cancelled: ${data.title}`;
      log(msg);
      if (toast) toast.textContent = msg;
      loadEvents();
    } catch (_error) {
      /* ignore */
    }
  });

  source.onerror = () => {
    if (toast) toast.textContent = "Notifications reconnecting…";
  };
}

updateUserUI();
loadProfile();
loadManagerOrganizationStatus();
loadEvents();
connectNotificationStream();
if (getUserRole() === "Volunteer") {
  loadParticipationHistory();
  loadMyApplications();
}