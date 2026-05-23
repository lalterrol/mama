/**
 * main.js - Narrative Coordinator and UI Interaction Controller
 * Manages the emotional flow, slide transitions, interactive gratitude garden,
 * heartbeat gestures, and connects the audio and visual engines.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let currentSlide = 1;
    const totalSlides = 5;

    // --- DOM Elements ---
    const slides = document.querySelectorAll('.slide');
    const startBtn = document.getElementById('btn-start');
    const restartBtn = document.getElementById('btn-restart');
    const soundToggleBtn = document.getElementById('btn-sound-toggle');
    const soundBtnText = soundToggleBtn.querySelector('.btn-text');
    const soundActiveIcon = soundToggleBtn.querySelector('.active-icon');
    const soundMuteIcon = soundToggleBtn.querySelector('.mute-icon');
    
    // Slide 3: Garden elements
    const gardenContainer = document.getElementById('garden-nodes-container');
    const messageBox = document.getElementById('garden-msg-box');
    const messageText = document.getElementById('garden-msg-text');
    const closeMsgBtn = document.getElementById('btn-close-msg');

    // Slide 4: Heart trigger
    const heartTrigger = document.getElementById('heart-trigger-zone');

    // --- Emotional Messages (RU) ---
    const gratitudeMessages = [
        {
            text: "Спасибо тебе за безусловную любовь, поддержку и принятие в любой миг моей жизни...",
            emoji: "🌸",
            color: "#FFA8A8"
        },
        {
            text: "Спасибо за твои нежные, тёплые руки, способные исцелить любую душевную рану и утешить в печали.",
            emoji: "✨",
            color: "#C299FC"
        },
        {
            text: "Спасибо за твою безграничную веру во меня, даже когда у меня самого опускались руки.",
            emoji: "🌱",
            color: "#81C7EB"
        },
        {
            text: "Спасибо за тихий, мудрый свет твоих глаз, который освещает мой путь в самые тёмные времена.",
            emoji: "🕯️",
            color: "#FFD043"
        },
        {
            text: "Спасибо тебе за самый великий, драгоценный подарок — за жизнь, за веру в сказку и чудо.",
            emoji: "🎁",
            color: "#A9E195"
        }
    ];

    // --- Initialization & Audio Activation ---
    function activateAudioAndJourney() {
        if (window.sound) {
            // Initialize sound context
            window.sound.init();
            
            // Unlock the header sound button
            soundToggleBtn.classList.remove('locked');
            soundBtnText.textContent = "Звук: вкл";
            soundActiveIcon.classList.remove('hidden');
            soundMuteIcon.classList.add('hidden');
        }

        // Navigate to Screen 2
        goToSlide(2);
    }

    startBtn.addEventListener('click', activateAudioAndJourney);

    // --- Slide Transitions Controller ---
    function goToSlide(targetSlideNum) {
        if (targetSlideNum < 1 || targetSlideNum > totalSlides) return;

        // Play Transition SFX
        if (window.sound && targetSlideNum > 1) {
            window.sound.playTransitionSfx();
        }

        // Remove active class from all slides
        slides.forEach(slide => slide.classList.remove('active'));

        // Activate target slide after a tiny delay for clean CSS layout transition
        setTimeout(() => {
            const activeSlide = document.getElementById(`slide-${targetSlideNum}`);
            if (activeSlide) {
                activeSlide.classList.add('active');
            }
            
            // Reconfigure background canvas simulation state
            if (window.interactiveCanvas) {
                window.interactiveCanvas.setupScene(targetSlideNum);
            }
        }, 50);

        currentSlide = targetSlideNum;
    }

    // Attach click listeners to all Next/Prev navigation buttons
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = parseInt(btn.getAttribute('data-target'));
            goToSlide(target);
        });
    });

    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = parseInt(btn.getAttribute('data-target'));
            goToSlide(target);
        });
    });

    // Restart button actions
    restartBtn.addEventListener('click', () => {
        goToSlide(1);
    });

    // --- Sound Mute/Unmute Toggle Controller ---
    soundToggleBtn.addEventListener('click', () => {
        if (soundToggleBtn.classList.contains('locked')) {
            // Remind user to click "Start" first to unlock sound
            startBtn.classList.add('pulse-invitation');
            setTimeout(() => startBtn.classList.remove('pulse-invitation'), 800);
            return;
        }

        if (window.sound) {
            const isMuted = window.sound.toggleMute();
            if (isMuted) {
                soundBtnText.textContent = "Звук: выкл";
                soundActiveIcon.classList.add('hidden');
                soundMuteIcon.classList.remove('hidden');
            } else {
                soundBtnText.textContent = "Звук: вкл";
                soundActiveIcon.classList.remove('hidden');
                soundMuteIcon.classList.add('hidden');
            }
        }
    });

    // --- Slide 3: Garden of Gratitude Generation ---
    function buildGardenOfGratitude() {
        gardenContainer.innerHTML = ''; // Clear previous items

        gratitudeMessages.forEach((msg, idx) => {
            const node = document.createElement('div');
            node.className = 'garden-node';
            node.innerHTML = msg.emoji;
            node.title = "Открыть послание";
            node.style.color = msg.color;

            // Click listener for node activation
            node.addEventListener('click', (e) => {
                // 1. Mark as visited
                node.classList.add('visited');

                // 2. Play distinct pentatonic bell/chime note (Indices mapping: 0, 2, 4, 6, 8)
                if (window.sound) {
                    window.sound.playChime(idx * 2, 0.7);
                }

                // 3. Spawns visual canvas burst sparks at node position
                const rect = node.getBoundingClientRect();
                const clientX = rect.left + rect.width / 2;
                const clientY = rect.top + rect.height / 2;
                if (window.interactiveCanvas) {
                    window.interactiveCanvas.triggerCanvasFlare(clientX, clientY, msg.color);
                }

                // 4. Populate message content and display overlay card
                const msgEmoji = messageBox.querySelector('.message-box-emoji');
                msgEmoji.textContent = msg.emoji;
                messageText.textContent = msg.text;
                
                messageBox.classList.add('active');
                messageBox.classList.remove('hidden');
            });

            gardenContainer.appendChild(node);
        });
    }

    // Build the garden nodes immediately
    buildGardenOfGratitude();

    // Close gratitude message box functions
    function closeMessageBox() {
        messageBox.classList.remove('active');
        setTimeout(() => {
            messageBox.classList.add('hidden');
        }, 300); // Wait for scaling CSS transitions
        
        // Play a very soft closing chime note
        if (window.sound) {
            window.sound.playChime(1, 0.2);
        }
    }

    closeMsgBtn.addEventListener('click', closeMessageBox);
    
    // Close message box if clicking the background blur wrapper
    messageBox.addEventListener('click', (e) => {
        if (e.target === messageBox) {
            closeMessageBox();
        }
    });

    // --- Slide 4: Heart Touch Resonance Controller ---
    if (heartTrigger) {
        // Start heartbeat intensity resonance
        const startResonance = () => {
            heartTrigger.classList.add('active-pulsing');
            if (window.sound) {
                window.sound.setHeartResonance(true);
            }
        };

        // Terminate resonance, fallback to baseline calm
        const stopResonance = () => {
            heartTrigger.classList.remove('active-pulsing');
            if (window.sound) {
                window.sound.setHeartResonance(false);
            }
        };

        // Standard Mouse events
        heartTrigger.addEventListener('mousedown', startResonance);
        heartTrigger.addEventListener('mouseup', stopResonance);
        heartTrigger.addEventListener('mouseleave', stopResonance);

        // Mobile Touch events
        heartTrigger.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Stop mouse emulation triggering double fires
            startResonance();
        });
        heartTrigger.addEventListener('touchend', stopResonance);
        heartTrigger.addEventListener('touchcancel', stopResonance);
    }
});
