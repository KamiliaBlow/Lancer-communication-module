import { LancerCommunicator } from './communicator.js';
import { registerSettings } from './settings.js';
import { registerAPI } from './api.js';

const MODULE_NAME = 'lancer-communicator';

// ─── Инициализация модуля ──────────────────────────────────────

Hooks.once('init', () => {
    console.log('Lancer Communicator | Initializing');
    registerSettings();
    registerAPI();

    // Добавление кнопки в инструменты токенов (v12 + v13)
    Hooks.on('getSceneControlButtons', (controls) => {
        const allowPlayersAccess = game.settings.get(MODULE_NAME, 'allowPlayersAccess');
        if (!game.user.isGM && !allowPlayersAccess) return;

        const isV13 = !foundry.utils.isNewerVersion('13.0.0', game.version);
        const tokenControl = isV13 ? controls.tokens : controls.find(c => c.name === 'token');

        if (!tokenControl?.tools) return;

        const toolConfig = {
            name: 'communicator',
            title: game.i18n.localize('LANCER.Settings.Communicator') || 'Lancer Communicator',
            icon: 'fas fa-satellite-dish',
            visible: true,
            button: true
        };

        if (isV13) {
            tokenControl.tools['communicator'] = {
                ...toolConfig,
                onChange: () => {
                    console.log('Lancer Communicator | Button clicked (v13)');
                    LancerCommunicator.openCommunicatorSettings();
                }
            };
        } else {
            if (!tokenControl.tools.some(t => t.name === 'communicator')) {
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

// ─── Готовность системы ────────────────────────────────────────

Hooks.once('ready', () => {
    console.log('Lancer Communicator | Ready');

    // Применяем CSS-переменные для шрифта из сохранённых настроек
    try {
        const fontSize = game.settings.get(MODULE_NAME, 'messageFontSize') || 14;
        const fontFamily = game.settings.get(MODULE_NAME, 'fontFamily') || 'MOSCOW2024';
        document.documentElement.style.setProperty('--message-font-size', `${fontSize}px`);
        document.documentElement.style.setProperty('--message-font', fontFamily);
    } catch (error) {
        console.error('Lancer Communicator | Error applying CSS settings:', error);
        document.documentElement.style.setProperty('--message-font-size', '14px');
        document.documentElement.style.setProperty('--message-font', 'MOSCOW2024');
    }

    LancerCommunicator.initSocketListeners();
});
