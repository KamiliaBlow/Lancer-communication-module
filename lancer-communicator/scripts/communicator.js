class LancerCommunicator {
    static sendCommunicatorMessage(characterName, portraitPath, message, soundPath, style = 'green', fontSize = null) {
        const actualFontSize = fontSize ?? game.settings.get('lancer-communicator', 'messageFontSize');
        
        const messageData = {
            characterName,
            portrait: portraitPath,
            text: message,
            sound: soundPath || null,
            timestamp: Date.now(),
            senderId: game.user.id,
            style,
            fontSize: actualFontSize
        };

        game.socket.emit('module.lancer-communicator', {
            type: 'showMessage',
            data: messageData
        });

        this.showCommunicatorMessage(messageData);
    }

    static initSocketListeners() {
        if (!game.socket) {
            console.error("Socket не доступен при инициализации!");
            return;
        }

        game.socket.on('module.lancer-communicator', (payload) => {
            if (payload?.type === 'showMessage') {
                this.showCommunicatorMessage(payload.data);
            }
        });
    }

    static showCommunicatorMessage(messageData) {
        const fontSize = messageData.fontSize || game.settings.get('lancer-communicator', 'messageFontSize');
        
        document.documentElement.style.setProperty('--message-font-size', `${fontSize}px`);
        
        const $body = $('body');
        const existingMessage = $('#lancer-communicator-message');

        if (existingMessage.length) {
            const communicatorData = existingMessage.data('communicatorData');
            communicatorData.isCancelled = true;

            const typingSound = existingMessage.data('typingSound');
            if (typingSound) {
                typingSound.pause();
                typingSound.currentTime = 0;
            }

            existingMessage.remove();
        }

        const createMessageElement = () => `
            <div id="lancer-communicator-message" 
                 class="top-screen lcm-style-${messageData.style || 'green'}" 
                 style="--message-font-size: ${fontSize}px;">
                <div class="lcm-communicator-container">
                    <div class="lcm-portrait-container">
                        <img src="${messageData.portrait}" class="lcm-portrait">
                        <div class="lcm-character-name">${messageData.characterName}</div>
                    </div>
                    <div class="lcm-message-text" style="font-size: ${fontSize}px;">${messageData.text}</div>
                </div>
            </div>
        `;

        const messageBox = $(createMessageElement()).appendTo($body);
        const $messageText = messageBox.find('.lcm-message-text');
		
		messageBox.addClass(`style-${messageData.style}`);
        
        $messageText.css({
            'font-size': `${fontSize}px`,
            '--message-font-size': `${fontSize}px`
        });
        $messageText[0].style.setProperty('font-size', `${fontSize}px`, 'important');

        const typingSound = messageData.sound ? new Audio(messageData.sound) : null;
        const typingSpeed = game.settings.get('lancer-communicator', 'typingSpeed');
        const voiceVolume = game.settings.get('lancer-communicator', 'voiceVolume');

        const communicatorData = { isCancelled: false };
        messageBox.data('communicatorData', communicatorData);
        messageBox.data('typingSound', typingSound);

        const typing = () => {
            if (communicatorData.isCancelled) return;

            const currentText = messageData.text.slice(0, index + 1).toUpperCase();
            $messageText.text(currentText);

            if (typingSound && messageData.text[index] !== ' ') {
                const voiceClone = typingSound.cloneNode();
                voiceClone.playbackRate = 0.9 + Math.random() * 0.2;
                voiceClone.volume = Math.max(0, Math.min(1, voiceVolume * (0.9 + Math.random() * 0.2)));
                voiceClone.currentTime = 0;
                voiceClone.play().catch(console.error);
            }

            index++;
            if (index < messageData.text.length) {
				setTimeout(typing, Math.max(10, 200 - typingSpeed));
            } else {
                setTimeout(() => {
                    if (!communicatorData.isCancelled) {
                        messageBox.addClass('collapsing');
                        if (typingSound) {
                            typingSound.pause();
                            typingSound.currentTime = 0;
                        }
                        setTimeout(() => messageBox.remove(), 500);
                    }
                }, 10000);
            }
        };

        messageBox.on('click', () => {
            communicatorData.isCancelled = true;
            if (typingSound) {
                typingSound.pause();
                typingSound.currentTime = 0;
            }
            $messageText.text(messageData.text.toUpperCase());
            messageBox.addClass('collapsing');
            setTimeout(() => messageBox.remove(), 500);
        });

        let index = 0;
        typing();

        return messageBox[0];
    }

    static init() {
        this.registerSettings();

        Hooks.on('renderSceneControls', (controls, html) => {
            if (!game.user.isGM) return;

            const tokenToolPanel = html.find('#tools-panel-token');
            
            if (tokenToolPanel.length && !tokenToolPanel.find('.lancer-communicator').length) {
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
        });
        
        this.initSocketListeners();
    }
	
	static registerSettings() {
		// Проверка существования настройки перед регистрацией
		if (!game.settings.get('lancer-communicator', 'messageFontSize', { tryEnsure: true })) {
			game.settings.register('lancer-communicator', 'messageFontSize', {
				name: game.i18n.localize('LANCER.Settings.FontSize'),
				scope: 'world',
				config: true,
				type: Number,
				default: 14,
				range: {
					min: 10,
					max: 32,
					step: 1
				},
				onChange: (value) => {
					console.log('Font size changed to:', value);
					document.documentElement.style.setProperty('--message-font-size', `${value}px`);
				}
			});
		}
		
		game.settings.register('lancer-communicator', 'communicatorFont', {
			name: game.i18n.localize("LANCER.Settings.FontSelect"),
			scope: 'world',
			config: true,
			type: String, 
			requiresReload: true,
			default: 'MOSCOW2024', 
			choices: {
				'MOSCOW2024': 'MOSCOW2024',
				'Undertale': 'Undertale',
				'TeletactileRus': 'TeletactileRus'
			}
		});
		
		const settings = [
			{ key: 'currentPortrait', type: String, default: '' },
			{ key: 'currentMessage', type: String, default: '' },
			{ key: 'currentSound', type: String, default: '' },
			{ key: 'lastPortrait', type: String, default: '' },
			{ key: 'lastSound', type: String, default: '' },
			{ key: 'lastCharacterName', type: String, default: '' },
			{ key: 'lastMessageStyle', type: String, default: 'green', config: false },
			{ 
				key: 'typingSpeed', 
				type: Number, 
				default: 130, 
				config: true,
				range: { min: 10, max: 200, step: 10 }
			},
			{ 
				key: 'voiceVolume', 
				type: Number, 
				default: 0.05, 
				config: true,
				range: { min: 0, max: 1, step: 0.05 }
			}
		];

		settings.forEach(setting => {
			// Пропускаем уже зарегистрированную настройку messageFontSize
			if (setting.key !== 'messageFontSize' && setting.key !== 'communicatorFont') {
				game.settings.register('lancer-communicator', setting.key, {
					name: game.i18n.localize(`LANCER.Settings.${setting.key}`),
					scope: 'world',
					config: setting.config || false,
					type: setting.type,
					default: setting.default,
					range: setting.range
				});
			}
		});
	}
	
	static handleSocketMessage(payload) {
		console.log("Получено сообщение:", payload);

		// Проверяем структуру payload
		if (payload && payload.type === 'showMessage') {
			const messageData = payload.data;
			
			// Принудительно устанавливаем размер шрифта из настроек, если не передан
			if (!messageData.fontSize) {
				messageData.fontSize = game.settings.get('lancer-communicator', 'messageFontSize');
			}
			
			// Убираем проверку senderId, чтобы сообщение показывалось у всех
			this.showCommunicatorMessage(messageData);
		}
	}
	
	static createCommunicatorMacro(characterName, portraitPath, message, soundPath, style, fontSize) {
		// Экранируем специальные символы в тексте сообщения
		const escapedCharacterName = characterName.replace(/"/g, '\\"');
		const escapedPortraitPath = portraitPath.replace(/"/g, '\\"');
		const escapedMessage = message.replace(/"/g, '\\"')
									   .replace(/\n/g, '\\n');
		const escapedSoundPath = (soundPath || '').replace(/"/g, '\\"');
		const escapedStyle = style.replace(/"/g, '\\"');

		const macroName = `With text: ${escapedCharacterName}`;
		
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
						"${escapedStyle}",
						${fontSize}
					);
				} else {
					ui.notifications.warn("Lancer Communicator module is not active");
				}
			`
		}).then(macro => {
			ui.notifications.info(`With text "${macroName}" created successfully`);
		}).catch(error => {
			ui.notifications.error(`Error creating macro: ${error}`);
		});
	}
	
	static createQuickCommunicatorMacro(characterName, portraitPath, soundPath, style, fontSize) {
		const escapedCharacterName = characterName.replace(/"/g, '\\"');
		const escapedPortraitPath = portraitPath.replace(/"/g, '\\"');
		const escapedSoundPath = (soundPath || '').replace(/"/g, '\\"');
		const escapedStyle = style.replace(/"/g, '\\"');

		const macroName = `Character: ${escapedCharacterName}`;
		
		Macro.create({
			name: macroName,
			type: 'script',
			scope: 'global',
			command: `
				if (game.modules.get('lancer-communicator')?.active) {
					const messageText = await Dialog.prompt({
						title: "Character - ${escapedCharacterName}",
						content: '<textarea style="width:100%; min-height:150px;"></textarea>',
						label: "Send Message",
						callback: (html) => html.find('textarea').val()
					});

					if (messageText) {
						game.modules.get('lancer-communicator').api.sendCommunicatorMessage(
							"${escapedCharacterName}", 
							"${escapedPortraitPath}", 
							messageText, 
							"${escapedSoundPath}",
							"${escapedStyle}",
							${fontSize}
						);
					}
				} else {
					ui.notifications.warn("Lancer Communicator module is not active");
				}
			`
		}).then(macro => {
			ui.notifications.info(`Char Macro "${macroName}" created successfully`);
		}).catch(error => {
			ui.notifications.error(`Error creating quick macro: ${error}`);
		});
	}
	
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
						<input type="text" id="character-name" value="${lastCharacterName}" placeholder="${game.i18n.localize("LANCER.Settings.CharacterName")}">
					</div>
					<div class="lcm-form-group">
						<label>${game.i18n.localize("LANCER.Settings.Portrait")}</label>
						<div class="lcm-input-group">
							<input type="text" id="portrait-path" readonly placeholder="${game.i18n.localize("LANCER.Settings.SelectPortrait")}">
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
							<input type="text" id="sound-path" value="${lastSound}" readonly placeholder="${game.i18n.localize("LANCER.Settings.SelectSound")}">
							<button type="button" id="select-sound">${game.i18n.localize("LANCER.Settings.SelectSound")}</button>
							<button type="button" id="clear-sound">${game.i18n.localize("LANCER.Settings.ClearSound")}</button>
						</div>
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
						const fontSize = document.getElementById('font-size-input').value; // Получаем размер шрифта

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

						this.sendCommunicatorMessage(characterName, portraitPath, message, soundPath, style, Number(fontSize));
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
						const fontSize = document.getElementById('font-size-input').value;

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
						this.createCommunicatorMacro(characterName, portraitPath, message, soundPath, style, Number(fontSize));
					}
				},
				quickMacro: {
					label: game.i18n.localize("LANCER.Settings.CreateQuickMacro"),
					callback: () => {
						const characterName = document.getElementById('character-name').value;
						const portraitPath = document.getElementById('portrait-path').value;
						const soundPath = document.getElementById('sound-path').value;
						const style = document.getElementById('message-style').value;
						const fontSize = document.getElementById('font-size-input').value;

						// Валидация
						if (!characterName.trim()) {
							ui.notifications.warn(game.i18n.localize("LANCER.Settings.Warnings.NoCharacterName"));
							return false;
						}

						if (!portraitPath) {
							ui.notifications.warn(game.i18n.localize("LANCER.Settings.Warnings.NoPortrait"));
							return false;
						}

						// Создаем квик-макрос
						this.createQuickCommunicatorMacro(
							characterName, 
							portraitPath, 
							soundPath, 
							style, 
							Number(fontSize)
						);
					}
				},
                cancel: {
                    label: game.i18n.localize("LANCER.Settings.Cancel")
                }
            },
            render: (html) => {
                // Обработчик выбора портрета
				const fontSizeInput = html.find('#font-size-input');
				const fontSizeDisplay = html.find('#font-size-display');
				const styleSelect = html.find('#message-style');
				const preview = html.find('#style-preview');
				
				const lastPortrait = game.user.getFlag('lancer-communicator', 'lastPortrait');
				if (lastPortrait) {
					html.find('#portrait-path').val(lastPortrait);
				}
				
				const selectedToken = canvas.tokens.controlled[0]; // Берем первый выбранный токен
				if (selectedToken) {
					const tokenPortrait = selectedToken.document.texture.src;
					html.find('#portrait-path').val(tokenPortrait);
				}
				
				const currentFont = game.settings.get('lancer-communicator', 'communicatorFont');
					
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
				
				html.find('#message-font').val(currentFont);

				html.find('#message-font').on('change', () => {
					const selectedFont = html.find('#message-font').val();
					game.settings.set('lancer-communicator', 'communicatorFont', selectedFont);
					
					// Обновляем CSS-переменную шрифта
					document.documentElement.style.setProperty('--message-font', selectedFont);
				});
				
				preview.css({
					'margin-top': '10px',
					'padding': '10px',
					'border': '1px solid',
					'display': 'flex',
					'align-items': 'center'
				});
				
				// Устанавливаем последний использованный стиль
				styleSelect.val(lastStyle);

				// Сохранение стиля при изменении
				styleSelect.on('change', () => {
					const selectedStyle = styleSelect.val();
					game.settings.set('lancer-communicator', 'lastMessageStyle', selectedStyle);
				});
				
				// Получаем текущий размер шрифта из настроек
				const currentFontSize = game.settings.get('lancer-communicator', 'messageFontSize');
				
				// Устанавливаем значение инпута
				fontSizeInput.val(currentFontSize);
				fontSizeDisplay.text(`${currentFontSize}px`);

				fontSizeInput.on('input', () => {
					const size = Number(fontSizeInput.val());
					console.log('Selected font size:', size);
					
					// Обновляем глобальную CSS-переменную
					document.documentElement.style.setProperty('--message-font-size', `${size}px`);
					
					// Принудительное обновление отображения
					fontSizeDisplay.text(`${size}px`);
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
            },
			close: (html) => {
				const fontSize = Number(html.find('#font-size-input').val());
    
				console.log('Saving font size:', fontSize);
				
				// Сохраняем размер шрифта с принудительным приведением к числу
				game.settings.set('lancer-communicator', 'messageFontSize', fontSize);
				
				// Обновляем глобальную CSS-переменную
				document.documentElement.style.setProperty('--message-font-size', `${fontSize}px`);
			}
        }).render(true);
    }
}

// Инициализация
Hooks.once('init', () => {
	game.settings.register('lancer-communicator', 'communicatorFont', {
        name: game.i18n.localize("LANCER.Settings.FontSelect"),
        scope: 'world',
        config: true,
        type: String, 
        default: 'MOSCOW2024', 
        choices: {
            'MOSCOW2024': 'MOSCOW2024',
            'Undertale': 'Undertale',
			'TeletactileRus': 'TeletactileRus'
        }
    });
	
    game.settings.register('lancer-communicator', 'messageFontSize', {
        name: game.i18n.localize('LANCER.Settings.FontSize'),
        scope: 'world',
        config: true,
        type: Number,
        default: 14,
        range: {
            min: 10,
            max: 32,
            step: 1
        }
    });

    // Используем статический метод напрямую
    game.modules.get('lancer-communicator').api = {
        sendCommunicatorMessage: (characterName, portraitPath, message, soundPath, style, fontSize) => 
            LancerCommunicator.sendCommunicatorMessage(
                characterName, 
                portraitPath, 
                message, 
                soundPath, 
                style, 
                fontSize
            )
    };
});

Hooks.once('ready', () => {
    try {
        const fontSize = game.settings.get('lancer-communicator', 'messageFontSize');
        const fontFamily = game.settings.get('lancer-communicator', 'communicatorFont');
        
        document.documentElement.style.setProperty('--message-font-size', `${fontSize}px`);
        document.documentElement.style.setProperty('--message-font', fontFamily);
    } catch (error) {
        console.error("Ошибка получения настроек:", error);
        document.documentElement.style.setProperty('--message-font-size', '14px');
        document.documentElement.style.setProperty('--message-font', 'MOSCOW2024');
    }
    
    LancerCommunicator.init();
});