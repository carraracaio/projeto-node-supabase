const API_BASE = 'http://localhost:3007';

const tabela = document.getElementById('tabela-alunos');
const tabelaCursos = document.getElementById('tabela-cursos');
const msg = document.getElementById('msg');
const modal = document.getElementById('modal');
const modalTitulo = document.getElementById('modal-titulo');
const form = document.getElementById('form-aluno');
const inputNome = document.getElementById('nome');
const inputRa = document.getElementById('ra');
const selectCurso = document.getElementById('curso');
const filtroCurso = document.getElementById('filtro-curso');
const formCurso = document.getElementById('form-curso');
const inputNovoCurso = document.getElementById('novo-curso');
const formBusca = document.getElementById('form-busca');
const inputBusca = document.getElementById('busca-aluno');
let alunosCarregados = [];
let modo = 'criar';
let raEditando = '';

function mostrarMsg(texto, tipo = '') {
  msg.hidden = false;
  msg.textContent = texto;
  msg.className = 'msg' + (tipo ? ` ${tipo}` : '');
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const dados = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(dados?.erro || dados?.message || 'Erro na requisição');
  }

  return dados;
}

async function listarCursos() {
  try {
    const cursos = await request('/cursos');
    montarTabelaCursos(cursos);
    preencherSelects(cursos);
  } catch (e) {
    mostrarMsg(e.message || 'Erro ao listar cursos', 'erro');
    tabelaCursos.innerHTML = '<tr><td colspan="3" class="vazio">Não foi possível carregar os cursos.</td></tr>';
  }
}

function montarTabelaCursos(cursos) {
  if (!cursos.length) {
    tabelaCursos.innerHTML = '<tr><td colspan="3" class="vazio">Nenhum curso cadastrado.</td></tr>';
    return;
  }

  tabelaCursos.innerHTML = '';

  for (const curso of cursos) {
    const tr = document.createElement('tr');

    const tdNome = document.createElement('td');
    tdNome.textContent = curso.nome;

    const tdTotal = document.createElement('td');
    tdTotal.textContent = curso.total_alunos ?? 0;

    const tdAcoes = document.createElement('td');
    const btnVer = document.createElement('button');
    btnVer.textContent = 'Ver alunos';
    btnVer.className = 'btn btn-pequeno';
    btnVer.onclick = () => {
      filtroCurso.value = String(curso.id);
      listarAlunos();
    };

    const btnExcluir = document.createElement('button');
    btnExcluir.textContent = 'Excluir';
    btnExcluir.className = 'btn btn-pequeno btn-perigo';
    btnExcluir.onclick = () => excluirCurso(curso.id, curso.nome);

    tdAcoes.append(btnVer, btnExcluir);
    tr.append(tdNome, tdTotal, tdAcoes);
    tabelaCursos.appendChild(tr);
  }
}

function preencherSelects(cursos) {
  const filtroAtual = filtroCurso.value;
  const cursoAtual = selectCurso.value;

  filtroCurso.innerHTML = '<option value="">Todos os cursos</option>';
  selectCurso.innerHTML = '<option value="">Selecione um curso</option>';

  for (const curso of cursos) {
    filtroCurso.appendChild(new Option(curso.nome, String(curso.id)));
    selectCurso.appendChild(new Option(curso.nome, String(curso.id)));
  }

  filtroCurso.value = filtroAtual || '';
  selectCurso.value = cursoAtual || '';

  if (filtroCurso.selectedIndex === -1) filtroCurso.value = '';
  if (selectCurso.selectedIndex === -1) selectCurso.value = '';
}

async function adicionarCurso(evento) {
  evento.preventDefault();
  const nome = inputNovoCurso.value.trim();

  if (!nome) {
    mostrarMsg('Informe o nome do curso.', 'erro');
    return;
  }

  try {
    const dados = await request('/cursos', {
      method: 'POST',
      body: JSON.stringify({ nome }),
    });

    inputNovoCurso.value = '';
    mostrarMsg(`Curso "${dados.nome}" cadastrado!`, 'ok');
    await listarCursos();
  } catch (e) {
    mostrarMsg(e.message || 'Erro ao cadastrar curso', 'erro');
  }
}

async function excluirCurso(id, nome) {
  if (!confirm(`Excluir o curso "${nome}"?`)) return;

  try {
    await request(`/cursos/${id}`, { method: 'DELETE' });
    mostrarMsg('Curso excluído.', 'ok');
    await atualizarTudo();
  } catch (e) {
    mostrarMsg(e.message || 'Erro ao excluir curso', 'erro');
  }
}

function abrirModalCriar() {
  if (selectCurso.options.length <= 1) {
    mostrarMsg('Cadastre um curso antes de incluir alunos.', 'erro');
    return;
  }

  modo = 'criar';
  raEditando = '';
  modalTitulo.textContent = 'Novo aluno';
  form.reset();
  selectCurso.value = filtroCurso.value || '';
  inputRa.disabled = false;
  modal.hidden = false;
  inputNome.focus();
}

function abrirModalEditar(aluno) {
  modo = 'editar';
  raEditando = aluno.ra;
  modalTitulo.textContent = 'Editar aluno';
  inputNome.value = aluno.nome || '';
  inputRa.value = aluno.ra || '';
  selectCurso.value = String(aluno.curso_id || '');
  inputRa.disabled = true;
  modal.hidden = false;
  inputNome.focus();
}

function fecharModal() {
  modal.hidden = true;
  form.reset();
  inputRa.disabled = false;
}

async function listarAlunos() {
  const cursoId = filtroCurso.value;
  const url = cursoId ? `/cursos/${cursoId}/alunos` : '/alunos';

  try {
    alunosCarregados = await request(url);
    renderizarAlunos();
  } catch (e) {
    mostrarMsg(e.message || 'Erro ao listar alunos', 'erro');
    tabela.innerHTML = '<tr><td colspan="4" class="vazio">Não foi possível carregar a lista.</td></tr>';
  }
}

function renderizarAlunos() {
  const termo = inputBusca.value.trim().toLocaleLowerCase();
  const alunos = alunosCarregados.filter((aluno) => {
    const nome = (aluno.nome || '').toLocaleLowerCase();
    const ra = String(aluno.ra || '').toLocaleLowerCase();
    return nome.includes(termo) || ra.includes(termo);
  });

  if (!alunos.length) {
    const mensagem = alunosCarregados.length
      ? 'Nenhum aluno corresponde à pesquisa.'
      : 'Nenhum aluno encontrado.';
    tabela.innerHTML = `<tr><td colspan="4" class="vazio">${mensagem}</td></tr>`;
    return;
  }

  tabela.innerHTML = '';

  for (const aluno of alunos) {
    const tr = document.createElement('tr');

    const tdNome = document.createElement('td');
    tdNome.textContent = aluno.nome;

    const tdRa = document.createElement('td');
    tdRa.textContent = aluno.ra;

    const tdCurso = document.createElement('td');
    tdCurso.textContent = aluno.curso ? aluno.curso.nome : '—';

    const tdAcoes = document.createElement('td');
    const btnEditar = document.createElement('button');
    btnEditar.textContent = 'Editar';
    btnEditar.className = 'btn btn-pequeno';
    btnEditar.onclick = () => abrirModalEditar(aluno);

    const btnExcluir = document.createElement('button');
    btnExcluir.textContent = 'Excluir';
    btnExcluir.className = 'btn btn-pequeno btn-perigo';
    btnExcluir.onclick = () => excluirAluno(aluno.ra, aluno.nome);

    tdAcoes.append(btnEditar, btnExcluir);
    tr.append(tdNome, tdRa, tdCurso, tdAcoes);
    tabela.appendChild(tr);
  }
}

async function salvarAluno(evento) {
  evento.preventDefault();

  const nome = inputNome.value.trim();
  const ra = inputRa.value.trim();
  const curso_id = Number(selectCurso.value);

  if (!nome || !ra || !curso_id) {
    mostrarMsg('Preencha nome, RA e curso antes de salvar.', 'erro');
    return;
  }

  try {
    if (modo === 'criar') {
      await request('/alunos', {
        method: 'POST',
        body: JSON.stringify({ nome, ra, curso_id }),
      });

      mostrarMsg('Aluno cadastrado com sucesso!', 'ok');
    } else {
      await request(`/alunos/${encodeURIComponent(raEditando)}`, {
        method: 'PUT',
        body: JSON.stringify({ nome, curso_id }),
      });

      mostrarMsg('Aluno atualizado com sucesso!', 'ok');
    }

    fecharModal();
    await atualizarTudo();
  } catch (e) {
    mostrarMsg(e.message || 'Erro ao salvar aluno', 'erro');
  }
}

async function excluirAluno(ra, nome) {
  if (!confirm(`Excluir o aluno "${nome}" (RA ${ra})?`)) return;

  try {
    await request(`/alunos/${encodeURIComponent(ra)}`, { method: 'DELETE' });
    mostrarMsg('Aluno excluído.', 'ok');
    await atualizarTudo();
  } catch (e) {
    mostrarMsg(e.message || 'Erro ao excluir aluno', 'erro');
  }
}

async function atualizarTudo() {
  await listarCursos();
  await listarAlunos();
}

document.getElementById('btn-novo').addEventListener('click', abrirModalCriar);
document.getElementById('btn-atualizar').addEventListener('click', atualizarTudo);
document.getElementById('btn-cancelar').addEventListener('click', fecharModal);
document.getElementById('modal-fundo').addEventListener('click', fecharModal);
form.addEventListener('submit', salvarAluno);
formCurso.addEventListener('submit', adicionarCurso);
formBusca.addEventListener('submit', (evento) => {
  evento.preventDefault();
  renderizarAlunos();
});
inputBusca.addEventListener('input', renderizarAlunos);
filtroCurso.addEventListener('change', listarAlunos);

atualizarTudo();
