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

    // Registrar o comando de chat (/lcm)
    Hooks.on('chatMessage', (chatLog, messageText, chatData) => {
        if (messageText.trim().startsWith('/lcm')) {
            handleLancerCommunicatorCommand(messageText);
            return false; // Evita que a mensagem seja enviada ao chat regular
        }
    });
});

/**
 * Processa comandos do Lancer Communicator no chat
 * @param {string} messageText - O texto digitado pelo usuário
 */
function handleLancerCommunicatorCommand(messageText) {
    const rawArgs = messageText.trim().substring(4).trim(); // Remove "/lcm"

    if (!rawArgs) {
        LancerCommunicator.openCommunicatorSettings();
        return;
    }

    const args = rawArgs.split(/\s+/);
    const cmd = args[0].toLowerCase();

    if (cmd === 'config') {
        LancerCommunicator.openCommunicatorSettings();
    } else if (cmd === 'log' || cmd === 'history') {
        LancerCommunicator.openSaveMessagesDialog();
    } else if (cmd === 'help') {
        displayHelpMessage();
    } else if (cmd === 'send') {
        const sendContent = rawArgs.substring(4).trim(); // Remove "send"
        handleDirectSend(sendContent);
    } else {
        ui.notifications.warn(`Lancer Communicator: Comando desconhecido "${cmd}". Digite "/lcm help" para ajuda.`);
    }
}

/**
 * Exibe a mensagem de ajuda no chat como sussurro para o usuário
 */
function displayHelpMessage() {
    const helpContent = `
        <div class="lcm-chat-help">
            <h3 style="border-bottom: 1px solid var(--lcm-neon-green, #03FB8D); padding-bottom: 3px; color: var(--lcm-neon-green, #03FB8D); margin-top: 0;">Lancer Communicator - Comandos</h3>
            <p style="margin: 4px 0;"><strong>/lcm</strong> ou <strong>/lcm config</strong> : Abre as configurações do comunicador.</p>
            <p style="margin: 4px 0;"><strong>/lcm log</strong> ou <strong>/lcm history</strong> : Abre o histórico de mensagens.</p>
            <p style="margin: 4px 0;"><strong>/lcm send [Personagem] | [Mensagem]</strong> : Envia uma mensagem rapidamente. Use a barra vertical (|) para separar o nome do personagem do texto.</p>
            <p style="margin: 4px 0;"><strong>/lcm help</strong> : Exibe esta ajuda.</p>
        </div>
    `;

    ChatMessage.create({
        user: game.user.id,
        content: helpContent,
        whisper: [game.user.id],
        speaker: { alias: "Lancer Communicator" }
    });
}

/**
 * Processa e envia uma mensagem do comunicador diretamente
 * @param {string} sendContent - O texto após o comando send
 */
function handleDirectSend(sendContent) {
    if (!sendContent) {
        ui.notifications.warn("Lancer Communicator: Por favor, especifique uma mensagem. Uso: /lcm send [Personagem] | [Mensagem]");
        return;
    }

    let characterName = "";
    let message = "";

    if (sendContent.includes("|")) {
        const parts = sendContent.split("|");
        characterName = parts[0].trim();
        message = parts.slice(1).join("|").trim();
    } else {
        message = sendContent.trim();
        const activeToken = canvas.tokens?.controlled[0];
        characterName = activeToken?.actor?.name || 
                        game.user.character?.name || 
                        game.settings.get(MODULE_NAME, 'lastCharacterName') || 
                        game.user.name;
    }

    if (!message) {
        ui.notifications.warn("Lancer Communicator: Mensagem vazia.");
        return;
    }

    // Busca o retrato associado
    let portraitPath = "";
    const actor = game.actors.find(a => a.name === characterName);
    if (actor) {
        portraitPath = actor.img;
    }
    if (!portraitPath) {
        portraitPath = game.settings.get(MODULE_NAME, 'lastPortrait') || game.user.avatar || "icons/svg/mystery-man.svg";
    }

    const soundPath = game.settings.get(MODULE_NAME, 'lastSound') || '';
    const voiceoverPath = game.settings.get(MODULE_NAME, 'lastVoiceover') || '';
    const style = game.settings.get(MODULE_NAME, 'lastMessageStyle') || 'green';
    const fontSize = game.settings.get(MODULE_NAME, 'messageFontSize') || 14;
    const fontFamily = game.settings.get(MODULE_NAME, 'fontFamily') || 'MOSCOW2024';
    const typingSpeed = game.settings.get(MODULE_NAME, 'lastTypingSpeed');
    const messageWidth = game.settings.get(MODULE_NAME, 'lastMessageWidth') || game.settings.get(MODULE_NAME, 'globalMessageWidth') || 40;
    const postToChat = game.settings.get(MODULE_NAME, 'postToChat');

    LancerCommunicator.sendCommunicatorMessage(
        characterName,
        portraitPath,
        message,
        soundPath,
        voiceoverPath,
        style,
        fontSize,
        fontFamily,
        typingSpeed,
        messageWidth,
        postToChat
    );
}



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


