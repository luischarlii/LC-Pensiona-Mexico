(() => {
  "use strict";
  const form = document.getElementById("pension-form");
  const steps = [...document.querySelectorAll(".step")];
  const progress = document.getElementById("progress-fill");
  const stepCount = document.getElementById("step-count");
  const results = document.getElementById("results");
  let currentStep = 1;
  let lastReport = null;

  async function loadRules() {
    try {
      const response = await fetch("./rules.json", { cache: "no-store" });
      if (!response.ok) throw new Error("No se pudo leer rules.json");
      return await response.json();
    } catch (error) {
      return { version: "no-disponible", options: [], sources: [] };
    }
  }
  function showStep(n) {
    currentStep = n;
    steps.forEach(el => el.classList.toggle("active", Number(el.dataset.step) === n));
    stepCount.textContent = `Paso ${n} de ${steps.length}`;
    progress.style.width = `${n / steps.length * 100}%`;
    document.getElementById("form-title").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function validateStep(n) {
    const step = steps[n - 1];
    const required = [...step.querySelectorAll("[required]")];
for (const el of required) {
  if (!el.checkValidity()) { el.reportValidity(); return false; }
}
    const age = document.getElementById("age");
    if (n === 1 && age.value && (+age.value < 18 || +age.value > 110)) {
      age.setCustomValidity("Introduce una edad entre 18 y 110 años."); age.reportValidity(); age.setCustomValidity(""); return false;
    }
    return true;
  }
  document.querySelectorAll(".next").forEach(btn => btn.addEventListener("click", () => {
    if (validateStep(currentStep)) showStep(Math.min(steps.length, currentStep + 1));
  }));
  document.querySelectorAll(".back").forEach(btn => btn.addEventListener("click", () => showStep(Math.max(1, currentStep - 1))));
  document.getElementById("age").addEventListener("input", e => e.target.setCustomValidity(""));

  function collect() {
    const fd = new FormData(form);
    return {
      institution: fd.get("institution"),
      firstContribution: fd.get("firstContribution") || null,
      age: Number(fd.get("age")),
      weeks: fd.get("weeks") === "" ? null : Number(fd.get("weeks")),
      isssteYears: fd.get("isssteYears") === "" ? null : Number(fd.get("isssteYears")),
      workStatus: fd.get("workStatus"),
      salary: fd.get("salary") === "" ? null : Number(fd.get("salary")),
      priority: fd.get("priority"),
      
      budget: fd.get("budget") === "" ? null : Number(fd.get("budget")),
      knownRegime: fd.get("knownRegime"),
      imssTerminationDate: fd.get("imssTerminationDate") || null,
      averageSBC: fd.get("averageSBC") === "" || fd.get("averageSBC") === null
        ? null : Number(fd.get("averageSBC")),
      beneficiaries: fd.get("beneficiaries") || "unknown",
      aforeBalance: fd.get("aforeBalance") === "" || fd.get("aforeBalance") === null
        ? null : Number(fd.get("aforeBalance")),
      desiredRetirementAge: fd.get("desiredRetirementAge") === "" || fd.get("desiredRetirementAge") === null
        ? null : Number(fd.get("desiredRetirementAge")),
      desiredRetirementDate: fd.get("desiredRetirementDate") || null

    };
  }
  function dateBefore1997(date) { return Boolean(date && new Date(`${date}T00:00:00`) < new Date("1997-07-01T00:00:00")); }
  function addOption(list, title, status, body) {
    const el = document.createElement("article"); el.className = "option-card";
    const tag = document.createElement("span"); tag.className = "status"; tag.textContent = status;
    const h = document.createElement("h3"); h.textContent = title;
    const p = document.createElement("p"); p.textContent = body;
    el.append(tag, h, p); list.appendChild(el);
  }
  function addLi(list, text) { const li = document.createElement("li"); li.textContent = text; list.appendChild(li); }

  function validateAdditionalData(data) {
    const issues = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = (value, label) => {
      if (!value) return;

      const date = new Date(`${value}T00:00:00`);

      if (Number.isNaN(date.getTime())) {
        issues.push(`${label}: la fecha no es válida.`);
      } else if (date > today) {
        issues.push(`${label}: la fecha está en el futuro; verifica el dato.`);
      }
    };

    checkDate(data.imssTerminationDate, "Fecha de baja del IMSS");
    checkDate(data.desiredRetirementDate, "Fecha deseada de retiro");

    if (data.averageSBC !== null && data.averageSBC <= 0) {
      issues.push("Salario base promedio diario: debe ser mayor que cero.");
    }

    if (data.aforeBalance !== null && data.aforeBalance < 0) {
      issues.push("Saldo AFORE: no puede ser negativo.");
    }

    if (
      data.desiredRetirementAge !== null &&
      (data.desiredRetirementAge < 18 || data.desiredRetirementAge > 110)
    ) {
      issues.push("Edad deseada de retiro: verifica que esté entre 18 y 110 años.");
    }

    if (
      data.imssTerminationDate &&
      data.desiredRetirementDate &&
      data.desiredRetirementDate < data.imssTerminationDate
    ) {
      issues.push("La fecha deseada de retiro es anterior a la fecha de baja del IMSS; verifica ambas fechas.");
    }

    return issues;
  }

  async function analyze(data) {
    const rules = await loadRules();
    const optionList = document.getElementById("option-list");
    const missingList = document.getElementById("missing-list");
    optionList.replaceChildren(); missingList.replaceChildren();
    const candidates = [];
    let intro = "Con tus respuestas podemos organizar qué vías revisar. Esto no confirma elegibilidad ni calcula un monto.";
    const oldIMSS = data.institution === "imss" || data.institution === "both";
    if (oldIMSS && data.firstContribution) {
      if (dateBefore1997(data.firstContribution)) {
        candidates.push(["IMSS · régimen anterior (Ley 1973)", "Revisar primero", "La fecha indicada es anterior al 1 de julio de 1997. Confirma en tu constancia oficial que el IMSS reconoce esa primera cotización y revisa edad, semanas y conservación de derechos."]);
        candidates.push(["IMSS · cuenta individual (Ley 1997)", "Comparación pendiente", "La fecha por sí sola no basta para determinar el derecho. La institución debe confirmar el régimen aplicable y los datos de tu expediente."]);
      } else {
        candidates.push(["IMSS · cuenta individual (Ley 1997)", "Revisar primero", "La fecha indicada es el 1 de julio de 1997 o posterior. Confirma la fecha reconocida por el IMSS, las semanas exigibles en el año de solicitud y tu situación AFORE."]);
      }
    } else if (oldIMSS) {
      candidates.push(["IMSS · régimen por confirmar", "Falta información", "Necesitamos la fecha de primera cotización reconocida por el IMSS para orientar la revisión del régimen."]);
    }
    if (data.institution === "issste" || data.institution === "both") {
      candidates.push(["ISSSTE · régimen por confirmar", "Verificación necesaria", "Solicita o consulta la constancia del régimen pensionario: Décimo Transitorio o Cuenta Individual. Edad y años de servicio no bastan por sí solos para concluir cuál aplica."]);
    }
    if (data.institution === "other" || data.institution === "unknown") {
      candidates.push(["Identificar institución y régimen", "Primer paso", "Localiza tu constancia de afiliación o estado de cuenta y confirma la ley o régimen que administra tus aportaciones."]);
    }
    if (data.workStatus === "inactive" && oldIMSS) {
      candidates.push(["Continuación voluntaria / Modalidad 40", "Solo si cumple requisitos", "No se puede concluir elegibilidad ni costo con estos datos. Deben revisarse semanas previas, fecha de baja, plazo transcurrido, régimen y salario base permitido con la información y reglas vigentes."]);
    }
    if (data.workStatus === "independent") {
      candidates.push(["Aseguramiento para trabajo independiente", "Revisar cobertura", "Verifica con el IMSS qué esquema de incorporación corresponde a tu actividad y qué derechos genera; no equivale automáticamente a una pensión específica."]);
    }
    if (!candidates.length) candidates.push(["Diagnóstico institucional", "Falta información", "Selecciona la institución donde cotizaste para recibir una orientación más específica."]);
    candidates.forEach(item => addOption(optionList, ...item));

    addLi(missingList, "Constancia oficial de semanas cotizadas o años de servicio reconocidos.");
    if (oldIMSS) addLi(missingList, "Fecha de primera cotización y régimen confirmado por el IMSS; si hubo baja, fecha exacta de baja.");
    if (oldIMSS && data.weeks === null) addLi(missingList, "Número de semanas reconocidas por el IMSS.");
    if (data.institution === "issste" || data.institution === "both") addLi(missingList, "Documento que identifique el régimen ISSSTE y el saldo o datos pensionarios disponibles.");
    if (data.salary === null) addLi(missingList, "Salario base de cotización o historial salarial oficial (si el cálculo lo requiere).");
    addLi(missingList, "Fecha de nacimiento, estado de cuenta AFORE y datos de beneficiarios cuando la modalidad los caprequiera.");
    addLi(missingList, "Confirmación de requisitos y parámetros legales vigentes con la institución.");

    document.getElementById("result-intro").textContent = intro;
        let capturedData = document.getElementById("captured-data");

    if (!capturedData) {
      capturedData = document.createElement("section");
      capturedData.id = "captured-data";
      capturedData.className = "result-card";
      document.getElementById("result-intro").after(capturedData);
    }

    const displayValue = value =>
      value === null || value === undefined || value === ""
        ? "No indicado"
        : value;

    const beneficiaryNames = {
      unknown: "No indicado",
      none: "Sin beneficiarios indicados",
      spouse: "Cónyuge",
      children: "Hijos",
      parents: "Padres",
      multiple: "Varios beneficiarios"
    };

    const fields = [
      ["Fecha de baja del IMSS", data.imssTerminationDate],
      ["Salario base promedio diario (SBC)", data.averageSBC === null ? null : "$" + data.averageSBC + " MXN diarios"],
      ["Beneficiarios", beneficiaryNames[data.beneficiaries] || "No indicado"],
      ["Saldo AFORE", data.aforeBalance === null ? null : "$" + data.aforeBalance + " MXN"],
      ["Edad deseada de retiro", data.desiredRetirementAge === null ? null : data.desiredRetirementAge + " años"],
      ["Fecha deseada de retiro", data.desiredRetirementDate]
    ];

    capturedData.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = "Datos capturados";
    capturedData.appendChild(heading);

    const list = document.createElement("ul");

    fields.forEach(([label, value]) => {
      const item = document.createElement("li");
      item.textContent = label + ": " + displayValue(value);
      list.appendChild(item);
    });

    
    capturedData.appendChild(list);

    const validationIssues = validateAdditionalData(data);
    let validationBox = document.getElementById("validation-issues");

    if (!validationBox) {
      validationBox = document.createElement("section");
      validationBox.id = "validation-issues";
      validationBox.className = "result-card";
      capturedData.after(validationBox);
    }

    validationBox.replaceChildren();

    const validationHeading = document.createElement("h3");
    validationHeading.textContent = validationIssues.length
      ? "Datos que conviene revisar"
      : "Revisión básica de datos";
    validationBox.appendChild(validationHeading);

    if (validationIssues.length) {
      const issueList = document.createElement("ul");

      validationIssues.forEach(message => {
        addLi(issueList, message);
      });

      validationBox.appendChild(issueList);
    } else {
      const validationMessage = document.createElement("p");
      validationMessage.textContent =
        "No se detectaron inconsistencias básicas en las fechas y cantidades revisadas. Esto no confirma la elegibilidad ni la exactitud de los datos.";
      validationBox.appendChild(validationMessage);
    }

    results.classList.remove("hidden");

    lastReport = {
      app: "LC Pensiona México",
      version: "0.1.0",
      generatedAt: new Date().toLocaleString("es-MX"),
      rulesVersion: rules.version || "no-disponible",
      input: data,
      options: candidates,
      missingData: [...missingList.querySelectorAll("li")].map(x => x.textContent),
      disclaimer: "Orientación preliminar. No es resolución, dictamen ni cálculo oficial de pensión. No se calculó un monto."
    };
    results.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!validateStep(3)) return;
    await analyze(collect());
  });
  document.getElementById("download-report").addEventListener("click", () => {
    if (!lastReport) return;
    const lines = [
      "LC Pensiona México — Reporte orientativo",
      `Generado: ${lastReport.generatedAt}`,
      `Versión de reglas: ${lastReport.rulesVersion}`,
      "",
      "DATOS CAPTURADOS",
      ...Object.entries(lastReport.input).map(([k,v]) => `${k}: ${v === null ? "No indicado" : v}`),
      "",
      "OPCIONES A REVISAR",
      ...lastReport.options.map(o => `- ${o[0]} [${o[1]}]: ${o[2]}`),
      "",
      "DATOS PENDIENTES",
      ...lastReport.missingData.map(x => `- ${x}`),
      "",
      lastReport.disclaimer
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "LC-Pensiona-Mexico-reporte.txt"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  document.getElementById("start-over").addEventListener("click", () => {
    form.reset(); results.classList.add("hidden"); lastReport = null; showStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
  }
})();
