class LocationTracker {
    constructor() {
        this.watchId = null;
        this.currentPosition = null;
    }

    async startTracking(userId) {
        if ("geolocation" in navigator) {
            this.watchId = navigator.geolocation.watchPosition(
                async (position) => {
                    this.currentPosition = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        timestamp: new Date().toISOString()
                    };

                    await this.updateLocationInDB(userId);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    logEvent('location_error', { error: error.message });
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 30000,
                    timeout: 27000
                }
            );
        }
    }

    async updateLocationInDB(userId) {
        try {
            await db.collection('locations').doc(userId).set({
                ...this.currentPosition,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            logEvent('location_update', {
                userId,
                location: this.currentPosition
            });
        } catch (error) {
            logEvent('location_update_error', { error: error.message });
        }
    }

    stopTracking() {
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
    }
}
