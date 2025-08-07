// DOM элементы
const animeListEl = document.getElementById('anime-list');
const playerSection = document.getElementById('player-section');
const videoContainer = document.getElementById('video-container');
const episodesEl = document.getElementById('episodes');
const commentsList = document.getElementById('comments-list');
const commentText = document.getElementById('comment-text');
const submitComment = document.getElementById('submit-comment');
const themeToggle = document.getElementById('theme-toggle');
const backButton = document.getElementById('back-button');

let currentAnime = null;
let currentEpisode = null;

// Загрузка данных
async function loadAnimeData() {
    const response = await fetch('data.json');
    const data = await response.json();
    renderAnimeList(data);
}

// Отображение списка аниме
function renderAnimeList(animeList) {
    animeListEl.innerHTML = '';
    animeList.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.innerHTML = `
            <img src="${anime.cover}" alt="${anime.title}">
            <h3>${anime.title}</h3>
        `;
        card.addEventListener('click', () => showAnime(anime));
        animeListEl.appendChild(card);
    });
}

// Показать плеер для выбранного аниме
function showAnime(anime) {
    currentAnime = anime;
    animeListEl.classList.add('hidden');
    playerSection.classList.remove('hidden');
    renderEpisodes(anime.episodes);
}

// Отображение списка серий
function renderEpisodes(episodes) {
    episodesEl.innerHTML = '';
    episodes.forEach(episode => {
        const btn = document.createElement('button');
        btn.className = 'episode-btn';
        btn.textContent = episode.title;
        btn.addEventListener('click', () => playEpisode(episode));
        episodesEl.appendChild(btn);
    });
}

// Воспроизведение эпизода
function playEpisode(episode) {
    currentEpisode = episode;
    videoContainer.innerHTML = `
        <iframe 
            src="https://vk.com/video_ext.php?oid=${episode.vk_owner_id}&id=${episode.vk_video_id}&hash=123abc" 
            allowfullscreen
        ></iframe>
    `;
    loadComments();
}

// Работа с комментариями
function loadComments() {
    commentsList.innerHTML = '';
    const comments = JSON.parse(localStorage.getItem(`comments_${currentEpisode.vk_video_id}`)) || [];
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p>Пока нет комментариев. Будьте первым!</p>';
        return;
    }
    
    comments.forEach(comment => {
        const commentEl = document.createElement('div');
        commentEl.className = 'comment';
        commentEl.innerHTML = `
            <div class="comment-header">
                <span>${comment.username}</span>
                <span>${new Date(comment.timestamp).toLocaleString()}</span>
            </div>
            <p>${comment.text}</p>
        `;
        commentsList.appendChild(commentEl);
    });
}

function saveComment() {
    const text = commentText.value.trim();
    if (!text) return;
    
    const comments = JSON.parse(localStorage.getItem(`comments_${currentEpisode.vk_video_id}`)) || [];
    const newComment = {
        username: 'Аноним',
        text: text,
        timestamp: Date.now()
    };
    
    comments.push(newComment);
    localStorage.setItem(`comments_${currentEpisode.vk_video_id}`, JSON.stringify(comments));
    commentText.value = '';
    loadComments();
}

// Управление темами
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    themeToggle.textContent = isLight ? '🌙 Темная тема' : '☀️ Светлая тема';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeToggle.textContent = '🌙 Темная тема';
    } else {
        themeToggle.textContent = '☀️ Светлая тема';
    }
}

// Навигация
function goBack() {
    playerSection.classList.add('hidden');
    animeListEl.classList.remove('hidden');
    currentAnime = null;
    currentEpisode = null;
}

// Обработчики событий
submitComment.addEventListener('click', saveComment);
commentText.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveComment();
    }
});

themeToggle.addEventListener('click', toggleTheme);
backButton.addEventListener('click', goBack);

// Инициализация
applySavedTheme();
loadAnimeData();
