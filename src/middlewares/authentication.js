// src/middlewares/authentication.js

// Removida a importação de 'decode' pois não é utilizada e corrigido o erro de digitação na mensagem.
import jwt from 'jsonwebtoken'; // <--- CORRIGIDO: Removido ', { decode }' da importação

export default function authentication(request, response, next) {
    const { authorization } = request.headers;

    // 1. Verificar se o cabeçalho de autorização existe
    if (!authorization) {
        return response.status(401).json({ message: 'Token de autorização ausente.' });
    }

    // 2. Extrair o token (remover "Bearer ")
    const token = authorization.replace('Bearer ', '').trim();

    try {
        // 3. Verificar o token usando a chave secreta
        const decoded = jwt.verify(token, process.env.SECRET_KEY_JWT);

        // 4. Anexar as informações do usuário (do token) ao objeto request
        // Isso permite que você acesse userId e isAdmin nas rotas protegidas
        request.userId = decoded.userId;
        request.isAdmin = decoded.isAdmin;
        request.userEmail = decoded.email; // Opcional, se você adicionou o email ao token

        // 5. Chamar o próximo middleware ou a função da rota
        return next();
    } catch (error) {
        // Lidar com erros de token inválido (expirado, malformado, etc.)
        if (error.name === 'TokenExpiredError') {
            return response.status(401).json({ message: 'Token de autenticação expirado.' });
        }
        // <--- CORRIGIDO: Erro de digitação na mensagem 'inálido' para 'inválido'
        return response.status(401).json({ message: 'Token de autenticação inválido.' }); 
    }
}