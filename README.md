# Feira de Trocas Comunitária - Backend

Este repositório contém o código-fonte do backend da aplicação "Feira de Trocas Comunitária". Desenvolvido com Node.js, Express e Prisma ORM, esta API é responsável por gerenciar usuários, itens e o fluxo completo de propostas de troca, incluindo autenticação e autorização robustas.

🚀 Tecnologias Utilizadas
Node.js: Ambiente de execução JavaScript assíncrono.

* Express.js: Framework web minimalista e flexível para Node.js, utilizado para construir a API RESTful.

* Prisma ORM: ORM (Object-Relational Mapper) de nova geração, que simplifica a interação com o banco de dados e oferece tipagem forte.

* PostgreSQL: Sistema de gerenciamento de banco de dados relacional robusto e de código aberto.

* JWT (JSON Web Tokens): Padrão seguro para autenticação e autorização de usuários, permitindo a comunicação stateless.

Bcrypt.js: Biblioteca para hash seguro de senhas, protegendo as credenciais dos usuários.

* Dotenv: Módulo para carregar variáveis de ambiente de um arquivo .env para o process.env.

* CORS: Middleware para habilitar o Cross-Origin Resource Sharing, permitindo que aplicações frontend em domínios diferentes se comuniquem com a API.

* Nodemon: Ferramenta que monitora alterações nos arquivos e reinicia automaticamente o servidor durante o desenvolvimento.

✨ Funcionalidades da API
Gestão de Usuários (CRUD)
Criação de Usuários: Permite o registro de novos usuários com hash seguro de senhas.

* Listagem de Usuários: Retorna uma lista de todos os usuários registrados.

* Busca de Usuário por ID: Permite recuperar detalhes de um usuário específico.

* Atualização de Usuários: Permite a modificação dos dados de um usuário existente.

* Deleção de Usuários: Permite a remoção de usuários do sistema.

* Controle de Acesso: Inclui um campo isAdmin para diferenciar usuários comuns de administradores.

Autenticação e Autorização (JWT)
* Login de Usuários: Autentica usuários e emite um token JWT para acesso seguro à API.

* Proteção de Rotas: Middlewares de autenticação (authentication.js) garantem que apenas usuários com tokens válidos possam acessar endpoints protegidos.

* Controle de Privilégios: Middlewares de autorização (authorization.js) restringem o acesso a certas rotas apenas para usuários com privilégios de administrador.

Gestão de Itens (CRUD)
* Criação de Itens: Permite que usuários autenticados adicionem novos itens para troca, associando-os ao seu perfil.

* Listagem de Itens: Retorna uma lista de todos os itens disponíveis no sistema.

* Busca de Item por ID: Permite recuperar detalhes de um item específico.

* Atualização de Itens: Permite que o proprietário do item (ou um administrador) modifique seus detalhes.

* Deleção de Itens: Permite que o proprietário do item (ou um administrador) remova-o do sistema.

* Gestão de Propostas de Troca
* Criação de Propostas: Permite que um usuário ofereça um de seus itens em troca de um item de outro usuário, com validações para garantir a lógica da troca.

* Listagem de Propostas:

* Administradores podem listar todas as propostas no sistema.

* Usuários comuns podem listar apenas as propostas que fizeram ou que receberam para seus itens (isMyProposal=true).

* Busca de Proposta por ID: Permite recuperar detalhes de uma proposta específica, com controle de acesso para ofertantes, donos de itens desejados e administradores.

* Aceitação de Propostas: Permite que o dono do item desejado aceite uma proposta, atualizando o status da proposta e marcando os itens envolvidos como indisponíveis para futuras trocas (utiliza transações de banco de dados).

* Rejeição de Propostas: Permite que o dono do item desejado rejeite uma proposta.

* Deleção de Propostas: Permite que o ofertante ou um administrador remova uma proposta do sistema.

⚙️ Configuração e Execução
Pré-requisitos
* Node.js (versão 18 ou superior recomendada)

* npm (Node Package Manager)

* PostgreSQL (servidor de banco de dados)

1. Instalação
*Clone o repositório:

Bash

git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
cd feira-trocas-backend
(Substitua SEU_USUARIO e SEU_REPOSITORIO pela sua URL real do GitHub).

2. Instale as dependências:

Bash

npm install
3. Configuração do Banco de Dados e Variáveis de Ambiente:

* Crie um arquivo .env na raiz do projeto.

* Adicione as seguintes variáveis, substituindo pelos seus dados do PostgreSQL e gerando uma chave secreta forte para o JWT:

Snippet de código

DATABASE_URL="postgresql://seu_usuario_db:sua_senha_db@localhost:5432/seu_banco_de_dados?schema=public"
SECRET_KEY_JWT="SUA_CHAVE_SECRETA_MUITO_LONGA_E_ALEATORIA_AQUI"
* Para gerar uma SECRET_KEY_JWT, você pode usar node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" no seu terminal.

4. Sincronizar o Schema do Prisma com o Banco de Dados:

* Este comando irá criar as tabelas no seu banco de dados com base no schema.prisma. ATENÇÃO: Este comando irá apagar todos os dados existentes no banco de dados se houver algum conflito ou se for forçado.

Bash

npx prisma migrate reset --force
Execução
Para iniciar o servidor em modo de desenvolvimento (com nodemon para reinício automático):

Bash

npm start
O servidor estará rodando em http://localhost:8080.

🧪 Como Testar a API (Usando Postman)
Com o servidor rodando, você pode usar o Postman (ou outra ferramenta de sua preferência) para testar os endpoints.

Fluxo Básico de Teste
1. Criar Usuários:

* POST /users

* Body: {"nome": "Nome", "email": "email@example.com", "senha": "senha123", "isAdmin": false}

* Crie pelo menos dois usuários (ex: "Marcos Teste" e "Bruno Teste"). Anote seus IDs.

2. Fazer Login (Obter Token JWT):

* POST /login

* Body: {"email": "email@example.com", "senha": "senha123"}

* Anote o token retornado. Você precisará dele para todas as requisições protegidas.

3. Criar Itens:

* POST /items

* Headers: Authorization: Bearer [SEU_TOKEN_JWT]

* Body: {"nome": "Nome do Item", "descricao": "Descricao", "categoria": "Categoria", "disponivelParaTroca": true}

* Crie um item para cada usuário. Anote os IDs dos itens.

4. Criar Proposta de Troca:

* POST /proposals

* Headers: Authorization: Bearer [TOKEN_DO_USUARIO_OFERTANTE]

* Body: {"itemOfertadoId": "[ID_DO_ITEM_DO_OFERTANTE]", "itemDesejadoId": "[ID_DO_ITEM_DESEJADO]"}

5. Listar "Minhas Propostas":

* GET /proposals?isMyProposal=true

* Headers: Authorization: Bearer [SEU_TOKEN_JWT]

6. Buscar Proposta por ID:

* GET /proposals/[ID_DA_PROPOSTA]

* Headers: Authorization: Bearer [SEU_TOKEN_JWT]

7. Aceitar Proposta:

* PUT /proposals/[ID_DA_PROPOSTA]/accept

* Headers: Authorization: Bearer [TOKEN_DO_DONO_DO_ITEM_DESEJADO]

* Body: {}

8. Rejeitar Proposta:

* PUT /proposals/[ID_DA_PROPOSTA]/reject

* Headers: Authorization: Bearer [TOKEN_DO_DONO_DO_ITEM_DESEJADO]

* Body: {}

9. Deletar Proposta:

* DELETE /proposals/[ID_DA_PROPOSTA]

* Headers: Authorization: Bearer [TOKEN_DO_USUARIO_OFERTANTE_OU_ADMIN]

🤝 Contribuição
Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

📄 Licença
Este projeto está licenciado sob a licença ISC.
