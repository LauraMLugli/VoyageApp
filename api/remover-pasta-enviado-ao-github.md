1. remova a pasta via linha de comando

* Abra o terminal na pasta do seu projeto.

* Remova a pasta da área de preparação (staging area) do git, sem apagá-la do disco rígido:
```bash
git rm -r --cached nome-da-pasta
```
    **-r** permite remover de forma recursiva (pasta e seu conteúdo).
    **--cached** garante que o arquivo seja removido apenas do repositório git (remote), mantendo-o localmente.

* Faça o commit da alteração:
```bash
git commit -m "Removendo pasta enviada por engano"
```

* Envie a alteração para o GitHub:
```bash
git push origin main
```
    **main** Troque pelo nome da sua branch, se necessário, como master. 

2. Evitar que ela volte a ser enviada (recomendado)

* Para garantir que essa pasta não seja enviada novamente nos próximos commits, adicione-a ao arquivo .gitignore:
* Abra ou crie um arquivo .gitignore na raiz do projeto.
* Adicione o nome da pasta:
```bash
    nome-da-pasta/
```
* Salve o arquivo e faça o commit do .gitignore. 


3. Alternativa: Pela interface do GitHub

* Você também pode remover pastas diretamente no site do GitHub:
* Navegue até a pasta no site do GitHub.
* Clique nos três pontinhos (...) no canto superior direito e selecione "Delete directory".
* Faça o commit da exclusão.
* Depois, no seu terminal local, rode git pull para sincronizar.