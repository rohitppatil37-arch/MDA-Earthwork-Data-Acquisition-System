document.addEventListener("DOMContentLoaded", async () => {
  await loadConfig();
  populateSubdivisions();

  document
    .getElementById("subdivision")
    .addEventListener("change", handleSubdivisionChange);

  document
    .getElementById("workType")
    .addEventListener("change", handleWorkTypeChange);

  document
    .getElementById("machineType")
    .addEventListener("change", handleMachineTypeChange);
});

// ===============================
// SUBDIVISION
// ===============================

function populateSubdivisions() {
  const select = document.getElementById("subdivision");
  resetSelect(select, "उपविभाग निवडा...");

  CONFIG.subdivisions.forEach(sub => {
    addOption(select, sub["Subdivision Code"], sub["Subdivision Name"]);
  });
}

function handleSubdivisionChange() {
  const subCode = document.getElementById("subdivision").value;

  resetSelect(document.getElementById("workType"), "कामाचा प्रकार निवडा...");
  resetSelect(document.getElementById("projectName"), "प्रकल्प निवडा...");
  resetMachineSection();

  if (!subCode) return;

  // Populate Work Types
  const workTypes = unique(
    CONFIG.projects
      .filter(p => p["Subdivision Code"] === subCode)
      .map(p => p["Work Type"])
  );

  workTypes.forEach(type =>
    addOption(document.getElementById("workType"), type, type)
  );

  populateMachineTypes(subCode);
}

// ===============================
// WORK TYPE → PROJECT
// ===============================

function handleWorkTypeChange() {
  const subCode = document.getElementById("subdivision").value;
  const workType = document.getElementById("workType").value;

  const projectSelect = document.getElementById("projectName");
  resetSelect(projectSelect, "प्रकल्प निवडा...");

  if (!subCode || !workType) return;

  const projects = CONFIG.projects.filter(p =>
    p["Subdivision Code"] === subCode &&
    p["Work Type"] === workType
  );

  projects.forEach(p =>
    addOption(projectSelect, p["Project Name"], p["Project Name"])
  );
}

// ===============================
// MACHINE SECTION
// ===============================

function populateMachineTypes(subCode) {
  const machineTypeSelect = document.getElementById("machineType");
  resetSelect(machineTypeSelect, "सयंत्राचा प्रकार निवडा...");

  const types = unique(
    CONFIG.machines
      .filter(m => m["Subdivision Code"] === subCode)
      .map(m => m["Machine Type"])
  );

  types.forEach(type =>
    addOption(machineTypeSelect, type, type)
  );
}

function handleMachineTypeChange() {
  const subCode = document.getElementById("subdivision").value;
  const machineType = document.getElementById("machineType").value;

  const machineSelect = document.getElementById("machineName");
  const staffSelect = document.getElementById("staffName");

  resetSelect(machineSelect, "मशीन निवडा...");
  resetSelect(staffSelect, "चालक / ऑपरेटर निवडा...");

  if (!subCode || !machineType) return;

  // Populate Machines
  const machines = CONFIG.machines.filter(m =>
    m["Subdivision Code"] === subCode &&
    m["Machine Type"] === machineType
  );

  machines.forEach(m =>
    addOption(machineSelect, m["Machine Name"], m["Machine Name"])
  );

  // Populate Staff
  populateStaff(subCode, machineType);
}

function populateStaff(subCode, machineType) {
  const staffSelect = document.getElementById("staffName");

  const roleRequired =
    machineType === "डोझर/एस्कॅव्हेटर"
      ? "Operator"  
      : "Driver";

  const staff = CONFIG.staff.filter(s =>
    s["Subdivision Code"] === subCode &&
    s["Role"] === roleRequired
  );

  staff.forEach(person =>
    addOption(staffSelect, person["Name"], person["Name"])
  );
}

function resetMachineSection() {
  resetSelect(document.getElementById("machineType"), "सयंत्राचा प्रकार निवडा...");
  resetSelect(document.getElementById("machineName"), "मशीन निवडा...");
  resetSelect(document.getElementById("staffName"), "चालक / ऑपरेटर निवडा...");
}

// ===============================
// CLEAN UTILITY FUNCTIONS
// ===============================

function resetSelect(selectElement, placeholder) {
  selectElement.innerHTML = "";
  addOption(selectElement, "", placeholder);
}

function addOption(selectElement, value, text) {
  const opt = document.createElement("option");
  opt.value = value;
  opt.textContent = text;
  selectElement.appendChild(opt);
}

function unique(arr) {
  return [...new Set(arr)];
}
