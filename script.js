// Конфигурация
const config = {
    vkApiVersion: '5.131',
    telegramBotToken: '8058938968:AAE0GqiZWvsjdaYMHJAu3k3w-ciz_euUEMw',
    telegramChatId: '595984491'
};

// Состояние приложения
let state = {
    animeList: [],
    currentAnime: null,
    currentEpisode: null,
    userRatings: JSON.parse(localStorage.getItem('ratings')) || {}
};

// DOM элементы
const elements = {
    animeList: document.getElementById('anime-list'),
    playerSection: document.getElementById('player-section'),
    videoContainer: document.getElementById('video-container'),
    videoPlaceholder: document.getElementById('video-placeholder'),
    animeTitle: document.getElementById('anime-title'),
    animeCover: document.getElementById('anime-cover'),
    animeYear: document.getElementById('anime-year'),
    animeGenres: document.getElementById('anime-genres'),
    episodes: document.getElementById('episodes'),
    ratingWidget: document.getElementById('rating-widget'),
    backBtn: document.getElementById('back-btn'),
    telegramShare: document.getElementById('telegram-share'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    vkComments: document.getElementById('vk-comments')
};

// Инициализация приложения
async function init() {
    await loadAnimeData();
    renderAnimeList();
    setupEventListeners();
    
    // Инициализация VK API
    VK.init({ apiId: 1234567 }); // Замените на ваш API ID
}

// Загрузка данных
async function loadAnimeData() {
    try {
        const response = await fetch('data.json');
        state.animeList = await response.json();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        showError('Не удалось загрузить список аниме');
    }
}

// Рендер списка аниме
function renderAnimeList(filter = '') {
    elements.animeList.innerHTML = '';
    
    const filtered = state.animeList.filter(anime => 
        anime.title.toLowerCase().includes(filter.toLowerCase()) ||
        anime.genres.some(genre => genre.toLowerCase().includes(filter.toLowerCase()))
    );
    
    filtered.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.innerHTML = `
            <img src="${anime.cover}" alt="${anime.title}" 
                 onerror="this.src='https://via.placeholder.com/300x450?text=No+Image'">
            <h3>${anime.title}</h3>
            <p>${anime.rating} ★</p>
        `;
        card.addEventListener('click', () => showAnime(anime));
        elements.animeList.appendChild(card);
    });
}

// Показать аниме
function showAnime(anime) {
    state.currentAnime = anime;
    elements.animeTitle.textContent = anime.title;
    elements.animeCover.src = anime.cover;
    elements.animeYear.textContent = anime.year;
    elements.animeGenres.textContent = anime.genres.join(', ');
    
    renderEpisodes(anime.episodes);
    renderRatingWidget(anime.id);
    
    elements.playerSection.classList.remove('hidden');
    elements.animeList.classList.add('hidden');
}

// Рендер списка серий
function renderEpisodes(episodes) {
    elements.episodes.innerHTML = '';
    
    episodes.forEach(episode => {
        const btn = document.createElement('button');
        btn.className = 'episode-btn';
        btn.textContent = `${episode.id}. ${episode.title}`;
        btn.addEventListener('click', () => playEpisode(episode));
        elements.episodes.appendChild(btn);
    });
}

// Воспроизведение эпизода
function playEpisode(episode) {
    state.currentEpisode = episode;
    elements.videoPlaceholder.style.display = 'none';
    
    // Очистка предыдущего плеера
    const oldPlayer = document.querySelector('.vk-player');
    if (oldPlayer) oldPlayer.remove();
    
    // Извлечение ID из ссылки VK
    const urlParts = episode.vk_url.match(/video-(\d+)_(\d+)/);
    if (!urlParts) {
        showError('Неверный формат ссылки на видео');
        return;
    }
    
    const ownerId = urlParts[1];
    const videoId = urlParts[2];
    
    // Создание плеера VK
    const iframe = document.createElement('iframe');
    iframe.className = 'vk-player';
    iframe.src = `https://vk.com/video_ext.php?oid=${ownerId}&id=${videoId}&hash=123abc`;
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('frameborder', '0');
    elements.videoContainer.appendChild(iframe);
    
    // Загрузка комментариев
    loadVKComments(ownerId, videoId);
    
    // Сохранение в историю
    saveToHistory(anime, episode);
}

// Загрузка комментариев VK
function loadVKComments(ownerId, videoId) {
    elements.vkComments.innerHTML = '<div class="loading">Загрузка комментариев...</div>';
    
    const pageId = `video_${ownerId}_${videoId}`;
    
    if (typeof VK !== 'undefined' && VK.Widgets) {
        initVKWidget(pageId, videoId);
    } else {
        const timer = setInterval(() => {
            if (typeof VK !== 'undefined' && VK.Widgets) {
                clearInterval(timer);
                initVKWidget(pageId, videoId);
            }
        }, 500);
    }
}

function initVKWidget(pageId, videoId) {
    try {
        VK.Widgets.Comments('vk-comments', {
            limit: 15,
            attach: false,
            pageId: pageId,
            autoPublish: 0
        }, videoId);
    } catch (e) {
        elements.vkComments.innerHTML = '<div class="error">Не удалось загрузить комментарии</div>';
    }
}

// Система рейтингов
function renderRatingWidget(animeId) {
    const currentRating = state.userRatings[animeId] || 0;
    const stars = [1, 2, 3, 4, 5].map(i => `
        <i class="fas fa-star ${i <= currentRating ? 'active' : ''}" 
           data-rating="${i}"></i>
    `).join('');
    
    elements.ratingWidget.innerHTML = `
        <div class="rating-widget">
            <h4>Ваша оценка:</h4>
            <div class="stars">${stars}</div>
        </div>
    `;
    
    // Обработка кликов по звездам
    elements.ratingWidget.querySelectorAll('.fa-star').forEach(star => {
        star.addEventListener('click', () => {
            const rating = parseInt(star.dataset.rating);
            rateAnime(animeId, rating);
        });
    });
}

function rateAnime(animeId, rating) {
    state.userRatings[animeId] = rating;
    localStorage.setItem('ratings', JSON.stringify(state.userRatings));
    renderRatingWidget(animeId);
}

// Интеграция с Telegram
function setupTelegramShare() {
    elements.telegramShare.addEventListener('click', () => {
        if (!state.currentAnime || !state.currentEpisode) return;
        
        const anime = state.currentAnime;
        const episode = state.currentEpisode;
        const url = `https://vk.com/video${episode.vk_url.split('video')[1]}`;
        
        const message = `Смотри "${anime.title}" - ${episode.title}:\n${url}`;
        
        // Отправка через Telegram API
        fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: config.telegramChatId,
                text: message,
                parse_mode: 'HTML'
            })
        })
        .then(() => showAlert('Ссылка отправлена в Telegram!'))
        .catch(err => showError('Ошибка отправки'));
    });
}

// Вспомогательные функции
function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert error';
    alert.textContent = message;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

function showAlert(message) {
    const alert = document.createElement('div');
    alert.className = 'alert success';
    alert.textContent = message;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
}

function saveToHistory(anime, episode) {
    const history = JSON.parse(localStorage.getItem('history') || '[]');
    history.unshift({
        animeId: anime.id,
        animeTitle: anime.title,
        episodeId: episode.id,
        episodeTitle: episode.title,
        timestamp: Date.now()
    });
    localStorage.setItem('history', JSON.stringify(history.slice(0, 50)));
}

function setupEventListeners() {
    elements.backBtn.addEventListener('click', () => {
        elements.playerSection.classList.add('hidden');
        elements.animeList.classList.remove('hidden');
        elements.videoContainer.innerHTML = '';
        elements.videoPlaceholder.style.display = 'flex';
    });
    
    elements.searchBtn.addEventListener('click', () => {
        renderAnimeList(elements.searchInput.value);
    });
    
    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') renderAnimeList(elements.searchInput.value);
    });
    
    setupTelegramShare();
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);
