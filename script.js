document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('digitalRainCanvas');
    const ctx = canvas.getContext('2d');
    const carImageInput = document.getElementById('carImageInput');
    const carNameInput = document.getElementById('carName');
    const carYearInput = document.getElementById('carYear');
    const carMileageInput = document.getElementById('carMileage');
    const carTransmissionInput = document.getElementById('carTransmission');
    const carFuelInput = document.getElementById('carFuel');
    const carColorInput = document.getElementById('carColor');
    const carCityInput = document.getElementById('carCity');
    const carConditionInput = document.getElementById('carCondition');
    const carPriceInput = document.getElementById('carPrice');
    const carDescriptionInput = document.getElementById('carDescription');
    const processButton = document.getElementById('processButton');
    const base64OutputDiv = document.getElementById('base64Output');
    const metadataOutputDiv = document.querySelector('.metadata-output');
    const finalMetadataOutputDiv = document.getElementById('finalMetadataOutput');
    const downloadMetadataLink = document.getElementById('downloadMetadataLink');

    const exploreButton = document.getElementById('exploreButton');
    const mintedCarsModal = document.getElementById('mintedCarsModal');
    const carTokensContainer = document.getElementById('carTokensContainer');

    const infoButton = document.getElementById('infoButton');
    const infoModal = document.getElementById('infoModal');

    let drops;
    const FONT_SIZE = 16;
    const CHARACTERS = 'ｦｱ-ﾝ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,;:!?%&*+-=<>()[]{}@#$^~';

    function openModal(modal) {
        modal.classList.add('active');
    }

    function closeModal(modal) {
        modal.classList.remove('active');
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drops = [];
        const columns = Math.floor(canvas.width / FONT_SIZE);
        for (let i = 0; i < columns; i++) {
            drops[i] = 1;
        }
    }

    function drawDigitalRain() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff00';
        ctx.font = `${FONT_SIZE}px 'Courier New', Courier, monospace`;

        for (let i = 0; i < drops.length; i++) {
            const charIndex = Math.floor(Math.random() * CHARACTERS.length);
            const character = CHARACTERS.charAt(charIndex);
            const x = i * FONT_SIZE;
            const y = drops[i] * FONT_SIZE;
            ctx.fillText(character, x, y);

            if (y > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }

    function imageToBase64WithFormatting(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fullDataUrl = e.target.result;
                const parts = fullDataUrl.split(',');
                if (parts.length < 2) {
                    return reject(new Error('استخراج رشته Base64 از فایل ممکن نبود.'));
                }
                const base64String = parts[1];
                const mimeType = parts[0].split(':')[1].split(';')[0];
                const fileExtension = mimeType.split('/')[1];

                let formattedBase64 = '';
                const segmentLength = 313;
                for (let i = 0; i < base64String.length; i += segmentLength) {
                    let segment = base64String.substring(i, i + segmentLength);
                    formattedBase64 += segment;
                    if (i + segmentLength < base64String.length) {
                        formattedBase64 += '*';
                    }
                }
                resolve({ formatted: formattedBase64, mimeType, fileExtension });
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    }

    function constructFinalMetadata(formattedBase64, mimeType, fileExtension, carName, carPrice, carDescription, carYear, carMileage, carTransmission, carFuel, carColor, carCity, carCondition, originalImageFileName) {
        const tokenId = `token_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const listingName = `${carName || 'خودروی نامشخص'} - لیست شده`;
        const imageUrl = `data:${mimeType};base64,${formattedBase64}`;

        return {
            tokenId,
            name: listingName,
            description: carDescription || 'خودرویی برای فروش لیست شده است.',
            image: imageUrl,
            price: parseFloat(carPrice) || 0,
            vehicleDetails: {
                model: carName || 'ناشناخته',
                year: carYear || 'نامشخص',
                mileage: carMileage || 'نامشخص',
                transmission: carTransmission || 'نامشخص',
                fuel: carFuel || 'نامشخص',
                color: carColor || 'نامشخص',
                city: carCity || 'نامشخص',
                condition: carCondition || 'نامشخص',
                imageFormat: fileExtension || 'نامشخص'
            },
            attributes: [
                { trait_type: 'مدل خودرو', value: carName || 'ناشناخته' },
                { trait_type: 'سال ساخت', value: carYear || 'نامشخص' },
                { trait_type: 'کارکرد', value: carMileage ? `${Number(carMileage).toLocaleString('fa-IR')} کیلومتر` : 'نامشخص' },
                { trait_type: 'گیربکس', value: carTransmission || 'نامشخص' },
                { trait_type: 'نوع سوخت', value: carFuel || 'نامشخص' },
                { trait_type: 'رنگ', value: carColor || 'نامشخص' },
                { trait_type: 'شهر', value: carCity || 'نامشخص' },
                { trait_type: 'وضعیت', value: carCondition || 'نامشخص' },
                { trait_type: 'قیمت لیست شده', value: `${parseInt(carPrice || 0).toLocaleString('fa-IR')} تومان` },
                { trait_type: 'تصویر اصلی', value: originalImageFileName },
                { trait_type: 'نوع فرمت', value: 'Base64 سفارشی + جداکننده‌ها' }
            ]
        };
    }

    processButton.addEventListener('click', async () => {
        const file = carImageInput.files[0];
        const carName = carNameInput.value.trim();
        const carPrice = carPriceInput.value;
        const carDescription = carDescriptionInput.value.trim();
        const carYear = carYearInput.value.trim();
        const carMileage = carMileageInput.value.trim();
        const carTransmission = carTransmissionInput.value;
        const carFuel = carFuelInput.value;
        const carColor = carColorInput.value.trim();
        const carCity = carCityInput.value.trim();
        const carCondition = carConditionInput.value;

        if (!file) {
            base64OutputDiv.innerHTML = '<strong>لطفاً ابتدا تصویر خودرو را انتخاب کنید!</strong>';
            base64OutputDiv.style.display = 'block';
            metadataOutputDiv.style.display = 'none';
            return;
        }

        base64OutputDiv.innerHTML = 'درحال پردازش تصویر...';
        base64OutputDiv.style.display = 'block';
        metadataOutputDiv.style.display = 'none';
        downloadMetadataLink.style.display = 'none';

        try {
            const { formatted: formattedBase64, mimeType, fileExtension } = await imageToBase64WithFormatting(file);
            const snippet = formattedBase64.substring(0, 200) + (formattedBase64.length > 200 ? '...' : '');
            base64OutputDiv.innerHTML = `<strong>Base64 فرمت شده (قطعه):</strong><br>${snippet}<br><small>فایل اصلی: ${file.name}</small><br><small>نوع MIME: ${mimeType}</small>`;
            base64OutputDiv.style.display = 'block';

            const finalMetadata = constructFinalMetadata(formattedBase64, mimeType, fileExtension, carName, carPrice, carDescription, carYear, carMileage, carTransmission, carFuel, carColor, carCity, carCondition, file.name);
            const finalMetadataString = JSON.stringify(finalMetadata, null, 2);

            finalMetadataOutputDiv.innerHTML = `<pre>${finalMetadataString}</pre>`;
            metadataOutputDiv.style.display = 'block';

            const blob = new Blob([finalMetadataString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            downloadMetadataLink.href = url;
            downloadMetadataLink.download = `car_listing_${finalMetadata.tokenId.split('_')[1]}.json`;
            downloadMetadataLink.style.display = 'inline-block';

        } catch (error) {
            console.error('خطا در پردازش تصویر یا متادیتا:', error);
            base64OutputDiv.innerHTML = `<strong>خطا:</strong> ${error.message}`;
            finalMetadataOutputDiv.innerHTML = '<strong>خطا در تولید متادیتا.</strong>';
            metadataOutputDiv.style.display = 'block';
        }
    });

    exploreButton.addEventListener('click', () => {
        openModal(mintedCarsModal);
        loadMintedCarTokens();
    });

    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                closeModal(modal);
            }
        });

        button.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                const modal = button.closest('.modal');
                if (modal) {
                    closeModal(modal);
                }
            }
        });
    });

    infoButton.addEventListener('click', () => {
        openModal(infoModal);
    });

    window.addEventListener('click', (event) => {
        if (event.target === mintedCarsModal) {
            closeModal(mintedCarsModal);
        }
        if (event.target === infoModal) {
            closeModal(infoModal);
        }
    });

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeModal(mintedCarsModal);
            closeModal(infoModal);
        }
    });

    function loadMintedCarTokens() {
        const sampleTokens = [
            {
                tokenId: 'token_1678886400_abcde',
                name: 'پژو پارس مدل ۱۴۰۱',
                description: 'خودروی کلاسیک، کاملا بازسازی شده. یک اثر واقعی!',
                image: 'https://via.placeholder.com/250x120/00ffff/000000?text=Pars',
                price: 1200000000,
                borderClass: 'hue-border-1'
            },
            {
                tokenId: 'token_1678886500_fghij',
                name: 'تیبا ۲ مدل ۱۳۹۹',
                description: 'مدل جدید، قابلیت رانندگی خودکار کامل، برد بلند.',
                image: 'https://via.placeholder.com/250x120/ff00ff/ffffff?text=Tiba2',
                price: 850000000,
                borderClass: 'hue-border-2'
            },
            {
                tokenId: 'token_1678886600_klmno',
                name: 'سمند LX مدل ۱۴۰۰',
                description: 'افسانه JDM، آماده برای تیونینگ. کارکرد کم.',
                image: 'https://via.placeholder.com/250x120/ffff00/000000?text=Samand',
                price: 950000000,
                borderClass: 'hue-border-3'
            },
            {
                tokenId: 'token_1678886700_pqrst',
                name: 'پژو ۲۰۷i مدل ۱۴۰۲',
                description: 'عملکرد متمرکز بر پیست، تجربه رانندگی هیجان‌انگیز.',
                image: 'https://via.placeholder.com/250x120/00ffff/ffffff?text=Peugeot+207',
                price: 1100000000,
                borderClass: 'hue-border-4'
            }
        ];

        carTokensContainer.innerHTML = '';

        sampleTokens.forEach(token => {
            const card = document.createElement('div');
            card.classList.add('car-token-card', token.borderClass);
            const formattedPrice = token.price.toLocaleString('fa-IR', { style: 'currency', currency: 'IRR', maximumFractionDigits: 0 });

            card.innerHTML = `
                <img src="${token.image}" alt="${token.name}">
                <h3>${token.name}</h3>
                <p>${token.description}</p>
                <div class="price">${formattedPrice}</div>
                <button class="buy-button" type="button">خرید</button>
            `;
            carTokensContainer.appendChild(card);
        });
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let animationInterval = setInterval(drawDigitalRain, 30);
    const contentDiv = document.querySelector('.content');
    contentDiv.addEventListener('mouseenter', () => {
        clearInterval(animationInterval);
        animationInterval = setInterval(drawDigitalRain, 100);
    });
    contentDiv.addEventListener('mouseleave', () => {
        clearInterval(animationInterval);
        animationInterval = setInterval(drawDigitalRain, 30);
    });

    setInterval(drawDigitalRain, 30);
});
