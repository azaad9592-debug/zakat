// ZakatEase Core Logic

document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // Check saved theme or system preference
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlElement.classList.add('dark');
    } else {
        htmlElement.classList.remove('dark');
    }

    themeToggleBtn.addEventListener('click', () => {
        htmlElement.classList.toggle('dark');
        if (htmlElement.classList.contains('dark')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });

    // 2. Mock Live Rates (per Gram in PKR)
    // Gold is typically around 25000 PKR per gram right now. Silver is around 300 PKR per gram.
    const rates = {
        PKR: { gold: 25000, silver: 300, symbol: 'Rs', multiplier: 1 },
        USD: { gold: 85, silver: 1.1, symbol: '$', multiplier: 0.0036 },
        SAR: { gold: 318, silver: 4.1, symbol: 'SAR', multiplier: 0.0135 }
    };

    let currentCurrency = 'PKR';

    // 3. Elements
    const elements = {
        currencySelector: document.getElementById('currency-selector'),
        liveGoldRate: document.getElementById('live-gold-rate'),
        liveSilverRate: document.getElementById('live-silver-rate'),
        symbols: document.querySelectorAll('.currency-symbol'),

        // Inputs
        inputs: {
            cash: document.getElementById('cash'),
            bank: document.getElementById('bank'),
            goldGrams: document.getElementById('gold-grams'),
            silverGrams: document.getElementById('silver-grams'),
            stock: document.getElementById('stock'),
            investments: document.getElementById('investments'),
            debts: document.getElementById('debts')
        },

        // Results
        resTotalAssets: document.getElementById('res-total-assets'),
        resDebts: document.getElementById('res-debts'),
        resNetWorth: document.getElementById('res-net-worth'),
        resZakatAmount: document.getElementById('res-zakat-amount'),
        nisabStatus: document.getElementById('nisab-status'),
        statusIndicator: document.getElementById('status-indicator'),
        statusText: document.getElementById('status-text'),
        nisabMessage: document.getElementById('nisab-message')
    };

    // 4. Update Rates Display based on Currency
    function updateRatesDisplay() {
        const rate = rates[currentCurrency];
        // Displaying per tola (1 tola = 11.66 grams approx) for local familiarity, but logic runs on grams
        const goldTola = (rate.gold * 11.66).toLocaleString(undefined, { maximumFractionDigits: 0 });
        const silverTola = (rate.silver * 11.66).toLocaleString(undefined, { maximumFractionDigits: 0 });

        elements.liveGoldRate.innerText = `${rate.symbol} ${goldTola}`;
        elements.liveSilverRate.innerText = `${rate.symbol} ${silverTola}`;

        // Update symbols
        elements.symbols.forEach(el => el.innerText = rate.symbol);

        calculateZakat(); // Recalculate if currency changes
    }

    elements.currencySelector.addEventListener('change', (e) => {
        currentCurrency = e.target.value;
        updateRatesDisplay();
    });

    // 5. Calculation Logic
    function getVal(input) {
        return parseFloat(input.value) || 0;
    }

    function calculateZakat() {
        const rate = rates[currentCurrency];

        // Read manual fiat inputs (these are assumed to be in the current currency)
        const cash = getVal(elements.inputs.cash);
        const bank = getVal(elements.inputs.bank);
        const stock = getVal(elements.inputs.stock);
        const investments = getVal(elements.inputs.investments);
        const debts = getVal(elements.inputs.debts);

        // Calculate precious metals value
        const goldValue = getVal(elements.inputs.goldGrams) * rate.gold;
        const silverValue = getVal(elements.inputs.silverGrams) * rate.silver;

        // Total Assets
        const totalAssets = cash + bank + stock + investments + goldValue + silverValue;
        const netWorth = totalAssets - debts;

        // Nisab Calculation (Silver Nisab is standard for benefit of poor: 612.36 grams)
        const nisabThreshold = 612.36 * rate.silver;

        // Update UI
        elements.resTotalAssets.innerText = totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        elements.resDebts.innerText = debts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        elements.resNetWorth.innerText = netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        if (totalAssets === 0 && debts === 0) {
            // Empty state
            elements.nisabStatus.className = 'inline-flex items-center gap-2 py-1 px-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-bold mx-auto transition-colors';
            elements.statusIndicator.className = 'w-2 h-2 rounded-full bg-slate-400 block';
            elements.statusText.innerText = 'ویلیوز درج کریں';
            elements.nisabMessage.classList.add('hidden');
            elements.resZakatAmount.innerText = '0.00';
            return;
        }

        if (netWorth >= nisabThreshold) {
            // Zakat Applicable
            const zakatAmount = netWorth * 0.025;
            elements.resZakatAmount.innerText = zakatAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            elements.nisabStatus.className = 'inline-flex items-center gap-2 py-1 px-3 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-sm font-bold mx-auto transition-colors';
            elements.statusIndicator.className = 'w-2 h-2 rounded-full bg-emerald-500 block animate-pulse';
            elements.statusText.innerText = 'نصاب مکمل ہے';
            elements.nisabMessage.classList.add('hidden');
        } else {
            // Not Applicable
            elements.resZakatAmount.innerText = '0.00';

            elements.nisabStatus.className = 'inline-flex items-center gap-2 py-1 px-3 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-sm font-bold mx-auto transition-colors';
            elements.statusIndicator.className = 'w-2 h-2 rounded-full bg-red-500 block';
            elements.statusText.innerText = 'نصاب مکمل نہیں';
            elements.nisabMessage.classList.remove('hidden');
        }
    }

    // Add listeners to all inputs
    Object.values(elements.inputs).forEach(input => {
        input.addEventListener('input', calculateZakat);
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
        setTimeout(calculateZakat, 50); // wait for form to clear
    });

    // Initialize display
    updateRatesDisplay();

    // 5.5 Fetch Live Rates
    async function fetchLiveRates() {
        try {
            // Using a free, reliable CDN for daily exchange rates
            const response = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json');
            const data = await response.json();
            const usd = data.usd;

            if (usd && usd.pkr && usd.xau && usd.xag) {
                // XAU and XAG are live prices representing Troy Ounce per USD.
                // 1 Troy Ounce = 31.1034768 grams.
                const goldPerGramUSD = (1 / usd.xau) / 31.1034768;
                const silverPerGramUSD = (1 / usd.xag) / 31.1034768;

                // Update Rates Object with live currency rates
                rates.PKR.gold = goldPerGramUSD * usd.pkr;
                rates.PKR.silver = silverPerGramUSD * usd.pkr;

                rates.USD.gold = goldPerGramUSD;
                rates.USD.silver = silverPerGramUSD;

                rates.SAR.gold = goldPerGramUSD * usd.sar;
                rates.SAR.silver = silverPerGramUSD * usd.sar;

                // Refresh UI with new live rates
                updateRatesDisplay();
            }
        } catch (error) {
            console.error("Failed to fetch live rates, falling back to static rates:", error);
        }
    }

    // Call on load
    fetchLiveRates();

    // Automatically update rates every 5 minutes (300,000 milliseconds) for true live experience
    setInterval(fetchLiveRates, 300000);

    // 6. Save Record (LocalStorage Mockup)
    document.getElementById('save-record').addEventListener('click', () => {
        const record = {
            date: new Date().toLocaleDateString('ur-PK'),
            netWorth: elements.resNetWorth.innerText,
            zakat: elements.resZakatAmount.innerText,
            currency: currentCurrency
        };

        let history = JSON.parse(localStorage.getItem('zakatHistory') || '[]');
        history.push(record);
        localStorage.setItem('zakatHistory', JSON.stringify(history));

        alert(`زکات کا ریکارڈ کامیابی سے محفوظ کر لیا گیا ہے۔\n\nتاریخ: ${record.date}\nکل مالیت: ${record.currency} ${record.netWorth}\nزکات: ${record.currency} ${record.zakat}`);
    });

    // 7. PDF Generation (using jsPDF)
    document.getElementById('download-pdf').addEventListener('click', () => {
        if (!window.jspdf) {
            alert('PDF Generator failed to load. Please check your internet connection.');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Safe fonts and basic layout for standard text PDF since custom fonts require VFS in jsPDF
        doc.setFont("helvetica");
        doc.setFontSize(22);
        doc.text("ZakatEase - Calculation Report", 105, 20, { align: "center" });

        doc.setFontSize(12);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 35);
        doc.text(`Currency: ${currentCurrency}`, 20, 42);

        doc.setFontSize(14);
        doc.text("Assets Breakdown", 20, 55);

        doc.setFontSize(12);
        doc.text(`Cash: ${elements.inputs.cash.value || 0}`, 20, 65);
        doc.text(`Bank Balance: ${elements.inputs.bank.value || 0}`, 20, 72);
        doc.text(`Gold (${elements.inputs.goldGrams.value || 0}g): ${getVal(elements.inputs.goldGrams) * rates[currentCurrency].gold}`, 20, 79);
        doc.text(`Silver (${elements.inputs.silverGrams.value || 0}g): ${getVal(elements.inputs.silverGrams) * rates[currentCurrency].silver}`, 20, 86);
        doc.text(`Business Stock: ${elements.inputs.stock.value || 0}`, 20, 93);
        doc.text(`Investments: ${elements.inputs.investments.value || 0}`, 20, 100);

        doc.setFontSize(14);
        doc.setTextColor(200, 0, 0); // Red
        doc.text("Liabilities", 20, 115);
        doc.setFontSize(12);
        doc.text(`Debts Owed: -${elements.resDebts.innerText}`, 20, 125);

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.line(20, 135, 190, 135);

        doc.text(`Total Net Worth: ${elements.resNetWorth.innerText}`, 20, 145);

        doc.setFontSize(20);
        doc.setTextColor(16, 185, 129); // Emerald Green
        doc.text(`Zakat Payable (2.5%): ${elements.resZakatAmount.innerText} ${currentCurrency}`, 20, 160);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("Note: This is an auto-generated report from ZakatEase platform.", 105, 280, { align: "center" });

        doc.save(`Zakat_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    });
});

// Direct Messaging Functions for Contact Section
window.sendWhatsApp = function () {
    const msg = document.getElementById('contact-message').value;
    if (!msg.trim()) {
        alert('براہ کرم پہلے اپنا پیغام لکھیں۔');
        return;
    }
    const encodedMsg = encodeURIComponent(msg);
    window.open(`https://wa.me/923486867364?text=${encodedMsg}`, '_blank');
};

window.sendEmail = function () {
    const msg = document.getElementById('contact-message').value;
    if (!msg.trim()) {
        alert('براہ کرم پہلے اپنا پیغام لکھیں۔');
        return;
    }
    const encodedMsg = encodeURIComponent(msg);
    window.location.href = `mailto:azaad9592@gmail.com?subject=ZakatEase Question&body=${encodedMsg}`;
};
