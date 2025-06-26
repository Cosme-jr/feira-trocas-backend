// src/routes/userRoutes.js

const express = require('express');
const userController = require('../controllers/userController'); // Ajuste o caminho relativo para o controller

const router = express.Router();

// Rotas para a entidade Usuario
router.post('/', userController.createUser);        // POST /api/users (Criar novo usuário)
router.get('/', userController.getAllUsers);        // GET /api/users (Listar todos os usuários)
router.get('/:id', userController.getUserById);     // GET /api/users/:id (Buscar usuário por ID)
router.put('/:id', userController.updateUser);      // PUT /api/users/:id (Atualizar usuário)
router.delete('/:id', userController.deleteUser);   // DELETE /api/users/:id (Deletar usuário)

module.exports = router;