// ===============================
// INIT
// ===============================

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadConfig();
    populateSubdivisions();

    // Auto set today's date
    getEl("workDate").value =
      new Date().toISOString().split("T")[0];

  } catch (err) {
    console.error(err);
    alert("⚠️ Configuration load करण्यात त्रुटी आली.");
  }

  getEl("subdivision").addEventListener("change", handleSubdivisionChange);
  getEl("workType").addEventListener("change", handleWorkTypeChange);
  getEl("machineType").addEventListener("change", handleMachineTypeChange);
});

// ===============================
// SUBDIVISION
// ===============================

function populateSubdivisions() {
  const select = getEl("subdivision");
  resetSelect(select, "उपविभाग निवडा...");

  CONFIG.subdivisions.forEach(sub => {
    addOption(select, sub["Subdivision Code"], sub["Subdivision Name"]);
  });
}

function handleSubdivisionChange() {
  const subCode = getValue("subdivision");

  resetSelect(getEl("workType"), "कामाचा प्रकार निवडा...");
  resetSelect(getEl("projectName"), "प्रकल्प निवडा...");
  resetMachineSection();

  if (!subCode) return;

  const workTypes = unique(
    CONFIG.projects
      .filter(p => p["Subdivision Code"] === subCode)
      .map(p => p["Work Type"])
  );

  workTypes.forEach(type =>
    addOption(getEl("workType"), type, type)
  );

  populateMachineTypes(subCode);
}

// ===============================
// WORK TYPE → PROJECT
// ===============================

function handleWorkTypeChange() {
  const subCode = getValue("subdivision");
  const workType = getValue("workType");

  const projectSelect = getEl("projectName");
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
  const machineTypeSelect = getEl("machineType");
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
  const subCode = getValue("subdivision");
  const machineType = getValue("machineType");

  const machineSelect = getEl("machineName");
  const staffSelect = getEl("staffName");

  resetSelect(machineSelect, "मशीन निवडा...");
  resetSelect(staffSelect, "चालक / ऑपरेटर निवडा...");

  if (!subCode || !machineType) return;

  const machines = CONFIG.machines.filter(m =>
    m["Subdivision Code"] === subCode &&
    m["Machine Type"] === machineType
  );

  machines.forEach(m =>
    addOption(machineSelect, m["Machine Name"], m["Machine Name"])
  );

  populateStaff(subCode, machineType);
}

function populateStaff(subCode, machineType) {
  const staffSelect = getEl("staffName");

  // *** As per your instruction — exact compare kept ***
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
  resetSelect(getEl("machineType"), "सयंत्राचा प्रकार निवडा...");
  resetSelect(getEl("machineName"), "मशीन निवडा...");
  resetSelect(getEl("staffName"), "चालक / ऑपरेटर निवडा...");
}

// ===============================
// CLEAN UTILITY FUNCTIONS
// ===============================

function getEl(id) {
  return document.getElementById(id);
}

function getValue(id) {
  return getEl(id).value;
}

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
