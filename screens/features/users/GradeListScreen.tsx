import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { UserNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedView } from '../../../components/ui/ThemedView';
import { ThemedText } from '../../../components/ui/ThemedText';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { useFocusEffect } from '@react-navigation/native';

type TGradeListScreen = NativeStackScreenProps<
    UserNavigationList,
    'GradeListScreen'
>;

const GradeListScreen = ({ navigation }: TGradeListScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();

    const { session, selectedBusiness, can } = useAppContainer();

    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [data, setData] = useState<any[]>([]);

    const fetchGrades = async () => {
        if (!selectedBusiness?.id) return;

        SocketIO.emit(
            'fetch-grades',
            {
                sessionID: session,
                businessID: selectedBusiness.id,
            },
            (response: any) => {
                if (response.status === 'success') {
                    setData(response.data || []);
                } else {
                    Alert.alert(
                        'Error',
                        response.message || 'Error fetching grades'
                    );
                }
            }
        );
    };

    useEffect(() => {
        fetchGrades();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchGrades();
        }, [])
    );

    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) {
            return data;
        }

        const query = searchQuery.toLowerCase();

        return data.filter((item) =>
            String(item.name || '').toLowerCase().includes(query) ||
            String(item.description || '').toLowerCase().includes(query)
        );
    }, [data, searchQuery]);

    return (
        <View
            style={[
                styles.container,
                { backgroundColor: themeColors.background },
            ]}
        >
            {Platform.OS === 'android' && (
                <View
                    style={[
                        styles.statusBarSpacer,
                        {
                            backgroundColor: themeColors.background,
                        },
                    ]}
                />
            )}

            <View
                style={[
                    styles.safeArea,
                    {
                        backgroundColor: themeColors.background,
                        paddingTop:
                            Platform.OS === 'ios' ? insets.top : 0,
                    },
                ]}
            >
                <ThemedView
                    style={[
                        styles.header,
                        {
                            backgroundColor: themeColors.background,
                            borderBottomColor: themeColors.border,
                        },
                    ]}
                >
                    {isSearchVisible ? (
                        <View style={styles.searchHeaderContainer}>
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => {
                                    setIsSearchVisible(false);
                                    setSearchQuery('');
                                }}
                            >
                                <IconSymbol
                                    name="arrow.left"
                                    size={22}
                                    color={themeColors.text}
                                />
                            </TouchableOpacity>

                            <View
                                style={[
                                    styles.searchInputContainer,
                                    {
                                        backgroundColor:
                                            themeColors.inputBackground,
                                    },
                                ]}
                            >
                                <IconSymbol
                                    name="magnifyingglass"
                                    size={18}
                                    color={themeColors.subtleText}
                                />

                                <TextInput
                                    style={[
                                        styles.searchInputField,
                                        {
                                            color: themeColors.text,
                                        },
                                    ]}
                                    placeholder="Search grade"
                                    placeholderTextColor={
                                        themeColors.subtleText
                                    }
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoFocus
                                />
                            </View>
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity
                                onPress={() =>
                                    navigation.navigate(
                                        'OperationMenuScreen'
                                    )
                                }
                                style={[
                                    styles.backButtonMain,
                                    {
                                        backgroundColor:
                                            themeColors.subtleBackground,
                                    },
                                ]}
                            >
                                <IconSymbol
                                    name="arrow.left"
                                    size={20}
                                    color={themeColors.icon}
                                />
                            </TouchableOpacity>

                            <ThemedText style={styles.headerTitle}>
                                Grades
                            </ThemedText>

                            <View style={styles.headerRight}>
                                <TouchableOpacity
                                    style={[
                                        styles.iconButton,
                                        {
                                            backgroundColor: isDark
                                                ? themeColors.card
                                                : themeColors.subtleBackground,
                                        },
                                    ]}
                                    onPress={() =>
                                        setIsSearchVisible(true)
                                    }
                                >
                                    <IconSymbol
                                        name="magnifyingglass"
                                        size={22}
                                        color={themeColors.icon}
                                    />
                                </TouchableOpacity>

                                {can('user.user.create_update') && (
                                    <TouchableOpacity
                                        onPress={() =>
                                            navigation.navigate(
                                                'GradeFormScreen',
                                                { data: {} }
                                            )
                                        }
                                        style={[
                                            styles.iconButton,
                                            {
                                                backgroundColor: isDark
                                                    ? themeColors.card
                                                    : themeColors.subtleBackground,
                                            },
                                        ]}
                                    >
                                        <IconSymbol
                                            name="plus"
                                            size={22}
                                            color={themeColors.icon}
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}
                </ThemedView>

                <ScrollView
                    style={styles.content}
                    contentContainerStyle={[
                        styles.contentContainer,
                        {
                            paddingBottom:
                                insets.bottom +
                                Spacing.screenPadding,
                        },
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.gradeList}>
                        {filteredData.length > 0 ? (
                            filteredData.map((item, index) => (
                                <TouchableOpacity
                                    key={item.id || index}
                                    style={[
                                        styles.gradeCard,
                                        {
                                            backgroundColor:
                                                themeColors.card,
                                            borderLeftColor:
                                                themeColors.primary,
                                        },
                                    ]}
                                    onPress={() =>
                                        navigation.navigate(
                                            'GradeFormScreen',
                                            { data: item }
                                        )
                                    }
                                    activeOpacity={0.8}
                                >
                                    <View
                                        style={styles.gradeCardContent}
                                    >
                                        <View
                                            style={styles.gradeTitleRow}
                                        >
                                            <View
                                                style={{
                                                    flexDirection: 'column',
                                                    width: '65%',
                                                }}
                                            >
                                                <Text
                                                    style={[
                                                        styles.gradeName,
                                                        {
                                                            color:
                                                                themeColors.text,
                                                        },
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {item.name || ''}
                                                </Text>

                                                <Text
                                                    style={[
                                                        styles.gradeDescription,
                                                        {
                                                            color:
                                                                themeColors.subtleText,
                                                        },
                                                    ]}
                                                    numberOfLines={2}
                                                >
                                                    {item.description ||
                                                        'No description'}
                                                </Text>
                                            </View>

                                            {can(
                                                'user.grade.create_update'
                                            ) && (
                                                <View
                                                    style={{
                                                        flexDirection: 'row',
                                                        width: '30%',
                                                        justifyContent:
                                                            'flex-end',
                                                    }}
                                                >
                                                    <TouchableOpacity
                                                        onPress={() =>
                                                            navigation.navigate(
                                                                'GradeFormScreen',
                                                                {
                                                                    data: item,
                                                                }
                                                            )
                                                        }
                                                        style={[
                                                            styles.iconButton,
                                                            {
                                                                backgroundColor:
                                                                    themeColors.tabIconDefault,
                                                            },
                                                        ]}
                                                    >
                                                        <IconSymbol
                                                            name="pencil"
                                                            size={18}
                                                            color={
                                                                themeColors.white
                                                            }
                                                        />
                                                    </TouchableOpacity>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <>
                                <ThemedText
                                    style={{
                                        textAlign: 'center',
                                        color: themeColors.subtleText,
                                        marginTop: 50,
                                        fontWeight: '600',
                                    }}
                                >
                                    No record(s) found
                                </ThemedText>

                                <ThemedText
                                    style={{
                                        textAlign: 'justify',
                                        color: themeColors.subtleText,
                                        marginTop: 50,
                                        width: 220,
                                        alignSelf: 'center',
                                        fontSize: 11,
                                        lineHeight: 20,
                                        padding: 20,
                                        backgroundColor:
                                            themeColors.border,
                                        borderRadius: 7,
                                    }}
                                >
                                    Create employee grades to define levels
                                    of responsibility and career progression
                                    such as{' '}
                                    {'\n'}
                                    {'\n'}
                                    • Grade 1 – Entry Level
                                    {'\n'}
                                    • Grade 2 – Junior Staff
                                    {'\n'}
                                    • Grade 3 – Staff
                                    {'\n'}
                                    • Grade 4 – Senior Staff
                                    {'\n'}
                                    • Grade 5 – Supervisor
                                    {'\n'}
                                    • Grade 6 – Manager
                                    {'\n'}
                                    • Grade 7 – Senior Manager
                                    {'\n'}
                                    • Grade 8 – Head of Department
                                    {'\n'}
                                    • Grade 9 – Director
                                    {'\n'}
                                    • Grade 10 – Executive
                                </ThemedText>
                            </>
                        )}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    statusBarSpacer: {
        width: '100%',
        height: 10,
    },

    safeArea: {
        flex: 1,
    },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.screenPadding,
        paddingVertical: Spacing.medium,
        borderBottomWidth: 1,
    },

    headerTitle: {
        fontSize: Typography.heading2,
        fontFamily: 'SemiBold',
    },

    backButtonMain: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0,
    },

    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Spacing.small,
    },

    content: {
        flex: 1,
    },

    contentContainer: {
        padding: Spacing.small,
    },

    searchHeaderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },

    backButton: {
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.medium,
        width: 40,
        height: 40,
        flexShrink: 0,
    },

    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.medium,
        borderRadius: Borders.radiusMedium,
    },

    searchInputField: {
        flex: 1,
        fontSize: Typography.body,
        marginLeft: Spacing.small,
        fontFamily: 'Regular',
        paddingVertical: 12,
    },

    gradeList: {
        gap: 3,
    },

    gradeCard: {
        borderRadius: 2,
        overflow: 'hidden',
        borderBottomWidth: 0.09,
        borderLeftWidth: 3,
    },

    gradeCardContent: {
        padding: Spacing.large,
        position: 'relative',
    },

    gradeTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },

    gradeName: {
        fontSize: 11,
        fontFamily: 'SemiBold',
        marginBottom: 5,
    },

    gradeDescription: {
        fontFamily: 'Regular',
        fontSize: Typography.small,
    },
});

export default GradeListScreen;
