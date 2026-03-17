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

// Default division list when none saved in Firestore (Division 1–10 + '-' for admin).
function getDefaultDivisionList() {
    return ['-'].concat(Array.from({ length: 10 }, function(_, i) { return 'Division ' + (i + 1); }));
}

// Cache key and TTL (5 min) for division list to avoid extra Firestore reads on every load
var DIVISION_LIST_CACHE_KEY = 'divisionListCache';
var DIVISION_LIST_CACHE_TIME_KEY = 'divisionListCacheTime';
var DIVISION_LIST_CACHE_TTL_MS = 5 * 60 * 1000;

function clearDivisionListCache() {
    try {
        if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(DIVISION_LIST_CACHE_KEY);
            sessionStorage.removeItem(DIVISION_LIST_CACHE_TIME_KEY);
        }
    } catch (e) { /* ignore */ }
}

// Load division options from Firestore config. Calls callback(err, list).
// Uses sessionStorage cache to speed up repeat loads (e.g. register page).
function getDivisionList(callback) {
    try {
        var cached = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(DIVISION_LIST_CACHE_KEY);
        var cachedTime = typeof sessionStorage !== 'undefined' && sessionStorage.getItem(DIVISION_LIST_CACHE_TIME_KEY);
        if (cached && cachedTime) {
            var list = JSON.parse(cached);
            var age = Date.now() - parseInt(cachedTime, 10);
            if (Array.isArray(list) && age >= 0 && age < DIVISION_LIST_CACHE_TTL_MS) {
                callback(null, list);
                return;
            }
        }
    } catch (e) { /* ignore cache errors */ }
    var db = getDb();
    if (!db) {
        callback(new Error('Database not available'), null);
        return;
    }
    db.collection('config').doc('divisions').get()
        .then(function(snap) {
            var data = snap.exists ? snap.data() : {};
            var list = Array.isArray(data.list) ? data.list : [];
            if (list.length === 0) {
                list = getDefaultDivisionList();
            }
            try {
                if (typeof sessionStorage !== 'undefined') {
                    sessionStorage.setItem(DIVISION_LIST_CACHE_KEY, JSON.stringify(list));
                    sessionStorage.setItem(DIVISION_LIST_CACHE_TIME_KEY, String(Date.now()));
                }
            } catch (e) { /* ignore */ }
            callback(null, list);
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
