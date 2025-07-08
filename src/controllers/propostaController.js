// src/controllers/propostaController.js

import prisma from '../db.js'; // Importa a instância do Prisma

class PropostaController {
  // Criar uma nova proposta de troca
  async createProposta(req, res) {
    const { itemOfertadoId, itemDesejadoId } = req.body;
    const ofertanteId = req.userId; // O ID do usuário que faz a proposta (vem do token)

    // 1. Validação básica: IDs são obrigatórios e não podem ser o mesmo item
    if (!itemOfertadoId || !itemDesejadoId) {
      return res.status(400).json({ message: 'IDs do item ofertado e item desejado são obrigatórios.' });
    }
    if (itemOfertadoId === itemDesejadoId) {
      return res.status(400).json({ message: 'Um item não pode ser trocado por si mesmo.' });
    }

    try {
      // 2. Buscar os itens e verificar sua existência e propriedade
      // Usamos prisma.$transaction para garantir que ambas as buscas ocorram com sucesso
      const [itemOfertado, itemDesejado] = await prisma.$transaction([
        prisma.item.findUnique({ where: { id: itemOfertadoId } }),
        prisma.item.findUnique({ where: { id: itemDesejadoId } }),
      ]);

      if (!itemOfertado || !itemDesejado) {
        return res.status(404).json({ message: 'Item ofertado ou item desejado não encontrado.' });
      }

      // 3. Verificar se o usuário ofertante é o dono do item ofertado
      if (itemOfertado.usuarioId !== ofertanteId) {
        return res.status(403).json({ message: 'Você só pode ofertar itens que possui.' });
      }

      // 4. Verificar se o usuário ofertante não está tentando trocar com ele mesmo
      if (itemDesejado.usuarioId === ofertanteId) {
        return res.status(400).json({ message: 'Você não pode fazer uma proposta de troca para seus próprios itens.' });
      }

      // 5. Verificar se os itens estão disponíveis para troca
      if (!itemOfertado.disponivelParaTroca || !itemDesejado.disponivelParaTroca) {
        return res.status(400).json({ message: 'Um ou ambos os itens não estão disponíveis para troca no momento.' });
      }

      // AQUI, OBTENHA O ID DO DONO DO ITEM DESEJADO
      const donoItemDesejadoId = itemDesejado.usuarioId; // O ID do usuário dono do item desejado

      // 6. Criar a proposta no banco de dados
      const newProposta = await prisma.proposta.create({
        data: {
          itemOfertadoId,
          itemDesejadoId,
          ofertanteId,
          donoItemDesejadoId, // <--- ADICIONADO: Novo campo para o ID do dono do item desejado
          status: 'pendente', // Status inicial
        },
        select: { // Seleciona apenas os campos que devem ser retornados na resposta
          id: true,
          status: true,
          createdAt: true,
          itemOfertado: { select: { id: true, nome: true, usuario: { select: { nome: true } } } },
          itemDesejado: { select: { id: true, nome: true, usuario: { select: { nome: true } } } },
          ofertante: { select: { id: true, nome: true } },
          donoItemDesejado: { select: { id: true, nome: true } } // <--- ADICIONADO: Para ver quem é o dono na resposta
        },
      });
      return res.status(201).json(newProposta);

    } catch (error) {
      console.error('Erro detalhado ao criar proposta:', error); // Log detalhado para depuração
      return res.status(500).json({ message: 'Erro interno do servidor ao criar proposta.' });
    }
  }

  // Listar todas as propostas
  async getAllPropostas(req, res) {
    const { status, ofertanteId, itemDesejadoId, isMyProposal } = req.query;
    const userId = req.userId; // ID do usuário autenticado

    const where = {};
    if (status) where.status = status;
    if (ofertanteId) where.ofertanteId = ofertanteId;
    if (itemDesejadoId) where.itemDesejadoId = itemDesejadoId;
    
    // Filtra propostas feitas pelo usuário ou para itens do usuário
    if (isMyProposal === 'true') {
      where.OR = [
        { ofertanteId: userId },
        { itemDesejado: { usuarioId: userId } }
      ];
    }
    
    // Regra de Autorização: Usuário normal só vê suas propostas, Admin vê todas
    if (!req.isAdmin && !isMyProposal) {
       return res.status(403).json({ message: 'Acesso proibido. Para listar todas as propostas, você deve ser administrador ou usar o filtro "isMyProposal=true".' });
    }

    try {
      const propostas = await prisma.proposta.findMany({
        where,
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          itemOfertado: {
            select: { id: true, nome: true, categoria: true, usuario: { select: { id: true, nome: true } } },
          },
          itemDesejado: {
            select: { id: true, nome: true, categoria: true, usuario: { select: { id: true, nome: true } } },
          },
          ofertante: {
            select: { id: true, nome: true, email: true },
          },
          donoItemDesejado: { // Incluído para visualização
            select: { id: true, nome: true, email: true }
          }
        },
      });
      return res.status(200).json(propostas);
    } catch (error) {
      console.error('Erro ao buscar propostas:', error);
      return res.status(500).json({ message: 'Erro interno do servidor ao buscar propostas.' });
    }
  }

  // Buscar proposta por ID
  async getPropostaById(req, res) {
    const { id } = req.params;
    const userId = req.userId;

    try {
      const proposta = await prisma.proposta.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          itemOfertado: {
            select: { id: true, nome: true, categoria: true, usuarioId: true, usuario: { select: { nome: true } } },
          },
          itemDesejado: {
            select: { id: true, nome: true, categoria: true, usuarioId: true, usuario: { select: { nome: true } } },
          },
          ofertante: {
            select: { id: true, nome: true, email: true },
          },
          donoItemDesejado: { // Incluído para visualização
            select: { id: true, nome: true, email: true }
          }
        },
      });

      if (!proposta) {
        return res.status(404).json({ message: 'Proposta não encontrada.' });
      }

      // Autorização: Apenas o ofertante, o dono do item desejado ou um admin podem ver
      if (proposta.ofertante.id !== userId && proposta.itemDesejado.usuarioId !== userId && !req.isAdmin) {
        return res.status(403).json({ message: 'Você não tem permissão para visualizar esta proposta.' });
      }

      return res.status(200).json(proposta);
    } catch (error) {
      console.error('Erro ao buscar proposta por ID:', error);
      return res.status(500).json({ message: 'Erro interno do servidor ao buscar proposta.' });
    }
  }

  // Aceitar uma proposta (somente o dono do item desejado)
  async acceptProposta(req, res) {
    const { id } = req.params;
    const userId = req.userId; // ID do usuário autenticado

    try {
      // 1. Buscar a proposta e incluir os itens envolvidos
      const proposta = await prisma.proposta.findUnique({
        where: { id },
        include: {
          itemOfertado: true,
          itemDesejado: true,
        },
      });

      if (!proposta) {
        return res.status(404).json({ message: 'Proposta não encontrada.' });
      }

      // 2. Verificar se a proposta está pendente
      if (proposta.status !== 'pendente') {
        return res.status(400).json({ message: `Proposta já está ${proposta.status}. Não pode ser aceita.` });
      }

      // 3. Verificar se o usuário autenticado é o dono do item desejado
      if (proposta.itemDesejado.usuarioId !== userId) {
        return res.status(403).json({ message: 'Você não tem permissão para aceitar esta proposta.' });
      }

      // 4. Realizar a transação para aceitar a proposta e atualizar os itens
      const acceptedProposta = await prisma.$transaction(async (prismaTx) => {
        // Atualizar o status da proposta para 'aceita'
        const updatedProposta = await prismaTx.proposta.update({
          where: { id },
          data: { status: 'aceita' },
        });

        // Marcar os itens envolvidos como indisponíveis para troca
        await prismaTx.item.update({
          where: { id: proposta.itemOfertadoId },
          data: { disponivelParaTroca: false },
        });
        await prismaTx.item.update({
          where: { id: proposta.itemDesejadoId },
          data: { disponivelParaTroca: false },
        });

        // TO-DO: Opcional: Rejeitar automaticamente outras propostas para esses itens ou notificar outros ofertantes.
        // Isso pode ser implementado em uma fase futura.

        return updatedProposta;
      });

      return res.status(200).json({ message: 'Proposta aceita com sucesso!', proposta: acceptedProposta });

    } catch (error) {
      console.error('Erro ao aceitar proposta:', error);
      if (error.code === 'P2025') { // Erro do Prisma: registro não encontrado
        return res.status(404).json({ message: 'Proposta não encontrada ou já processada.' });
      }
      return res.status(500).json({ message: 'Erro interno do servidor ao aceitar proposta.' });
    }
  }

  // Rejeitar uma proposta (somente o dono do item desejado)
  async rejectProposta(req, res) {
    const { id } = req.params;
    const userId = req.userId; // ID do usuário autenticado

    try {
      // 1. Buscar a proposta e incluir o item desejado
      const proposta = await prisma.proposta.findUnique({
        where: { id },
        include: {
          itemDesejado: true,
        },
      });

      if (!proposta) {
        return res.status(404).json({ message: 'Proposta não encontrada.' });
      }

      // 2. Verificar se a proposta está pendente
      if (proposta.status !== 'pendente') {
        return res.status(400).json({ message: `Proposta já está ${proposta.status}. Não pode ser rejeitada.` });
      }

      // 3. Verificar se o usuário autenticado é o dono do item desejado
      if (proposta.itemDesejado.usuarioId !== userId) {
        return res.status(403).json({ message: 'Você não tem permissão para rejeitar esta proposta.' });
      }

      // 4. Atualizar o status da proposta para 'rejeitada'
      const rejectedProposta = await prisma.proposta.update({
        where: { id },
        data: { status: 'rejeitada' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(200).json({ message: 'Proposta rejeitada com sucesso!', proposta: rejectedProposta });

    } catch (error) {
      console.error('Erro ao rejeitar proposta:', error);
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Proposta não encontrada.' });
      }
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }

  // Deletar uma proposta (apenas o ofertante ou um admin)
  async deleteProposta(req, res) {
    const { id } = req.params;
    const userId = req.userId; // ID do usuário autenticado

    try {
      // 1. Buscar a proposta para verificar permissões
      const proposta = await prisma.proposta.findUnique({
        where: { id },
        // Inclui o ofertanteId e o usuarioId do dono do item desejado para a verificação de permissão
        select: { ofertanteId: true, itemDesejado: { select: { usuarioId: true } } } 
      });

      if (!proposta) {
        return res.status(404).json({ message: 'Proposta não encontrada.' });
      }

      // Autorização: Apenas o ofertante OU o dono do item desejado OU um admin pode deletar
      // Essa lógica de permissão pode ser ajustada conforme a regra de negócio (ex: só pode deletar se estiver pendente)
      if (proposta.ofertanteId !== userId && proposta.itemDesejado.usuarioId !== userId && !req.isAdmin) {
        return res.status(403).json({ message: 'Você não tem permissão para deletar esta proposta.' });
      }

      // 2. Deletar a proposta
      await prisma.proposta.delete({ where: { id } });
      return res.status(204).send(); // 204 No Content para exclusão bem-sucedida

    } catch (error) {
      console.error('Erro ao deletar proposta:', error);
      if (error.code === 'P2025') { // Erro do Prisma: registro não encontrado
        return res.status(404).json({ message: 'Proposta não encontrada para exclusão.' });
      }
      return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
  }
}

export default new PropostaController();
