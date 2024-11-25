import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUserContext } from '../UserContext';
import { firestore } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Video } from 'expo-av';

const Chat = ({ route }) => {
    const { chat } = route.params;
    const { user } = useUserContext();
    const { top: safeTop } = useSafeAreaInsets();

    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [fullscreenMedia, setFullscreenMedia] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [dynamicHeight, setDynamicHeight] = useState(40); // Start with minimum height


    const flatListRef = useRef();

    useEffect(() => {
        const messagesRef = collection(firestore, 'Chat', chat.id, 'Message');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const groupedMessages = [];
            let lastDate = null;

            snapshot.docs.forEach((doc) => {
                const messageData = {
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp.toDate(),
                };

                const messageDate = messageData.timestamp.toDateString();

                if (messageDate !== lastDate) {
                    // Add a date separator
                    groupedMessages.push({
                        id: `date-${messageDate}`,
                        dateHeader: true,
                        date: messageDate,
                    });
                    lastDate = messageDate;
                }

                groupedMessages.push(messageData);
            });

            setMessages(groupedMessages);
        });

        return () => unsubscribe();
    }, [chat.id]);

        // Check the size of the file before uploading
        const checkFileSize = async (uri) => {
            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (fileInfo.size > 16 * 1024 * 1024) { // 16 MB limit
                Alert.alert('File too large', 'The selected file exceeds the 16 MB size limit.');
                return false;
            }
            return true;
        };


    const uploadToCloudinary = async (uri, type) => {

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', {
            uri,
            type: type.startsWith('video') ? 'video/mp4' : 'image/jpeg',
            name: uri.split('/').pop(),
        });
        formData.append('upload_preset', 'chatmedia');
        formData.append('cloud_name', 'dnj0n4m7k');

        try {
            const response = await fetch('https://api.cloudinary.com/v1_1/dnj0n4m7k/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            setIsUploading(false);
            return data.secure_url;
        } catch (error) {
            setIsUploading(false);
            console.error('Error uploading to Cloudinary:', error);
            return null;
        }
    };

    const sendMessage = async () => {

        if (inputMessage.trim().length === 0 && !selectedImage) {
            console.warn('Message or media required to send.');
            return;
        }

        try {
            let mediaUrl = null;

            if (selectedImage) {
                const type = selectedImage.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg';
                mediaUrl = await uploadToCloudinary(selectedImage, type);
                if (!mediaUrl) return;
            }

            const newMessage = {
                text: inputMessage || '',
                media: mediaUrl || null,
                senderId: user.userId,
                timestamp: new Date(),
            };

            const messagesRef = collection(firestore, 'Chat', chat.id, 'Message');
            await addDoc(messagesRef, newMessage);

            // Update the chat's last message
            const chatRef = doc(firestore, 'Chat', chat.id);
            await updateDoc(chatRef, {
                lastMessage: {
                    text: inputMessage || (mediaUrl ? '[Media]' : ''),
                    senderId: user.userId,
                    timestamp: new Date(),
                },
            });


            setInputMessage('');
            setSelectedImage(null);
            setPreviewModalVisible(false);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const pickMedia = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
            quality: 1,
        });
        if (!result.canceled && (await checkFileSize(result.assets[0].uri))) {
            setSelectedImage(result.assets[0].uri);
            setPreviewModalVisible(true);
        }
    };

    const takeMedia = async () => {
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
            quality: 1,
        });
        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
            setPreviewModalVisible(true);
        }
    };
    const downloadMedia = async (uri) => {
        try {
            const fileUri = FileSystem.documentDirectory + uri.split('/').pop(); // Get file name
            await FileSystem.downloadAsync(uri, fileUri); // Download file
            await MediaLibrary.createAssetAsync(fileUri);
            Alert.alert('Success', 'File has been saved to your gallery!');
        } catch (error) {
            console.error('Error downloading file:', error);
            Alert.alert('Error', 'Failed to download file.');
        }
    };




    const renderMessage = ({ item }) => {
        if (item.dateHeader) {
            return (
                <View style={styles.dateHeader}>
                    <Text style={styles.dateText}>{item.date}</Text>
                </View>
            );
        }

        const isCurrentUser = item.senderId === user.userId;

        return (
            <View style={[styles.messageContainer, isCurrentUser ? styles.myMessage : styles.otherMessage]}>
                {item.media && (
                    <TouchableOpacity onPress={() => setFullscreenMedia(item.media)}>
                        {item.media.endsWith('.mp4') ? (
                            <Video
                                source={{ uri: item.media }}
                                style={styles.media}
                                resizeMode="cover"
                                shouldPlay={false}
                                isLooping
                                useNativeControls
                            />
                        ) : (
                            <Image source={{ uri: item.media }} style={styles.media} />
                        )}
                    </TouchableOpacity>
                )}
                {item.text ? <Text style={isCurrentUser ? styles.messageText : styles.otherMessageText}>{item.text}</Text> : null}
                <Text style={isCurrentUser ? styles.myTimestamp : styles.timestamp}>
                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    const renderFullscreenMedia = () => {
        if (!fullscreenMedia) return null;

        return (
            <Modal visible={true} transparent={true} onRequestClose={() => setFullscreenMedia(null)}>
                <View style={styles.fullscreenModal}>
                    {fullscreenMedia.endsWith('.mp4') ? (
                        <Video
                            source={{ uri: fullscreenMedia }}
                            style={styles.fullscreenImage}
                            resizeMode="contain"
                            shouldPlay
                            useNativeControls
                        />
                    ) : (
                        <Image source={{ uri: fullscreenMedia }} style={styles.fullscreenImage} />
                    )}
                    <TouchableOpacity onPress={() => downloadMedia(fullscreenMedia)} style={styles.downloadButton}>
                        <Ionicons name="download-outline" size={30} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setFullscreenMedia(null)} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Image source={{ uri: chat.avatar }} style={styles.avatar} />
                <Text style={styles.header}>{chat.name}</Text>
            </View>
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
            {/* Message Input */}
            <View style={styles.inputContainer}>
                <TouchableOpacity onPress={pickMedia}>
                    <Ionicons name="image" size={30} color="#6a8a6d" />
                </TouchableOpacity>
                <TouchableOpacity onPress={takeMedia}>
                    <Ionicons name="camera" size={30} color="#6a8a6d" />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message"
                    value={inputMessage}
                    onChangeText={setInputMessage}
                    multiline
                />
                <TouchableOpacity onPress={sendMessage} disabled={isUploading}>
                    {isUploading ? (
                        <ActivityIndicator size="small" color="#6a8a6d" />
                    ) : (
                        <Ionicons name="send" size={24} color="#6a8a6d" />
                    )}
                </TouchableOpacity>
            </View>
            {renderFullscreenMedia()}
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

                            {/* Preview Media */}
                            {selectedImage?.endsWith('.mp4') ? (
                                <Video
                                    source={{ uri: selectedImage }}
                                    style={styles.previewImage}
                                    resizeMode="contain"
                                    shouldPlay
                                    useNativeControls
                                />
                            ) : (
                                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                            )}
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
                                <TouchableOpacity
                                    style={styles.sendButton}
                                    onPress={sendMessage}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Ionicons name="send" size={24} color="#fff" />
                                    )}
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
        paddingHorizontal:5,
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
        textAlignVertical: 'center', // Align text at the top
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
