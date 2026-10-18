"use strict";

/* ===== CONFIGURAÇÃO ===== */
const WHATSAPP_NUMERO = "5551933002268";
const ENDERECO_MAPA = "Rua Exemplo, 123, Centro, Cidade Fictícia";
const HORARIOS = ["09:30", "11:00", "13:30", "15:00", "16:30", "18:00"];
// Serviços: nome, descrição, duração (min) e preço (R$).
const SERVICOS = [
  {
    id: "classico",
    nome: "Corte clássico",
    desc: "Tesoura e máquina, acabamento na navalha.",
    duracao: 45,
    preco: 50,
  },
  {
    id: "degrade",
    nome: "Corte degradê",
    desc: "Transição suave, do zero ao comprimento desejado.",
    duracao: 50,
    preco: 75,
  },
  {
    id: "barba",
    nome: "Barba",
    desc: "Modelagem, toalha quente e hidratação.",
    duracao: 30,
    preco: 35,
  },
  {
    id: "corte-barba",
    nome: "Corte + barba",
    desc: "Corte de sua escolha com barba completa.",
    duracao: 75,
    preco: 90,
  },
  {
    id: "acabamento",
    nome: "Acabamento",
    desc: "Contornos e pescoço para manter o corte.",
    duracao: 20,
    preco: 20,
  },
  {
    id: "completo",
    nome: "Experiência completa",
    desc: "Corte, barba, toalha quente e finalização.",
    duracao: 90,
    preco: 95,
  },
];

/* ===== Utilidades ===== */
const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => [...raiz.querySelectorAll(sel)];
const reais = (v) => "R$ " + v.toLocaleString("pt-BR");
const achaServico = (id) => SERVICOS.find((s) => s.id === id);
const formataData = (iso) => iso.split("-").reverse().join("/");
function hojeISO() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

/* ===== Header e menu mobile ===== */
const header = $("#header");
const menu = $("#menu");
const menuBtn = $("#menu-btn");

function alternaMenu(abrir) {
  menu.classList.toggle("aberto", abrir);
  menuBtn.setAttribute("aria-expanded", String(abrir));
  menuBtn.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
}
function iniciaHeader() {
  const atualiza = () => header.classList.toggle("solido", window.scrollY > 40);
  window.addEventListener("scroll", atualiza, { passive: true });
  atualiza();
  menuBtn.addEventListener("click", () =>
    alternaMenu(!menu.classList.contains("aberto")),
  );
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) alternaMenu(false);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.classList.contains("aberto")) {
      alternaMenu(false);
      menuBtn.focus();
    }
  });
}

/* ===== Serviços ===== */
function renderServicos() {
  $("#lista-servicos").innerHTML = SERVICOS.map(
    (s) => `
    <li class="servico">
      <h3>${s.nome}</h3>
      <span class="meta">${s.duracao} min</span>
      <span class="preco">${reais(s.preco)}</span>
      <p>${s.desc}</p>
      <button class="btn btn-linha btn-sm" type="button" data-servico="${s.id}" aria-label="Agendar ${s.nome}">Agendar</button>
    </li>`,
  ).join("");
  $("#servico").innerHTML =
    '<option value="">Escolha um serviço</option>' +
    SERVICOS.map(
      (s) =>
        `<option value="${s.id}">${s.nome} — ${s.duracao} min — ${reais(s.preco)}</option>`,
    ).join("");
}
function preSelecionaServico(id) {
  const campo = $("#servico");
  campo.value = id;
  limpaErro("servico");
  $("#agendamento").scrollIntoView({
    behavior: movimentoReduzido() ? "auto" : "smooth",
  });
  setTimeout(() => campo.focus({ preventScroll: true }), 400);
}
const movimentoReduzido = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ===== Galeria e modal ===== */
function iniciaGaleria() {
  const fotos = $$(".foto");
  const filtros = $$(".filtro");
  filtros.forEach((btn) =>
    btn.addEventListener("click", () => {
      filtros.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      fotos.forEach((f) => {
        f.hidden =
          btn.dataset.filtro !== "todos" &&
          f.dataset.cat !== btn.dataset.filtro;
      });
    }),
  );

  const modal = $("#modal");
  const img = $("#modal-img");
  let origem = null;
  fotos.forEach((f) =>
    f.addEventListener("click", () => {
      origem = f;
      img.src = f.querySelector("img").currentSrc || f.querySelector("img").src;
      img.alt = f.dataset.alt;
      modal.showModal();
    }),
  );
  $("#modal-fechar").addEventListener("click", () => modal.close());
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.close();
  }); // clique fora
  modal.addEventListener("close", () => origem && origem.focus()); // Esc fecha nativamente
}

/* ===== Agendamento ===== */
function renderHorarios() {
  $("#slots").innerHTML = HORARIOS.map(
    (h, i) =>
      `<label><input type="radio" name="horario" value="${h}" ${i === 0 ? "" : ""}><span>${h}</span></label>`,
  ).join("");
}
function mostraErro(campo, msg) {
  const p = $("#erro-" + campo);
  p.textContent = msg;
  const input = $("#" + campo);
  if (input) input.setAttribute("aria-invalid", "true");
}
function limpaErro(campo) {
  $("#erro-" + campo).textContent = "";
  const input = $("#" + campo);
  if (input) input.removeAttribute("aria-invalid");
}
function lerForm() {
  const f = $("#form-agenda");
  const h = f.querySelector('input[name="horario"]:checked');
  return {
    servico: f.servico.value,
    data: f.data.value,
    horario: h ? h.value : "",
    nome: f.nome.value.trim(),
  };
}
function valida(d) {
  ["servico", "data", "horario", "nome"].forEach(limpaErro);
  const erros = [];
  if (!d.servico) erros.push(["servico", "Escolha um serviço."]);
  if (!d.data) erros.push(["data", "Escolha uma data."]);
  else if (d.data < hojeISO())
    erros.push(["data", "A data não pode ser anterior a hoje."]);
  if (!d.horario) erros.push(["horario", "Escolha um horário."]);
  if (d.nome.length < 2) erros.push(["nome", "Informe seu nome."]);
  erros.forEach(([c, m]) => mostraErro(c, m));
  if (erros.length) {
    const primeiro = erros[0][0];
    (primeiro === "horario"
      ? $('input[name="horario"]')
      : $("#" + primeiro)
    ).focus();
  }
  return erros.length === 0;
}
function mostraResumo(d) {
  const s = achaServico(d.servico);
  const box = $("#resumo");
  box.innerHTML = `
    <h4>Solicitação preparada</h4>
    <dl>
      <dt>Nome</dt><dd>${d.nome.replace(/</g, "&lt;")}</dd>
      <dt>Serviço</dt><dd>${s.nome} (${s.duracao} min)</dd>
      <dt>Data</dt><dd>${formataData(d.data)}</dd>
      <dt>Horário</dt><dd>${d.horario} (ilustrativo)</dd>
      <dt>Valor</dt><dd>${reais(s.preco)}</dd>
    </dl>
    <p>Este é um site demonstrativo: nenhuma reserva foi registrada e nenhum dado foi enviado. Em um estúdio real, o horário ainda precisaria ser confirmado.</p>`;
  box.hidden = false;
  box.focus();
}
function iniciaFormulario() {
  const form = $("#form-agenda");
  $("#data").min = hojeISO();
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = lerForm();
    if (valida(d)) mostraResumo(d);
    else $("#resumo").hidden = true;
  });
  ["servico", "data", "nome"].forEach((c) =>
    $("#" + c).addEventListener("input", () => limpaErro(c)),
  );
  $("#slots").addEventListener("change", () => limpaErro("horario"));
}

/* ===== WhatsApp ===== */
function montaMensagem() {
  const d = lerForm();
  const s = achaServico(d.servico);
  let msg =
    "Olá! Gostaria de agendar" +
    (s ? ` ${s.nome}` : " um horário") +
    " na NOIR Barber Studio.";
  if (d.data) msg += ` Data: ${formataData(d.data)}.`;
  if (d.horario) msg += ` Horário: ${d.horario}.`;
  if (d.nome) msg += ` Nome: ${d.nome}.`;
  return msg;
}
function iniciaWhatsApp() {
  const aviso = $("#aviso-whats");
  $("#btn-whats").addEventListener("click", () => {
    if (!/^\d{10,15}$/.test(WHATSAPP_NUMERO)) {
      return;
    }
    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(montaMensagem())}`;
    aviso.textContent = "Abrindo o WhatsApp. Revise e envie a mensagem por lá.";
    window.open(url, "_blank", "noopener");
  });
}

/* ===== Início ===== */
function trocaExtensao(img) {
  if (img.dataset.tentou) {
    img.classList.add("sem-imagem");
    return;
  }
  img.dataset.tentou = "1";
  const src = img.getAttribute("src");
  if (/\.jpe?g$/i.test(src))
    img.src = src.replace(/\.jpe?g$/i, /\.jpeg$/i.test(src) ? ".jpg" : ".jpeg");
  else img.classList.add("sem-imagem");
}
function iniciaImagens() {
  $$("img").forEach((img) => {
    img.addEventListener("error", () => trocaExtensao(img));
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src"))
      trocaExtensao(img);
  });
}
document.addEventListener("DOMContentLoaded", () => {
  $("#ano").textContent = new Date().getFullYear();
  $("#btn-mapa").href =
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(ENDERECO_MAPA);
  renderServicos();
  renderHorarios();
  iniciaHeader();
  iniciaGaleria();
  iniciaFormulario();
  iniciaWhatsApp();
  iniciaImagens();
  $("#lista-servicos").addEventListener("click", (e) => {
    const b = e.target.closest("[data-servico]");
    if (b) preSelecionaServico(b.dataset.servico);
  });
});
