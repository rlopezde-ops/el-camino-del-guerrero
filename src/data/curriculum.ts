import type { DojoData, UnitData, Technique, Exercise, BeltColor } from '../types';

function t(id: string, spanish: string, english: string, unit: number, belt: BeltColor, category: string): Technique {
  return { id, spanish, english, unit, belt, category, audioUrl: `/audio/vocab/${id}.mp3` };
}

let exSeq = 0;
function ex(partial: Omit<Exercise, 'id'>): Exercise {
  exSeq += 1;
  return { id: `ex-${partial.unit}-${partial.type}-${exSeq}`, ...partial };
}

// ─── UNIT 1: Greetings and Introductions ───────────────────────────

const unit1Techniques: Technique[] = [
  t('hola', 'hola', 'hello', 1, 'white', 'greetings'),
  t('adios', 'adiós', 'goodbye', 1, 'white', 'greetings'),
  t('me-llamo', 'me llamo', 'my name is (I call myself)', 1, 'white', 'introductions'),
  t('como-te-llamas', '¿cómo te llamas?', 'what is your name?', 1, 'white', 'introductions'),
  t('buenos-dias', 'buenos días', 'good morning', 1, 'white', 'greetings'),
  t('buenas-tardes', 'buenas tardes', 'good afternoon', 1, 'white', 'greetings'),
  t('buenas-noches', 'buenas noches', 'good night', 1, 'white', 'greetings'),
  t('por-favor', 'por favor', 'please', 1, 'white', 'manners'),
  t('gracias', 'gracias', 'thank you', 1, 'white', 'manners'),
  t('de-nada', 'de nada', "you're welcome", 1, 'white', 'manners'),
  t('mucho-gusto', 'mucho gusto', 'nice to meet you', 1, 'white', 'manners'),
  t('lo-siento', 'lo siento', "I'm sorry", 1, 'white', 'manners'),
  t('con-permiso', 'con permiso', 'excuse me (may I pass)', 1, 'white', 'manners'),
  t('senor', 'señor', 'sir / Mr.', 1, 'white', 'greetings'),
  t('senora', 'señora', 'ma\'am / Mrs.', 1, 'white', 'greetings'),
  t('como-estas', '¿cómo estás?', 'how are you? (informal)', 1, 'white', 'greetings'),
  t('bien', 'bien', 'well / fine', 1, 'white', 'greetings'),
  t('mal', 'mal', 'bad / not well', 1, 'white', 'greetings'),
];

const unit1Exercises: Exercise[] = [
  ex({ type: 'counter', unit: 1, belt: 'white', prompt: 'What does "hola" mean?', correctAnswer: 'Hello', options: ['Hello', 'Goodbye', 'Please', 'Thank you'] }),
  ex({ type: 'counter', unit: 1, belt: 'white', prompt: 'What does "adiós" mean?', correctAnswer: 'Goodbye', options: ['Hello', 'Goodbye', 'Good morning', 'Good night'] }),
  ex({ type: 'block', unit: 1, belt: 'white', prompt: 'Me ______ Sofía.', correctAnswer: 'llamo', options: ['llamo', 'gusta', 'tengo'] }),
  ex({ type: 'counter', unit: 1, belt: 'white', prompt: 'How do you say "please" in Spanish?', correctAnswer: 'Por favor', options: ['Por favor', 'Gracias', 'Adiós', 'Hola'] }),
  ex({ type: 'counter', unit: 1, belt: 'white', prompt: 'What does "de nada" mean?', correctAnswer: "You're welcome", options: ["You're welcome", 'Thank you', 'Please', 'Excuse me'] }),
  ex({ type: 'counter', unit: 1, belt: 'white', prompt: 'Translate: "Good afternoon"', correctAnswer: 'Buenas tardes', options: ['Buenas tardes', 'Buenos días', 'Buenas noches', 'Hola'] }),
];

// ─── UNIT 2: Numbers ───────────────────────────────────────────────

const unit2Techniques: Technique[] = [
  t('cero', 'cero', 'zero', 2, 'white', 'numbers'),
  t('uno', 'uno', 'one', 2, 'white', 'numbers'),
  t('dos', 'dos', 'two', 2, 'white', 'numbers'),
  t('tres', 'tres', 'three', 2, 'white', 'numbers'),
  t('cuatro', 'cuatro', 'four', 2, 'white', 'numbers'),
  t('cinco', 'cinco', 'five', 2, 'white', 'numbers'),
  t('seis', 'seis', 'six', 2, 'white', 'numbers'),
  t('siete', 'siete', 'seven', 2, 'white', 'numbers'),
  t('ocho', 'ocho', 'eight', 2, 'white', 'numbers'),
  t('nueve', 'nueve', 'nine', 2, 'white', 'numbers'),
  t('diez', 'diez', 'ten', 2, 'white', 'numbers'),
  t('once', 'once', 'eleven', 2, 'white', 'numbers'),
  t('doce', 'doce', 'twelve', 2, 'white', 'numbers'),
  t('trece', 'trece', 'thirteen', 2, 'white', 'numbers'),
  t('catorce', 'catorce', 'fourteen', 2, 'white', 'numbers'),
  t('quince', 'quince', 'fifteen', 2, 'white', 'numbers'),
  t('dieciseis', 'dieciséis', 'sixteen', 2, 'white', 'numbers'),
  t('diecisiete', 'diecisiete', 'seventeen', 2, 'white', 'numbers'),
  t('dieciocho', 'dieciocho', 'eighteen', 2, 'white', 'numbers'),
  t('diecinueve', 'diecinueve', 'nineteen', 2, 'white', 'numbers'),
  t('veinte', 'veinte', 'twenty', 2, 'white', 'numbers'),
  t('treinta', 'treinta', 'thirty', 2, 'white', 'numbers'),
  t('cien', 'cien', 'one hundred', 2, 'white', 'numbers'),
  t('cuantos-anos', '¿cuántos años tienes?', 'how old are you?', 2, 'white', 'age'),
];

const unit2Exercises: Exercise[] = [
  ex({ type: 'counter', unit: 2, belt: 'white', prompt: 'What number is "siete"?', correctAnswer: '7', options: ['5', '6', '7', '8'] }),
  ex({ type: 'counter', unit: 2, belt: 'white', prompt: 'How do you say "fifteen" in Spanish?', correctAnswer: 'Quince', options: ['Trece', 'Catorce', 'Quince', 'Dieciséis'] }),
  ex({ type: 'sense', unit: 2, belt: 'white', prompt: 'Listen and tap: "diecinueve"', correctAnswer: '19', options: ['17', '18', '19', '20'], promptAudio: '/audio/vocab/diecinueve.mp3' }),
  ex({ type: 'speed', unit: 2, belt: 'white', prompt: 'Match the numbers!', correctAnswer: '', pairs: [{ spanish: 'uno', english: '1' }, { spanish: 'cinco', english: '5' }, { spanish: 'diez', english: '10' }, { spanish: 'veinte', english: '20' }] }),
  ex({ type: 'block', unit: 2, belt: 'white', prompt: 'Tengo ______ años. (I am 10 years old)', correctAnswer: 'diez', options: ['diez', 'cinco', 'veinte'] }),
];

// ─── UNIT 3: Colors and Descriptions ───────────────────────────────

const unit3Techniques: Technique[] = [
  t('rojo', 'rojo', 'red', 3, 'yellow', 'colors'),
  t('azul', 'azul', 'blue', 3, 'yellow', 'colors'),
  t('verde', 'verde', 'green', 3, 'yellow', 'colors'),
  t('amarillo', 'amarillo', 'yellow', 3, 'yellow', 'colors'),
  t('blanco', 'blanco', 'white', 3, 'yellow', 'colors'),
  t('negro', 'negro', 'black', 3, 'yellow', 'colors'),
  t('morado', 'morado', 'purple', 3, 'yellow', 'colors'),
  t('rosado', 'rosado', 'pink', 3, 'yellow', 'colors'),
  t('gris', 'gris', 'gray', 3, 'yellow', 'colors'),
  t('anaranjado', 'anaranjado', 'orange (color)', 3, 'yellow', 'colors'),
  t('grande', 'grande', 'big', 3, 'yellow', 'descriptions'),
  t('pequeno', 'pequeño', 'small', 3, 'yellow', 'descriptions'),
  t('bonito', 'bonito', 'pretty / beautiful', 3, 'yellow', 'descriptions'),
  t('lindo', 'lindo', 'cute / lovely', 3, 'yellow', 'descriptions'),
  t('simpatico', 'simpático', 'nice / friendly (person)', 3, 'yellow', 'descriptions'),
  t('amable', 'amable', 'kind', 3, 'yellow', 'descriptions'),
  t('feo', 'feo', 'ugly', 3, 'yellow', 'descriptions'),
  t('alto', 'alto', 'tall', 3, 'yellow', 'descriptions'),
  t('bajo', 'bajo', 'short (height)', 3, 'yellow', 'descriptions'),
  t('nuevo', 'nuevo', 'new', 3, 'yellow', 'descriptions'),
  t('viejo', 'viejo', 'old', 3, 'yellow', 'descriptions'),
  t('es', 'es', 'is', 3, 'yellow', 'grammar'),
];

const unit3Exercises: Exercise[] = [
  ex({ type: 'strike', unit: 3, belt: 'yellow', prompt: 'Strike! Tap the word for "blue"', correctAnswer: 'azul', options: ['rojo', 'azul', 'verde', 'amarillo'] }),
  ex({ type: 'counter', unit: 3, belt: 'yellow', prompt: '"Simpático" best means...', correctAnswer: 'Nice / friendly (person)', options: ['Nice / friendly (person)', 'Pretty (appearance)', 'Big', 'Small'] }),
  ex({ type: 'block', unit: 3, belt: 'yellow', prompt: 'El gato es ______. (The cat is pretty)', correctAnswer: 'bonito', options: ['bonito', 'simpático', 'alto'] }),
  ex({ type: 'kata', unit: 3, belt: 'yellow', prompt: 'Build: "The dog is big"', correctAnswer: 'El perro es grande', words: ['grande', 'El', 'perro', 'es'] }),
  ex({ type: 'counter', unit: 3, belt: 'yellow', prompt: 'Translate: "The house is small"', correctAnswer: 'La casa es pequeña', options: ['La casa es pequeña', 'La casa es grande', 'El perro es simpático', 'La casa es roja'] }),
  ex({ type: 'kata', unit: 3, belt: 'yellow', prompt: 'Build: "The teacher is nice (friendly)"', correctAnswer: 'El maestro es simpático', words: ['El', 'maestro', 'es', 'simpático'] }),
];

// ─── UNIT 4: Family ────────────────────────────────────────────────

const unit4Techniques: Technique[] = [
  t('mama', 'mamá', 'mom', 4, 'yellow', 'family'),
  t('papa', 'papá', 'dad', 4, 'yellow', 'family'),
  t('hermano', 'hermano', 'brother', 4, 'yellow', 'family'),
  t('hermana', 'hermana', 'sister', 4, 'yellow', 'family'),
  t('abuelo', 'abuelo', 'grandfather', 4, 'yellow', 'family'),
  t('abuela', 'abuela', 'grandmother', 4, 'yellow', 'family'),
  t('tio', 'tío', 'uncle', 4, 'yellow', 'family'),
  t('tia', 'tía', 'aunt', 4, 'yellow', 'family'),
  t('primo', 'primo', 'cousin (male)', 4, 'yellow', 'family'),
  t('prima', 'prima', 'cousin (female)', 4, 'yellow', 'family'),
  t('hijo', 'hijo', 'son', 4, 'yellow', 'family'),
  t('hija', 'hija', 'daughter', 4, 'yellow', 'family'),
  t('bebe', 'bebé', 'baby', 4, 'yellow', 'family'),
  t('esposo', 'esposo', 'husband', 4, 'yellow', 'family'),
  t('esposa', 'esposa', 'wife', 4, 'yellow', 'family'),
  t('sobrino', 'sobrino', 'nephew', 4, 'yellow', 'family'),
  t('sobrina', 'sobrina', 'niece', 4, 'yellow', 'family'),
  t('familia', 'familia', 'family', 4, 'yellow', 'family'),
  t('mi', 'mi', 'my', 4, 'yellow', 'grammar'),
];

const unit4Exercises: Exercise[] = [
  ex({ type: 'counter', unit: 4, belt: 'yellow', prompt: 'What is "hermana"?', correctAnswer: 'Sister', options: ['Brother', 'Sister', 'Mom', 'Dad'] }),
  ex({ type: 'strike', unit: 4, belt: 'yellow', prompt: 'Tap the word for "uncle"', correctAnswer: 'tío', options: ['tía', 'tío', 'primo', 'prima'] }),
  ex({ type: 'block', unit: 4, belt: 'yellow', prompt: '______ familia es grande.', correctAnswer: 'Mi', options: ['Mi', 'Tu', 'El'] }),
  ex({ type: 'counter', unit: 4, belt: 'yellow', prompt: 'Translate: "My mom is nice (friendly)"', correctAnswer: 'Mi mamá es simpática', options: ['Mi mamá es simpática', 'Mi mamá es bonita', 'Mi papá es simpático', 'Mi hermana es alta'] }),
  ex({ type: 'speed', unit: 4, belt: 'yellow', prompt: 'Match family members!', correctAnswer: '', pairs: [{ spanish: 'mamá', english: 'mom' }, { spanish: 'papá', english: 'dad' }, { spanish: 'hermano', english: 'brother' }, { spanish: 'abuela', english: 'grandmother' }] }),
];

// ─── UNIT 5: Body and Health ───────────────────────────────────────

const unit5Techniques: Technique[] = [
  t('cabeza', 'cabeza', 'head', 5, 'orange', 'body'),
  t('mano', 'mano', 'hand', 5, 'orange', 'body'),
  t('pie', 'pie', 'foot', 5, 'orange', 'body'),
  t('ojo', 'ojo', 'eye', 5, 'orange', 'body'),
  t('boca', 'boca', 'mouth', 5, 'orange', 'body'),
  t('brazo', 'brazo', 'arm', 5, 'orange', 'body'),
  t('pierna', 'pierna', 'leg', 5, 'orange', 'body'),
  t('dedo', 'dedo', 'finger / toe', 5, 'orange', 'body'),
  t('nariz', 'nariz', 'nose', 5, 'orange', 'body'),
  t('oreja', 'oreja', 'ear', 5, 'orange', 'body'),
  t('estomago', 'estómago', 'stomach', 5, 'orange', 'body'),
  t('espalda', 'espalda', 'back', 5, 'orange', 'body'),
  t('rodilla', 'rodilla', 'knee', 5, 'orange', 'body'),
  t('cuello', 'cuello', 'neck', 5, 'orange', 'body'),
  t('me-duele', 'me duele', 'it hurts / my ... hurts', 5, 'orange', 'health'),
  t('estoy-bien', 'estoy bien', 'I am fine', 5, 'orange', 'health'),
];

const unit5Exercises: Exercise[] = [
  ex({ type: 'strike', unit: 5, belt: 'orange', prompt: 'Tap the word for "knee"', correctAnswer: 'rodilla', options: ['mano', 'rodilla', 'cabeza', 'pie'] }),
  ex({ type: 'counter', unit: 5, belt: 'orange', prompt: 'What is "brazo"?', correctAnswer: 'Arm', options: ['Arm', 'Leg', 'Hand', 'Foot'] }),
  ex({ type: 'block', unit: 5, belt: 'orange', prompt: 'Me duele la ______.', correctAnswer: 'cabeza', options: ['cabeza', 'hola', 'grande'] }),
  ex({ type: 'sense', unit: 5, belt: 'orange', prompt: 'Listen: "la boca"', correctAnswer: 'Mouth', options: ['Mouth', 'Eye', 'Hand', 'Head'], promptAudio: '/audio/vocab/boca.mp3' }),
];

// ─── UNIT 6: Animals ───────────────────────────────────────────────

const unit6Techniques: Technique[] = [
  t('perro', 'perro', 'dog', 6, 'orange', 'animals'),
  t('gato', 'gato', 'cat', 6, 'orange', 'animals'),
  t('pajaro', 'pájaro', 'bird', 6, 'orange', 'animals'),
  t('pez', 'pez', 'fish', 6, 'orange', 'animals'),
  t('caballo', 'caballo', 'horse', 6, 'orange', 'animals'),
  t('vaca', 'vaca', 'cow', 6, 'orange', 'animals'),
  t('cerdo', 'cerdo', 'pig', 6, 'orange', 'animals'),
  t('conejo', 'conejo', 'rabbit', 6, 'orange', 'animals'),
  t('raton', 'ratón', 'mouse', 6, 'orange', 'animals'),
  t('tortuga', 'tortuga', 'turtle', 6, 'orange', 'animals'),
  t('mariposa', 'mariposa', 'butterfly', 6, 'orange', 'animals'),
  t('mono', 'mono', 'monkey', 6, 'orange', 'animals'),
  t('oso', 'oso', 'bear', 6, 'orange', 'animals'),
  t('el-la', 'el / la', 'the (masculine / feminine)', 6, 'orange', 'grammar'),
];

const unit6Exercises: Exercise[] = [
  ex({ type: 'strike', unit: 6, belt: 'orange', prompt: 'Tap the word for "rabbit"', correctAnswer: 'conejo', options: ['gato', 'conejo', 'pájaro', 'pez'] }),
  ex({ type: 'counter', unit: 6, belt: 'orange', prompt: 'What is "vaca"?', correctAnswer: 'Cow', options: ['Dog', 'Cow', 'Horse', 'Pig'] }),
  ex({ type: 'block', unit: 6, belt: 'orange', prompt: '______ pájaro es bonito.', correctAnswer: 'El', options: ['El', 'La', 'Un'] }),
  ex({ type: 'kata', unit: 6, belt: 'orange', prompt: 'Build: "The horse is big"', correctAnswer: 'El caballo es grande', words: ['El', 'caballo', 'es', 'grande'] }),
  ex({ type: 'speed', unit: 6, belt: 'orange', prompt: 'Match the animals!', correctAnswer: '', pairs: [{ spanish: 'perro', english: 'dog' }, { spanish: 'gato', english: 'cat' }, { spanish: 'pájaro', english: 'bird' }, { spanish: 'pez', english: 'fish' }] }),
];

// ─── UNIT 7: Food and Drinks ───────────────────────────────────────

const unit7Techniques: Technique[] = [
  t('manzana', 'manzana', 'apple', 7, 'green', 'food'),
  t('agua', 'agua', 'water', 7, 'green', 'food'),
  t('leche', 'leche', 'milk', 7, 'green', 'food'),
  t('pan', 'pan', 'bread', 7, 'green', 'food'),
  t('pollo', 'pollo', 'chicken', 7, 'green', 'food'),
  t('arroz', 'arroz', 'rice', 7, 'green', 'food'),
  t('frijoles', 'frijoles', 'beans', 7, 'green', 'food'),
  t('huevo', 'huevo', 'egg', 7, 'green', 'food'),
  t('queso', 'queso', 'cheese', 7, 'green', 'food'),
  t('fruta', 'fruta', 'fruit', 7, 'green', 'food'),
  t('jugo', 'jugo', 'juice', 7, 'green', 'food'),
  t('cafe', 'café', 'coffee', 7, 'green', 'food'),
  t('carne', 'carne', 'meat', 7, 'green', 'food'),
  t('ensalada', 'ensalada', 'salad', 7, 'green', 'food'),
  t('sopa', 'sopa', 'soup', 7, 'green', 'food'),
  t('me-gusta', 'me gusta', 'I like', 7, 'green', 'grammar'),
  t('no-me-gusta', 'no me gusta', "I don't like", 7, 'green', 'grammar'),
];

const unit7Exercises: Exercise[] = [
  ex({ type: 'counter', unit: 7, belt: 'green', prompt: 'What is "queso"?', correctAnswer: 'Cheese', options: ['Cheese', 'Bread', 'Milk', 'Water'] }),
  ex({ type: 'block', unit: 7, belt: 'green', prompt: 'Me gusta comer ______.', correctAnswer: 'manzanas', options: ['manzanas', 'escuela', 'azul'] }),
  ex({ type: 'counter', unit: 7, belt: 'green', prompt: 'How do you say "I like water"?', correctAnswer: 'Me gusta el agua', options: ['Me gusta el agua', 'No me gusta', 'Me llamo agua', 'El agua es rojo'] }),
  ex({ type: 'kata', unit: 7, belt: 'green', prompt: 'Build: "I like bread"', correctAnswer: 'Me gusta el pan', words: ['Me', 'gusta', 'el', 'pan'] }),
  ex({ type: 'strike', unit: 7, belt: 'green', prompt: 'Tap the word for "rice"', correctAnswer: 'arroz', options: ['pan', 'arroz', 'leche', 'agua'] }),
];

// ─── UNIT 8: Classroom and School ──────────────────────────────────

const unit8Techniques: Technique[] = [
  t('libro', 'libro', 'book', 8, 'green', 'school'),
  t('lapiz', 'lápiz', 'pencil', 8, 'green', 'school'),
  t('escuela', 'escuela', 'school', 8, 'green', 'school'),
  t('maestro', 'maestro', 'teacher (male)', 8, 'green', 'school'),
  t('maestra', 'maestra', 'teacher (female)', 8, 'green', 'school'),
  t('clase', 'clase', 'class', 8, 'green', 'school'),
  t('puerta', 'puerta', 'door', 8, 'green', 'school'),
  t('ventana', 'ventana', 'window', 8, 'green', 'school'),
  t('mesa', 'mesa', 'table', 8, 'green', 'school'),
  t('silla', 'silla', 'chair', 8, 'green', 'school'),
  t('pizarra', 'pizarra', 'chalkboard / whiteboard', 8, 'green', 'school'),
  t('mochila', 'mochila', 'backpack', 8, 'green', 'school'),
  t('cuaderno', 'cuaderno', 'notebook', 8, 'green', 'school'),
  t('tarea', 'tarea', 'homework', 8, 'green', 'school'),
  t('examen', 'examen', 'test / exam', 8, 'green', 'school'),
  t('recreo', 'recreo', 'recess', 8, 'green', 'school'),
  t('puedo-ir', '¿puedo ir al baño?', 'can I go to the bathroom?', 8, 'green', 'phrases'),
];

const unit8Exercises: Exercise[] = [
  ex({ type: 'counter', unit: 8, belt: 'green', prompt: 'What is "un libro"?', correctAnswer: 'A book', options: ['A book', 'A pencil', 'A door', 'A class'] }),
  ex({ type: 'strike', unit: 8, belt: 'green', prompt: 'Tap the word for "backpack"', correctAnswer: 'mochila', options: ['libro', 'mochila', 'escuela', 'maestro'] }),
  ex({ type: 'block', unit: 8, belt: 'green', prompt: 'El ______ es grande.', correctAnswer: 'libro', options: ['libro', 'rojo', 'hola'] }),
  ex({ type: 'counter', unit: 8, belt: 'green', prompt: 'What does "¿puedo ir al baño?" mean?', correctAnswer: 'Can I go to the bathroom?', options: ['Can I go to the bathroom?', 'Where is the school?', 'What is your name?', 'I like books'] }),
  ex({ type: 'kata', unit: 8, belt: 'green', prompt: 'Build: "The teacher is nice (friendly)"', correctAnswer: 'El maestro es simpático', words: ['El', 'maestro', 'es', 'simpático'] }),
];

// ─── DOJO 1 BELT TEST (hand-crafted seeds; ceremony blends generated) ─

const dojo1BossExercises: Exercise[] = [
  ex({ type: 'counter', unit: 0, belt: 'green', prompt: 'What does "hola" mean?', correctAnswer: 'Hello', options: ['Hello', 'Goodbye', 'Please', 'Thank you'] }),
  ex({ type: 'counter', unit: 0, belt: 'green', prompt: 'What number is "catorce"?', correctAnswer: '14', options: ['12', '13', '14', '15'] }),
  ex({ type: 'block', unit: 0, belt: 'green', prompt: 'El gato es ______.', correctAnswer: 'pequeño', options: ['pequeño', 'hola', 'cinco'] }),
  ex({ type: 'counter', unit: 0, belt: 'green', prompt: '"Simpático" means...', correctAnswer: 'Nice / friendly (person)', options: ['Nice / friendly (person)', 'Pretty', 'Tall', 'Old'] }),
  ex({ type: 'strike', unit: 0, belt: 'green', prompt: 'Tap the word for "arm"', correctAnswer: 'brazo', options: ['cabeza', 'brazo', 'pie', 'ojo'] }),
  ex({ type: 'counter', unit: 0, belt: 'green', prompt: 'What is "conejo"?', correctAnswer: 'Rabbit', options: ['Cat', 'Rabbit', 'Bird', 'Fish'] }),
  ex({ type: 'block', unit: 0, belt: 'green', prompt: 'Me ______ la manzana.', correctAnswer: 'gusta', options: ['gusta', 'llamo', 'duele'] }),
  ex({ type: 'counter', unit: 0, belt: 'green', prompt: 'What is "la mochila"?', correctAnswer: 'The backpack', options: ['The backpack', 'The book', 'The school', 'The teacher'] }),
  ex({ type: 'kata', unit: 0, belt: 'green', prompt: 'Build: "My family is big"', correctAnswer: 'Mi familia es grande', words: ['Mi', 'familia', 'es', 'grande'] }),
  ex({ type: 'counter', unit: 0, belt: 'green', prompt: 'Translate: "I don\'t like milk"', correctAnswer: 'No me gusta la leche', options: ['No me gusta la leche', 'Me gusta la leche', 'Me llamo leche', 'La leche es blanca'] }),
  ex({
    type: 'kiai',
    unit: 0,
    belt: 'green',
    prompt: 'Say: "¡Hola, me llamo guerrero!"',
    displayPhrase: '¡Hola, me llamo guerrero!',
    correctAnswer: 'hola me llamo guerrero',
  }),
  ex({ type: 'counter', unit: 0, belt: 'green', prompt: 'How do you say "goodbye"?', correctAnswer: 'Adiós', options: ['Hola', 'Adiós', 'Gracias', 'Por favor'] }),
];

const unit1: UnitData = { id: 1, belt: 'white', stripe: 1, title: 'Greetings & Introductions', titleEs: 'Saludos y Presentaciones', topic: 'greetings', techniques: unit1Techniques, exercises: unit1Exercises, storySnippet: 'You arrive at the Dojo for the first time. Sensei greets you: "¡Hola! ¿Cómo te llamas?"' };
const unit2: UnitData = { id: 2, belt: 'white', stripe: 2, title: 'Numbers 1-20', titleEs: 'Números 1-20', topic: 'numbers', techniques: unit2Techniques, exercises: unit2Exercises, storySnippet: 'Sensei asks you to count the training dummies. "¿Cuántos hay? Uno, dos, tres..."' };
const unit3: UnitData = { id: 3, belt: 'yellow', stripe: 1, title: 'Colors & Descriptions', titleEs: 'Colores y Descripciones', topic: 'colors', techniques: unit3Techniques, exercises: unit3Exercises, storySnippet: 'The dojo is filled with colored belts on the wall. "¿De qué color es tu cinturón?"' };
const unit4: UnitData = { id: 4, belt: 'yellow', stripe: 2, title: 'Family', titleEs: 'La Familia', topic: 'family', techniques: unit4Techniques, exercises: unit4Exercises, storySnippet: 'Your training partner tells you about their family. "Mi mamá es simpática. Mi hermano también entrena aquí."' };
const unit5: UnitData = { id: 5, belt: 'orange', stripe: 1, title: 'Body & Health', titleEs: 'El Cuerpo y la Salud', topic: 'body', techniques: unit5Techniques, exercises: unit5Exercises, storySnippet: 'Sensei teaches you the body parts needed for martial arts. "Usa la cabeza, las manos, y los pies."' };
const unit6: UnitData = { id: 6, belt: 'orange', stripe: 2, title: 'Animals', titleEs: 'Los Animales', topic: 'animals', techniques: unit6Techniques, exercises: unit6Exercises, storySnippet: 'On the path to the dojo, you see animals. "¡Mira! El perro es grande y el gato es pequeño."' };
const unit7: UnitData = { id: 7, belt: 'green', stripe: 1, title: 'Food & Drinks', titleEs: 'Comida y Bebidas', topic: 'food', techniques: unit7Techniques, exercises: unit7Exercises, storySnippet: 'After training, everyone eats together. "¿Qué te gusta comer? Me gusta el pollo con agua."' };
const unit8: UnitData = { id: 8, belt: 'green', stripe: 2, title: 'Classroom & School', titleEs: 'La Clase y la Escuela', topic: 'school', techniques: unit8Techniques, exercises: unit8Exercises, storySnippet: 'The dojo also has a classroom. "Necesitas un libro y un lápiz para la clase de hoy."' };

export const dojo1: DojoData = {
  id: 1,
  name: 'El Dojo',
  nameEs: 'El Dojo',
  description: 'The learner arrives as a new student. Sensei greets them and begins foundational training.',
  cefr: 'A1',
  belts: ['white', 'yellow', 'orange', 'green'],
  units: [unit1, unit2, unit3, unit4, unit5, unit6, unit7, unit8],
  bossExercises: dojo1BossExercises,
};

export const allDojos: DojoData[] = [dojo1];

/** All units in dojo 1 (for exercise generator pool). */
export function getDojo1Units(): UnitData[] {
  return dojo1.units;
}

export function getUnitById(unitId: number): UnitData | undefined {
  for (const dojo of allDojos) {
    const unit = dojo.units.find((u) => u.id === unitId);
    if (unit) return unit;
  }
  return undefined;
}

export function getDojoForUnit(unitId: number): DojoData | undefined {
  return allDojos.find((d) => d.units.some((u) => u.id === unitId));
}

export function getAllTechniques(): Technique[] {
  return allDojos.flatMap((d) => d.units.flatMap((u) => u.techniques));
}

export function getTechniquesByBelt(belt: BeltColor): Technique[] {
  return allDojos.flatMap((d) => d.units.filter((u) => u.belt === belt).flatMap((u) => u.techniques));
}
