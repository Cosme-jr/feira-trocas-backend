// src/controllers/itemController.js

import prisma from '../db.js'; // Importa a instância do Prisma

class ItemController {
  // Criar um novo item
  async createItem(req, res) {
    const { nome, descricao, categoria, imagemUrl, disponivelParaTroca } = req.body;
    // O ID do usuário vem do token JWT, que é anexado ao request pelo middleware de autenticação
    const usuarioId = req.userId; 

    // Validação básica
    if (!nome || !categoria || !usuarioId) {
      return res.status(400).json({ message: 'Nome, categoria e ID do usuário são obrigatórios.' });
    }

    try {
      const newItem = await prisma.item.create({
        data: {
          nome,
          descricao,
          categoria,
          imagemUrl,
          disponivelParaTroca: disponivelParaTroca !== undefined ? disponivelParaTroca : true,
          usuario: {
            connect: { id: usuarioId }, // Conecta o item ao usuário que o criou
          },
        },
        select: {
          id: true,
          nome: true,
          descricao: true,
          categoria: true,
          imagemUrl: true,
          disponivelParaTroca: true,
          usuarioId: true, // Adiciona o ID do usuário na resposta
          createdAt: true,
          updatedAt: true,
        },
      });
      return res.status(201).json(newItem);
    } catch (error) {
      console.error('Erro ao criar item:', error);
      return res.status(500).json({ message: 'Erro interno do servidor ao criar item.' });
    }
  }

  // Listar todos os itens
  async getAllItems(req, res) {
    try {
      const items = await prisma.item.findMany({
        select: {
          id: true,
          nome: true,
          descricao: true,
          categoria: true,
          imagemUrl: true,
          disponivelParaTroca: true,
          usuarioId: true,
          usuario: { // Inclui informações do usuário dono do item
            select: { id: true, nome: true, email: true },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
      return res.status(200).json(items);
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
      return res.status(500).json({ message: 'Erro interno do servidor ao buscar itens.' });
    }
  }

  // Buscar item por ID
  async getItemById(req, res) {
    const { id } = req.params;

    try {
      const item = await prisma.item.findUnique({
        where: { id },
        select: {
          id: true,
          nome: true,
          descricao: true,
          categoria: true,
          imagemUrl: true,
          disponivelParaTroca: true,
          usuarioId: true,
          usuario: {
            select: { id: true, nome: true, email: true },
          },
          createdAt: true,
          updatedAt: true,
          propostasOfertadas: true, // Opcional: incluir propostas onde este item foi ofertado
          propostasDesejadas: true, // Opcional: incluir propostas onde este item foi desejado
        },
      });

      if (!item) {
        return res.status(404).json({ message: 'Item não encontrado.' });
      }
      return res.status(200).json(item);
    } catch (error) {
      console.error('Erro ao buscar item por ID:', error);
      return res.status(500).json({ message: 'Erro interno do servidor ao buscar item.' });
    }
  }

  // Atualizar um item existente
  async updateItem(req, res) {
    const { id } = req.params;
    const { nome, descricao, categoria, imagemUrl, disponivelParaTroca } = req.body;
    const usuarioId = req.userId; // ID do usuário autenticado

    try {
      // 1. Verificar se o item existe e se o usuário autenticado é o dono
      const existingItem = await prisma.item.findUnique({
        where: { id },
      });

      if (!existingItem) {
        return res.status(404).json({ message: 'Item não encontrado para atualização.' });
      }

      if (existingItem.usuarioId !== usuarioId) {
        return res.status(403).json({ message: 'Você não tem permissão para atualizar este item.' });
      }

      // 2. Atualizar o item
      const updatedItem = await prisma.item.update({
        where: { id },
        data: {
          nome,
          descricao,
          categoria,
          imagemUrl,
          disponivelParaTroca,
        },
        select: {
          id: true,
          nome: true,
          descricao: true,
          categoria: true,
          imagemUrl: true,
          disponivelParaTroca: true,
          usuarioId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return res.status(200).json(updatedItem);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Item não encontrado para atualização.' });
      }
      console.error('Erro ao atualizar item:', error);
      return res.status(500).json({ message: 'Erro interno do servidor ao atualizar item.' });
    }
  }

  // Deletar um item
  async deleteItem(req, res) {
    const { id } = req.params;
    const usuarioId = req.userId; // ID do usuário autenticado

    try {
      // 1. Verificar se o item existe e se o usuário autenticado é o dono
      const existingItem = await prisma.item.findUnique({
        where: { id },
      });

      if (!existingItem) {
        return res.status(404).json({ message: 'Item não encontrado para exclusão.' });
      }

      // Além de verificar se é o dono, um administrador também pode deletar

      // Para este controller, vamos exigir que seja o dono OU um admin.
      if (existingItem.usuarioId !== usuarioId && !req.isAdmin) { // req.isAdmin é setado pelo middleware de autenticação
        return res.status(403).json({ message: 'Você não tem permissão para deletar este item.' });
      }


      // 2. Deletar o item
      await prisma.item.delete({
        where: { id },
      });
      return res.status(204).send(); // 204 No Content para exclusão bem-sucedida
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Item não encontrado para exclusão.' });
      }
      // Se houver propostas associadas, o Prisma pode retornar um erro de Foreign Key
      if (error.code === 'P2003') { 
        return res.status(409).json({ message: 'Não é possível deletar o item, pois ele está associado a uma ou mais propostas de troca.' });
      }
      console.error('Erro ao deletar item:', error);
      return res.status(500).json({ message: 'Erro interno do servidor ao deletar item.' });
    }
  }
}

export default new ItemController();