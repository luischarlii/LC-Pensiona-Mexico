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
      const response = await fetch("./rules/rules.json", { cache: "no-store" });
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
      knownRegime: fd.get("knownRegime")
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
    addLi(missingList, "Fecha de nacimiento, estado de cuenta AFORE y datos de beneficiarios cuando la modalidad los requiera.");
    addLi(missingList, "Confirmación de requisitos y parámetros legales vigentes con la institución.");

    document.getElementById("result-intro").textContent = intro;
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
