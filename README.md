# 🏛️ Monastery360 - Digital Spiritual Journey

**Monastery360** is an immersive Progressive Web App (PWA) designed to digitally preserve and showcase the sacred monasteries of Sikkim. This platform blends spirituality with modern technology, allowing global users to explore, learn, and engage with monasteries in an interactive, app-like environment.

## ✨ Features

### 🗺️ Interactive Map & Exploration
- **Leaflet-powered map** with OpenStreetMap integration
- **Color-coded monastery markers** by Buddhist sect (Nyingma, Kagyu, Gelug, Sakya)
- **Advanced filtering** by sect, district, and status
- **Real-time search** across monastery names, descriptions, and locations
- **Responsive design** optimized for all devices

### 🏛️ Monastery Profiles
- **Comprehensive information** including history, architecture, and practices
- **Detailed descriptions** of cultural significance and spiritual importance
- **Visiting information** with hours, contact details, and websites
- **Festival listings** and special events for each monastery

### 🌐 360° Virtual Tours
- **Immersive panoramic views** of monastery interiors and exteriors
- **Embedded 360° viewers** for virtual exploration
- **Seamless integration** with external panorama providers
- **Mobile-optimized** viewing experience

### 🎧 Multilingual Audio Guides
- **Web Speech API integration** for text-to-speech narration
- **Multiple language support** (English, Hindi, Nepali, Tibetan)
- **Customizable speech rate** and voice selection
- **Contextual audio content** for each monastery

### 📅 Cultural Calendar
- **Upcoming events** and festivals at monasteries
- **Filterable by event type** (festivals, ceremonies, retreats)
- **Detailed event descriptions** with significance and activities
- **Direct links** to related monasteries

### 🤖 AI-Powered Virtual Guide
- **OpenAI GPT-4 integration** for intelligent assistance
- **Cultural and historical expertise** about Sikkim's monasteries
- **Personalized recommendations** based on user preferences
- **Conversational interface** for natural interaction

### 📱 Progressive Web App
- **Installable** on mobile and desktop devices
- **Offline functionality** with intelligent caching
- **Push notifications** for important updates
- **App-like experience** with native feel

## 🚀 Quick Start

### Prerequisites
- A modern web browser with JavaScript enabled
- Internet connection for initial setup
- OpenAI API key (optional, for AI chatbot features)

### Installation & Setup

1. **Clone or download** the project files
2. **Serve the files** using a local web server (required for PWA functionality):
   
   **Using Python:**
   ```bash
   python3 -m http.server 8000
   ```
   
   **Using Node.js:**
   ```bash
   npx http-server -p 8000
   ```
   
   **Using PHP:**
   ```bash
   php -S localhost:8000
   ```

3. **Open your browser** and navigate to `http://localhost:8000`
4. **Install the PWA** by clicking the "Install App" button when prompted
5. **Configure settings** (optional) to enable AI chatbot features

### AI Chatbot Setup (Optional)

1. Click the **Settings** button (⚙️) in the header
2. Enter your **OpenAI API key** in the provided field
3. Select your **preferred language** for audio guides
4. Click **Save Settings**

## 📁 Project Structure

```
monastery360/
├── index.html              # Main application HTML
├── styles.css              # Comprehensive CSS styling
├── app.js                  # Main JavaScript application
├── manifest.json           # PWA manifest configuration
├── sw.js                   # Service worker for offline functionality
├── data/
│   ├── monasteries.json    # Monastery dataset
│   └── events.json         # Cultural events dataset
├── assets/
│   ├── icons/              # PWA icons (various sizes)
│   └── screenshots/        # App screenshots
└── README.md              # This file
```

## 🏛️ Monastery Data

The application includes detailed information about 7 major monasteries across Sikkim:

### Nyingma Tradition
- **Pemayangtse Monastery** - Famous for Sangtok Pelri model
- **Tashiding Monastery** - Sacred site with Bhumchu festival
- **Enchey Monastery** - Gangtok-based with Chaam dance festival

### Kagyu Tradition
- **Rumtek Monastery** - Seat of the Karmapa
- **Phodong Monastery** - Peaceful North Sikkim monastery

### Gelug Tradition
- **Labrang Monastery** - Scholarly tradition in East Sikkim

### Sakya Tradition
- **Sakya Monastery** - Unique Sakya tradition in South Sikkim

## 🎯 Key Technologies

- **HTML5** - Semantic markup and modern web standards
- **CSS3** - Advanced styling with custom properties and responsive design
- **JavaScript ES6+** - Modern JavaScript with classes and async/await
- **Leaflet.js** - Interactive mapping library
- **Web Speech API** - Text-to-speech functionality
- **OpenAI API** - AI-powered chatbot
- **Service Workers** - Offline functionality and caching
- **Progressive Web App** - App-like experience

## 🌐 Browser Support

- **Chrome/Edge** 80+ (Full support)
- **Firefox** 75+ (Full support)
- **Safari** 13+ (Full support)
- **Mobile browsers** (iOS Safari, Chrome Mobile)

## 🔧 Configuration

### Customizing Monastery Data
Edit `/data/monasteries.json` to add or modify monastery information:

```json
{
  "id": "unique-monastery-id",
  "name": "Monastery Name",
  "sect": "Nyingma|Kagyu|Gelug|Sakya",
  "district": "District Name",
  "lat": 27.1234,
  "lng": 88.5678,
  "viewerUrl": "https://360-tour-url.com",
  "description": "Monastery description...",
  "audioGuide": {
    "en": "English narration...",
    "hi": "Hindi narration...",
    "ne": "Nepali narration..."
  }
}
```

### Adding Cultural Events
Edit `/data/events.json` to add festivals and ceremonies:

```json
{
  "id": "event-id",
  "title": "Event Name",
  "date": "2024-12-25",
  "monasteryId": "monastery-id",
  "type": "festival|ceremony|retreat",
  "description": "Event description..."
}
```

## 🎨 Customization

### Theming
Modify CSS custom properties in `/styles.css`:

```css
:root {
  --primary-color: #1a4d3a;    /* Main theme color */
  --secondary-color: #d4af37;  /* Accent color */
  --bg-primary: #0a0f0c;       /* Background color */
  --text-primary: #f5f5f5;     /* Text color */
}
```

### Adding New Languages
Extend the audio guide system by adding language codes to monastery data and updating the language selector in the HTML.

## 📱 PWA Features

### Installation
- **Automatic prompt** appears on supported browsers
- **Manual installation** via browser menu
- **App shortcuts** for quick access to features

### Offline Support
- **Static assets** cached for offline viewing
- **Monastery data** cached for offline exploration
- **Graceful degradation** when network is unavailable

### Performance
- **Lazy loading** of 360° tours and external resources
- **Efficient caching** strategy for optimal performance
- **Responsive images** and optimized assets

## 🤝 Contributing

We welcome contributions to improve Monastery360:

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

### Areas for Contribution
- Additional monastery data
- New language translations
- Enhanced 360° tour integration
- Performance optimizations
- Accessibility improvements

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Sikkim's monastic communities** for preserving these sacred traditions
- **OpenStreetMap contributors** for providing map data
- **Leaflet.js team** for the excellent mapping library
- **OpenAI** for AI capabilities
- **Web standards community** for PWA technologies

## 📞 Support

For support, questions, or feedback:

- **Issues**: Report bugs or request features via GitHub Issues
- **Documentation**: Check this README and inline code comments
- **Community**: Join discussions in the project repository

---

**Monastery360** - Bridging spirituality with modern technology to preserve and share the sacred heritage of Sikkim's monasteries. 🙏

*May this digital journey inspire deeper understanding and appreciation of Buddhist culture and traditions.*