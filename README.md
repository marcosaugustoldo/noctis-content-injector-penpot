# Strategic Copywriting & Visual Automation for Penpot

![https://i.ibb.co/svkmWVvG/Screenshot-2026-04-24-19-56-38.png](https://i.ibb.co/svkmWVvG/Screenshot-2026-04-24-19-56-38.png)

The Noctis Content Injector is a technical tool designed to eliminate the friction of manual copy-pasting. 

Built for high-level copywriters and designers, this plugin enables mass injection of strategic copy directly into Penpot boards.

## Local Environment Setup

**You must run this plugin locally.** Penpot requires an active URL to consume the manifest.

1. Clone the repository to your machine:

```bash
git clone https://github.com/marcosaugustoldo/noctis-content-injector-penpot.git
```

2. Navigate into the plugin's root folder:

```bash
cd noctis-content-injector-penpot
```

3. Run the static server on port 3000:

```bash
npx serve -p 3000 --cors
```

4. Keep the terminal open. **If the server stops, the plugin interface will disappear.**

## Background Execution (Always On)

Running the server manually in a terminal is amateur. Automate the process for a professional workflow.

### Linux (systemd)
Create a service to start the server automatically on boot.

1. Create the service file:

```bash
sudo nano /etc/systemd/system/noctis-injector.service
```

2. Insert the configuration below. **Replace the absolute paths** with your real Node path and plugin folder:

```ini
[Unit]
Description=Noctis Content Injector
After=network.target

[Service]
Type=simple
User=YOUR_USER
WorkingDirectory=/absolute/path/to/noctis-content-injector-penpot
ExecStart=/usr/bin/npx serve -p 3000 --cors
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

3. Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now noctis-injector
```

**Check status with:** `systemctl status noctis-injector`.

### Windows (Task Scheduler)
Hide the command prompt and run the server invisibly on logon.

1. Create a `start-noctis.bat` file in the plugin folder:

```bat
@echo off
cd /d "%~dp0"
npx serve -p 3000 --cors
```

2. Create a `run-hidden.vbs` file in the same folder:

```vbs
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "start-noctis.bat" & Chr(34), 0
Set WshShell = Nothing
```

3. Open **Task Scheduler** (`taskschd.msc`).
4. **Create Task** (not Basic Task).
5. **General:** Name it `NoctisInjector` and check **"Run with highest privileges"**.
6. **Triggers:** Add **"At log on"**.
7. **Actions:** Add **"Start a program"** and point to `run-hidden.vbs`.

## Penpot Installation

1. Open any Penpot design file.
2. Go to the **Plugins** tab in the sidebar.
3. Click **Install Plugin from URL** (`+` icon).
4. Paste your local manifest URL:
`http://localhost:3000/manifest.json`
5. Click **Install**.

## Execution Protocol

The system operates under **compact mapping**. Naming conventions are strict rules, not suggestions.

### 1. Board Preparation
Rename target text layers in your canvas using the exact pattern:
- `text 1` (or `texto 1`)
- `text 2`
- `text 3`

### 2. Copy Syntax
Enter your copy into the plugin interface respecting the syntax:
```text
texto 1 - Aggressive Headline
texto 2 - Social proof and retention
texto 3 - Call to Action (CTA)
```

### 3. Injection
Select the target **Boards**. Click **Inject Copy**.

The scan is recursive and deep. **Any typo in the layer name will cause the script to silently ignore the target.**

## Identity & Stack

- **Typography:** JetBrains Mono (Technical Brutalism).
- **Palette:** Background `#1F1F1F`, Text `#D4D4D4`, Accent `#ECDB9F`.
- **Core:** Vanilla JavaScript + Penpot Plugin API.

## About Noctis

Copywriting Consultancy for those who want to be relevant and well-paid. We execute deep diagnostics and aggressive action plans for personal brands.
