document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = '../index.html';
            return;
        }

        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'user') {
            auth.signOut();
            window.location.href = '../index.html';
            return;
        }
    });

    // Search form handler
    document.getElementById('searchForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const source = document.getElementById('searchSource').value;
        const destination = document.getElementById('searchDestination').value;

        try {
            const busesSnapshot = await db.collection('buses')
                .where('source', '==', source)
                .where('destination', '==', destination)
                .get();

            displayBusResults(busesSnapshot);
            logEvent('bus_search', { source, destination });
        } catch (error) {
            logEvent('bus_search_error', { error: error.message });
            alert('Error searching for buses');
        }
    });

    function displayBusResults(busesSnapshot) {
        const resultsContainer = document.getElementById('busResults');
        resultsContainer.innerHTML = '';

        if (busesSnapshot.empty) {
            resultsContainer.innerHTML = '<p>No buses found for this route.</p>';
            return;
        }

        busesSnapshot.forEach(async (doc) => {
            const busData = doc.data();
            const driverDoc = await db.collection('users').doc(busData.driverId).get();
            const driverData = driverDoc.data();
            
            const locationDoc = await db.collection('locations').doc(busData.driverId).get();
            const locationData = locationDoc.data();

            const busCard = document.createElement('div');
            busCard.className = 'bus-card';
            busCard.innerHTML = `
                <h3>Bus ${busData.busNumber}</h3>
                <p>Type: ${busData.busType}</p>
                <p>Route: ${busData.source} to ${busData.destination}</p>
                <p>Capacity: ${busData.capacity}</p>
                <p>Driver: ${driverData.name}</p>
                <p>Contact: ${driverData.phone}</p>
                ${locationData ? `
                    <p>Last Known Location:</p>
                    <p>Latitude: ${locationData.lat}</p>
                    <p>Longitude: ${locationData.lng}</p>
                    <p>Updated: ${new Date(locationData.timestamp).toLocaleString()}</p>
                ` : '<p>Location not available</p>'}
            `;
            resultsContainer.appendChild(busCard);
        });
    }

    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = '../index.html';
        });
    });
});