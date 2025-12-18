# 📚 Packet Module v115 - Hybrid Structure

A student activity tracking and submission system with Google Apps Script backend and GitHub Pages frontend.

## ✨ What's New in v115

- **📂 Modular Structure**: Code split into 16 manageable files (8 CSS + 8 JS)
- **🔨 Build System**: Automated bundling with Node.js  
- **🎯 Clean Separation**: Development (`src/`) vs Production (`public/`)
- **📱 Responsive Design**: Mobile-first approach
- **🔐 Secure Authentication**: Google Sheets backend
- **⚡ Real-time Clock**: Philippines timezone synchronization
- **✏️ Rich Editor**: Fullscreen modal with font size controls

---

## 🏗️ Project Structure

```
PACKET_MODULE/
├── src/                     # Development Source
│   ├── css/ (8 files)       # Modular stylesheets
│   ├── js/ (8 files)        # Modular JavaScript
│   └── index.html           # HTML template
├── public/                  # Production Build
│   └── index.html           # Bundled (42KB)
├── apps-script/             # Backend
│   └── 114_module_script.gs # Google Apps Script
├── build/                   # Build Tools
│   └── bundle.js            # Build script
└── docs/                    # Documentation
```

---

## 🚀 Quick Start

```bash
# Build the project
npm run build

# Output: public/index.html (ready for deployment)
```

---

## 💻 Development Workflow

1. **Edit** files in `src/css/` or `src/js/`
2. **Build**: `npm run build`
3. **Deploy**: Push to GitHub

### Auto-rebuild

```bash
npm run watch
```

---

## 📦 Build System

Combines 8 CSS + 8 JS files into single `public/index.html`:

```bash
node build/bundle.js
```

Output: `✨ Build complete! 📊 Size: 42.53 KB`

---

## 🌐 Deployment

### Backend (Apps Script)
1. Copy `apps-script/114_module_script.gs` to Apps Script
2. Deploy as Web App (**access: Anyone**)
3. Update `src/js/config.js` with API URL
4. Rebuild

### Frontend (GitHub Pages)
1. Push to GitHub
2. Settings → Pages → Deploy from `main` branch
3. Live at: `https://tonycitenian.github.io/PACKET_MODULE/public/`

---

## 📚 Documentation

- **[DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** - Full deployment steps
- **[STRUCTURE_GUIDE.md](STRUCTURE_GUIDE.md)** - File organization  
- **[SPLITTING_STRATEGIES.md](docs/SPLITTING_STRATEGIES.md)** - Architecture

---

## 🎯 Features

✅ Student Login | ✅ Progress Tracking | ✅ Rich Text Editor  
✅ Real-time Clock | ✅ Mobile Responsive | ✅ Auto-save

---

## 🔧 Configuration

**API URL** (`src/js/config.js`):
```javascript
const API_URL = 'YOUR_APPS_SCRIPT_URL';
```

**Theme** (`src/css/01-variables.css`):
```css
:root {
  --primary-color: #4f46e5;
  --clock-color: #ef4444;
}
```

---

## 📊 Statistics

- **16 source files** (8 CSS + 8 JS)
- **~42 KB** bundled output
- **~1,200 lines** of code
- **< 2s** load time

---

## 📜 License

MIT License

---

**Built with ❤️ for better student learning**

**Last Updated**: December 10, 2025 | **Version**: v114 (Hybrid)  
**Repository**: https://github.com/tonycitenian/PACKET_MODULE
