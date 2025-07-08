// src/middlewares/authorization.js

export default function authorization(request, response, next) {
 
  if (!request.isAdmin) {
    return response.status(403).json({ message: 'Acesso proibido. Requer privilégios de administrador.' });
  }

  // Se for administrador, permite que a requisição continue
  return next();
}