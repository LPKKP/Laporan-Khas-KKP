// Common Firebase init and auth helpers - load after Firebase SDK scripts and config.js
(function() {
    if (typeof firebase === 'undefined' || typeof firebaseConfig === 'undefined') return;
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
})();

function getAuth() {
    return typeof firebase !== 'undefined' ? firebase.auth() : null;
}
function getDb() {
    return typeof firebase !== 'undefined' ? firebase.firestore() : null;
}

// Require logged-in user; if not, redirect to login. Optionally run callback(user) when ready.
function requireAuth(onReady) {
    var auth = getAuth();
    if (!auth) {
        window.location.href = 'login.html';
        return;
    }
    auth.onAuthStateChanged(function(user) {
        if (!user) {
            try { localStorage.removeItem('userEmail'); } catch (e) {}
            window.location.href = 'login.html';
            return;
        }
        var email = (user.email || '').toLowerCase();
        try { localStorage.setItem('userEmail', email); } catch (e) {}
        if (typeof onReady === 'function') onReady(user);
    });
}

// Get current user's role and division from userRoles. Calls callback(err, { role, division }).
function getUserRoleAndDivision(callback) {
    var auth = getAuth();
    var db = getDb();
    if (!auth || !auth.currentUser || !db) {
        callback(new Error('Not authenticated'), null);
        return;
    }
    var email = (auth.currentUser.email || '').toLowerCase();
    db.collection('userRoles').doc(email).get()
        .then(function(snap) {
            var data = snap.exists ? snap.data() : {};
            callback(null, {
                role: data.role || 'user',
                division: data.division || ''
            });
        })
        .catch(function(err) { callback(err, null); });
}

// Require admin; if not admin, redirect to index. Calls onReady() when user is admin.
function requireAdmin(onReady) {
    requireAuth(function(user) {
        getUserRoleAndDivision(function(err, info) {
            if (err || !info || info.role !== 'admin') {
                window.location.href = 'index.html';
                return;
            }
            if (typeof onReady === 'function') onReady(user, info);
        });
    });
}

// Register service worker for offline cache (PWA)
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function() {});
}
