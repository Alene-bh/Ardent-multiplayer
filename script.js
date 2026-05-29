const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const sounds = {
    music: new Audio("assets/audio/battle-theme.mp3"),
    shoot: "assets/audio/shoot.mp3",
    hit: "assets/audio/hit.mp3"
};

sounds.music.loop = true;

let soundEnabled = false;

let audioSettings = {
    musicEnabled: localStorage.getItem("tdMusicEnabled") !== "false",
    sfxEnabled: localStorage.getItem("tdSfxEnabled") !== "false",
    musicVolume: Number(localStorage.getItem("tdMusicVolume")) || 0.28,
    sfxVolume: Number(localStorage.getItem("tdSfxVolume")) || 0.28
};

function getGameTime() {
    return gameTime;
}

function enableSound() {
    soundEnabled = true;
}

function saveAudioSettings() {
    localStorage.setItem("tdMusicEnabled", audioSettings.musicEnabled);
    localStorage.setItem("tdSfxEnabled", audioSettings.sfxEnabled);
    localStorage.setItem("tdMusicVolume", audioSettings.musicVolume);
    localStorage.setItem("tdSfxVolume", audioSettings.sfxVolume);
}

function applyAudioSettingsToUI() {
    menuMusicToggle.checked = audioSettings.musicEnabled;
    pauseMusicToggle.checked = audioSettings.musicEnabled;

    menuSfxToggle.checked = audioSettings.sfxEnabled;
    pauseSfxToggle.checked = audioSettings.sfxEnabled;

    menuMusicVolume.value = audioSettings.musicVolume;
    pauseMusicVolume.value = audioSettings.musicVolume;

    menuSfxVolume.value = audioSettings.sfxVolume;
    pauseSfxVolume.value = audioSettings.sfxVolume;

    sounds.music.volume = audioSettings.musicEnabled ? audioSettings.musicVolume : 0;

    syncMusicState();
}

function shouldMusicBePlaying() {
    return (
        soundEnabled &&
        audioSettings.musicEnabled &&
        gameStarted &&
        gameRunning &&
        waveInProgress &&
        !isPaused &&
        !document.hidden
    );
}

function syncMusicState() {
    sounds.music.volume = audioSettings.musicEnabled ? audioSettings.musicVolume : 0;

    if (shouldMusicBePlaying()) {
        sounds.music.play().catch(error => {
            console.log("Music error:", error);
        });
    } else {
        sounds.music.pause();
    }
}

function stopMusicAndReset() {
    sounds.music.pause();
    sounds.music.currentTime = 0;
}

function playSfx(src, baseVolume = 1) {
    if (!soundEnabled) return;
    if (!audioSettings.sfxEnabled) return;

    const sfx = new Audio(src);
    sfx.volume = audioSettings.sfxVolume * baseVolume;

    sfx.play().catch(error => {
        console.log("SFX error:", error);
    });
}

function playShootSound() {
    playSfx(sounds.shoot, 0.75);
}

function playHitSound() {
    playSfx(sounds.hit, 0.9);
}

const menu = document.getElementById("menu");
const gameArea = document.getElementById("gameArea");
const startGameBtn = document.getElementById("startGameBtn");

const waveText = document.getElementById("waveText");
const hpText = document.getElementById("hpText");
const barricadeText = document.getElementById("barricadeText");
const coinsText = document.getElementById("coinsText");
const scoreText = document.getElementById("scoreText");

const abilitySlots = {
    bomb: document.getElementById("abilityBombSlot"),
    freeze: document.getElementById("abilityFreezeSlot"),
    tsunami: document.getElementById("abilityTsunamiSlot"),
    lightning: document.getElementById("abilityLightningSlot"),
    meteor: document.getElementById("abilityMeteorSlot")
};

const redFlash = document.getElementById("redFlash");
const bossBarBox = document.getElementById("bossBarBox");
const bossBarFill = document.getElementById("bossBarFill");
const bossNameText = document.getElementById("bossNameText");
const centerMessage = document.getElementById("centerMessage");

const waveSummaryPanel = document.getElementById("waveSummaryPanel");
const openShopBtn = document.getElementById("openShopBtn");

const summaryKillsText = document.getElementById("summaryKillsText");
const summaryGoldText = document.getElementById("summaryGoldText");
const summaryScoreText = document.getElementById("summaryScoreText");
const summaryHpText = document.getElementById("summaryHpText");
const summaryBarricadeText = document.getElementById("summaryBarricadeText");
const summaryBonusText = document.getElementById("summaryBonusText");

const shop = document.getElementById("shop");
const gameOverScreen = document.getElementById("gameOverScreen");

const deathMessageText = document.getElementById("deathMessageText");
const finalScoreText = document.getElementById("finalScoreText");
const bestScoreText = document.getElementById("bestScoreText");
const bestScoreMenuText = document.getElementById("bestScoreMenuText");

const upgradeDamageBtn = document.getElementById("upgradeDamageBtn");
const upgradeFireRateBtn = document.getElementById("upgradeFireRateBtn");
const upgradeMaxHpBtn = document.getElementById("upgradeMaxHpBtn");
const upgradeCritBtn = document.getElementById("upgradeCritBtn");

const buySmallPotionBtn = document.getElementById("buySmallPotionBtn");
const buyMediumPotionBtn = document.getElementById("buyMediumPotionBtn");
const buyLargePotionBtn = document.getElementById("buyLargePotionBtn");
const repairBarricadeBtn = document.getElementById("repairBarricadeBtn");
const upgradeBarricadeBtn = document.getElementById("upgradeBarricadeBtn");

const buyTower1Btn = document.getElementById("buyTower1Btn");
const upgradeTower1Btn = document.getElementById("upgradeTower1Btn");
const buyTower2Btn = document.getElementById("buyTower2Btn");
const upgradeTower2Btn = document.getElementById("upgradeTower2Btn");
const buyTower3Btn = document.getElementById("buyTower3Btn");
const upgradeTower3Btn = document.getElementById("upgradeTower3Btn");

const tower1BuyBox = document.getElementById("tower1BuyBox");
const tower1UpgradeBox = document.getElementById("tower1UpgradeBox");
const tower2BuyBox = document.getElementById("tower2BuyBox");
const tower2UpgradeBox = document.getElementById("tower2UpgradeBox");
const tower3BuyBox = document.getElementById("tower3BuyBox");
const tower3UpgradeBox = document.getElementById("tower3UpgradeBox");

const buyBombBtn = document.getElementById("buyBombBtn");
const buyFreezeBtn = document.getElementById("buyFreezeBtn");
const buyTsunamiBtn = document.getElementById("buyTsunamiBtn");
const buyLightningBtn = document.getElementById("buyLightningBtn");
const buyMeteorBtn = document.getElementById("buyMeteorBtn");

const nextWaveBtn = document.getElementById("nextWaveBtn");
const newRunBtn = document.getElementById("newRunBtn");

const playerDamageText = document.getElementById("playerDamageText");
const playerFireDelayText = document.getElementById("playerFireDelayText");
const playerMaxHpText = document.getElementById("playerMaxHpText");
const critChanceText = document.getElementById("critChanceText");

const damageCostText = document.getElementById("damageCostText");
const fireRateCostText = document.getElementById("fireRateCostText");
const maxHpCostText = document.getElementById("maxHpCostText");
const critCostText = document.getElementById("critCostText");

const smallPotionCostText = document.getElementById("smallPotionCostText");
const mediumPotionCostText = document.getElementById("mediumPotionCostText");
const largePotionCostText = document.getElementById("largePotionCostText");
const repairBarricadeCostText = document.getElementById("repairBarricadeCostText");
const upgradeBarricadeCostText = document.getElementById("upgradeBarricadeCostText");
const barricadeTierText = document.getElementById("barricadeTierText");

const tower1CostText = document.getElementById("tower1CostText");
const tower1UpgradeCostText = document.getElementById("tower1UpgradeCostText");
const tower1LevelText = document.getElementById("tower1LevelText");

const tower2CostText = document.getElementById("tower2CostText");
const tower2UpgradeCostText = document.getElementById("tower2UpgradeCostText");
const tower2LevelText = document.getElementById("tower2LevelText");

const tower3CostText = document.getElementById("tower3CostText");
const tower3UpgradeCostText = document.getElementById("tower3UpgradeCostText");
const tower3LevelText = document.getElementById("tower3LevelText");

const bombCostText = document.getElementById("bombCostText");
const freezeCostText = document.getElementById("freezeCostText");
const tsunamiCostText = document.getElementById("tsunamiCostText");
const lightningCostText = document.getElementById("lightningCostText");
const meteorCostText = document.getElementById("meteorCostText");

const pauseBtn = document.getElementById("pauseBtn");
const pausePanel = document.getElementById("pausePanel");
const resumeBtn = document.getElementById("resumeBtn");
const backToMenuBtn = document.getElementById("backToMenuBtn");
const restartRunBtn = document.getElementById("restartRunBtn");

const confirmRestartBox = document.getElementById("confirmRestartBox");
const confirmRestartBtn = document.getElementById("confirmRestartBtn");
const cancelRestartBtn = document.getElementById("cancelRestartBtn");

const menuMusicToggle = document.getElementById("menuMusicToggle");
const menuMusicVolume = document.getElementById("menuMusicVolume");
const menuSfxToggle = document.getElementById("menuSfxToggle");
const menuSfxVolume = document.getElementById("menuSfxVolume");

const pauseMusicToggle = document.getElementById("pauseMusicToggle");
const pauseMusicVolume = document.getElementById("pauseMusicVolume");
const pauseSfxToggle = document.getElementById("pauseSfxToggle");
const pauseSfxVolume = document.getElementById("pauseSfxVolume");

const speedBtn = document.getElementById("speedBtn");
const autoModeBtn = document.getElementById("autoModeBtn");

let gameStarted = false;
let gameRunning = false;
let waveInProgress = false;
let loopStarted = false;

let isPaused = false;
let hasActiveRun = false;
let isInMainMenu = true;

let isMouseDown = false;
let isSpaceDown = false;

let gameSpeed = 1;
let speedOptions = [1, 2, 2.5];
let speedIndex = 0;

let autoMode = false;

let gameTime = 0;
let lastFrameTime = performance.now();

let bestScore = Number(localStorage.getItem("towerDefenseBestScore")) || 0;

let wave;
let coins;
let score;
let player;
let barricade;
let towers;
let abilities;
let costs;
let enemies;
let projectiles;
let slowZones;
let damageTexts;
let particles;
let effects;

let enemiesToSpawn;
let enemiesSpawned;
let spawnInterval;
let lastSpawnTime;

let redFlashAlpha = 0;

let waveStats;

let mousePosition = {
    x: canvas.width / 2,
    y: canvas.height / 2
};

const barricadeTiers = [
    { name: "Madera", color: "#8b5a2b", hpBonus: 25 },
    { name: "Roca", color: "#777777", hpBonus: 40 },
    { name: "Metal", color: "#a9b4bd", hpBonus: 60 },
    { name: "Cristal", color: "#7ee7ff", hpBonus: 85 },
    { name: "Obsidiana", color: "#302038", hpBonus: 120 }
];

const enemyTypes = [
    {
        name: "Bicho Verde",
        color: "limegreen",
        hp: 1,
        speed: 0.82,
        reward: 3,
        score: 5,
        damageToDefense: 1,
        attackDelay: 900
    },
    {
        name: "Bicho Azul",
        color: "dodgerblue",
        hp: 3,
        speed: 0.68,
        reward: 5,
        score: 9,
        damageToDefense: 1,
        attackDelay: 1000
    },
    {
        name: "Bicho Rojo",
        color: "crimson",
        hp: 2,
        speed: 1.15,
        reward: 6,
        score: 11,
        damageToDefense: 1,
        attackDelay: 850
    },
    {
        name: "Bicho Amarillo",
        color: "gold",
        hp: 5,
        speed: 0.58,
        reward: 9,
        score: 17,
        damageToDefense: 2,
        attackDelay: 1050
    },
    {
        name: "Bicho Violeta",
        color: "violet",
        hp: 8,
        speed: 0.45,
        reward: 13,
        score: 25,
        damageToDefense: 3,
        attackDelay: 1200
    }
];

const bossType = {
    name: "Jefe",
    color: "#ff7b00",
    hp: 55,
    speed: 0.32,
    reward: 55,
    score: 160,
    damageToDefense: 4,
    attackDelay: 1300
};

function createDefaultState() {
    wave = 1;
    coins = 0;
    score = 0;

    player = {
        x: 80,
        y: canvas.height / 2,
        damage: 1,
        fireDelay: 550,
        lastShotTime: 0,
        maxHp: 20,
        hp: 20,
        critChance: 0,
        critMultiplier: 2

    };
    gameSpeed = 1;
    speedIndex = 0;
    autoMode = false;

    if (speedBtn) speedBtn.textContent = "Velocidad x1";

    if (autoModeBtn) {
        autoModeBtn.textContent = "Auto OFF";
        autoModeBtn.classList.remove("autoActive");
    }
    barricade = {
        active: false,
        x: 120,
        tier: -1,
        maxHp: 0,
        hp: 0,
        color: "#8b5a2b"
    };

    towers = [
        {
            id: 1,
            name: "Básica",
            owned: false,
            x: 210,
            y: 150,
            level: 0,
            damage: 1,
            range: 230,
            fireDelay: 900,
            lastShotTime: 0,
            color: "cyan",
            type: "basic"
        },
        {
            id: 2,
            name: "Perforante",
            owned: false,
            x: 210,
            y: 230,
            level: 0,
            damage: 3,
            range: 250,
            fireDelay: 1200,
            lastShotTime: 0,
            color: "#ffdf6b",
            type: "pierce"
        },
        {
            id: 3,
            name: "Hielo",
            owned: false,
            x: 210,
            y: 310,
            level: 0,
            damage: 0,
            range: 260,
            fireDelay: 2600,
            lastShotTime: 0,
            color: "#9be7ff",
            type: "slow",
            slowAmount: 0.45,
            slowDuration: 1600,
            areaRadius: 58
        }
    ];

    abilities = {
        bomb: {
            name: "Bomba",
            key: "Q",
            owned: false,
            cost: 180,
            cooldown: 8000,
            lastUsed: -Infinity
        },
        freeze: {
            name: "Congelar",
            key: "W",
            owned: false,
            cost: 280,
            cooldown: 14000,
            lastUsed: -Infinity
        },
        tsunami: {
            name: "Tsunami",
            key: "E",
            owned: false,
            cost: 430,
            cooldown: 18000,
            lastUsed: -Infinity
        },
        lightning: {
            name: "Rayo",
            key: "R",
            owned: false,
            cost: 650,
            cooldown: 22000,
            lastUsed: -Infinity
        },
        meteor: {
            name: "Meteorito",
            key: "F",
            owned: false,
            cost: 950,
            cooldown: 30000,
            lastUsed: -Infinity
        }
    };

    costs = {
        damage: 35,
        fireRate: 50,
        maxHp: 80,
        crit: 120,

        smallPotion: 15,
        mediumPotion: 35,
        largePotion: 70,
        repairBarricade: 45,
        upgradeBarricade: 100,

        tower1: 70,
        tower1Upgrade: 100,
        tower2: 160,
        tower2Upgrade: 180,
        tower3: 220,
        tower3Upgrade: 240
    };

    enemies = [];
    projectiles = [];
    slowZones = [];
    damageTexts = [];
    particles = [];
    effects = [];

    enemiesToSpawn = 0;
    enemiesSpawned = 0;
    spawnInterval = 900;
    lastSpawnTime = 0;

    resetWaveStats();
}

function resetWaveStats() {
    waveStats = {
        kills: 0,
        gold: 0,
        score: 0,
        bonus: 0
    };
}

function startGame() {
    enableSound();

    gameStarted = true;
    isInMainMenu = false;

    menu.classList.add("hidden");
    gameArea.classList.remove("hidden");

    if (!hasActiveRun) {
        createDefaultState();
        hasActiveRun = true;
        startWave();
    } else {
        isPaused = false;
        pausePanel.classList.add("hidden");

        if (waveInProgress) {
            gameRunning = true;
        }

        syncMusicState();
    }

    if (!loopStarted) {
        loopStarted = true;
        gameLoop();
    }

    updateHud();
}

function startWave() {
    waveInProgress = true;
    gameRunning = true;

    enemies = [];
    projectiles = [];
    slowZones = [];
    damageTexts = [];
    particles = [];
    effects = [];

    resetWaveStats();

    enemiesToSpawn = getEnemiesAmountForWave();
    enemiesSpawned = 0;

    spawnInterval = Math.max(260, 900 - wave * 16);
    lastSpawnTime = getGameTime();

    shop.classList.add("hidden");
    waveSummaryPanel.classList.add("hidden");
    gameOverScreen.classList.add("hidden");

    if (isBossWave()) {
        showCenterMessage("¡BOSS!", 1800);
    }

    isPaused = false;
    lastFrameTime = performance.now();
    syncMusicState();
    updateHud();
}

function getEnemiesAmountForWave() {
    if (isBossWave()) return 10 + wave * 2;
    return 12 + wave * 4;
}

function isBossWave() {
    return wave % 10 === 0;
}

function getUnlockedEnemyCount() {
    if (wave < 5) return 1;
    if (wave < 10) return 2;
    if (wave < 15) return 2;
    if (wave < 20) return 3;
    if (wave < 25) return 4;
    return 5;
}

function getEnemyTypeForWave() {
    const unlockedTypes = getUnlockedEnemyCount();
    const index = Math.floor(Math.random() * unlockedTypes);
    return enemyTypes[index];
}

function spawnEnemy() {
    if (isBossWave() && enemiesSpawned === enemiesToSpawn - 1) {
        spawnBoss();
        enemiesSpawned++;
        return;
    }

    const type = getEnemyTypeForWave();
    const hpScaling = 1 + wave * 0.13;
    const speedScaling = wave * 0.012;

    enemies.push({
        x: canvas.width + 30,
        y: 70 + Math.random() * (canvas.height - 140),
        radius: 18,
        color: type.color,
        hp: Math.ceil(type.hp * hpScaling),
        maxHp: Math.ceil(type.hp * hpScaling),
        baseSpeed: type.speed + speedScaling,
        speed: type.speed + speedScaling,
        reward: type.reward + Math.floor(wave * 0.45),
        scoreValue: type.score + wave,
        damageToDefense: type.damageToDefense,
        attackDelay: type.attackDelay,
        lastAttackTime: 0,
        isAttacking: false,
        target: null,
        slowUntil: 0,
        slowMultiplier: 1,
        hitFlash: 0,
        knockbackX: 0,
        isBoss: false,
        name: type.name
    });

    enemiesSpawned++;
}

function spawnBoss() {
    const hpScaling = 1 + wave * 0.22;

    enemies.push({
        x: canvas.width + 70,
        y: canvas.height / 2,
        radius: 42,
        color: bossType.color,
        hp: Math.ceil(bossType.hp * hpScaling),
        maxHp: Math.ceil(bossType.hp * hpScaling),
        baseSpeed: bossType.speed + wave * 0.004,
        speed: bossType.speed + wave * 0.004,
        reward: bossType.reward + wave * 4,
        scoreValue: bossType.score + wave * 12,
        damageToDefense: bossType.damageToDefense,
        attackDelay: bossType.attackDelay,
        lastAttackTime: 0,
        isAttacking: false,
        target: null,
        slowUntil: 0,
        slowMultiplier: 1,
        hitFlash: 0,
        knockbackX: 0,
        isBoss: true,
        name: bossType.name
    });
}

function shoot(targetX, targetY, owner = "player", tower = null) {
    const now = getGameTime();

    if (owner === "player") {
        if (now - player.lastShotTime < player.fireDelay) return;

        player.lastShotTime = now;
        playShootSound();
        const angle = Math.atan2(targetY - player.y, targetX - player.x);
        const isCrit = Math.random() < player.critChance;
        const damage = isCrit ? player.damage * player.critMultiplier : player.damage;

        projectiles.push({
            x: player.x,
            y: player.y,
            radius: 6,
            speed: 7,
            damage,
            isCrit,
            dx: Math.cos(angle),
            dy: Math.sin(angle),
            color: isCrit ? "#ffe28a" : "white",
            type: "normal",
            hitsLeft: 1,
            hitEnemies: []
        });
    }

    if (owner === "tower") {
        if (!tower || !tower.owned) return;
        if (now - tower.lastShotTime < tower.fireDelay) return;

        tower.lastShotTime = now;
        playShootSound();

        const angle = Math.atan2(targetY - tower.y, targetX - tower.x);

        if (tower.type === "basic") {
            projectiles.push({
                x: tower.x,
                y: tower.y,
                radius: 5,
                speed: 6.5,
                damage: tower.damage,
                isCrit: false,
                dx: Math.cos(angle),
                dy: Math.sin(angle),
                color: tower.color,
                type: "normal",
                hitsLeft: 1,
                hitEnemies: []
            });
        }

        if (tower.type === "pierce") {
            projectiles.push({
                x: tower.x,
                y: tower.y,
                radius: 6,
                speed: 7,
                damage: tower.damage,
                isCrit: false,
                dx: Math.cos(angle),
                dy: Math.sin(angle),
                color: tower.color,
                type: "pierce",
                hitsLeft: 2,
                hitEnemies: []
            });
        }

        if (tower.type === "slow") {
            projectiles.push({
                x: tower.x,
                y: tower.y,
                radius: 7,
                speed: 5.5,
                damage: 0,
                isCrit: false,
                dx: Math.cos(angle),
                dy: Math.sin(angle),
                color: tower.color,
                type: "slow",
                hitsLeft: 1,
                hitEnemies: [],
                slowAmount: tower.slowAmount,
                slowDuration: tower.slowDuration,
                areaRadius: tower.areaRadius
            });
        }
    }
}

function autoShootPlayer() {
    if (!isMouseDown && !isSpaceDown) return;
    shoot(mousePosition.x, mousePosition.y, "player");
}

function updateTowers() {
    towers.forEach(tower => {
        if (!tower.owned) return;

        let closestEnemy = null;
        let closestDistance = Infinity;

        enemies.forEach(enemy => {
            const distance = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);

            if (distance < closestDistance && distance <= tower.range) {
                closestDistance = distance;
                closestEnemy = enemy;
            }
        });

        if (closestEnemy) {
            shoot(closestEnemy.x, closestEnemy.y, "tower", tower);
        }
    });
}

function getDefenseLineX() {
    if (barricade.active && barricade.hp > 0) return barricade.x;
    return 35;
}

function updateEnemies() {
    const now = getGameTime();
    const defenseLineX = getDefenseLineX();

    enemies.forEach(enemy => {
        if (enemy.slowUntil > now) {
            enemy.speed = enemy.baseSpeed * enemy.slowMultiplier;
        } else {
            enemy.speed = enemy.baseSpeed;
            enemy.slowMultiplier = 1;
        }

        if (enemy.hitFlash > 0) enemy.hitFlash -= 0.08;
        if (enemy.knockbackX > 0) {
            enemy.x += enemy.knockbackX * gameSpeed;
            enemy.knockbackX *= 0.75;
            if (enemy.knockbackX < 0.1) enemy.knockbackX = 0;
        }
    });

    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        const hasReachedDefense = enemy.x - enemy.radius <= defenseLineX;

        if (!hasReachedDefense) {
            enemy.x -= enemy.speed * gameSpeed;
            enemy.isAttacking = false;
            enemy.target = null;
            continue;
        }

        enemy.isAttacking = true;

        if (barricade.active && barricade.hp > 0) {
            enemy.target = "barricade";

            if (now - enemy.lastAttackTime >= enemy.attackDelay) {
                barricade.hp -= enemy.damageToDefense;
                enemy.lastAttackTime = now;
                createImpactParticles(barricade.x, enemy.y, "#d6a05f");

                if (barricade.hp <= 0) {
                    barricade.hp = 0;
                    barricade.active = false;
                    showCenterMessage("¡Barricada rota!", 1000);
                }
            }
        } else {
            enemy.target = "base";

            if (now - enemy.lastAttackTime >= enemy.attackDelay) {
                player.hp -= enemy.damageToDefense;
                enemy.lastAttackTime = now;
                triggerRedFlash();
                createImpactParticles(35, enemy.y, "#ff4444");

                if (player.hp <= 0) {
                    player.hp = 0;
                    endRun();
                    return;
                }
            }
        }
    }
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];

        p.x += p.dx * p.speed * gameSpeed;
        p.y += p.dy * p.speed * gameSpeed;

        if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
            projectiles.splice(i, 1);
            continue;
        }

        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];

            if (p.hitEnemies.includes(e)) continue;

            const dist = Math.hypot(p.x - e.x, p.y - e.y);

            if (dist < p.radius + e.radius) {
                if (p.type === "slow") {
                    createSlowZone(p.x, p.y, p.areaRadius, p.slowAmount, p.slowDuration);
                    createImpactParticles(p.x, p.y, p.color);
                    projectiles.splice(i, 1);
                    break;
                }

                let finalDamage = p.damage;

                if (p.type === "pierce" && p.hitsLeft === 1) {
                    finalDamage = p.damage * 0.5;
                }

                damageEnemy(e, finalDamage, p.isCrit);
                createImpactParticles(p.x, p.y, p.color);

                p.hitEnemies.push(e);
                p.hitsLeft--;

                if (e.hp <= 0) {
                    killEnemy(j);
                }

                if (p.hitsLeft <= 0) {
                    projectiles.splice(i, 1);
                }

                break;
            }
        }
    }
}

function damageEnemy(enemy, amount, isCrit = false) {
    enemy.hp -= amount;
    enemy.hitFlash = 1;

    playHitSound();

    addDamageText(enemy.x, enemy.y - enemy.radius, amount, isCrit);
}

function killEnemy(index) {
    const enemy = enemies[index];

    coins += enemy.reward;
    score += enemy.scoreValue;

    waveStats.kills++;
    waveStats.gold += enemy.reward;
    waveStats.score += enemy.scoreValue;

    createDeathExplosion(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 28 : 14);

    enemies.splice(index, 1);
}

function createSlowZone(x, y, radius, slowAmount, duration) {
    const now = getGameTime();

    slowZones.push({
        x,
        y,
        radius,
        createdAt: now,
        expiresAt: now + duration,
        slowAmount
    });

    enemies.forEach(enemy => {
        const dist = Math.hypot(enemy.x - x, enemy.y - y);

        if (dist <= radius) {
            enemy.slowMultiplier = slowAmount;
            enemy.slowUntil = now + duration;
        }
    });
}

function updateSlowZones() {
    const now = getGameTime();

    for (let i = slowZones.length - 1; i >= 0; i--) {
        if (slowZones[i].expiresAt <= now) {
            slowZones.splice(i, 1);
        }
    }
}

function addDamageText(x, y, amount, isCrit = false) {
    damageTexts.push({
        x,
        y,
        text: isCrit ? `CRIT ${Math.round(amount)}` : `${Math.round(amount)}`,
        life: 60,
        color: isCrit ? "#ffe28a" : "white",
        size: isCrit ? 22 : 15
    });
}

function createImpactParticles(x, y, color) {
    for (let i = 0; i < 5; i++) {
        particles.push({
            x,
            y,
            dx: (Math.random() - 0.5) * 3,
            dy: (Math.random() - 0.5) * 3,
            radius: 2 + Math.random() * 2,
            life: 24,
            color
        });
    }
}

function createDeathExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x,
            y,
            dx: (Math.random() - 0.5) * 5,
            dy: (Math.random() - 0.5) * 5,
            radius: 2 + Math.random() * 3,
            life: 36,
            color
        });
    }

    effects.push({
        type: "circle",
        x,
        y,
        radius: 8,
        maxRadius: count > 20 ? 90 : 42,
        life: 26,
        color
    });
}

function updateVisualEffects() {
    for (let i = damageTexts.length - 1; i >= 0; i--) {
        const t = damageTexts[i];
        t.y -= 0.7;
        t.life--;

        if (t.life <= 0) damageTexts.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.life--;

        if (p.life <= 0) particles.splice(i, 1);
    }

    for (let i = effects.length - 1; i >= 0; i--) {
        const e = effects[i];
        e.life--;

        if (e.type === "circle") {
            e.radius += (e.maxRadius - e.radius) * 0.18;
        }

        if (e.type === "tsunami") {
            e.x += 16 * gameSpeed;
        }

        if (e.life <= 0) effects.splice(i, 1);
    }

    if (redFlashAlpha > 0) {
        redFlashAlpha -= 0.04;
        if (redFlashAlpha < 0) redFlashAlpha = 0;
    }

    redFlash.style.background = `rgba(255, 0, 0, ${redFlashAlpha})`;
}

function triggerRedFlash() {
    redFlashAlpha = 0.35;
}

function showCenterMessage(text, duration) {
    centerMessage.textContent = text;
    centerMessage.classList.remove("hidden");

    setTimeout(() => {
        centerMessage.classList.add("hidden");
    }, duration);
}

function checkWaveComplete() {
    if (
        enemiesSpawned >= enemiesToSpawn &&
        enemies.length === 0 &&
        waveInProgress
    ) {
        completeWave();
    }
}

function completeWave() {
    waveInProgress = false;
    gameRunning = false;

    const waveBonus = wave * 20;
    const goldBonus = 8 + Math.floor(wave * 1.5);

    score += waveBonus;
    coins += goldBonus;

    waveStats.score += waveBonus;
    waveStats.gold += goldBonus;
    waveStats.bonus = waveBonus;

    if (autoMode) {
        showCenterMessage(`Wave ${wave} completada`, 700);

        setTimeout(() => {
            if (!autoMode) {
                showWaveSummary();
                return;
            }

            if (!hasActiveRun) return;

            wave++;
            startWave();
        }, 900);

        return;
    }

    showWaveSummary();
}

function showWaveSummary() {
    syncMusicState();
    summaryKillsText.textContent = waveStats.kills;
    summaryGoldText.textContent = waveStats.gold;
    summaryScoreText.textContent = waveStats.score;
    summaryHpText.textContent = `${Math.round(player.hp)}/${player.maxHp}`;
    summaryBarricadeText.textContent = `${Math.round(barricade.hp)}/${barricade.maxHp}`;
    summaryBonusText.textContent = waveStats.bonus;

    waveSummaryPanel.classList.remove("hidden");
}

function endRun() {
    stopMusicAndReset();
    hasActiveRun = false;
    isPaused = false;
    gameRunning = false;
    waveInProgress = false;

    enemies = [];
    projectiles = [];
    slowZones = [];

    const isNewRecord = score > bestScore;

    if (isNewRecord) {
        bestScore = score;
        localStorage.setItem("towerDefenseBestScore", bestScore);
        deathMessageText.textContent = "¡Nuevo récord! La base cayó, pero esta run fue la mejor hasta ahora.";
    } else {
        deathMessageText.textContent = "Tu base cayó. La run terminó y el progreso se reinició.";
    }

    finalScoreText.textContent = score;
    bestScoreText.textContent = bestScore;
    bestScoreMenuText.textContent = bestScore;

    gameOverScreen.classList.remove("hidden");
    shop.classList.add("hidden");
    waveSummaryPanel.classList.add("hidden");

    updateHud();
}

function healOverTime(totalHeal, durationMs) {
    const ticks = 10;
    const healPerTick = totalHeal / ticks;
    const tickDuration = durationMs / ticks;
    let currentTick = 0;

    const interval = setInterval(() => {
        if (!gameStarted || !player) {
            clearInterval(interval);
            return;
        }

        if (player.hp >= player.maxHp) {
            clearInterval(interval);
            return;
        }

        player.hp = Math.min(player.maxHp, player.hp + healPerTick);
        player.hp = Math.round(player.hp);

        currentTick++;

        if (currentTick >= ticks) clearInterval(interval);

        updateHud();
    }, tickDuration);
}

function useAbility(id) {
    if (!gameRunning || !waveInProgress) return;

    const ability = abilities[id];
    if (!ability || !ability.owned) return;

    const now = getGameTime();

    if (now - ability.lastUsed < ability.cooldown) return;

    ability.lastUsed = now;

    if (id === "bomb") useBomb();
    if (id === "freeze") useFreeze();
    if (id === "tsunami") useTsunami();
    if (id === "lightning") useLightning();
    if (id === "meteor") useMeteor();

    updateHud();
}

function useBomb() {
    const radius = 78;
    const damage = 12 + wave * 0.8;

    effects.push({
        type: "circle",
        x: mousePosition.x,
        y: mousePosition.y,
        radius: 10,
        maxRadius: radius,
        life: 24,
        color: "#ff5555"
    });

    damageEnemiesInArea(mousePosition.x, mousePosition.y, radius, damage, false);
}

function useFreeze() {
    const now = getGameTime();

    enemies.forEach(enemy => {
        enemy.slowMultiplier = 0.25;
        enemy.slowUntil = now + 3500;
    });

    effects.push({
        type: "circle",
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 20,
        maxRadius: 480,
        life: 35,
        color: "#9be7ff"
    });

    showCenterMessage("¡CONGELAR!", 900);
}

function useTsunami() {
    const damage = 9 + wave * 0.7;

    enemies.forEach(enemy => {
        enemy.x += enemy.isBoss ? 35 : 85;
        damageEnemy(enemy, damage, false);
    });

    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].hp <= 0) killEnemy(i);
    }

    effects.push({
        type: "tsunami",
        x: -80,
        y: 0,
        width: 80,
        height: canvas.height,
        life: 70,
        color: "#4aa3ff"
    });

    showCenterMessage("¡TSUNAMI!", 900);
}

function useLightning() {
    if (enemies.length === 0) return;

    const chains = [];
    let current = findClosestEnemy(mousePosition.x, mousePosition.y, Infinity);
    let damage = 20 + wave * 0.9;

    for (let i = 0; i < 4; i++) {
        if (!current) break;

        chains.push(current);
        damageEnemy(current, damage, true);

        const next = findClosestEnemy(current.x, current.y, 150, chains);
        current = next;
        damage *= 0.75;
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].hp <= 0) killEnemy(i);
    }

    for (let i = 0; i < chains.length - 1; i++) {
        effects.push({
            type: "line",
            x1: chains[i].x,
            y1: chains[i].y,
            x2: chains[i + 1].x,
            y2: chains[i + 1].y,
            life: 14,
            color: "#f7ff61"
        });
    }

    if (chains.length > 0) {
        effects.push({
            type: "line",
            x1: mousePosition.x,
            y1: mousePosition.y,
            x2: chains[0].x,
            y2: chains[0].y,
            life: 14,
            color: "#f7ff61"
        });
    }
}

function useMeteor() {
    const radius = 112;
    const damage = 42 + wave * 1.3;

    effects.push({
        type: "circle",
        x: mousePosition.x,
        y: mousePosition.y,
        radius: 12,
        maxRadius: radius,
        life: 34,
        color: "#ff8d2a"
    });

    damageEnemiesInArea(mousePosition.x, mousePosition.y, radius, damage, true);
    showCenterMessage("¡METEORITO!", 900);
}

function damageEnemiesInArea(x, y, radius, damage, critText) {
    enemies.forEach(enemy => {
        const dist = Math.hypot(enemy.x - x, enemy.y - y);

        if (dist <= radius) {
            damageEnemy(enemy, damage, critText);
            enemy.knockbackX += enemy.isBoss ? 8 : 18;
        }
    });

    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].hp <= 0) killEnemy(i);
    }
}

function findClosestEnemy(x, y, maxDistance = Infinity, ignored = []) {
    let closest = null;
    let closestDistance = Infinity;

    enemies.forEach(enemy => {
        if (ignored.includes(enemy)) return;

        const distance = Math.hypot(enemy.x - x, enemy.y - y);

        if (distance < closestDistance && distance <= maxDistance) {
            closestDistance = distance;
            closest = enemy;
        }
    });

    return closest;
}

function drawPath() {
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 40;
    ctx.beginPath();
    ctx.moveTo(canvas.width, canvas.height / 2);
    ctx.lineTo(0, canvas.height / 2);
    ctx.stroke();
}

function drawBase() {
    ctx.fillStyle = "#444";
    ctx.fillRect(0, 0, 35, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("BASE", 3, 25);
}

function drawBarricade() {
    if (!barricade.active || barricade.hp <= 0) return;

    ctx.fillStyle = barricade.color;
    ctx.fillRect(barricade.x - 10, 45, 20, canvas.height - 90);

    const barHeight = canvas.height - 90;
    const hpPercent = barricade.hp / barricade.maxHp;

    ctx.fillStyle = "red";
    ctx.fillRect(barricade.x + 18, 45, 8, barHeight);

    ctx.fillStyle = "lime";
    ctx.fillRect(
        barricade.x + 18,
        45 + barHeight * (1 - hpPercent),
        8,
        barHeight * hpPercent
    );
}

function drawPlayer() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(player.x, player.y, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "black";
    ctx.font = "14px Arial";
    ctx.fillText("P", player.x - 5, player.y + 5);
}

function drawTowers() {
    towers.forEach(tower => {
        if (!tower.owned) return;

        ctx.fillStyle = tower.color;
        ctx.fillRect(tower.x - 18, tower.y - 18, 36, 36);

        ctx.fillStyle = "black";
        ctx.font = "14px Arial";

        if (tower.type === "basic") ctx.fillText("T1", tower.x - 8, tower.y + 5);
        if (tower.type === "pierce") ctx.fillText("T2", tower.x - 8, tower.y + 5);
        if (tower.type === "slow") ctx.fillText("T3", tower.x - 8, tower.y + 5);

        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        ctx.stroke();
    });
}

function drawSlowZones() {
    slowZones.forEach(zone => {
        ctx.fillStyle = "rgba(155, 231, 255, 0.18)";
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(155, 231, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
        ctx.stroke();
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        let radius = enemy.radius;

        if (enemy.hitFlash > 0) {
            radius += 3;
            ctx.fillStyle = "white";
        } else {
            ctx.fillStyle = enemy.color;
        }

        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, radius, 0, Math.PI * 2);
        ctx.fill();

        if (enemy.isBoss) {
            ctx.fillStyle = "white";
            ctx.font = "16px Arial";
            ctx.fillText("BOSS", enemy.x - 22, enemy.y + 5);
        }

        if (enemy.isAttacking) {
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius + 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        const hpBarWidth = enemy.isBoss ? 80 : 40;
        const hpPercent = enemy.hp / enemy.maxHp;

        ctx.fillStyle = "red";
        ctx.fillRect(enemy.x - hpBarWidth / 2, enemy.y - enemy.radius - 14, hpBarWidth, 6);

        ctx.fillStyle = "lime";
        ctx.fillRect(
            enemy.x - hpBarWidth / 2,
            enemy.y - enemy.radius - 14,
            hpBarWidth * hpPercent,
            6
        );
    });
}

function drawProjectiles() {
    projectiles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawVisualEffects() {
    effects.forEach(e => {
        if (e.type === "circle") {
            ctx.strokeStyle = e.color;
            ctx.globalAlpha = Math.max(0, e.life / 34);
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        if (e.type === "tsunami") {
            ctx.fillStyle = "rgba(74, 163, 255, 0.35)";
            ctx.fillRect(e.x, e.y, e.width, e.height);
        }

        if (e.type === "line") {
            ctx.strokeStyle = e.color;
            ctx.globalAlpha = Math.max(0, e.life / 14);
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(e.x1, e.y1);
            ctx.lineTo(e.x2, e.y2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    });

    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.life / 36);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    damageTexts.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.font = `bold ${t.size}px Arial`;
        ctx.fillText(t.text, t.x, t.y);
    });
}

function drawAimLine() {
    if (!waveInProgress) return;

    ctx.strokeStyle = "rgba(255,255,255,0.20)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(mousePosition.x, mousePosition.y);
    ctx.stroke();
}

function updateBossBar() {
    const boss = enemies.find(enemy => enemy.isBoss);

    if (!boss || !waveInProgress) {
        bossBarBox.classList.add("hidden");
        return;
    }

    bossBarBox.classList.remove("hidden");
    bossNameText.textContent = boss.name;
    bossBarFill.style.width = `${Math.max(0, boss.hp / boss.maxHp) * 100}%`;
}

function updateHud() {
    waveText.textContent = wave;
    hpText.textContent = `${Math.round(player.hp)}/${player.maxHp}`;
    barricadeText.textContent = `${Math.round(barricade.hp)}/${barricade.maxHp}`;
    coinsText.textContent = coins;
    scoreText.textContent = score;

    playerDamageText.textContent = player.damage;
    playerFireDelayText.textContent = player.fireDelay;
    playerMaxHpText.textContent = player.maxHp;
    critChanceText.textContent = Math.round(player.critChance * 100);

    damageCostText.textContent = costs.damage;
    fireRateCostText.textContent = costs.fireRate;
    maxHpCostText.textContent = costs.maxHp;
    critCostText.textContent = costs.crit;

    smallPotionCostText.textContent = costs.smallPotion;
    mediumPotionCostText.textContent = costs.mediumPotion;
    largePotionCostText.textContent = costs.largePotion;
    repairBarricadeCostText.textContent = costs.repairBarricade;
    upgradeBarricadeCostText.textContent = costs.upgradeBarricade;

    if (barricade.tier < 0) {
        barricadeTierText.textContent = "Sin barricada";
    } else {
        barricadeTierText.textContent = barricadeTiers[barricade.tier].name;
    }

    tower1CostText.textContent = costs.tower1;
    tower1UpgradeCostText.textContent = costs.tower1Upgrade;
    tower1LevelText.textContent = towers[0].level;

    tower2CostText.textContent = costs.tower2;
    tower2UpgradeCostText.textContent = costs.tower2Upgrade;
    tower2LevelText.textContent = towers[1].level;

    tower3CostText.textContent = costs.tower3;
    tower3UpgradeCostText.textContent = costs.tower3Upgrade;
    tower3LevelText.textContent = towers[2].level;

    bombCostText.textContent = abilities.bomb.cost;
    freezeCostText.textContent = abilities.freeze.cost;
    tsunamiCostText.textContent = abilities.tsunami.cost;
    lightningCostText.textContent = abilities.lightning.cost;
    meteorCostText.textContent = abilities.meteor.cost;

    updateTowerShopVisibility();
    updateAbilityShopVisibility();
    updateAbilityBar();
    updateBossBar();
}

function updateTowerShopVisibility() {
    toggleBuyUpgrade(towers[0], tower1BuyBox, tower1UpgradeBox);
    toggleBuyUpgrade(towers[1], tower2BuyBox, tower2UpgradeBox);
    toggleBuyUpgrade(towers[2], tower3BuyBox, tower3UpgradeBox);
}

function toggleBuyUpgrade(tower, buyBox, upgradeBox) {
    if (tower.owned) {
        buyBox.classList.add("hidden");
        upgradeBox.classList.remove("hidden");
    } else {
        buyBox.classList.remove("hidden");
        upgradeBox.classList.add("hidden");
    }
}

function updateAbilityShopVisibility() {
    buyBombBtn.disabled = abilities.bomb.owned;
    buyFreezeBtn.disabled = abilities.freeze.owned;
    buyTsunamiBtn.disabled = abilities.tsunami.owned;
    buyLightningBtn.disabled = abilities.lightning.owned;
    buyMeteorBtn.disabled = abilities.meteor.owned;

    if (abilities.bomb.owned) buyBombBtn.innerHTML = "Bomba comprada<br><small>Q para usar</small>";
    if (abilities.freeze.owned) buyFreezeBtn.innerHTML = "Congelar comprado<br><small>W para usar</small>";
    if (abilities.tsunami.owned) buyTsunamiBtn.innerHTML = "Tsunami comprado<br><small>E para usar</small>";
    if (abilities.lightning.owned) buyLightningBtn.innerHTML = "Rayo comprado<br><small>R para usar</small>";
    if (abilities.meteor.owned) buyMeteorBtn.innerHTML = "Meteorito comprado<br><small>F para usar</small>";
}

function updateAbilityBar() {
    const now = getGameTime();

    Object.keys(abilities).forEach(id => {
        const ability = abilities[id];
        const slot = abilitySlots[id];

        slot.classList.remove("locked", "ready", "cooldown");

        if (!ability.owned) {
            slot.classList.add("locked");
            slot.textContent = `${ability.key} · ${ability.name} bloqueada`;
            return;
        }

        const remaining = ability.cooldown - (now - ability.lastUsed);

        if (remaining > 0) {
            slot.classList.add("cooldown");
            slot.textContent = `${ability.key} · ${ability.name} ${Math.ceil(remaining / 1000)}s`;
        } else {
            slot.classList.add("ready");
            slot.textContent = `${ability.key} · ${ability.name} lista`;
        }
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawPath();
    drawBase();
    drawBarricade();
    drawPlayer();
    drawTowers();
    drawAimLine();
    drawSlowZones();
    drawEnemies();
    drawProjectiles();
    drawVisualEffects();
}

function gameLoop() {
    const realNow = performance.now();
    const delta = realNow - lastFrameTime;
    lastFrameTime = realNow;

    if (gameStarted && gameRunning && waveInProgress && !isPaused && !document.hidden) {
        gameTime += delta * gameSpeed;
    }

    if (!gameStarted) {
        requestAnimationFrame(gameLoop);
        return;
    }

    const now = getGameTime();

    if (gameRunning && waveInProgress && !isPaused) {
        if (enemiesSpawned < enemiesToSpawn && now - lastSpawnTime > spawnInterval) {
            spawnEnemy();
            lastSpawnTime = now;
        }

        autoShootPlayer();
        updateTowers();
        updateEnemies();
        updateProjectiles();
        updateSlowZones();
        checkWaveComplete();
    }

    updateVisualEffects();
    updateHud();
    draw();

    requestAnimationFrame(gameLoop);
}

function updateMousePosition(event) {
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    mousePosition.x = (event.clientX - rect.left) * scaleX;
    mousePosition.y = (event.clientY - rect.top) * scaleY;
}

canvas.addEventListener("mousemove", event => {
    updateMousePosition(event);
});

canvas.addEventListener("mousedown", event => {
    isMouseDown = true;
    updateMousePosition(event);
});

window.addEventListener("mouseup", () => {
    isMouseDown = false;
});

window.addEventListener("keydown", event => {
    if (event.code === "Space") {
        event.preventDefault();
        isSpaceDown = true;
    }

    if (event.code === "Escape") {
        if (isPaused) {
            resumeGame();
        } else {
            pauseGame();

        }
    }

    if (event.code === "KeyQ") useAbility("bomb");
    if (event.code === "KeyW") useAbility("freeze");
    if (event.code === "KeyE") useAbility("tsunami");
    if (event.code === "KeyR") useAbility("lightning");
    if (event.code === "KeyF") useAbility("meteor");
});

window.addEventListener("keyup", event => {
    if (event.code === "Space") {
        event.preventDefault();
        isSpaceDown = false;
    }
});

startGameBtn.addEventListener("click", startGame);

openShopBtn.addEventListener("click", () => {
    waveSummaryPanel.classList.add("hidden");
    shop.classList.remove("hidden");
    syncMusicState();
});

newRunBtn.addEventListener("click", () => {
    createDefaultState();
    hasActiveRun = true;
    startWave();
});

upgradeDamageBtn.addEventListener("click", () => {
    if (coins >= costs.damage) {
        coins -= costs.damage;
        player.damage += 1;
        costs.damage = Math.floor(costs.damage * 1.75);
        updateHud();
    }
});

upgradeFireRateBtn.addEventListener("click", () => {
    if (coins >= costs.fireRate) {
        coins -= costs.fireRate;
        player.fireDelay = Math.max(160, player.fireDelay - 40);
        costs.fireRate = Math.floor(costs.fireRate * 1.8);
        updateHud();
    }
});

upgradeMaxHpBtn.addEventListener("click", () => {
    if (coins >= costs.maxHp) {
        coins -= costs.maxHp;
        player.maxHp += 5;
        player.hp += 5;
        costs.maxHp = Math.floor(costs.maxHp * 1.7);
        updateHud();
    }
});

upgradeCritBtn.addEventListener("click", () => {
    if (coins >= costs.crit) {
        coins -= costs.crit;
        player.critChance = Math.min(0.6, player.critChance + 0.05);
        costs.crit = Math.floor(costs.crit * 1.85);
        updateHud();
    }
});

buySmallPotionBtn.addEventListener("click", () => {
    if (coins >= costs.smallPotion) {
        coins -= costs.smallPotion;
        healOverTime(6, 2500);
        costs.smallPotion = Math.floor(costs.smallPotion * 1.15);
        updateHud();
    }
});

buyMediumPotionBtn.addEventListener("click", () => {
    if (coins >= costs.mediumPotion) {
        coins -= costs.mediumPotion;
        healOverTime(14, 3500);
        costs.mediumPotion = Math.floor(costs.mediumPotion * 1.18);
        updateHud();
    }
});

buyLargePotionBtn.addEventListener("click", () => {
    if (coins >= costs.largePotion) {
        coins -= costs.largePotion;
        healOverTime(30, 5000);
        costs.largePotion = Math.floor(costs.largePotion * 1.22);
        updateHud();
    }
});

repairBarricadeBtn.addEventListener("click", () => {
    if (!barricade.active || barricade.maxHp <= 0) return;

    if (coins >= costs.repairBarricade) {
        coins -= costs.repairBarricade;
        barricade.hp = Math.min(barricade.maxHp, barricade.hp + Math.ceil(barricade.maxHp * 0.45));
        costs.repairBarricade = Math.floor(costs.repairBarricade * 1.25);
        updateHud();
    }
});

upgradeBarricadeBtn.addEventListener("click", () => {
    if (coins < costs.upgradeBarricade) return;

    coins -= costs.upgradeBarricade;

    if (barricade.tier < barricadeTiers.length - 1) {
        barricade.tier++;
    }

    const tier = barricadeTiers[barricade.tier];

    barricade.active = true;
    barricade.color = tier.color;
    barricade.maxHp += tier.hpBonus;
    barricade.hp = barricade.maxHp;

    costs.upgradeBarricade = Math.floor(costs.upgradeBarricade * 1.9);
    updateHud();
});

buyTower1Btn.addEventListener("click", () => buyTower(0, "tower1"));
upgradeTower1Btn.addEventListener("click", () => upgradeTower(0, "tower1Upgrade"));

buyTower2Btn.addEventListener("click", () => buyTower(1, "tower2"));
upgradeTower2Btn.addEventListener("click", () => upgradeTower(1, "tower2Upgrade"));

buyTower3Btn.addEventListener("click", () => buyTower(2, "tower3"));
upgradeTower3Btn.addEventListener("click", () => upgradeTower(2, "tower3Upgrade"));



function buyTower(index, costKey) {
    const tower = towers[index];

    if (tower.owned) return;

    if (coins >= costs[costKey]) {
        coins -= costs[costKey];
        tower.owned = true;
        tower.level = 1;
        updateHud();
    }
}

function upgradeTower(index, costKey) {
    const tower = towers[index];

    if (!tower.owned) return;

    if (coins >= costs[costKey]) {
        coins -= costs[costKey];

        tower.level += 1;

        if (tower.type === "basic") {
            tower.damage += 1;
            tower.range += 10;
            tower.fireDelay = Math.max(300, tower.fireDelay - 50);
            costs[costKey] = Math.floor(costs[costKey] * 1.6);
        }

        if (tower.type === "pierce") {
            tower.damage += 1.5;
            tower.range += 12;
            tower.fireDelay = Math.max(420, tower.fireDelay - 55);
            costs[costKey] = Math.floor(costs[costKey] * 1.65);
        }

        if (tower.type === "slow") {
            tower.range += 14;
            tower.areaRadius += 5;
            tower.slowDuration += 180;
            tower.fireDelay = Math.max(1500, tower.fireDelay - 120);
            costs[costKey] = Math.floor(costs[costKey] * 1.7);
        }

        updateHud();
    }
}

buyBombBtn.addEventListener("click", () => buyAbility("bomb"));
buyFreezeBtn.addEventListener("click", () => buyAbility("freeze"));
buyTsunamiBtn.addEventListener("click", () => buyAbility("tsunami"));
buyLightningBtn.addEventListener("click", () => buyAbility("lightning"));
buyMeteorBtn.addEventListener("click", () => buyAbility("meteor"));

function pauseGame() {
    if (!gameStarted || !hasActiveRun) return;
    if (!waveInProgress) return;

    isPaused = true;
    gameRunning = false;

    pausePanel.classList.remove("hidden");
    confirmRestartBox.classList.add("hidden");

    syncMusicState();
    updateHud();
}

function resumeGame() {
    if (!gameStarted || !hasActiveRun) return;

    isPaused = false;

    if (waveInProgress) {
        gameRunning = true;
    }

    pausePanel.classList.add("hidden");
    confirmRestartBox.classList.add("hidden");

    syncMusicState();
    updateHud();
}

function backToMainMenuWithoutLosingProgress() {
    isPaused = true;
    isInMainMenu = true;
    gameRunning = false;

    pausePanel.classList.add("hidden");
    confirmRestartBox.classList.add("hidden");

    gameArea.classList.add("hidden");
    menu.classList.remove("hidden");

    syncMusicState();
}

function restartRunFromPause() {
    stopMusicAndReset();

    createDefaultState();

    hasActiveRun = true;
    isPaused = false;
    isInMainMenu = false;

    pausePanel.classList.add("hidden");
    confirmRestartBox.classList.add("hidden");

    startWave();
}

function buyAbility(id) {
    const ability = abilities[id];

    if (ability.owned) return;

    if (coins >= ability.cost) {
        coins -= ability.cost;
        ability.owned = true;
        updateHud();
    }
}

pauseBtn.addEventListener("click", pauseGame);

resumeBtn.addEventListener("click", resumeGame);

backToMenuBtn.addEventListener("click", backToMainMenuWithoutLosingProgress);

restartRunBtn.addEventListener("click", () => {
    confirmRestartBox.classList.remove("hidden");
});

cancelRestartBtn.addEventListener("click", () => {
    confirmRestartBox.classList.add("hidden");
});

confirmRestartBtn.addEventListener("click", () => {
    restartRunFromPause();
});

window.addEventListener("blur", () => {
    syncMusicState();
});

document.addEventListener("visibilitychange", () => {
    syncMusicState();
});

function updateMusicEnabled(value) {
    audioSettings.musicEnabled = value;
    saveAudioSettings();
    applyAudioSettingsToUI();
}

function updateSfxEnabled(value) {
    audioSettings.sfxEnabled = value;
    saveAudioSettings();
    applyAudioSettingsToUI();
}

function updateMusicVolume(value) {
    audioSettings.musicVolume = Number(value);
    saveAudioSettings();
    applyAudioSettingsToUI();
}

function updateSfxVolume(value) {
    audioSettings.sfxVolume = Number(value);
    saveAudioSettings();
    applyAudioSettingsToUI();
}

menuMusicToggle.addEventListener("change", () => {
    updateMusicEnabled(menuMusicToggle.checked);
});

pauseMusicToggle.addEventListener("change", () => {
    updateMusicEnabled(pauseMusicToggle.checked);
});

menuSfxToggle.addEventListener("change", () => {
    updateSfxEnabled(menuSfxToggle.checked);
});

pauseSfxToggle.addEventListener("change", () => {
    updateSfxEnabled(pauseSfxToggle.checked);
});

menuMusicVolume.addEventListener("input", () => {
    updateMusicVolume(menuMusicVolume.value);
});

pauseMusicVolume.addEventListener("input", () => {
    updateMusicVolume(pauseMusicVolume.value);
});

menuSfxVolume.addEventListener("input", () => {
    updateSfxVolume(menuSfxVolume.value);
});

pauseSfxVolume.addEventListener("input", () => {
    updateSfxVolume(pauseSfxVolume.value);
});

nextWaveBtn.addEventListener("click", () => {
    wave++;
    startWave();
});

speedBtn.addEventListener("click", () => {
    speedIndex++;

    if (speedIndex >= speedOptions.length) {
        speedIndex = 0;
    }

    gameSpeed = speedOptions[speedIndex];
    speedBtn.textContent = `Velocidad x${gameSpeed}`;
});

autoModeBtn.addEventListener("click", () => {
    autoMode = !autoMode;

    if (autoMode) {
        autoModeBtn.textContent = "Auto ON";
        autoModeBtn.classList.add("autoActive");
    } else {
        autoModeBtn.textContent = "Auto OFF";
        autoModeBtn.classList.remove("autoActive");
    }
});

bestScoreMenuText.textContent = bestScore;
createDefaultState();
applyAudioSettingsToUI();
draw();