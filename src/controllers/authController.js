import bcrypt  from "bcryptjs"; 
import jwt from 'jsonwebtoken'
import prisma from '../db.js'// Importa a instância do Prisma do seu db.js

class AuthController {
    async login(request, response){
        const {email,senha} = request.body;
        //1. Validar se email e senha foram fornecidos
        if (!email || !senha) {
            return response.status(400).json({message: 'Email e senha são obrigatórios'});
        }

        try {
            //2. Buscar o usuario pelo email
            const usuario = await prisma.usuario.findUnique({
                where:{
                    email:email,
                },
            });
            //Verificar se o usuario existe
            if(!usuario){
                return response.status(401).json({message: 'Credenciais inválidas.'});
            }

            // 4. Comparar a senha fornecida com o hash da senha armazenada.
            const senhaValida = await bcrypt.compare(senha,usuario.senha);
            if(!senhaValida){
                return response.status(401).json({message:'Credencial inválida'});
            }
            // 5. Gerar o token JWT
            const token = jwt.sign({
                userId: usuario.id,
                isAdmin: usuario.isAdmin,
                email: usuario.email
            }, process.env.SECRET_KEY_JWT,//A chave secreta vem do .env
            {
                expiresIn: '8h'// tempo de espiração do token
            }
            );
            //6. Retornar o token e as informações básicas os usuarios
            return response.status(200).json({
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                isAdmin: usuario.isAdmin,
                token: token,
            });

        }catch (error){
            console.error('Erro no login:', error);
            return response.status(500).json({message: 'Erro interno do servidor.'});
        }
        
    }
}

export default new AuthController();