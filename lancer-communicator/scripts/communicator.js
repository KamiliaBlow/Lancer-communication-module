class LancerCommunicator {
    static sendCommunicatorMessage(characterName, portraitPath, message, soundPath) {
        // Создаем объект с данными сообщения ПРЯМО СЕЙЧАС
        const messageData = {
			characterName: characterName,
            portrait: portraitPath,
            text: message,
            sound: soundPath || null,
            timestamp: Date.now()
        };

        // Используем socket для мгновенной отправки
        game.socket.emit('module.lancer-communicator', {
            type: 'showMessage',
            data: messageData
        });

        // Локальный показ
        this.showCommunicatorMessage(messageData);
    }

    static initSocketListeners() {
        game.socket.on('module.lancer-communicator', (payload) => {
            if (payload.type === 'showMessage') {
                this.showCommunicatorMessage(payload.data);
            }
        });
    }

    static showCommunicatorMessage(messageData) {
		// Находим и полностью удаляем предыдущее сообщение
		const existingMessage = $('#lancer-communicator-message');
		if (existingMessage.length) {
			// Принудительно останавливаем все процессы предыдущего сообщения
			const existingInterval = existingMessage.data('typingInterval');
			const existingSound = existingMessage.data('typingSound');
			
			if (existingInterval) {
				clearInterval(existingInterval);
			}
			
			if (existingSound) {
				existingSound.pause();
				existingSound.currentTime = 0;
			}
			
			existingMessage.remove();
		}

		const messageBox = $(`
			<div id="lancer-communicator-message" class="top-screen">
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

		// Сохраняем звук и интервал в данных элемента
		messageBox.data('typingSound', typingSound);

		let index = 0;
		const typingInterval = setInterval(() => {
			if (index < messageData.text.length) {
				const displayText = messageData.text.slice(0, index + 1).toUpperCase();
				
				messageBox.find('.message-text').text(displayText);
				
				if (typingSound && index % 2 === 0) {
					typingSound.currentTime = 0;
					typingSound.volume = voiceVolume;
					typingSound.play().catch(e => console.error("Ошибка воспроизведения звука:", e));
				}
				
				index++;
			} else {
				// Полная остановка при завершении печати
				clearInterval(typingInterval);
				
				setTimeout(() => {
					messageBox.addClass('collapsing');
					
					// Полная остановка звука
					if (typingSound) {
						typingSound.pause();
						typingSound.currentTime = 0;
					}
					
					setTimeout(() => {
						messageBox.remove();
					}, 500);
				}, 10000);
			}
		}, typingSpeed);

		// Сохраняем интервал в данных элемента
		messageBox.data('typingInterval', typingInterval);

		// Добавляем возможность прерывания сообщения
		messageBox.on('click', () => {
			// Немедленная остановка всех процессов
			clearInterval(typingInterval);
			
			if (typingSound) {
				typingSound.pause();
				typingSound.currentTime = 0;
			}
			
			// Показываем полный текст
			messageBox.find('.message-text').text(messageData.text.toUpperCase());
			
			// Быстрое закрытие
			messageBox.addClass('collapsing');
			setTimeout(() => messageBox.remove(), 500);
		});
	}

    static init() {
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

						this.sendCommunicatorMessage(characterName, portraitPath, message, soundPath);
                    }
                },
                cancel: {
                    label: game.i18n.localize("LANCER.Settings.Cancel")
                }
            },
            render: (html) => {
                // Обработчик выбора портрета
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
            }
        }).render(true);
    }
}

// Инициализация
Hooks.once('ready', () => {
    LancerCommunicator.init();
    LancerCommunicator.initSocketListeners();
});
