document.addEventListener('DOMContentLoaded', () => {
    const locationTracker = new LocationTracker();

    // Check authentication
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = '../index.html';
            return;
        }

        const userDoc = await db.collection('users').doc(user.uid).get();
        if (!userDoc.exists || userDoc.data().role !== 'driver') {
            auth.signOut();
            window.location.href = '../index.html';
            return;
        }

        loadBusInfo(user.uid);
        locationTracker.startTracking(user.uid);
    });

    // Load bus information
    async function loadBusInfo(userId) {
        try {
            const busDoc = await db.collection('buses')
                .where('driverId', '==', userId)
                .limit(1)
                .get();

            if (!busDoc.empty) {
                const busData = busDoc.docs[0].data();
                document.getElementById('busNumber').value = busData.busNumber;
                document.getElementById('busType').value = busData.busType;
                document.getElementById('source').value = busData.source;
                document.getElementById('destination').value = busData.destination;
                document.getElementById('capacity').value = busData.capacity;
            }
        } catch (error) {
            logEvent('load_bus_info_error', { error: error.message });
            alert('Error loading bus information');
        }
    }

    // Bus info form handler
    document.getElementById('busInfoForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userId = auth.currentUser.uid;
        const busData = {
            busNumber: document.getElementById('busNumber').value,
            busType: document.getElementById('busType').value,
            source: document.getElementById('source').value,
            destination: document.getElementById('destination').value,
            capacity: document.getElementById('capacity').value,
            driverId: userId,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('buses').doc(userId).set(busData);
            logEvent('bus_info_update', { busData });
            alert('Bus information updated successfully');
        } catch (error) {
            logEvent('bus_info_update_error', { error: error.message });
            alert('Error updating bus information');
        }
    });

    // Location update button handler
    document.getElementById('updateLocationBtn').addEventListener('click', () => {
        if (locationTracker.currentPosition) {
            document.getElementById('currentLocation').textContent = 
                `Lat: ${locationTracker.currentPosition.lat}, 
                 Lng: ${locationTracker.currentPosition.lng}`;
        }
    });

    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', () => {
        locationTracker.stopTracking();
        auth.signOut().then(() => {
            window.location.href = '../index.html';
        });
    });
});
