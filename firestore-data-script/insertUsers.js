// insertUsers.js

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

// Generate users
const generateUsers = async () => {
    const volunteers = [
        {
            userId: 'VL00001',
            name: 'Chew Jia Xian',
            password: 'chew1234',
            address: 'dudsudsjdsjdjs dsudsdsj dusdusjdsjd',
            email: 'jxchew2015@gmail.com',
            icNum: '010203101852',
            phoneNum: '0123456789',
            rewardPoint: '150',
            role: 'volunteer',
            status: 'active',
            birthDate: '1995-05-15',
            image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663774/UserProfilePic/fx8qvjepyyb4ifakjv3i.jpg'
        },
        {
            userId: 'VL00002',
            name: 'Chew Jia Xian',
            password: 'chew1234',
            address: 'dudsudsjdsjdjs dsudsdsj dusdusjdsjd',
            email: 'jxchew2016@gmail.com',
            icNum: '010203101852',
            phoneNum: '0123456789',
            rewardPoint: '150',
            role: 'volunteer',
            status: 'active',
            birthDate: '1995-05-15',
            image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663774/UserProfilePic/daeogkboj4lzmx6mkrqk.jpg'
        },
        {
            userId: 'VL00003',
            name: 'Chew Jia Xian',
            password: 'chew1234',
            address: 'dudsudsjdsjdjs dsudsdsj dusdusj',
            icNum: '010203101852',
            phoneNum: '0123456789',
            rewardPoint: '150',
            role: 'volunteer',
            status: 'active',
            birthDate: '1995-05-15',
            image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663774/UserProfilePic/d8or1ix2r8rg5fsz7fgy.jpg'
        },
        // Add more volunteer data here...
    ];

    const organizations = [
        {
            userId: 'OG00001',
            name: 'Org Name',
            password: 'orgpass123',
            address: 'organization address example',
            email: 'orgemail@example.com',
            phoneNum: '0198765432',
            role: 'organization',
            businessType: 'example',
            status: 'active',
            birthDate: '1995-05-15',
            image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663774/UserProfilePic/xctd0jtkbbvteiag6546.jpg'
        },
        {
            userId: 'OG00002',
            name: 'Org Name',
            password: 'orgpass123',
            address: 'organization address example',
            email: 'orgemail1@example.com',
            phoneNum: '0198765432',
            role: 'organization',
            businessType: 'example',
            status: 'active',
            birthDate: '1995-05-15',
            image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663774/UserProfilePic/izmo9ofcbhn7zygxvcsu.jpg'
        },
        {
            userId: 'OG00003',
            name: 'Org Name',
            password: 'orgpass123',
            address: 'organization address example',
            email: 'orgemail2@example.com',
            phoneNum: '0198765432',
            role: 'organization',
            businessType: 'example',
            status: 'active',
            birthDate: '1995-05-15',
            image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663774/UserProfilePic/rwo9llb8lx9cq3wrx3bk.jpg'
        },
        // Add more organization data here...
    ];

    const admins = [
        {
            userId: 'AD00001',
            name: 'Admin Name',
            password: 'adminpass123',
            address: 'admin address example',
            email: 'adminemail@example.com',
            icNum: '030203101852',
            phoneNum: '0171234567',
            role: 'admin',
            status: 'active',
            birthDate: '1995-05-15',
            image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663774/UserProfilePic/l3hcsly51prvzrirbliq.jpg'

        },
        {
            userId: 'AD00002',
            name: 'Admin Name',
            password: 'adminpass123',
            address: 'admin address example',
            email: 'adminemail2@example.com',
            icNum: '030203101852',
            phoneNum: '0171234567',
            role: 'admin',
            status: 'active',
            birthDate: '1995-05-15',
            image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663773/UserProfilePic/njehb69k53qb45rrdrm2.jpg'
        },
        {
            userId: 'AD00003',
            name: 'Admin Name',
            password: 'adminpass123',
            address: 'admin address example',
            email: 'adminemail3@example.com',
            icNum: '030203101852',
            phoneNum: '0171234567',
            role: 'admin',
            status: 'active',
            birthDate: '1995-05-15',
            image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663773/UserProfilePic/vdoarj0jyqriptpu4jpw.jpg'

        },
        // Add more admin data here...
    ];

    const allUsers = [...volunteers, ...organizations, ...admins];

    // Insert users into Firestore
    for (const user of allUsers) {
        try {
            await setDoc(doc(db, 'User', user.userId), user);
            console.log(`User ${user.userId} added successfully`);
        } catch (error) {
            console.error(`Error adding user ${user.userId}:`, error);
        }
    }
};

// Run the function
generateUsers().then(() => {
    console.log('Data insertion complete.');
    process.exit();
});