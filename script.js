document.addEventListener('DOMContentLoaded', function() {
    // Данные о тарифах
    const prices = {
        weekday: {
            regular: { '1': 690, '3': 1690, 'full': 2190 },
            discount: { '1': 450, '3': 1390, 'full': 1990 }
        },
        weekend: {
            regular: { '1': 990, '3': 1990, 'full': 2990 },
            discount: { '1': 550, '3': 1550, 'full': 2490 }
        }
    };

    // DOM элементы
    const elements = {
        childrenCount: document.getElementById('children-count'),
        tariff: document.getElementById('tariff'),
        dayType: document.getElementById('day-type'),
        multiChild: document.getElementById('multi-child'),
        birthday: document.getElementById('birthday'),
        pascal: document.getElementById('pascal'),
        totalPrice: document.getElementById('total-price'),
        calculationDetails: document.getElementById('calculation-details'),
        checkoutBtn: document.getElementById('checkout-btn'),
        checkoutAmount: document.getElementById('checkout-amount'),
        mobileMenuBtn: document.querySelector('.mobile-menu-btn'),
        nav: document.querySelector('.nav'),
        getCardBtn: document.getElementById('heroCardBtn'),
        registerModal: document.getElementById('registerModal'),
        cardInfoModal: document.getElementById('cardInfoModal'),
        qrZoomModal: document.getElementById('qrZoomModal'),
        paymentModal: document.getElementById('paymentModal'),
        registerForm: document.getElementById('registerForm'),
        loyaltyCardBody: document.getElementById('cardBody'),
        qrCodeContainer: document.getElementById('qrCodeContainer'),
        largeQrCodeContainer: document.getElementById('largeQrCodeContainer'),
        qrPreview: document.getElementById('qrPreview'),
        cardPhone: document.getElementById('cardPhone'),
        cardChildren: document.getElementById('cardChildren'),
        cardPoints: document.getElementById('cardPoints'),
        refreshQR: document.getElementById('refreshQR'),
        paymentInfo: document.getElementById('paymentInfo'),
        paymentSuccess: document.getElementById('paymentSuccess'),
        processPayment: document.getElementById('processPayment'),
        paymentAmount: document.getElementById('paymentAmount'),
        realCardNumber: document.getElementById('realCardNumber'),
        cardHolderName: document.getElementById('cardHolderName'),
        cardExpiryDate: document.getElementById('cardExpiryDate')
    };

    // Текущая сумма для оплаты
    let currentTotalPrice = 0;

    // Функция для генерации QR-кода
    function generateQRCode(text, containerId, size = 200) {
        const container = document.getElementById(containerId);
        if (!container || !text) return;
        
        // Очищаем контейнер
        container.innerHTML = '';
        
        try {
            // Создаем QR-код
            const qr = qrcode(0, 'M');
            qr.addData(text);
            qr.make();
            
            // Создаем canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Устанавливаем размер
            canvas.width = size;
            canvas.height = size;
            
            // Получаем данные QR-кода
            const moduleCount = qr.getModuleCount();
            const tileSize = size / moduleCount;
            
            // Рисуем QR-код
            for (let row = 0; row < moduleCount; row++) {
                for (let col = 0; col < moduleCount; col++) {
                    ctx.fillStyle = qr.isDark(row, col) ? '#5e35b1' : '#ffffff';
                    ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
                }
            }
            
            // Добавляем canvas в контейнер
            container.appendChild(canvas);
            
            return true;
        } catch (error) {
            console.error('Ошибка генерации QR-кода:', error);
            container.innerHTML = '<div style="color: red; text-align: center; padding: 20px;">QR-код</div>';
            return false;
        }
    }

    // Класс для управления картой лояльности
    class LoyaltyCard {
        constructor() {
            this.cardData = null;
            this.loadCardData();
            this.init();
        }

        loadCardData() {
            try {
                const savedData = localStorage.getItem('magicCastleCard');
                if (savedData) {
                    this.cardData = JSON.parse(savedData);
                    console.log('Карта загружена из localStorage:', this.cardData);
                    
                    // Устанавливаем значения по умолчанию для старых карт
                    if (!this.cardData.cardHolder) {
                        this.cardData.cardHolder = 'Гость';
                    }
                    if (!this.cardData.expiryDate) {
                        this.cardData.expiryDate = '12/27';
                    }
                    if (!this.cardData.cardNumber) {
                        this.cardData.cardNumber = 'VC' + Date.now().toString().slice(-8);
                    }
                }
            } catch (e) {
                console.error('Ошибка загрузки карты:', e);
                this.cardData = null;
            }
        }

        saveCardData() {
            if (this.cardData) {
                localStorage.setItem('magicCastleCard', JSON.stringify(this.cardData));
                console.log('Карта сохранена в localStorage:', this.cardData);
            }
        }

        init() {
            this.updateCardDisplay();
            this.setupEventListeners();
        }

        setupEventListeners() {
            // Кнопка получения карты
            if (elements.getCardBtn) {
                elements.getCardBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (this.cardData) {
                        this.showCardInfo();
                    } else {
                        this.showRegisterForm();
                    }
                });
            }

            // Форма регистрации
            if (elements.registerForm) {
                elements.registerForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const phone = document.getElementById('regPhone').value;
                    const children = parseInt(document.getElementById('regChildren').value) || 1;
                    
                    if (phone && phone.replace(/\D/g, '').length >= 10) {
                        this.registerCard(phone, children);
                        alert('Карта успешно зарегистрирована! Вам начислено 500 приветственных баллов.');
                    } else {
                        alert('Пожалуйста, введите корректный номер телефона (минимум 10 цифр)');
                    }
                });
            }

            // Кнопка обновления QR-кода
            if (elements.refreshQR) {
                elements.refreshQR.addEventListener('click', () => {
                    this.generateQR(true);
                    alert('QR-код обновлен!');
                });
            }

            // Закрытие модальных окон
            document.querySelectorAll('.close-modal').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (elements.registerModal) elements.registerModal.style.display = 'none';
                    if (elements.cardInfoModal) elements.cardInfoModal.style.display = 'none';
                    if (elements.qrZoomModal) elements.qrZoomModal.style.display = 'none';
                    if (elements.paymentModal) {
                        elements.paymentModal.style.display = 'none';
                        // Сбрасываем форму оплаты при закрытии
                        const paymentForm = document.getElementById('paymentForm');
                        if (paymentForm) paymentForm.style.display = 'block';
                        if (elements.paymentSuccess) elements.paymentSuccess.style.display = 'none';
                    }
                });
            });

            // Клик вне модального окна
            window.addEventListener('click', (e) => {
                if (elements.registerModal && e.target === elements.registerModal) {
                    elements.registerModal.style.display = 'none';
                }
                if (elements.cardInfoModal && e.target === elements.cardInfoModal) {
                    elements.cardInfoModal.style.display = 'none';
                }
                if (elements.qrZoomModal && e.target === elements.qrZoomModal) {
                    elements.qrZoomModal.style.display = 'none';
                }
                if (elements.paymentModal && e.target === elements.paymentModal) {
                    elements.paymentModal.style.display = 'none';
                    const paymentForm = document.getElementById('paymentForm');
                    if (paymentForm) paymentForm.style.display = 'block';
                    if (elements.paymentSuccess) elements.paymentSuccess.style.display = 'none';
                }
            });

            // Клик по QR-коду для увеличения
            document.addEventListener('click', (e) => {
                if (e.target.closest('.clickable-qr')) {
                    this.showLargeQR();
                }
            });
        }

        showRegisterForm() {
            if (elements.registerModal) {
                elements.registerModal.style.display = 'block';
                document.getElementById('regPhone').focus();
            }
        }

        showCardInfo() {
            this.updateCardInfo();
            this.updateRealCard();
            if (elements.cardInfoModal) {
                elements.cardInfoModal.style.display = 'block';
                this.generateQR();
            }
        }

        showLargeQR() {
            if (!this.cardData) return;
            
            const now = Date.now();
            const qrData = JSON.stringify({
                cardNumber: this.cardData.cardNumber,
                phone: this.cardData.phone,
                timestamp: now,
                points: this.cardData.points || 500
            });
            
            generateQRCode(qrData, 'largeQrCodeContainer', 250);
            
            if (elements.qrZoomModal) {
                elements.qrZoomModal.style.display = 'block';
            }
        }

        registerCard(phone, children) {
            this.cardData = {
                phone: this.formatPhone(phone),
                children: children,
                points: 500,
                registered: new Date().toISOString(),
                lastQRUpdate: Date.now(),
                cardNumber: 'VC' + Date.now().toString().slice(-8),
                cardHolder: 'Гость',
                expiryDate: '12/27'
            };
            
            this.saveCardData();
            
            if (elements.registerModal) {
                elements.registerModal.style.display = 'none';
            }
            
            this.updateCardDisplay();
            this.showCardInfo();
            
            // Автоматически ставим галочку "многодетная семья" если детей > 2
            if (children > 2 && elements.multiChild) {
                elements.multiChild.checked = true;
                calculatePrice();
            }
        }

        formatPhone(phone) {
            const cleaned = phone.replace(/\D/g, '');
            if (cleaned.length === 11) {
                return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
            } else if (cleaned.length === 10) {
                return `+7 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8)}`;
            }
            return phone;
        }

        updateCardDisplay() {
            if (!elements.loyaltyCardBody) {
                console.error('Элемент cardBody не найден');
                return;
            }
            
            if (this.cardData) {
                const formattedPhone = this.formatPhone(this.cardData.phone);
                
                elements.loyaltyCardBody.innerHTML = `
                    <div class="card-body-content">
                        <div class="card-details">
                            <h4>Ваша карта активна</h4>
                            <p><i class="fas fa-phone"></i> ${formattedPhone}</p>
                            <p><i class="fas fa-child"></i> ${this.cardData.children} детей</p>
                            <div class="bonus-display">${this.cardData.points || 500}</div>
                            <p>баллов на счету</p>
                            <button class="btn btn-secondary" id="showCardBtn">
                                <i class="fas fa-eye"></i> Показать карту
                            </button>
                        </div>
                    </div>
                `;
                
                // Вешаем обработчик на кнопку
                setTimeout(() => {
                    const showCardBtn = document.getElementById('showCardBtn');
                    if (showCardBtn) {
                        showCardBtn.addEventListener('click', () => {
                            this.showCardInfo();
                        });
                    }
                }, 100);
                
                // Обновляем превью QR-кода
                this.generateQRPreview();
            } else {
                elements.loyaltyCardBody.innerHTML = `
                    <div class="card-body-content">
                        <div class="card-details">
                            <h4>Получите Волшебный ключ</h4>
                            <p>Присоединяйтесь к нашей программе лояльности и получите:</p>
                            <ul style="text-align: left; margin: 16px 0; padding-left: 20px; font-size: 0.9rem;">
                                <li>500 приветственных баллов</li>
                                <li>Скидку 15% каждую среду</li>
                                <li>Бонусы на день рождения</li>
                                <li>Автоматический расчет скидок</li>
                            </ul>
                            <button class="btn btn-primary" id="registerCardBtn">
                                <i class="fas fa-key"></i> Получить карту
                            </button>
                        </div>
                    </div>
                `;
                
                // Вешаем обработчик на кнопку
                setTimeout(() => {
                    const registerCardBtn = document.getElementById('registerCardBtn');
                    if (registerCardBtn) {
                        registerCardBtn.addEventListener('click', () => {
                            this.showRegisterForm();
                        });
                    }
                }, 100);
            }
        }

        updateCardInfo() {
            if (this.cardData) {
                if (elements.cardPhone) {
                    elements.cardPhone.textContent = this.cardData.phone;
                }
                if (elements.cardChildren) {
                    elements.cardChildren.textContent = this.cardData.children;
                }
                if (elements.cardPoints) {
                    elements.cardPoints.textContent = this.cardData.points || 500;
                }
            }
        }

        updateRealCard() {
            if (this.cardData) {
                // Форматируем номер карты для отображения
                const cardNum = this.cardData.cardNumber || 'VC' + Date.now().toString().slice(-8);
                const formattedCardNum = cardNum.replace(/(.{4})/g, '$1 ').trim();
                
                if (elements.realCardNumber) {
                    elements.realCardNumber.textContent = formattedCardNum;
                }
                if (elements.cardHolderName) {
                    elements.cardHolderName.textContent = this.cardData.cardHolder || 'Гость';
                }
                if (elements.cardExpiryDate) {
                    elements.cardExpiryDate.textContent = this.cardData.expiryDate || '12/27';
                }
            }
        }

        generateQR(forceRefresh = false) {
            if (!this.cardData || !elements.qrCodeContainer) {
                console.error('Нет данных карты или контейнера QR-кода');
                return;
            }
            
            const now = Date.now();
            const lastUpdate = this.cardData.lastQRUpdate || 0;
            
            if (forceRefresh || now - lastUpdate > (4 * 60 * 60 * 1000)) {
                this.cardData.lastQRUpdate = now;
                this.saveCardData();
            }
            
            const qrData = JSON.stringify({
                cardNumber: this.cardData.cardNumber,
                phone: this.cardData.phone,
                timestamp: this.cardData.lastQRUpdate,
                points: this.cardData.points || 500
            });
            
            generateQRCode(qrData, 'qrCodeContainer', 120);
        }

        generateQRPreview() {
            if (!this.cardData || !elements.qrPreview) return;
            
            const qrData = JSON.stringify({
                cardNumber: this.cardData.cardNumber,
                phone: this.cardData.phone
            });
            
            generateQRCode(qrData, 'qrPreview', 80);
        }

        addPoints(amount) {
            if (!this.cardData) return false;
            this.cardData.points = (this.cardData.points || 0) + Math.round(amount);
            this.saveCardData();
            this.updateCardDisplay();
            this.updateCardInfo();
            return true;
        }

        getPoints() {
            return this.cardData ? this.cardData.points || 0 : 0;
        }
    }

    // Инициализация карты
    const loyaltyCard = new LoyaltyCard();

    // Расчет стоимости (автоматический)
    function calculatePrice() {
        if (!elements.childrenCount || !elements.tariff || !elements.dayType) return;
        
        const childrenCount = parseInt(elements.childrenCount.value) || 1;
        const tariff = elements.tariff.value;
        const dayType = elements.dayType.value;
        const isMultiChild = elements.multiChild ? elements.multiChild.checked : false;
        const isBirthday = elements.birthday ? elements.birthday.checked : false;
        const isPascal = elements.pascal ? elements.pascal.checked : false;
        
        let basePricePerChild;
        
        if (isMultiChild) {
            basePricePerChild = prices[dayType].discount[tariff];
        } else {
            basePricePerChild = prices[dayType].regular[tariff];
        }
        
        let totalPrice = basePricePerChild * childrenCount;
        let details = [];
        
        let tariffName;
        switch(tariff) {
            case '1': tariffName = '1 час'; break;
            case '3': tariffName = '3 часа'; break;
            case 'full': tariffName = 'Безлимит на весь день'; break;
        }
        
        details.push(`${childrenCount} ребёнок(а) × ${tariffName}: ${basePricePerChild.toLocaleString('ru-RU')} ₽`);
        
        if (isBirthday) {
            const birthdayDiscount = totalPrice * 0.3;
            details.push(`Скидка на день рождения 30%: -${birthdayDiscount.toLocaleString('ru-RU')} ₽`);
            totalPrice -= birthdayDiscount;
        }
        
        if (isPascal) {
            const pascalDiscount = totalPrice * 0.15;
            details.push(`Скидка "Паскальная среда" 15%: -${pascalDiscount.toLocaleString('ru-RU')} ₽`);
            totalPrice -= pascalDiscount;
        }
        
        totalPrice = Math.max(0, Math.round(totalPrice));
        currentTotalPrice = totalPrice;
        
        if (elements.totalPrice) {
            elements.totalPrice.textContent = `${totalPrice.toLocaleString('ru-RU')} ₽`;
        }
        
        if (elements.calculationDetails) {
            if (details.length > 1) {
                elements.calculationDetails.innerHTML = details.join('<br>');
            } else {
                elements.calculationDetails.textContent = details[0] || '';
            }
        }
        
        if (elements.checkoutAmount) {
            elements.checkoutAmount.textContent = totalPrice.toLocaleString('ru-RU');
        }
        
        if (elements.paymentAmount) {
            elements.paymentAmount.textContent = totalPrice.toLocaleString('ru-RU');
        }
        
        // Активируем/деактивируем кнопку оформления
        if (elements.checkoutBtn) {
            if (totalPrice > 0) {
                elements.checkoutBtn.disabled = false;
                elements.checkoutBtn.innerHTML = `<i class="fas fa-ticket-alt"></i> Оформить билет за ${totalPrice.toLocaleString('ru-RU')} ₽`;
            } else {
                elements.checkoutBtn.disabled = true;
                elements.checkoutBtn.innerHTML = `<i class="fas fa-ticket-alt"></i> Выберите параметры`;
            }
        }
    }
    
    // Обработчики для автоматического расчета
    if (elements.childrenCount) {
        elements.childrenCount.addEventListener('input', calculatePrice);
    }
    
    if (elements.tariff) {
        elements.tariff.addEventListener('change', calculatePrice);
    }
    
    if (elements.dayType) {
        elements.dayType.addEventListener('change', calculatePrice);
    }
    
    if (elements.multiChild) {
        elements.multiChild.addEventListener('change', calculatePrice);
    }
    
    if (elements.birthday) {
        elements.birthday.addEventListener('change', calculatePrice);
    }
    
    if (elements.pascal) {
        elements.pascal.addEventListener('change', calculatePrice);
    }
    
    // Автоматически ставим галочку "многодетная семья" если в карте указано >2 детей
    if (loyaltyCard.cardData && loyaltyCard.cardData.children > 2 && elements.multiChild) {
        elements.multiChild.checked = true;
    }
    
    // Оформление билета
    if (elements.checkoutBtn) {
        elements.checkoutBtn.addEventListener('click', () => {
            if (currentTotalPrice <= 0) {
                alert('Пожалуйста, выберите параметры для расчета стоимости');
                return;
            }
            
            showPaymentModal();
        });
    }
    
    function showPaymentModal() {
        const paymentInfo = document.getElementById('paymentInfo');
        const childrenCount = parseInt(elements.childrenCount.value) || 1;
        const tariff = elements.tariff.value;
        const dayType = elements.dayType.value === 'weekday' ? 'Будний день' : 'Выходной';
        
        let tariffName;
        switch(tariff) {
            case '1': tariffName = '1 час'; break;
            case '3': tariffName = '3 часа'; break;
            case 'full': tariffName = 'Безлимит на весь день'; break;
        }
        
        const isBirthday = elements.birthday ? elements.birthday.checked : false;
        const isPascal = elements.pascal ? elements.pascal.checked : false;
        
        let details = `<div style="font-size: 0.95rem;">
            <p><strong>Детей:</strong> ${childrenCount}</p>
            <p><strong>Тариф:</strong> ${tariffName}</p>
            <p><strong>День:</strong> ${dayType}</p>`;
        
        if (isBirthday) details += '<p><i class="fas fa-check-circle" style="color: var(--accent);"></i> Скидка на день рождения</p>';
        if (isPascal) details += '<p><i class="fas fa-check-circle" style="color: var(--accent);"></i> Скидка Паскальной среды</p>';
        details += '</div>';
        
        paymentInfo.innerHTML = `
            <h4 style="margin-bottom: 12px; font-size: 1.1rem;">Детали заказа:</h4>
            ${details}
            <div style="background: var(--light); padding: 16px; border-radius: var(--border-radius-sm); margin-top: 16px;">
                <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: bold;">
                    <span>Итого:</span>
                    <span>${currentTotalPrice.toLocaleString('ru-RU')} ₽</span>
                </div>
            </div>
        `;
        
        // Автозаполнение телефона из карты если есть
        if (loyaltyCard.cardData) {
            const phoneInput = document.getElementById('paymentPhone');
            if (phoneInput) {
                // Убираем форматирование для ввода
                const cleanPhone = loyaltyCard.cardData.phone.replace(/\D/g, '');
                phoneInput.value = cleanPhone;
            }
        }
        
        if (elements.paymentModal) {
            elements.paymentModal.style.display = 'block';
            const paymentForm = document.getElementById('paymentForm');
            if (paymentForm) paymentForm.style.display = 'block';
            if (elements.paymentSuccess) elements.paymentSuccess.style.display = 'none';
        }
    }
    
    // Обработка оплаты
    if (elements.processPayment) {
        elements.processPayment.addEventListener('click', processPayment);
    }
    
    function processPayment() {
        const phone = document.getElementById('paymentPhone')?.value || '';
        const cardName = document.getElementById('cardName')?.value || '';
        const cardNumber = document.getElementById('cardNumberInput')?.value || '';
        const cardExpiry = document.getElementById('cardExpiry')?.value || '';
        const cardCVC = document.getElementById('cardCVC')?.value || '';
        
        if (!phone || !cardName || !cardNumber || !cardExpiry || !cardCVC) {
            alert('Пожалуйста, заполните все поля для оплаты');
            return;
        }
        
        if (phone.replace(/\D/g, '').length < 10) {
            alert('Пожалуйста, введите корректный номер телефона');
            return;
        }
        
        if (cardNumber.replace(/\s/g, '').length < 16) {
            alert('Пожалуйста, введите корректный номер карты');
            return;
        }
        
        if (cardCVC.length !== 3) {
            alert('CVC код должен содержать 3 цифры');
            return;
        }
        
        // Имитация обработки платежа
        elements.processPayment.disabled = true;
        elements.processPayment.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обработка платежа...';
        
        setTimeout(() => {
            // Успешная оплата
            const paymentForm = document.getElementById('paymentForm');
            if (paymentForm) paymentForm.style.display = 'none';
            if (elements.paymentSuccess) elements.paymentSuccess.style.display = 'block';
            
            const bonusAdded = document.getElementById('bonusAdded');
            const pointsToAdd = Math.round(currentTotalPrice * 0.1);
            
            // Начисляем баллы только если есть карта
            if (loyaltyCard.cardData) {
                const added = loyaltyCard.addPoints(pointsToAdd);
                if (added && bonusAdded) {
                    bonusAdded.innerHTML = `
                        <h4 style="font-size: 1.1rem;"><i class="fas fa-gift"></i> Баллы начислены!</h4>
                        <p style="font-size: 0.95rem;">На вашу карту "Волшебный ключ" начислено <strong>${pointsToAdd} баллов</strong> (10% от суммы покупки).</p>
                        <p style="font-size: 0.95rem;">Теперь на вашем счету: <strong>${loyaltyCard.getPoints()} баллов</strong></p>
                    `;
                }
            } else {
                if (bonusAdded) {
                    bonusAdded.innerHTML = `
                        <h4 style="font-size: 1.1rem;"><i class="fas fa-info-circle"></i> Получите больше выгоды!</h4>
                        <p style="font-size: 0.95rem;">Оформите карту "Волшебный ключ" и получайте 10% баллов с каждой покупки.</p>
                        <button class="btn btn-secondary btn-block" id="getCardFromPayment">
                            <i class="fas fa-key"></i> Получить карту
                        </button>
                    `;
                    
                    // Добавляем обработчик для кнопки
                    setTimeout(() => {
                        const getCardBtn = document.getElementById('getCardFromPayment');
                        if (getCardBtn) {
                            getCardBtn.addEventListener('click', () => {
                                if (elements.paymentModal) {
                                    elements.paymentModal.style.display = 'none';
                                    loyaltyCard.showRegisterForm();
                                }
                            });
                        }
                    }, 100);
                }
            }
            
            // Сбрасываем форму
            setTimeout(() => {
                elements.processPayment.disabled = false;
                elements.processPayment.innerHTML = '<i class="fas fa-lock"></i> Оплатить';
                
                // Закрываем модальное окно через 3 секунды
                setTimeout(() => {
                    if (elements.paymentModal) {
                        elements.paymentModal.style.display = 'none';
                        const paymentForm = document.getElementById('paymentForm');
                        if (paymentForm) paymentForm.style.display = 'block';
                        if (elements.paymentSuccess) elements.paymentSuccess.style.display = 'none';
                        
                        // Сбрасываем форму оплаты
                        const cardNameInput = document.getElementById('cardName');
                        const cardNumberInput = document.getElementById('cardNumberInput');
                        const cardExpiryInput = document.getElementById('cardExpiry');
                        const cardCVCInput = document.getElementById('cardCVC');
                        
                        if (cardNameInput) cardNameInput.value = '';
                        if (cardNumberInput) cardNumberInput.value = '';
                        if (cardExpiryInput) cardExpiryInput.value = '';
                        if (cardCVCInput) cardCVCInput.value = '';
                        
                        alert('Билет успешно оформлен! QR-код будет отправлен на ваш телефон. Приятного посещения!');
                    }
                }, 3000);
            }, 1000);
        }, 2000);
    }
    
    // Форматирование номера карты
    const cardNumberInput = document.getElementById('cardNumberInput');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
            let formatted = '';
            
            for (let i = 0; i < value.length && i < 16; i++) {
                if (i > 0 && i % 4 === 0) {
                    formatted += ' ';
                }
                formatted += value[i];
            }
            
            e.target.value = formatted;
        });
    }
    
    // Форматирование срока действия карты
    const cardExpiryInput = document.getElementById('cardExpiry');
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                e.target.value = value.slice(0, 2) + '/' + value.slice(2, 4);
            } else {
                e.target.value = value;
            }
        });
    }
    
    // Мобильное меню
    if (elements.mobileMenuBtn && elements.nav) {
        elements.mobileMenuBtn.addEventListener('click', function() {
            elements.nav.classList.toggle('active');
        });
    }
    
    // Закрытие меню при клике на ссылку
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768 && elements.nav) {
                elements.nav.classList.remove('active');
            }
        });
    });
    
    // Плавная прокрутка
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') return;
            
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Динамическое обновление CTA в зависимости от дня недели
    function updateCTABasedOnTime() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        
        if (dayOfWeek === 3) {
            const heroTitle = document.querySelector('.hero-title');
            const heroSubtitle = document.querySelector('.hero-subtitle');
            
            if (heroTitle && heroSubtitle) {
                heroTitle.textContent = 'Сегодня Паскальная Среда!';
                heroSubtitle.innerHTML = 'Специальная скидка <strong>15%</strong> для держателей карты «Волшебный ключ». Успейте воспользоваться!';
                if (elements.pascal) {
                    elements.pascal.checked = true;
                    calculatePrice();
                }
            }
        }
    }
    
    updateCTABasedOnTime();
    calculatePrice(); // Первоначальный расчет
    
    // Автоматическое обновление QR-кода каждые 4 часа
    setInterval(() => {
        if (loyaltyCard.cardData) {
            loyaltyCard.generateQR();
        }
    }, 4 * 60 * 60 * 1000);
    
    // Анимация появления элементов при прокрутке
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(section);
    });
    
    // Закрытие модальных окон по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (elements.registerModal) elements.registerModal.style.display = 'none';
            if (elements.cardInfoModal) elements.cardInfoModal.style.display = 'none';
            if (elements.qrZoomModal) elements.qrZoomModal.style.display = 'none';
            if (elements.paymentModal) {
                elements.paymentModal.style.display = 'none';
                const paymentForm = document.getElementById('paymentForm');
                if (paymentForm) paymentForm.style.display = 'block';
                if (elements.paymentSuccess) elements.paymentSuccess.style.display = 'none';
            }
        }
    });
    
    // Оптимизация для мобильных устройств
    function optimizeForMobile() {
        // Уменьшаем размер шрифтов на очень маленьких экранах
        if (window.innerWidth < 400) {
            document.documentElement.style.fontSize = '14px';
        } else {
            document.documentElement.style.fontSize = '16px';
        }
    }
    
    optimizeForMobile();
    window.addEventListener('resize', optimizeForMobile);
    
    // Предотвращение масштабирования на мобильных устройствах
    document.addEventListener('touchstart', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    console.log('Сайт полностью загружен и готов к работе!');
});