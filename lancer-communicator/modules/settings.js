// Модуль для настроек
export function registerSettings() {
    // Настройка для определения, могут ли игроки использовать коммуникатор
    game.settings.register('lancer-communicator', 'allowPlayersAccess', {
        name: game.i18n.localize("LANCER.Settings.AllowPlayersAccess"),
        hint: "Разрешает игрокам использовать функции коммуникатора",
        scope: 'world',
        config: true,
        type: Boolean,
        default: true
    });
    
    // Настройка для скорости печати
    game.settings.register('lancer-communicator', 'typingSpeed', {
        name: game.i18n.localize("LANCER.Settings.typingSpeed"),
        scope: 'world',
        config: true,
        type: Number,
        range: {
            min: 50,
            max: 180,
            step: 10
        },
        default: 130
    });
    
    // Настройка для громкости звука
    game.settings.register('lancer-communicator', 'voiceVolume', {
        name: game.i18n.localize("LANCER.Settings.voiceVolume"),
        scope: 'world',
        config: true,
        type: Number,
        range: {
            min: 0.01,
            max: 0.5,
            step: 0.01
        },
        default: 0.05
    });
	
    // Выбранное семейство шрифтов
    game.settings.register('lancer-communicator', 'fontFamily', {
        name: game.i18n.localize("LANCER.Settings.FontFamily") || "Font Family",
        hint: game.i18n.localize("LANCER.Settings.FontFamilyHint") || "The font used for messages",
        scope: "client",
        config: false,
        type: String,
        default: "MOSCOW2024"
    });
    
    // Настройка для шрифта сообщений
    game.settings.register('lancer-communicator', 'communicatorFont', {
        name: game.i18n.localize("LANCER.Settings.FontSelect"),
        scope: 'world',
        config: true,
        type: String,
        choices: {
            'MOSCOW2024': 'MOSCOW2024',
            'Undertale': 'Undertale',
            'TeletactileRus': 'TeletactileRus',
            'monospace': 'Monospace',
            'serif': 'Serif',
            'sans-serif': 'Sans-serif'
        },
        default: 'MOSCOW2024',
        onChange: value => {
            document.documentElement.style.setProperty('--message-font', value);
        }
    });
    
    // Настройка для размера шрифта сообщений
    game.settings.register('lancer-communicator', 'messageFontSize', {
        name: game.i18n.localize("LANCER.Settings.FontSize"),
        scope: 'world',
        config: true,
        type: Number,
        range: {
            min: 10,
            max: 32,
            step: 1
        },
        default: 14,
        onChange: value => {
            document.documentElement.style.setProperty('--message-font-size', `${value}px`);
        }
    });

    // Сохранение последнего выбранного портрета
    game.settings.register('lancer-communicator', 'lastPortrait', {
        name: game.i18n.localize("LANCER.Settings.currentPortrait"),
        scope: 'client',
        config: false,
        type: String,
        default: ''
    });

    // Сохранение последнего выбранного звука
    game.settings.register('lancer-communicator', 'lastSound', {
        name: game.i18n.localize("LANCER.Settings.currentSound"),
        scope: 'client',
        config: false,
        type: String,
        default: ''
    });

    // Сохранение последнего имени персонажа
    game.settings.register('lancer-communicator', 'lastCharacterName', {
        name: game.i18n.localize("LANCER.Settings.lastCharacterName"),
        scope: 'client',
        config: false,
        type: String,
        default: ''
    });

    // Сохранение последнего выбранного стиля сообщения
    game.settings.register('lancer-communicator', 'lastMessageStyle', {
        name: game.i18n.localize("LANCER.Settings.lastMessageStyle"),
        scope: 'client',
        config: false,
        type: String,
        default: 'green'
    });
}

