class LancerCommunicator {
    static sendCommunicatorMessage(characterName, portraitPath, message, soundPath, style = 'green') {
        const messageData = {
            characterName: characterName,
            portrait: portraitPath,
            text: message,
            sound: soundPath || null,
            timestamp: Date.now(),
            senderId: game.user.id,
			style: style // Добавляем стиль
        };

        // Отправка с типом сообщения
        game.socket.emit('module.lancer-communicator', {
            type: 'showMessage',
            data: messageData
        });

        // Локальный показ
        this.showCommunicatorMessage(messageData);
    }

    static initSocketListeners() {
		console.log("Инициализация socket listeners");

		if (!game.socket) {
			console.error("Socket не доступен при инициализации!");
			return;
		}

		game.socket.on('module.lancer-communicator', (payload) => {
			console.log("Получено сообщение через socket:", payload);

			if (payload.type === 'showMessage') {
				// Убираем проверку senderId
				this.showCommunicatorMessage(payload.data);
			}
		});
	}

    static showCommunicatorMessage(messageData) {
		// Находим и полностью удаляем предыдущее сообщение
		const existingMessage = $('#lancer-communicator-message');
		if (existingMessage.length) {
			// Устанавливаем флаг прерывания для существующего сообщения
			const existingData = existingMessage.data('communicatorData');
			if (existingData) {
				existingData.isCancelled = true;
			}

			// Останавливаем звук
			const existingSound = existingMessage.data('typingSound');
			if (existingSound) {
				existingSound.pause();
				existingSound.currentTime = 0;
			}

			// Удаляем существующее сообщение
			existingMessage.remove();
		}

		const messageBox = $(`
			<div id="lancer-communicator-message" class="top-screen style-${messageData.style || 'green'}">
				<div class="communicator-container">
					<div class="portrait-container">
						<img src="${messageData.portrait}" class="portrait">
						<div class="character-name">${messageData.characterName}</div>
					</div>
					<div class="message-text"></div>
				</div>
			</div>
		`).appendTo('body');

		// Создаем звук
		const typingSound = messageData.sound ? new Audio(messageData.sound) : null;

		// Получаем настройки скорости
		const typingSpeed = game.settings.get('lancer-communicator', 'typingSpeed');
		const voiceVolume = game.settings.get('lancer-communicator', 'voiceVolume');

		let index = 0;
		const element = messageBox.find('.message-text');

		// НОВОЕ: Объект для хранения состояния
		const communicatorData = {
			isCancelled: false
		};

		// Сохраняем данные в элементе
		messageBox.data('communicatorData', communicatorData);
		messageBox.data('typingSound', typingSound);

		const typing = () => {
			// Проверяем флаг прерывания
			if (communicatorData.isCancelled) return;

			if (index < messageData.text.length) {
				// Добавление символа
				element.text(messageData.text.slice(0, index + 1).toUpperCase());
				
				// Воспроизведение голоса персонажа для каждого символа
				if (typingSound && messageData.text[index] !== ' ') {
					const voiceClone = typingSound.cloneNode();
					
					// Динамические вариации звука
					voiceClone.playbackRate = 0.9 + Math.random() * 0.2;
					
					// Флуктуация громкости
					voiceClone.volume = Math.max(0, Math.min(1, 
						voiceVolume * (0.9 + Math.random() * 0.2)
					));
					
					voiceClone.currentTime = 0;
					voiceClone.play().catch(e => console.error("Ошибка воспроизведения звука:", e));
				}
				
				// Случайная задержка в стиле Undertale (30-70 мс)
				const delay = Math.random() * 40 + 30;
				
				index++;
				setTimeout(typing, delay);
			} else {
				// Логика завершения печати
				setTimeout(() => {
					if (!communicatorData.isCancelled) {
						messageBox.addClass('collapsing');
						
						// Полная остановка звука
						if (typingSound) {
							typingSound.pause();
							typingSound.currentTime = 0;
						}
						
						setTimeout(() => {
							messageBox.remove();
						}, 500);
					}
				}, 10000);
			}
		};

		// Запускаем печать
		typing();

		// Обработчик прерывания
		messageBox.on('click', () => {
			// Устанавливаем флаг прерывания
			communicatorData.isCancelled = true;
			
			// Останавливаем звук
			if (typingSound) {
				typingSound.pause();
				typingSound.currentTime = 0;
			}
			
			// Показываем полный текст
			element.text(messageData.text.toUpperCase());
			
			// Быстрое закрытие
			messageBox.addClass('collapsing');
			setTimeout(() => messageBox.remove(), 500);
		});
	}

    static init() {		
		console.log("Инициализация LancerCommunicator");
	
        // Регистрация настроек
        game.settings.register('lancer-communicator', 'currentPortrait', {
            name: game.i18n.localize("LANCER.Settings.Portrait"),
            scope: 'world',
            config: false,
            type: String,
            default: ''
        });

        game.settings.register('lancer-communicator', 'currentMessage', {
            name: game.i18n.localize("LANCER.Settings.Message"),
            scope: 'world',
            config: false,
            type: String,
            default: ''
        });

        game.settings.register('lancer-communicator', 'currentSound', {
            name: game.i18n.localize("LANCER.Settings.DialingSound"),
            scope: 'world',
            config: false,
            type: String,
            default: ''
        });
		
		// Новые настройки для сохранения последнего выбора
		game.settings.register('lancer-communicator', 'lastPortrait', {
			name: game.i18n.localize("LANCER.Settings.LastSelectPortrait"),
			scope: 'world',
			config: false,
			type: String,
			default: ''
		});

		game.settings.register('lancer-communicator', 'lastSound', {
			name: game.i18n.localize("LANCER.Settings.LastSelectSound"),
			scope: 'world',
			config: false,
			type: String,
			default: ''
		});

		// Настройки скорости печати и звука
		game.settings.register('lancer-communicator', 'typingSpeed', {
			name: game.i18n.localize("LANCER.Settings.TypeSettings.TypingSpeed"),
			scope: 'world',
			config: true,
			type: Number,
			default: 50,
			range: {
				min: 10,
				max: 200,
				step: 10
			}
		});

		game.settings.register('lancer-communicator', 'voiceVolume', {
			name: game.i18n.localize("LANCER.Settings.TypeSettings.VoiceVolume"),
			scope: 'world',
			config: true,
			type: Number,
			default: 0.05,
			range: {
				min: 0,
				max: 1,
				step: 0.05
			}
		});
		
		game.settings.register('lancer-communicator', 'lastCharacterName', {	
			name: game.i18n.localize("LANCER.Settings.TypeSettings.LastCharacterName"),
			scope: 'world',
			config: false,
			type: String,
			default: ''
		});

        // Регистрация инструмента
		Hooks.on('renderSceneControls', (controls, html) => {
			// Проверяем, является ли текущий пользователь ГМ
			if (!game.user.isGM) return;

			const tokenToolPanel = html.find('#tools-panel-token');
			
			if (tokenToolPanel.length) {
				if (!tokenToolPanel.find('.lancer-communicator').length) {
					const communicatorButton = $(`
						<li class="scene-tool lancer-communicator" data-tool="communicator" title="${game.i18n.localize("LANCER.Settings.Communicator")}">
							<i class="fas fa-satellite-dish"></i>
						</li>
					`);

					communicatorButton.on('click', (event) => {
						event.preventDefault();
						this.openCommunicatorSettings();
					});

					tokenToolPanel.append(communicatorButton);
				}
			}
		});
		
		// Регистрация обработчика сообщений
		this.initSocketListeners();
    }
	
	static handleSocketMessage(payload) {
		console.log("Получено сообщение:", payload);

		// Проверяем структуру payload
		if (payload && payload.type === 'showMessage') {
			const messageData = payload.data;
			
			// Убираем проверку senderId, чтобы сообщение показывалось у всех
			this.showCommunicatorMessage(messageData);
		}
	}
	
	static createCommunicatorMacro(characterName, portraitPath, message, soundPath, style) {
		// Экранируем специальные символы в тексте сообщения
		const escapedCharacterName = characterName.replace(/"/g, '\\"');
		const escapedPortraitPath = portraitPath.replace(/"/g, '\\"');
		const escapedMessage = message.replace(/"/g, '\\"')
									   .replace(/\n/g, '\\n');
		const escapedSoundPath = (soundPath || '').replace(/"/g, '\\"');
		const escapedStyle = style.replace(/"/g, '\\"');

		const macroName = `Communicator: ${escapedCharacterName}`;
		
		Macro.create({
			name: macroName,
			type: 'script',
			scope: 'global',
			command: `
				if (game.modules.get('lancer-communicator')?.active) {
					game.modules.get('lancer-communicator').api.sendCommunicatorMessage(
						"${escapedCharacterName}", 
						"${escapedPortraitPath}", 
						\`${escapedMessage}\`, 
						"${escapedSoundPath}",
						"${escapedStyle}"
					);
				} else {
					ui.notifications.warn("Lancer Communicator module is not active");
				}
			`
		}).then(macro => {
			ui.notifications.info(`Macro "${macroName}" created successfully`);
		}).catch(error => {
			ui.notifications.error(`Error creating macro: ${error}`);
		});
	}
	
    static openCommunicatorSettings() {
		const lastPortrait = game.settings.get('lancer-communicator', 'lastPortrait');
		const lastSound = game.settings.get('lancer-communicator', 'lastSound');
		const lastCharacterName = game.settings.get('lancer-communicator', 'lastCharacterName');
		
        new Dialog({
            title: game.i18n.localize("LANCER.Settings.CommunicatorSettings"),
			content: `
				<form class="lancer-communicator-dialog">
					<div class="form-group">
						<label>${game.i18n.localize("LANCER.Settings.CharacterName")}</label>
						<input type="text" id="character-name" value="${lastCharacterName}" placeholder="${game.i18n.localize("LANCER.Settings.CharacterName")}">
					</div>
					<div class="form-group">
						<label>${game.i18n.localize("LANCER.Settings.Portrait")}</label>
						<div class="input-group">
							<input type="text" id="portrait-path" readonly placeholder="${game.i18n.localize("LANCER.Settings.SelectPortrait")}">
							<button type="button" id="select-portrait">${game.i18n.localize("LANCER.Settings.SelectPortrait")}</button>
						</div>
					</div>
					<div class="form-group">
						<label>${game.i18n.localize("LANCER.Settings.MessageText")}</label>
						<textarea id="message-input" rows="4" placeholder="${game.i18n.localize("LANCER.Settings.MessageText")}"></textarea>
					</div>
					<div class="form-group">
						<label>${game.i18n.localize("LANCER.Settings.SoundSelect")}</label>
						<div class="input-group">
							<input type="text" id="sound-path" value="${lastSound}" readonly placeholder="${game.i18n.localize("LANCER.Settings.SelectSound")}">
							<button type="button" id="select-sound">${game.i18n.localize("LANCER.Settings.SelectSound")}</button>
							<button type="button" id="clear-sound">${game.i18n.localize("LANCER.Settings.ClearSound")}</button>
						</div>
					</div>
					<div class="form-group">
						<label>${game.i18n.localize("LANCER.Settings.MessageStyle")}</label>
						<select id="message-style">
							<option value="green">${game.i18n.localize("LANCER.Settings.MSGStyleGr")}</option>
							<option value="blue">${game.i18n.localize("LANCER.Settings.MSGStyleBl")}</option>
							<option value="yellow">${game.i18n.localize("LANCER.Settings.MSGStyleYe")}</option>
							<option value="red">${game.i18n.localize("LANCER.Settings.MSGStyleRe")}</option>
							<option value="damaged">${game.i18n.localize("LANCER.Settings.MSGStyleDm")}</option>
						</select>
						<div id="style-preview" class="style-preview"></div>
					</div>
				</form>
			`,
            buttons: {
                send: {
                    label: game.i18n.localize("LANCER.Settings.Send"),
                    callback: () => {
                        const characterName = document.getElementById('character-name').value;
						const portraitPath = document.getElementById('portrait-path').value;
						const message = document.getElementById('message-input').value;
						const soundPath = document.getElementById('sound-path').value;
						const style = document.getElementById('message-style').value;

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
						
						// Сохраняем последние выбранные значения
						game.settings.set('lancer-communicator', 'lastPortrait', portraitPath);
						game.settings.set('lancer-communicator', 'lastSound', soundPath);
						game.settings.set('lancer-communicator', 'lastCharacterName', characterName);

						this.sendCommunicatorMessage(characterName, portraitPath, message, soundPath, style);
                    }
                },
				macro: {
					label: game.i18n.localize("LANCER.Settings.CreateMacro"),
					callback: () => {
						const characterName = document.getElementById('character-name').value;
						const portraitPath = document.getElementById('portrait-path').value;
						const message = document.getElementById('message-input').value;
						const soundPath = document.getElementById('sound-path').value;
						const style = document.getElementById('message-style').value;

						// Валидация (как в методе send)
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
						this.createCommunicatorMacro(characterName, portraitPath, message, soundPath, style);
					}
				},
                cancel: {
                    label: game.i18n.localize("LANCER.Settings.Cancel")
                }
            },
            render: (html) => {
                // Обработчик выбора портрета
				const styleSelect = html.find('#message-style');
				const preview = html.find('#style-preview');
				const lastPortrait = game.user.getFlag('lancer-communicator', 'lastPortrait');
				if (lastPortrait) {
					html.find('#portrait-path').val(lastPortrait);
				}
					
                html.find('#select-portrait').on('click', () => {
					const fp = new FilePicker({
						type: 'image',
						current: '',
						callback: (path) => {
							html.find('#portrait-path').val(path);
							
							// Сохранение через флаги пользователя
							game.user.setFlag('lancer-communicator', 'lastPortrait', path)
								.then(() => {
									console.log("Портрет сохранен через флаг");
								})
								.catch(error => {
									console.error("Ошибка сохранения флага:", error);
								});
						}
					});
					fp.browse();
				});

                // Обработчик выбора звука
                html.find('#select-sound').on('click', () => {
                    const fp = new FilePicker({
                        type: 'audio',
                        current: '',
                        callback: (path) => {
                            html.find('#sound-path').val(path);
                        }
                    });
                    fp.browse();
                });
				
				// Обработчик очистки звука
				html.find('#clear-sound').on('click', () => {
					html.find('#sound-path').val('');
				});
				
				preview.css({
					'margin-top': '10px',
					'padding': '10px',
					'border': '1px solid',
					'display': 'flex',
					'align-items': 'center'
				});
				
				function updatePreview() {
					const selectedStyle = styleSelect.val();
					
					// Очищаем превью
					preview.empty();
					
					// Создаем контейнер с динамическими стилями
					const previewContent = $(`
						<div class="style-preview-content" style="
							border: 2px solid;
							padding: 10px;
							display: flex;
							align-items: center;
							width: 100%;
							background-color: rgba(0,0,0,0.05);
						">
							<div class="preview-avatar" style="
								width: 50px; 
								height: 50px; 
								border-radius: 50%;
								margin-right: 10px;
								background: #ccc;
							"></div>
							<div style="flex-grow: 1;">
								<div class="preview-name" style="
									font-weight: bold;
									margin-bottom: 5px;
								">Character Name</div>
								<div class="preview-text">Message Preview</div>
							</div>
						</div>
					`);

					// Применяем стили в зависимости от выбранного варианта
					switch(selectedStyle) {
						case 'green':
							previewContent.css({
								'border-color': 'green',
								'background-color': 'rgba(0, 255, 0, 0.1)'
							});
							break;
						case 'blue':
							previewContent.css({
								'border-color': 'blue', 
								'background-color': 'rgba(0, 0, 255, 0.1)'
							});
							break;
						case 'yellow':
							previewContent.css({
								'border-color': 'yellow',
								'background-color': 'rgba(255, 255, 0, 0.1)'
							});
							break;
						case 'red':
							previewContent.css({
								'border-color': 'red',
								'background-color': 'rgba(255, 0, 0, 0.1)'
							});
							break;
						case 'damaged':
							previewContent.css({
								'border-color': 'darkred',
								'background-color': 'rgba(139, 0, 0, 0.1)'
							});
							break;
					}

					// Добавляем в превью
					preview.append(previewContent);
				}
				
				styleSelect.on('change', updatePreview);
				updatePreview(); // Первичная инициализация
            }
        }).render(true);
    }
}

// Инициализация
Hooks.once('init', () => {
    game.modules.get('lancer-communicator').api = {
        sendCommunicatorMessage: LancerCommunicator.sendCommunicatorMessage.bind(LancerCommunicator)
    };
});

Hooks.once('ready', () => {
    console.log("Инициализация LancerCommunicator");
    LancerCommunicator.init();
});