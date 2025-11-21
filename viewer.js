// Viewer Logic

const viewerContainer = document.getElementById('viewer-container');
const landingContainer = document.getElementById('landing-container');
const flipbook = document.getElementById('flipbook');
const pubTitle = document.getElementById('pub-title');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const pageIndicator = document.getElementById('page-indicator');

let currentPage = 1;
let totalPages = 0;
let currentPubId = null;

async function initViewer() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (!id) {
        landingContainer.classList.remove('hidden');
        viewerContainer.classList.add('hidden');
        return;
    }

    currentPubId = id;
    landingContainer.classList.add('hidden');
    viewerContainer.classList.remove('hidden');

    await loadPublication(id);
}

async function loadPublication(id) {
    // Fetch metadata
    const { data: pub, error } = await supabaseClient
        .from('publications')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !pub) {
        alert('Publication not found');
        return;
    }

    pubTitle.textContent = pub.title;
    totalPages = pub.page_count;

    // Increment views (fire and forget)
    supabaseClient.rpc('increment_views', { row_id: id });
    // Note: increment_views needs to be a stored procedure, or we just ignore it for now.

    renderPage(1);
}

function renderPage(pageNum) {
    if (pageNum < 1 || pageNum > totalPages) return;

    currentPage = pageNum;
    pageIndicator.textContent = `Page ${currentPage} / ${totalPages}`;

    // Simple Image Display for MVP (Flipbook effect can be added with libraries like turn.js later)
    // For now, just show the current page image.

    const imageUrl = supabaseClient.storage
        .from('pages')
        .getPublicUrl(`${currentPubId}/${currentPage}.jpg`).data.publicUrl;

    flipbook.innerHTML = `
        <div class="page-wrapper" style="box-shadow: 0 4px 10px rgba(0,0,0,0.2);">
            <img src="${imageUrl}" alt="Page ${currentPage}" style="max-height: 80vh; max-width: 100%; display: block;">
        </div>
    `;

    // Update buttons
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

prevBtn.addEventListener('click', () => renderPage(currentPage - 1));
nextBtn.addEventListener('click', () => renderPage(currentPage + 1));

// Keyboard nav
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') renderPage(currentPage - 1);
    if (e.key === 'ArrowRight') renderPage(currentPage + 1);
});

initViewer();
