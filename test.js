const firebaseConfig = {
    apiKey: "AIzaSyAtVvPjdsj84mWqaG4-7SyjbljCnslZ1SM",
    authDomain: "hendaa-1.firebaseapp.com",
    databaseURL: "https://hendaa-1-default-rtdb.firebaseio.com",
    projectId: "hendaa-1",
    storageBucket: "hendaa-1.appspot.com",
    messagingSenderId: "831134776479",
    appId: "1:831134776479:web:56cd7098fc69cd70a376aa"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.getElementById('addPlanButton').addEventListener('click', () => {
    window.location.href = 'deposit.html';
});

function cacheData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getCachedData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function fetchUserData(userId) {
    const userRef = db.collection('users').doc(userId);
    return userRef.get().then(doc => doc.exists ? doc.data() : null);
}

function fetchTransactions(userId) {
    const transactionRef = db.collection("transactions").where("userId", "==", userId);
    return transactionRef.get().then(querySnapshot => {
        const transactions = [];
        querySnapshot.forEach(doc => transactions.push(doc.data()));
        return transactions;
    });
}

function fetchInvestments(userId) {
    const investmentRef = db.collection("investments").where("userId", "==", userId);
    return investmentRef.get().then(querySnapshot => {
        const investments = [];
        querySnapshot.forEach(doc => investments.push(doc.data()));
        return investments;
    });
}

function displayUserInfo() {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            const userId = user.uid;

            // Fetch or use cached user data
            const cachedUserData = getCachedData(`user_${userId}`);
            if (cachedUserData) {
                displayUserBalances(cachedUserData);
            } else {
                fetchUserData(userId).then(userData => {
                    if (userData) {
                        cacheData(`user_${userId}`, userData);
                        displayUserBalances(userData);
                    }
                });
            }

            // Fetch or use cached transactions and investments
            const cachedTransactions = getCachedData(`transactions_${userId}`);
            const cachedInvestments = getCachedData(`investments_${userId}`);
            if (cachedTransactions && cachedInvestments) {
                displayTransactionHistory(cachedTransactions, cachedInvestments);
            } else {
                Promise.all([fetchTransactions(userId), fetchInvestments(userId)]).then(([transactions, investments]) => {
                    cacheData(`transactions_${userId}`, transactions);
                    cacheData(`investments_${userId}`, investments);
                    displayTransactionHistory(transactions, investments);
                });
            }
        } else {
            // Redirect to login page if no user is signed in
            window.location.href = "login.html";
        }
    });
}

function displayUserBalances(userData) {
    document.getElementById('userNameDisplay').innerText = "Welcome, " + userData.name + "!";
    document.getElementById('depositBalance').innerText = "$" + userData.depositBalance.toFixed(2);
    document.getElementById('mainBalance').innerText = "$" + userData.mainBalance.toFixed(2);
    document.getElementById('withdrawalBalance').innerText = "$" + userData.withdrawalBalance.toFixed(2);
}

function displayTransactionHistory(transactions, investments) {
    const transactionList = document.getElementById("transaction-list");
    transactionList.innerHTML = ""; // Clear previous data

    const combinedTransactions = [
        ...transactions.map(tx => ({
            type: tx.type,
            amount: tx.amount,
            status: tx.status
        })),
        ...investments.map(inv => ({
            type: "Investment",
            amount: inv.amount,
            status: "Completed"
        }))
    ];

    combinedTransactions.forEach(transaction => appendTransaction(transaction, transactionList));
}

function appendTransaction(transaction, transactionList) {
    const statusClass = transaction.status === 'Approved' ? 'success' :
        transaction.status === 'Pending' ? 'warning' :
            (transaction.status === 'Decline' || transaction.status === 'Reject') ? 'danger' :
                transaction.status === 'Completed' ? 'success' : '';

    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${transaction.type}</td>
        <td>$${transaction.amount}</td>

        <td class="text-center">
            <span class="badge badge-pill bg-${statusClass} inv-badge">${transaction.status}</span>
        </td>
    `;
    transactionList.appendChild(row);
}

displayUserInfo();
