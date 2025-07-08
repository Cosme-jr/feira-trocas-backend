// src/controllers/userController.js

import prisma from '../db.js'; // Importa a instância do Prisma do seu db.js
import bcrypt from 'bcryptjs'; // Importa a biblioteca para hash de senhas

const userController = {
  // Função para criar um novo usuário
  async createUser(req, res) {
    console.log('Requisição para criar usuário recebida!');
    console.log('Corpo da requisição:', req.body);

    // Extrai os dados do corpo da requisição
    const { nome, email, senha, isAdmin } = req.body; // Adicionado isAdmin para permitir cadastro

    // --- Validação básica de entrada ---
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Todos os campos (nome, email, senha) são obrigatórios.' });
    }
    
    try {
      // 1. Hash da senha antes de salvar no banco de dados
      const hashedPassword = await bcrypt.hash(senha, 10);

      // 2. Cria o usuário no banco de dados usando o Prisma
      const newUser = await prisma.usuario.create({
        data: {
          nome,
          email,
          senha: hashedPassword, // Salva a senha hasheada
          isAdmin: isAdmin || false, // Define isAdmin. Se não for fornecido, será false por padrão
        },
        select: { // Seleciona apenas os campos que devem ser retornados na resposta (NUNCA a senha)
          id: true,
          nome: true,
          email: true,
          isAdmin: true, // Inclui o campo isAdmin na resposta
          createdAt: true,
          updatedAt: true,
        },
      });
      console.log('Usuário criado com sucesso:', newUser);
      // Retorna o novo usuário com status 201 Created
      res.status(201).json(newUser);
    } catch (error) {
      // Tratamento de erros específicos do Prisma
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        console.error('Erro ao criar usuário: Email já cadastrado.', error);
        return res.status(409).json({ error: 'Email já cadastrado.' }); // 409 Conflict
      }
      // Loga o erro completo no console do servidor para depuração
      console.error('Erro ao criar usuário:', error);
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
          isAdmin: true, // Inclui o campo isAdmin
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
          isAdmin: true, // Inclui o campo isAdmin
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
    const { nome, email, senha, isAdmin } = req.body; // Adicionado isAdmin para permitir atualização

    try {
      let dataToUpdate = { nome, email };
      // Se uma nova senha for fornecida no corpo da requisição, faz o hash dela
      if (senha) {
        dataToUpdate.senha = await bcrypt.hash(senha, 10);
      }
      // Permite atualizar o status isAdmin
      if (typeof isAdmin === 'boolean') {
        dataToUpdate.isAdmin = isAdmin;
      }

      const updatedUser = await prisma.usuario.update({
        where: { id }, // Busca o usuário pelo ID para atualizar
        data: dataToUpdate, // Dados a serem atualizados
        select: { // Seleciona os campos a serem retornados
          id: true,
          nome: true,
          email: true,
          isAdmin: true, // Inclui o campo isAdmin
          createdAt: true,
          updatedAt: true,
        },
      });
      res.status(200).json(updatedUser);
    } catch (error) {
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        return res.status(409).json({ error: 'Email já cadastrado.' });
      }
      if (error.code === 'P2025') {
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
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Usuário não encontrado para deletar.' });
      }
      if (error.code === 'P2003') {
        return res.status(409).json({ error: 'Não é possível deletar o usuário porque ele possui itens ou propostas associadas. Delete primeiro os itens/propostas relacionados.' });
      }
      console.error('Erro ao deletar usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },
};

export default userController;