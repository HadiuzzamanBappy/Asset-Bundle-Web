# Asset Bundler
A lightweight, client-side tool for combining and minifying JavaScript and CSS files directly in the browser.

## Live Demo & Screenshot

**[➡️ View Live Demo Here](https://assets-bundle.vercel.app/)**

<br>

![Project Screenshot](/assets/images/image.png)

<br>

## Features

🚀 **Zero server dependencies** - Works entirely in the browser  
📦 **Combine multiple files** - Merge JS/CSS into single bundles  
✨ **Minification support** - Uses Terser for JS and CSSO for CSS  
📊 **File statistics** - Shows original vs minified sizes  
🌓 **Dark/light theme** - User preference switching  
💾 **Local storage** - Remembers theme preference  
📥 **Multiple download options** - Individual files or ZIP archive  

---

## Folder Structure

```
assets/
├── css/
│   ├── bootstrap-icons.css
│   ├── bootstrap.min.css
│   └── style.css
├── fonts/
│   ├── bootstrap-icons.woff
│   └── bootstrap-icons.woff2
├── js/
│   ├── bootstrap.bundle.min.js
│   ├── csso.min.js
│   ├── jszip.min.js
│   ├── script.js
│   └── terser.min.js
├── logo/
│   ├── android-chrome-192x192.png
│   ├── android-chrome-512x512.png
│   ├── apple-touch-icon.png
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── favicon.ico
│   ├── logo-dark.svg
│   ├── logo-white.svg
│   └── logo.png
├── index.html
└── site.webmanifest
```

---

## How to Use

### Upload Files:
- Click **"Select JS/CSS Files"** or drag and drop files
- Maximum file size: **5MB per file**
- Accepted extensions: `.js`, `.css`

### View/Download Bundles:
- View raw or minified content by clicking the eye icon
- Download individual bundles or all files as a ZIP

### Reset:
- Click **"Reset All Files"** to clear all uploaded files

---

## Technical Details

### Dependencies

All dependencies are loaded via CDN or included locally:
- [Bootstrap 5](https://getbootstrap.com/) - UI components and styling
- Bootstrap Icons - Icon set
- [Terser](https://terser.org/) - JavaScript minification
- [CSSO](https://github.com/css/csso) - CSS minification
- [JSZip](https://stuk.github.io/jszip/) - ZIP file creation

### Browser Support

Works in all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Edge (latest)
- Safari (latest)

---

## Limitations

- Pure client-side operation (no server processing)
- Maximum file size: 5MB per file
- No advanced minification options
- No source maps generation

---

## Deployment

No server-side processing required:
- Upload the entire assets folder to your web server
- Ensure all file paths remain relative
- The application will work from any subdirectory

---

## License

This project is open source and available under the **MIT License**.

---

## Credits

- [Bootstrap 5](https://getbootstrap.com/)
- [Terser](https://terser.org/)
- [CSSO](https://github.com/css/csso)
- [JSZip](https://stuk.github.io/jszip/)

> **Note:** This is a client-side only tool. All processing happens in the browser - no files are uploaded to any server.