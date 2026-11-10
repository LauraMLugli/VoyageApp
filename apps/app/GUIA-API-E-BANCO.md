# Voyage: adicionando banco de dados e API

Antes, o app guardava tudo no próprio celular (AsyncStorage) e simulava ônibus, saldo e login localmente.
Agora existe um **servidor (API)** com **banco de dados SQLite**, e o app apenas conversa com ele.

```
 App Expo (celular)  ──HTTP/JSON──▶  API Node + Express  ──▶  Banco SQLite (arquivo)
 só mostra e envia ações             regras: saldo, passes,     usuários, cartões, saldo,
                                     tarifas, login, ônibus     recargas, passes, histórico,
                                                                linhas, paradas, ônibus
```

Você recebeu duas pastas, já na estrutura do seu repositório (`api/` e `mobile/`):

| Pasta | O que é |
|---|---|
| `voyage-api/` | **Novo.** Servidor + banco de dados do Voyage. Fica ao lado da sua `api/` de aula (não mexe nela). |
| `mobile/` | O app, já adaptado: é só copiar por cima do seu `mobile/` (os arquivos vão em `mobile/src/...`). |

> **O que eu testei:** as regras do servidor e todas as rotas (16 testes automatizados, passando) e a integração
> dos dados da API com o código do app. **O que eu não consegui rodar aqui:** o servidor Express de verdade
> (as bibliotecas não instalam no meu ambiente) e o app no celular. O trecho que liga o Express às rotas tem
> poucas linhas (`src/app.js`), mas é por ele que um eventual erro apareceria. Se acontecer, me envie a mensagem.

---

## Passo 1. Pré-requisitos

- **Node.js 22.13 ou mais novo** (o 22 LTS ou 24 servem). Confira com `node -v`. Com isso a API usa o SQLite que já vem dentro do Node, então **não há módulo nativo para compilar**.
- O projeto Expo que você já tem.

## Passo 2. Colocar a pasta da API no lugar certo

Coloque `voyage-api/` na **raiz do repositório**, ao lado de `api/` (a de aula) e `mobile/`. Não coloque dentro do `mobile/`:
o Expo tentaria observar o `node_modules` do servidor e ficaria lento.

```
VoyageApp/
├── api/           (sua API de aula: NÃO é a do Voyage, deixe como está)
├── voyage-api/    (novo: API e banco do Voyage)
└── mobile/        (app Expo)
```

> **Atenção:** são duas APIs diferentes. O app só funciona com a `voyage-api`. A `api/` de aula tem outras rotas
> (`/auth/login` sem `/api`, sem o usuário `demo`). Se ela estiver ligada no lugar da `voyage-api`, o login da demo dá erro.
> A tela de login mostra "Este endereço não é a API do Voyage" nesse caso.

## Passo 3. Instalar e ligar o servidor

```bash
cd voyage-api
npm install
```

O arquivo `.env` é **opcional em desenvolvimento** (sem ele, usa valores padrão e a porta 3333). Para produção,
crie-o a partir do modelo e troque o `JWT_SECRET` por um texto longo e aleatório:

- Mac/Linux: `cp .env.example .env`
- Windows (PowerShell): `copy .env.example .env`

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Ligue o servidor:

```bash
npm start          # ou: npm run dev  (reinicia sozinho quando você edita o código)
```

Você deve ver algo assim:

```
API Voyage rodando na porta 3333
  Neste computador:  http://localhost:3333/api/health
  Na rede (celular): http://192.168.0.10:3333/api   <- use este endereço no app
  Conta de teste:    usuário demo / senha 123456
```

Na primeira execução o servidor cria sozinho o arquivo do banco (`data/voyage.db`), as tabelas, as linhas, as
paradas, os ônibus, o catálogo de passes e a conta `demo`.

**Teste rápido:** abra `http://localhost:3333/api/health` no navegador. Deve aparecer `{"ok":true,...}`.

> Ao iniciar no Node 22 aparece o aviso "SQLite is an experimental feature". É normal, pode ignorar.
> Se o seu Node for mais antigo que 22.13, atualize-o. (O `better-sqlite3` está como plano B opcional, mas o caminho
> recomendado é atualizar o Node.)

## Passo 4. Testar a API sem o app (opcional, mas recomendado)

```bash
# login (guarde o "token" da resposta)
curl -X POST http://localhost:3333/api/auth/login -H "Content-Type: application/json" \
     -d '{"login":"demo","senha":"123456"}'

# estado da conta (troque SEU_TOKEN)
curl http://localhost:3333/api/me/state -H "Authorization: Bearer SEU_TOKEN"

# ônibus em tempo real
curl http://localhost:3333/api/buses
```

Para rodar os testes automáticos (precisam do Node 22 ou mais novo, pois usam o SQLite embutido dele):

```bash
npm test
```

## Passo 5. Adaptar o app Expo

### 5.1 Copie os arquivos

Copie a pasta `mobile/` deste pacote por cima da `mobile/` do seu repositório. Os arquivos vão para
`mobile/src/app`, `mobile/src/components` e `mobile/src/lib` (o atalho `@/` do seu `tsconfig.json` aponta para `src/`).
Os arquivos **novos** são `lib/api.ts` e `components/Dialog.tsx`; os outros **substituem** os que você já tinha.
Se o `mobile/assets/images/voyage-logo.png` ainda não existir no seu projeto, ele vem no pacote (o app usa esse logo).

| Arquivo | O que mudou | Por quê |
|---|---|---|
| `lib/api.ts` (novo) | Cliente HTTP: endereço da API, token no cabeçalho, erros em português | Um único lugar que fala com o servidor |
| `lib/authContext.tsx` | Login, cadastro e edição do perfil chamam a API. Guarda só o **token**, nunca a senha | Segurança e conta única em qualquer aparelho |
| `lib/voyageContext.tsx` | Saldo, cartão, passes, histórico, avisos e favoritos vêm da API. As ações (recarregar, comprar, embarcar) viraram `async` | O banco passa a ser a fonte da verdade |
| `lib/fleet.tsx` | Busca linhas/paradas e a posição dos ônibus na API (a cada 5 s) e move suavemente entre uma consulta e outra | Posição real vinda do servidor |
| `lib/transit.ts` | Ganhou `applyTransit()`, que troca os dados embutidos pelos da API. Os embutidos viram "plano B" sem internet | Linhas e paradas editáveis pelo banco |
| `app/login.tsx`, `app/register.tsx` | Mostram a mensagem de erro que vem da API; o cadastro já entra logado | Login real |
| `components/Dialog.tsx` (novo) e `app/_layout.tsx` | Caixa de diálogo própria do app (confirmar e avisar), no lugar do `Alert.alert` | O `Alert.alert` **não aparece no navegador**: "Sair", "Comprar passe", "Embarcar" pareciam não fazer nada |
| `app/login.tsx` | Mostra qual servidor o app está usando e se ele respondeu (bolinha verde/vermelha) | Descobrir na hora se o problema é o servidor |
| `app/(auth)/_layout.tsx` | Nova tela "Servidor indisponível" com botão *Tentar de novo* | App não fica preso se a API cair |
| `app/(auth)/(tabs)/cartao.tsx`, `passes.tsx`, `mapa.tsx`, `perfil.tsx` | Usam `await` nas ações e mostram erros da API; os passes vêm do catálogo do banco | Ações agora são assíncronas |
| `.env.example` (novo) | Modelo do endereço da API | Veja o próximo passo |

As telas `index`, `recarga`, `historico`, `notificacoes`, `favoritos` e `planejar` **não precisaram mudar**:
o `useVoyage()` continua entregando os mesmos dados, só que agora vindos do servidor.

### 5.2 Onde está a API (normalmente você não precisa fazer nada)

O app **descobre sozinho** o endereço do computador que roda o Expo e usa a porta 3333. Funciona no celular
(Expo Go), no emulador e no navegador. A tela de login mostra o endereço usado e se o servidor respondeu.

Só crie o `.env` do app (`mobile/.env`, copie o `.env.example`) se a detecção não servir, por exemplo quando a API
roda em **outro computador**, ou em produção:

```
EXPO_PUBLIC_API_URL=http://192.168.0.10:3333/api
```

Depois **reinicie o Expo limpando o cache** (o `.env` só é lido na inicialização): `npx expo start -c`.
O celular e o PC precisam estar no **mesmo Wi-Fi**.

> O Windows costuma bloquear a porta. Se o celular não conectar, libere a porta **3333** no Firewall (ou, ao
> aparecer o aviso do Firewall na primeira execução do Node, clique em *Permitir acesso*).

### 5.3 Roteiro de teste

1. Entre com `demo` / `123456`. Devem aparecer saldo de R$ 42,80, um passe diário, histórico e favoritos.
2. Abra o **Mapa**. Os ônibus agora andam conforme o servidor. Escolha uma linha e toque em *Embarcar*: o saldo diminui (ou usa o passe).
3. Saia e crie uma **conta nova**. Ela começa com saldo zero e o aviso de saldo baixo.
4. Aba **Cartão** → *Gerar cartão virtual* → **Recarregar** → compre um **passe** → embarque.
5. Feche o app, abra de novo e entre com outro aparelho/emulador usando a mesma conta: os dados estão lá, porque agora ficam no banco.

## Passo 6. Ver o que está no banco

O banco é o arquivo `voyage-api/data/voyage.db`. Abra com o **DB Browser for SQLite** (gratuito) ou pelo terminal:

```bash
sqlite3 data/voyage.db "SELECT usuario, balance_cents/100.0 AS saldo FROM users;"
sqlite3 data/voyage.db "SELECT type, title, amount_cents/100.0 FROM transactions ORDER BY created_at DESC LIMIT 10;"
```

Para zerar tudo e recomeçar: pare o servidor, rode `npm run reset-db` e inicie de novo.

---

## Referência da API

Base: `http://SEU-IP:3333/api`. Corpo e respostas em JSON. Rotas marcadas com 🔒 exigem o cabeçalho
`Authorization: Bearer <token>`. Erros voltam como `{ "error": "mensagem em português" }`
(400 dados inválidos, 401 sem login, 402 pagamento recusado, 404 não encontrado, 409 conflito, 422 regra de negócio, 429 muitas tentativas).

| Método e rota | Faz o quê |
|---|---|
| `GET /health` | Verifica se o servidor está no ar |
| `POST /auth/register` | Cria conta `{name, usuario, email, senha}` → `{token, user}` |
| `POST /auth/login` | Entra `{login, senha}` (usuário ou e-mail) → `{token, user}` |
| `GET /me` 🔒 · `PATCH /me` 🔒 | Dados pessoais · alterar `{name?, email?}` |
| `GET /me/state` 🔒 | **Foto completa da conta:** saldo, cartão, passes, histórico, avisos, favoritos |
| `PUT /card` 🔒 | Vincular cartão `{number, holder, type}` |
| `POST /card/virtual` 🔒 | Gerar cartão virtual `{holder, type}` |
| `DELETE /card` 🔒 | Desvincular cartão |
| `POST /recharges` 🔒 · `GET /recharges` 🔒 | Recarregar `{amount, method}` · histórico de recargas |
| `GET /passes/catalog` | Passes à venda (preços vêm do banco) |
| `GET /passes` 🔒 · `POST /passes` 🔒 | Meus passes · comprar `{passId}` |
| `POST /trips` 🔒 | Embarcar `{lineId}`: usa passe válido ou cobra a tarifa |
| `GET /transactions?type=&limit=` 🔒 | Histórico (recarga, passe, viagem) |
| `GET /notifications` 🔒 · `POST /notifications/read-all` 🔒 | Avisos · marcar como lidos |
| `GET /favorites` 🔒 | Linhas e rotas favoritas |
| `PUT` / `DELETE /favorites/lines/:lineId` 🔒 | Salvar / remover linha favorita |
| `POST /favorites/routes` 🔒 · `DELETE /favorites/routes/:id` 🔒 | Salvar `{originId, destId}` / remover rota |
| `GET /transit` | Paradas e linhas |
| `GET /buses?lineId=` | Posição dos ônibus (`dist`, `dir`, `speed`) |

As ações (`/card`, `/recharges`, `/passes`, `/trips`, favoritos, avisos) respondem `{ message, state }`, em que
`state` é a mesma foto de `GET /me/state` **já atualizada**. Por isso o app não precisa fazer uma segunda consulta.

## Tabelas do banco

| Tabela | Guarda |
|---|---|
| `users` | Nome, usuário, e-mail, **hash** da senha e saldo (em centavos) |
| `cards` | Cartão do usuário (1 por conta): número, titular, tipo, situação |
| `pass_catalog` | Passes à venda: tipo, abrangência, preço, duração |
| `user_passes` | Passes comprados: validade, viagens restantes |
| `transactions` | Histórico: recargas, compras de passe e viagens |
| `notifications` | Avisos (saldo baixo, recarga, passe vencendo, transporte) |
| `stops`, `lines`, `line_stops` | Paradas, linhas e a ordem das paradas em cada linha |
| `buses` | Ônibus e a posição atual (gravada a cada 10 s) |
| `favorite_lines`, `favorite_routes` | Favoritos de cada usuário |

Dinheiro é guardado em **centavos** (inteiros) para nunca ter erro de arredondamento, e há uma regra no próprio
banco (`CHECK balance_cents >= 0`) que impede saldo negativo mesmo se algum código errar.

---

## Como evoluir (receitas)

**Adicionar uma linha ou parada:** insira no banco e reinicie o servidor. O app pega sozinho no próximo uso.
```sql
INSERT INTO stops (id, name, x, y) VALUES ('praia', 'Praça da Fonte', 150, 300);
INSERT INTO lines (id, code, name, kind, color, fare_cents) VALUES ('909','909','Terminal · Praça da Fonte','urbana','#0951A0',550);
INSERT INTO line_stops (line_id, position, stop_id) VALUES ('909',0,'term'),('909',1,'praia');
INSERT INTO buses (id, line_id, dist, dir, speed, updated_at) VALUES ('VY-909-01','909',10,1,16,0);
```

**Alterar o banco (nova coluna, nova tabela):** não edite o que já existe. Adicione **uma nova string no fim** de
`MIGRATIONS` em `src/schema.js` (por exemplo, um `ALTER TABLE`). O servidor aplica na próxima inicialização, sem perder dados.

**Criar um endpoint novo:** (1) escreva a função de regra em `src/services/`; (2) adicione uma entrada em
`src/routes/index.js`; (3) chame pelo app com `api.get/post(...)` em `lib/`. Escreva um teste em `test/`.

**Pagamento de verdade (Pix etc.):** troque `processPayment` em `src/services/payments.js` por uma chamada ao
provedor (Mercado Pago, Stripe, Pagar.me...). O ideal em produção é: criar a cobrança, devolver o QR Code ao app e
**só creditar o saldo quando o provedor avisar por webhook** (uma rota nova, pública, que valida a assinatura do provedor).

**GPS real dos ônibus:** crie uma rota `POST /buses/:id/position` (protegida por uma chave só dos veículos) que
atualize `dist` na tabela `buses` e pare o `FleetSimulator` no `src/index.js`. O app não muda.

**Notificações com o app fechado:** hoje os avisos aparecem dentro do app. Para push de verdade, use `expo-notifications`
e uma tabela com o token de cada aparelho.

**Trocar SQLite por PostgreSQL:** as regras estão isoladas em `src/services/` e usam SQL simples. A troca fica
concentrada na camada `db`, adaptando as consultas.

## Colocando no ar (produção)

1. Hospede em um serviço com **disco persistente** (Render, Railway, Fly.io ou um VPS), pois o SQLite é um arquivo. Aponte `DB_PATH` para o disco.
2. Use **HTTPS**. Em builds de produção, o Android bloqueia `http://` comum.
3. Defina `NODE_ENV=production`, um `JWT_SECRET` forte, `SEED_DEMO=false` e `CORS_ORIGIN` com seus domínios.
4. Faça **backup** do arquivo `.db` periodicamente.
5. No app, aponte `EXPO_PUBLIC_API_URL` para `https://seu-dominio/api` (e gere o build com essa variável).

## Segurança: o que já está e o que falta

Já está: senhas com hash (scrypt) e nunca em texto puro; login por token JWT; consultas SQL parametrizadas (sem
injeção de SQL); cada usuário só acessa os próprios dados; valores e regras validados no servidor; saldo protegido contra
negativo; limite de tentativas de login (10 a cada 15 min).

Falta para produção séria: HTTPS (acima), guardar o token no `expo-secure-store` em vez do AsyncStorage, recuperação de
senha por e-mail, token de renovação (refresh token), idempotência nas recargas (evitar cobrança duplicada) e webhook de pagamento.

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| Botões **Sair**, **Comprar**, **Embarcar** "não fazem nada" (principalmente no navegador) | Era o `Alert.alert`, que não funciona na web. Corrigido com o `Dialog.tsx`: copie os arquivos novos |
| Login da **demo** dá erro | Olhe a barra de status na tela de login. **Vermelha:** a `voyage-api` não está rodando (`npm start` na pasta `voyage-api`) ou o celular está em outro Wi-Fi. **"Não é a API do Voyage":** a `api/` de aula (ou outro programa) está respondendo na porta; pare-a e inicie a `voyage-api` |
| Criar conta não avança | Agora o motivo aparece em vermelho acima do botão (usuário/e-mail já existe, servidor fora do ar...) |
| "Não foi possível conectar ao servidor" | API desligada, IP errado no `.env`, celular em outro Wi-Fi ou Firewall bloqueando a porta 3333. Abra `http://IP:3333/api/health` no navegador do **celular** para testar |
| Mudei o `.env` e nada mudou | Reinicie com `npx expo start -c` |
| Celular não conecta, mas o navegador do PC abre `/api/health` | Firewall do Windows bloqueando a porta 3333 (permita o Node.js) ou celular em outra rede Wi-Fi. Teste `http://IP-DO-PC:3333/api/health` no navegador **do celular** |
| Cai no login sozinho | O token expirou ou o `JWT_SECRET` mudou. Entre de novo |
| `Cannot find module` ao iniciar a API | Rode `npm install` dentro de `voyage-api` |
| Porta 3333 em uso | Outro programa usa a porta. Feche-o ou defina `PORT=3334` num `.env` (e `EXPO_PUBLIC_API_URL` no app) |
| Quero recomeçar do zero | Pare o servidor, `npm run reset-db`, inicie de novo |
