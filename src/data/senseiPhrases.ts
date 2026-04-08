import type { BeltColor, AgeGroup } from '../types';

interface SenseiPhrase {
  text: string;
  textEs: string;
  audioUrl?: string;
  minBelt?: BeltColor;
  context: 'greeting' | 'correct' | 'incorrect' | 'encouragement' | 'beltUp' | 'sessionEnd' | 'placement';
}

export const senseiPhrases: SenseiPhrase[] = [
  // Greetings
  { text: 'Hello, warrior!', textEs: '¡Hola, guerrero!', context: 'greeting', audioUrl: '/audio/sensei/hola_guerrero.mp3' },
  { text: 'Welcome to the Dojo!', textEs: '¡Bienvenido al Dojo!', context: 'greeting', audioUrl: '/audio/sensei/bienvenido_dojo.mp3' },
  { text: 'Ready to train?', textEs: '¿Listo para entrenar?', context: 'greeting', audioUrl: '/audio/sensei/listo.mp3' },
  { text: 'Let\'s begin!', textEs: '¡Vamos!', context: 'greeting', audioUrl: '/audio/sensei/vamos.mp3' },

  // Correct answer
  { text: 'Very good!', textEs: '¡Muy bien!', context: 'correct', audioUrl: '/audio/sensei/muy_bien.mp3' },
  { text: 'Excellent!', textEs: '¡Excelente!', context: 'correct', audioUrl: '/audio/sensei/excelente.mp3' },
  { text: 'Perfect strike!', textEs: '¡Golpe perfecto!', context: 'correct' },
  { text: 'Strong!', textEs: '¡Fuerte!', context: 'correct' },
  { text: 'You trained very well today!', textEs: '¡Entrenaste muy bien hoy!', context: 'correct', minBelt: 'green' },
  { text: 'Your discipline is impressive, warrior.', textEs: 'Tu disciplina es impresionante, guerrero.', context: 'correct', minBelt: 'blue' },

  // Incorrect answer
  { text: 'Try again!', textEs: '¡Otra vez!', context: 'incorrect', audioUrl: '/audio/sensei/otra_vez.mp3' },
  { text: 'A warrior learns from every fall.', textEs: 'Un guerrero aprende de cada caída.', context: 'incorrect' },
  { text: 'Almost! More power!', textEs: '¡Casi! ¡Más fuerza!', context: 'incorrect' },
  { text: 'Don\'t give up.', textEs: 'No te rindas.', context: 'incorrect' },

  // Encouragement
  { text: 'Keep training hard.', textEs: 'Entrena duro.', context: 'encouragement', audioUrl: '/audio/sensei/entrena_duro.mp3' },
  { text: 'You can do it!', textEs: '¡Tú puedes!', context: 'encouragement' },
  { text: 'Your form is improving.', textEs: 'Tu forma está mejorando.', context: 'encouragement', minBelt: 'yellow' },

  // Belt promotion
  { text: 'You have earned a new belt!', textEs: '¡Has ganado un nuevo cinturón!', context: 'beltUp' },
  { text: 'Sensei is proud of you.', textEs: 'Sensei está orgulloso de ti.', context: 'beltUp' },

  // Session end
  { text: 'Training complete!', textEs: '¡Entrenamiento completo!', context: 'sessionEnd' },
  { text: 'Strong training today.', textEs: 'Buen entrenamiento hoy.', context: 'sessionEnd' },
  { text: 'Rest now. Tomorrow we train again.', textEs: 'Descansa. Mañana entrenamos de nuevo.', context: 'sessionEnd' },

  // Placement
  { text: 'Show me what you know, warrior!', textEs: '¡Muéstrame lo que sabes, guerrero!', context: 'placement' },
  { text: 'Every belt you earn is one you\'ve mastered!', textEs: '¡Cada cinturón que ganes es uno que ya dominaste!', context: 'placement' },
];

export function getRandomPhrase(
  context: SenseiPhrase['context'],
  currentBelt?: BeltColor,
): SenseiPhrase {
  const beltOrder = ['white', 'yellow', 'orange', 'green', 'blue', 'purple', 'brown', 'red', 'black-1', 'black-2', 'black-3', 'black-4', 'black-5'];
  const currentIdx = currentBelt ? beltOrder.indexOf(currentBelt) : 0;

  const eligible = senseiPhrases.filter((p) => {
    if (p.context !== context) return false;
    if (p.minBelt) {
      const minIdx = beltOrder.indexOf(p.minBelt);
      if (currentIdx < minIdx) return false;
    }
    return true;
  });

  if (eligible.length === 0) {
    return senseiPhrases.find((p) => p.context === context) ?? senseiPhrases[0];
  }

  return eligible[Math.floor(Math.random() * eligible.length)];
}

export function getSenseiTone(ageGroup: AgeGroup): { prefix: string; suffix: string } {
  switch (ageGroup) {
    case 'junior':
      return { prefix: 'Great job, young warrior! ', suffix: ' Keep it up!' };
    case 'warrior':
      return { prefix: '', suffix: ' Stay focused, warrior.' };
    case 'elite':
      return { prefix: '', suffix: '' };
    case 'master':
      return { prefix: 'Let\'s work on this. ', suffix: '' };
  }
}
