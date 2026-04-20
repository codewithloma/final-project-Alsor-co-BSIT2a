export function formatTime(timestamp) {
    const diff = Math.floor((Date.now() - new Date(timestamp)) / 60000);
    if (diff < 1)    return 'Just now';
    if (diff < 60)   return `${diff}m`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h`;
    return `${Math.floor(diff / 1440)}d`;
}

export function formatContent(content) {
    return content
        .replace(/#(\w+)/g, '<span class="hashtag">#$1</span>')
        .replace(/@(\w+)/g, '<span class="mention">@$1</span>');
}

export function showToast(message) {
    const existing = document.getElementById('dearbup-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'dearbup-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position:fixed;bottom:24px;right:24px;
        background:linear-gradient(135deg,#e06a72,#d65d64);
        color:white;padding:12px 20px;border-radius:25px;
        font-weight:500;z-index:10000;
        transform:translateX(120%);transition:transform 0.3s ease;
        box-shadow:0 8px 25px rgba(214,93,100,0.4);font-size:14px;`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}