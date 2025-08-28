document.addEventListener('DOMContentLoaded', () => {
    // --- General Elements ---
    const navLinks = document.querySelectorAll('.nav-link');
    const mainSections = document.querySelectorAll('.main-section');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const calculatorBtn = document.getElementById('calculator-btn');
    const calculatorPopup = document.getElementById('calculator-popup');
    const closeBtn = document.querySelector('.close-btn');

    // --- Data Storage ---
    let allTransactions = JSON.parse(localStorage.getItem('transactions')) || {};
    let debts = JSON.parse(localStorage.getItem('debts')) || [];
    let splits = JSON.parse(localStorage.getItem('splits')) || [];
    let budgets = JSON.parse(localStorage.getItem('budgets')) || {};
    let categories = JSON.parse(localStorage.getItem('categories')) || ['Food', 'Bills', 'Transport', 'Entertainment', 'Other'];
    let currentMonthKey = new Date().getFullYear() + '-' + (new Date().getMonth() + 1);

    // --- Navigation and Theme ---
    function setActiveSection(sectionId) {
        navLinks.forEach(l => l.classList.remove('active'));
        mainSections.forEach(section => section.classList.remove('active'));
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
        document.getElementById(sectionId).classList.add('active');
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            setActiveSection(link.dataset.section);
        });
    });

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('theme-dark');
        localStorage.setItem('theme', document.body.classList.contains('theme-dark') ? 'dark' : 'light');
    });

    // --- Dashboard Logic ---
    const transactionForm = document.getElementById('transaction-form');
    const transactionList = document.getElementById('transaction-list');
    const totalExpensesElement = document.getElementById('total-expenses');
    const monthFilter = document.getElementById('month-filter');
    const sortFilter = document.getElementById('sort-filter');
    const currentMonthDisplay = document.getElementById('current-month-display');
    const forceMonthBtn = document.getElementById('force-month-btn');
    const backupBtn = document.getElementById('backup-btn');
    const restoreBtn = document.getElementById('restore-btn');
    const restoreInput = document.getElementById('restore-input');
    const monthSummaryElement = document.getElementById('month-summary');
    const categorySelect = document.getElementById('category-select');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const newCategoryInput = document.getElementById('new-category-input');
    const recurringCheckbox = document.getElementById('recurring-checkbox');
    const quickAddBtns = document.querySelectorAll('.quick-add-btn');

    function saveDashboardData() {
        localStorage.setItem('transactions', JSON.stringify(allTransactions));
        localStorage.setItem('categories', JSON.stringify(categories));
    }

    function renderTransactions(monthKey) {
        transactionList.innerHTML = '';
        let transactions = allTransactions[monthKey] || [];

        // Sorting
        const sortValue = sortFilter.value;
        transactions.sort((a, b) => {
            if (sortValue === 'date-desc') return new Date(b.date) - new Date(a.date);
            if (sortValue === 'date-asc') return new Date(a.date) - new Date(b.date);
            if (sortValue === 'amount-desc') return b.amount - a.amount;
            if (sortValue === 'amount-asc') return a.amount - b.amount;
            if (sortValue === 'category') return a.category.localeCompare(b.category);
        });

        let total = 0;
        transactions.forEach((t, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <strong>${t.description}</strong><br>
                    ${t.date} at ${t.time} | ${t.category}
                </div>
                <div>
                    $${t.amount.toFixed(2)}
                    <button class="edit-btn" data-index="${index}"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            transactionList.appendChild(li);
            total += parseFloat(t.amount);
        });
        totalExpensesElement.textContent = `$${total.toFixed(2)}`;
    }

    function renderMonthFilter() {
        monthFilter.innerHTML = Object.keys(allTransactions).sort((a, b) => new Date(b) - new Date(a)).map(month => `<option value="${month}">${month}</option>`).join('');
        monthFilter.value = currentMonthKey;
    }
    
    function renderCategorySelect() {
        categorySelect.innerHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }

    function renderMonthSummary() {
        monthSummaryElement.innerHTML = Object.keys(allTransactions).map(monthKey => {
            const total = (allTransactions[monthKey] || []).reduce((sum, t) => sum + parseFloat(t.amount), 0);
            return `<div><h4>${monthKey}</h4><p>Total: $${total.toFixed(2)}</p><button class="view-month-btn" data-month="${monthKey}">View</button></div>`;
        }).join('');
    }

    function setMonth(monthKey) {
        currentMonthKey = monthKey;
        currentMonthDisplay.textContent = new Date(monthKey + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });
        renderTransactions(currentMonthKey);
        renderBudgets();
    }

    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const date = document.getElementById('date-input').value;
        const time = document.getElementById('time-input').value;
        const description = document.getElementById('description-input').value;
        const amount = parseFloat(document.getElementById('amount-input').value);
        const category = categorySelect.value;
        const isRecurring = recurringCheckbox.checked;

        if (!allTransactions[currentMonthKey]) allTransactions[currentMonthKey] = [];
        allTransactions[currentMonthKey].push({ date, time, description, amount, category, recurring: isRecurring });
        saveDashboardData();
        renderTransactions(currentMonthKey);
        renderMonthSummary();
        renderBudgets();
        transactionForm.reset();
        
        // Visual feedback
        const btn = document.getElementById('add-transaction-btn');
        btn.classList.add('success');
        setTimeout(() => btn.classList.remove('success'), 500);
    });

    transactionList.addEventListener('click', (e) => {
        const index = e.target.closest('button')?.dataset.index;
        if (!index) return;
        
        if (e.target.closest('button').classList.contains('delete-btn')) {
            allTransactions[currentMonthKey].splice(index, 1);
        } else if (e.target.closest('button').classList.contains('edit-btn')) {
            const t = allTransactions[currentMonthKey][index];
            const newDesc = prompt("Edit Description:", t.description);
            const newAmount = prompt("Edit Amount:", t.amount);
            const newCat = prompt("Edit Category:", t.category);
            if (newDesc !== null && newAmount !== null && newCat !== null) {
                t.description = newDesc; t.amount = parseFloat(newAmount); t.category = newCat;
            }
        }
        saveDashboardData();
        renderTransactions(currentMonthKey);
        renderMonthSummary();
        renderBudgets();
    });

    monthFilter.addEventListener('change', (e) => { setMonth(e.target.value); });
    sortFilter.addEventListener('change', () => { renderTransactions(currentMonthKey); });

    addCategoryBtn.addEventListener('click', () => {
        const newCat = newCategoryInput.value.trim();
        if (newCat && !categories.includes(newCat)) {
            categories.push(newCat);
            saveDashboardData();
            renderCategorySelect();
            newCategoryInput.value = '';
        }
    });

    quickAddBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            const amount = parseFloat(btn.dataset.amount);
            
            document.getElementById('date-input').value = new Date().toISOString().slice(0, 10);
            document.getElementById('time-input').value = new Date().toTimeString().slice(0, 5);
            document.getElementById('amount-input').value = amount;
            document.getElementById('category-select').value = category;
            document.getElementById('description-input').value = `Quick Add - ${category}`;
        });
    });

    // --- Debts Logic ---
    const debtForm = document.getElementById('debt-form');
    const debtList = document.getElementById('debt-list');

    function saveDebts() { localStorage.setItem('debts', JSON.stringify(debts)); }
    function renderDebts() {
        debtList.innerHTML = debts.map((d, i) =>
            `<li><span>${d.type === 'i-owe' ? 'I Owe' : 'Owed to me'}: ${d.description} - $${d.amount}</span><button data-index="${i}"><i class="fas fa-check"></i></button></li>`
        ).join('');
    }

    debtForm.addEventListener('submit', (e) => {
        e.preventDefault();
        debts.push({
            description: document.getElementById('debt-description').value,
            amount: parseFloat(document.getElementById('debt-amount').value),
            type: document.getElementById('debt-type').value
        });
        saveDebts();
        renderDebts();
        debtForm.reset();
    });

    debtList.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn) {
            debts.splice(btn.dataset.index, 1);
            saveDebts();
            renderDebts();
        }
    });

    // --- Splitwise Logic ---
    const splitwiseForm = document.getElementById('splitwise-form');
    const splitHistory = document.getElementById('split-history');

    function saveSplits() { localStorage.setItem('splits', JSON.stringify(splits)); }
    function renderSplits() {
        splitHistory.innerHTML = splits.map((s, i) =>
            `<li><span>${s.description} - Total: $${s.total}</span><span>Each: $${s.each.toFixed(2)}</span><button data-index="${i}"><i class="fas fa-trash-alt"></i></button></li>`
        ).join('');
    }

    splitwiseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const total = parseFloat(document.getElementById('bill-total').value);
        const participants = document.getElementById('bill-participants').value.split(',').map(p => p.trim());
        splits.push({
            description: document.getElementById('bill-description').value,
            total,
            participants,
            each: total / participants.length
        });
        saveSplits();
        renderSplits();
        splitwiseForm.reset();
    });

    splitHistory.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn) {
            splits.splice(btn.dataset.index, 1);
            saveSplits();
            renderSplits();
        }
    });

    // --- Budget Logic ---
    const budgetForm = document.getElementById('budget-form');
    const budgetList = document.getElementById('budget-list');

    function saveBudgets() { localStorage.setItem('budgets', JSON.stringify(budgets)); }
    function renderBudgets() {
        budgetList.innerHTML = Object.keys(budgets).map(category => {
            const spent = (allTransactions[currentMonthKey] || []).filter(t => t.category === category).reduce((sum, t) => sum + t.amount, 0);
            const remaining = budgets[category] - spent;
            let progressClass = '';
            if (spent / budgets[category] >= 0.9) progressClass = 'danger';
            else if (spent / budgets[category] >= 0.75) progressClass = 'warning';
            
            return `<li><span>${category} Budget: $${budgets[category]}</span><span>Spent: $${spent.toFixed(2)}</span><span>Remaining: $${remaining.toFixed(2)}</span>
                <div class="budget-bar"><div class="budget-progress ${progressClass}" style="width: ${(spent / budgets[category]) * 100}%"></div></div>
                <button data-category="${category}"><i class="fas fa-trash-alt"></i></button></li>`;
        }).join('');
    }

    budgetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const category = document.getElementById('budget-category').value;
        const limit = parseFloat(document.getElementById('budget-limit').value);
        budgets[category] = limit;
        saveBudgets();
        renderBudgets();
        budgetForm.reset();
    });
    
    budgetList.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (btn) {
            delete budgets[btn.dataset.category];
            saveBudgets();
            renderBudgets();
        }
    });

    // --- Calculator Logic ---
    const calcDisplay = document.getElementById('calc-display');
    const calcButtons = document.querySelectorAll('.calc-btn');
    calculatorBtn.addEventListener('click', () => { calculatorPopup.style.display = 'flex'; });
    closeBtn.addEventListener('click', () => { calculatorPopup.style.display = 'none'; });
    let currentExpression = '';
    calcButtons.forEach(button => {
        button.addEventListener('click', () => {
            const value = button.textContent;
            if (value === 'C') { currentExpression = ''; } 
            else if (value === '=') {
                try { currentExpression = eval(currentExpression).toString(); } 
                catch (e) { currentExpression = 'Error'; }
            } 
            else { currentExpression += value; }
            calcDisplay.value = currentExpression;
        });
    });

    // --- Backup & Restore ---
    forceMonthBtn.addEventListener('click', () => {
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const newMonthKey = nextMonth.getFullYear() + '-' + (nextMonth.getMonth() + 1);

        const recurringTransactions = (allTransactions[currentMonthKey] || [])
            .filter(t => t.recurring)
            .map(t => ({...t, date: new Date().toISOString().slice(0, 10), time: new Date().toTimeString().slice(0, 5)}));

        allTransactions[newMonthKey] = recurringTransactions;
        saveDashboardData();
        setMonth(newMonthKey);
        renderMonthFilter();
        alert(`New month started: ${nextMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}. Recurring transactions were carried over.`);
    });

    backupBtn.addEventListener('click', () => {
        const backupData = { transactions: allTransactions, debts: debts, splits: splits, budgets: budgets, categories: categories };
        const dataStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'expense_tracker_backup.json';
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    });

    restoreBtn.addEventListener('click', () => { restoreInput.click(); });

    restoreInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const restoredData = JSON.parse(event.target.result);
                    allTransactions = restoredData.transactions || {};
                    debts = restoredData.debts || [];
                    splits = restoredData.splits || [];
                    budgets = restoredData.budgets || {};
                    categories = restoredData.categories || ['Food', 'Bills', 'Transport', 'Entertainment', 'Other'];
                    saveDashboardData(); saveDebts(); saveSplits(); saveBudgets();
                    setMonth(currentMonthKey);
                    renderDebts(); renderSplits(); renderBudgets(); renderCategorySelect();
                    renderMonthFilter();
                    alert("Data restored successfully!");
                } catch (error) {
                    alert("Failed to restore data. Please check the file format.");
                }
            };
            reader.readAsText(file);
        }
    });
    
    // --- Initial setup ---
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('theme-dark');
    }
    setMonth(currentMonthKey);
    renderDebts();
    renderSplits();
    renderBudgets();
    renderCategorySelect();
    renderMonthFilter();
});
