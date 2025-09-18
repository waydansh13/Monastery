/**
 * Monastery360 - Progressive Web App
 * Immersive cultural-heritage platform for exploring Sikkim's monasteries
 */

class Monastery360 {
    constructor() {
        this.state = {
            monasteries: [],
            events: [],
            map: null,
            markers: [],
            selectedMonastery: null,
            currentLanguage: 'en',
            voices: [],
            speechSynthesis: null,
            isSpeaking: false,
            apiKey: null,
            deferredPrompt: null
        };

        this.init();
    }

    async init() {
        try {
            this.showLoading(true);
            await this.loadData();
            this.initializeApp();
            this.setupEventListeners();
            this.showLoading(false);
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to load Monastery360. Please refresh the page.');
        }
    }

    async loadData() {
        try {
            const [monasteriesResponse, eventsResponse] = await Promise.all([
                fetch('/data/monasteries.json'),
                fetch('/data/events.json')
            ]);

            if (!monasteriesResponse.ok || !eventsResponse.ok) {
                throw new Error('Failed to load data');
            }

            this.state.monasteries = await monasteriesResponse.json();
            this.state.events = await eventsResponse.json();
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    initializeApp() {
        this.initializeMap();
        this.populateFilters();
        this.initializeVoices();
        this.loadSettings();
        this.renderMonasteries();
        this.renderCalendar();
        this.setupPWA();
    }

    initializeMap() {
        // Initialize Leaflet map
        this.state.map = L.map('monasteryMap', {
            zoomControl: true,
            attributionControl: true
        });

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18
        }).addTo(this.state.map);

        // Set initial view to Sikkim
        this.state.map.setView([27.3389, 88.6065], 8);

        // Add custom controls
        this.addMapControls();
    }

    addMapControls() {
        // Add fullscreen control
        const fullscreenControl = L.control({ position: 'topright' });
        fullscreenControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'leaflet-control-fullscreen');
            div.innerHTML = '⛶';
            div.title = 'Toggle fullscreen';
            div.style.cssText = `
                background: white;
                border: 2px solid rgba(0,0,0,0.2);
                border-radius: 4px;
                cursor: pointer;
                padding: 4px 8px;
                font-size: 16px;
            `;
            div.onclick = () => this.toggleFullscreen();
            return div;
        };
        fullscreenControl.addTo(this.state.map);
    }

    toggleFullscreen() {
        const mapContainer = document.getElementById('monasteryMap');
        if (!document.fullscreenElement) {
            mapContainer.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }

    populateFilters() {
        // Populate district filter
        const districts = [...new Set(this.state.monasteries.map(m => m.district))].sort();
        const districtFilter = document.getElementById('districtFilter');
        districts.forEach(district => {
            const option = document.createElement('option');
            option.value = district;
            option.textContent = district;
            districtFilter.appendChild(option);
        });

        // Set up filter event listeners
        document.getElementById('sectFilter').addEventListener('change', () => this.renderMonasteries());
        document.getElementById('districtFilter').addEventListener('change', () => this.renderMonasteries());
        document.getElementById('statusFilter').addEventListener('change', () => this.renderMonasteries());
        document.getElementById('searchInput').addEventListener('input', this.debounce(() => this.renderMonasteries(), 300));
    }

    renderMonasteries() {
        // Clear existing markers
        this.state.markers.forEach(marker => this.state.map.removeLayer(marker));
        this.state.markers = [];

        // Get filter values
        const sectFilter = document.getElementById('sectFilter').value;
        const districtFilter = document.getElementById('districtFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();

        // Filter monasteries
        const filteredMonasteries = this.state.monasteries.filter(monastery => {
            const matchesSect = sectFilter === 'all' || monastery.sect === sectFilter;
            const matchesDistrict = districtFilter === 'all' || monastery.district === districtFilter;
            const matchesStatus = statusFilter === 'all' || monastery.status === statusFilter;
            const matchesSearch = searchTerm === '' || 
                monastery.name.toLowerCase().includes(searchTerm) ||
                monastery.sect.toLowerCase().includes(searchTerm) ||
                monastery.district.toLowerCase().includes(searchTerm) ||
                monastery.description.toLowerCase().includes(searchTerm);

            return matchesSect && matchesDistrict && matchesStatus && matchesSearch;
        });

        // Create markers
        const sectColors = {
            'Nyingma': '#e74c3c',
            'Kagyu': '#3498db',
            'Gelug': '#f1c40f',
            'Sakya': '#9b59b6'
        };

        filteredMonasteries.forEach(monastery => {
            const marker = L.circleMarker([monastery.lat, monastery.lng], {
                radius: 8,
                fillColor: sectColors[monastery.sect] || '#1a4d3a',
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            });

            // Create custom popup content
            const popupContent = this.createMarkerPopup(monastery);
            marker.bindPopup(popupContent);

            // Add click handler
            marker.on('click', () => this.selectMonastery(monastery));

            marker.addTo(this.state.map);
            this.state.markers.push(marker);
        });

        // Fit map to show all markers
        if (filteredMonasteries.length > 0) {
            const group = new L.featureGroup(this.state.markers);
            this.state.map.fitBounds(group.getBounds().pad(0.1));
        }

        // Update results count
        this.updateResultsCount(filteredMonasteries.length);
    }

    createMarkerPopup(monastery) {
        return `
            <div class="monastery-popup">
                <h4>${monastery.name}</h4>
                <p><strong>Sect:</strong> ${monastery.sect}</p>
                <p><strong>District:</strong> ${monastery.district}</p>
                <p>${monastery.description.substring(0, 100)}...</p>
                <button onclick="app.selectMonastery('${monastery.id}')" class="btn btn-primary btn-sm">
                    View Details
                </button>
            </div>
        `;
    }

    selectMonastery(monasteryId) {
        const monastery = typeof monasteryId === 'string' 
            ? this.state.monasteries.find(m => m.id === monasteryId)
            : monasteryId;

        if (!monastery) return;

        this.state.selectedMonastery = monastery;
        this.renderMonasteryProfile(monastery);
        this.updateVirtualTour(monastery);
        this.updateAudioGuide(monastery);
    }

    renderMonasteryProfile(monastery) {
        const profileContent = document.getElementById('profileContent');
        
        profileContent.innerHTML = `
            <div class="monastery-details">
                <div class="monastery-header">
                    <div class="monastery-icon">🏛️</div>
                    <div class="monastery-info">
                        <h3>${monastery.name}</h3>
                        <div class="monastery-meta">
                            <span><strong>Sect:</strong> ${monastery.sect}</span>
                            <span><strong>District:</strong> ${monastery.district}</span>
                            <span><strong>Founded:</strong> ${monastery.founded}</span>
                        </div>
                    </div>
                </div>
                
                <div class="monastery-description">
                    ${monastery.description}
                </div>
                
                <div class="monastery-sections">
                    <div class="section">
                        <h4>📜 History</h4>
                        <p>${monastery.history}</p>
                    </div>
                    
                    <div class="section">
                        <h4>🏗️ Architecture</h4>
                        <p>${monastery.architecture}</p>
                    </div>
                    
                    <div class="section">
                        <h4>🙏 Practices</h4>
                        <p>${monastery.practices}</p>
                    </div>
                    
                    <div class="section">
                        <h4>⭐ Significance</h4>
                        <p>${monastery.significance}</p>
                    </div>
                    
                    ${monastery.festivals ? `
                        <div class="section">
                            <h4>🎉 Festivals</h4>
                            <p>${monastery.festivals.join(', ')}</p>
                        </div>
                    ` : ''}
                    
                    <div class="section">
                        <h4>ℹ️ Visiting Information</h4>
                        <p><strong>Hours:</strong> ${monastery.visitingHours}</p>
                        ${monastery.contact ? `<p><strong>Contact:</strong> ${monastery.contact}</p>` : ''}
                        ${monastery.website ? `<p><strong>Website:</strong> <a href="${monastery.website}" target="_blank">${monastery.website}</a></p>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    updateVirtualTour(monastery) {
        const tourViewer = document.getElementById('tourViewer');
        
        if (monastery.viewerUrl) {
            tourViewer.innerHTML = `
                <iframe 
                    src="${monastery.viewerUrl}" 
                    width="100%" 
                    height="100%" 
                    frameborder="0" 
                    allowfullscreen
                    title="360° Virtual Tour of ${monastery.name}">
                </iframe>
            `;
        } else {
            tourViewer.innerHTML = `
                <div class="tour-placeholder">
                    <div class="placeholder-icon">📷</div>
                    <p>360° virtual tour not available for ${monastery.name}</p>
                </div>
            `;
        }
    }

    updateAudioGuide(monastery) {
        const narrationTextarea = document.getElementById('narrationTextarea');
        const audioGuide = monastery.audioGuide || {};
        const text = audioGuide[this.state.currentLanguage] || audioGuide.en || monastery.description;
        
        narrationTextarea.value = text;
    }

    initializeVoices() {
        if ('speechSynthesis' in window) {
            this.state.speechSynthesis = window.speechSynthesis;
            this.populateVoiceList();
            
            // Update voices when they load
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = () => this.populateVoiceList();
            }
        }
    }

    populateVoiceList() {
        const voices = this.state.speechSynthesis.getVoices();
        this.state.voices = voices;
        
        const voiceSelect = document.getElementById('voiceSelect');
        voiceSelect.innerHTML = '';
        
        voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            voiceSelect.appendChild(option);
        });
    }

    renderCalendar() {
        const calendarEvents = document.getElementById('calendarEvents');
        const filter = document.getElementById('calendarFilter').value;
        
        let filteredEvents = this.state.events;
        
        if (filter === 'upcoming') {
            const today = new Date();
            filteredEvents = this.state.events.filter(event => new Date(event.date) >= today);
        } else if (filter === 'festivals') {
            filteredEvents = this.state.events.filter(event => event.type === 'festival');
        } else if (filter === 'ceremonies') {
            filteredEvents = this.state.events.filter(event => event.type === 'ceremony');
        }
        
        // Sort by date
        filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (filteredEvents.length === 0) {
            calendarEvents.innerHTML = '<div class="no-events">No events found</div>';
            return;
        }
        
        calendarEvents.innerHTML = filteredEvents.map(event => {
            const monastery = this.state.monasteries.find(m => m.id === event.monasteryId);
            const eventDate = new Date(event.date);
            const isUpcoming = eventDate >= new Date();
            
            return `
                <div class="event-item ${isUpcoming ? 'upcoming' : 'past'}">
                    <div class="event-header">
                        <h4 class="event-title">${event.title}</h4>
                        <span class="event-date">${eventDate.toLocaleDateString()}</span>
                    </div>
                    <p class="event-description">${event.description}</p>
                    <div class="event-monastery">
                        <strong>Location:</strong> ${monastery ? monastery.name : 'Unknown Monastery'}
                    </div>
                    <div class="event-actions">
                        <button class="btn btn-sm btn-primary" onclick="app.selectMonastery('${event.monasteryId}')">
                            View Monastery
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="app.playEventAudio('${event.id}')">
                            🔊 Listen
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    playEventAudio(eventId) {
        const event = this.state.events.find(e => e.id === eventId);
        if (!event || !event.audioGuide) return;
        
        const audioGuide = event.audioGuide[this.state.currentLanguage] || event.audioGuide.en;
        if (audioGuide) {
            this.speakText(audioGuide);
        }
    }

    speakText(text) {
        if (!this.state.speechSynthesis) {
            this.showError('Speech synthesis not supported in this browser');
            return;
        }

        // Stop any current speech
        this.state.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoiceIndex = document.getElementById('voiceSelect').value;
        
        if (selectedVoiceIndex && this.state.voices[selectedVoiceIndex]) {
            utterance.voice = this.state.voices[selectedVoiceIndex];
        }
        
        utterance.rate = parseFloat(document.getElementById('rateSlider').value);
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onstart = () => {
            this.state.isSpeaking = true;
            this.updateSpeechButtons();
        };

        utterance.onend = () => {
            this.state.isSpeaking = false;
            this.updateSpeechButtons();
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.state.isSpeaking = false;
            this.updateSpeechButtons();
        };

        this.state.speechSynthesis.speak(utterance);
    }

    updateSpeechButtons() {
        const playBtn = document.getElementById('playAudio');
        const pauseBtn = document.getElementById('pauseAudio');
        const stopBtn = document.getElementById('stopAudio');

        if (this.state.isSpeaking) {
            playBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;
        } else {
            playBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
        }
    }

    setupEventListeners() {
        // Audio controls
        document.getElementById('playAudio').addEventListener('click', () => {
            const text = document.getElementById('narrationTextarea').value;
            if (text) this.speakText(text);
        });

        document.getElementById('pauseAudio').addEventListener('click', () => {
            if (this.state.speechSynthesis) {
                this.state.speechSynthesis.pause();
            }
        });

        document.getElementById('stopAudio').addEventListener('click', () => {
            if (this.state.speechSynthesis) {
                this.state.speechSynthesis.cancel();
            }
        });

        // Rate slider
        document.getElementById('rateSlider').addEventListener('input', (e) => {
            document.getElementById('rateValue').textContent = `${e.target.value}x`;
        });

        // Calendar filter
        document.getElementById('calendarFilter').addEventListener('change', () => {
            this.renderCalendar();
        });

        // Chatbot
        document.getElementById('sendMessage').addEventListener('click', () => {
            this.sendChatMessage();
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.openSettings();
        });

        document.getElementById('closeSettings').addEventListener('click', () => {
            this.closeSettings();
        });

        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('cancelSettings').addEventListener('click', () => {
            this.closeSettings();
        });

        // Install button
        document.getElementById('installBtn').addEventListener('click', () => {
            this.installPWA();
        });
    }

    async sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message to chat
        this.addChatMessage('user', message);
        input.value = '';

        // Check if API key is available
        if (!this.state.apiKey) {
            this.addChatMessage('bot', 'Please set your OpenAI API key in Settings to enable the AI guide.');
            return;
        }

        // Show typing indicator
        this.addChatMessage('bot', 'Thinking...', true);

        try {
            const response = await this.callOpenAI(message);
            this.removeTypingIndicator();
            this.addChatMessage('bot', response);
        } catch (error) {
            this.removeTypingIndicator();
            this.addChatMessage('bot', `Error: ${error.message}`);
        }
    }

    addChatMessage(role, content, isTyping = false) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}-message ${isTyping ? 'typing' : ''}`;
        
        const avatar = role === 'user' ? '👤' : '🤖';
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <p>${content}</p>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    removeTypingIndicator() {
        const typingMessage = document.querySelector('.chat-message.typing');
        if (typingMessage) {
            typingMessage.remove();
        }
    }

    async callOpenAI(message) {
        const systemPrompt = `You are Monastery360's virtual monastery guide. You have knowledge about Sikkim's monasteries, Buddhist sects (Nyingma, Kagyu, Gelug, Sakya), cultural events, and spiritual practices. Help users explore monasteries, understand cultural significance, and answer questions about Buddhist traditions. Be conversational, informative, and respectful of the spiritual nature of the content.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.state.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    openSettings() {
        const modal = document.getElementById('settingsModal');
        modal.showModal();
        
        // Load current settings
        document.getElementById('apiKeyInput').value = this.state.apiKey || '';
        document.getElementById('defaultLanguage').value = this.state.currentLanguage;
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        modal.close();
    }

    saveSettings() {
        this.state.apiKey = document.getElementById('apiKeyInput').value.trim();
        this.state.currentLanguage = document.getElementById('defaultLanguage').value;
        
        // Save to localStorage
        localStorage.setItem('monastery360_apiKey', this.state.apiKey);
        localStorage.setItem('monastery360_language', this.state.currentLanguage);
        
        // Update chatbot status
        const status = document.getElementById('chatbotStatus');
        if (this.state.apiKey) {
            status.innerHTML = '<small>✅ AI guide is ready to help you explore Sikkim\'s monasteries</small>';
        } else {
            status.innerHTML = '<small>💡 Set your OpenAI API key in Settings to enable the AI guide</small>';
        }
        
        this.closeSettings();
    }

    loadSettings() {
        this.state.apiKey = localStorage.getItem('monastery360_apiKey') || null;
        this.state.currentLanguage = localStorage.getItem('monastery360_language') || 'en';
        
        // Update chatbot status
        const status = document.getElementById('chatbotStatus');
        if (this.state.apiKey) {
            status.innerHTML = '<small>✅ AI guide is ready to help you explore Sikkim\'s monasteries</small>';
        }
    }

    setupPWA() {
        // Handle install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.state.deferredPrompt = e;
            document.getElementById('installBtn').style.display = 'block';
        });

        // Handle app installed
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            document.getElementById('installBtn').style.display = 'none';
        });
    }

    async installPWA() {
        if (!this.state.deferredPrompt) return;

        this.state.deferredPrompt.prompt();
        const { outcome } = await this.state.deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        
        this.state.deferredPrompt = null;
        document.getElementById('installBtn').style.display = 'none';
    }

    updateResultsCount(count) {
        // Update any results counter if needed
        console.log(`Showing ${count} monasteries`);
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.style.display = show ? 'flex' : 'none';
    }

    showError(message) {
        console.error(message);
        // You could implement a toast notification system here
        alert(message);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new Monastery360();
});

// Handle service worker updates
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
    });
}