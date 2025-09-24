import { LancerCommunicator } from './communicator.js';
import { registerSettings } from './settings.js';
import { registerAPI } from './api.js';

// Инициализация модуля
Hooks.once('init', () => {
    console.log('Lancer Communicator | Initializing');
    registerSettings();
    registerAPI();

    // === ДОБАВЛЕНИЕ КНОПКИ В ИНСТРУМЕНТЫ ТОКЕНОВ (v12 + v13) ===
    Hooks.on('getSceneControlButtons', (controls) => {
        const allowPlayersAccess = game.settings.get('lancer-communicator', 'allowPlayersAccess');
        if (!game.user.isGM && !allowPlayersAccess) return;

        // Определяем, используется ли Foundry v13+
        const isV13 = !foundry.utils.isNewerVersion("13.0.0", game.version);

        let tokenControl;
        if (isV13) {
            // В v13: controls — это объект, tokens — прямое свойство
            tokenControl = controls.tokens;
        } else {
            // В v12: controls — массив, ищем элемент с name === "token"
            tokenControl = controls.find(c => c.name === "token");
        }

        if (!tokenControl?.tools) return;

        const toolConfig = {
            name: "communicator",
            title: game.i18n.localize("LANCER.Settings.Communicator") || "Lancer Communicator",
            icon: "fas fa-satellite-dish",
            visible: true,
            button: true
        };

        if (isV13) {
            // В v13 инструменты — это объект, ключ — имя инструмента
            tokenControl.tools["communicator"] = {
                ...toolConfig,
                onChange: () => {
                    console.log('Lancer Communicator | Button clicked (v13)');
                    LancerCommunicator.openCommunicatorSettings();
                }
            };
        } else {
            // В v12 инструменты — это массив
            if (!tokenControl.tools.some(t => t.name === "communicator")) {
                tokenControl.tools.push({
                    ...toolConfig,
                    onClick: () => {
                        console.log('Lancer Communicator | Button clicked (v12)');
                        LancerCommunicator.openCommunicatorSettings();
                    }
                });
            }
        }
    });
});

// Готовность системы
Hooks.once('ready', () => {
    console.log('Lancer Communicator | Ready');
    console.log('Lancer Communicator | Localization test:', 
        game.i18n.localize("LANCER.Settings.Communicator"), 
        game.i18n.has("LANCER.Settings.Communicator"));

    try {
        const fontSize = game.settings.get('lancer-communicator', 'messageFontSize') || 14;
        const fontFamily = game.settings.get('lancer-communicator', 'communicatorFont') || 'MOSCOW2024';
        document.documentElement.style.setProperty('--message-font-size', `${fontSize}px`);
        document.documentElement.style.setProperty('--message-font', fontFamily);
    } catch (error) {
        console.error("Lancer Communicator | Error getting settings:", error);
        document.documentElement.style.setProperty('--message-font-size', '14px');
        document.documentElement.style.setProperty('--message-font', 'MOSCOW2024');
    }

    LancerCommunicator.initSocketListeners();
});