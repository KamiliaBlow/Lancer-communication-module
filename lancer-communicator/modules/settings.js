/**
 * Модуль регистрации настроек Lancer Communicator
 */
export function registerSettings() {
    const MODULE = 'lancer-communicator';

    // ─── Настройки для пользователей ─────────────────────────────

    game.settings.register(MODULE, 'postToChat', {
        name: game.i18n.localize('LANCER.Settings.PostToChat'),
        hint: game.i18n.localize('LANCER.Settings.PostToChatHint'),
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register(MODULE, 'allowPlayersAccess', {
        name: game.i18n.localize('LANCER.Settings.AllowPlayersAccess'),
        hint: game.i18n.localize('LANCER.Settings.AllowPlayersAccessHint'),
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register(MODULE, 'globalTypingSpeed', {
        name: game.i18n.localize('LANCER.Settings.globalTypingSpeed'),
        hint: game.i18n.localize('LANCER.Settings.globalTypingSpeedHint'),
        scope: 'world',
        config: true,
        type: Number,
        range: { min: 50, max: 180, step: 10 },
        default: 130
    });

    game.settings.register(MODULE, 'voiceVolume', {
        name: game.i18n.localize('LANCER.Settings.voiceVolume'),
        hint: game.i18n.localize('LANCER.Settings.voiceVolumeHint'),
        scope: 'world',
        config: true,
        type: Number,
        range: { min: 0.1, max: 1.0, step: 0.05 },
        default: 0.3
    });

    game.settings.register(MODULE, 'messageFontSize', {
        name: game.i18n.localize('LANCER.Settings.FontSize'),
        hint: game.i18n.localize('LANCER.Settings.FontSizeHint'),
        scope: 'world',
        config: true,
        type: Number,
        range: { min: 10, max: 32, step: 1 },
        default: 14,
        onChange: (value) => {
            document.documentElement.style.setProperty('--message-font-size', `${value}px`);
        }
    });

    game.settings.register(MODULE, 'enableTextShake', {
        name: game.i18n.localize('LANCER.Settings.EnableTextShake'),
        hint: game.i18n.localize('LANCER.Settings.EnableTextShakeHint'),
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register(MODULE, 'debugMode', {
        name: game.i18n.localize('LANCER.Settings.debugMode'),
        hint: game.i18n.localize('LANCER.Settings.debugModeHint'),
        scope: 'world',
        config: true,
        type: Boolean,
        default: false
    });

    // ─── Настройки шрифтов ───────────────────────────────────────

    game.settings.register(MODULE, 'fontFamily', {
        name: game.i18n.localize('LANCER.Settings.FontFamily'),
        hint: game.i18n.localize('LANCER.Settings.FontFamilyHint'),
        scope: 'client',
        config: false,
        type: String,
        default: 'MOSCOW2024'
    });

    game.settings.register(MODULE, 'communicatorFont', {
        name: game.i18n.localize('LANCER.Settings.FontSelect'),
        scope: 'world',
        config: false,
        type: String,
        choices: {
            'MOSCOW2024': 'MOSCOW2024',
            'Undertale': 'Undertale',
            'TeletactileRus': 'TeletactileRus',
            'Kereru': 'Kereru',
            'Serif': 'Serif',
            'Sans-serif': 'Sans-serif'
        },
        default: 'MOSCOW2024',
        onChange: (value) => {
            document.documentElement.style.setProperty('--message-font', value);
        }
    });

    // ─── Клиентские сохранённые значения ─────────────────────────

    game.settings.register(MODULE, 'lastPortrait', {
        name: game.i18n.localize('LANCER.Settings.currentPortrait'),
        scope: 'client',
        config: false,
        type: String,
        default: ''
    });

    game.settings.register(MODULE, 'lastSound', {
        name: game.i18n.localize('LANCER.Settings.currentSound'),
        scope: 'client',
        config: false,
        type: String,
        default: ''
    });

    game.settings.register(MODULE, 'lastCharacterName', {
        name: game.i18n.localize('LANCER.Settings.lastCharacterName'),
        scope: 'client',
        config: false,
        type: String,
        default: ''
    });

    game.settings.register(MODULE, 'lastMessageStyle', {
        name: game.i18n.localize('LANCER.Settings.lastMessageStyle'),
        scope: 'client',
        config: false,
        type: String,
        default: 'green'
    });

    game.settings.register(MODULE, 'lastVoiceover', {
        name: game.i18n.localize('LANCER.Settings.lastVoiceover'),
        scope: 'client',
        config: false,
        type: String,
        default: ''
    });

    game.settings.register(MODULE, 'lastTypingSpeed', {
        name: 'Last Typing Speed',
        scope: 'client',
        config: false,
        type: Number,
        default: null
    });
}
