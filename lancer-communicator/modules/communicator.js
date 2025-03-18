/**
 * Основной класс Lancer Communicator
 * Управляет показом сообщений и диалоговым интерфейсом
 */
export class LancerCommunicator {
    
    /**
     * Инициализирует слушателей сокетов для коммуникации между клиентами
     */
    static initSocketListeners() {
        if (!game.socket) {
            console.error("Lancer Communicator | Socket not available during initialization!");
            return;
        }

        game.socket.on('module.lancer-communicator', (payload) => {
            if (payload?.type === 'showMessage') {
                this.showCommunicatorMessage(payload.data);
            }
        });
    }

    /**
     * Открывает диалоговое окно настроек коммуникатора
     */
    static openCommunicatorSettings() {
        const selectedToken = canvas.tokens.controlled[0];

        let lastPortrait = game.settings.get('lancer-communicator', 'lastPortrait');

        let lastCharacterName = game.settings.get('lancer-communicator', 'lastCharacterName');
        if (selectedToken) {
            lastCharacterName = selectedToken.name; 
        }
        
        const lastSound = game.settings.get('lancer-communicator', 'lastSound');
        const lastStyle = game.settings.get('lancer-communicator', 'lastMessageStyle');
        const fontSize = game.settings.get('lancer-communicator', 'messageFontSize');
        
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
                        <label>${game.i18n.localize("LANCER.Settings.FontFamily") || "Font Family"}</label>
                        <select id="font-family">
                            <option value="MOSCOW2024" ${game.settings.get('lancer-communicator', 'fontFamily') === 'MOSCOW2024' ? 'selected' : ''}>MOSCOW2024</option>
                            <option value="Undertale" ${game.settings.get('lancer-communicator', 'fontFamily') === 'Undertale' ? 'selected' : ''}>Undertale</option>
                            <option value="TeletactileRus" ${game.settings.get('lancer-communicator', 'fontFamily') === 'TeletactileRus' ? 'selected' : ''}>TeletactileRus</option>
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
                        // Используем современный API для доступа к форме
                        const formElement = html[0].querySelector('form');
                        const characterName = formElement.querySelector('#character-name').value;
                        const portraitPath = formElement.querySelector('#portrait-path').value;
                        const message = formElement.querySelector('#message-input').value;
                        const soundPath = formElement.querySelector('#sound-path').value;
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
                        this.sendCommunicatorMessage(characterName, portraitPath, message, soundPath, style, fontSize, fontFamily);
                    }
                },
                macro: {
                    icon: '',
                    label: game.i18n.localize("LANCER.Settings.CreateMacro"),
                    callback: (html) => {
                        const formElement = html[0].querySelector('form');
                        const characterName = formElement.querySelector('#character-name').value;
                        const portraitPath = formElement.querySelector('#portrait-path').value;
                        const message = formElement.querySelector('#message-input').value;
                        const soundPath = formElement.querySelector('#sound-path').value;
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

                        // Создаем макрос
                        this.createCommunicatorMacro(characterName, portraitPath, message, soundPath, style, fontSize);
                    }
                },
                quickMacro: {
                    icon: '',
                    label: game.i18n.localize("LANCER.Settings.CreateQuickMacro"),
                    callback: (html) => {
                        const formElement = html[0].querySelector('form');
                        const characterName = formElement.querySelector('#character-name').value;
                        const portraitPath = formElement.querySelector('#portrait-path').value;
                        const soundPath = formElement.querySelector('#sound-path').value;
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

                        // Создаем быстрый макрос
                        this.createQuickCommunicatorMacro(characterName, portraitPath, soundPath, style, fontSize);
                    }
                },
                cancel: {
                    icon: '',
                    label: game.i18n.localize("LANCER.Settings.Cancel")
                }
            },
            default: 'send',
            render: (html) => {
                // Современный подход к доступу к DOM
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
                        callback: (path) => {
                            portraitPathInput.value = path;
                        }
                    }).browse();
                });

                // Настраиваем обработчики для выбора звука
                const soundPathInput = dialog.querySelector('#sound-path');
                
                dialog.querySelector('#select-sound').addEventListener('click', () => {
                    new FilePicker({
                        type: 'audio',
                        current: soundPathInput.value,
                        callback: (path) => {
                            soundPathInput.value = path;
                        }
                    }).browse();
                });
                
                // Обработчик для очистки выбранного звука
                dialog.querySelector('#clear-sound').addEventListener('click', () => {
                    soundPathInput.value = '';
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
    static sendCommunicatorMessage(characterName, portraitPath, message, soundPath = '', style = 'green', fontSize = 14, fontFamily = null) {
        if (!fontFamily) {
            fontFamily = game.settings.get('lancer-communicator', 'fontFamily') || 'MOSCOW2024';
        }
		
        // Создаем объект с данными сообщения
        const messageData = {
            characterName,
            portraitPath,
            message,
            soundPath,
            style,
            fontSize,
            fontFamily
        };
        
        // Показываем сообщение локально
        this.showCommunicatorMessage(messageData);
        
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
		const { characterName, portraitPath, message, soundPath, style, fontSize, fontFamily } = data;
		
		// Проверяем и удаляем существующее сообщение
		const existingMessage = document.getElementById('lancer-communicator-message');
		if (existingMessage) {
			existingMessage.classList.add('collapsing');
			setTimeout(() => existingMessage.remove(), 500);
			return new Promise(resolve => setTimeout(() => {
				this.showCommunicatorMessage(data).then(resolve);
			}, 550));
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
		const effectiveFontFamily = (fontFamily || game.settings.get('lancer-communicator', 'fontFamily') || 'MOSCOW2024');
		messageContainer.style.setProperty('--message-font', effectiveFontFamily);
		
		// Загружаем звук заранее, если он указан
		let soundPreloaded = false;
		if (soundPath) {
			try {
                // Предзагрузка звука
                const audio = new Audio();
                audio.src = soundPath;
                await new Promise((resolve, reject) => {
                    audio.addEventListener('canplaythrough', resolve);
                    audio.addEventListener('error', reject);
                    // Таймаут если загрузка зависнет
                    setTimeout(resolve, 2000);
                });
                soundPreloaded = true;
            } catch (error) {
                console.error('Lancer Communicator | Error preloading sound:', error);
                soundPreloaded = false;
            }
        }

        // Эффект печатной машинки
        let i = 0;
        const typingSpeed = game.settings.get('lancer-communicator', 'typingSpeed') || 130;

        return new Promise((resolve) => {
            // Функция для добавления символов с задержкой
            const typeWriter = () => {
                if (i < message.length) {
                    const currentChar = message.charAt(i);
                    const nextChar = i + 1 < message.length ? message.charAt(i + 1) : '';
                    const prevChar = i > 0 ? message.charAt(i - 1) : '';
                    
                    i++;
                    
                    // Проверяем, заглавная ли текущая буква
                    const isUpperCase = /[A-ZА-Я]/.test(currentChar);
                    
                    // Проверка на начало предложения или строки (после точки, ! ? или в начале текста)
                    const isStartOfSentence = i === 1 || /[\.\!\?\n]/.test(prevChar);
					
                    // Проверяем, заглавная ли следующая буква - признак КАПСЛОКА
                    const nextIsUpperCase = /[A-ZА-Я]/.test(nextChar);
                    
                    // Проверяем, строчная ли следующая буква
                    const nextIsLowerCase = /[a-zа-я]/.test(nextChar);
                    
                    // Анимируем букву если:
                    // 1. Это заглавная буква И
                    // 2. (следующая буква тоже заглавная ИЛИ это конец слова/предложения) И
                    // 3. Это НЕ начало предложения (или это начало предложения, но следующая тоже заглавная)
                    if (isUpperCase && (nextIsUpperCase || /[\s\.,!?;:-]/.test(nextChar) || nextChar === '') && 
                        (!isStartOfSentence || nextIsUpperCase)) {
                        const span = document.createElement('span');
                        span.textContent = currentChar;
                        span.classList.add('lcm-shake-text');
                        messageText.appendChild(span);
                    } else {
                        // Обычные символы или заглавные буквы в начале предложения без КАПСЛОКА
                        const textNode = document.createTextNode(currentChar);
                        messageText.appendChild(textNode);
                    }
                    
                    // Воспроизводим звук на каждый символ, кроме пробелов и знаков препинания
                    if (soundPath && soundPreloaded && !/[\s\.,!?;:-]/.test(currentChar)) {
                        const soundInstance = new Audio(soundPath);
                        const volume = game.settings.get('lancer-communicator', 'voiceVolume') || 0.05;
                        
                        // Случайно изменяем скорость воспроизведения для эффекта изменения высоты тона
                        // Диапазон от 0.85 до 1.15 даст хороший эффект Undertale
                        const randomPitch = 0.85 + (Math.random() * 0.3);
                        soundInstance.playbackRate = randomPitch;
                        soundInstance.volume = volume;
                        
                        // Воспроизводим звук
                        soundInstance.play().catch(error => {
                            console.error('Lancer Communicator | Error playing sound instance:', error);
                        });
                    
                        // Останавливаем звук через небольшое время для короткого "бип" эффекта
                        setTimeout(() => {
                            soundInstance.pause();
                            soundInstance.currentTime = 0;
                        }, 100);
                    }
                    
                    // Определяем задержку до следующего символа
                    // Для знаков препинания делаем большую паузу
                    const delay = /[\.,!?;:]/.test(currentChar) 
                        ? 350 - typingSpeed 
                        : 200 - typingSpeed;
                    
                    setTimeout(typeWriter, delay);
                } else {
                    // Текст полностью напечатан
                    setTimeout(() => {
                        // Удаляем сообщение через заданное время
                        messageContainer.classList.add('collapsing');
                        setTimeout(() => {
                            messageContainer.remove();
                            resolve();
                        }, 500);
                    }, 5000); // Сообщение будет видно 5 секунд после печати
                }
            };
            
            // Запускаем эффект печати
            typeWriter();
        });
}

    /**
     * Создает макрос для отправки сообщения коммуникатора
     */
    static createCommunicatorMacro(characterName, portraitPath, message, soundPath, style, fontSize, fontFamily = null) {
        // Проверяем, может ли пользователь создавать макросы
        if (!game.user.can('MACRO_SCRIPT')) {
            ui.notifications.warn("У вас нет разрешения создавать макросы скриптов");
            return;
        }
        
        // Форматируем параметры для макроса
        const macroName = `${characterName} Message`;
        const commandText = `
            // Созданный макрос коммуникатора Lancer
            game.modules.get('lancer-communicator').api.sendCommunicatorMessage(
                "${characterName}",
                "${portraitPath}",
                "${message.replace(/"/g, '\\"')}",
                "${soundPath}",
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

    /**
     * Создает быстрый макрос коммуникатора с возможностью ввода сообщения
     */
    static createQuickCommunicatorMacro(characterName, portraitPath, soundPath, style, fontSize, fontFamily = null) {
        // Проверяем права пользователя
        if (!game.user.can('MACRO_SCRIPT')) {
            ui.notifications.warn("У вас нет разрешения создавать макросы скриптов");
            return;
        }
        
        // Формируем имя и команду для макроса
        const macroName = `${characterName} Quick`;
        
        const commandText = `
            // Быстрый макрос коммуникатора
            let messageText = await new Promise((resolve) => {
                new Dialog({
                    title: "Сообщение для ${characterName}",
                    content: \`<div><textarea id="quickMessageInput" rows="5" style="width:100%"></textarea></div>\`,
                    buttons: {
                        send: {
                            icon: '',
                            label: "Отправить",
                            callback: (html) => {
                                const msg = html[0].querySelector("#quickMessageInput").value;
                                resolve(msg);
                            }
                        },
                        cancel: {
                            icon: '',
                            label: "Отмена",
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
                    "${style}",
                    ${fontSize},
                    fontFamily = null
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
}
