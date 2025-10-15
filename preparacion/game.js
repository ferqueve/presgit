// ============================================
// VARIABLES GLOBALES
// ============================================
let game;
let playerSprite;
let enemySprite;
let helperSprite;
let currentScene;
let backgroundMusic;

let studentName = '';
let currentQuestion = 0;
let playerHealth = 100;
let enemyHealth = 100;
let correctAnswers = 0;
let consecutiveErrors = 0;
let questions = [];
let quizNumber = 0;
let currentStage = 1;
let helperActive = false;

const TOTAL_QUESTIONS = 30;
const QUESTIONS_PER_STAGE = 10;

const enemies = [
    { name: 'Tutor Juan', color: 0x3b82f6, stage: 1, texture: 'tutor_juan' },
    { name: 'Tutor Nicolás', color: 0x8b5cf6, stage: 2, texture: 'tutor_nicolas' },
    { name: 'Tutor Oscuro Fernando', color: 0xef4444, stage: 3, texture: 'tutor_fernando' }
];

const helpers = ['Tutora Natalia', 'Tutora Agustina'];

// ============================================
// CONFIGURACIÓN DE PHASER
// ============================================
const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 400,
    parent: 'game-container',
    backgroundColor: '#1a1d23',
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    }
};

// ============================================
// FUNCIONES DE INICIO
// ============================================
async function startGame() {
    const nameInput = document.getElementById('studentName');
    studentName = nameInput.value.trim();
    
    if (!studentName) {
        Swal.fire({
            icon: 'warning',
            title: 'Nombre requerido',
            text: 'Por favor ingresa tu nombre'
        });
        return;
    }
    
    // Iniciar música de fondo
    startBackgroundMusic();
    
    // Seleccionar cuestionario aleatorio (1-5)
    quizNumber = Math.floor(Math.random() * 5) + 1;
    
    // Cargar preguntas
    const loaded = await loadQuestions();
    if (!loaded) return;
    
    // Mostrar pantalla de juego
    document.getElementById('startScreen').classList.add('d-none');
    document.getElementById('gameScreen').classList.remove('d-none');
    
    // Actualizar UI
    document.getElementById('playerName').textContent = studentName;
    document.getElementById('quizNumber').innerHTML = 
        `<i class="fas fa-book"></i> Cuestionario #${quizNumber}`;
    
    // Inicializar Phaser
    game = new Phaser.Game(config);
    
    // Mostrar primera pregunta
    setTimeout(() => displayQuestion(), 500);
}

// ============================================
// FUNCIONES DE AUDIO
// ============================================
function startBackgroundMusic() {
    try {
        // Crear elemento de audio
        backgroundMusic = new Audio('musica.mp3');
        
        // Configurar música
        backgroundMusic.loop = true;  // Repetir en bucle
        backgroundMusic.volume = 0.15; // Volumen bajo (15%)
        
        // Intentar reproducir
        backgroundMusic.play().catch(error => {
            console.log('No se pudo reproducir la música:', error);
            // Algunos navegadores bloquean autoplay, pero no es crítico
        });
    } catch (error) {
        console.log('Error al cargar música:', error);
        // Si no existe el archivo, el juego continúa sin música
    }
}

function stopBackgroundMusic() {
    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
}

// ============================================
// CARGA DE PREGUNTAS
// ============================================
async function loadQuestions() {
    try {
        const response = await fetch(`preguntas${quizNumber}.json`);
        if (!response.ok) throw new Error('No se pudo cargar el cuestionario');
        
        const data = await response.json();
        questions = shuffleArray(data.preguntas).slice(0, TOTAL_QUESTIONS);
        
        // Mezclar opciones de cada pregunta
        questions = questions.map(q => shuffleQuestion(q));
        
        return true;
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: `No se pudo cargar preguntas${quizNumber}.json. Asegúrate de que el archivo existe.`
        });
        return false;
    }
}

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function shuffleQuestion(question) {
    const indices = shuffleArray([0, 1, 2, 3]);
    return {
        pregunta: question.pregunta,
        opciones: indices.map(i => question.opciones[i]),
        correcta: indices.indexOf(question.correcta)
    };
}

// ============================================
// FUNCIONES DE PHASER
// ============================================
function preload() {
    this.load.on('loaderror', file => console.log('No cargó:', file.key));
    this.load.image('background', 'images/fondo.png');
    this.load.image('player', 'images/estudiante.png');
    this.load.image('tutor_juan', 'images/tutor_juan.png');
    this.load.image('tutor_nicolas', 'images/tutor_nicolas.png');
    this.load.image('tutor_fernando', 'images/tutor_fernando.png');
    this.load.image('helper_natalia', 'images/tutora_natalia.png');
    this.load.image('helper_agustina', 'images/tutora_agustina.png');
}

function create() {
    currentScene = this;
    
    // Fondo
    if (this.textures.exists('background')) {
        const bg = this.add.image(450, 200, 'background');
        bg.setDisplaySize(900, 400);
    } else {
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x667eea, 0x667eea, 0x764ba2, 0x764ba2, 1);
        graphics.fillRect(0, 0, 900, 400);
    }
    
    // Crear jugador
    createPlayer(this);
    
    // Crear primer enemigo
    createEnemy(this, 1);
}

function update() {}

function createPlayer(scene) {
    if (scene.textures.exists('player')) {
        playerSprite = scene.add.sprite(150, 200, 'player');
        playerSprite.setScale(0.5);
    } else {
        const g = scene.add.graphics();
        g.fillStyle(0x10b981, 1);
        g.fillRoundedRect(0, 0, 80, 80, 12);
        g.generateTexture('playerShape', 80, 80);
        playerSprite = scene.add.sprite(150, 200, 'playerShape');
        
        // Cara
        const face = scene.add.graphics();
        face.fillStyle(0xffffff, 1);
        face.fillCircle(138, 192, 8);
        face.fillCircle(162, 192, 8);
        face.fillStyle(0x000000, 1);
        face.fillCircle(138, 192, 4);
        face.fillCircle(162, 192, 4);
        face.strokeCircle(150, 210, 12);
    }
}

function createEnemy(scene, stage) {
    const enemy = enemies[stage - 1];
    const textureName = enemy.texture || `tutor_${enemy.name.toLowerCase().split(' ')[1]}`;
    
    if (enemySprite) {
        enemySprite.destroy();
    }
    
    if (scene.textures.exists(textureName)) {
        enemySprite = scene.add.sprite(750, 200, textureName);
        enemySprite.setScale(0.1);
    } else {
        const g = scene.add.graphics();
        g.fillStyle(enemy.color, 1);
        g.fillRoundedRect(0, 0, 80, 80, 12);
        g.generateTexture(`enemyShape${stage}`, 80, 80);
        enemySprite = scene.add.sprite(750, 200, `enemyShape${stage}`);
        
        // Cara malvada
        const face = scene.add.graphics();
        face.fillStyle(0xff0000, 1);
        face.fillCircle(738, 192, 8);
        face.fillCircle(762, 192, 8);
    }
    
    // Resetear salud del enemigo
    enemyHealth = 100;
    updateHealth();
    
    // Actualizar nombre
    document.getElementById('enemyName').textContent = enemy.name;
    document.getElementById('stageInfo').innerHTML = 
        `<i class="fas fa-trophy"></i> Etapa ${stage}: vs ${enemy.name}`;
}

function createHelper(scene) {
    const helperName = helpers[Math.floor(Math.random() * helpers.length)];
    const textureName = `helper_${helperName.toLowerCase().split(' ')[1]}`;
    
    let x = 450;
    let y = 100;
    
    if (scene.textures.exists(textureName)) {
        helperSprite = scene.add.sprite(x, y, textureName);
        helperSprite.setScale(0.15);
    } else {
        const g = scene.add.graphics();
        g.fillStyle(0xff6b9d, 1);
        g.fillRoundedRect(0, 0, 70, 70, 10);
        g.generateTexture('helperShape', 70, 70);
        helperSprite = scene.add.sprite(x, y, 'helperShape');
        
        // Cara amigable
        const face = scene.add.graphics();
        face.fillStyle(0xffffff, 1);
        face.fillCircle(440, 93, 6);
        face.fillCircle(460, 93, 6);
        face.fillStyle(0xff69b4, 1);
        face.fillCircle(450, 105, 8);
    }
    
    // Animar entrada
    scene.tweens.add({
        targets: helperSprite,
        y: 200,
        duration: 500,
        ease: 'Bounce'
    });
    
    return helperName;
}

// ============================================
// LÓGICA DE PREGUNTAS
// ============================================
function displayQuestion() {
    const q = questions[currentQuestion];
    const stage = Math.floor(currentQuestion / QUESTIONS_PER_STAGE) + 1;
    
    // Cambiar de etapa si es necesario
    if (stage !== currentStage && currentQuestion > 0) {
        changeStage(stage);
    }
    
    document.getElementById('questionBadge').textContent = `Pregunta ${currentQuestion + 1}`;
    document.getElementById('questionCounter').textContent = `${currentQuestion + 1} / ${TOTAL_QUESTIONS}`;
    document.getElementById('questionText').textContent = q.pregunta;
    
    const container = document.getElementById('optionsContainer');
    container.innerHTML = '';
    
    q.opciones.forEach((opcion, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<strong>${String.fromCharCode(65 + index)})</strong> ${opcion}`;
        btn.onclick = () => selectAnswer(index, btn);
        container.appendChild(btn);
    });
    
    document.getElementById('nextBtn').disabled = true;
}

function changeStage(newStage) {
    currentStage = newStage;
    
    Swal.fire({
        icon: 'info',
        title: '¡Nueva Etapa!',
        text: `Ahora enfrentarás a ${enemies[newStage - 1].name}`,
        timer: 2000,
        showConfirmButton: false
    });
    
    setTimeout(() => {
        createEnemy(currentScene, newStage);
    }, 2000);
}

function selectAnswer(index, button) {
    const q = questions[currentQuestion];
    const isCorrect = index === q.correcta;
    
    document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);
    
    button.classList.add(isCorrect ? 'correct' : 'incorrect');
    
    if (!isCorrect) {
        document.querySelectorAll('.option-btn')[q.correcta].classList.add('correct');
        consecutiveErrors++;
        
        // Verificar si necesita ayuda
        if (consecutiveErrors >= 3 && !helperActive) {
            setTimeout(() => activateHelper(), 1500);
        }
    } else {
        consecutiveErrors = 0;
    }
    
    setTimeout(() => {
        if (isCorrect) {
            correctAnswers++;
            shootProjectile(150, 200, 750, 200, 0x10b981);
            setTimeout(() => {
                enemyHealth -= 5;
                updateHealth();
                showDamage(enemySprite);
                Swal.fire({
                    icon: 'success',
                    title: '¡Correcto!',
                    timer: 1500,
                    showConfirmButton: false
                });
            }, 400);
        } else {
            shootProjectile(750, 200, 150, 200, 0xef4444);
            setTimeout(() => {
                playerHealth -= 5;
                updateHealth();
                showDamage(playerSprite);
                Swal.fire({
                    icon: 'error',
                    title: 'Incorrecto',
                    timer: 1500,
                    showConfirmButton: false
                });
            }, 400);
        }
    }, 500);
    
    document.getElementById('nextBtn').disabled = false;
}

function activateHelper() {
    // Si ya hay un helper activo, no hacer nada
    if (helperActive) {
        return;
    }
    
    // Limpiar cualquier sprite anterior que pueda existir
    if (helperSprite) {
        helperSprite.destroy();
        helperSprite = null;
    }
    
    helperActive = true;
    const helperName = createHelper(currentScene);
    
    document.getElementById("helperName").textContent = helperName;
    const indicator = document.getElementById("helpIndicator");
    indicator.innerHTML = `<i class="fas fa-heart"></i> <strong>${helperName}</strong> está ayudándote`;
    indicator.classList.remove("d-none");
    
    Swal.fire({
        icon: 'success',
        title: '¡Ayuda al rescate!',
        html: `<strong>${helperName}</strong> te ayudará con 5 ataques al enemigo`,
        timer: 2000,
        showConfirmButton: false
    });
    
    // 5 disparos consecutivos
    let shots = 0;
    const interval = setInterval(() => {
        if (shots < 5) {
            shootProjectile(450, 200, 750, 200, 0xff6b9d);
            setTimeout(() => {
                enemyHealth -= 3;
                updateHealth();
                showDamage(enemySprite);
            }, 400);
            shots++;
        } else {
            clearInterval(interval);
            
            // Desaparecer helper
            currentScene.tweens.add({
                targets: helperSprite,
                alpha: 0,
                y: 100,
                duration: 500,
                onComplete: () => {
                    if (helperSprite) {
                        helperSprite.destroy();
                        helperSprite = null;
                    }
                    document.getElementById('helpIndicator').classList.add('d-none');
                    helperActive = false;
                    consecutiveErrors = 0;
                }
            });
        }
    }, 800);
}

function nextQuestion() {
    currentQuestion++;
    
    if (currentQuestion < TOTAL_QUESTIONS) {
        displayQuestion();
    } else {
        endGame();
    }
}

// ============================================
// EFECTOS VISUALES
// ============================================
function shootProjectile(fromX, fromY, toX, toY, color) {
    const scene = currentScene;
    const g = scene.add.graphics();
    g.fillStyle(color, 1);
    g.fillCircle(0, 0, 12);
    g.lineStyle(3, 0xffffff, 0.9);
    g.strokeCircle(0, 0, 12);
    g.generateTexture('proj' + Date.now(), 28, 28);
    
    const projectile = scene.add.sprite(fromX, fromY, 'proj' + Date.now());
    
    scene.tweens.add({
        targets: projectile,
        x: toX,
        y: toY,
        angle: 720,
        duration: 400,
        ease: 'Power2',
        onComplete: () => {
            projectile.destroy();
            g.destroy();
        }
    });
    
    const sprite = fromX < 450 ? playerSprite : (helperSprite || enemySprite);
    scene.tweens.add({
        targets: sprite,
        scaleX: sprite.scaleX * 1.2,
        scaleY: sprite.scaleY * 1.2,
        duration: 100,
        yoyo: true
    });
}

function showDamage(sprite) {
    currentScene.tweens.add({
        targets: sprite,
        alpha: 0.3,
        duration: 100,
        yoyo: true,
        repeat: 2
    });
    
    currentScene.tweens.add({
        targets: sprite,
        x: sprite.x + (sprite === playerSprite ? 15 : -15),
        duration: 50,
        yoyo: true,
        repeat: 3
    });
}

function updateHealth() {
    document.getElementById('playerHealthBar').style.width = `${playerHealth}%`;
    document.getElementById('enemyHealthBar').style.width = `${enemyHealth}%`;
    document.getElementById('playerHealthText').textContent = `${playerHealth} / 100`;
    document.getElementById('enemyHealthText').textContent = `${enemyHealth} / 100`;
    
    if (enemyHealth <= 0) {
        setTimeout(endGame, 1000);
    }
}

// ============================================
// FIN DEL JUEGO
// ============================================
function endGame() {
    const victory = enemyHealth <= 0 || correctAnswers >= TOTAL_QUESTIONS * 0.7;
    const percentage = (correctAnswers / TOTAL_QUESTIONS) * 100;
    
    if (victory && enemySprite) {
        currentScene.tweens.add({
            targets: enemySprite,
            alpha: 0,
            angle: 360,
            scale: 0,
            duration: 1000
        });
    }
    
    setTimeout(() => {
        Swal.fire({
            icon: victory ? 'success' : 'info',
            title: victory ? '¡Victoria Total!' : 'Juego Terminado',
            html: `
                <div style="text-align: left; padding: 20px;">
                    <h4>${victory ? '¡Has completado la batalla!' : 'Fin del juego'}</h4>
                    <hr>
                    <p><strong>👤 Estudiante:</strong> ${studentName}</p>
                    <p><strong>📚 Cuestionario:</strong> #${quizNumber}</p>
                    <p><strong>✅ Correctas:</strong> ${correctAnswers} / ${TOTAL_QUESTIONS}</p>
                    <p><strong>📊 Porcentaje:</strong> ${percentage.toFixed(1)}%</p>
                    <p><strong>💚 Tu salud:</strong> ${playerHealth}</p>
                    <p><strong>❤️ Salud enemigo:</strong> ${enemyHealth}</p>
                    ${victory ? '<p style="color: #10b981; font-weight: bold;">🎉 ¡Excelente trabajo!</p>' : ''}
                </div>
            `,
            confirmButtonText: 'Jugar de nuevo',
            confirmButtonColor: '#667eea',
            width: 600
        }).then(() => location.reload());
    }, 1000);
}