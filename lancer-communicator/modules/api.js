import { LancerCommunicator } from './communicator.js';

// Регистрация публичного API для доступа из других модулей
export function registerAPI() {
    // Определяем публичный API для других модулей
    const api = {
        openCommunicatorSettings: LancerCommunicator.openCommunicatorSettings.bind(LancerCommunicator),
        sendCommunicatorMessage: LancerCommunicator.sendCommunicatorMessage.bind(LancerCommunicator)
    };
    
    // Регистрируем API в модуле
    game.modules.get('lancer-communicator').api = api;
}