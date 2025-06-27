const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { createCanvas, loadImage, registerFont } = require('canvas');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

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

// Утилиты для работы с текстом
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

function drawTextWithShadow(ctx, text, x, y, color = '#FFFFFF', shadowColor = 'rgba(0,0,0,0.5)') {
  // Тень
  ctx.fillStyle = shadowColor;
  ctx.fillText(text, x + 2, y + 2);
  
  // Основной текст
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

// Функция для создания изображения
async function generateImage(backgroundBuffer, logoUrl, logoText, subtitle, disclaimer, format) {
  const { width, height } = formats[format];
  
  // Создание canvas
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Загрузка и обработка фонового изображения
  const processedBackground = await sharp(backgroundBuffer)
    .resize(width, height, { fit: 'cover' })
    .toBuffer();
  
  const backgroundImage = await loadImage(processedBackground);
  ctx.drawImage(backgroundImage, 0, 0, width, height);
  
  // Добавление затемнения для лучшей читаемости текста
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, 'rgba(0,0,0,0.3)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Настройки для разных форматов
  let logoTextSize, subtitleSize, disclaimerSize, padding, logoImageSize;
  
  switch (format) {
    case 'vk-square':
      logoTextSize = 52;
      subtitleSize = 24;
      disclaimerSize = 16;
      padding = 40;
      logoImageSize = 80;
      break;
    case 'vk-portrait':
      logoTextSize = 72;
      subtitleSize = 36;
      disclaimerSize = 24;
      padding = 60;
      logoImageSize = 120;
      break;
    case 'vk-landscape':
      logoTextSize = 58;
      subtitleSize = 28;
      disclaimerSize = 20;
      padding = 50;
      logoImageSize = 100;
      break;
    case 'stories':
      logoTextSize = 68;
      subtitleSize = 32;
      disclaimerSize = 22;
      padding = 60;
      logoImageSize = 120;
      break;
  }
  
  // Загрузка логотипа-изображения (если есть)
  let logoImage = null;
  if (logoUrl) {
    try {
      const logoResponse = await axios.get(logoUrl, { responseType: 'arraybuffer' });
      const logoBuffer = Buffer.from(logoResponse.data);
      logoImage = await loadImage(logoBuffer);
    } catch (error) {
      console.log('Ошибка загрузки логотипа:', error);
    }
  }
  
  // Позиционирование элементов
  const textMaxWidth = width - (padding * 2);
  let currentY = padding;
  
  // Логотип-изображение в верхней части (если есть)
  if (logoImage) {
    const logoAspect = logoImage.width / logoImage.height;
    const logoWidth = logoImageSize;
    const logoHeight = logoImageSize / logoAspect;
    
    ctx.drawImage(logoImage, padding, currentY, logoWidth, logoHeight);
    currentY += logoHeight + 30;
  }
  
  // Логотип-текст (например "YANGO")
  if (logoText) {
    ctx.font = `bold ${logoTextSize}px Arial, sans-serif`;
    ctx.textAlign = 'left';
    
    // Делаем логотип-текст более ярким и заметным
    drawTextWithShadow(ctx, logoText, padding, currentY, '#FFFFFF', 'rgba(0,0,0,0.8)');
    currentY += logoTextSize * 1.2 + 30;
  }
  
  // Подзаголовок
  if (subtitle) {
    ctx.font = `${subtitleSize}px Arial, sans-serif`;
    
    const subtitleLines = wrapText(ctx, subtitle, textMaxWidth);
    subtitleLines.forEach(line => {
      drawTextWithShadow(ctx, line, padding, currentY);
      currentY += subtitleSize * 1.2;
    });
    currentY += 30;
  }
  
  // Дисклеймер внизу
  if (disclaimer) {
    ctx.font = `${disclaimerSize}px Arial, sans-serif`;
    const disclaimerLines = wrapText(ctx, disclaimer, textMaxWidth);
    
    // Позиционируем дисклеймер внизу
    const disclaimerHeight = disclaimerLines.length * disclaimerSize * 1.2;
    let disclaimerY = height - padding - disclaimerHeight;
    
    disclaimerLines.forEach(line => {
      drawTextWithShadow(ctx, line, padding, disclaimerY, '#CCCCCC');
      disclaimerY += disclaimerSize * 1.2;
    });
  }
  
  return canvas.toBuffer('image/png');
}

// API endpoint для генерации изображения
app.post('/generate/:format', upload.single('image'), async (req, res) => {
  try {
    const { format } = req.params;
    const { title, subtitle, disclaimer, logoUrl } = req.body;
    
    if (!formats[format]) {
      return res.status(400).json({ error: 'Неподдерживаемый формат' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Изображение не загружено' });
    }
    
    const imageBuffer = await generateImage(
      req.file.buffer,
      logoUrl,
      title, // title теперь используется как логотип-текст (например "YANGO")
      subtitle,
      disclaimer,
      format
    );
    
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="generated-${format}.png"`
    });
    
    res.send(imageBuffer);
    
  } catch (error) {
    console.error('Ошибка генерации изображения:', error);
    res.status(500).json({ error: 'Ошибка генерации изображения' });
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
