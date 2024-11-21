// insertRewards.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyDQXdMGS7wiBcpbcrH9_yGNdakRCOTwA70",
    authDomain: "test-e6569.firebaseapp.com",
    projectId: "test-e6569",
    storageBucket: "test-e6569.appspot.com",
    messagingSenderId: "682695166796",
    appId: "1:682695166796:android:0b707e91e3286335ff9de9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Generate rewards
const generateRewards = async () => {
    const rewards = [
        {
            rewardId: 'RW00001',
            title: 'Free Coffee Voucher',
            pointsRequired: 50,
            type: 'voucher',
            description: 'Redeem this voucher for a free coffee at participating outlets.',
            imageVoucher: 'https://example.com/images/free-coffee-voucher.jpg',
            remainingStock: 100,
            date: '2024-11-20',
            userId: 'OG00001'
        },
        {
            rewardId: 'RW00002',
            title: 'Discount on Electronics',
            pointsRequired: 200,
            type: 'discount',
            description: 'Get 20% off on selected electronics.',
            imageVoucher: 'https://example.com/images/electronics-discount.jpg',
            remainingStock: 50,
            date: '2024-11-20',
            userId: 'OG00002'
        },
        {
            rewardId: 'RW00003',
            title: 'Movie Ticket',
            pointsRequired: 100,
            type: 'ticket',
            description: 'Exchange points for a free movie ticket.',
            imageVoucher: 'https://example.com/images/movie-ticket.jpg',
            remainingStock: 75,
            date: '2024-11-20',
            userId: 'OG00003'
        },
        // Add more rewards here...
    ];

    // Insert rewards into Firestore
    for (const reward of rewards) {
        try {
            await setDoc(doc(db, 'Rewards', reward.rewardId), reward);
            console.log(`Reward ${reward.rewardId} added successfully`);
        } catch (error) {
            console.error(`Error adding reward ${reward.rewardId}:`, error);
        }
    }
};

// Run the function
generateRewards().then(() => {
    console.log('Rewards insertion complete.');
    process.exit();
});
