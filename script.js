document.addEventListener('DOMContentLoaded', function() {
  const videoPlayer = document.getElementById('video-player');
  const episodesList = document.getElementById('episodes');
  
  // Загрузка данных из JSON
  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      // Отображение списка эпизодов
      data.forEach(episode => {
        const li = document.createElement('li');
        li.textContent = `${episode.title} - Эпизод ${episode.episode}`;
        li.addEventListener('click', () => loadVideo(episode.vk_video_url));
        episodesList.appendChild(li);
      });
      
      // Загрузка первого видео по умолчанию
      if (data.length > 0) {
        loadVideo(data[0].vk_video_url);
      }
    })
    .catch(error => console.error('Ошибка загрузки данных:', error));
  
  // Функция для загрузки видео из VK
  function loadVideo(vkUrl) {
    // Извлекаем ID видео из URL VK
    const match = vkUrl.match(/video(-?\d+_\d+)/);
    if (match && match[1]) {
      const videoId = match[1];
      const embedUrl = `https://vk.com/video_ext.php?oid=${videoId.split('_')[0].replace('-', '')}&id=${videoId.split('_')[1]}&hash=`;
      
      videoPlayer.src = embedUrl;
    } else {
      console.error('Неверный формат URL VK видео');
    }
  }
});
