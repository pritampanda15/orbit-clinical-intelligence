// src/utils/voiceCommands.ts - Voice Command System
export interface VoiceCommand {
  patterns: string[];
  action: (transcript: string, context?: any) => Promise<void> | void;
  description: string;
  category: 'navigation' | 'query' | 'action' | 'emergency';
}

export class VoiceCommandSystem {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private isListening: boolean = false;
  private commands: VoiceCommand[] = [];
  private context: any = {};

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeSpeechRecognition();
    this.setupCommands();
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new SpeechRecognition();
    }

    if (this.recognition) {
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event) => {
        const latest = event.results[event.results.length - 1];
        if (latest.isFinal) {
          this.processCommand(latest[0].transcript);
        }
      };

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };
    }
  }

  private setupCommands() {
    this.commands = [
      // Navigation Commands
      {
        patterns: ['show overview', 'go to overview', 'main dashboard'],
        action: () => this.context.setActiveView?.('overview'),
        description: 'Navigate to overview dashboard',
        category: 'navigation'
      },
      {
        patterns: ['show charts', 'display charts', 'vitals chart'],
        action: () => this.context.setActiveView?.('charts'),
        description: 'Show real-time vitals charts',
        category: 'navigation'
      },
      {
        patterns: ['show forecast', 'risk forecast', 'prediction'],
        action: () => {
          this.context.setActiveView?.('forecast');
          this.context.fetchForecast?.();
        },
        description: 'Show risk forecasting',
        category: 'navigation'
      },
      {
        patterns: ['show alerts', 'display alerts', 'alert panel'],
        action: () => this.context.setActiveView?.('alerts'),
        description: 'Show clinical alerts',
        category: 'navigation'
      },
      {
        patterns: ['ai chat', 'open chat', 'talk to ai'],
        action: () => this.context.setActiveView?.('chat'),
        description: 'Open AI chat interface',
        category: 'navigation'
      },

      // Query Commands
      {
        patterns: ['what is the map', 'current map', 'blood pressure'],
        action: () => {
          const vitals = this.context.getLatestVitals?.();
          if (vitals) {
            this.speak(`Current mean arterial pressure is ${vitals.MAP.toFixed(1)} millimeters of mercury`);
          }
        },
        description: 'Get current MAP value',
        category: 'query'
      },
      {
        patterns: ['what is the heart rate', 'current heart rate', 'pulse'],
        action: () => {
          const vitals = this.context.getLatestVitals?.();
          if (vitals) {
            this.speak(`Current heart rate is ${vitals.HR.toFixed(0)} beats per minute`);
          }
        },
        description: 'Get current heart rate',
        category: 'query'
      },
      {
        patterns: ['oxygen saturation', 'spo2', 'oxygen level'],
        action: () => {
          const vitals = this.context.getLatestVitals?.();
          if (vitals) {
            this.speak(`Oxygen saturation is ${vitals.SpO2.toFixed(1)} percent`);
          }
        },
        description: 'Get oxygen saturation',
        category: 'query'
      },
      {
        patterns: ['patient status', 'overall status', 'how is the patient'],
        action: async () => {
          const vitals = this.context.getLatestVitals?.();
          if (vitals) {
            const status = this.assessPatientStatus(vitals);
            this.speak(`Patient status is ${status.overall}. ${status.details}`);
          }
        },
        description: 'Get overall patient status',
        category: 'query'
      },

      // Action Commands
      {
        patterns: ['acknowledge alerts', 'clear alerts', 'dismiss alerts'],
        action: () => {
          this.context.acknowledgeAllAlerts?.();
          this.speak('All alerts have been acknowledged');
        },
        description: 'Acknowledge all active alerts',
        category: 'action'
      },
      {
        patterns: ['update forecast', 'refresh forecast', 'new prediction'],
        action: async () => {
          this.speak('Updating risk forecast');
          await this.context.fetchForecast?.();
          this.speak('Forecast has been updated');
        },
        description: 'Update risk forecast',
        category: 'action'
      },
      {
        patterns: ['read vitals', 'vitals report', 'all vitals'],
        action: () => {
          const vitals = this.context.getLatestVitals?.();
          if (vitals) {
            const report = `Current vitals: MAP ${vitals.MAP.toFixed(1)} millimeters mercury, 
                           Heart rate ${vitals.HR.toFixed(0)} beats per minute, 
                           Oxygen saturation ${vitals.SpO2.toFixed(1)} percent, 
                           Respiratory rate ${vitals.RR.toFixed(0)} per minute, 
                           Temperature ${vitals.Temp.toFixed(1)} degrees celsius`;
            this.speak(report);
          }
        },
        description: 'Read all current vitals',
        category: 'query'
      },

      // Emergency Commands
      {
        patterns: ['emergency', 'help', 'code blue', 'urgent'],
        action: () => {
          this.speak('Emergency protocol activated. Notifying clinical team.');
          this.context.triggerEmergency?.();
        },
        description: 'Trigger emergency alert',
        category: 'emergency'
      },
      {
        patterns: ['call doctor', 'get physician', 'medical help'],
        action: () => {
          this.speak('Paging attending physician');
          this.context.pagePhysician?.();
        },
        description: 'Page attending physician',
        category: 'emergency'
      }
    ];
  }

  private assessPatientStatus(vitals: any) {
    const alerts = [];
    
    if (vitals.MAP < 65) alerts.push('hypotension');
    if (vitals.HR > 100) alerts.push('tachycardia');
    if (vitals.SpO2 < 95) alerts.push('hypoxemia');
    if (vitals.Temp > 38 || vitals.Temp < 36) alerts.push('temperature abnormality');

    if (alerts.length === 0) {
      return {
        overall: 'stable',
        details: 'All vital signs are within normal parameters'
      };
    } else {
      return {
        overall: alerts.length > 2 ? 'critical' : 'unstable',
        details: `Active concerns: ${alerts.join(', ')}`
      };
    }
  }

  setContext(context: any) {
    this.context = context;
  }

  startListening() {
    if (this.recognition && !this.isListening) {
      this.recognition.start();
      this.isListening = true;
      this.speak('Voice commands activated');
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.speak('Voice commands deactivated');
    }
  }

  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  private processCommand(transcript: string) {
    const normalizedTranscript = transcript.toLowerCase().trim();
    console.log('Voice command:', normalizedTranscript);

    // Find matching command
    const matchedCommand = this.commands.find(command =>
      command.patterns.some(pattern =>
        normalizedTranscript.includes(pattern.toLowerCase())
      )
    );

    if (matchedCommand) {
      console.log('Executing command:', matchedCommand.description);
      try {
        matchedCommand.action(transcript, this.context);
      } catch (error) {
        console.error('Error executing voice command:', error);
        this.speak('Sorry, I couldn\'t execute that command');
      }
    } else {
      // If no direct match, try AI chat
      if (this.context.sendChatMessage && normalizedTranscript.length > 10) {
        this.speak('Sending your question to the AI assistant');
        this.context.setActiveView?.('chat');
        this.context.setChatInput?.(transcript);
        setTimeout(() => this.context.sendChatMessage?.(), 500);
      } else {
        this.speak('Command not recognized. Try saying "help" for available commands');
      }
    }
  }

  speak(text: string) {
    if (this.synthesis && text) {
      // Cancel any current speech
      this.synthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      // Use a medical/professional voice if available
      const voices = this.synthesis.getVoices();
      const professionalVoice = voices.find(voice => 
        voice.name.includes('English') && 
        (voice.name.includes('UK') || voice.name.includes('US'))
      );
      
      if (professionalVoice) {
        utterance.voice = professionalVoice;
      }

      this.synthesis.speak(utterance);
    }
  }

  getAvailableCommands() {
    return this.commands.map(cmd => ({
      patterns: cmd.patterns,
      description: cmd.description,
      category: cmd.category
    }));
  }

  isSupported() {
    return !!(this.recognition && this.synthesis);
  }

  getStatus() {
    return {
      supported: this.isSupported(),
      listening: this.isListening,
      commandCount: this.commands.length
    };
  }
}

// React Hook for Voice Commands
export const useVoiceCommands = () => {
  const [voiceSystem, setVoiceSystem] = useState<VoiceCommandSystem | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const vs = new VoiceCommandSystem();
    setVoiceSystem(vs);
    setIsSupported(vs.isSupported());

    return () => {
      if (vs.isListening) {
        vs.stopListening();
      }
    };
  }, []);

  const toggleListening = () => {
    if (voiceSystem) {
      voiceSystem.toggleListening();
      setIsListening(!isListening);
    }
  };

  const setContext = (context: any) => {
    if (voiceSystem) {
      voiceSystem.setContext(context);
    }
  };

  const speak = (text: string) => {
    if (voiceSystem) {
      voiceSystem.speak(text);
    }
  };

  return {
    voiceSystem,
    isListening,
    isSupported,
    toggleListening,
    setContext,
    speak,
    getCommands: () => voiceSystem?.getAvailableCommands() || []
  };
};