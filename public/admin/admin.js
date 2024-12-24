document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = '../index.html';
            return;
        }

        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'admin') {
            auth.signOut();
            window.location.href = '../index.html';
            return;
        }

        loadDashboardData();
    });

    // Load dashboard data
    async function loadDashboardData() {
        try {
            const [usersSnapshot, busesSnapshot] = await Promise.all([
                db.collection('users').get(),
                db.collection('buses').get()
            ]);

            updateStats(usersSnapshot, busesSnapshot);
            displayUsers(usersSnapshot);
            displayBuses(busesSnapshot);
        } catch (error) {
            logEvent('admin_dashboard_error', { error: error.message });
            alert('Error loading dashboard data');
        }
    }

    function updateStats(usersSnapshot, busesSnapshot) {
        const totalBuses = busesSnapshot.size;
        const activeDrivers = usersSnapshot.docs.filter(doc => 
            doc.data().role === 'driver').length;
        const registeredUsers = usersSnapshot.docs.filter(doc => 
            doc.data().role === 'user').length;

        document.getElementById('totalBuses').textContent = totalBuses;
        document.getElementById('activeDrivers').textContent = activeDrivers;
        document.getElementById('registeredUsers').textContent = registeredUsers;
    }

    function displayUsers(usersSnapshot) {
        const userList = document.getElementById('userList');
        userList.innerHTML = '';

        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            const userCard = document.createElement('div');
            userCard.className = 'user-card';
            userCard.innerHTML = `
                <h3>${userData.name}</h3>
                <p>Email: ${userData.email}</p>
                <p>Role: ${userData.role}</p>
                <p>Phone: ${userData.phone}</p>
                <button onclick="handleUserDelete('${doc.id}')" class="delete-btn">
                    Delete User
                </button>
            `;
            userList.appendChild(userCard);
        });
    }

    function displayBuses(busesSnapshot) {
        const busList = document.getElementById('busList');
        busList.innerHTML = '';

        busesSnapshot.forEach(doc => {
            const busData = doc.data();
            const busCard = document.createElement('div');
            busCard.className = 'bus-card';
            busCard.innerHTML = `
                <h3>Bus ${busData.busNumber}</h3>
                <p>Type: ${busData.busType}</p>
                <p>Route: ${busData.source} to ${busData.destination}</p>
                <p>Capacity: ${busData.capacity}</p>
                <button onclick="handleBusDelete('${doc.id}')" class="delete-btn">
                    Delete Bus
                </button>
            `;
            busList.appendChild(busCard);
        });
    }

    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = '../index.html';
        });
    });
});
