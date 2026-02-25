/* ============================================================
   CHATBOT — AVA v2 Conversational Assistant (Voice enabled)
   Improved version with error handling and robustness
   ============================================================ */

(function () {
    // DOM elements
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatMessages = document.getElementById('chatMessages');
    const micToggle = document.getElementById('micToggle');
    const voiceWave = document.getElementById('voiceWave');

    // Exit if core elements missing
    if (!chatToggle || !chatWindow || !chatInput || !chatSend || !chatMessages) {
        console.warn('Chatbot: Required DOM elements missing.');
        return;
    }

    // State
    let isListening = false;
    let currentTypingIndicator = null;
    const synth = window.speechSynthesis;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let voicesReady = false;

    // Initialize speech recognition if supported
    if (Recognition) {
        recognition = new Recognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            const text = event.results[0][0].transcript;
            chatInput.value = text;
            handleSendMessage();
            stopListening();
        };

        recognition.onend = () => {
            stopListening();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            let errorMsg = 'Voice input failed. ';
            if (event.error === 'not-allowed') errorMsg += 'Microphone access denied.';
            else if (event.error === 'no-speech') errorMsg += 'No speech detected.';
            else errorMsg += 'Please try again.';
            alert(errorMsg);
            stopListening();
        };
    } else {
        if (micToggle) micToggle.style.display = 'none';
    }

    // Preload speech synthesis voices
    if (synth) {
        if (synth.getVoices().length) {
            voicesReady = true;
        } else {
            synth.addEventListener('voiceschanged', () => {
                voicesReady = true;
            }, { once: true });
        }
    }

    // Toggle Chat
    chatToggle.addEventListener('click', () => {
        chatWindow.classList.toggle('open');
        if (chatWindow.classList.contains('open')) {
            chatInput.focus();
        }
    });

    // Send Message
    chatSend.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });

    // Voice Interaction
    if (micToggle && recognition) {
        micToggle.addEventListener('click', () => {
            if (!isListening) {
                startListening();
            } else {
                stopListening();
            }
        });
    } else if (micToggle) {
        micToggle.style.opacity = '0.5';
        micToggle.title = 'Speech recognition not supported';
    }

    function startListening() {
        if (!recognition) {
            alert("Speech recognition not supported in this browser.");
            return;
        }
        try {
            recognition.start();
            isListening = true;
            micToggle.classList.add('listening');
        } catch (err) {
            console.error('Failed to start recognition:', err);
            alert('Could not start voice recognition. Please try again.');
            stopListening();
        }
    }

    function stopListening() {
        if (isListening) {
            isListening = false;
            micToggle.classList.remove('listening');
        }
        if (recognition) {
            try { recognition.stop(); } catch (e) { /* ignore */ }
        }
    }

    function speak(text) {
        if (!synth) {
            console.warn('Speech synthesis not supported');
            return;
        }

        synth.cancel();

        const utter = new SpeechSynthesisUtterance(text);
        utter.pitch = 1;
        utter.rate = 0.95;
        utter.volume = 0.8;

        const voices = synth.getVoices();
        if (voices.length) {
            const preferredVoice = voices.find(v =>
                v.name.includes('Google US English') ||
                v.name.includes('Natural') ||
                (v.lang === 'en-US' && v.name.toLowerCase().includes('male'))
            );
            if (preferredVoice) utter.voice = preferredVoice;
        }

        utter.onstart = () => chatWindow.classList.add('bot-speaking');
        utter.onend = () => chatWindow.classList.remove('bot-speaking');
        utter.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            chatWindow.classList.remove('bot-speaking');
        };

        synth.speak(utter);
    }

    // == GEMINI API CONFIGURATION ==
    // Note: If this key is empty or invalid, AVA will use her advanced fallback rules.
    const GEMINI_API_KEY = "";

    async function handleSendMessage() {
        const msg = chatInput.value.trim();
        if (!msg) return;

        addMessage(msg, 'user');
        chatInput.value = '';

        if (currentTypingIndicator) {
            currentTypingIndicator.remove();
            currentTypingIndicator = null;
        }

        currentTypingIndicator = addTypingIndicator();

        // 1. Try Gemini API if key is provided
        if (GEMINI_API_KEY) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `You are AVA, an autonomous AI assistant representing the portfolio of Rohith Dharun S. Answer questions ABOUT Rohith in the third person (e.g., "He is an engineering aspirant..."). Keep answers concise, polite, and conversational (max 2 sentences). The user just said: "${msg}"`
                            }]
                        }]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const aiText = data.candidates[0].content.parts[0].text;
                    processResponse(aiText);
                    return;
                } else {
                    console.warn("Gemini API error, falling back to local processing.");
                }
            } catch (error) {
                console.error("Gemini Fetch error:", error);
            }
        }

        // 2. Fallback to local rule-based responses
        setTimeout(() => {
            const fallbackResponse = getAVAContextualResponse(msg);
            processResponse(fallbackResponse);
        }, 1200);
    }

    function processResponse(text) {
        if (currentTypingIndicator) {
            currentTypingIndicator.remove();
            currentTypingIndicator = null;
        }
        addMessage(text, 'bot');
        speak(text);
    }

    function addMessage(text, side) {
        const wrapper = document.createElement('div');
        wrapper.className = `msg-wrapper ${side}`;

        const avatar = document.createElement('div');
        avatar.className = `msg-avatar ${side === 'bot' ? 'bot' : 'human'}`;
        avatar.innerHTML = side === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';

        const bubble = document.createElement('div');
        bubble.className = `msg-bubble ${side}`;
        bubble.textContent = text;

        if (side === 'bot') {
            wrapper.appendChild(avatar);
            wrapper.appendChild(bubble);
        } else {
            wrapper.appendChild(bubble);
            wrapper.appendChild(avatar);
        }

        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addTypingIndicator() {
        const wrapper = document.createElement('div');
        wrapper.className = 'msg-wrapper bot';
        wrapper.innerHTML = `
            <div class="msg-avatar bot"><i class="fas fa-robot"></i></div>
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return wrapper;
    }

    function getAVAContextualResponse(query) {
        const q = query.toLowerCase();

        if (q.includes('hello') || q.includes('hi')) {
            return "Greetings. I am AVA, Rohith's digital AI assistant. How may I assist you today?";
        }
        if (q.includes('who is rohith') || q.includes('about rohith') || q.includes('who is he')) {
            return "Rohith is a dedicated engineering aspirant with a passion for building innovative software and hardware solutions.";
        }
        if (q.includes('skill') || q.includes('power') || q.includes('software') || q.includes('hardware')) {
            return "He is proficient in modern software development (C, Java, Python) and hardware design (Arduino, Embedded Systems). You can view the details in the Skills chapter.";
        }
        if (q.includes('project') || q.includes('work') || q.includes('build')) {
            return "He has built impressive systems like the RFID Attendance System and an autonomous Fire Fighting Robot. The Projects chapter showcases these in detail.";
        }
        if (q.includes('game') || q.includes('play')) {
            return "The gaming module illustrates his belief that creativity and interaction are vital to problem-solving. Have you tried playing them yet?";
        }
        if (q.includes('contact') || q.includes('email') || q.includes('hire')) {
            return "You can reach Rohith at rohithdharun1718@gmail.com. Further professional links are available in the Contact chapter.";
        }
        if (q.includes('resume') || q.includes('cv')) {
            return "A comprehensive manifest of his journey is available for download in the final chapter.";
        }
        if (q.includes('who are you') || q.includes('ava') || q.includes('bot')) {
            return "I am AVA, an autonomous AI assistant designed to guide you through Rohith's professional story.";
        }

        return "That is an interesting inquiry. As an AI assistant, I recommend exploring the portfolio sections above to learn more about his technical capabilities!";
    }
})();