# Image Generator Backend

Бэкенд для генерации изображений с текстом для социальных сетей.

## Возможности

- Генерация изображений в 4 форматах:
  - VK квадрат (600x600)
  - VK портрет (1080x1350) 
  - VK пейзаж (1080x607)
  - Stories (1080x1920)
- Автоматическое определение размеров и позиционирование текста
- Поддержка логотипов
- Адаптивные размеры шрифтов для каждого формата

## Установка

1. Клонируйте репозиторий
2. Установите зависимости:
```bash
npm install
```

3. Запустите сервер:
```bash
npm start
```

Для разработки:
```bash
npm run dev
```

## Деплой на Railway

1. Создайте новый проект на Railway
2. Подключите ваш GitHub репозиторий
3. Railway автоматически определит Node.js проект и развернет его
4. Убедитесь, что в настройках указана правильная команда запуска: `npm start`

## API Endpoints

### POST /generate/:format

Генерирует изображение в указанном формате.

**Параметры URL:**
- `format` - один из: `vk-square`, `vk-portrait`, `vk-landscape`, `stories`

**Тело запроса (multipart/form-data):**
- `image` (file) - фоновое изображение
- `title` (string) - логотип-текст (например "YANGO")
- `subtitle` (string) - подзаголовок  
- `disclaimer` (string) - дисклеймер
- `logoUrl` (string) - URL логотипа-изображения (опционально)

**Ответ:** PNG изображение

### GET /formats

Возвращает список доступных форматов с размерами.

### GET /

Проверка работоспособности API.

## Пример использования

### JavaScript/Fetch
```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('title', 'YANGO'); // Логотип-текст
formData.append('subtitle', 'Заголовок');
formData.append('disclaimer', 'Дисклеймер');
formData.append('logoUrl', 'https://example.com/logo.png'); // Опционально

fetch('/generate/vk-square', {
  method: 'POST',
  body: formData
})
.then(response => response.blob())
.then(blob => {
  const url = URL.createObjectURL(blob);
  // Использовать URL для отображения или скачивания
});
```

### cURL
```bash
curl -X POST \
  -F "image=@background.jpg" \
  -F "title=YANGO" \
  -F "subtitle=Заголовок" \
  -F "disclaimer=Дисклеймер" \
  -F "logoUrl=https://example.com/logo.png" \
  http://localhost:3000/generate/vk-square \
  --output generated.png
```

## Форматы

- **vk-square** (600x600) - квадратный формат для постов VK
- **vk-portrait** (1080x1350) - вертикальный формат для VK
- **vk-landscape** (1080x607) - горизонтальный формат для VK  
- **stories** (1080x1920) - формат для Stories

## Особенности

- Автоматическое масштабирование фонового изображения
- Адаптивные размеры шрифтов для каждого формата
- Перенос длинного текста на новые строки
- Тени для текста для лучшей читаемости
- Затемнение фона для контраста
- Поддержка внешних логотипов по URL

## Зависимости

- **express** - веб-фреймворк
- **multer** - загрузка файлов
- **sharp** - обработка изображений
- **canvas** - рендеринг на Canvas
- **cors** - поддержка CORS
- **axios** - HTTP клиент для загрузки логотипов
