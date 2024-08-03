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

function displayUserInfo() {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            const userId = user.uid;

            // Fetch and display user name
            const userRef = db.collection('users').doc(userId);
            userRef.get().then((doc) => {
                if (doc.exists) {
                    const userName = doc.data().name;
                    document.getElementById('userNameDisplay').innerText = "Welcome, " + userName + "!";
                }
            });

            // Fetch and display user balances
            userRef.get().then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    document.getElementById('depositBalance').innerText = "$" + userData.depositBalance.toFixed(2);
                    document.getElementById('mainBalance').innerText = "$" + userData.mainBalance.toFixed(2);
                    document.getElementById('withdrawalBalance').innerText = "$" + userData.withdrawalBalance.toFixed(2);
                }
            });

            // Fetch and display current investment plan
            db.collection('investments').where('userId', '==', userId).orderBy('timestamp', 'desc').limit(1).get()
                .then((querySnapshot) => {
                    if (!querySnapshot.empty) {
                        const investment = querySnapshot.docs[0].data();
                        document.getElementById('currentPlan').innerText = investment.planName;
                    }
                });

            // Fetch and display transaction history
            const transactionList = document.getElementById("transaction-list");
            transactionList.innerHTML = ""; // Clear previous data

            const transactionRef = db.collection("transactions").where("userId", "==", userId);
            transactionRef.get().then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    const transaction = doc.data();
                    appendTransaction(transaction, transactionList);
                });
            });

            const investmentRef = db.collection("investments").where("userId", "==", userId);
            investmentRef.get().then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    const investment = doc.data();
                    const investmentTransaction = {
                        type: "Investment",
                        amount: investment.amount,
                  
                        status: investment.status
                    };
                    appendTransaction(investmentTransaction, transactionList);
                });
            });

        } else {
            // Redirect to login page if no user is signed in
            window.location.href = "login.html";
        }
    });
}

function appendTransaction(transaction, transactionList) {
    const statusClass = transaction.status === 'Approved' ? 'success' :
        transaction.status === 'Pending' ? 'warning' :
            (transaction.status === 'Decline' || transaction.status === 'Reject') ? 'danger' : '';

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