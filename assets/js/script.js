// ============================================================================
        // CONFIGURATION & STATE MANAGEMENT
        // ============================================================================
        
        const CONFIG = {
            MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
            ACCEPTED_EXTENSIONS: ['.js', '.css'],
            THEME_KEY: 'bundler-theme'
        };

        const STATE = {
            jsFiles: [],
            cssFiles: [],
            processedContent: {
                jsRaw: '',
                jsMin: '',
                cssRaw: '',
                cssMin: ''
            }
        };

        // ============================================================================
        // THEME MANAGEMENT
        // ============================================================================
        
        function initializeTheme() {
            const savedTheme = localStorage.getItem(CONFIG.THEME_KEY) || 'light';
            setTheme(savedTheme);
        }

        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-bs-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
            localStorage.setItem(CONFIG.THEME_KEY, newTheme);
        }

        function setTheme(theme) {
            document.documentElement.setAttribute('data-bs-theme', theme);
            const icon = document.getElementById('theme-icon');
            icon.className = theme === 'dark' ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
        }

        // ============================================================================
        // UTILITY FUNCTIONS
        // ============================================================================
        
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        function showNotification(message, type = 'info') {
            // Simple alert for now - could be enhanced with toast notifications
            if (type === 'error') {
                alert('Error: ' + message);
            } else {
                console.log(message);
            }
        }

        function validateFile(file) {
            const errors = [];
            
            if (!CONFIG.ACCEPTED_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))) {
                errors.push(`File ${file.name} is not a valid JS or CSS file.`);
            }
            
            if (file.size > CONFIG.MAX_FILE_SIZE) {
                errors.push(`File ${file.name} is too large (max 5MB).`);
            }
            
            return errors;
        }

        // ============================================================================
        // MINIFICATION UTILITIES
        // ============================================================================
        
        function simpleCssMinify(css) {
            return css
                .replace(/\/\*[\s\S]*?\*\//g, '')
                .replace(/\s+/g, ' ')
                .replace(/; ?>/g, ';')
                .replace(/([{:;}])\s+/g, '$1')
                .replace(/\s+([{:;}])/g, '$1')
                .trim();
        }

        const cssMinifier = {
            minify: (css) => {
                try {
                    if (window.csso && window.csso.minify) {
                        const result = window.csso.minify(css);
                        return { styles: result.css || result, errors: [] };
                    } else {
                        const minified = simpleCssMinify(css);
                        return { styles: minified, errors: [] };
                    }
                } catch (e) {
                    try {
                        const minified = simpleCssMinify(css);
                        return { styles: minified, errors: ['CSSO failed, using fallback: ' + e.message] };
                    } catch (fallbackError) {
                        return { 
                            styles: '', 
                            errors: ['Both CSSO and fallback CSS minification failed: ' + fallbackError.message] 
                        };
                    }
                }
            }
        };

        function jsPriority(a, b) {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            if (aName.includes('jquery')) return -1;
            if (bName.includes('jquery')) return 1;
            return aName.localeCompare(bName);
        }

        // ============================================================================
        // UI UPDATE FUNCTIONS
        // ============================================================================
        
        function updateFileList(type) {
            const files = type === 'js' ? STATE.jsFiles : STATE.cssFiles;
            const listElement = document.getElementById(type + 'FileList');
            const countElement = document.getElementById(type + 'Count');
            
            if (files.length === 0) {
                listElement.innerHTML = `<small class="text-muted">No ${type.toUpperCase()} files uploaded</small>`;
                countElement.textContent = '0 files';
                countElement.className = 'badge bg-secondary';
            } else {
                listElement.innerHTML = files.map(file => 
                    `<div class="file-item d-flex justify-content-between align-items-center mb-1 p-2 bg-white rounded border">
                        <small class="text-truncate fw-semibold" title="${file.name}">
                            <i class="bi bi-file-earmark-${type === 'js' ? 'code' : 'richtext'} me-1"></i> ${file.name}
                        </small>
                        <button class="btn btn-sm btn-outline-danger ms-2" onclick="removeFile('${type}', '${file.name}')" title="Remove file">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>`
                ).join('');
                countElement.textContent = `${files.length} file${files.length > 1 ? 's' : ''}`;
                countElement.className = `badge bg-${type === 'js' ? 'primary' : 'success'}`;
            }
        }

        function toggleActionButtons() {
            const hasJsFiles = STATE.jsFiles.length > 0;
            const hasCssFiles = STATE.cssFiles.length > 0;
            const hasAnyFiles = hasJsFiles || hasCssFiles;
            
            document.getElementById('actionButtons').classList.toggle('d-none', !hasAnyFiles);
            document.getElementById('noFilesMessage').classList.toggle('d-none', hasAnyFiles);
            document.getElementById('statsRow').style.display = hasAnyFiles ? 'block' : 'none';
            
            const jsSection = document.getElementById('jsSection');
            const cssSection = document.getElementById('cssSection');
            
            if (jsSection) jsSection.style.display = hasJsFiles ? 'block' : 'none';
            if (cssSection) cssSection.style.display = hasCssFiles ? 'block' : 'none';
            
            const zipButton = document.querySelector('[onclick="downloadAllAsZip()"]');
            if (zipButton) {
                zipButton.disabled = !hasAnyFiles;
                zipButton.classList.toggle('disabled', !hasAnyFiles);
                if (!hasAnyFiles) {
                    zipButton.setAttribute('title', 'No files uploaded');
                } else {
                    zipButton.removeAttribute('title');
                }
            }
        }

        function updateStats() {
            const jsOriginal = new Blob([STATE.processedContent.jsRaw]).size;
            const jsMinified = new Blob([STATE.processedContent.jsMin]).size;
            const cssOriginal = new Blob([STATE.processedContent.cssRaw]).size;
            const cssMinified = new Blob([STATE.processedContent.cssMin]).size;

            document.getElementById('jsOriginalSize').textContent = formatFileSize(jsOriginal);
            document.getElementById('jsMinifiedSize').textContent = formatFileSize(jsMinified);
            document.getElementById('cssOriginalSize').textContent = formatFileSize(cssOriginal);
            document.getElementById('cssMinifiedSize').textContent = formatFileSize(cssMinified);

            const jsCompression = jsOriginal > 0 ? Math.round((1 - jsMinified / jsOriginal) * 100) : 0;
            const cssCompression = cssOriginal > 0 ? Math.round((1 - cssMinified / cssOriginal) * 100) : 0;

            document.getElementById('jsCompression').textContent = jsCompression + '%';
            document.getElementById('cssCompression').textContent = cssCompression + '%';
        }

        function showLoading(show) {
            document.getElementById('loading').classList.toggle('d-none', !show);
        }

        // ============================================================================
        // FILE MANAGEMENT
        // ============================================================================
        
        function removeFile(type, fileName) {
            const files = type === 'js' ? STATE.jsFiles : STATE.cssFiles;
            const index = files.findIndex(f => f.name === fileName);
            if (index > -1) {
                files.splice(index, 1);
                updateFileList(type);
                updateOutputs();
                toggleActionButtons();
            }
        }

        async function processFiles(newFiles) {
            showLoading(true);
            
            for (const file of newFiles) {
                const errors = validateFile(file);
                if (errors.length > 0) {
                    showNotification(errors.join(' '), 'error');
                    continue;
                }

                try {
                    const content = await readFileContent(file);
                    const isJs = file.name.toLowerCase().endsWith('.js');
                    const targetArray = isJs ? STATE.jsFiles : STATE.cssFiles;
                    
                    // Check if file already exists
                    const existingIndex = targetArray.findIndex(f => f.name === file.name);
                    if (existingIndex > -1) {
                        if (!confirm(`File ${file.name} already exists. Replace it?`)) {
                            continue;
                        }
                        targetArray[existingIndex] = { name: file.name, content };
                    } else {
                        targetArray.push({ name: file.name, content });
                    }
                    
                    updateFileList(isJs ? 'js' : 'css');
                } catch (error) {
                    showNotification(`Error reading file ${file.name}: ${error.message}`, 'error');
                }
            }
            
            await updateOutputs();
            toggleActionButtons();
            showLoading(false);
        }

        function readFileContent(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsText(file);
            });
        }

        async function updateOutputs() {
            const jsCombined = STATE.jsFiles
                .sort(jsPriority)
                .map(f => `// ${f.name}\n${f.content}`)
                .join('\n\n');
            
            const cssCombined = STATE.cssFiles
                .map(f => `/* ${f.name} */\n${f.content}`)
                .join('\n\n');

            STATE.processedContent.jsRaw = jsCombined;
            STATE.processedContent.cssRaw = cssCombined;

            // Process JavaScript
            if (jsCombined) {
                try {
                    const jsMin = await Terser.minify(jsCombined, {
                        mangle: { toplevel: true },
                        compress: { 
                            dead_code: true, 
                            drop_console: false, 
                            sequences: true, 
                            conditionals: true 
                        },
                        output: { comments: false, beautify: false }
                    });
                    STATE.processedContent.jsMin = jsMin.code || 'No valid JavaScript content to minify';
                } catch (e) {
                    STATE.processedContent.jsMin = 'Minification error: ' + e.message;
                }
            } else {
                STATE.processedContent.jsMin = '';
            }

            // Process CSS
            if (cssCombined) {
                try {
                    const output = cssMinifier.minify(cssCombined);
                    STATE.processedContent.cssMin = output.styles || 'No valid CSS content to minify';
                } catch (e) {
                    STATE.processedContent.cssMin = 'Minification error: ' + e.message;
                }
            } else {
                STATE.processedContent.cssMin = '';
            }

            updateStats();
        }

        function resetFiles() {
            if ((STATE.jsFiles.length > 0 || STATE.cssFiles.length > 0) && 
                !confirm('This will remove all uploaded files and reset the bundler. Continue?')) {
                return;
            }
            
            STATE.jsFiles.length = 0;
            STATE.cssFiles.length = 0;
            STATE.processedContent = { jsRaw: '', jsMin: '', cssRaw: '', cssMin: '' };
            
            document.getElementById('fileInput').value = '';
            updateFileList('js');
            updateFileList('css');
            toggleActionButtons();
            updateStats();
        }

        // ============================================================================
        // CONTENT VIEWING & DOWNLOADING
        // ============================================================================
        
        function viewContent(type, minify) {
            const hasFiles = type === 'js' ? STATE.jsFiles.length > 0 : STATE.cssFiles.length > 0;
            if (!hasFiles) {
                showNotification(`No ${type.toUpperCase()} files uploaded to view.`, 'error');
                return;
            }
            
            const content = type === 'js' 
                ? (minify ? STATE.processedContent.jsMin : STATE.processedContent.jsRaw)
                : (minify ? STATE.processedContent.cssMin : STATE.processedContent.cssRaw);
            
            const filename = type === 'js' 
                ? (minify ? 'bundle.min.js' : 'bundle.js')
                : (minify ? 'bundle.min.css' : 'bundle.css');

            if (!content) {
                showNotification(`No ${type.toUpperCase()} content available to view. Please wait for processing to complete.`, 'error');
                return;
            }

            document.getElementById('modalTitle').innerHTML = 
                `<i class="bi bi-filetype-${type}"></i> ${filename}`;
            document.getElementById('modalContent').value = content;
            document.getElementById('modalFileSize').textContent = formatFileSize(new Blob([content]).size);
            document.getElementById('modalLineCount').textContent = content.split('\n').length + ' lines';
            
            document.getElementById('modalDownloadBtn').onclick = () => downloadFile(type, minify);
        }

        function copyToClipboard() {
            const content = document.getElementById('modalContent');
            content.select();
            content.setSelectionRange(0, 99999);
            
            navigator.clipboard.writeText(content.value).then(() => {
                const btn = event.target.closest('button');
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '<i class="bi bi-check"></i> Copied!';
                btn.classList.add('btn-success');
                btn.classList.remove('btn-outline-secondary');
                
                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                    btn.classList.remove('btn-success');
                    btn.classList.add('btn-outline-secondary');
                }, 2000);
            }).catch(() => {
                showNotification('Failed to copy to clipboard', 'error');
            });
        }

        async function downloadFile(type, minify = false) {
            const hasFiles = type === 'js' ? STATE.jsFiles.length > 0 : STATE.cssFiles.length > 0;
            if (!hasFiles) {
                showNotification(`No ${type.toUpperCase()} files uploaded to download.`, 'error');
                return;
            }
            
            const content = type === 'js' 
                ? (minify ? STATE.processedContent.jsMin : STATE.processedContent.jsRaw)
                : (minify ? STATE.processedContent.cssMin : STATE.processedContent.cssRaw);
            
            const filename = type === 'js' 
                ? (minify ? 'bundle.min.js' : 'bundle.js')
                : (minify ? 'bundle.min.css' : 'bundle.css');

            if (!content) {
                showNotification(`No ${type.toUpperCase()} content available to download. Please wait for processing to complete.`, 'error');
                return;
            }

            const blob = new Blob([content], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
        }

        async function downloadAllAsZip() {
            if (!window.JSZip) {
                showNotification('JSZip library not loaded. Cannot create ZIP file.', 'error');
                return;
            }

            const hasJsFiles = STATE.jsFiles.length > 0;
            const hasCssFiles = STATE.cssFiles.length > 0;
            
            if (!hasJsFiles && !hasCssFiles) {
                showNotification('No files uploaded to create ZIP.', 'error');
                return;
            }

            const zip = new JSZip();
            let hasContent = false;

            if (hasJsFiles && STATE.processedContent.jsRaw) {
                zip.file('bundle.js', STATE.processedContent.jsRaw);
                hasContent = true;
            }
            if (hasJsFiles && STATE.processedContent.jsMin) {
                zip.file('bundle.min.js', STATE.processedContent.jsMin);
                hasContent = true;
            }
            if (hasCssFiles && STATE.processedContent.cssRaw) {
                zip.file('bundle.css', STATE.processedContent.cssRaw);
                hasContent = true;
            }
            if (hasCssFiles && STATE.processedContent.cssMin) {
                zip.file('bundle.min.css', STATE.processedContent.cssMin);
                hasContent = true;
            }

            if (!hasContent) {
                showNotification('No processed content available to create ZIP file. Please wait for processing to complete.', 'error');
                return;
            }

            try {
                showLoading(true);
                const content = await zip.generateAsync({ type: 'blob' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(content);
                a.download = 'bundle-all.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(a.href);
                showLoading(false);
            } catch (e) {
                showLoading(false);
                showNotification('Error creating ZIP file: ' + e.message, 'error');
            }
        }

        // ============================================================================
        // EVENT LISTENERS & INITIALIZATION
        // ============================================================================
        
        function initializeEventListeners() {
            const fileInput = document.getElementById('fileInput');
            
            fileInput.addEventListener('change', function(event) {
                const files = Array.from(event.target.files);
                if (files.length === 0) return;
                
                processFiles(files);
                event.target.value = ''; // Clear input for reselection
            });

            // Drag and drop functionality
            const uploadCard = document.querySelector('.card');
            
            uploadCard.addEventListener('dragover', function(e) {
                e.preventDefault();
                uploadCard.classList.add('border-primary', 'bg-light');
            });
            
            uploadCard.addEventListener('dragleave', function(e) {
                e.preventDefault();
                uploadCard.classList.remove('border-primary', 'bg-light');
            });
            
            uploadCard.addEventListener('drop', function(e) {
                e.preventDefault();
                uploadCard.classList.remove('border-primary', 'bg-light');
                
                const files = Array.from(e.dataTransfer.files);
                const validFiles = files.filter(file => 
                    CONFIG.ACCEPTED_EXTENSIONS.some(ext => 
                        file.name.toLowerCase().endsWith(ext)
                    )
                );
                
                if (validFiles.length > 0) {
                    processFiles(validFiles);
                } else {
                    showNotification('No valid JS or CSS files found in the dropped files.', 'error');
                }
            });
        }

        function initializeApp() {
            // Debug library loading
            console.log('Terser available:', !!window.Terser);
            console.log('CSSO available:', !!window.csso);
            console.log('JSZip available:', !!window.JSZip);
            
            // Initialize theme
            initializeTheme();
            
            // Initialize event listeners
            initializeEventListeners();
            
            // Initialize UI
            toggleActionButtons();
            
            console.log('JS & CSS Bundler initialized successfully!');
        }

        // ============================================================================
        // APPLICATION STARTUP
        // ============================================================================
        
        // Initialize the application when DOM is loaded
        document.addEventListener('DOMContentLoaded', initializeApp);
        
        // Also initialize if DOM is already loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeApp);
        } else {
            initializeApp();
        }