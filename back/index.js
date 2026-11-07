const {
 inserirCurso, listarCursos,
 inserirAluno, listarAlunos, listarAlunosDoCurso,
 buscarPorRa, buscarPorNome, atualizarAluno, excluirPorRa,
} = require('./supabase');
// main() é async porque TODAS as funções do banco são assíncronas
async function main() {
 try {
 // 1) o lado "1": cria os cursos (se já existirem, segue em frente)
 for (const nome of ['Filosofia', 'Relações Internacionais']) {
 try {
 await inserirCurso(nome);
 } catch (e) {
 console.log(`Curso "${nome}" não inserido (talvez já exista)`);
 }
 }
 const cursos = await listarCursos();
 console.log('Cursos:', cursos);
 // pega os ids pelo nome — o aluno guarda o ID do curso, não o nome
 const FL = cursos.find((c) => c.nome === 'Filosofia');
 const RI = cursos.find((c) => c.nome === 'Relações Internacionais');
 // 2) o lado "N": cria um aluno ligado ao curso ADS
 try {
 const novo = await inserirAluno('Robson dos Santos', '2026002', FL.id);
 console.log('Inserido com sucesso:', novo);
 } catch (e) {
 console.log('Não inseriu (talvez RA já exista):', e.message || e);
 }
 const todos = await listarAlunos();
 console.log(`Total: ${todos.length}`, todos);
 // troca o aluno de curso: só muda o curso_id
 await atualizarAluno('2026002', 'Robson dos Santos', RI.id);
 // 1:N na prática: todos os alunos de UM curso
 const daRI = await listarAlunosDoCurso(RI.id);
 console.log('Alunos de Relações Internacionais:', daRI);
 // DELETE fica comentado até você ter certeza do que está apagando
 // const apagados = await excluirPorRa('2026001');
 } catch (err) {
 console.error('ERRO GERAL:', err.message || err);
 }
}
main(); // dispara a função principal — sem isso, nada roda