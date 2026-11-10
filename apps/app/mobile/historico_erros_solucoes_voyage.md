# Histórico de erros e soluções --- Voyage

**Projeto:** `Voyage-main/apps/app/mobile`\
**Ambiente informado:** Windows, PowerShell/Git Bash, Expo SDK 54\
**Objetivo:** reunir os erros apresentados durante a inicialização do
aplicativo, suas causas prováveis e as ações recomendadas.

------------------------------------------------------------------------

## 1. Expo não encontrou o `package.json`

### Erro

``` text
ConfigError: The expected package.json path:
C:\Users\laura\OneDrive\Desktop\FATEC\Voyage-main\Voyage-main\apps\package.json does not exist.
```

### Causa

O comando `npx expo start -c` foi executado na pasta `apps`, mas não
havia um `package.json` nesse diretório. O projeto Expo estava em uma
subpasta.

### Solução aplicada

Foi identificado o diretório correto:

``` text
apps/app/mobile
```

Os comandos do Expo devem ser executados nessa pasta:

``` bash
cd apps/app/mobile
npx expo start -c
```

Se o terminal já estiver em `apps/app/mobile`, não é necessário executar
o `cd` novamente.

**Status:** resolvido; o Expo passou a reconhecer o projeto.

------------------------------------------------------------------------

## 2. Plugin `expo-splash-screen` não encontrado

### Erro

``` text
PluginError: Failed to resolve plugin for module "expo-splash-screen".
Do you have node modules installed?
```

### Causa provável

O pacote `expo-splash-screen` não estava instalado ou não podia ser
resolvido na instalação local de dependências.

### Solução recomendada/aplicada na conversa

Dentro de `apps/app/mobile`, executar:

``` bash
npx expo install expo-splash-screen
```

Esse comando seleciona uma versão compatível com o SDK Expo instalado.

Depois:

``` bash
npx expo start -c
```

**Status:** o erro deixou de ser o erro principal nas mensagens
seguintes. Não foi apresentado um resultado explícito do comando de
instalação, portanto a correção deve ser considerada aparentemente
superada, não auditada.

------------------------------------------------------------------------

## 3. `expo-status-bar` tratado incorretamente como plugin

### Aviso

``` text
Skipping config plugin check: Unable to resolve a valid config plugin for expo-status-bar.
No "app.plugin.js" file found in expo-status-bar.
```

O aviso também informou que o carregamento do pacote falhou ao tentar
importar um arquivo TypeScript dentro de `node_modules`, com:

``` text
ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING
```

### Causa

`expo-status-bar` é um componente/pacote de status bar, não um plugin de
configuração do Expo. O projeto aparentemente o listava incorretamente
na propriedade `plugins` do `app.json` ou `app.config.js`.

### Solução recomendada

1.  Abrir `app.json` ou `app.config.js`.
2.  Localizar a propriedade `plugins`.
3.  Se houver uma entrada `"expo-status-bar"`, removê-la da lista.
4.  Manter `expo-status-bar` nas dependências do `package.json` se o
    aplicativo importar e utilizar esse pacote.

Exemplo de configuração inadequada:

``` json
{
  "expo": {
    "plugins": [
      "expo-status-bar",
      "expo-splash-screen"
    ]
  }
}
```

Exemplo sem a entrada indevida:

``` json
{
  "expo": {
    "plugins": [
      "expo-splash-screen"
    ]
  }
}
```

**Atenção:** o exemplo é ilustrativo. Não substitua todo o `app.json`
por ele; preserve as demais configurações do projeto.

Depois, executar:

``` bash
npx expo start -c
```

**Status:** foi recomendada a remoção da entrada, mas não foi enviado o
`app.json` nem confirmado o resultado. Portanto, verificar se essa
alteração foi feita.

------------------------------------------------------------------------

## 4. `Font.resetServerContext is not a function`

### Erro

``` text
Metro error: Font.resetServerContext is not a function
TypeError: Font.resetServerContext is not a function
```

O stack trace apontava para:

``` text
expo-router/build/static/renderStaticContent.js
```

### Causa identificada

Havia duas versões de `expo-font` na árvore de dependências:

-   `expo-font@58.0.9` na raiz do projeto;
-   `expo-font@14.0.12` dentro da instalação do Expo SDK 54.

O projeto utilizava:

-   `expo@54.0.37`;
-   `expo-router@6.0.24`.

A versão `58.0.9` era incompatível com a família de dependências do SDK
54 e estava sendo resolvida na raiz.

### Solução aplicada

Na pasta `apps/app/mobile`, foi executado:

``` bash
npx expo install expo-font
```

O comando instalou a versão compatível com o SDK.

### Confirmação

O resultado posterior de:

``` bash
npm ls expo-font
```

foi:

``` text
voyage-expo@1.0.0
├─┬ @expo/vector-icons@15.1.1
│ └── expo-font@14.0.12 deduped
├── expo-font@14.0.12
└─┬ expo@54.0.37
  └── expo-font@14.0.12 deduped
```

Isso confirma que a versão `14.0.12` passou a ser utilizada na árvore
exibida.

**Status:** incompatibilidade de versão corrigida e confirmada pelo
`npm ls`. O erro de `Font.resetServerContext` deixou de aparecer no log
seguinte.

------------------------------------------------------------------------

## 5. `ReferenceError: window is not defined` --- AsyncStorage e Supabase

### Erro

``` text
ReferenceError: window is not defined
```

O stack trace apontava para:

``` text
@react-native-async-storage/async-storage/lib/commonjs/AsyncStorage.js
@supabase/auth-js
SupabaseAuthClient._recoverAndRefresh
expo-router
```

### Causa provável

Durante a inicialização ou pré-renderização da aplicação no servidor
(Node.js), o Supabase tentou recuperar a sessão utilizando o
AsyncStorage.

O ambiente Node.js não possui o objeto global `window`. O AsyncStorage
utilizado dessa forma pressupõe um ambiente compatível com a plataforma
mobile e não deve ser acessado indevidamente durante a renderização no
servidor.

### Direção de correção

É necessário conferir como o cliente Supabase é criado e qual
armazenamento é selecionado para cada plataforma.

Em uma aplicação que roda em Android/iOS e Web, a configuração deve
distinguir as plataformas. Exemplo conceitual:

``` javascript
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Exemplo: preserve as variáveis e opções que já existem no projeto.
const authOptions = {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false,
  ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
};
```

O cliente Supabase deve receber `auth: authOptions` na chamada de
`createClient`, juntamente com a URL e a chave pública já utilizadas no
projeto.

**Importante:** esse exemplo não é uma correção garantida para SSR.
`Platform.OS` pode indicar `web` durante a renderização Web, mas a
solução completa depende de como o projeto inicializa o Supabase e de
como o Expo Router faz a pré-renderização. Se o cliente for usado no
servidor, pode ser necessário separar a configuração de cliente/servidor
ou evitar a recuperação de sessão no servidor.

### Arquivos necessários para fechar o diagnóstico

Ainda não foram enviados:

1.  `lib/supabase.ts` (ou o arquivo em que `createClient` é chamado);
2.  `app.json` ou `app.config.js`;
3.  confirmação se a execução pretendida é Web, Android/iOS ou ambas.

**Status:** pendente. A causa provável foi identificada, mas a alteração
correta ainda não foi feita nem testada.

------------------------------------------------------------------------

## 6. Verificações gerais recomendadas

Executar sempre dentro de `apps/app/mobile`.

### Conferir versões principais

``` bash
npm ls expo expo-router expo-font expo-status-bar
```

### Conferir de onde vem `expo-font`

``` bash
npm explain expo-font
```

### Verificar compatibilidade do projeto

``` bash
npx expo-doctor
```

### Instalar dependências compatíveis com o SDK

Quando o diagnóstico indicar dependências Expo incompatíveis, usar:

``` bash
npx expo install --fix
```

Esse comando pode atualizar várias dependências. Antes de executá-lo, é
prudente conferir o `package.json` e manter um commit ou backup para
poder reverter alterações.

### Reiniciar o Metro limpando o cache

``` bash
npx expo start -c
```

Limpar o cache não corrige incompatibilidades de versões ou erros de
código; serve para descartar artefatos antigos do bundler.

------------------------------------------------------------------------

## 7. Situação consolidada

  ---------------------------------------------------------------------------------
  Problema                                      Situação
  --------------------------------------------- -----------------------------------
  Expo procurando `package.json` em `apps`      Resolvido: usar `apps/app/mobile`

  `expo-splash-screen` não resolvido            Aparentemente superado; confirmar
                                                instalação

  `expo-status-bar` listado como plugin         Correção recomendada; falta
                                                confirmar o `app.json`

  Duas versões incompatíveis de `expo-font`     Corrigido e confirmado: `14.0.12`

  `Font.resetServerContext is not a function`   Não voltou a aparecer após corrigir
                                                `expo-font`

  `window is not defined` no                    Pendente de análise dos arquivos de
  AsyncStorage/Supabase                         configuração
  ---------------------------------------------------------------------------------

------------------------------------------------------------------------

## 8. Próxima ação para continuar

Para resolver o último erro sem provocar novos problemas, enviar:

-   o `package.json` completo de `apps/app/mobile`;
-   o arquivo que cria o cliente Supabase (`lib/supabase.ts`,
    `src/lib/supabase.ts` ou equivalente);
-   o `app.json` ou `app.config.js`;
-   o resultado de `npx expo-doctor`;
-   informar se o teste será feito no navegador, no Expo Go ou nos dois.

**Não apagar `node_modules` ou `package-lock.json` por enquanto.** A
incompatibilidade do `expo-font` já foi corrigida sem precisar recorrer
a essa medida.

------------------------------------------------------------------------

## Referências oficiais

-   [Expo SDK 54 ---
    documentação](https://docs.expo.dev/versions/v54.0.0/)
-   [Expo --- instalação e compatibilidade de
    dependências](https://docs.expo.dev/more/expo-cli/)
-   [Expo --- Config
    Plugins](https://docs.expo.dev/guides/config-plugins/)
-   [Expo Font --- SDK
    54](https://docs.expo.dev/versions/v54.0.0/sdk/font/)
-   [Expo Router --- Server
    Rendering](https://docs.expo.dev/router/web/server-rendering/)
-   [Supabase --- React Native Auth
    Quickstart](https://supabase.com/docs/guides/auth/quickstarts/react-native)
-   [Supabase --- Auth](https://supabase.com/docs/guides/auth)
