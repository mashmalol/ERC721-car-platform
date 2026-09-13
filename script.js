document.addEventListener('DOMContentLoaded', () => {
    const carImageInputs = [...document.querySelectorAll('.photo-slot input[type="file"]')];
    const carMakeInput = document.getElementById('carMake');
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
    const copyContractButton = document.getElementById('copyContractButton');
    const erc721ContractCode = document.getElementById('erc721ContractCode');

    const simpleErc721Contract = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CarNFT is ERC721, Ownable {
    uint256 public nextTokenId;

    constructor() ERC721("CarNFT", "CARNFT") Ownable(msg.sender) {}

    function mint(address to) external onlyOwner {
        _safeMint(to, nextTokenId);
        nextTokenId++;
    }
}`;

    if (erc721ContractCode) {
        erc721ContractCode.textContent = simpleErc721Contract;
    }

    function openModal(modal) {
        modal.classList.add('active');
    }

    function closeModal(modal) {
        modal.classList.remove('active');
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

    function constructFinalMetadata(formattedBase64, mimeType, fileExtension, details, originalImageFileName) {
        const tokenId = `token_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const listingName = `${details.make} ${details.model} ${details.trim} - لیست شده`;
        const imageUrl = `data:${mimeType};base64,${formattedBase64}`;

        return {
            tokenId,
            name: listingName,
            description: details.description,
            image: imageUrl,
            additionalImages: details.additionalImages,
            price: parseFloat(details.price),
            vehicleDetails: { ...details, imageFormat: fileExtension },
            attributes: [
                { trait_type: 'سازنده', value: details.make },
                { trait_type: 'مدل خودرو', value: details.model },
                { trait_type: 'سال ساخت', value: details.year },
                { trait_type: 'کارکرد', value: `${Number(details.mileage).toLocaleString('fa-IR')} کیلومتر` },
                { trait_type: 'گیربکس', value: details.transmission },
                { trait_type: 'نوع سوخت', value: details.fuel },
                { trait_type: 'رنگ', value: details.color },
                { trait_type: 'شهر', value: details.city },
                { trait_type: 'وضعیت', value: details.condition },
                { trait_type: 'قیمت لیست شده', value: `${parseInt(details.price).toLocaleString('fa-IR')} تومان` },
                { trait_type: 'تصویر اصلی', value: originalImageFileName },
                { trait_type: 'نوع فرمت', value: 'Base64 سفارشی + جداکننده‌ها' }
            ]
        };
    }

    processButton.addEventListener('click', async () => {
        const files = carImageInputs.map(input => input.files[0]);
        const requiredFields = document.querySelectorAll('.upload-form [required]');
        const firstMissingField = [...requiredFields].find(field => !field.value.trim());

        if (firstMissingField) {
            firstMissingField.reportValidity();
            base64OutputDiv.innerHTML = '<strong>لطفاً همه جزئیات الزامی خودرو را تکمیل کنید.</strong>';
            base64OutputDiv.style.display = 'block';
            metadataOutputDiv.style.display = 'none';
            return;
        }

        const details = {
            make: carMakeInput.value.trim(),
            model: carNameInput.value.trim(),
            year: carYearInput.value.trim(),
            mileage: carMileageInput.value.trim(),
            transmission: carTransmissionInput.value,
            fuel: carFuelInput.value,
            color: carColorInput.value.trim(),
            city: carCityInput.value.trim(),
            condition: carConditionInput.value,
            price: carPriceInput.value,
            description: carDescriptionInput.value.trim()
        };

        if (files.some(file => !file)) {
            base64OutputDiv.innerHTML = '<strong>لطفاً هر چهار تصویر خودرو را انتخاب کنید!</strong>';
            base64OutputDiv.style.display = 'block';
            metadataOutputDiv.style.display = 'none';
            return;
        }

        base64OutputDiv.innerHTML = 'درحال پردازش تصویر...';
        base64OutputDiv.style.display = 'block';
        metadataOutputDiv.style.display = 'none';
        downloadMetadataLink.style.display = 'none';

        try {
            const images = await Promise.all(files.map(imageToBase64WithFormatting));
            const [{ formatted: formattedBase64, mimeType, fileExtension }] = images;
            details.additionalImages = images.map(image => `data:${image.mimeType};base64,${image.formatted}`);
            const snippet = formattedBase64.substring(0, 200) + (formattedBase64.length > 200 ? '...' : '');
            base64OutputDiv.innerHTML = `<strong>چهار تصویر آماده شد.</strong><br><small>تصویر اصلی: ${files[0].name}</small><br><small>قطعه Base64: ${snippet}</small><br><small>نوع MIME: ${mimeType}</small>`;
            base64OutputDiv.style.display = 'block';

            const finalMetadata = constructFinalMetadata(formattedBase64, mimeType, fileExtension, details, files[0].name);
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

    copyContractButton.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(simpleErc721Contract);
            copyContractButton.textContent = 'کپی شد';
            setTimeout(() => {
                copyContractButton.textContent = 'کپی قرارداد';
            }, 1500);
        } catch (error) {
            console.error('Clipboard copy failed:', error);
            copyContractButton.textContent = 'کپی ناموفق';
            setTimeout(() => {
                copyContractButton.textContent = 'کپی قرارداد';
            }, 1500);
        }
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
                price: 1200000000
            },
            {
                tokenId: 'token_1678886500_fghij',
                name: 'تیبا ۲ مدل ۱۳۹۹',
                description: 'مدل جدید، قابلیت رانندگی خودکار کامل، برد بلند.',
                image: 'https://via.placeholder.com/250x120/ff00ff/ffffff?text=Tiba2',
                price: 850000000
            },
            {
                tokenId: 'token_1678886600_klmno',
                name: 'سمند LX مدل ۱۴۰۰',
                description: 'افسانه JDM، آماده برای تیونینگ. کارکرد کم.',
                image: 'https://via.placeholder.com/250x120/ffff00/000000?text=Samand',
                price: 950000000
            },
            {
                tokenId: 'token_1678886700_pqrst',
                name: 'پژو ۲۰۷i مدل ۱۴۰۲',
                description: 'عملکرد متمرکز بر پیست، تجربه رانندگی هیجان‌انگیز.',
                image: 'https://via.placeholder.com/250x120/00ffff/ffffff?text=Peugeot+207',
                price: 1100000000
            }
        ];

        carTokensContainer.innerHTML = '';

        sampleTokens.forEach(token => {
            const card = document.createElement('div');
            card.classList.add('car-token-card');
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

});
