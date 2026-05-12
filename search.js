// Client-side search with UI integration
let searchIndex = [];

async function loadSearchIndex() {
    try {
        const response = await fetch('/search-index.json');
        searchIndex = await response.json();
    } catch (e) {
        console.error('Failed to load search index:', e);
    }
}

function search(query) {
    if (!query || query.length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    const terms = lowerQuery.split(' ').filter(t => t.length > 1);
    
    return searchIndex
        .map(entry => {
            let score = 0;
            
            // Заголовок (высокий приоритет)
            const titleLower = entry.title.toLowerCase();
            if (titleLower === lowerQuery) score += 100;
            else if (titleLower.includes(lowerQuery)) score += 50;
            
            terms.forEach(term => {
                if (titleLower.includes(term)) score += 20;
            });
            
            // Контент (низкий приоритет)
            const contentLower = entry.content.toLowerCase();
            terms.forEach(term => {
                const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
                score += matches * 2;
            });
            
            // Теги
            if (entry.tags && entry.tags.length > 0) {
                entry.tags.forEach(tag => {
                    if (tag.toLowerCase().includes(lowerQuery)) score += 30;
                });
            }
            
            return { ...entry, score };
        })
        .filter(e => e.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 15);
}

function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('searchResults');
    
    if (!searchInput || !resultsContainer) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        const results = search(query);
        
        if (!query || query.length < 2) {
            resultsContainer.innerHTML = '';
            return;
        }
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div style="padding: 8px; color: #666; font-size: 13px;">No results found</div>';
            return;
        }
        
        resultsContainer.innerHTML = results
            .map(result => {
                const url = result.url;
                const title = escapeHtml(result.title);
                const type = escapeHtml(result.type);
                const project = escapeHtml(result.project);
                const preview = escapeHtml(result.content.substring(0, 100));
                return `<div class="result-item" onclick="window.location='${url}'" title="${preview}"><strong>${title}</strong><div style="font-size: 12px; color: #666;">${type} • ${project}</div></div>`;
            })
            .join('');
    });
    
    // Закрываем результаты при клике вне поля
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.sidebar-search')) {
            resultsContainer.innerHTML = '';
        }
    });
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Инициализация
loadSearchIndex();
window.initializeSearch = initializeSearch;