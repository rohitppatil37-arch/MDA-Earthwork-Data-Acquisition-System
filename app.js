// ===============================
// INIT
// ===============================

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadConfig();
    populateSubdivisions();

    getEl("workDate").value =
      new Date().toISOString().split("T")[0];

    handleDieselLogic();

  } catch (err) {
    console.error(err);
    alert("⚠️ Configuration load करण्यात त्रुटी आली.");
  }

  getEl("subdivision")?.addEventListener("change", handleSubdivisionChange);
  getEl("workType")?.addEventListener("change", handleWorkTypeChange);
  getEl("machineType")?.addEventListener("change", handleMachineTypeChange);

  // ✅ IMPORTANT — move inside
  getEl("machineName")?.addEventListener("change", () => {
    const subCode = getValue("subdivision");
    const machineType = getValue("machineType");
    toggleFormFields(machineType, subCode);
  });

  getEl("startReading")?.addEventListener("input", calculateTotalReading);
  getEl("endReading")?.addEventListener("input", calculateTotalReading);

  getEl("shift1Start")?.addEventListener("input", calculateShiftHours);
  getEl("shift1End")?.addEventListener("input", calculateShiftHours);
  getEl("shift2Start")?.addEventListener("input", calculateShiftHours);
  getEl("shift2End")?.addEventListener("input", calculateShiftHours);

  getEl("dieselQty")?.addEventListener("input", handleDieselLogic);

  getEl("mainForm")?.addEventListener("submit", handleSubmit);
});
// ===============================
// SUBDIVISION
// ===============================

function populateSubdivisions() {

  if (!CONFIG || !CONFIG.subdivisions) return;

  const select = getEl("subdivision");
  if (!select) return;

  resetSelect(select, "उपविभाग निवडा...");

  CONFIG.subdivisions.forEach(sub => {
    addOption(select, sub["Subdivision Code"], sub["Subdivision Name"]);
  });
}

function handleSubdivisionChange() {

  if (!CONFIG || !CONFIG.projects) return;

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

  if (!CONFIG || !CONFIG.projects) return;

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

  if (!CONFIG || !CONFIG.machines) return;

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

  if (!CONFIG || !CONFIG.machines) return;

  const subCode = getValue("subdivision");
  const machineType = getValue("machineType");

  // 🔥 Always hide vehicle section first
  if (getEl("vehicleSection"))
    getEl("vehicleSection").style.display = "none";

  resetSelect(getEl("machineName"), "मशीन निवडा...");
  resetSelect(getEl("staffName"), "चालक / ऑपरेटर निवडा...");

  if (!subCode || !machineType) return;

  const machines = CONFIG.machines.filter(m =>
    m["Subdivision Code"] === subCode &&
    m["Machine Type"] === machineType
  );

  machines.forEach(m =>
    addOption(getEl("machineName"), m["Machine Name"], m["Machine Name"])
  );

  populateStaff(subCode, machineType);
  toggleFormFields(machineType, subCode);
}

function toggleFormFields(machineType, subCode) {

  const vehicleSection = getEl("vehicleSection");
  if (!vehicleSection || !CONFIG?.machines) return;

  const selectedMachine = getValue("machineName");

  // If machine not selected yet
  if (!selectedMachine) {
    vehicleSection.style.display = "none";
    getEl("tripCount").required = false;
    getEl("locationFromTo").required = false;
    return;
  }

  const machineData = CONFIG.machines.find(m =>
    m["Subdivision Code"]?.trim() === subCode?.trim() &&
    m["Machine Name"]?.trim() === selectedMachine?.trim()
  );

  if (!machineData) {
    vehicleSection.style.display = "none";
    return;
  }

  const isVehicle = machineData.Category?.trim() === "Vehicle";

  if (isVehicle) {
    vehicleSection.style.display = "block";
    getEl("tripCount").required = true;
    getEl("locationFromTo").required = true;
  } else {
    vehicleSection.style.display = "none";
    getEl("tripCount").required = false;
    getEl("locationFromTo").required = false;
    getEl("tripCount").value = "";
    getEl("locationFromTo").value = "";
  }
}

function populateStaff(subCode, machineType) {

  if (!CONFIG || !CONFIG.staff) return;

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

  if (getEl("machineSection"))
    getEl("machineSection").style.display = "block";

  if (getEl("vehicleSection"))
    getEl("vehicleSection").style.display = "none";
}

// ===============================
// CALCULATIONS
// ===============================

function calculateTotalReading() {
  const start = Number(getValue("startReading")) || 0;
  const end = Number(getValue("endReading")) || 0;

  if (end >= start && getEl("totalHoursReading")) {
    getEl("totalHoursReading").value =
      (end - start).toFixed(1);
  }
}

function calculateShiftHours() {
  function toHours(t) {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h + m / 60;
  }

  const total =
    Math.max(0, toHours(getValue("shift1End")) - toHours(getValue("shift1Start"))) +
    Math.max(0, toHours(getValue("shift2End")) - toHours(getValue("shift2Start")));

  if (getEl("totalShiftHours"))
    getEl("totalShiftHours").value = total.toFixed(1);
}

function handleDieselLogic() {
  const qty = Number(getValue("dieselQty")) || 0;
  const time = getEl("dieselTime");
  const reading = getEl("dieselReading");

  if (!time || !reading) return;

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

async function handleSubmit(e) {

  e.preventDefault();

  const btn = document.querySelector("button[type='submit']");
  btn.disabled = true;
  btn.textContent = "Saving...";

  const start = Number(getValue("startReading")) || 0;
  const end = Number(getValue("endReading")) || 0;

  if (end < start) {
    alert("❌ शेवटचे reading सुरुवातीपेक्षा कमी असू शकत नाही.");
    btn.disabled = false;
btn.innerHTML = "✅ माहिती जतन करा";
    return;
  }

  const total = end - start;
  const diesel = Number(getValue("dieselQty")) || 0;

  let remark = "✅ काम झाले";

  if (total === 0 && diesel === 0) {
    remark = "🚫 काम झाले नाही";
  } else if (total > 0 && diesel === 0) {
    remark = "⚠️ काम झाले पण डिझेल भरले नाही";
  }
 if (!subCode || !getValue("workType") || !getValue("projectName") ||
    !getValue("machineType") || !getValue("machineName") ||
    !getValue("staffName")) {

  alert("❌ कृपया सर्व आवश्यक माहिती भरा.");
  btn.disabled = false;
  btn.innerHTML = "✅ माहिती जतन करा";
  return;
} 
if (getEl("vehicleSection")?.style.display === "block") {
  if (!getValue("tripCount") || !getValue("locationFromTo")) {
    alert("❌ वाहनासाठी ट्रिप्स व स्थान माहिती आवश्यक आहे.");
    btn.disabled = false;
btn.innerHTML = "✅ माहिती जतन करा";
    return;
  }
}
  // ✅ इथे घ्यायचे subdivision variables
  const subSelect = getEl("subdivision");
  const subCode = subSelect?.value || "";
  const subName = subSelect?.options[subSelect.selectedIndex]?.text || "";

  // ✅ आता payload तयार करायचा
  const payload = {
    "उपविभाग कोड": subCode,
    "उपविभाग": subName,
    "दिनांक": getValue("workDate"),
    "कामाचा प्रकार": getValue("workType"),
    "प्रकल्पाचे नाव": getValue("projectName"),
    "सयंत्राचा प्रकार": getValue("machineType"),
    "चालक": getValue("staffName"),
    "मशीन": getValue("machineName"),
    "डिझेल (लिटर)": diesel,
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
      resetMachineSection();
      getEl("workDate").value =
        new Date().toISOString().split("T")[0];
      handleDieselLogic();
    } else {
      alert("⚠️ Server error आला.");
    }

  } catch (err) {
    console.error(err);
    alert("❌ नेटवर्क एरर. पुन्हा प्रयत्न करा.");
  }

  btn.disabled = false;
btn.innerHTML = "✅ माहिती जतन करा";
}

// ===============================
// UTILITIES
// ===============================

function getEl(id) { return document.getElementById(id); }
function getValue(id) { return getEl(id)?.value || ""; }

function resetSelect(selectElement, placeholder) {
  if (!selectElement) return;
  selectElement.innerHTML = "";
  addOption(selectElement, "", placeholder);
}

function addOption(selectElement, value, text) {
  if (!selectElement) return;
  const opt = document.createElement("option");
  opt.value = value;
  opt.textContent = text;
  selectElement.appendChild(opt);
}

function unique(arr) {
  return [...new Set(arr)];
}
