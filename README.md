
# 🐱 Neko Downloader

Interface responsiva para solicitar a extração de mídias
públicas do Instagram por meio de uma instância Cobalt autorizada.

## Requisitos

- Node.js 22
- Uma instância Cobalt ativa e autorizada
- Conta no Render ou outro serviço compatível com Node.js

## Estrutura

neko-downloader/
├── public/
│   └── index.html
├── server.js
├── package.json
├── README.md
└── .gitignore

## Executar localmente

1. Instale o Node.js 22.
2. Abra o terminal na pasta do projeto.
3. Execute:

   npm install
   npm start

4. Abra http://localhost:3000 no navegador.

## Configuração no Render

Crie um Web Service conectado ao repositório GitHub.

Build Command:
npm install

Start Command:
npm start

Configure as variáveis de ambiente:

COBALT_API_URL=https://ENDERECO-DA-SUA-INSTANCIA
COBALT_API_KEY=sua-chave-secreta
COBALT_AUTH_SCHEME=Api-Key

Substitua os exemplos pelos dados reais da instância.
Se ela não exigir autenticação, deixe a chave vazia.
Use o esquema de autenticação exigido pelo administrador da API.

COBALT_API_URL deve ser a URL-base HTTPS da instância,
sem o caminho /api/json.

## Diagnóstico

Acesse /api/health no endereço do seu site.

Se "online" for true e "apiConfigured" for true,
o servidor está ativo e a variável de ambiente existe.
Isso não garante que a API esteja acessível.

Se houver erro, consulte os logs do Render.

## Segurança

- Nunca envie chaves secretas para o GitHub.
- Use variáveis de ambiente no Render.
- Não tente acessar publicações privadas ou contornar controles de acesso.
- Baixe somente conteúdo que você tenha autorização para salvar.
