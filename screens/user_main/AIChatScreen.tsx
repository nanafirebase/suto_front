import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Keyboard, KeyboardAvoidingView, LayoutAnimation, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Colors } from '../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../utils/constants/Design';
import { ThemedView } from '../../components/ui/ThemedView';
import { ThemedText } from '../../components/ui/ThemedText';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { ChatNavigationList, ProfileNavigationList } from '../../utils/types/index.type';
import { messageList } from '../../configuration/data/FetchData';
import LottieView from 'lottie-react-native'

type TAISchatScreen = NativeStackScreenProps<ChatNavigationList, "AISchatScreen">
const AISchatScreen = ({navigation}: TAISchatScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<any>(null);
    const inputRef = useRef<any>(null);
    const animation = useRef(null)
    const [inputFocused, setInputFocused] = useState(false)


    const MessageBubble = ({ message, themeColors }:any) => {
        const isCurrentUser = message.isOwn;
        const showAvatar = !isCurrentUser;
        const showTimestamp = true;
        
        return (
            <View style={[ styles.messageContainer, isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage ]}>
                {/* {showAvatar && !isCurrentUser && (
                    <Image source={{ uri: message.avatar }} style={styles.messageAvatar} />
                )} */}
                <View style={[ styles.messageBubble, isCurrentUser 
                    ? [styles.currentUserBubble, { backgroundColor: themeColors.primary }]
                    : [styles.otherUserBubble, { backgroundColor: themeColors.card }]
                ]}>
                <Text style={[
                    styles.messageText,
                    { color: isCurrentUser ? '#FFFFFF' : themeColors.text }
                ]}>
                    {message.text}
                </Text>
                {showTimestamp && (
                    <Text style={[
                        styles.messageTime,
                        { color: isCurrentUser ? 'rgba(255,255,255,0.7)' : themeColors.subtleText }
                    ]}>
                    {message.timestamp}
                    </Text>
                )}
            </View>
            {isCurrentUser && (
                <View style={styles.messageStatusContainer}>
                    <IconSymbol name="check" size={16} color={themeColors.primary} />
                </View>
            )}
            </View>
        )
    }

    const [message, setMessage] = useState('');
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    // useEffect(() => {
    //     const keyboardDidShowListener = Keyboard.addListener(
    //         Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
    //         () => setKeyboardVisible(true)
    //     );
    //     const keyboardDidHideListener = Keyboard.addListener(
    //         Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
    //         () => setKeyboardVisible(false)
    //     )
    //     return () => {
    //         keyboardDidShowListener?.remove()
    //         keyboardDidHideListener?.remove()
    //     }
    // }, [])

    // useEffect(() => {
    //     let timeout: NodeJS.Timeout | null = null;
    
    //     const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    //     const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    //     const handleShow = () => {
    //         if (timeout) clearTimeout(timeout);
    
    //         // Prevent Android flicker (block layout animations)
    //         if (Platform.OS === "android") {
    //             LayoutAnimation.configureNext(
    //                 LayoutAnimation.create(0, 'linear', 'opacity')
    //             );
    //         }
    
    //         timeout = setTimeout(() => setKeyboardVisible(true), 10);
    //     };
    
    //     const handleHide = () => {
    //         if (timeout) clearTimeout(timeout);
    
    //         if (Platform.OS === "android") {
    //             LayoutAnimation.configureNext(
    //                 LayoutAnimation.create(0, 'linear', 'opacity')
    //             )
    //         }
    
    //         timeout = setTimeout(() => setKeyboardVisible(false), 10);
    //     }
    
    //     const showListener = Keyboard.addListener(showEvent, handleShow);
    //     const hideListener = Keyboard.addListener(hideEvent, handleHide);
    
    //     return () => {
    //         showListener?.remove();
    //         hideListener?.remove();
    //         if (timeout) clearTimeout(timeout);
    //     };
    // }, []);
    

    const handleSend = () => {

    }

    const renderMessage = ({ item }:any) => (
        <MessageBubble message={item} themeColors={themeColors} />
    );

    useEffect(() => {
        if (messageList.length > 0) {
            requestAnimationFrame(() => {
                flatListRef.current?.scrollToEnd({
                    animated: false,
                });
            });
        }
    }, [messageList.length]);

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {Platform.OS === 'android' && ( <View style={[ styles.statusBarSpacer, { height: 10 || 0, backgroundColor: themeColors.background} ]} /> )}
            <View style={[ styles.safeArea, { backgroundColor: themeColors.background, paddingTop: Platform.OS === 'ios' ? insets.top : 0, paddingBottom: Platform.OS === "ios" ? 85 : 10 } ]}>
                <ThemedView style={[styles.header, { backgroundColor: themeColors.background, borderBottomColor: themeColors.border }]}>
                    <View style={{ width: 36 }} />
                    <ThemedText style={styles.headerTitle}>Suito Assistant</ThemedText>
                    <TouchableOpacity onPress={()=> {}} style={[ styles.iconButton, { backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground } ]} >
                        <IconSymbol name="list" size={22} color={themeColors.icon} />
                    </TouchableOpacity>
                </ThemedView>
                <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
                    <View style={{ flex: 1 }}>
                        {messageList.length === 0 && (
                            <View style={styles.emptyChat} pointerEvents="none">
                                <LottieView autoPlay loop
                                    source={require('./../../assets/lottie/Ghostsmart.json')}
                                    style={styles.emptyAnimation}
                                />
                            </View>
                        )}
                        <FlatList
                            ref={flatListRef}
                            data={messageList}
                            keyExtractor={(item:any) => item.id}
                            renderItem={renderMessage}
                            style={{ flex: 1, backgroundColor: messageList.length === 0 ? 'transparent' : themeColors.background, zIndex: 1 }}
                            contentContainerStyle={[
                                styles.messagesContent,
                                { paddingBottom: 30 }
                            ]}
                            keyboardShouldPersistTaps="handled"
                            removeClippedSubviews={false}
                            showsVerticalScrollIndicator={false}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        />
                        <View style={[styles.inputContainer, { backgroundColor: themeColors.card, borderTopColor: themeColors.border, paddingBottom: Platform.OS === "ios" ? 10 : inputFocused ? 38 : 0 }]}>
                            <View style={[styles.inputRow, { backgroundColor: themeColors.inputBackground, borderWidth: 1, borderColor: themeColors.border }]}>
                                <TouchableOpacity style={styles.attachButton} onPress={()=> {}} activeOpacity={0.7}>
                                    <IconSymbol name="plus" size={24} color={themeColors.primary} />
                                </TouchableOpacity>

                                <TextInput
                                    ref={inputRef}
                                    style={[styles.textInput, { color: themeColors.text, marginBottom: 4 }]}
                                    value={message}
                                    onChangeText={setMessage}
                                    placeholder="Type a message..."
                                    placeholderTextColor={themeColors.subtleText}
                                    multiline
                                    maxLength={1000}
                                    onSubmitEditing={handleSend}
                                    onFocus={() => setInputFocused(true)}
                                    onBlur={() => setInputFocused(false)}
                                />
                                <TouchableOpacity
                                    style={[styles.sendButton, { backgroundColor: themeColors.primary }]}
                                    onPress={handleSend}
                                    activeOpacity={0.8}
                                >
                                    <IconSymbol name="arrow.up" size={18} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    statusBarSpacer: {
        width: '100%',
    },
    safeArea: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
    },
    contentContainer: {
        padding: Spacing.screenPadding,
        paddingTop: 0
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.screenPadding,
        paddingVertical: Spacing.medium,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: Typography.heading2,
        fontFamily: 'SemiBold'
    },
    messagesContent: {
        paddingHorizontal: Spacing.medium,
        paddingTop: Spacing.medium,
        flexGrow: 1,
        justifyContent: 'flex-end',
    },
    messageContainer: {
        flexDirection: 'row',
        marginBottom: Spacing.medium,
        alignItems: 'flex-end',
    },
    currentUserMessage: {
        justifyContent: 'flex-end',
    },
    otherUserMessage: {
        justifyContent: 'flex-start',
    },
    messageAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: Spacing.small,
        marginBottom: 4,
    },
    messageBubble: {
        maxWidth: '75%',
        paddingHorizontal: Spacing.medium,
        paddingVertical: Spacing.small,
        borderRadius: Borders.radiusLarge,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.small,
    },
    currentUserBubble: {
        borderBottomRightRadius: 6,
        marginLeft: Spacing.xl,
    },
    otherUserBubble: {
        borderBottomLeftRadius: 6,
        marginRight: Spacing.xl,
    },
    messageText: {
        fontSize: Typography.body,
        lineHeight: 20,
        marginBottom: 4,
    },
    messageImage: {
        width: 200,
        height: 150,
        borderRadius: Borders.radiusMedium,
        marginBottom: 4,
    },
    messageTime: {
        fontSize: Typography.caption,
        alignSelf: 'flex-end',
    },
    messageStatusContainer: {
        marginLeft: Spacing.small,
        marginBottom: 4,
    },
    inputContainer: {
        paddingHorizontal: Spacing.medium,
        paddingTop: Spacing.medium,
        paddingBottom: Platform.OS === "ios" ? 0 : Spacing.medium,
        borderTopWidth: 1,
    },
    textInput: {
        flex: 1,
        fontSize: Typography.body,
        lineHeight: 20,
        maxHeight: 100,
        paddingVertical: Spacing.small,
        paddingHorizontal: Spacing.small,
        textAlignVertical: 'center',
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.small,
        marginBottom: 2,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: Spacing.small,
        paddingVertical: Spacing.small,
        borderRadius: Borders.radiusMedium || 25,
        minHeight: 50,
    },
    attachButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.small,
        marginBottom: 2,
    },
    emptyChat: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 0,
    },
    
    emptyAnimation: {
        width: 220,
        height: 220,
    },
})


export default AISchatScreen;
