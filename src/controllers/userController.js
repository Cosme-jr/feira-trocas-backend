// src/controllers/userController.js

// Importa a instância única do PrismaClient exportada de app.js
// O caminho '../app' significa:
// 'voltar uma pasta' (de 'controllers' para 'src')
// e então acessar o arquivo 'app.js'
const prisma = require('../db');
const bcrypt = require('bcryptjs'); // <--- ESTA LINHA É CRUCIAL 

const userController = {
  // Função para criar um novo usuário
  async createUser(req, res) {
    // Extrai os dados do corpo da requisição
    const { nome, email, senha } = req.body;

    // --- Validação básica de entrada ---
    if (!nome || !email || !senha) {
      // Retorna erro 400 Bad Request se algum campo obrigatório estiver faltando
      return res.status(400).json({ error: 'Todos os campos (nome, email, senha) são obrigatórios.' });
    }
    // TODO: Considerar adicionar validação mais robusta (ex: formato de email, complexidade da senha)

    try {
      // 1. Hash da senha antes de salvar no banco de dados
      // '10' é o número de rounds de salt, que define a complexidade do hash.
      // Quanto maior, mais seguro, mas mais lento para computar.
      const hashedPassword = await bcrypt.hash(senha, 10);

      // 2. Cria o usuário no banco de dados usando o Prisma
      const newUser = await prisma.usuario.create({
        data: {
          nome,
          email,
          senha: hashedPassword, // Salva a senha hasheada, não a senha em texto puro
        },
        select: { // Seleciona apenas os campos que devem ser retornados na resposta (NUNCA a senha)
          id: true,
          nome: true,
          email: true,
          createdAt: true, // <-- VÍRGULA CORRIGIDA AQUI
          updatedAt: true,
        },
      });
      // Retorna o novo usuário com status 201 Created
      res.status(201).json(newUser);
    } catch (error) {
      // Tratamento de erros específicos do Prisma
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        // Erro P2002 indica violação de constraint UNIQUE (email já existe)
        return res.status(409).json({ error: 'Email já cadastrado.' }); // 409 Conflict
      }
      // Loga o erro completo no console do servidor para depuração
      console.error('Erro ao criar usuário:', error); // Corrigi "Error" para "Erro" e adicionei ':' para consistência
      // Retorna erro 500 Internal Server Error para erros não esperados
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },

  // Função para buscar todos os usuários
  async getAllUsers(req, res) {
    try {
      const users = await prisma.usuario.findMany({
        select: { // Seleciona os campos que você quer retornar
          id: true,
          nome: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      res.status(200).json(users); // 200 OK
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },

  // Função para buscar um usuário específico por ID
  async getUserById(req, res) {
    const { id } = req.params; // O ID vem dos parâmetros da URL (ex: /api/users/123)

    try {
      const user = await prisma.usuario.findUnique({
        where: { id }, // Busca pelo ID
        select: { // Inclui dados relacionados para uma resposta mais completa
          id: true,
          nome: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          itens: { // Inclui os itens que este usuário possui
            select: { id: true, nome: true, categoria: true, disponivelParaTroca: true }
          },
          propostasFeitas: { // Inclui as propostas que este usuário fez
            select: { id: true, status: true, itemOfertado: { select: { nome: true } }, itemDesejado: { select: { nome: true } } }
          },
          propostasRecebidas: { // Inclui as propostas que foram feitas para itens deste usuário
            select: { id: true, status: true, itemOfertado: { select: { nome: true } }, itemDesejado: { select: { nome: true } } }
          },
        },
      });

      if (!user) {
        // Retorna 404 Not Found se o usuário não for encontrado
        return res.status(404).json({ error: 'Usuário não encontrado.' });
      }
      res.status(200).json(user);
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },

  // Função para atualizar um usuário existente
  async updateUser(req, res) {
    const { id } = req.params;
    const { nome, email, senha } = req.body;

    try {
      let dataToUpdate = { nome, email };
      // Se uma nova senha for fornecida no corpo da requisição, faz o hash dela
      if (senha) {
        dataToUpdate.senha = await bcrypt.hash(senha, 10);
      }

      const updatedUser = await prisma.usuario.update({
        where: { id }, // Busca o usuário pelo ID para atualizar
        data: dataToUpdate, // Dados a serem atualizados
        select: { // Seleciona os campos a serem retornados
          id: true,
          nome: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      res.status(200).json(updatedUser);
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        return res.status(409).json({ error: 'Email já cadastrado.' });
      }
      if (error.code === 'P2025') { // Erro P2025 indica que o registro a ser atualizado não foi encontrado
        return res.status(404).json({ error: 'Usuário não encontrado para atualizar.' });
      }
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },

  // Função para deletar um usuário
  async deleteUser(req, res) {
    const { id } = req.params;

    try {
      await prisma.usuario.delete({
        where: { id }, // Deleta o usuário pelo ID
      });
      // Retorna 204 No Content para exclusão bem-sucedida (sem corpo na resposta)
      res.status(204).send();
    } catch (error) {
      if (error.code === 'P2025') { // Erro P2025 indica que o registro a ser deletado não foi encontrado
        return res.status(404).json({ error: 'Usuário não encontrado para deletar.' });
      }
      if (error.code === 'P2003') { // Erro P2003 indica falha de Foreign Key (usuário tem itens/propostas associadas)
        return res.status(409).json({ error: 'Não é possível deletar o usuário porque ele possui itens ou propostas associadas. Delete primeiro os itens/propostas relacionados.' });
      }
      console.error('Erro ao deletar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },
};

module.exports = userController;