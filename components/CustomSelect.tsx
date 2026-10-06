import React, { useEffect, useState } from 'react';
import { ActivityIndicator, useColorScheme, Modal, TouchableWithoutFeedback } from 'react-native';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, } from 'react-native';
import { Colors } from '../utils/constants/Colors';
import { IconSymbol } from './ui/icon-symbol';
import { Borders } from '../utils/constants/Design';

const CustomSelect = ({title, placeholder, required, onSelect, options, loading, textTransform, value}:any) => {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedOption, setSelectedOption] = useState(null)
    const colorScheme = useColorScheme()
    const themeColors = Colors[colorScheme ?? 'light']

    useEffect(() => {
        if (value === undefined) {
            return
        }
        setSelectedOption(value)
    }, [value])

    const toggleDropdown = () => {
        setIsOpen(!isOpen)
    };

    const handleOptionSelect = (option:any) => {
        setSelectedOption(option)
        setIsOpen(false)
        onSelect(option)
    }

    const closeDropdown = () => {
        setIsOpen(false)
    }

    return (
            <View style={{marginTop: 20}}>
                <Text style={{...styles.title, color: themeColors.subtleText}}>{title} {required ? ( <Text style={{fontFamily: 'Italic', fontSize: 12, color: themeColors.error}}>Required</Text> ) : ''}</Text>
                <TouchableOpacity onPress={toggleDropdown} style={styles.dropdownButton} activeOpacity={0.8}>
                    <Text style={{
                        ...styles.dropdownButtonText,
                        color: themeColors ? themeColors.text : '#000',
                        textTransform: textTransform || 'capitalize',
                    }}>
                        {selectedOption ?? value ?? placeholder ?? 'Select an option'}
                    </Text>
                    {loading == 'true' ? <ActivityIndicator style={{position: 'absolute', right: 10, top: 13}} /> : null}
                </TouchableOpacity>
                {/* {isOpen && (
                <Modal
                    visible={isOpen}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={closeDropdown}
                >
                    <TouchableWithoutFeedback onPress={closeDropdown}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <View style={styles.modalContent}>
                                    <ScrollView 
                                        style={{...styles.dropdown, maxHeight: 250}} 
                                        nestedScrollEnabled={true} 
                                        showsVerticalScrollIndicator={true} 
                                        keyboardShouldPersistTaps="handled"
                                    >
                                        {options ? options.map((option:string) => (
                                            <TouchableOpacity 
                                                key={option} 
                                                activeOpacity={0.8} 
                                                style={{...styles.option, backgroundColor: themeColors.background}} 
                                                onPress={() => handleOptionSelect(option)}
                                            >
                                                <Text style={{color: themeColors.text, fontFamily: 'Regular', fontSize: 11, textTransform: textTransform || 'capitalize'}}>{option}</Text>
                                            </TouchableOpacity>
                                        )): null}
                                    </ScrollView>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
                )} */}
                {isOpen && (
                    <Modal
                        visible={isOpen}
                        transparent
                        animationType="fade"
                        onRequestClose={closeDropdown}
                    >
                        <TouchableWithoutFeedback onPress={closeDropdown}>
                        <View style={styles.overlay}>
                            <TouchableWithoutFeedback>
                            <View style={[styles.card, { backgroundColor: themeColors.card }]}>
                                
                                {/* Header */}
                                <View style={styles.header}>
                                <Text style={[styles.headerTitle, { color: themeColors.text, paddingHorizontal: 10 }]}>
                                    Select An Option
                                </Text>
                                <TouchableOpacity style={{position: 'absolute', height: 30, width: 30, right: 0, top: 5, backgroundColor: 'tomato', borderRadius: Borders.radiusMedium, alignItems: 'center', justifyContent: 'center' }} onPress={closeDropdown}>
                                    <IconSymbol name='xmark' color={themeColors.text} />
                                </TouchableOpacity>
                                </View>

                                {/* Options */}
                                <ScrollView
                                style={{ maxHeight: 300 }}
                                showsVerticalScrollIndicator={false}
                                >
                                {options?.map((option: string) => (
                                    <TouchableOpacity
                                    key={option}
                                    activeOpacity={0.8}
                                    style={[
                                        styles.optionItem,
                                        {
                                        backgroundColor:
                                            selectedOption === option
                                            ? themeColors.primary + "20"
                                            : "transparent",
                                        flexDirection: 'row', alignItems: 'center'
                                        }
                                    ]}
                                    onPress={() => handleOptionSelect(option)}
                                    >
                                    <IconSymbol name='chevron.right' color={themeColors.subtleText} style={{marginRight: 5}} />
                                    <Text
                                        style={{
                                        color: themeColors.text,
                                        fontSize: 13,
                                        fontFamily: "Medium",
                                        textTransform: textTransform || "capitalize",
                                        }}
                                    >
                                        {option}
                                    </Text>
                                    </TouchableOpacity>
                                ))}
                                </ScrollView>
                            </View>
                            </TouchableWithoutFeedback>
                        </View>
                        </TouchableWithoutFeedback>
                    </Modal>
                )}
        </View>
    )
}

const styles = StyleSheet.create({
    title: {
        fontSize: 12,
        marginBottom: 7,
        fontFamily: 'Bold',
        color: '#222'
    },
    dropdownButton: {
        padding: 17,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
    },
    dropdownButtonText: {
        fontSize: 11,
        fontFamily: 'Regular',
        // textTransform: 'capitalize'
    },
    dropdown: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        zIndex: 2,
    },
    option: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingVertical: 14
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        maxWidth: 400,
    },

    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)", // dim background
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 20,
      },
      
      card: {
        width: "100%",
        borderRadius: 16,
        paddingVertical: 15,
        paddingHorizontal: 15,
        elevation: 10, // Android shadow
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
        paddingVertical: 15
    },
    headerTitle: {
        fontSize: 15,
        fontFamily: "SemiBold",
    },
    optionItem: {
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderRadius: 10,
        marginBottom: 5,
    },
});

export default CustomSelect;