// Admin Dashboard Logic

const loginForm = document.getElementById('login-form');
const loginScreen = document.getElementById('login-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const fileInput = document.getElementById('file-input');
const dropzone = document.getElementById('dropzone');
const progressContainer = document.getElementById('upload-progress');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const pubList = document.getElementById('pub-list');

// --- Auth ---

async function initAdmin() {
    const session = await checkAuth();
    if (session) {
        showDashboard();
    } else {
        showLogin();
    }
}

function showLogin() {
    loginScreen.classList.remove('hidden');
    dashboardScreen.classList.add('hidden');
}

function showDashboard() {
    loginScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    loadPublications();
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('login-error');

    errorMsg.textContent = 'Logging in...';

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        errorMsg.textContent = error.message;
    } else {
        errorMsg.textContent = '';
        showDashboard();
    }
});

document.getElementById('logout-btn').addEventListener('click', logout);

// --- Upload & Processing ---

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--primary)';
});
dropzone.addEventListener('dragleave', () => {
    dropzone.style.borderColor = 'var(--border)';
});
dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.style.borderColor = 'var(--border)';
    if (e.dataTransfer.files.length) {
        handleFileUpload(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleFileUpload(e.target.files[0]);
    }
});

async function handleFileUpload(file) {
    if (file.type !== 'application/pdf') {
        alert('Please upload a PDF file.');
        return;
    }

    // UI Update
    dropzone.classList.add('hidden');
    progressContainer.classList.remove('hidden');
    updateProgress(0, 'Starting upload...');

    try {
        const pubId = crypto.randomUUID();
        const timestamp = Date.now();

        // 1. Upload PDF
        updateProgress(10, 'Uploading PDF...');
        const pdfPath = `${pubId}/${timestamp}_${file.name}`;
        const { error: uploadError } = await supabaseClient.storage
            .from('pdfs')
            .upload(pdfPath, file);

        if (uploadError) throw uploadError;

        // 2. Process PDF to Images (Client-side)
        updateProgress(20, 'Processing PDF pages...');
        const pageCount = await processPdfToImages(file, pubId, (percent) => {
            updateProgress(20 + (percent * 0.6), `Processing page ${Math.ceil((percent / 100) * pageCount)}...`);
        });

        // 3. Create DB Record
        updateProgress(90, 'Saving metadata...');
        const { error: dbError } = await supabaseClient
            .from('publications')
            .insert({
                id: pubId,
                title: file.name.replace('.pdf', ''),
                filename: file.name,
                page_count: pageCount,
                description: 'Uploaded via Mini Issuu'
            });

        if (dbError) throw dbError;

        updateProgress(100, 'Done!');
        setTimeout(() => {
            progressContainer.classList.add('hidden');
            dropzone.classList.remove('hidden');
            loadPublications();
        }, 1000);

    } catch (err) {
        console.error(err);
        alert('Upload failed: ' + err.message);
        progressContainer.classList.add('hidden');
        dropzone.classList.remove('hidden');
    }
}

function updateProgress(percent, text) {
    progressFill.style.width = `${percent}%`;
    if (text) progressText.textContent = text;
}

async function processPdfToImages(file, pubId, onProgress) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const totalPages = pdf.numPages;

    for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 }); // Adjust scale for quality

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;

        // Convert to Blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));

        // Upload Image
        const imagePath = `${pubId}/${i}.jpg`;
        await supabaseClient.storage
            .from('pages')
            .upload(imagePath, blob);

        if (onProgress) onProgress((i / totalPages) * 100);
    }

    return totalPages;
}

// --- List ---

async function loadPublications() {
    pubList.innerHTML = '<p class="loading-text">Loading...</p>';

    const { data, error } = await supabaseClient
        .from('publications')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        pubList.innerHTML = `<p class="error-msg">Error: ${error.message}</p>`;
        return;
    }

    if (data.length === 0) {
        pubList.innerHTML = '<p>No publications found.</p>';
        return;
    }

    pubList.innerHTML = data.map(pub => `
        <div class="pub-item" style="border: 1px solid var(--border); padding: 1rem; margin-bottom: 1rem; border-radius: var(--radius); background: var(--bg-card);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="margin-bottom: 0.25rem;">${pub.title}</h4>
                    <p style="font-size: 0.875rem; color: var(--text-muted);">${pub.page_count} pages • ${new Date(pub.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                    <a href="index.html?id=${pub.id}" target="_blank" class="btn-secondary" style="text-decoration: none; font-size: 0.875rem; margin-right: 0.5rem;">View</a>
                    <button onclick="deletePub('${pub.id}')" class="btn-secondary" style="color: var(--error); border-color: var(--error);">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function deletePub(id) {
    if (!confirm('Are you sure you want to delete this publication?')) return;

    // Note: In a real app, you'd want to delete files from storage too.
    // Supabase doesn't support folder deletion easily via client without a function, 
    // but we can delete the DB record and let files be orphaned or clean up later.

    const { error } = await supabaseClient
        .from('publications')
        .delete()
        .eq('id', id);

    if (error) {
        alert('Error deleting: ' + error.message);
    } else {
        loadPublications();
    }
}

// Expose deletePub to global scope for onclick
window.deletePub = deletePub;

// Start
initAdmin();
