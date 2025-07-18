// src/routes/userRoutes.js

import express from 'express';
import userController from '../controllers/userController.js'; // Adicione .js e use default import

const router = express.Router();

router.post('/', userController.createUser); 
router.get('/', userController.getAllUsers); 
router.get('/:id', userController.getUserById); 
router.put('/:id', userController.updateUser); 
router.delete('/:id', userController.deleteUser); 

export default router; // Use default export