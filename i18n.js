const HD_LANG_KEY = "helpdebs_language";

const translations = {
  en: {
    "Portal da aluna": "Student Portal",
    "Entre com o e-mail e senha cadastrados para ver seus materiais, aulas e próximos passos.": "Log in with your registered email and password to access your materials, classes and next steps.",
    "Entrar": "Login",
    "Ver materiais": "View materials",
    "Entrar na aula ao vivo": "Join live class",
    "Início": "Home",
    "Diagnóstico": "Assessment",
    "Trilha": "Journey",
    "Materiais": "Materials",
    "Calendário": "Calendar",
    "Aula ao vivo": "Live class",
    "Dicas": "Tips",
    "Videoaulas": "Video lessons",
    "Financeiro": "Payments",
    "Seu próximo passo": "Your next step",
    "Continue seu diagnóstico": "Continue your assessment",
    "Continuar agora": "Continue now",
    "Leva poucos minutos.": "Takes only a few minutes.",
    "Próxima aula": "Next class",
    "Mini feedback": "Mini feedback",
    "Visão geral": "Overview",
    "Acesso rápido": "Quick access",
    "Status financeiro": "Financial status",
    "Progresso do diagnóstico": "Assessment progress",
    "Começar": "Start",
    "começar diagnóstico": "start assessment",
    "trilha bloqueada": "journey locked",
    "trilha liberada": "journey unlocked",
    "Nenhuma aula marcada": "No scheduled classes",
    "Quando houver uma aula futura cadastrada, ela aparece aqui.": "When a future class is scheduled, it will appear here.",
    "Observação da professora": "Teacher's note",
    "Assim que sua professora registrar um feedback no admin, ele aparece aqui.": "As soon as your teacher registers feedback in the admin panel, it will appear here.",
    "Nenhum feedback registrado ainda": "No feedback registered yet",
    "Materiais disponíveis": "Available materials",
    "Diagnósticos pendentes": "Pending assessments",
    "Status da trilha": "Journey status",
    "sem cobrança ativa": "no active charges",
    "Nenhum pagamento cadastrado ainda.": "No payment registered yet.",
    "Sem pendências": "No pending payments",
    "Pix": "Pix",
    "Fazer teste": "Take test",
    "Fazer nivelamento": "Take placement test",
    "Responder interesses": "Answer interests survey",
    "Concluído ✓": "Completed ✓",
    "pendente": "pending",
    "concluído": "completed",
    "Abrir material": "Open material",
    "Resumo da aula": "Class summary",
    "Chunks usados": "Chunks used",
    "Nenhuma dica cadastrada ainda.": "No tips available yet.",
    "Nenhuma videoaula cadastrada ainda.": "No video lessons available yet.",
    "Nenhum pagamento cadastrado ainda.": "No payments registered yet.",
    "Abrir sala": "Open room",
    "Ver calendário": "View calendar"
  }
};

function getSavedLanguage() {
  return localStorage.getItem(HD_LANG_KEY) || "pt";
}

function setLanguage(lang) {
  localStorage.setItem(HD_LANG_KEY, lang);
  applyLanguage(lang);
}

function toggleLanguage() {
  const current = getSavedLanguage();
  setLanguage(current === "en" ? "pt" : "en");
}

function replaceText(node, lang) {
  if (!node || node.nodeType !== 3) return;

  const original = node.textContent.trim();

  if (!original) return;

  if (lang === "en" && translations.en[original]) {
    node.textContent = node.textContent.replace(original, translations.en[original]);
  }

  if (lang === "pt") {
    Object.entries(translations.en).forEach(([pt, en]) => {
      if (node.textContent.includes(en)) {
        node.textContent = node.textContent.replace(en, pt);
      }
    });
  }
}

function walk(node, lang) {
  node.childNodes.forEach(child => {
    if (child.nodeType === 3) {
      replaceText(child, lang);
    } else {
      walk(child, lang);
    }
  });
}

function applyLanguage(lang) {
  document.documentElement.lang = lang === "en" ? "en" : "pt-BR";

  walk(document.body, lang);

  document.querySelectorAll(".hd-lang-toggle").forEach(btn => {
    btn.textContent = lang === "en"
      ? "Português ON"
      : "English ON";
  });

  document.querySelectorAll("input").forEach(input => {
    if (lang === "en") {
      if (input.placeholder === "Senha") input.placeholder = "Password";
      if (input.placeholder === "Email") input.placeholder = "Email";
    } else {
      if (input.placeholder === "Password") input.placeholder = "Senha";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  applyLanguage(getSavedLanguage());

  document.querySelectorAll(".hd-lang-toggle").forEach(btn => {
    btn.addEventListener("click", toggleLanguage);
  });
}); 
