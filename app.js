// ZakatEase Core Engine v3.0 - Exactly Matched Logic

document.addEventListener('DOMContentLoaded', () => {
    // 1. Constants & State
    const rates = {
        PKR: { gold: 25000, silver: 300, bitcoin: 17000000, symbol: 'Rs' },
        USD: { gold: 85, silver: 1.1, bitcoin: 60000, symbol: '$' },
        SAR: { gold: 318, silver: 4.1, bitcoin: 225000, symbol: 'SAR' }
    };

    let currentCurrency = 'PKR';

    const elements = {
        // UI Controls
        currencySelector: document.getElementById('currency-selector'),
        themeToggleBtn: document.getElementById('theme-toggle'),
        mobileMenuBtn: document.getElementById('mobile-menu-btn'),
        mobileMenu: document.getElementById('mobile-menu'),
        
        // Display Boxes
        liveGoldRate: document.getElementById('live-gold-rate'),
        liveSilverRate: document.getElementById('live-silver-rate'),
        liveBtcRate: document.getElementById('live-btc-rate'),
        lastUpdatedTs: document.getElementById('last-updated-ts'),
        symbols: document.querySelectorAll('.currency-symbol'),
        
        // Form Fields
        inputs: {
            cash: document.getElementById('cash'),
            bank: document.getElementById('bank'),
            goldGrams: document.getElementById('gold-grams'),
            silverGrams: document.getElementById('silver-grams'),
            stock: document.getElementById('stock'),
            bitcoin: document.getElementById('bitcoin'),
            debts: document.getElementById('debts')
        },

        // Result Labels
        resTotalAssets: document.getElementById('res-total-assets'),
        resDebts: document.getElementById('res-debts'),
        resNetWorth: document.getElementById('res-net-worth'),
        resZakatAmount: document.getElementById('res-zakat-amount'),
        statusIndicator: document.getElementById('status-indicator'),
        statusText: document.getElementById('status-text'),
        nisabMessage: document.getElementById('nisab-message'),
        
        // CTA Buttons
        resetBtn: document.getElementById('reset-btn'),
        saveBtn: document.getElementById('save-record'),
        downloadBtn: document.getElementById('download-pdf'),
        viewHistoryBtn: document.getElementById('view-records-btn'),
        recordsModal: document.getElementById('records-modal'),
        recordsList: document.getElementById('records-list')
    };

    // 2. Main Logic: Zakat Calculation
    function calculate() {
        const rate = rates[currentCurrency];
        const getV = (id) => parseFloat(elements.inputs[id].value) || 0;

        const cash = getV('cash');
        const bank = getV('bank');
        const stock = getV('stock');
        const btc = parseFloat(elements.inputs.bitcoin.value) || 0;
        const debts = getV('debts');
        
        const goldVal = getV('goldGrams') * rate.gold;
        const silverVal = getV('silverGrams') * rate.silver;
        const btcVal = btc * rate.bitcoin;

        const totalAssets = cash + bank + stock + btcVal + goldVal + silverVal;
        const netWorth = totalAssets - debts;
        const nisabThreshold = 612.36 * rate.silver; // Silver Nisab is standard

        // Visual Updates
        elements.resTotalAssets.innerText = totalAssets.toLocaleString(undefined, { maximumFractionDigits: 0 });
        elements.resDebts.innerText = debts.toLocaleString(undefined, { maximumFractionDigits: 0 });
        elements.resNetWorth.innerText = (netWorth > 0 ? netWorth : 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

        if (totalAssets === 0 && debts === 0) {
            elements.statusIndicator.className = 'w-2 h-2 rounded-full bg-slate-300';
            elements.statusText.innerText = 'ڈیٹا درج کریں';
            elements.resZakatAmount.innerText = '0.00';
            elements.nisabMessage.classList.add('hidden');
            return;
        }

        if (netWorth >= nisabThreshold) {
            const zakat = netWorth * 0.025;
            elements.resZakatAmount.innerText = zakat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            elements.statusIndicator.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
            elements.statusText.innerText = 'صاحبِ نصاب';
            elements.nisabMessage.classList.add('hidden');
        } else {
            elements.resZakatAmount.innerText = '0.00';
            elements.statusIndicator.className = 'w-2 h-2 rounded-full bg-red-500';
            elements.statusText.innerText = 'غیر صاحبِ نصاب';
            elements.nisabMessage.classList.remove('hidden');
        }
    }

    // 3. UI Sync
    function syncUI() {
        const rate = rates[currentCurrency];
        const gTola = (rate.gold * 11.6638).toLocaleString(undefined, { maximumFractionDigits: 0 });
        const sTola = (rate.silver * 11.6638).toLocaleString(undefined, { maximumFractionDigits: 0 });

        elements.liveGoldRate.innerText = `${rate.symbol} ${gTola}`;
        elements.liveSilverRate.innerText = `${rate.symbol} ${sTola}`;
        if (elements.liveBtcRate) elements.liveBtcRate.innerText = `${rate.symbol} ${rate.bitcoin.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
        
        // Update timestamp
        const now = new Date();
        elements.lastUpdatedTs.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        elements.symbols.forEach(s => s.innerText = rate.symbol);
        calculate();
    }

    async function fetchRates() {
        const now = new Date();
        elements.lastUpdatedTs.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        try {
            // Using a more reliable endpoint for multiple rates
            const res = await fetch(`https://latest.currency-api.pages.dev/v1/currencies/usd.json`);
            const data = await res.json();
            const usd = data.usd;

            if (usd && usd.pkr) {
                // Rates per gram from Ounce (XAU/XAG are USD per Ounce)
                const gGramUSD = (1 / usd.xau) / 31.1035;
                const sGramUSD = (1 / usd.xag) / 31.1035;
                const btcUSD = 1 / (usd.btc || 0.000016);

                rates.PKR = { gold: gGramUSD * usd.pkr, silver: sGramUSD * usd.pkr, bitcoin: btcUSD * usd.pkr, symbol: 'Rs' };
                rates.USD = { gold: gGramUSD, silver: sGramUSD, bitcoin: btcUSD, symbol: '$' };
                rates.SAR = { gold: gGramUSD * usd.sar, silver: sGramUSD * usd.sar, bitcoin: btcUSD * usd.sar, symbol: 'SAR' };
            }
            syncUI();
        } catch (e) {
            console.warn("Using fallback rates:", e);
            syncUI();
        }
    }

    // 4. Utility: Theme
    elements.themeToggleBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
    if (localStorage.theme === 'dark') document.documentElement.classList.add('dark');

    // 5. Utility: Mobile Menu
    elements.mobileMenuBtn.addEventListener('click', () => {
        elements.mobileMenu.classList.toggle('hidden');
    });

    // 6. Listeners
    Object.values(elements.inputs).forEach(i => i.addEventListener('input', calculate));
    elements.currencySelector.addEventListener('change', (e) => {
        currentCurrency = e.target.value;
        syncUI();
    });

    elements.resetBtn.addEventListener('click', () => {
        Object.values(elements.inputs).forEach(i => i.value = '');
        calculate();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 7. History & PDF (Minimal v3 bridge)
    elements.saveBtn.addEventListener('click', () => {
        const rec = { date: new Date().toLocaleDateString('ur-PK'), zakat: elements.resZakatAmount.innerText, curr: currentCurrency };
        let hist = JSON.parse(localStorage.getItem('z_hist') || '[]');
        hist.unshift(rec);
        localStorage.setItem('z_hist', JSON.stringify(hist.slice(0, 10)));
        alert('ریکارڈ محفوظ کر لیا گیا');
    });

    elements.viewHistoryBtn.addEventListener('click', () => {
        const hist = JSON.parse(localStorage.getItem('z_hist') || '[]');
        elements.recordsList.innerHTML = hist.map(h => `<div class="p-4 bg-slate-50 rounded-xl mb-2 flex justify-between"><span>${h.date}</span><b>${h.zakat} ${h.curr}</b></div>`).join('');
        elements.recordsModal.classList.remove('hidden');
    });

    document.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => elements.recordsModal.classList.add('hidden')));
    
    document.getElementById('clear-all-records')?.addEventListener('click', () => {
        if(confirm('کیا آپ تمام ریکارڈز ختم کرنا چاہتے ہیں؟')) {
            localStorage.removeItem('z_hist');
            elements.recordsList.innerHTML = '';
            alert('ہسٹری کلیئر کر دی گئی ہے');
        }
    });

    // 8. PDF Bridge
    elements.downloadBtn.addEventListener('click', async () => {
        const btn = elements.downloadBtn;
        btn.innerText = "...تیار ہو رہا ہے";
        
        try {
            const template = document.getElementById('pdf-export-template');
            // Fill basics
            document.getElementById('pdf-date').innerText = new Date().toLocaleDateString();
            document.getElementById('pdf-currency').innerText = currentCurrency;
            document.getElementById('pdf-symbol').innerText = rates[currentCurrency].symbol;
            document.getElementById('pdf-total-assets').innerText = elements.resTotalAssets.innerText;
            document.getElementById('pdf-debts').innerText = elements.resDebts.innerText;
            
            // Add Bitcoin details to PDF if exists
            const btcVal = parseFloat(elements.inputs.bitcoin.value || 0) * rates[currentCurrency].bitcoin;
            if (btcVal > 0) {
                const btcRow = `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;">Bitcoin Value</td><td style="text-align: right; padding: 8px; border-bottom: 1px solid #eee;">${rates[currentCurrency].symbol} ${btcVal.toLocaleString()}</td></tr>`;
                document.getElementById('pdf-table-body').innerHTML = btcRow;
            } else {
                document.getElementById('pdf-table-body').innerHTML = '';
            }

            document.getElementById('pdf-zakat-amount').innerText = elements.resZakatAmount.innerText;

            const canvas = await html2canvas(template, { scale: 2 });
            const img = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
            pdf.addImage(img, 'PNG', 0, 0, 210, (canvas.height * 210) / canvas.width);
            pdf.save(`ZakatEase_Report.pdf`);
        } catch (err) { alert('PDF ڈاؤن لوڈ کرنے میں مسئلہ پیش آیا'); }
        btn.innerHTML = '<i class="ph ph-file-pdf"></i> رپورٹ ڈاؤن لوڈ کریں';
    });

    // 9. Init
    fetchRates();
});
