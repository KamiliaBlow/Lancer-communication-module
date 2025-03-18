import { LancerCommunicator } from './communicator.js';
import { registerSettings } from './settings.js';
import { registerAPI } from './api.js';

// Инициализация модуля
Hooks.once('init', () => {
    console.log('Lancer Communicator | Initializing');
    
    // Регистрация настроек модуля
    registerSettings();
    
    // Регистрация API 
    registerAPI();
});

// В main.js - обновите хук getSceneControlButtons
Hooks.on('getSceneControlButtons', (controls) => {
    console.log('Lancer Communicator | getSceneControlButtons hook fired', controls);
    
    // Проверяем права доступа
    const allowPlayersAccess = game.settings.get('lancer-communicator', 'allowPlayersAccess');
    console.log('Lancer Communicator | allowPlayersAccess:', allowPlayersAccess, 'isGM:', game.user.isGM);
    
    if (!game.user.isGM && !allowPlayersAccess) {
        console.log('Lancer Communicator | User does not have permission to see button');
        return;
    }
    
    // Находим группу инструментов токенов
    const tokenTools = controls.find(c => c.name === "token");
    console.log('Lancer Communicator | Found token tools:', !!tokenTools);
    
    if (tokenTools) {
        // Добавляем кнопку в инструменты токенов
        console.log('Lancer Communicator | Adding button to token tools');
        tokenTools.tools.push({
            name: "communicator",
            title: game.i18n.localize("LANCER.Settings.Communicator") || "Lancer Communicator",
            icon: "fas fa-satellite-dish",
            visible: true,
            onClick: () => {
                console.log('Lancer Communicator | Button clicked');
                LancerCommunicator.openCommunicatorSettings();
            },
            button: true
        });
    }
});

// Готовность системы
Hooks.once('ready', () => {
    console.log('Lancer Communicator | Ready');
    
    // Проверка локализации
    console.log('Lancer Communicator | Localization test:', 
        game.i18n.localize("LANCER.Settings.Communicator"), 
        game.i18n.has("LANCER.Settings.Communicator"));
    
    // Устанавливаем переменные CSS
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
    
    // Инициализация сокетов для коммуникатора
    LancerCommunicator.initSocketListeners();
});