# Copywriting Estratégico & Automação Visual para Penpot

![https://i.ibb.co/svkmWVvG/Screenshot-2026-04-24-19-56-38.png](https://i.ibb.co/svkmWVvG/Screenshot-2026-04-24-19-56-38.png)

O Noctis Content Injector é uma ferramenta técnica desenvolvida para eliminar o atrito da colagem manual de copy.

Criado para copywriters e designers de alto nível, este plugin permite a injeção em massa de copy estratégico diretamente nos boards do Penpot.

## Configuração do Ambiente Local

**Você precisa executar este plugin localmente.** O Penpot exige uma URL ativa para consumir o manifesto.

1. Clone o repositório na sua máquina:

```bash
git clone https://github.com/marcosaugustoldo/noctis-content-injector-penpot.git
```

2. Navegue até a pasta raiz do plugin:

```bash
cd noctis-content-injector-penpot
```

3. Execute o servidor estático na porta 3000:

```bash
npx serve -p 3000 --cors
```

4. Mantenha o terminal aberto. **Se o servidor parar, a interface do plugin desaparecerá.**

## Execução em Segundo Plano (Sempre Ativo)

Rodar o servidor manualmente no terminal é amador. Automatize o processo para um fluxo de trabalho profissional.

### Linux (systemd)
Crie um serviço para iniciar o servidor automaticamente na inicialização.

1. Crie o arquivo de serviço:

```bash
sudo nano /etc/systemd/system/noctis-injector.service
```

2. Insira a configuração abaixo. **Substitua os caminhos absolutos** pelo caminho real do Node e da pasta do plugin:

```ini
[Unit]
Description=Noctis Content Injector
After=network.target

[Service]
Type=simple
User=SEU_USUARIO
WorkingDirectory=/caminho/absoluto/para/noctis-content-injector-penpot
ExecStart=/usr/bin/npx serve -p 3000 --cors
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

3. Habilite e inicie o serviço:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now noctis-injector
```

**Verifique o status com:** `systemctl status noctis-injector`.

### Windows (Agendador de Tarefas)
Oculte o prompt de comando e execute o servidor de forma invisível ao fazer logon.

1. Crie um arquivo `start-noctis.bat` na pasta do plugin:

```bat
@echo off
cd /d "%~dp0"
npx serve -p 3000 --cors
```

2. Crie um arquivo `run-hidden.vbs` na mesma pasta:

```vbs
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "start-noctis.bat" & Chr(34), 0
Set WshShell = Nothing
```

3. Abra o **Agendador de Tarefas** (`taskschd.msc`).
4. **Criar Tarefa** (não Tarefa Básica).
5. **Geral:** Nomeie como `NoctisInjector` e marque **"Executar com privilégios mais altos"**.
6. **Gatilhos:** Adicione **"Ao fazer logon"**.
7. **Ações:** Adicione **"Iniciar um programa"** e aponte para `run-hidden.vbs`.

## Instalação no Penpot

1. Abra qualquer arquivo de design do Penpot.
2. Vá até a aba **Plugins** na barra lateral.
3. Clique em **Instalar Plugin por URL** (ícone `+`).
4. Cole a URL do manifesto local:
`http://localhost:3000/manifest.json`
5. Clique em **Instalar**.

## Protocolo de Execução

O sistema opera por **mapeamento compacto**. As convenções de nomenclatura são regras rígidas, não sugestões.

### 1. Preparação dos Boards
Renomeie as camadas de texto alvo no seu canvas usando o padrão exato:
- `texto 1` (ou `text 1`)
- `texto 2`
- `texto 3`

### 2. Sintaxe da Copy
Insira sua copy na interface do plugin respeitando a sintaxe:
```text
texto 1 - Headline Agressiva
texto 2 - Prova social e retenção
texto 3 - Chamada para Ação (CTA)
```

### 3. Injeção
Selecione os **Boards** alvo. Clique em **Injetar Copy**.

A varredura é recursiva e profunda. **Qualquer erro de digitação no nome da camada fará com que o script ignore silenciosamente o alvo.**

## Identidade & Stack

- **Tipografia:** JetBrains Mono (Brutalismo Técnico).
- **Paleta:** Fundo `#1F1F1F`, Texto `#D4D4D4`, Destaque `#ECDB9F`.
- **Núcleo:** Vanilla JavaScript + Penpot Plugin API.

## Sobre a Noctis

Consultoria de Copywriting para quem quer ser relevante e bem pago. Executamos diagnósticos profundos e planos de ação agressivos para marcas pessoais.
