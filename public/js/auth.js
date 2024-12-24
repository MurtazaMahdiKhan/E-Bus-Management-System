function showForm(formType) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.tab-btn');

    if (formType === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
}

// Login handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.getElementById('loginRole').value;

    try {
        logEvent('login_attempt', { email, role });
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        
        const userDoc = await db.collection('users').doc(userCredential.user.uid).get();
        const userData = userDoc.data();

        if (userData.role !== role) {
            throw new Error('Invalid role selected');
        }

        logEvent('login_success', { userId: userCredential.user.uid, role });
        window.location.href = `/${role}/dashboard.html`;
    } catch (error) {
        logEvent('login_error', { error: error.message });
        alert('Login failed: ' + error.message);
    }
});

// Registration handler
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const name = document.getElementById('registerName').value;
    const phone = document.getElementById('registerPhone').value;
    const role = document.getElementById('registerRole').value;

    try {
        logEvent('register_attempt', { email, role });
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        await db.collection('users').doc(userCredential.user.uid).set({
            name: name,
            email: email,
            phone: phone,
            role: role,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        logEvent('register_success', { userId: userCredential.user.uid, role });
        showForm('login');
        alert('Registration successful! Please login.');
    } catch (error) {
        logEvent('register_error', { error: error.message });
        alert('Registration failed: ' + error.message);
    }
});
