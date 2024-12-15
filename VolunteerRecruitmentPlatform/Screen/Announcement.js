import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const MailPage = ({ route }) => {
    const { notification } = route.params; // Expect title and content to be passed from navigation

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>{notification.title}</Text>
                <Text style={styles.greeting}>Dear user,</Text>
                <Text style={styles.content}>{notification.content}</Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    scrollContainer: {
        paddingBottom: 20,
    },
    greeting: {
        fontSize: 18,
        marginBottom: 10,
        fontWeight: '400',
        color: '#333',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#1a1a1a',
    },
    content: {
        fontSize: 16,
        lineHeight: 24,
        color: '#555',
    },
});

export default MailPage;
