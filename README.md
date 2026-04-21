# Noctis Content Injector

A [Penpot](https://penpot.app) plugin that automates applying text, images, color palettes, and profile data to content carousels.

Built and maintained by [Noctis](https://www.instagram.com/noctis_copywriting/).

---

## What it does

- **Texts** — applies content to text layers named following the pattern `texto N - content`
- **Images** — uploads and injects images into target layers named `imagemN`
- **Colors** — swaps the entire carousel palette by usage frequency (most-used color maps to the first color in the new palette, and so on)
- **Profile** — fills handle (`@perfil`), name (`nome`), and profile photo (`foto perfil` / `imagemperfil`) across all selected boards at once
- **Apply All** — runs all four operations above in a single action

---

## File structure

```
├── plugin.js      # Plugin logic (runs in Penpot's context)
├── ui.html        # User interface (runs in an iframe)
├── manifest.json  # Plugin configuration and permissions
└── icon.png       # Icon displayed in Penpot (add manually)
```

---

## Installation

### 1. Host the files

Penpot requires the plugin to be accessible over HTTPS. Recommended options:

**GitHub Pages (free)**
```bash
# In your repository, go to Settings → Pages → Source: main branch / root
# Your manifest URL will be: https://your-username.github.io/noctis-content-injector/manifest.json
```

**Vercel / Netlify**
Drop the project folder into the dashboard. The URL is generated automatically.

### 2. Update the manifest

Before publishing, edit the `host` field in `manifest.json` with your actual domain:

```json
{
  "host": "https://your-username.github.io/noctis-content-injector"
}
```

### 3. Install in Penpot

1. Open any file in Penpot
2. Main menu → **Plugins**
3. Click **+** (install plugin)
4. Paste your `manifest.json` URL
5. Confirm the requested permissions

---

## Usage

### Layer naming convention

The plugin finds layers by name. Names are normalized — case-insensitive, spaces and hyphens ignored.

| Type | Name pattern | Examples |
|---|---|---|
| Text | `texto N` | `texto 1`, `Texto 2`, `TEXTO 3` |
| Image | `imagemN` | `imagem1`, `Imagem2` |
| Handle | `perfil` | `Perfil`, `PERFIL` |
| Name | `nome` | `Nome`, `NOME` |
| Avatar | `foto perfil` or `imagemperfil` | `Foto Perfil`, `imagemperfil` |

### Texts

Paste content into the text field using the compact format, one entry per line:

```
texto 1 - Slide headline
texto 2 - Body paragraph
texto 3 - Call to action
```

The plugin applies each text to all selected boards that contain the matching layer.

### Images

Drag or select PNG, JPG, or WebP files. Auto-mapping distributes images in order to the available targets across boards (`imagem1`, `imagem2`, etc.). Reorder by dragging the thumbnails before applying.

### Colors

Select or create a three-color palette. The algorithm analyzes the most frequent solid colors across the selected boards and replaces them with the new palette in frequency order — the most-used color is swapped for the first in the palette, and so on.

Use **Extract from Frame** to automatically generate a palette from the colors found in the first selected board.

### Profile

Fill in the handle, name, and/or photo. The plugin traverses all selected boards and updates every matching layer at once.

### Apply All

Runs in sequence: profile → texts → images → colors. Use when all fields are filled and you want to publish the carousel in one action.

---

## Board selection

The plugin detects which boards to target in three ways:

1. **Direct selection** — select two or more boards on the page
2. **Container** — select a group or frame that contains boards as children
3. **Board container** — select a single board that contains other boards as children

Ordering follows the layer name (natural numeric sort) or screen position (top to bottom, left to right) when names contain no numbers.

---

## Permissions

| Permission | Reason |
|---|---|
| `content:read` | Read selected boards and layers |
| `content:write` | Apply texts, images, and colors |
| `allow:downloads` | Reserved for future use |
| `allow:localstorage` | Persist custom palettes locally |

**External resources loaded:**
- [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono) via Google Fonts (UI only)

**No telemetry. No authentication. No data sent to external servers.**

---

## Local development

```bash
# Clone the repository
git clone https://github.com/your-username/noctis-content-injector
cd noctis-content-injector

# Serve locally (any static server works)
npx serve .
# or
python3 -m http.server 8080
```

In Penpot, install the plugin pointing to `http://localhost:8080/manifest.json`.

> Penpot accepts `localhost` without HTTPS for local development.

---

## Known limitations

- **Thumbnails disabled** — the Penpot plugin API does not expose async frame export in the selection context. The status bar shows slide count only, no visual preview.
- **Fonts** — unlike Figma, Penpot does not require explicit font loading. If a text edit fails, verify that the font is installed in Penpot.
- **Image fills** — the plugin detects and replaces fills of type `fillImage`. If a target layer has only a solid fill, the image is inserted as a new fill layer at the top of the stack.
- **Palette storage** — Penpot's `localStorage` is scoped per plugin. No hard limit is enforced, but very large volumes may affect initial load time.

---

## Support

Questions, bugs, or suggestions: [contato@noctis.icu](mailto:contato@noctis.icu)

Follow Noctis: [@noctis_copywriting](https://www.instagram.com/noctis_copywriting/)

---

## License

Internal use only. All rights reserved — Noctis® 2026.
