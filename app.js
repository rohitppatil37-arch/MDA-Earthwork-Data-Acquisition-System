// ===============================
// INIT
// ===============================

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadConfig();
    populateSubdivisions();

    getEl("workDate").value =
      new Date().toISOString().split("T")[0];

  } catch (err) {
    console.error(err);
    alert("⚠️ Configuration load करण्यात त्रुटी आली.");
  }

  getEl("subdivision").addEventListener("change", handleSubdivisionChange);
  getEl("workType").addEventListener("change", handleWorkTypeChange);
  getEl("machineType").addEventListener("change", handleMachineTypeChange);

  // Auto calculations
  getEl("startReading").addEventListener("input", calculateTotalReading);
  getEl("endReading").addEventListener("input", calculateTotalReading);

  getEl("shift1Start").addEventListener("input", calculateShiftHours);
  getEl("shift1End").addEventListener("input", calculateShiftHours);
  getEl("shift2Start").addEventListener("input", calculateShiftHours);
  getEl("shift2End").addEventListener("input", calculateShiftHours);

  getEl("dieselQty").addEventListener("input", handleDieselLogic);
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

  toggleFormFields(machineType);   // Dynamic show/hide
}

function toggleFormFields(machineType) {

  const machineSection = getEl("machineSection");
  const vehicleSection = getEl("vehicleSection");

  const isVehicle =
    machineType === "टिपर" ||
    machineType === "ट्रान्सपोर्टर" ||
    machineType === "युटिलिटी वाहने";

  if (isVehicle) {
    // 🚛 VEHICLE MODE
    vehicleSection.style.display = "block";
    machineSection.style.display = "none";

    getEl("tripCount").required = true;
    getEl("locationFromTo").required = true;

    // Machine fields reset
    getEl("dieselTime").required = false;
    getEl("dieselReading").required = false;

  } else {
    // ⚙️ MACHINE MODE
    vehicleSection.style.display = "none";
    machineSection.style.display = "block";

    getEl("tripCount").required = false;
    getEl("locationFromTo").required = false;

    getEl("tripCount").value = "";
    getEl("locationFromTo").value = "";
  }
}

function populateStaff(subCode, machineType) {
  const roleRequired =
    machineType === "डोझर/एस्कॅव्हेटर"
      ? "Operator"
      : "Driver";

  const staff = CONFIG.staff.filter(s =>
    s["Subdivision Code"] === subCode &&
    s["Role"] === roleRequired
  );

  staff.forEach(person =>
    addOption(getEl("staffName"), person["Name"], person["Name"])
  );
}

function resetMachineSection() {
  resetSelect(getEl("machineType"), "सयंत्राचा प्रकार निवडा...");
  resetSelect(getEl("machineName"), "मशीन निवडा...");
  resetSelect(getEl("staffName"), "चालक / ऑपरेटर निवडा...");

  // Reset dynamic sections
  if (getEl("machineSection")) getEl("machineSection").style.display = "block";
  if (getEl("vehicleSection")) getEl("vehicleSection").style.display = "none";
}

// ===============================
// CALCULATIONS
// ===============================

function calculateTotalReading() {
  const start = Number(getValue("startReading")) || 0;
  const end = Number(getValue("endReading")) || 0;

  if (end >= start) {
    getEl("totalReading").value = (end - start).toFixed(1);
  }
}

function calculateShiftHours() {
  function toHours(t) {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h + m / 60;
  }

  const s1 = toHours(getValue("shift1Start"));
  const e1 = toHours(getValue("shift1End"));
  const s2 = toHours(getValue("shift2Start"));
  const e2 = toHours(getValue("shift2End"));

  let total = 0;
  if (e1 > s1) total += e1 - s1;
  if (e2 > s2) total += e2 - s2;

  getEl("totalShiftHours").value = total.toFixed(1);
}

function handleDieselLogic() {
  const qty = Number(getValue("dieselQty"));
  const time = getEl("dieselTime");
  const reading = getEl("dieselReading");

  if (qty > 0) {
    time.disabled = false;
    reading.disabled = false;
  } else {
    time.value = "";
    reading.value = "";
    time.disabled = true;
    reading.disabled = true;
  }
}

// ===============================
// FORM SUBMIT
// ===============================

getEl("mainForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const start = Number(getValue("startReading")) || 0;
  const end = Number(getValue("endReading")) || 0;
  const total = end >= start ? end - start : 0;

  let remark = "✅ काम झाले";
  if (!total && !getValue("dieselQty")) {
    remark = "🚫 काम झाले नाही";
  } else if (getValue("dieselQty") == 0) {
    remark = "⚠️ काम झाले पण डिझेल भरले नाही";
  }

  const payload = {
    "दिनांक": getValue("workDate"),
    "कामाचा प्रकार": getValue("workType"),
    "प्रकल्पाचे नाव": getValue("projectName"),
    "सयंत्राचा प्रकार": getValue("machineType"),
    "चालक": getValue("staffName"),
    "मशीन": getValue("machineName"),
    "डिझेल (लिटर)": getValue("dieselQty"),
    "डिझेल वेळ": getValue("dieselTime"),
    "डिझेल reading": getValue("dieselReading"),
    "सुरुवातीचे reading": start,
    "शेवटचे reading": end,
    "Dashboard एकूण (तास/km)": total,
    "या ठिकाणापासून ते त्या ठिकाणापर्यंत": getValue("locationFromTo"),
    "एकूण ट्रिप्स": getValue("tripCount"),
    "शिफ्ट-१ सुरू वेळ": getValue("shift1Start"),
    "शिफ्ट-१ बंद वेळ": getValue("shift1End"),
    "शिफ्ट-२ सुरू वेळ": getValue("shift2Start"),
    "शिफ्ट-२ बंद वेळ": getValue("shift2End"),
    "एकूण तास (shift)": getValue("totalShiftHours"),
    "टीप": remark
  };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });

    const result = await res.json();

    if (result.result === "success") {
      alert("✅ माहिती यशस्वीरित्या जतन झाली!");
      getEl("mainForm").reset();
      getEl("workDate").value =
        new Date().toISOString().split("T")[0];
    } else {
      alert("⚠️ Server error आला.");
    }

  } catch (err) {
    console.error(err);
    alert("❌ नेटवर्क एरर. पुन्हा प्रयत्न करा.");
  }
});

// ===============================
// UTILITIES
// ===============================

function getEl(id) { return document.getElementById(id); }
function getValue(id) { return getEl(id)?.value || ""; }

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
