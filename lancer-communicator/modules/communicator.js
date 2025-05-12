/**
 * Основной класс Lancer Communicator
 * Управляет показом сообщений и диалоговым интерфейсом
 */
export class LancerCommunicator {
    // Кэшированные настройки
    static settings = {
        typingSpeed: 130,
        voiceVolume: 0.05,
        fontFamily: 'MOSCOW2024'
    };

    /**
     * Инициализирует слушателей сокетов для коммуникации между клиентами
     */
    static initSocketListeners() {
        if (!game.socket) {
            console.error("Lancer Communicator | Socket not available during initialization!");
            return;
        }
		
        game.socket.on('module.lancer-communicator', (payload) => {
            if (payload?.type === 'showMessage' && payload.data?.characterName) {
                this.showCommunicatorMessage(payload.data).catch(console.error);
            }
        });
    }

    /**
     * Открывает диалоговое окно настроек коммуникатора
     */
    static async openCommunicatorSettings() {
        const selectedToken = canvas.tokens.controlled[0];
        let lastPortrait = game.settings.get('lancer-communicator', 'lastPortrait');
        let lastCharacterName = game.settings.get('lancer-communicator', 'lastCharacterName');
        if (selectedToken) {
            lastCharacterName = selectedToken.name; 
        }
        const lastSound = game.settings.get('lancer-communicator', 'lastSound');
		const lastVoiceover = game.settings.get('lancer-communicator', 'lastVoiceover');
        const lastStyle = game.settings.get('lancer-communicator', 'lastMessageStyle');
        const fontSize = game.settings.get('lancer-communicator', 'messageFontSize');
        this.settings.typingSpeed = game.settings.get('lancer-communicator', 'typingSpeed') || 130;
        this.settings.voiceVolume = game.settings.get('lancer-communicator', 'voiceVolume') || 0.05;
        this.settings.fontFamily = game.settings.get('lancer-communicator', 'fontFamily') || 'MOSCOW2024';

        new Dialog({
            title: game.i18n.localize("LANCER.Settings.CommunicatorSettings"),
            content: `
                <form class="lancer-communicator-dialog">
                    <div class="lcm-form-group">
                        <label>${game.i18n.localize("LANCER.Settings.CharacterName")}</label>
                        <input type="text" id="character-name" value="${lastCharacterName || ''}" placeholder="${game.i18n.localize("LANCER.Settings.CharacterName")}">
                    </div>
                    <div class="lcm-form-group">
                        <label>${game.i18n.localize("LANCER.Settings.Portrait")}</label>
                        <div class="lcm-input-group">
                            <input type="text" id="portrait-path" value="${lastPortrait || ''}" readonly placeholder="${game.i18n.localize("LANCER.Settings.SelectPortrait")}">
                            <button type="button" id="select-portrait">${game.i18n.localize("LANCER.Settings.SelectPortrait")}</button>
                        </div>
                    </div>
                    <div class="lcm-form-group">
                        <label>${game.i18n.localize("LANCER.Settings.MessageText")}</label>
                        <textarea id="message-input" rows="4" placeholder="${game.i18n.localize("LANCER.Settings.MessageText")}"></textarea>
                    </div>
                    <div class="lcm-form-group">
                        <label>${game.i18n.localize("LANCER.Settings.SoundSelect")}</label>
                        <div class="lcm-input-group">
                            <input type="text" id="sound-path" value="${lastSound || ''}" readonly placeholder="${game.i18n.localize("LANCER.Settings.SelectSound")}">
                            <button type="button" id="select-sound">${game.i18n.localize("LANCER.Settings.SelectSound")}</button>
                            <button type="button" id="clear-sound">${game.i18n.localize("LANCER.Settings.ClearSound")}</button>
                        </div>
                    </div>
					<div class="lcm-form-group">
						<label>${game.i18n.localize("LANCER.Settings.VoiceoverSelect")}</label>
						<div class="lcm-input-group">
							<input type="text" id="voiceover-path" value="${lastVoiceover || ''}" readonly placeholder="${game.i18n.localize("LANCER.Settings.SelectVoiceover")}">
							<button type="button" id="select-voiceover">${game.i18n.localize("LANCER.Settings.SelectVoiceover")}</button>
							<button type="button" id="clear-voiceover">${game.i18n.localize("LANCER.Settings.ClearVoiceover")}</button>
						</div>
					</div>
                    <div class="lcm-form-group">
                        <label>${game.i18n.localize("LANCER.Settings.FontFamily") || "Font Family"}</label>
                        <select id="font-family">
                            <option value="MOSCOW2024" ${this.settings.fontFamily === 'MOSCOW2024' ? 'selected' : ''}>MOSCOW2024</option>
                            <option value="Undertale" ${this.settings.fontFamily === 'Undertale' ? 'selected' : ''}>Undertale</option>
                            <option value="TeletactileRus" ${this.settings.fontFamily === 'TeletactileRus' ? 'selected' : ''}>TeletactileRus</option>
							<option value="Kereru" ${this.settings.fontFamily === 'Kereru' ? 'selected' : ''}>Kereru</option>
							<option value="Serif" ${this.settings.fontFamily === 'Serif' ? 'selected' : ''}>Serif</option>
							<option value="Sans-serif" ${this.settings.fontFamily === 'Sans-serif' ? 'selected' : ''}>Sans-serif</option>
                        </select>
                    </div>
                    <div class="lcm-form-group">
                        <label>${game.i18n.localize("LANCER.Settings.FontSize")}</label>
                        <div class="lcm-input-group">
                            <input 
                                type="range" 
                                id="font-size-input" 
                                min="10" 
                                max="32" 
                                step="1" 
                                value="${fontSize}"
                            >
                            <span id="font-size-display">${fontSize}px</span>
                        </div>
                    </div>
                    <div class="lcm-form-group">
                        <label>${game.i18n.localize("LANCER.Settings.MessageStyle")}</label>
                        <select id="message-style">
                            <option value="green" ${lastStyle === 'green' ? 'selected' : ''}>${game.i18n.localize("LANCER.Settings.MSGStyleGr")}</option>
                            <option value="blue" ${lastStyle === 'blue' ? 'selected' : ''}>${game.i18n.localize("LANCER.Settings.MSGStyleBl")}</option>
                            <option value="yellow" ${lastStyle === 'yellow' ? 'selected' : ''}>${game.i18n.localize("LANCER.Settings.MSGStyleYe")}</option>
                            <option value="red" ${lastStyle === 'red' ? 'selected' : ''}>${game.i18n.localize("LANCER.Settings.MSGStyleRe")}</option>
                            <option value="damaged" ${lastStyle === 'damaged' ? 'selected' : ''}>${game.i18n.localize("LANCER.Settings.MSGStyleDm")}</option>
                            <option value="undertale" ${lastStyle === 'undertale' ? 'selected' : ''}>${game.i18n.localize("LANCER.Settings.MSGStyleUn") || "Undertale"}</option>
                        </select>
                    </div>
                    <div id="style-preview" class="lcm-form-group">
                        <!-- Сюда будет добавлен предпросмотр стиля через JavaScript -->
                    </div>
                </form>
            `,
            buttons: {
                send: {
                    icon: '',
                    label: game.i18n.localize("LANCER.Settings.Send"),
                    callback: (html) => {
                        const formElement = html[0].querySelector('form');
                        const characterName = formElement.querySelector('#character-name').value;
                        const portraitPath = formElement.querySelector('#portrait-path').value;
                        const message = formElement.querySelector('#message-input').value;
                        const soundPath = formElement.querySelector('#sound-path').value;
						const voiceoverPath = formElement.querySelector('#voiceover-path').value;
                        const style = formElement.querySelector('#message-style').value;
                        const fontFamily = formElement.querySelector('#font-family').value;
                        const fontSize = Number(formElement.querySelector('#font-size-input').value);

                        // Валидация
                        if (!characterName.trim()) {
                            ui.notifications.warn(game.i18n.localize("LANCER.Settings.Warnings.NoCharacterName"));
                            return false;
                        }
                        if (!portraitPath) {
                            ui.notifications.warn(game.i18n.localize("LANCER.Settings.Warnings.NoPortrait"));
                            return false;
                        }
                        if (!message.trim()) {
                            ui.notifications.warn(game.i18n.localize("LANCER.Settings.Warnings.NoMessage"));
                            return false;
                        }

                        // Сохраняем значения в настройках
                        game.settings.set('lancer-communicator', 'lastCharacterName', characterName);
                        game.settings.set('lancer-communicator', 'lastPortrait', portraitPath);
                        game.settings.set('lancer-communicator', 'lastSound', soundPath);
                        game.settings.set('lancer-communicator', 'lastMessageStyle', style);
                        game.settings.set('lancer-communicator', 'fontFamily', fontFamily);

                        // Отправляем сообщение
                        this.sendCommunicatorMessage(characterName, portraitPath, message, soundPath, voiceoverPath, style, fontSize, fontFamily);
                    }
                },
                macro: {
                    icon: '',
                    label: game.i18n.localize("LANCER.Settings.CreateMacro"),
                    callback: async (html) => {
                        const formElement = html[0].querySelector('form');
                        const characterName = formElement.querySelector('#character-name').value;
                        const portraitPath = formElement.querySelector('#portrait-path').value;
                        const message = formElement.querySelector('#message-input').value;
                        const soundPath = formElement.querySelector('#sound-path').value;
						const voiceoverPath = formElement.querySelector('#voiceover-path').value;
                        const style = formElement.querySelector('#message-style').value;
                        const fontFamily = formElement.querySelector('#font-family').value;
                        const fontSize = Number(formElement.querySelector('#font-size-input').value);

                        // Валидация
                        if (!characterName.trim()) {
                            ui.notifications.warn(game.i18n.localize("LANCER.Settings.Warnings.NoCharacterName"));
                            return false;
                        }
                        if (!portraitPath) {
                            ui.notifications.warn(game.i18n.localize("LANCER.Settings.Warnings.NoPortrait"));
                            return false;
                        }
                        if (!message.trim()) {
                            ui.notifications.warn(game.i18n.localize("LANCER.Settings.Warnings.NoMessage"));
                            return false;
                        }

                        // Проверка уникальности имени макроса
                        if (game.macros.find(m => m.name === characterName)) {
                            ui.notifications.warn("Макрос с таким именем уже существует!");
                            return false;
                        }

                        // Создаем макрос
                        await this.createCommunicatorMacro(characterName, portraitPath, message, soundPath, voiceoverPath, style, fontSize, fontFamily);
                    }
                },
                quickMacro: {
                    icon: '',
                    label: game.i18n.localize("LANCER.Settings.CreateQuickMacro"),
                    callback: async (html) => {
                        const formElement = html[0].querySelector('form');
                        const characterName = formElement.querySelector('#character-name').value;
                        const portraitPath = formElement.querySelector('#portrait-path').value;
                        const soundPath = formElement.querySelector('#sound-path').value;
						const voiceoverPath = formElement.querySelector('#voiceover-path').value;
                        const style = formElement.querySelector('#message-style').value;
                        const fontFamily = formElement.querySelector('#font-family').value;
                        const fontSize = Number(formElement.querySelector('#font-size-input').value);

                        // Валидация
                        if (!characterName.trim()) {
                            ui.notifications.warn(game.i18n.localize("LANCER.Settings.Warnings.NoCharacterName"));
                            return false;
                        }
                        if (!portraitPath) {
                            ui.notifications.warn(game.i18n.localize("LANCER.Settings.Warnings.NoPortrait"));
                            return false;
                        }

                        // Проверка уникальности имени макроса
                        if (game.macros.find(m => m.name === `${characterName} Quick`)) {
                            ui.notifications.warn("Макрос с таким именем уже существует!");
                            return false;
                        }

                        // Создаем быстрый макрос
                        await this.createQuickCommunicatorMacro(characterName, portraitPath, soundPath, voiceoverPath, style, fontSize, fontFamily);
                    }
                },
                cancel: {
                    icon: '',
                    label: game.i18n.localize("LANCER.Settings.Cancel")
                }
            },
            default: 'send',
            render: (html) => {
                const dialog = html[0];
                const portraitPathInput = dialog.querySelector('#portrait-path');
                const selectPortraitBtn = dialog.querySelector('#select-portrait');
                const styleSelect = dialog.querySelector('#message-style');
                const preview = dialog.querySelector('#style-preview');
                const fontSizeInput = dialog.querySelector('#font-size-input');
                const fontSizeDisplay = dialog.querySelector('#font-size-display');

                // Обработчик для выбора портрета
                selectPortraitBtn.addEventListener('click', () => {
                    new FilePicker({
                        type: 'image',
                        current: portraitPathInput.value,
                        callback: async (path) => {
                            if (await this._validateFile(path)) {
                                portraitPathInput.value = path;
                            } else {
                                ui.notifications.warn("Выбранный файл не найден!");
                            }
                        }
                    }).browse();
                });

                // Настраиваем обработчики для выбора звука
                const soundPathInput = dialog.querySelector('#sound-path');
                dialog.querySelector('#select-sound').addEventListener('click', () => {
                    new FilePicker({
                        type: 'audio',
                        current: soundPathInput.value,
                        callback: async (path) => {
                            if (await this._validateFile(path)) {
                                soundPathInput.value = path;
                            } else {
                                ui.notifications.warn("Выбранный файл не найден!");
                            }
                        }
                    }).browse();
                });

                // Обработчик для очистки выбранного звука
                dialog.querySelector('#clear-sound').addEventListener('click', () => {
                    soundPathInput.value = '';
                });
				
				const voiceoverPathInput = dialog.querySelector('#voiceover-path');
				dialog.querySelector('#select-voiceover').addEventListener('click', () => {
					new FilePicker({
						type: 'audio',
						current: voiceoverPathInput.value,
						callback: async (path) => {
							if (await this._validateFile(path)) {
								voiceoverPathInput.value = path;
							} else {
								ui.notifications.warn("Выбранный файл не найден!");
							}
						}
					}).browse();
				});

				dialog.querySelector('#clear-voiceover').addEventListener('click', () => {
					voiceoverPathInput.value = '';
				});

                // Обработчик изменения шрифта
                const fontFamilySelect = dialog.querySelector('#font-family');
                fontFamilySelect.addEventListener('change', () => {
                    const selectedFont = fontFamilySelect.value;
                    document.documentElement.style.setProperty('--message-font', selectedFont);
                    // Обновляем превью
                    updatePreview();
                });

                // Обновление отображения размера шрифта при изменении
                fontSizeInput.addEventListener('input', () => {
                    const size = Number(fontSizeInput.value);
                    fontSizeDisplay.textContent = `${size}px`;
                    // Обновляем CSS-переменную для предпросмотра
                    document.documentElement.style.setProperty('--message-font-size', `${size}px`);
                });

                // Функция обновления предпросмотра стилей
                function updatePreview() {
                    const selectedStyle = styleSelect.value;
                    // Очищаем превью
                    preview.innerHTML = '';
                    // Создаем контейнер с динамическими стилями
                    const previewContent = document.createElement('div');
                    previewContent.className = `lcm-communicator-container style-${selectedStyle}`;
                    previewContent.style.padding = "10px";
                    previewContent.style.borderRadius = "5px";
                    previewContent.style.margin = "10px 0";
                    previewContent.style.display = "flex";
                    // Добавляем текст с тем же стилем, что будет использоваться в сообщении
                    previewContent.innerHTML = `
                        <div style="flex-shrink: 0; width: 50px; height: 50px; background: #555; border-radius: 5px; margin-right: 10px"></div>
                        <div style="flex-grow: 1; font-family: var(--message-font); font-size: var(--message-font-size);">
                            ${game.i18n.localize("LANCER.Settings.MessageStyle")} - ${styleSelect.options[styleSelect.selectedIndex].text}
                        </div>
                    `;
                    // Применяем соответствующие стили в зависимости от выбранного стиля
                    switch(selectedStyle) {
                        case 'blue':
                            previewContent.style.color = '#00A4FF';
                            previewContent.style.border = '1px solid #00A4FF';
                            previewContent.style.boxShadow = '0 0 5px rgba(0, 164, 255, 0.5)';
                            previewContent.style.backgroundColor = 'rgba(0, 0, 255, 0.1)';
                            break;
                        case 'red':
                            previewContent.style.color = '#FF0000';
                            previewContent.style.border = '1px solid #FF0000';
                            previewContent.style.boxShadow = '0 0 5px rgba(255, 0, 0, 0.5)';
                            previewContent.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                            break;
                        case 'yellow':
                            previewContent.style.color = '#FFD700';
                            previewContent.style.border = '1px solid #FFD700';
                            previewContent.style.boxShadow = '0 0 5px rgba(255, 215, 0, 0.5)';
                            previewContent.style.backgroundColor = 'rgba(255, 255, 0, 0.1)';
                            break;
                        case 'damaged':
                            previewContent.style.color = 'darkred';
                            previewContent.style.border = '1px solid maroon';
                            previewContent.style.boxShadow = '0 0 5px rgba(255, 0, 0, 0.5)';
                            previewContent.style.backgroundColor = 'rgba(128, 0, 0, 0.1)';
                            previewContent.style.animation = 'shake-border 0.7s infinite';
                            break;
                        default: // green
                            previewContent.style.color = 'green';
                            previewContent.style.border = '1px solid #03FB8D';
                            previewContent.style.boxShadow = '0 0 5px rgba(3, 251, 141, 0.5)';
                            previewContent.style.backgroundColor = 'rgba(0, 255, 0, 0.1)';
                            break;
                        case 'undertale': 
                            previewContent.style.color = 'white'; 
                            previewContent.style.border = '2px solid white'; 
                            previewContent.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.5)'; 
                            previewContent.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
                            break;
                    }
                    preview.appendChild(previewContent);
                }

                // Обновляем превью при изменении стиля
                styleSelect.addEventListener('change', updatePreview);
                // Первичная инициализация превью
                updatePreview();
            },
            close: (html) => {
                // Сохраняем настройки при закрытии диалога
                const formElement = html[0]?.querySelector('form');
                if (formElement) {
                    const fontSize = Number(formElement.querySelector('#font-size-input')?.value || 14);
                    // Сохраняем размер шрифта в настройках
                    if (!isNaN(fontSize) && fontSize >= 10 && fontSize <= 32) {
                        game.settings.set('lancer-communicator', 'messageFontSize', fontSize)
                            .catch(err => console.error('Error saving font size setting', err));
                    }
					
					const voiceoverPath = formElement.querySelector('#voiceover-path').value;
					game.settings.set('lancer-communicator', 'lastVoiceover', voiceoverPath);
                }
            }
        }).render(true);
    }

    /**
     * Отправляет сообщение коммуникатора всем подключенным клиентам
     * @param {string} characterName - Имя персонажа
     * @param {string} portraitPath - Путь к изображению портрета
     * @param {string} message - Текст сообщения
     * @param {string} soundPath - Путь к звуковому файлу (опционально)
     * @param {string} style - Стиль сообщения (green, blue, yellow, red, damaged)
     * @param {number} fontSize - Размер шрифта в пикселях
     */
    static sendCommunicatorMessage(characterName, portraitPath, message, soundPath = '', voiceoverPath = '', style = 'green', fontSize = 14, fontFamily = null) {
        if (!fontFamily) {
            fontFamily = this.settings.fontFamily;
        }
        // Создаем объект с данными сообщения
        const messageData = {
            characterName,
            portraitPath,
            message,
            soundPath,
			voiceoverPath,
            style,
            fontSize,
            fontFamily
        };
        // Показываем сообщение локально
        this.showCommunicatorMessage(messageData).catch(console.error);
        // Отправляем сообщение всем подключенным клиентам
        game.socket.emit('module.lancer-communicator', {
            type: 'showMessage',
            data: messageData
        });
    }

    /**
     * Отображает анимированное сообщение коммуникатора на экране
     * @param {Object} data - Данные сообщения
     */
    static async showCommunicatorMessage(data) {
        const { characterName, portraitPath, message, soundPath, voiceoverPath, style, fontSize, fontFamily } = data;
    
		// Удаляем существующее сообщение
		const existingMessage = document.getElementById('lancer-communicator-message');
		if (existingMessage) {
			return new Promise(resolve => {
				// Удаляем предыдущее сообщение без анимации, чтобы избежать конфликтов
				existingMessage.remove();
				// Запускаем новый показ сообщения
				this.showCommunicatorMessage(data).then(resolve);
			});
		}

        // Создаем элементы DOM для сообщения
        const messageContainer = document.createElement('div');
        messageContainer.id = 'lancer-communicator-message';
        messageContainer.className = `top-screen style-${style || 'green'}`;
        
        // Создаем внутреннюю структуру сообщения
        messageContainer.innerHTML = `
            <div class="lcm-communicator-container">
                <div class="lcm-portrait-container">
                    <img class="lcm-portrait" src="${portraitPath}" alt="${characterName}">
                    <div class="lcm-character-name">${characterName}</div>
                </div>
                <div class="lcm-message-text"></div>
            </div>
        `;
        
        // Добавляем сообщение на страницу
        document.body.appendChild(messageContainer);
        
        // Получаем элемент для текста сообщения
        const messageText = messageContainer.querySelector('.lcm-message-text');
        
        // Настраиваем CSS переменные для размера шрифта
        if (fontSize && typeof fontSize === 'number') {
            messageContainer.style.setProperty('--message-font-size', `${fontSize}px`);
        }
        
        // Устанавливаем шрифт, учитывая приоритет
        const effectiveFontFamily = fontFamily || this.settings.fontFamily;
        messageContainer.style.setProperty('--message-font', effectiveFontFamily);

        // Предзагрузка звука
		let voiceoverInstance = null;
        let soundInstance = null;
        if (voiceoverPath) {
			try {
				voiceoverInstance = new Audio(voiceoverPath);
				voiceoverInstance.volume = this.settings.voiceVolume;
				
				await new Promise((resolve, reject) => {
					voiceoverInstance.addEventListener('canplaythrough', resolve);
					voiceoverInstance.addEventListener('error', reject);
					setTimeout(resolve, 5000); // Таймаут предзагрузки
				});
				voiceoverInstance.play(); // Проигрываем озвучку целиком
			} catch (error) {
				console.error('Lancer Communicator | Voiceover preload error:', error);
			}
		} 
		// Если озвучка не задана, используем звук для каждого символа
		else if (soundPath) {
			try {
				soundInstance = new Audio(soundPath);
				await new Promise((resolve, reject) => {
					soundInstance.addEventListener('canplaythrough', resolve);
					soundInstance.addEventListener('error', reject);
					setTimeout(resolve, 2000);
				});
			} catch (error) {
				console.error('Lancer Communicator | Sound preload error:', error);
			}
		}

		let currentSoundInstance = null;

        // Эффект печатной машинки
        let i = 0;
        const typingSpeed = this.settings.typingSpeed;
        return new Promise((resolve) => {
            const typeWriter = async () => {
				if (i < message.length) {
					// Перемещаем объявление переменных сюда
					const currentChar = message.charAt(i);
					const nextChar = i + 1 < message.length ? message.charAt(i + 1) : '';
					const prevChar = i > 0 ? message.charAt(i - 1) : '';
					const previousChars = message.substring(Math.max(0, i - 20), i);
					
					i++;

					const isUpperCase = /[A-ZА-Я]/.test(currentChar);
					
					if (isUpperCase) {
						// Определяем контекст буквы
                        
                        // Проверка на начало текста
                        const isFirstChar = i === 1;
                        
                        // Проверка на начало предложения после знаков .!?
                        const isPeriodBefore = /[\.\!\?]\s*$/.test(previousChars);
                        
                        // Проверка после переноса строки
                        const isNewlineBefore = previousChars.includes('\n');
                        
                        // Находится ли буква в начале предложения
                        const isStartOfSentence = isFirstChar || isPeriodBefore || (isNewlineBefore && !/\S/.test(previousChars.substring(previousChars.lastIndexOf('\n'))));
                        
                        // Проверка, находится ли буква в КАПСЛОКЕ
                        // Текущая буква заглавная И следующая тоже заглавная или это конец слова
                        const isPartOfAllCaps = /[A-ZА-Я]/.test(nextChar) || (nextChar === ' ' && /[A-ZА-Я]/.test(prevChar));
                        
                        // Буквы в капсе или заглавные буквы в середине предложения должны анимироваться
                        // Буквы в начале предложения (но не в капсе) НЕ должны анимироваться
                        if (!isStartOfSentence || isPartOfAllCaps) {
                            const span = document.createElement('span');
                            span.textContent = currentChar;
                            span.classList.add('lcm-shake-text');
                            messageText.appendChild(span);
                        } else {
                            // Обычная заглавная буква в начале предложения
                            messageText.appendChild(document.createTextNode(currentChar));
                        }
					} else {
						messageText.appendChild(document.createTextNode(currentChar));
					}

					// Воспроизводим звук на каждый символ
					if (voiceoverPath) {
						// Не воспроизводим звук для каждого символа
					} else if (soundInstance && !/[\s\.,!?;:-]/.test(currentChar)) {
						const volume = this.settings.voiceVolume;
						const randomPitch = 0.85 + (Math.random() * 0.3);

						// Останавливаем предыдущий звук, если он есть
						if (currentSoundInstance) {
							currentSoundInstance.pause();
							currentSoundInstance.currentTime = 0;
						}

						// Используем один и тот же экземпляр звука
						soundInstance.currentTime = 0;
						soundInstance.playbackRate = randomPitch;
						soundInstance.volume = volume;

						try {
							await soundInstance.play();
							// Убираем преждевременную остановку
						} catch (error) {
							console.error('Lancer Communicator | Sound play error:', error);
						}

						// Обновляем текущий звук
						currentSoundInstance = soundInstance;
					}

					const delay = /[\.,!?;:]/.test(currentChar) 
						? 350 - typingSpeed 
						: 200 - typingSpeed;

					setTimeout(typeWriter, delay);
				} else {
					// Очищаем текущий звук после завершения сообщения
					if (currentSoundInstance) {
						currentSoundInstance.pause();
						currentSoundInstance = null;
					}

					setTimeout(() => {
						messageContainer.classList.add('collapsing');
						messageContainer.addEventListener('transitionend', () => {
							messageContainer.remove();
							resolve();
						}, { once: true });
					}, 5000);
				}
			};
            typeWriter();
        });
    }

    /**
     * Создает макрос для отправки сообщения коммуникатора
     */
    static async createCommunicatorMacro(characterName, portraitPath, message, soundPath, voiceoverPath, style, fontSize, fontFamily = null) {
        // Проверяем, может ли пользователь создавать макросы
        if (!game.user.can('MACRO_SCRIPT')) {
            ui.notifications.warn(game.i18n.localize("LANCER.Settings.Warnings.CreateMacroTextPerm"));
            return;
        }

        // Сначала спрашиваем имя макроса
        new Dialog({
            title: game.i18n.localize("LANCER.Settings.CreateMacroName"),
            content: `<div>
                <p>Введите имя для нового макроса:</p>
                <input type="text" id="macro-name-input" value="${characterName} Message" style="width: 100%;">
            </div>`,
            buttons: {
                create: {
                    icon: '',
                    label: game.i18n.localize("LANCER.Settings.Create"),
                    callback: (html) => {
                        const macroName = html[0].querySelector('#macro-name-input').value.trim();
                        if (!macroName) {
                            ui.notifications.warn(game.i18n.localize("LANCER.Settings.Warnings.CreateMacroTextInt"));
                            return;
                        }
                        
                        // Проверяем уникальность имени макроса
                        if (game.macros.find(m => m.name === macroName)) {
                            ui.notifications.warn("Макрос с таким именем уже существует!");
                            return;
                        }

                        // Форматируем параметры для макроса
                        const commandText = `
                            // Созданный макрос коммуникатора Lancer
                            game.modules.get('lancer-communicator').api.sendCommunicatorMessage(
                                "${characterName}",
                                "${portraitPath}",
                                "${message.replace(/"/g, '\\"')}",
                                "${soundPath}",
                                "${voiceoverPath}",
                                "${style}",
                                ${fontSize},
                                "${fontFamily || ''}"
                            );
                        `;
                        
                        // Создаем макрос
                        Macro.create({
                            name: macroName,
                            type: "script",
                            command: commandText,
                            img: portraitPath
                        }).then(macro => {
                            ui.notifications.info(`Макрос "${macroName}" успешно создан!`);
                        }).catch(error => {
                            ui.notifications.error(`Ошибка создания макроса: ${error}`);
                            console.error(error);
                        });
                    }
                },
                cancel: {
                    icon: '',
                    label: game.i18n.localize("LANCER.Settings.Cancel")
                }
            },
            default: "create"
        }).render(true);
    }

    /**
     * Создает быстрый макрос коммуникатора с возможностью ввода сообщения
     */
    static async createQuickCommunicatorMacro(characterName, portraitPath, soundPath, voiceoverPath, style, fontSize, fontFamily = null) {
        // Проверяем права пользователя
        if (!game.user.can('MACRO_SCRIPT')) {
            ui.notifications.warn(game.i18n.localize("LANCER.Settings.Warnings.CreateMacroTextPerm"));
            return;
        }

        // Сначала спрашиваем имя макроса
        new Dialog({
            title: game.i18n.localize("LANCER.Settings.CreateQuickMacroName"),
            content: `<div>
                <p>Введите имя для нового быстрого макроса:</p>
                <input type="text" id="quick-macro-name-input" value="${characterName} Quick" style="width: 100%;">
            </div>`,
            buttons: {
                create: {
                    icon: '',
                    label: game.i18n.localize("LANCER.Settings.Create"),
                    callback: (html) => {
                        const macroName = html[0].querySelector('#quick-macro-name-input').value.trim();
                        if (!macroName) {
                            ui.notifications.warn(game.i18n.localize("LANCER.Settings.Warnings.CreateMacroTextInt"));
                            return;
                        }
                        
                        // Проверяем уникальность имени макроса
                        if (game.macros.find(m => m.name === macroName)) {
                            ui.notifications.warn("Макрос с таким именем уже существует!");
                            return;
                        }

                        // Формируем команду для макроса
                        const commandText = `
                            // Быстрый макрос коммуникатора
                            let messageText = await new Promise((resolve) => {
                                new Dialog({
                                    title: "Сообщение для ${characterName}",
                                    content: \`<div><textarea id="quickMessageInput" rows="5" style="width:100%"></textarea></div>\`,
                                    buttons: {
                                        send: {
                                            icon: '',
                                            label: game.i18n.localize("LANCER.Settings.Send"),
                                            callback: (html) => {
                                                const msg = html[0].querySelector("#quickMessageInput").value;
                                                resolve(msg);
                                            }
                                        },
                                        cancel: {
                                            icon: '',
                                            label: game.i18n.localize("LANCER.Settings.Cancel"),
                                            callback: () => resolve(null)
                                        }
                                    },
                                    default: "send",
                                    close: () => resolve(null)
                                }).render(true);
                            });
                            // Если сообщение введено, отправляем его
                            if (messageText && messageText.trim()) {
                                game.modules.get('lancer-communicator').api.sendCommunicatorMessage(
                                    "${characterName}",
                                    "${portraitPath}",
                                    messageText,
                                    "${soundPath}",
									"${voiceoverPath}",
                                    "${style}",
                                    ${fontSize},
                                    "${fontFamily || ''}"
                                );
                            }
                        `;
                        
                        // Создаем макрос через современный API
                        Macro.create({
                            name: macroName,
                            type: "script",
                            command: commandText,
                            img: portraitPath
                        }).then(macro => {
                            ui.notifications.info(`Быстрый макрос "${macroName}" успешно создан!`);
                        }).catch(error => {
                            ui.notifications.error(`Ошибка создания макроса: ${error}`);
                            console.error(error);
                        });
                    }
                },
                cancel: {
                    icon: '',
                    label: game.i18n.localize("LANCER.Settings.Cancel")
                }
            },
            default: "create"
        }).render(true);
    }

    /**
     * Проверяет существование файла
     */
    static async _validateFile(path) {
        if (!path) return false;
        
        try {
            const response = await fetch(path, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.error(`File validation failed for ${path}:`, error);
            return false;
        }
    }
}

