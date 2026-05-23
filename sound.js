/**
 * sound.js - Web Audio API Procedural Synthesizer Engine
 * Generates an immersive, warm ambient soundscape and tactile chime SFX.
 * Self-contained: No external audio file downloads required.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.padGain = null;
        this.filterNode = null;
        this.lfo = null;
        this.oscillators = [];
        this.initialized = false;
        this.isMuted = false;
        
        // Pentatonic Scale (C Major Pentatonic) for the Garden of Gratitude
        // Tuning: C4, D4, E4, G4, A4, C5, D5, E5, G5, A5
        this.pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
        
        // Ambient Warm Chord Fmaj9 / Cmaj9 (F2, C3, A3, E4, G4)
        this.chordFreqs = [87.31, 130.81, 220.00, 329.63, 392.00];
    }

    /**
     * Initializes the AudioContext upon user gesture.
     * Crucial to bypass modern browser autoplay restriction policies.
     */
    init() {
        if (this.initialized) return;

        try {
            // Support standard and legacy Web Audio APIs
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContextClass();
            
            // 1. Create Nodes
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
            
            this.filterNode = this.ctx.createBiquadFilter();
            this.filterNode.type = 'lowpass';
            this.filterNode.frequency.setValueAtTime(350, this.ctx.currentTime); // Soft, warm filter
            this.filterNode.Q.setValueAtTime(1.5, this.ctx.currentTime);

            this.padGain = this.ctx.createGain();
            this.padGain.gain.setValueAtTime(0.08, this.ctx.currentTime); // Low volume background pad

            // 2. Route nodes: Oscillators -> padGain -> filterNode -> masterGain -> destination
            this.padGain.connect(this.filterNode);
            this.filterNode.connect(this.masterGain);
            this.masterGain.connect(this.ctx.destination);

            // 3. Spawn and start warm pad oscillators
            this.startPadOscillators();

            // 4. Create an LFO to gently modulate the filter frequency (mimics breathing)
            this.startLFO();

            // 5. Fade-in master volume slowly (1.5 seconds)
            this.masterGain.gain.linearRampToValueAtTime(0.65, this.ctx.currentTime + 1.5);
            
            this.initialized = true;
            console.log("SoundEngine: Synthesizer initialized successfully.");
        } catch (error) {
            console.error("SoundEngine: Failed to initialize Web Audio API.", error);
        }
    }

    /**
     * Spawns multi-voice oscillators playing a beautiful warm Fmaj9 chord.
     */
    startPadOscillators() {
        this.chordFreqs.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            
            // Triangle wave provides a beautiful, pure woodwind/warm-brass texture
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            
            // Add slight detuning to make the pad rich and wide
            const detuneAmount = (idx - 2) * 3; // -6, -3, 0, 3, 6 cents
            osc.detune.setValueAtTime(detuneAmount, this.ctx.currentTime);
            
            // Connect to pad sub-gain
            osc.connect(this.padGain);
            osc.start();
            this.oscillators.push(osc);
        });
    }

    /**
     * Low Frequency Oscillator to gently fluctuate the filter cutoff frequency.
     * This creates a soothing, breathing-like audio swell effect.
     */
    startLFO() {
        this.lfo = this.ctx.createOscillator();
        this.lfoGain = this.ctx.createGain();

        this.lfo.type = 'sine';
        this.lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // Very slow: 0.08 Hz (1 cycle per 12 seconds)
        this.lfoGain.gain.setValueAtTime(80, this.ctx.currentTime); // Modulate by +/- 80 Hz

        this.lfo.connect(this.lfoGain);
        this.lfoGain.connect(this.filterNode.frequency); // Connect LFO to filter frequency

        this.lfo.start();
    }

    /**
     * Plays a resonant, crystalline glass-chime sound.
     * Perfect for interactive buttons, page transitions, and Garden of Gratitude nodes.
     * @param {number} index - Index of the pentatonic scale note to play (0-9).
     * @param {number} volume - Volume multiplier (0.0 to 1.0).
     */
    playChime(index, volume = 0.5) {
        if (!this.initialized || this.isMuted) return;

        const now = this.ctx.currentTime;
        const freq = this.pentatonicScale[index % this.pentatonicScale.length];

        // 1. Core Oscillator (Sine wave for pure glass tone)
        const osc1 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, now);

        // 2. Harmonic Overtone Oscillator (Triangle wave tuned 1 octave up for bell-like brightness)
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 2, now);

        // 3. Sparkle high overtone
        const osc3 = this.ctx.createOscillator();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(freq * 3.01, now); // Slightly detuned for resonance

        // Individual Gain node for envelope control (envelope shaping)
        const chimeGain = this.ctx.createGain();
        chimeGain.gain.setValueAtTime(0, now);
        // Instant strike (0.006s attack)
        chimeGain.gain.linearRampToValueAtTime(volume * 0.12, now + 0.006);
        // Slow natural decay (exponential, mimics physical bell)
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

        // Sub-filter to soften the triangle harmonics
        const chimeFilter = this.ctx.createBiquadFilter();
        chimeFilter.type = 'lowpass';
        chimeFilter.frequency.setValueAtTime(1200, now);

        // Routing
        osc1.connect(chimeGain);
        osc2.connect(chimeGain);
        osc3.connect(chimeGain);
        
        chimeGain.connect(chimeFilter);
        chimeFilter.connect(this.masterGain);

        // Play and cleanup
        osc1.start(now);
        osc2.start(now);
        osc3.start(now);

        osc1.stop(now + 3.2);
        osc2.stop(now + 3.2);
        osc3.stop(now + 3.2);
    }

    /**
     * Generates a tiny, whispering high-pitched chime spark for mouse trailing movements.
     */
    playSpark(volume = 0.05) {
        if (!this.initialized || this.isMuted) return;

        const now = this.ctx.currentTime;
        // Random extremely high-pitched pentatonic note (indices 5-9)
        const randomIndex = Math.floor(Math.random() * 5) + 5;
        const freq = this.pentatonicScale[randomIndex];

        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const sparkGain = this.ctx.createGain();
        sparkGain.gain.setValueAtTime(0, now);
        sparkGain.gain.linearRampToValueAtTime(volume * 0.05, now + 0.004);
        sparkGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

        osc.connect(sparkGain);
        sparkGain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.9);
    }

    /**
     * Triggers a beautiful upward chord transition chime.
     */
    playTransitionSfx() {
        if (!this.initialized || this.isMuted) return;

        const now = this.ctx.currentTime;
        // Sequence a rapid upward chord arpeggio
        const notes = [0, 2, 4, 6]; // C4, E4, G4, D5
        notes.forEach((noteIndex, idx) => {
            setTimeout(() => {
                this.playChime(noteIndex, 0.45 - idx * 0.05);
            }, idx * 120); // 120ms gap between arpeggio notes
        });
    }

    /**
     * Dynamic Resonance Modulation for Slide 4 (Heartbeat Hold).
     * Opens the filter cutoff and deepens LFO when the user holds the heart.
     * @param {boolean} active - True to open the resonance filter, False to reset.
     */
    setHeartResonance(active) {
        if (!this.initialized) return;

        const now = this.ctx.currentTime;
        if (active) {
            // Heart is being pressed: Open filter, brighten sound, slightly increase gain
            this.filterNode.frequency.cancelScheduledValues(now);
            this.filterNode.frequency.exponentialRampToValueAtTime(1400, now + 0.8);
            
            this.padGain.gain.cancelScheduledValues(now);
            this.padGain.gain.linearRampToValueAtTime(0.18, now + 0.6); // Boost pad volume

            // Speed up LFO for a more intense pulsing rhythm
            if (this.lfo) {
                this.lfo.frequency.cancelScheduledValues(now);
                this.lfo.frequency.linearRampToValueAtTime(0.4, now + 0.8); // 0.4Hz pulse (faster)
                this.lfoGain.gain.cancelScheduledValues(now);
                this.lfoGain.gain.linearRampToValueAtTime(250, now + 0.8); // Wider filter sweep range
            }
        } else {
            // Released: return to baseline warm, calm sound
            this.filterNode.frequency.cancelScheduledValues(now);
            this.filterNode.frequency.exponentialRampToValueAtTime(350, now + 1.2);

            this.padGain.gain.cancelScheduledValues(now);
            this.padGain.gain.linearRampToValueAtTime(0.08, now + 1.0); // Reset pad volume

            // Reset LFO to slow breath rhythm
            if (this.lfo) {
                this.lfo.frequency.cancelScheduledValues(now);
                this.lfo.frequency.linearRampToValueAtTime(0.08, now + 1.2);
                this.lfoGain.gain.cancelScheduledValues(now);
                this.lfoGain.gain.linearRampToValueAtTime(80, now + 1.2);
            }
        }
    }

    /**
     * Toggles the audio master mute state.
     * Returns the final mute state (boolean).
     */
    toggleMute() {
        if (!this.initialized) return true;

        const now = this.ctx.currentTime;
        if (this.isMuted) {
            // Unmute: Fade volume back to comfortable listening level
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.linearRampToValueAtTime(0.65, now + 0.5);
            this.isMuted = false;
        } else {
            // Mute: Fade volume to zero instantly
            this.masterGain.gain.cancelScheduledValues(now);
            this.masterGain.gain.linearRampToValueAtTime(0.0, now + 0.3);
            this.isMuted = true;
        }

        return this.isMuted;
    }
}

// Export a single, global instance of the SoundEngine
const sound = new SoundEngine();
window.sound = sound; // Bind globally for interaction callbacks
