// src/ui.js
export function setupUI(startButton, callback) {
    startButton.addEventListener('click', () => callback());
}

