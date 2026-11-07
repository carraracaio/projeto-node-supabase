require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Configure SUPABASE_URL e SUPABASE_ANON_KEY no .env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const COLUNAS_ALUNO = 'id, nome, ra, curso_id, criado_em, curso:cursos(id, nome)';

async function inserirCurso(nome) {
  const { data, error } = await supabase
    .from('cursos')
    .insert([{ nome }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function listarCursos() {
  const { data, error } = await supabase
    .from('cursos')
    .select('id, nome, alunos(count)')
    .order('nome', { ascending: true });

  if (error) throw error;

  return (data || []).map((curso) => ({
    id: curso.id,
    nome: curso.nome,
    total_alunos: curso.alunos?.[0]?.count ?? 0,
  }));
}

async function excluirCurso(id) {
  const { data, error } = await supabase
    .from('cursos')
    .delete()
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
}

async function inserirAluno(nome, ra, cursoId) {
  const { data, error } = await supabase
    .from('alunos')
    .insert([{ nome, ra, curso_id: cursoId }])
    .select(COLUNAS_ALUNO)
    .single();

  if (error) throw error;
  return data;
}

async function listarAlunos() {
  const { data, error } = await supabase
    .from('alunos')
    .select(COLUNAS_ALUNO)
    .order('id', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function listarAlunosDoCurso(cursoId) {
  const { data, error } = await supabase
    .from('alunos')
    .select(COLUNAS_ALUNO)
    .eq('curso_id', cursoId)
    .order('nome', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function buscarPorRa(ra) {
  const { data, error } = await supabase
    .from('alunos')
    .select(COLUNAS_ALUNO)
    .eq('ra', ra)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function buscarPorNome(parteNome) {
  const { data, error } = await supabase
    .from('alunos')
    .select(COLUNAS_ALUNO)
    .ilike('nome', `%${parteNome}%`)
    .order('nome', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function atualizarAluno(ra, nome, cursoId) {
  const campos = {};

  if (nome) campos.nome = nome;
  if (cursoId) campos.curso_id = cursoId;

  if (!Object.keys(campos).length) {
    throw new Error('Informe nome e/ou curso para atualizar');
  }

  const { data, error } = await supabase
    .from('alunos')
    .update(campos)
    .eq('ra', ra)
    .select(COLUNAS_ALUNO);

  if (error) throw error;
  return data;
}

async function excluirPorRa(ra) {
  const { data, error } = await supabase
    .from('alunos')
    .delete()
    .eq('ra', ra)
    .select();

  if (error) throw error;
  return data;
}

module.exports = {
  supabase,
  inserirCurso,
  listarCursos,
  excluirCurso,
  inserirAluno,
  listarAlunos,
  listarAlunosDoCurso,
  buscarPorRa,
  buscarPorNome,
  atualizarAluno,
  excluirPorRa,
};
