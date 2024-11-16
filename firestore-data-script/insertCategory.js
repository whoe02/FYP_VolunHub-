const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Firebase configuration
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

// Category data
const categories = [
    {
        categoryName: 'First Aid',
        categoryType: 'skills'
    },
    {
        categoryName: 'Event Management',
        categoryType: 'skills'
    },
    {
        categoryName: 'Fundraising',
        categoryType: 'skills'
    },
    {
        categoryName: 'Volunteer',
        categoryType: 'preference'
    },
    {
        categoryName: 'Community Service',
        categoryType: 'preference'
    },
    {
        categoryName: 'Education',
        categoryType: 'preference'
    },
    {
        categoryName: 'Environment',
        categoryType: 'preference'
    },
    {
        categoryName: 'Health',
        categoryType: 'preference'
    },
    {
        categoryName: 'Art',
        categoryType: 'preference'
    },
    {
        categoryName: 'Sports',
        categoryType: 'preference'
    },
    {
        categoryName: 'Kuala Lumpur',
        categoryType: 'location'
    },
    {
        categoryName: 'George Town',
        categoryType: 'location'
    },
    {
        categoryName: 'Johor Bahru',
        categoryType: 'location'
    },
    {
        categoryName: 'Malacca',
        categoryType: 'location'
    },
    {
        categoryName: 'Ipoh',
        categoryType: 'location'
    },
    {
        categoryName: 'Shah Alam',
        categoryType: 'location'
    },
    {
        categoryName: 'Kota Kinabalu',
        categoryType: 'location'
    },
    {
        categoryName: 'Kuching',
        categoryType: 'location'
    },
    {
        categoryName: 'Sandakan',
        categoryType: 'location'
    },
    {
        categoryName: 'Alor Setar',
        categoryType: 'location'
    }
];

// Insert categories into Firestore
const insertCategories = async () => {
    for (const category of categories) {
        try {
            const categoryRef = doc(db, 'Category', `${category.categoryType}_${category.categoryName}`);
            await setDoc(categoryRef, category);
            console.log(`Category ${category.categoryName} (${category.categoryType}) added successfully`);
        } catch (error) {
            console.error(`Error adding category ${category.categoryName}:`, error);
        }
    }
};

// Run the function
insertCategories().then(() => {
    console.log('Category data insertion complete.');
    process.exit();
});