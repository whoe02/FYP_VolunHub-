import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUserContext } from '../UserContext';
import { firestore } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Chat = ({ route }) => {
    const { chat } = route.params;
    const { user, setUser } = useUserContext();

    const { top: safeTop } = useSafeAreaInsets();
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [mInputMessage, setMInputMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [fullscreenImage, setFullscreenImage] = useState(null);
    const [dynamicHeight, setDynamicHeight] = useState(40); // Start with minimum height

    useEffect(() => {
        const messagesRef = collection(firestore, 'Chat', chat.id, 'Message');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const groupedMessages = snapshot.docs.reduce((acc, doc) => {
                const data = doc.data();
                const date = new Date(data.timestamp.toDate()).toDateString();
                if (!acc[date]) acc[date] = [];
                acc[date].push({
                    id: doc.id,
                    text: data.text,
                    sender: data.senderId,
                    timestamp: data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    media: data.media || null,
                });
                return acc;
            }, {});

            setMessages(Object.entries(groupedMessages));
        });

        return () => unsubscribe();
    }, [chat.id]);

    const uploadToCloudinary = async (uri) => {
        const formData = new FormData();
        formData.append('file', {
            uri,
            type: 'image/jpeg',
        });
        formData.append('upload_preset', 'chatmedia');
        formData.append('cloud_name', 'dnj0n4m7k');

        try {
            const response = await fetch('https://api.cloudinary.com/v1_1/dnj0n4m7k/image/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            return data.secure_url;
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error);
            return null;
        }
    };

    const sendMessage = async () => {
        if (inputMessage.trim().length === 0 && !selectedImage) {
            console.warn('Message or image required to send.');
            return;
        }

        try {
            let mediaUrl = null;

            // If an image is selected, upload it to Cloudinary
            if (selectedImage) {
                const formData = new FormData();
                formData.append('file', {
                    uri: selectedImage,
                    type: 'image/jpeg',
                    name: 'chat-image.jpg',
                });
                formData.append('upload_preset', 'chatmedia');
                formData.append('cloud_name', 'dnj0n4m7k');

                const response = await fetch('https://api.cloudinary.com/v1_1/dnj0n4m7k/image/upload', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();
                if (data.secure_url) {
                    mediaUrl = data.secure_url;
                } else {
                    console.error('Failed to upload image to Cloudinary:', data);
                    return;
                }
            }

            const newMessage = {
                text: inputMessage || '',
                media: mediaUrl || null,
                senderId: user.userId,
                timestamp: new Date(),
            };

            // Add the message to Firestore
            const messagesRef = collection(firestore, 'Chat', chat.id, 'Message');
            await addDoc(messagesRef, newMessage);

            // Update the last message in the chat
            const chatRef = doc(firestore, 'Chat', chat.id);
            await updateDoc(chatRef, {
                lastMessage: {
                    text: inputMessage || (mediaUrl ? '[Image]' : ''),
                    senderId: user.userId,
                    timestamp: new Date(),
                },
            });

            // Reset states
            setInputMessage('');
            setSelectedImage(null);
            setPreviewModalVisible(false);
        } catch (error) {
            console.error('Error sending message:', error.message || error);
        }
    };
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });
        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
            setPreviewModalVisible(true);
        }
    };

    const takePhoto = async () => {
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 1,
        });
        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
            setPreviewModalVisible(true);
        }
    };

    const renderMessage = ({ item }) => {
        const isCurrentUser = item.sender === user.userId;
        const openFullscreenImage = (uri) => {
            setFullscreenImage(uri);
        };

        return (
            <View style={[styles.messageContainer, isCurrentUser ? styles.myMessage : styles.otherMessage]}>
                {item.media && (
                    <TouchableOpacity onPress={() => openFullscreenImage(item.media)}>
                        <Image source={{ uri: item.media }} style={styles.media} />
                    </TouchableOpacity>
                )}
                {item.text ? (
                    <Text style={isCurrentUser ? styles.messageText : styles.otherMessageText}>{item.text}</Text>
                ) : null}
                <Text style={isCurrentUser ? styles.myTimestamp : styles.timestamp}>{item.timestamp}</Text>
            </View>
        );
    };

    const renderDateHeader = ({ item }) => (
        <View style={styles.dateHeader}>
            <Text style={styles.dateText}>{item[0]}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Image source={{ uri: chat.avatar }} style={styles.avatar} />
                <Text style={styles.header}>{chat.name}</Text>
            </View>

            <FlatList
                data={messages}
                keyExtractor={(item) => item[0]}
                renderItem={({ item }) => (
                    <>
                        {renderDateHeader({ item })}
                        {item[1].map((message) => renderMessage({ item: message }))}
                    </>
                )}
                style={styles.messageList}
            />

            <View style={styles.inputContainer}>
                <TouchableOpacity onPress={pickImage}>
                    <Ionicons name="image" size={30} color="#6a8a6d" style={{ marginRight: 3 }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={takePhoto}>
                    <Ionicons name="camera" size={30} color="#6a8a6d" />
                </TouchableOpacity>
                <TextInput
                    style={[styles.input, { height: Math.min(150, Math.max(40, dynamicHeight)) }]}
                    placeholder="Type a message"
                    value={inputMessage}
                    onChangeText={setInputMessage}
                    multiline={true}
                    onContentSizeChange={(e) => {
                        setDynamicHeight(e.nativeEvent.contentSize.height); // Dynamically adjust based on content
                    }}
                />
                <TouchableOpacity
                    onPress={sendMessage}
                    style={[
                        styles.sendButton,
                        { backgroundColor: inputMessage.trim() || selectedImage ? '#6a8a6d' : '#ccc' }, // Disabled style
                    ]}
                    disabled={!inputMessage.trim() && !selectedImage} // Disable condition
                >
                    <Ionicons name="send" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Fullscreen Image Modal */}
            {fullscreenImage && (
                <Modal visible={true} transparent={true} onRequestClose={() => setFullscreenImage(null)}>
                    <View style={styles.fullscreenModal}>
                        <Image source={{ uri: fullscreenImage }} style={styles.fullscreenImage} />
                        <TouchableOpacity onPress={() => setFullscreenImage(null)} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>
            )}
            {previewModalVisible && (
                <Modal transparent={true} animationType="fade" visible={previewModalVisible}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            {/* Cancel Icon */}
                            <TouchableOpacity
                                style={styles.cancelIcon}
                                onPress={() => {
                                    setPreviewModalVisible(false);
                                    setSelectedImage(null);
                                }}
                            >
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>

                            {/* Preview Image */}
                            <Image source={{ uri: selectedImage }} style={styles.previewImage} />

                            <View style={styles.modalInputContainer}>
                                <TextInput
                                    style={[styles.input, { height: Math.min(150, Math.max(40, dynamicHeight)) }]}
                                    placeholder="Type a message"
                                    value={inputMessage}
                                    onChangeText={setInputMessage}
                                    multiline={true}
                                    onContentSizeChange={(e) => {
                                        setDynamicHeight(e.nativeEvent.contentSize.height); // Dynamically adjust based on content
                                    }}
                                />
                                <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                                    <Ionicons name="send" size={24} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
};

export default Chat;



const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 15,
        paddingVertical: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: '#ddd',
        backgroundColor: 'white',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6a8a6d',
    },
    messageList: {
        flex: 1,
        paddingHorizontal: 10,
    },
    messageContainer: {
        maxWidth: '75%',
        minWidth: '20%',
        paddingHorizontal: 10,
        paddingVertical: 5,
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
        color: 'white',
        alignSelf: 'flex-end',
        marginTop: 3,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderTopWidth: 0.5,
        borderColor: '#ddd',
        backgroundColor: 'white',
    },
    input: {
        flex: 1,
        padding: 10,
        backgroundColor: '#e8e3df',
        borderRadius: 25,
        marginHorizontal: 10,
        maxHeight: 150, // Set a max height for input
        minHeight: 40, // Set a min height for input
        textAlignVertical: 'top', // Align text at the top
    },
    sendButton: {
        backgroundColor: '#6a8a6d',
        padding: 10,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateHeader: {
        alignItems: 'center',
        marginVertical: 20,
    },
    dateText: {
        fontSize: 12,
        color: '#6a8a6d',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 15,
    },
    previewInput: {
        width: '100%',
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#f3f3f3',
        marginBottom: 15,
        fontSize: 16,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#f44336',
        alignItems: 'center',
        marginRight: 5,
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    media: {
        width: 200, // Adjust based on your layout
        height: 200,
        borderRadius: 10,
        marginBottom: 5,
    },
    fullscreenModal: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    fullscreenImage: {
        width: '90%',
        height: '80%',
        resizeMode: 'contain',
    },
    closeButton: {
        marginTop: 10,
        backgroundColor: '#f44336',
        padding: 10,
        borderRadius: 10,
    },
    closeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
        backgroundColor: 'white',
    },
    modalInput: {
        flex: 1,
        padding: 10,
        backgroundColor: '#e8e3df',
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
    cancelIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
    },

});
