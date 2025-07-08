// src/routes/index.js

import { Router } from 'express';
// Importe seus controllers
import authController from '../controllers/authController.js';
import userController from '../controllers/userController.js';
import itemController from '../controllers/itemController.js';
import propostaController from '../controllers/propostaController.js';
import itemRoutes from './itemRoutes.js';       // Importa as rotas de item
import propostaRoutes from './propostaRoutes.js'; // Importa as rotas de proposta

// Importe os novos middlewares
import authentication from '../middlewares/authentication.js';
import authorization from '../middlewares/authorization.js';

const routes = Router(); // <--- O SEU ROTEADOR PRINCIPAL SE CHAMA 'routes'

// Rota de Boas-Vindas
routes.get('/', (req, res) => {
  res.send('Bem-vindo à API da Feira de Trocas Comunitária!');
});

// Rota de Login (não precisa de autenticação)
routes.post('/login', authController.login);

// Rotas de Usuário
routes.post('/users', userController.createUser);
routes.get('/users', authentication, userController.getAllUsers);
routes.get('/users/:id', authentication, userController.getUserById);
routes.put('/users/:id', authentication, userController.updateUser);
routes.delete('/users/:id', authentication, authorization, userController.deleteUser);

// Rotas de Item
routes.use('/items', authentication, itemRoutes);

// Rotas de Proposta
routes.use('/proposals', authentication, propostaRoutes);

// Exemplo de rota que só administrador pode acessar (descomente se for usar):
// routes.get('/admin-dashboard', authentication, authorization, (req, res) => {
//   res.json({ message: 'Bem-vindo ao painel de administrador!' });
// });

export { routes }; // Exporta as rotas como um objeto nomeado