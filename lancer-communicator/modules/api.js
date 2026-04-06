import { LancerCommunicator } from './communicator.js';

/**
 * Регистрирует публичное API модуля для доступа из макросов
 */
export function registerAPI() {
    game.modules.get('lancer-communicator').api = {
        openCommunicatorSettings: LancerCommunicator.openCommunicatorSettings.bind(LancerCommunicator),
        sendCommunicatorMessage: LancerCommunicator.sendCommunicatorMessage.bind(LancerCommunicator)
    };
}
