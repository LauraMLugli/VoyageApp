Projeto Back end em nodejs

---
# 📁 Estrutura do projeto
```bash
backend/
├── /api
│   ├── server.js
│   ├── 
│   ├── databases
│   │    ├── schema
│   │    │   ├── Databaschema.js
│   │    │   └── schema.json
│   │    │ 
│   │    ├── conncetions
│   │    │   ├── connectionMysql.js
│   │    │   └── connectionSqllite.js
│   │    │ 
│   │    ├── DatabaseContext.js
│   │    └── DatabaseStrategy.sql
│   │    │ 
│   │    ├── middlewares
│   │    │   ├── authMiddleware.js
│   │    │   └── upload.js
│   │    │ 
│   ├── model
│   │    ├── estadosModel.js
│   │    ├── municipiosModel.js
│   │    └── usersModel.js
│   │
│   ├── controller
│   │   ├── estadosController.js
│   │   ├── municipiosController.js
│   │   └── usersController.js
│   │
│   ├── view/
│   │    ├── estadosRoutes.js
│   │    ├── municipiosRoutes.js
│   │    ├── usersRoutes.js
│   │    └── routes.js
│   │
│   ├── tests/
│   │    ├── authTest.http
│   │    ├── estadosTest.http
│   │    ├── municipiosTest.http
│   │    ├── uploadTest.http
│   │    └── usersTest.http
│   │
│   ├── utils/
│   │
│   ├── .gitIgnore
│   ├── readme.md
│   ├── package.json
│   ├── .env.example
│   └── .env
├── 
├── readme.md
├── package.json
└── .env
```

---

### iniciar controle do projeto pelo git

* inicie o controle do repositorio usando o comando no terminal:

```bash
git init
```
* para aqueles que o `git init` iniciar com a branch `master` use o comando abaixo, para gerar uma nova branch de nome `main`:

```bash
git checkout -b main
```

---

### iniciar controle do projeto pelo git

crie um arquivo readme.md, com um conteúdo sobre o projeto, salve-o e depois execute o comando para criar o primeiro `commit` , no terminal:

```bash
git add .
git commit -m "primeiro commit"
```
* apos a criação do **commit** podemos verificar os arquivos e pastas incluidas no `commit`, para isso vamos utilizar o comando `status` do git, execute o comando no terminal:

```bash
git status 
```
* **bom agora** estamos trabalhando com um gerenciador de versão, mas lembre-se ainda esta local, somente no seu computador;

---

padrao que será utilizado de import foi alterado de:
`commons.js` para `module`.

Alteração feita no `package.json`, codigo abaixo:

```json
    "type": "module",
```
foi criado um script para inicialização do projeto, com o nome de `dev`, script abaixo como exemplo:

```json
"scripts": {
    "dev": "node --watch ./src/server.js"
  },
```
como iniciar o projeto, acesse o terminal e execute o comando abaixo:
```bash
    npm run dev
```

banco de dados utilizado no projeto: `mysql`

depdencia utilizadao `mysql2`:

```bash
    npm install mysql2
```

modelo de script sql padrão :

```sql
CREATE TABLE users (
    id INT NOT NULL AUTO_INCREMENT,
    userName VARCHAR(100),
    userPassword VARCHAR(250),
    CONSTRAINT PK_USERS_ID PRIMARY KEY (id)
);

INSERT INTO users (`userName`, `userPassword`) VALUES 
('jose@gmail.com', '123'),
('marcos@etec.sp.go.br','234'),
('mario@fate.sp.go.br','567'),
('bruno@hotmail','890');
```
