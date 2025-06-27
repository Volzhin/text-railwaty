const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Настройка multer для загрузки файлов
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Форматы изображений
const formats = {
  'vk-square': { width: 600, height: 600 },
  'vk-portrait': { width: 1080, height: 1350 },
  'vk-landscape': { width: 1080, height: 607 },
  'stories': { width: 1080, height: 1920 }
};

// Функция для создания SVG с текстом
function createTextSVG(logoText, title, subtitle, disclaimer, logoUrl, format) {
  const { width, height } = formats[format];
  
  // Настройки для разных форматов
  let logoTextSize, titleSize, subtitleSize, disclaimerSize, padding;
  
  switch (format) {
    case 'vk-square':
      logoTextSize = 52;
      titleSize = 42;
      subtitleSize = 24;
      disclaimerSize = 16;
      padding = 40;
      break;
    case 'vk-portrait':
      logoTextSize = 72;
      titleSize = 64;
      subtitleSize = 36;
      disclaimerSize = 24;
      padding = 60;
      break;
    case 'vk-landscape':
      logoTextSize = 58;
      titleSize = 48;
      subtitleSize = 28;
      disclaimerSize = 20;
      padding = 50;
      break;
    case 'stories':
      logoTextSize = 68;
      titleSize = 56;
      subtitleSize = 32;
      disclaimerSize = 22;
      padding = 60;
      break;
  }

  // Функция для разбивки текста на строки
  function wrapText(text, maxLength) {
    if (!text) return [];
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + ' ' + word).length <= maxLength) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  let currentY = padding;
  let svgElements = [];

  // Добавляем затемнение
  svgElements.push(`
    <defs>
      <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:black;stop-opacity:0.3" />
        <stop offset="100%" style="stop-color:black;stop-opacity:0.6" />
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#overlay)" />
  `);

  // Логотип-текст (например "YANGO")
  if (logoText) {
    svgElements.push(`
      <text x="${padding}" y="${currentY + logoTextSize}" 
            font-family="Arial, sans-serif" 
            font-size="${logoTextSize}" 
            font-weight="bold" 
            fill="white" 
            text-shadow="2px 2px 4px rgba(0,0,0,0.8)">
        ${logoText}
      </text>
    `);
    currentY += logoTextSize * 1.2 + 30;
  }

  // Заголовок
  if (title) {
    const titleLines = wrapText(title, Math.floor((width - padding * 2) / (titleSize * 0.6)));
    titleLines.forEach(line => {
      svgElements.push(`
        <text x="${padding}" y="${currentY + titleSize}" 
              font-family="Arial, sans-serif" 
              font-size="${titleSize}" 
              font-weight="bold" 
              fill="white" 
              text-shadow="2px 2px 4px rgba(0,0,0,0.5)">
          ${line}
        </text>
      `);
      currentY += titleSize * 1.2;
    });
    currentY += 20;
  }

  // Подзаголовок
  if (subtitle) {
    const subtitleLines = wrapText(subtitle, Math.floor((width - padding * 2) / (subtitleSize * 0.6)));
    subtitleLines.forEach(line => {
      svgElements.push(`
        <text x="${padding}" y="${currentY + subtitleSize}" 
              font-family="Arial, sans-serif" 
              font-size="${subtitleSize}" 
              fill="white" 
              text-shadow="2px 2px 4px rgba(0,0,0,0.5)">
          ${line}
        </text>
      `);
      currentY += subtitleSize * 1.2;
    });
  }

  // Дисклеймер внизу
  if (disclaimer) {
    const disclaimerLines = wrapText(disclaimer, Math.floor((width - padding * 2) / (disclaimerSize * 0.6)));
    const disclaimerHeight = disclaimerLines.length * disclaimerSize * 1.2;
    let disclaimerY = height - padding - disclaimerHeight + disclaimerSize;
    
    disclaimerLines.forEach(line => {
      svgElements.push(`
        <text x="${padding}" y="${disclaimerY}" 
              font-family="Arial, sans-serif" 
              font-size="${disclaimerSize}" 
              fill="#CCCCCC" 
              text-shadow="2px 2px 4px rgba(0,0,0,0.5)">
          ${line}
        </text>
      `);
      disclaimerY += disclaimerSize * 1.2;
    });
  }

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      ${svgElements.join('')}
    </svg>
  `;
}

// Функция для создания изображения
async function generateImage(backgroundBuffer, logoUrl, logoText, title, subtitle, disclaimer, format) {
  const { width, height } = formats[format];
  
  try {
    // Обработка фонового изображения
    const backgroundImage = await sharp(backgroundBuffer)
      .resize(width, height, { fit: 'cover' })
      .toBuffer();

    // Создание SVG с текстом
    const textSVG = createTextSVG(logoText, title, subtitle, disclaimer, logoUrl, format);
    const textBuffer = Buffer.from(textSVG);

    // Наложение текста на фон
    const result = await sharp(backgroundImage)
      .composite([
        {
          input: textBuffer,
          top: 0,
          left: 0
        }
      ])
      .png()
      .toBuffer();

    return result;
  } catch (error) {
    console.error('Ошибка создания изображения:', error);
    throw error;
  }
}

// API endpoint для генерации изображения
app.post('/generate/:format', upload.single('image'), async (req, res) => {
  try {
    const { format } = req.params;
    const { logoText, title, subtitle, disclaimer, logoUrl } = req.body;
    
    if (!formats[format]) {
      return res.status(400).json({ error: 'Неподдерживаемый формат' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Изображение не загружено' });
    }
    
    const imageBuffer = await generateImage(
      req.file.buffer,
      logoUrl,      // URL логотипа-изображения
      logoText,     // Текст логотипа (например "YANGO")
      title,        // Заголовок (где "Заголовок")
      subtitle,     // Подзаголовок (где "Подзаголовок")
      disclaimer,   // Дисклеймер (где "Дисклеймер")
      format
    );
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="generated-${format}.png"`
    });
    
    res.send(imageBuffer);
    
  } catch (error) {
    console.error('Ошибка генерации изображения:', error);
    res.status(500).json({ error: 'Ошибка генерации изображения: ' + error.message });
  }
});

// Endpoint для получения доступных форматов
app.get('/formats', (req, res) => {
  res.json(formats);
});

// Базовый endpoint для проверки работоспособности
app.get('/', (req, res) => {
  res.json({ 
    message: 'Image Generator API работает!',
    endpoints: {
      'POST /generate/:format': 'Генерация изображения',
      'GET /formats': 'Получить доступные форматы',
      'GET /': 'Проверка работоспособности'
    },
    formats: Object.keys(formats)
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
