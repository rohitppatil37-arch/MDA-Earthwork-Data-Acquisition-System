document.addEventListener("DOMContentLoaded", async () => {
  await loadConfig();
  populateSubdivisions();

  document
    .getElementById("subdivision")
    .addEventListener("change", handleSubdivisionChange);

  document
    .getElementById("workType")
    .addEventListener("change", handleWorkTypeChange);
});

function populateSubdivisions() {
  const select = document.getElementById("subdivision");
  select.innerHTML = `<option value="">उपविभाग निवडा...</option>`;

  CONFIG.subdivisions.forEach(sub => {
    const opt = document.createElement("option");
    opt.value = sub["Subdivision Code"];
    opt.textContent = sub["Subdivision Name"];
    select.appendChild(opt);
  });
}

function handleSubdivisionChange() {
  const subCode = document.getElementById("subdivision").value;

  // Work Type reset
  const workSelect = document.getElementById("workType");
  workSelect.innerHTML = `<option value="">कामाचा प्रकार निवडा...</option>`;

  // Project reset
  document.getElementById("projectName").innerHTML =
    `<option value="">प्रकल्प निवडा...</option>`;

  if (!subCode) return;

  const workTypes = [
    ...new Set(
      CONFIG.projects
        .filter(p => p["Subdivision Code"] === subCode)
        .map(p => p["Work Type"])
    )
  ];

  workTypes.forEach(type => {
    const opt = document.createElement("option");
    opt.value = type;
    opt.textContent = type;
    workSelect.appendChild(opt);
  });
}

function handleWorkTypeChange() {
  const subCode = document.getElementById("subdivision").value;
  const workType = document.getElementById("workType").value;

  const projectSelect = document.getElementById("projectName");
  projectSelect.innerHTML = `<option value="">प्रकल्प निवडा...</option>`;

  if (!subCode || !workType) return;

  const projects = CONFIG.projects.filter(p =>
    p["Subdivision Code"] === subCode &&
    p["Work Type"] === workType
  );

  projects.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p["Project Name"];
    opt.textContent = p["Project Name"];
    projectSelect.appendChild(opt);
  });
}
