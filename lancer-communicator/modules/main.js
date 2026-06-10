import { LancerCommunicator } from './communicator.js';
import { registerSettings } from './settings.js';
import { registerAPI } from './api.js';

const MODULE_NAME = 'lancer-communicator';

/**
 * Выводит отладочное сообщение в консоль, если включен режим дебага
 * @param {string} message - Сообщение для вывода
 * @param {...any} args - Дополнительные аргументы
 */
function debug(message, ...args) {
    const debugMode = game.settings?.get(MODULE_NAME, 'debugMode') ?? false;
    if (debugMode) {
        console.log(`Lancer Communicator | DEBUG | ${message}`, ...args);
    }
}

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
                    debug('Button clicked (v13)');
                    LancerCommunicator.openCommunicatorSettings();
                }
            };
        } else {
            if (!tokenControl.tools.some(t => t.name === 'communicator')) {
                tokenControl.tools.push({
                    ...toolConfig,
                    onClick: () => {
                        debug('Button clicked (v12)');
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
        const messageWidth = game.settings.get(MODULE_NAME, 'globalMessageWidth') || 40;
        const debugMode = game.settings.get(MODULE_NAME, 'debugMode') ?? false;

        document.documentElement.style.setProperty('--message-font-size', `${fontSize}px`);
        document.documentElement.style.setProperty('--message-font', fontFamily);
        document.documentElement.style.setProperty('--message-width', `${messageWidth}%`);
        document.documentElement.style.setProperty('--message-left', `${(100 - messageWidth) / 2}%`);

        debug('Module ready', { fontSize, fontFamily, messageWidth, debugMode });
    } catch (error) {
        console.error('Lancer Communicator | Error applying CSS settings:', error);
        document.documentElement.style.setProperty('--message-font-size', '14px');
        document.documentElement.style.setProperty('--message-font', 'MOSCOW2024');
        document.documentElement.style.setProperty('--message-width', '40%');
        document.documentElement.style.setProperty('--message-left', '30%');
    }

    LancerCommunicator.initSocketListeners();
});


// ─── Helper: inject the log button into sidebar-tabs ───────────


function _injectLogButton() {
    try {
        const isGM = game.user?.isGM;
        const allowExport = isGM || (game.settings.get(MODULE_NAME, 'allowPlayersExport') ?? false);
        const allowAccess = isGM || (game.settings.get(MODULE_NAME, 'allowPlayersAccess') ?? true);

        if (!allowAccess && !allowExport) return;


        if (document.getElementById('lcm-save-messages-btn')) return;

        const menuEl =
            document.querySelector('#sidebar menu.flexcol') ||
            document.querySelector('#ui-right menu.flexcol') ||
            document.querySelector('menu.flexcol'); 

        if (!menuEl) return;

        const tooltipText = game.i18n.localize('LANCER.Settings.ChatLog.ButtonTitle') || 'Communicator Log';


        const liItem = document.createElement('li');


        const btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'lcm-save-messages-btn';
        
        btn.className = 'lcm-save-btn ui-control plain icon fas fa-satellite-dish';
        btn.setAttribute('data-tooltip', tooltipText);
        btn.setAttribute('aria-label', tooltipText);
        btn.setAttribute('data-action', 'openCommunicatorLog'); 
        btn.title = tooltipText; 
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            LancerCommunicator.openSaveMessagesDialog();
        });


        liItem.appendChild(btn);

        menuEl.prepend(liItem); 
        
        debug('Log button injected into menu.flexcol');
    } catch (err) {
        console.warn('Lancer Communicator | Could not inject log button:', err);
    }
}

// ─── Hooks: inject after sidebar renders ────────────────────────

Hooks.on('renderSidebar', () => _injectLogButton());
Hooks.on('renderSidebarTab', () => _injectLogButton());


