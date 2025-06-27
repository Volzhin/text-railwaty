const express = require('express');
const multer = require('multer');
const cors = require('cors');

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

// Функция для создания HTML-превью изображения
function createImagePreview(logoText, title, subtitle, disclaimer, format) {
  const { width, height } = formats[format];
  
  // Настройки для разных форматов
  let logoTextSize, titleSize, subtitleSize, disclaimerSize, padding;
  
  switch (format) {
    case 'vk-square':
      logoTextSize = Math.floor(52 * (width / 600));
      titleSize = Math.floor(42 * (width / 600));
      subtitleSize = Math.floor(24 * (width / 600));
      disclaimerSize = Math.floor(16 * (width / 600));
      padding = Math.floor(40 * (width / 600));
      break;
    case 'vk-portrait':
      logoTextSize = Math.floor(72 * (width / 1080));
      titleSize = Math.floor(64 * (width / 1080));
      subtitleSize = Math.floor(36 * (width / 1080));
      disclaimerSize = Math.floor(24 * (width / 1080));
      padding = Math.floor(60 * (width / 1080));
      break;
    case 'vk-landscape':
      logoTextSize = Math.floor(58 * (width / 1080));
      titleSize = Math.floor(48 * (width / 1080));
      subtitleSize = Math.floor(28 * (width / 1080));
      disclaimerSize = Math.floor(20 * (width / 1080));
      padding = Math.floor(50 * (width / 1080));
      break;
    case 'stories':
      logoTextSize = Math.floor(68 * (width / 1080));
      titleSize = Math.floor(56 * (width / 1080));
      subtitleSize = Math.floor(32 * (width / 1080));
      disclaimerSize = Math.floor(22 * (width / 1080));
      padding = Math.floor(60 * (width / 1080));
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Generated Image Preview</title>
        <style>
            body { margin: 0; padding: 20px; background: #f0f0f0; font-family: Arial, sans-serif; }
            .container { 
                max-width: ${width}px; 
                margin: 0 auto; 
                background: white; 
                border-radius: 8px; 
                overflow: hidden;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .image-preview { 
                width: ${width}px; 
                height: ${height}px; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                position: relative; 
                display: flex;
                flex-direction: column;
                padding: ${padding}px;
                box-sizing: border-box;
                overflow: hidden;
            }
            .image-preview::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%);
                z-index: 1;
            }
            .content {
                position: relative;
                z-index: 2;
                color: white;
                height: 100%;
                display: flex;
                flex-direction: column;
            }
            .logo-text { 
                font-size: ${logoTextSize}px; 
                font-weight: bold; 
                margin-bottom: 30px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                line-height: 1.2;
            }
            .title { 
                font-size: ${titleSize}px; 
                font-weight: bold; 
                margin-bottom: 20px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                line-height: 1.2;
            }
            .subtitle { 
                font-size: ${subtitleSize}px; 
                margin-bottom: 30px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                line-height: 1.2;
            }
            .disclaimer { 
                font-size: ${disclaimerSize}px; 
                color: #CCCCCC;
                margin-top: auto;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                line-height: 1.2;
            }
            .info {
                padding: 20px;
                background: #f8f9fa;
                border-top: 1px solid #dee2e6;
            }
            .download-info {
                text-align: center;
                color: #6c757d;
                font-size: 14px;
                margin-top: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="image-preview">
                <div class="content">
                    ${logoText ? `<div class="logo-text">${logoText}</div>` : ''}
                    ${title ? `<div class="title">${title}</div>` : ''}
                    ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
                    ${disclaimer ? `<div class="disclaimer">${disclaimer}</div>` : ''}
                </div>
            </div>
            <div class="info">
                <h3>Превью изображения</h3>
                <p><strong>Формат:</strong> ${format} (${width}x${height})</p>
                <p><strong>Статус:</strong> ✅ Изображение готово для генерации</p>
                <div class="download-info">
                    Для получения реального PNG изображения используйте клиент с поддержкой изображений
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
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
    
    // Временно возвращаем HTML превью вместо изображения
    const htmlPreview = createImagePreview(logoText, title, subtitle, disclaimer, format);
    
    res.set({
      'Content-Type': 'text/html; charset=utf-8'
    });
    
    res.send(htmlPreview);
    
  } catch (error) {
    console.error('Ошибка генерации изображения:', error);
    res.status(500).json({ error: 'Ошибка генерации изображения: ' + error.message });
  }
});

// API endpoint для генерации в формате JSON (для API клиентов)
app.post('/generate-json/:format', upload.single('image'), async (req, res) => {
  try {
    const { format } = req.params;
    const { logoText, title, subtitle, disclaimer, logoUrl } = req.body;
    
    if (!formats[format]) {
      return res.status(400).json({ error: 'Неподдерживаемый формат' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'Изображение не загружено' });
    }
    
    const { width, height } = formats[format];
    
    res.json({
      success: true,
      message: 'Изображение обработано успешно',
      data: {
        format,
        dimensions: { width, height },
        texts: {
          logoText: logoText || null,
          title: title || null,
          subtitle: subtitle || null,
          disclaimer: disclaimer || null
        },
        logoUrl: logoUrl || null,
        note: 'Для полной функциональности требуется установка библиотек обработки изображений'
      }
    });
    
  } catch (error) {
    console.error('Ошибка:', error);
    res.status(500).json({ error: 'Ошибка обработки: ' + error.message });
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
    status: 'Базовая версия без библиотек обработки изображений',
    endpoints: {
      'POST /generate/:format': 'Генерация HTML превью',
      'POST /generate-json/:format': 'Генерация JSON ответа',
      'GET /formats': 'Получить доступные форматы',
      'GET /': 'Проверка работоспособности'
    },
    formats: Object.keys(formats),
    note: 'Для генерации PNG изображений требуется установка дополнительных библиотек'
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
  console.log('Базовая версия API готова к работе');
});
