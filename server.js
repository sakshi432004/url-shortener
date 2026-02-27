const express = require('express');
const { saveUrl, getOriginalUrl, getAllUrls } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTML Frontend Template
const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>URL Shortener</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      padding: 40px;
      max-width: 500px;
      width: 100%;
    }
    
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
    }
    
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    
    .input-group {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    
    input[type="url"] {
      flex: 1;
      padding: 14px 18px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s;
    }
    
    input[type="url"]:focus {
      outline: none;
      border-color: #667eea;
    }
    
    button {
      padding: 14px 28px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
    }
    
    .result {
      background: #f8f9ff;
      border: 2px solid #e8ecff;
      border-radius: 8px;
      padding: 20px;
      margin-top: 20px;
      display: none;
    }
    
    .result.show {
      display: block;
      animation: fadeIn 0.3s ease;
    }
    
    .result h3 {
      color: #333;
      margin-bottom: 10px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .short-url {
      display: flex;
      align-items: center;
      gap: 10px;
      background: white;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
    }
    
    .short-url a {
      flex: 1;
      color: #667eea;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
    }
    
    .copy-btn {
      padding: 8px 12px;
      font-size: 12px;
      background: #667eea;
    }
    
    .error {
      background: #fff5f5;
      border-color: #ffcccc;
      color: #d63031;
      padding: 15px;
      border-radius: 8px;
      margin-top: 15px;
      display: none;
    }
    
    .error.show {
      display: block;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔗 URL Shortener</h1>
    <p class="subtitle">Transform long URLs into short, shareable links</p>
    
    <form id="shortenForm">
      <div class="input-group">
        <input 
          type="url" 
          id="urlInput" 
          placeholder="Enter your long URL here..." 
          required
        >
        <button type="submit">Shorten</button>
      </div>
    </form>
    
    <div class="error" id="errorMsg"></div>
    
    <div class="result" id="resultBox">
      <h3>Your Shortened URL</h3>
      <div class="short-url">
        <a href="#" id="shortUrlLink" target="_blank"></a>
        <button class="copy-btn" onclick="copyToClipboard()">Copy</button>
      </div>
    </div>
  </div>
  
  <script>
    const form = document.getElementById('shortenForm');
    const urlInput = document.getElementById('urlInput');
    const resultBox = document.getElementById('resultBox');
    const shortUrlLink = document.getElementById('shortUrlLink');
    const errorMsg = document.getElementById('errorMsg');
    
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const originalUrl = urlInput.value.trim();
      
      try {
        const response = await fetch('/api/shorten', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ original_url: originalUrl })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          const shortUrl = window.location.origin + '/' + data.short_code;
          shortUrlLink.textContent = shortUrl;
          shortUrlLink.href = shortUrl;
          resultBox.classList.add('show');
          errorMsg.classList.remove('show');
        } else {
          showError(data.error || 'Something went wrong');
        }
      } catch (err) {
        showError('Failed to connect to server');
      }
    });
    
    function showError(message) {
      errorMsg.textContent = message;
      errorMsg.classList.add('show');
      resultBox.classList.remove('show');
    }
    
    function copyToClipboard() {
      const url = shortUrlLink.href;
      navigator.clipboard.writeText(url).then(() => {
        const btn = document.querySelector('.copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = 'Copy', 2000);
      });
    }
  </script>
</body>
</html>
`;

// Routes

// Home page with frontend
app.get('/', (req, res) => {
  res.send(HTML_TEMPLATE);
});

// API: Shorten URL
app.post('/api/shorten', (req, res) => {
  const { original_url } = req.body;
  
  if (!original_url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  // Basic URL validation
  try {
    new URL(original_url);
  } catch (err) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }
  
  try {
    const result = saveUrl(original_url);
    const shortUrl = `${req.protocol}://${req.get('host')}/${result.short_code}`;
    
    res.json({
      success: true,
      original_url: result.original_url,
      short_code: result.short_code,
      short_url: shortUrl
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create short URL' });
  }
});

// API: Get all URLs
app.get('/api/urls', (req, res) => {
  try {
    const urls = getAllUrls();
    res.json(urls);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch URLs' });
  }
});

// Redirect short URL to original URL
app.get('/:shortCode', (req, res) => {
  const { shortCode } = req.params;
  const originalUrl = getOriginalUrl(shortCode);
  
  if (originalUrl) {
    res.redirect(originalUrl);
  } else {
    res.status(404).send(`
      <h1>404 - URL Not Found</h1>
      <p>The short URL you're trying to access doesn't exist.</p>
      <a href="/">Go back to URL Shortener</a>
    `);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 Server running at http://localhost:\${PORT}\`);
});
