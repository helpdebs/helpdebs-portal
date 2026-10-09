/* =========================================================
   help.debs · Admin — Jogo de revisão (pacotes e atividades)
   Depende de globais do admin.html: sb, STUDENTS, MATERIALS, $, esc, toast, showMsg, isPortalConfigMaterial
   ========================================================= */
(function(){
const TIPOS = ["multiple_choice","fill_blank","match","unscramble","true_false","translate_pt_en","spot_the_mistake","sounds_natural"];
const TIPO_LABEL = {multiple_choice:"Multiple choice",fill_blank:"Fill in the blank",match:"Match",unscramble:"Unscramble",true_false:"True or false",translate_pt_en:"Translate PT→EN",spot_the_mistake:"Spot the mistake",sounds_natural:"Sounds natural"};
const SECOES = [
  {key:"vocabulario", label:"Vocabulário", prefix:"v", fields:[["termo","Termo"],["significado_en","Meaning (EN)"],["traducao_pt","Tradução"],["exemplo","Exemplo"]]},
  {key:"estruturas",  label:"Estruturas",  prefix:"s", fields:[["nome","Estrutura"],["regra_curta","Regra curta"],["erro_comum","Erro comum"]]},
  {key:"expressoes",  label:"Expressões / chunks", prefix:"x", fields:[["expressao","Expressão"],["uso","Uso"],["registro","Registro"],["exemplo","Exemplo"]]}
];
const GM = { packs:[], current:null, activities:[] };
const studentName = id => { const s=(typeof STUDENTS!=="undefined"?STUDENTS:[]).find(x=>x.id===id); return s?.full_name||s?.email||"—"; };
const studentLevel = id => { const s=(typeof STUDENTS!=="undefined"?STUDENTS:[]).find(x=>x.id===id); return s?.nivel||s?.level||"B1"; };

/* ---------- layout ---------- */
function injectUI(){
  if($("page-game")) return;
  const navRef = document.querySelector('.nav[data-page="content"]');
  const nav = document.createElement("button");
  nav.className="nav"; nav.dataset.page="game"; nav.setAttribute("aria-label","Jogo de revisão");
  nav.innerHTML=`<span class="nav-icon">🎮</span><span class="nav-label">Jogo de revisão</span>`;
  nav.addEventListener("click",()=>showPage("game",nav));
  navRef.after(nav);

  const css = document.createElement("style");
  css.textContent=`
  .gm-mat{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--line);border-radius:14px;background:var(--panel2);margin-bottom:8px}
  .gm-mat b{display:block}
  .gm-st{font-size:.72rem;font-weight:900;text-transform:uppercase;letter-spacing:.08em;padding:3px 9px;border-radius:999px;white-space:nowrap}
  .gm-st.none{background:rgba(117,107,145,.12);color:var(--muted)}
  .gm-st.draft{background:rgba(55,189,248,.14);color:#1679a8}
  .gm-st.published{background:rgba(21,168,120,.14);color:var(--success)}
  .gm-step{border:1px solid var(--line);border-radius:16px;padding:16px;margin-top:14px;background:var(--panel2)}
  .gm-step h4{margin:0 0 6px}
  .gm-sec{margin-top:14px}
  .gm-sec-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}
  .gm-item{display:grid;grid-template-columns:28px 1fr 28px;gap:8px;align-items:start;padding:8px 0;border-top:1px solid var(--line)}
  .gm-item .gm-fields{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px}
  .gm-item input{font-size:.85rem;padding:7px 9px}
  .gm-ico{border:none;background:none;cursor:pointer;font-size:1.1rem;line-height:1;padding:6px 0;opacity:.35}
  .gm-ico.on{opacity:1}
  .gm-ico:hover{opacity:1}
  .gm-act{padding:8px 0;border-top:1px solid var(--line);display:flex;gap:10px;align-items:flex-start;font-size:.88rem}
  .gm-act .tag{flex-shrink:0}
  .gm-act p{margin:0;flex:1}
  .gm-counts{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
  .gm-json{font-family:ui-monospace,Menlo,monospace;font-size:.78rem;min-height:120px}
  `;
  document.head.appendChild(css);

  const sec = document.createElement("section");
  sec.id="page-game"; sec.className="page";
  sec.innerHTML=`
  <div class="page-head"><div><h2>Jogo de revisão</h2><p class="hint">Transforme os materiais das aulas em pacotes de jogo. Nada aparece para a aluna antes de você publicar.</p></div></div>
  <div class="grid-2">
    <div class="card">
      <div class="card-title">Materiais da aluna</div>
      <div class="field"><label>Aluna</label><select id="gmStudent"></select></div>
      <div id="gmMaterials"><div class="empty">Escolha uma aluna.</div></div>
    </div>
    <div class="card" id="gmEditor"><div class="empty">Escolha um material e clique em <b>Montar jogo</b>.</div></div>
  </div>`;
  $("page-content").after(sec);
  $("gmStudent").addEventListener("change",renderMaterialsList);

  const orig = window.showPage;
  window.showPage = function(name,btn){ orig(name,btn); if(name==="game") openGamePage(); };
}

async function openGamePage(){
  const sel=$("gmStudent"), keep=sel.value;
  sel.innerHTML=`<option value="">Selecione</option>`+(typeof STUDENTS!=="undefined"?STUDENTS:[]).filter(s=>s.role!=="admin").map(s=>`<option value="${esc(s.id)}">${esc(s.full_name||s.email)}</option>`).join("");
  sel.value=keep;
  await loadPacks();
  renderMaterialsList();
}

async function loadPacks(){
  const {data,error}=await sb.from("game_packs").select("*").order("created_at",{ascending:false});
  if(error){ $("gmMaterials").innerHTML=`<div class="empty">Não consegui ler <b>game_packs</b>. Rode o arquivo <b>sql/jogo_schema.sql</b> no SQL Editor do Supabase.<br><small>${esc(error.message)}</small></div>`; GM.packs=null; return; }
  GM.packs=data||[];
}

function renderMaterialsList(){
  if(GM.packs===null) return;
  const sid=$("gmStudent").value, el=$("gmMaterials");
  if(!sid){ el.innerHTML=`<div class="empty">Escolha uma aluna.</div>`; return; }
  const mats=(typeof MATERIALS!=="undefined"?MATERIALS:[]).filter(m=>m.student_id===sid && !(typeof isPortalConfigMaterial==="function"&&isPortalConfigMaterial(m)));
  const loose=GM.packs.filter(p=>p.student_id===sid && !p.material_id);
  if(!mats.length && !loose.length){ el.innerHTML=`<div class="empty">Nenhum material para esta aluna.</div>`; return; }
  el.innerHTML = mats.map(m=>{
    const p=GM.packs.find(x=>x.material_id===String(m.id));
    const st=p?p.status:"none", lbl={none:"sem jogo",draft:"rascunho",published:"publicado"}[st];
    return `<div class="gm-mat"><div><b>${esc(m.title)}</b><span class="hint">${esc(m.type||"")}${m.month?" • "+esc(m.month):""}</span></div>
      <div class="btn-row" style="align-items:center"><span class="gm-st ${st}">${lbl}</span>
      <button class="btn-secondary" onclick="gmOpen('${esc(String(m.id))}')">${p?"Abrir":"Montar jogo"}</button></div></div>`;
  }).join("") + loose.map(p=>`<div class="gm-mat"><div><b>${esc(p.titulo)}</b><span class="hint">pacote avulso</span></div><div class="btn-row" style="align-items:center"><span class="gm-st ${p.status}">${p.status==="published"?"publicado":"rascunho"}</span><button class="btn-secondary" onclick="gmOpenPack('${p.id}')">Abrir</button></div></div>`).join("")
  + `<button class="btn-secondary" style="margin-top:8px" onclick="gmNewLoose()">+ Pacote avulso (sem material)</button>`;
}

/* ---------- abrir / criar ---------- */
window.gmOpen = async function(materialId){
  const m=(typeof MATERIALS!=="undefined"?MATERIALS:[]).find(x=>String(x.id)===materialId); if(!m) return;
  const p=GM.packs.find(x=>x.material_id===materialId);
  if(p) return gmOpenPack(p.id);
  GM.current={ id:null, student_id:m.student_id, material_id:materialId, class_id:m.class_id?String(m.class_id):null, titulo:m.title, tema:"", nivel:studentLevel(m.student_id), pack:emptyPack(), status:"draft", _material:m };
  GM.activities=[];
  renderEditor();
};
window.gmNewLoose = function(){
  const sid=$("gmStudent").value; if(!sid) return;
  GM.current={ id:null, student_id:sid, material_id:null, class_id:null, titulo:"Pacote avulso", tema:"", nivel:studentLevel(sid), pack:emptyPack(), status:"draft", _material:null };
  GM.activities=[]; renderEditor();
};
window.gmOpenPack = async function(id){
  const p=GM.packs.find(x=>x.id===id); if(!p) return;
  GM.current={...p, pack:normalizePack(p.pack), _material:(typeof MATERIALS!=="undefined"?MATERIALS:[]).find(x=>String(x.id)===p.material_id)||null};
  const {data}=await sb.from("game_activities").select("*").eq("pack_id",id).order("created_at");
  GM.activities=(data||[]).map(a=>({tipo:a.tipo,item_ids:a.item_ids,...a.data}));
  renderEditor();
};
function emptyPack(){ return {vocabulario:[],estruturas:[],expressoes:[],contextos_para_tarefas:[]}; }
function normalizePack(raw){
  const p={...emptyPack(),...(raw||{})};
  SECOES.forEach(s=>{
    p[s.key]=(p[s.key]||[]).map(it=>({...it}));
    let n=0; const used=new Set(p[s.key].map(i=>i.id).filter(Boolean));
    p[s.key].forEach(it=>{ if(!it.id){ do{n++}while(used.has(s.prefix+n)); it.id=s.prefix+n; used.add(it.id);} it.prioritario=!!it.prioritario; });
  });
  if(!Array.isArray(p.contextos_para_tarefas)) p.contextos_para_tarefas=[];
  return p;
}
const allItemIds = () => SECOES.flatMap(s=>GM.current.pack[s.key].map(i=>i.id));

/* ---------- prompts (Opção 1: gerar aqui no Claude e colar) ---------- */
function promptPacote(){
  const c=GM.current, m=c._material;
  const material = m ? [
    `Título: ${m.title}`,
    m.description?`Resumo / conteúdo:\n${m.description}`:"",
    m.chunks?`Chunks da aula:\n${m.chunks}`:"",
    m.url?`(O PDF da aula está anexado a esta mensagem.)`:""
  ].filter(Boolean).join("\n\n") : "(cole aqui os tópicos da aula)";
  return `You are an assistant to an English teacher (Teacher Débora). Turn the lesson material below into a structured study package. Use ONLY what is in the material; do not invent content the lesson didn't teach.

Student level: ${c.nivel}

Lesson material:
"""
${material}
"""

Return ONLY valid JSON, no comments, in this format:
{
  "titulo": "short lesson title",
  "tema": "real-life context of the lesson",
  "nivel": "A1|A2|B1|B2|C1",
  "vocabulario": [{"termo":"","significado_en":"","traducao_pt":"","exemplo":"","classe":""}],
  "estruturas": [{"nome":"","regra_curta":"","exemplos":["",""],"erro_comum":""}],
  "expressoes": [{"expressao":"","uso":"","registro":"formal|neutral|informal","exemplo":""}],
  "contextos_para_tarefas": ["situations from the lesson that could become writing or roleplay tasks"]
}

Rules:
- Every example must be natural and at the student's level.
- Every chunk listed in the material must become an item in "expressoes".
- Maximum 25 items in total; prioritize what the lesson emphasized.`;
}
function promptAtividades(){
  const c=GM.current;
  const itens=SECOES.flatMap(s=>c.pack[s.key].map(i=>({id:i.id,secao:s.key,...stripMeta(i)})));
  const n=Math.min(40,Math.max(12,itens.length*2));
  return `You build a bank of review exercises for an English student. Use ONLY the items below. The game will later draw random activities from this bank.

Student level: ${c.nivel}
Feedback language for "explicacao": ${["A1","A2"].includes(c.nivel)?"Portuguese":c.nivel==="B1"?"Portuguese with English examples":"English"}
Lesson theme: ${c.tema||c.titulo}

Items:
${JSON.stringify(itens,null,1)}

Create ${n} activities. Every item must appear in at least 2 activities, and items marked "prioritario": true in at least 3.
Use all of these types, varied: multiple_choice, fill_blank, match, unscramble, true_false, translate_pt_en, spot_the_mistake, sounds_natural.
Distractors must be plausible and at the same level, never absurd. Support words outside the items only if at or below the level.

Return ONLY valid JSON:
{"atividades":[
 {"tipo":"multiple_choice","item_ids":["v1"],"enunciado":"","opcoes":["","","",""],"resposta_correta":"","explicacao":""},
 {"tipo":"fill_blank","item_ids":["x2"],"enunciado":"sentence with ___","banco":["optional","word","bank"],"resposta_correta":"","respostas_aceitas":[""],"explicacao":""},
 {"tipo":"match","item_ids":["v1","v2","v3","v4","v5"],"enunciado":"","pares":[["left","right"]],"explicacao":""},
 {"tipo":"unscramble","item_ids":["s1"],"enunciado":"","palavras":["shuffled","words"],"resposta_correta":"full sentence","explicacao":""},
 {"tipo":"true_false","item_ids":["s1"],"enunciado":"statement","resposta_correta":"true|false","explicacao":""},
 {"tipo":"translate_pt_en","item_ids":["x1"],"enunciado":"frase em português","resposta_correta":"","respostas_aceitas":[""],"explicacao":""},
 {"tipo":"spot_the_mistake","item_ids":["s1"],"enunciado":"sentence with one mistake","resposta_correta":"corrected sentence","explicacao":""},
 {"tipo":"sounds_natural","item_ids":["x1"],"enunciado":"Which one sounds more natural?","opcoes":["",""],"resposta_correta":"","explicacao":""}
]}`;
}
const stripMeta = i => { const {id,...rest}=i; if(!rest.prioritario) delete rest.prioritario; return rest; };

window.gmCopy = async function(kind){
  if(kind==="atividades" && !allItemIds().length){ toast("Carregue o pacote primeiro."); return; }
  const text = kind==="pacote"?promptPacote():promptAtividades();
  try{ await navigator.clipboard.writeText(text); toast(kind==="pacote"&&GM.current._material?.url?"Prompt copiado. Anexe o PDF da aula junto.":"Prompt copiado."); }
  catch{ $("gmPasteHint").textContent="Não consegui copiar automaticamente. Selecione o texto abaixo."; $("gmPromptBox").value=text; $("gmPromptBox").style.display="block"; }
};

function parseJSON(txt){
  txt=txt.trim().replace(/^```(?:json)?/i,"").replace(/```$/,"").trim();
  const a=txt.indexOf("{"), b=txt.lastIndexOf("}");
  if(a<0||b<a) throw new Error("Não encontrei um JSON no texto colado.");
  return JSON.parse(txt.slice(a,b+1));
}
window.gmLoadPack = function(){
  try{
    const j=parseJSON($("gmPackPaste").value);
    const c=GM.current;
    c.pack=normalizePack(j);
    if(j.titulo) c.titulo=j.titulo;
    if(j.tema) c.tema=j.tema;
    if(j.nivel) c.nivel=j.nivel;
    GM.activities=[];
    renderEditor(); toast("Pacote carregado. Revise os itens.");
  }catch(e){ showMsg("gmMsg","JSON inválido: "+e.message,"error"); }
};
window.gmLoadActivities = function(){
  try{
    const j=parseJSON($("gmActPaste").value);
    const ids=new Set(allItemIds());
    const list=(j.atividades||[]).filter(a=>TIPOS.includes(a.tipo)&&a.enunciado!==undefined).map(a=>({...a,item_ids:(a.item_ids||[]).filter(i=>ids.has(i))}));
    if(!list.length) throw new Error("nenhuma atividade válida.");
    const dropped=(j.atividades||[]).length-list.length;
    GM.activities=list; renderEditor();
    toast(`${list.length} atividades carregadas${dropped?` (${dropped} ignoradas)`:""}.`);
  }catch(e){ showMsg("gmMsg","JSON inválido: "+e.message,"error"); }
};

/* ---------- editor ---------- */
function renderEditor(){
  const c=GM.current, el=$("gmEditor");
  const nItems=allItemIds().length;
  const counts=TIPOS.map(t=>[t,GM.activities.filter(a=>a.tipo===t).length]).filter(x=>x[1]);
  const st={draft:"rascunho",published:"publicado"}[c.status];
  el.innerHTML=`
  <div class="card-title" style="display:flex;justify-content:space-between;gap:10px;align-items:center"><span>${c.id?"Pacote":"Novo pacote"} · ${esc(studentName(c.student_id))}</span><span class="gm-st ${c.id?c.status:"none"}">${c.id?st:"não salvo"}</span></div>
  <div class="grid-2">
    <div class="field"><label>Título</label><input id="gmTitulo" value="${esc(c.titulo||"")}"></div>
    <div class="field"><label>Nível</label><select id="gmNivel">${["A1","A2","B1","B2","C1","C2"].map(l=>`<option ${c.nivel===l?"selected":""}>${l}</option>`).join("")}</select></div>
  </div>
  <div class="field"><label>Tema / contexto</label><input id="gmTema" value="${esc(c.tema||"")}"></div>

  <div class="gm-step">
    <h4>1 · Conteúdo da aula</h4>
    <p class="hint">Copie o prompt, cole numa conversa com o Claude${c._material?.url?" (anexe o PDF)":""} e cole a resposta aqui.</p>
    <div class="btn-row"><button class="btn-secondary" onclick="gmCopy('pacote')">Copiar prompt do pacote</button><button class="btn-secondary" disabled title="Disponível quando a API da Anthropic for conectada">✨ Gerar com IA</button></div>
    <p class="hint" id="gmPasteHint"></p><textarea id="gmPromptBox" class="gm-json" style="display:none" readonly></textarea>
    <div class="field" style="margin-top:10px"><textarea id="gmPackPaste" class="gm-json" placeholder='Cole aqui o JSON do pacote { "titulo": ... }'></textarea></div>
    <button class="btn-primary" onclick="gmLoadPack()">Carregar pacote</button>
  </div>

  ${nItems?`<div class="gm-step"><h4>2 · Revisar itens <span class="hint">(${nItems} · ⭐ = prioritário, aparece mais vezes)</span></h4>${SECOES.map(renderSecao).join("")}</div>`:""}

  ${nItems?`<div class="gm-step">
    <h4>3 · Banco de atividades</h4>
    <p class="hint">Revise os itens antes. O prompt já leva os itens com IDs e prioridades.</p>
    <div class="btn-row"><button class="btn-secondary" onclick="gmCopy('atividades')">Copiar prompt das atividades</button></div>
    <div class="field" style="margin-top:10px"><textarea id="gmActPaste" class="gm-json" placeholder='Cole aqui o JSON { "atividades": [...] }'></textarea></div>
    <button class="btn-primary" onclick="gmLoadActivities()">Carregar atividades</button>
    ${GM.activities.length?`<div class="gm-counts">${counts.map(([t,n])=>`<span class="tag">${TIPO_LABEL[t]} · ${n}</span>`).join("")}</div>
      <details><summary class="hint" style="cursor:pointer">Ver as ${GM.activities.length} atividades</summary>${GM.activities.map((a,i)=>`<div class="gm-act"><span class="tag">${TIPO_LABEL[a.tipo]}</span><p>${esc(a.enunciado||"")}<br><span class="hint">✓ ${esc(a.resposta_correta||(a.pares||[]).map(p=>p.join(" → ")).join(" · "))}</span></p><button class="gm-ico on" title="Remover" onclick="gmDelAct(${i})">🗑</button></div>`).join("")}</details>`:""}
  </div>`:""}

  <div class="btn-row" style="margin-top:16px">
    <button class="btn-secondary" onclick="gmSave(false)" ${nItems?"":"disabled"}>Salvar rascunho</button>
    ${c.status==="published"&&c.id
      ?`<button class="btn-primary" onclick="gmSave(true)">Atualizar publicação</button><button class="btn-danger" onclick="gmUnpublish()">Despublicar</button>`
      :`<button class="btn-primary" onclick="gmSave(true)" ${nItems&&GM.activities.length?"":"disabled"} title="Precisa de itens e atividades">Publicar para a aluna</button>`}
    ${c.id?`<button class="btn-danger" onclick="gmDelete()">Excluir pacote</button>`:""}
  </div>
  <div id="gmMsg" class="msg"></div>`;
  ["gmTitulo","gmTema"].forEach(id=>$(id).addEventListener("input",e=>{ c[id==="gmTitulo"?"titulo":"tema"]=e.target.value; }));
  $("gmNivel").addEventListener("change",e=>c.nivel=e.target.value);
}
function renderSecao(s){
  const list=GM.current.pack[s.key];
  return `<div class="gm-sec"><div class="gm-sec-head"><b>${s.label} <span class="hint">(${list.length})</span></b><button class="btn-secondary" style="padding:5px 10px" onclick="gmAddItem('${s.key}')">+ item</button></div>
  ${list.map((it,i)=>`<div class="gm-item">
    <button class="gm-ico ${it.prioritario?"on":""}" title="Prioritário" onclick="gmToggle('${s.key}',${i})">⭐</button>
    <div class="gm-fields">${s.fields.map(([f,ph])=>`<input placeholder="${ph}" value="${esc(it[f]||"")}" oninput="gmSet('${s.key}',${i},'${f}',this.value)">`).join("")}</div>
    <button class="gm-ico on" title="Remover" onclick="gmDelItem('${s.key}',${i})">🗑</button>
  </div>`).join("")}</div>`;
}
window.gmSet=(k,i,f,v)=>{ GM.current.pack[k][i][f]=v; };
window.gmToggle=(k,i)=>{ const it=GM.current.pack[k][i]; it.prioritario=!it.prioritario; renderEditor(); };
window.gmDelItem=(k,i)=>{ const [it]=GM.current.pack[k].splice(i,1); GM.activities=GM.activities.map(a=>({...a,item_ids:a.item_ids.filter(x=>x!==it.id)})); renderEditor(); };
window.gmAddItem=(k)=>{ GM.current.pack[k].push({}); GM.current.pack=normalizePack(GM.current.pack); renderEditor(); };
window.gmDelAct=(i)=>{ GM.activities.splice(i,1); renderEditor(); setTimeout(()=>{const d=document.querySelector("#gmEditor details"); if(d) d.open=true;}); };

/* ---------- salvar / publicar ---------- */
window.gmSave = async function(publish){
  const c=GM.current;
  if(publish && !GM.activities.length){ showMsg("gmMsg","Carregue as atividades antes de publicar.","error"); return; }
  // limpa itens vazios
  SECOES.forEach(s=>{ c.pack[s.key]=c.pack[s.key].filter(it=>s.fields.some(([f])=>String(it[f]||"").trim())); });
  const body={ student_id:c.student_id, material_id:c.material_id, class_id:c.class_id, titulo:c.titulo||"Aula", tema:c.tema||null, nivel:c.nivel, pack:{...c.pack,titulo:c.titulo,tema:c.tema,nivel:c.nivel}, updated_at:new Date().toISOString() };
  if(publish){ body.status="published"; body.published_at=c.published_at||new Date().toISOString(); }
  try{
    showMsg("gmMsg","Salvando...","info");
    let id=c.id;
    if(id){ const {error}=await sb.from("game_packs").update(body).eq("id",id); if(error) throw error; }
    else { const {data,error}=await sb.from("game_packs").insert(body).select().single(); if(error) throw error; id=data.id; }
    // atividades: substitui o banco do pacote
    const del=await sb.from("game_activities").delete().eq("pack_id",id); if(del.error) throw del.error;
    if(GM.activities.length){
      const rows=GM.activities.map(({tipo,item_ids,...data})=>({pack_id:id,student_id:c.student_id,tipo,item_ids:item_ids||[],data}));
      const {error}=await sb.from("game_activities").insert(rows); if(error) throw error;
    }
    await loadPacks(); renderMaterialsList();
    await gmOpenPack(id);
    showMsg("gmMsg",publish?"Publicado. A aluna já pode jogar com este pacote.":"Rascunho salvo.","success");
  }catch(e){ showMsg("gmMsg",e.message||"Erro ao salvar.","error"); }
};
window.gmUnpublish = async function(){
  const {error}=await sb.from("game_packs").update({status:"draft"}).eq("id",GM.current.id);
  if(error){ toast(error.message); return; }
  await loadPacks(); renderMaterialsList(); await gmOpenPack(GM.current.id); toast("Despublicado.");
};
window.gmDelete = async function(){
  if(!confirm("Excluir este pacote e as atividades dele? O histórico de partidas da aluna fica.")) return;
  const {error}=await sb.from("game_packs").delete().eq("id",GM.current.id);
  if(error){ toast(error.message); return; }
  GM.current=null; $("gmEditor").innerHTML=`<div class="empty">Pacote excluído.</div>`;
  await loadPacks(); renderMaterialsList();
};

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",injectUI); else injectUI();
})();
