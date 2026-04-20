import { guardAuth, bootSidebar } from './auth.js';
import { PostManager } from './posts.js';
import { LetterManager } from './letters.js';

// Run Auth Check
guardAuth();

// Boot application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Sidebar Profile
    bootSidebar();

    // Initialize the main modules
    window.postManager = new PostManager();
    window.letterManager = new LetterManager();

    // Handle Mobile Sidebar Toggle
    const menuToggle = document.getElementById('menuToggle');
    const sidebar    = document.querySelector('.sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('active') &&
                !sidebar.contains(e.target) &&
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    }
});