# Voyage API

Servidor (Node + Express) e banco de dados (SQLite) do app Voyage.

```bash
npm install
npm start                # http://localhost:3333/api/health   (o .env é opcional em desenvolvimento)
npm test                 # testes (Node 22.13+)
# produção: copie .env.example para .env e troque o JWT_SECRET
```

Conta de teste: `demo` / `123456`. O passo a passo completo (inclusive como adaptar o app) está em `GUIA-API-E-BANCO.md`.

```
src/
  index.js            liga tudo (banco, frota simulada, servidor)
  app.js              Express: CORS, JSON, autenticação (JWT), erros
  config.js           variáveis do .env
  schema.js           tabelas e migrações
  seed.js, seedData.js   dados iniciais (linhas, paradas, passes, conta demo)
  security.js         hash de senha (scrypt)
  routes/index.js     tabela de endpoints
  services/           REGRAS DE NEGÓCIO (cartão, recarga, passes, embarque, avisos, favoritos, frota)
test/                 testes das regras e das rotas
```
