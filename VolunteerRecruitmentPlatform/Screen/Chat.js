// ChatPage.js
import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Chat = ({ route }) => {
    const { user } = route.params;  // Retrieve user data passed from LiveChatList

    const [messages, setMessages] = useState([
        { id: '1', text: 'Hi there! How can I help you?', sender: 'other', timestamp: '2:30 PM' },
        { id: '2', text: 'I need some assistance with my order.', sender: 'me', timestamp: '2:32 PM' },
        { id: '3', text: 'I need some assistance with my order.', sender: 'other', timestamp: '1:32 PM' },
        // Additional example messages can go here
    ]);

    const [inputMessage, setInputMessage] = useState('');

    const sendMessage = () => {
        if (inputMessage.trim().length === 0) return;
        const newMessage = {
            id: Date.now().toString(),
            text: inputMessage,
            sender: 'me',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages([...messages, newMessage]);
        setInputMessage('');
    };

    const renderMessage = ({ item }) => (
        <View style={[styles.messageContainer, item.sender === 'me' ? styles.myMessage : styles.otherMessage]}>
            <Text style={item.sender === 'me' ? styles.messageText : styles.otherMessageText}>{item.text}</Text>
            <Text style={item.sender === 'me' ? styles.myTimestamp : styles.timestamp}>{item.timestamp}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header showing the name of the user */}
            <View style={styles.headerContainer}>
                <Text style={styles.header}>{user.name}</Text>
            </View>

            {/* Message list */}
            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                style={styles.messageList}
            />
            
            {/* Input field and send button */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message"
                    value={inputMessage}
                    onChangeText={setInputMessage}
                />
                <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                    <Ionicons name="send" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default Chat;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    headerContainer: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
    },
    messageList: {
        flex: 1,
        paddingHorizontal: 10,
    },
    messageContainer: {
        maxWidth: '75%',
        padding: 10,
        borderRadius: 10,
        marginVertical: 5,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#6a8a6d',
    },
    otherMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#e8e3df',
    },
    messageText: {
        fontSize: 16,
        color: 'white',
    },
    otherMessageText: {
        fontSize: 16,
        color: '#333',
    },
    timestamp: {
        fontSize: 10,
        color: '#777',
        alignSelf: 'flex-end',
        marginTop: 3,
    },
    myTimestamp: {
        fontSize: 10,
        color: 'white', // White timestamp for messages sent by the user
        alignSelf: 'flex-end',
        marginTop: 3,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderTopWidth: 1,
        borderColor: '#ddd',
    },
    input: {
        flex: 1,
        padding: 10,
        backgroundColor: '#F5F5F5',
        borderRadius: 25,
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: '#6a8a6d',
        padding: 10,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
});