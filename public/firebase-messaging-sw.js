importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB4Xb0uEh5obLhnqbJsVVuDEEoEtmw58Qk",
  authDomain: "black-details.firebaseapp.com",
  projectId: "black-details",
  storageBucket: "black-details.firebasestorage.app",
  messagingSenderId: "413937096538",
  appId: "1:413937096538:web:683be70a198bd95973c563",
  measurementId: "G-YZ9T8HNE9F"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
