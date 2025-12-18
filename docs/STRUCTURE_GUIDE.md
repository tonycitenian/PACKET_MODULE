# Packet Module - Option 4: Hybrid Structure

## 📂 File Structure

```
PACKET_MODULE/
│
├── 📁 src/                              # Source code (modular development)
│   ├── 📁 css/                          # Stylesheets (8 files)
│   │   ├── 01-variables.css             # CSS custom properties & theme
│   │   ├── 02-base.css                  # Base styles & typography
│   │   ├── 03-layout.css                # Layout components
│   │   ├── 04-components.css            # Reusable components
│   │   ├── 05-login.css                 # Login card styles
│   │   ├── 06-progress.css              # Progress table styles
│   │   ├── 07-modal.css                 # Modal editor styles
│   │   └── 08-responsive.css            # Media queries
│   │
│   ├── 📁 js/                           # JavaScript modules (8 files)
│   │   ├── config.js                    # Configuration & constants
│   │   ├── api.js                       # API communication layer
│   │   ├── utils.js                     # Utility functions
│   │   ├── clock.js                     # Clock functionality
│   │   ├── auth.js                      # Authentication logic
│   │   ├── modal.js                     # Modal editor
│   │   ├── progress.js                  # Progress table rendering
│   │   └── main.js                      # App initialization
│   │
│   └── index.html                       # HTML template (clean)
│
├── 📁 public/                           # Production build
│   └── index.html                       # Bundled file (deploy this)
│
├── 📁 apps-script/                      # Google Apps Script backend
│   └── 114_module_script.gs             # Backend (single file)
│
├── 📁 build/                            # Build tools
│   └── bundle.js                        # Build script
│
├── 📁 docs/                             # Documentation
│   ├── DEPLOYMENT_GUIDE.md
│   ├── QUICK_REFERENCE.md
│   └── SPLITTING_STRATEGIES.md
│
├── .gitignore                           # Git ignore rules
├── package.json                         # NPM configuration
├── README.md                            # Project documentation
├── index.html                           # Legacy file (can be removed)
└── 114_module_script.gs                 # Legacy file (copied to apps-script/)
```

## 🚀 Development Workflow

### 1. Edit Source Files

Edit files in `src/css/` or `src/js/` as needed:

```bash
# Edit CSS
nano src/css/04-components.css

# Edit JavaScript
nano src/js/auth.js

# Edit HTML structure
nano src/index.html
```

### 2. Build Production File

```bash
npm run build
```

This combines all files into `public/index.html`.

### 3. Deploy

**GitHub Pages** serves `public/index.html` automatically.

## 📝 File Descriptions

### CSS Files (src/css/)

| File | Lines | Purpose |
|------|-------|---------|
| `01-variables.css` | ~60 | CSS custom properties (colors, spacing, etc.) |
| `02-base.css` | ~20 | Base HTML/body styles |
| `03-layout.css` | ~50 | Header, wrapper, clock layout |
| `04-components.css` | ~100 | Buttons, badges, notices |
| `05-login.css` | ~60 | Login card & form inputs |
| `06-progress.css` | ~150 | Progress table & stats |
| `07-modal.css` | ~80 | Modal editor (fullscreen) |
| `08-responsive.css` | ~60 | Media queries for mobile |

### JavaScript Files (src/js/)

| File | Lines | Purpose |
|------|-------|---------|
| `config.js` | ~20 | Constants (API_URL, MAX_WORDS, etc.) |
| `api.js` | ~60 | API communication (fetch wrappers) |
| `utils.js` | ~90 | Helper functions (word count, localStorage) |
| `clock.js` | ~60 | Clock functionality (server + local) |
| `auth.js` | ~120 | Login, logout, session management |
| `modal.js` | ~170 | Modal editor with font controls |
| `progress.js` | ~200 | Table rendering & status updates |
| `main.js` | ~15 | App initialization (DOMContentLoaded) |

## ✅ Benefits of This Structure

1. **Easy to Find Code**: Each file has a specific purpose
2. **No Merge Conflicts**: Small files reduce Git conflicts
3. **Scalable**: Easy to add new features/pages
4. **Maintainable**: Changes are isolated to relevant files
5. **Professional**: Industry-standard structure

## 🔄 Adding New Features

### Add New CSS Style

1. Edit appropriate CSS file (or create new one)
2. Run `npm run build`
3. Done!

### Add New JavaScript Function

1. Edit appropriate JS file (or create new one)
2. If creating new file, add to `build/bundle.js` JS_FILES array
3. Run `npm run build`
4. Done!

### Add New Page

1. Create `src/new-page.html`
2. Create `src/css/09-new-page.css`
3. Create `src/js/new-page.js`
4. Update `build/bundle.js` to include new files
5. Run `npm run build`

## 📋 Build Script Details

The build script (`build/bundle.js`) does the following:

1. Reads `src/index.html` template
2. Combines all CSS files from `src/css/` in order
3. Combines all JavaScript files from `src/js/` in order
4. Injects CSS into `<head>` section
5. Injects JavaScript before `</body>` tag
6. Writes output to `public/index.html`

## 🎯 Next Steps

1. ✅ **Done**: Files are split and organized
2. ✅ **Done**: Build script created
3. ✅ **Done**: Production file generated
4. **TODO**: Update GitHub Pages to serve from `public/` folder
5. **TODO**: Remove legacy `index.html` and `114_module_script.gs` from root
6. **TODO**: Test deployment

## 🔧 Development Tips

### Auto-rebuild on Changes (Optional)

Install nodemon:
```bash
npm install
```

Then run:
```bash
npm run watch
```

Now files rebuild automatically when you save changes!

### Quick Edits

For quick edits, you can still edit `public/index.html` directly.  
But remember: changes will be overwritten on next build!

---

**Last Updated**: December 10, 2025  
**Version**: v114 (Hybrid Structure)  
**Structure**: Option 4 - Hybrid (Feature + Type)
