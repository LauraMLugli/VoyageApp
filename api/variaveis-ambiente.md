---
marp: true
theme: default
paginate: true

title: "Aula - Apresentação"
author: "Carlos Pereira de Castro filho"
date: "DATE"
header: 'Fatec Taquaritinga'
footer: 'Tecnicas Avançadas de Programação'

style: |
  section.pag1 h1 {
    text-align: center;
    font-size: 64px;
    font-weight: 700;
    color: #000;
  }

  section::after {
  content: 'Page ' attr(data-marpit-pagination) ' / ' attr(data-marpit-pagination-total);
  }

  p {
  text-align: justify;
  font-size: 24px;
    }

  td , th{
  font-size: 20px;
  color: black;
  text-align: justify;
  } 

  th {
    text-align: center;
  }

---
<!-- _class: pag1 -->
<!-- _paginate: false -->
<center>

## Fatec Taquaritinga
## Análise e Desenvolvimento de Sistemas - AMS
## Técnicas Avançadas de Programação
## 1º semestre 2026
### Aula-08 - Variaveis de Ambiente

</center>

---
### Aula-08 - Variaveis de Ambiente
#### Porque ?
* Implementar variáveis de ambiente é um passo fundamental para a segurança e profissionalismo de qualquer API. Isso evita que dados sensíveis (como senhas de banco de dados ou chaves de API) fiquem expostos no código-fonte.

---

## 1. O que são Variáveis de Ambiente?
* Imagine que seu projeto é um carro. As variáveis de ambiente são como o **combustível**: o carro (seu código) é o mesmo, mas você pode usar "combustível comum" (ambiente de desenvolvimento) ou "combustível aditivado" (ambiente de produção) sem mudar o motor.

* O pacote `dotenv` lê um arquivo chamado `.env` e carrega essas informações para dentro do objeto global `process.env` do Node.js.

---

## 2. Passo a Passo da Implementação

### Passo 2.1: Instalação
No terminal, dentro da pasta do projeto, execute:
```bash
npm install dotenv
```

---

### Passo 2.2: Criação do arquivo `.env`
Na raiz do seu projeto (ao lado do `package.json`), crie um arquivo chamado exatamente **`.env`**. Adicione as variáveis que deseja proteger:

```env
PORT=3000
DB_USER=admin
DB_PASS=senha_super_segura_123
SECRET_KEY=meu_token_secreto
```

--- 

### Passo 2.3: Configuração no Código
No arquivo principal da sua API (geralmente `index.js` ou `server.js`), você deve importar e configurar o `dotenv` o mais cedo possível:

```js
// Importar o dotenv
require('dotenv').config();

const express = require('express');
const app = express();

// Acessando as variáveis via process.env
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send(`O usuário do banco é: ${process.env.DB_USER}`);
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
```

---

## 3. Segurança: O arquivo `.gitignore`
* O arquivo `.env` **nunca** deve ser enviado para o GitHub.

1. Crie um arquivo chamado `.gitignore` na raiz.
2. Adicione a linha:
   ```text
   .env
   node_modules
   ```

---

### Dica de Ouro: `.env.example`
Como o `.env` original não vai para o repositório, os outros desenvolvedores não saberão quais variáveis o projeto precisa. Crie um arquivo chamado `.env.example` apenas com as chaves:

```env
PORT=
DB_USER=
DB_PASS=
```

---

## 4. Por que usar?

* **Segurança:** Ensinar desde cedo que credenciais não pertencem ao código.
* **Flexibilidade:** Permitir mudanças de portas ou conexões de banco sem editar o código lógico.
* **Padrão de Mercado:** Conceito usado universalmente esta estrutura em projetos profissional.

---

## Diferença entre Ambientes: Desenvolvimento vs. Produção

Vamos usar a analogia do **Palco (Produção)** e do **Ensaio (Desenvolvimento)**.

### 1. Ambiente de Desenvolvimento (Local)
### 2. Ambiente de Produção (O Mundo Real)

---

### 1. Ambiente de Desenvolvimento (Local)
É o computador do aluno.
* **Banco de Dados:** Geralmente um banco local (`localhost`) ou um Docker com dados de teste.
* **Logs:** Exibimos todos os erros detalhados no console para facilitar o debug.
* **Segurança:** Menos rígida, já que só o desenvolvedor acessa.
* **Exemplo no `.env`:** `DB_URL=mongodb://localhost:27017/meu_projeto_testes`

---

### 2. Ambiente de Produção (O Mundo Real)
É onde o app vive (Heroku, AWS, DigitalOcean, Vercel).
* **Banco de Dados:** Um serviço na nuvem (Atlas, RDS) com dados reais dos usuários.
* **Logs:** Erros detalhados são escondidos do usuário final por segurança e salvos em arquivos de log.
* **Segurança:** Altíssima. Chaves de API reais e conexões criptografadas.
* **Exemplo no `.env`:** `DB_URL=mongodb+srv://admin:senha_real_gigante@cluster0.mongodb.net/producao`

---

## Como o código "decide" o ambiente?

Uma prática comum é usar uma variável chamada `NODE_ENV`. Você pode mostrar isso aos alunos no arquivo `server.js`:

```javascript
if (process.env.NODE_ENV === 'production') {
    console.log("🚀 Rodando em modo de Produção (Alta Performance)");
} else {
    console.log("🛠️ Rodando em modo de Desenvolvimento (Modo Debug)");
}
```
