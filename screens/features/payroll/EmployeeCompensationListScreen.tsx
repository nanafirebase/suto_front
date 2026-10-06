import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { BottomSheetSelectOption, PayrollNavigationList } from '../../../utils/types/index.type';
import { Colors } from '../../../utils/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContainer } from '../../../configuration/navigation/AppContainer';
import { Borders, Spacing, Typography } from '../../../utils/constants/Design';
import { ThemedText } from '../../../components/ui/ThemedText';
import { ThemedView } from '../../../components/ui/ThemedView';
import { IconSymbol } from '../../../components/ui/icon-symbol';
import { SocketIO } from '../../../configuration/helpers/main.helpers';
import { useFocusEffect } from '@react-navigation/native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';

type TEmployeeCompensationListScreen = NativeStackScreenProps<PayrollNavigationList, "EmployeeCompensationListScreen">;
type CompensationSource = 'individual'|'role'|'grade';
type CompensationType = 'salary'|'wage';
type WageRateType = 'fixed'|'percentage';
type WagePeriod = 'hourly'|'daily'|'weekly'|'monthly'|'per_service';

type CompensationFilter = {
    source: BottomSheetSelectOption|null;
    type: BottomSheetSelectOption|null;
    wagePeriod: BottomSheetSelectOption|null
};

const EmployeeCompensationListScreen = ({navigation}: TEmployeeCompensationListScreen) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const isDark = colorScheme === 'dark';
    const {session, selectedBusiness} = useAppContainer();
    const insets = useSafeAreaInsets();

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchVisible, setIsSearchVisible] = useState(false);

    const [form, setForm] = useState<CompensationFilter>({
        source: null,
        type: null,
        wagePeriod: null
    });

    const bottomSheetRef = useRef<BottomSheet>(null);
    const snapPoints = useMemo(() => ['40%', '55%', '75%'], []);
    const [sheetOptions, setSheetOptions] = useState<BottomSheetSelectOption[]>([]);
    const [sheetTitle, setSheetTitle] = useState('');
    const [activeField, setActiveField] = useState<keyof CompensationFilter|null>(null);

    const sourceOptions: BottomSheetSelectOption[] = [
        {key: '', value: 'All'},
        {key: 'individual', value: 'Individual'},
        {key: 'role', value: 'Role'},
        {key: 'grade', value: 'Grade'}
    ];

    const typeOptions: BottomSheetSelectOption[] = [
        {key: '', value: 'All'},
        {key: 'salary', value: 'Salary'},
        {key: 'wage', value: 'Wage'}
    ];

    const wagePeriodOptions: BottomSheetSelectOption[] = [
        {key: '', value: 'All'},
        {key: 'hourly', value: 'Hourly'},
        {key: 'daily', value: 'Daily'},
        {key: 'weekly', value: 'Weekly'},
        {key: 'monthly', value: 'Monthly'},
        {key: 'per_service', value: 'Per Service'}
    ];

    const openBottomSheet = (field: keyof CompensationFilter, options: BottomSheetSelectOption[], title: string) => {
        setActiveField(field);
        setSheetOptions(options);
        setSheetTitle(title);
        bottomSheetRef.current?.snapToIndex(0);
    };

    const selectOption = (option: BottomSheetSelectOption) => {
        if (activeField) setForm(prev => ({...prev, [activeField]: option.key === '' ? null : option}))
        bottomSheetRef.current?.close()
    };

    const fetchCompensations = async () => {
        if (!selectedBusiness.id) return
        setLoading(true)
        SocketIO.emit('fetch-employee-compensations', {
            sessionID: session, businessID: selectedBusiness.id, source: form.source?.key || undefined,
            type: form.type?.key || undefined, wagePeriod: form.wagePeriod?.key || undefined
        }, (response: any) => {
            setLoading(false)
            console.log(response.data)
            if (response.status === 'success') setData(response.data || [])
            else Alert.alert('Error', response.message || 'Failed to fetch compensations')
        })
    }

    useFocusEffect(useCallback(() => {
        fetchCompensations();
    }, [selectedBusiness.id, form.source?.key, form.type?.key, form.wagePeriod?.key]));

    const filteredData = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return data
        return data.filter(item => {
            const text = [
                item.employeeName, item.employeeFirstName, item.employeeLastName, item.sourceName, item.roleName,
                item.gradeName, item.source, item.type, item.wagePeriod, item.wageRateType,
                item.description, item.salary, item.wageRate
            ].filter(Boolean).join(' ').toLowerCase()
            return text.includes(query)
        })
    }, [data, searchQuery])

    const sourceLabel = (item: any) => {
        if (item.source === 'individual') return item.employeeName || `${item.employeeFirstName || ''} ${item.employeeLastName || ''}`.trim() || 'Employee';
        if (item.source === 'role') return item.roleName || item.sourceName || 'Role';
        if (item.source === 'grade') return item.gradeName || item.sourceName || 'Grade';
        return 'Compensation';
    }

    const sourceTypeLabel = (source?: string) => {
        if (source === 'individual') return 'Individual';
        if (source === 'role') return 'Role';
        if (source === 'grade') return 'Grade';
        return '';
    };

    const periodLabel = (period?: string) => {
        if (!period) return '';
        if (period === 'per_service') return 'Per Service';
        return period.charAt(0).toUpperCase() + period.slice(1);
    };

    const formatDate = (value?: string) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'});
    };

    const clearFilters = () => {
        setForm({source: null, type: null, wagePeriod: null});
    };

    const hasFilters = !!(form.source || form.type || form.wagePeriod);

    const handleDelete = (item: any) => {
        Alert.alert('Remove Compensation', `Are you sure you want to remove "${sourceLabel(item)}"?`, [
            {text: 'Cancel', style: 'cancel'},
            {text: 'Remove', style: 'destructive', onPress: () => {
                SocketIO.emit('delete-employee-compensation', {
                    sessionID: session,
                    businessID: selectedBusiness.id,
                    compensationID: item.id
                }, (response: any) => {
                    if (response.status === 'success') fetchCompensations();
                    else Alert.alert('Error', response.message || 'Failed to remove compensation');
                });
            }}
        ]);
    };

    return (
        <View style={[styles.container, {backgroundColor: themeColors.background}]}>
            {Platform.OS === 'android' && <View style={{height: 10, backgroundColor: themeColors.background}} />}
            <View style={[styles.safeArea, {paddingTop: Platform.OS === 'ios' ? insets.top : 0}]}>
                <ThemedView style={[styles.header, {backgroundColor: themeColors.background, borderBottomColor: themeColors.border}]}>
                    {isSearchVisible ? (
                        <View style={styles.searchHeaderContainer}>
                            <TouchableOpacity style={styles.backButton} onPress={() => {setIsSearchVisible(false); setSearchQuery('')}}>
                                <IconSymbol name="arrow.left" size={22} color={themeColors.text}/>
                            </TouchableOpacity>
                            <View style={[styles.searchInputContainer, {backgroundColor: themeColors.inputBackground}]}>
                                <IconSymbol name="magnifyingglass" size={18} color={themeColors.subtleText}/>
                                <TextInput style={[styles.searchInputField, {color: themeColors.text}]} placeholder="Search compensation" placeholderTextColor={themeColors.subtleText} value={searchQuery} onChangeText={setSearchQuery} autoFocus/>
                            </View>
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButtonMain, {backgroundColor: themeColors.subtleBackground}]}>
                                <IconSymbol name="arrow.left" size={20} color={themeColors.icon}/>
                            </TouchableOpacity>
                            <ThemedText style={styles.headerTitle}>Compensation</ThemedText>
                            <View style={styles.headerRight}>
                                <TouchableOpacity style={[styles.iconButton, {backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground}]} onPress={() => setIsSearchVisible(true)}>
                                    <IconSymbol name="magnifyingglass" size={21} color={themeColors.icon}/>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.iconButton, {backgroundColor: isDark ? themeColors.card : themeColors.subtleBackground}]} onPress={() => navigation.navigate('EmployeeCompensationFormScreen', {data: null})}>
                                    <IconSymbol name="plus" size={21} color={themeColors.icon}/>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </ThemedView>

                <ScrollView style={styles.scrollContainer} contentContainerStyle={{paddingBottom: insets.bottom + 30}} showsVerticalScrollIndicator={false}>
                    <View style={styles.filterArea}>
                        <View style={styles.filterHeader}>
                            {hasFilters && <TouchableOpacity onPress={clearFilters}><Text style={{fontSize:11,color:themeColors.primary,fontFamily:'SemiBold'}}>Clear All</Text></TouchableOpacity>}
                        </View>

                        <View style={styles.filterRow}>
                            <TouchableOpacity style={[styles.filterInput, {backgroundColor: themeColors.inputBackground, borderColor: themeColors.border}]} onPress={() => openBottomSheet('source', sourceOptions, 'Filter Source')}>
                                <Text numberOfLines={1} style={{fontSize:Typography.small,color:form.source ? themeColors.text : themeColors.subtleText}}>{form.source?.value || 'Source: All'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.filterInput, {backgroundColor: themeColors.inputBackground, borderColor: themeColors.border}]} onPress={() => openBottomSheet('type', typeOptions, 'Filter Type')}>
                                <Text numberOfLines={1} style={{fontSize:Typography.small,color:form.type ? themeColors.text : themeColors.subtleText}}>{form.type?.value || 'Type: All'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.filterInput, {backgroundColor: themeColors.inputBackground, borderColor: themeColors.border}]} onPress={() => openBottomSheet('wagePeriod', wagePeriodOptions, 'Filter Wage Period')}>
                                <Text numberOfLines={1} style={{fontSize:Typography.small,color:form.wagePeriod ? themeColors.text : themeColors.subtleText}}>{form.wagePeriod?.value || 'Period: All'}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.filterRow}>
                        </View>
                    </View>

                    {loading ? (
                        <View style={styles.emptyContainer}><ThemedText style={{color:themeColors.subtleText}}>Loading compensation...</ThemedText></View>
                    ) : filteredData.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <View style={[styles.emptyIcon, {backgroundColor:themeColors.subtleBackground}]}>
                                <IconSymbol name="credit-card" size={30} color={themeColors.subtleText}/>
                            </View>
                            <ThemedText style={styles.emptyTitle}>No Compensation Found</ThemedText>
                            <Text style={[styles.emptyText, {color:themeColors.subtleText}]}>
                                {searchQuery ? 'No compensation matches your search.' : 'There are no compensation records matching the selected filters.'}
                            </Text>
                        </View>
                    ) : (
                        <View style={{paddingHorizontal:8}}>
                            {filteredData.map((item, index) => (
                                <TouchableOpacity key={item.id || index} activeOpacity={0.8} style={[styles.card, {backgroundColor:themeColors.card, borderColor:themeColors.border, borderLeftColor:item.status === 'inactive' ? themeColors.subtleText : themeColors.primary}]} onPress={() => navigation.navigate('EmployeeCompensationFormScreen', {data: item})}>
                                    <View style={styles.cardTop}>
                                        <View style={{flex:1}}>
                                            <ThemedText style={styles.name} numberOfLines={1}>{sourceLabel(item)}</ThemedText>
                                            <Text style={[styles.subText, {color:themeColors.subtleText}]} numberOfLines={1}>{sourceTypeLabel(item.source)} · {item.type === 'salary' ? 'Salary' : 'Wage'}</Text>
                                        </View>

                                        <View style={styles.amountContainer}>
                                            {item.type === 'salary' ? (
                                                <Text style={[styles.amount, {color:themeColors.text}]}>{item.salary}</Text>
                                            ) : (
                                                <Text style={[styles.amount, {color:themeColors.primary}]}>
                                                    {Number(item.wageRate)}{item.wageRateType === 'percentage' ? '%' : ''}
                                                </Text>
                                            )}
                                            {item.type === 'wage' && <Text style={[styles.subText, {color:themeColors.subtleText}]}>{periodLabel(item.wagePeriod)}</Text>}
                                        </View>

                                        <TouchableOpacity style={[styles.moreButton, {backgroundColor:themeColors.serviceIconBackground}]} onPress={() => handleDelete(item)}>
                                            <IconSymbol name="trash" size={16} color={themeColors.error}/>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={[styles.cardBottom, {borderTopColor:themeColors.border}]}>
                                        <View style={{flex:1}}>
                                            <Text style={[styles.label, {color:themeColors.subtleText}]}>Effective</Text>
                                            <Text style={[styles.value, {color:themeColors.text}]}>{formatDate(item.effectiveFrom)}{item.effectiveTo ? ` - ${formatDate(item.effectiveTo)}` : ' - Current'}</Text>
                                        </View>

                                        <View style={{alignItems:'flex-end'}}>
                                            <Text style={[styles.label, {color:themeColors.subtleText}]}>Currency</Text>
                                            <Text style={[styles.value, {color:themeColors.text}]}>{item.currencyCode || item.currencyName || item.currencyID || '-'}</Text>
                                        </View>
                                    </View>

                                    {item.type === 'wage' && item.wagePeriod === 'per_service' && item.wageRateType === 'percentage' && (
                                        <View style={[styles.serviceBadge, {backgroundColor:`${themeColors.primary}12`}]}>
                                            <IconSymbol name="briefcase" size={13} color={themeColors.primary}/>
                                            <Text style={{fontSize:10,color:themeColors.primary,fontFamily:'Medium'}}>Service-based percentage wage</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </ScrollView>

                <BottomSheet ref={bottomSheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose enableContentPanningGesture enableHandlePanningGesture enableDynamicSizing={false} handleIndicatorStyle={{backgroundColor:themeColors.icon,marginTop:10}} backgroundStyle={{backgroundColor:themeColors.background,borderTopWidth:1,borderTopColor:themeColors.info}}>
                    <ThemedText style={styles.sheetTitle}>{sheetTitle || 'Select Option'}</ThemedText>
                    <BottomSheetScrollView contentContainerStyle={{paddingHorizontal:16}}>
                        {sheetOptions.map(option => {
                            const selected = activeField && form[activeField]?.key === option.key;
                            const allSelected = activeField && !form[activeField] && option.key === '';
                            return (
                                <TouchableOpacity key={option.key} style={[styles.sheetOption,{backgroundColor:themeColors.card}]} onPress={() => selectOption(option)}>
                                    <View style={styles.sheetOptionRow}>
                                        <Text style={{fontSize:Typography.body,color:themeColors.text,fontFamily:'Medium'}}>{option.value}</Text>
                                        {(selected || allSelected) && <IconSymbol name="check" size={20} color={themeColors.primary}/>}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </BottomSheetScrollView>
                </BottomSheet>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container:{flex:1},
    safeArea:{flex:1},
    scrollContainer:{flex:1},
    header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:Spacing.screenPadding,paddingVertical:Spacing.medium,borderBottomWidth:1},
    headerTitle:{fontSize:Typography.heading2,fontFamily:'SemiBold'},
    backButtonMain:{width:36,height:36,borderRadius:18,alignItems:'center',justifyContent:'center'},
    headerRight:{flexDirection:'row',alignItems:'center'},
    iconButton:{width:40,height:40,borderRadius:20,alignItems:'center',justifyContent:'center',marginLeft:Spacing.small},
    searchHeaderContainer:{flexDirection:'row',alignItems:'center',width:'100%'},
    backButton:{width:40,height:40,alignItems:'center',justifyContent:'center',marginRight:Spacing.medium},
    searchInputContainer:{flex:1,flexDirection:'row',alignItems:'center',paddingHorizontal:Spacing.medium,borderRadius:Borders.radiusMedium},
    searchInputField:{flex:1,fontSize:Typography.body,marginLeft:Spacing.small,fontFamily:'Regular',paddingVertical:12},
    filterArea:{padding:8},
    filterHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:5},
    filterTitle:{fontSize:12,fontFamily:'SemiBold'},
    filterRow:{flexDirection:'row',gap:6},
    filterInput:{flex:1,borderWidth:1,borderRadius:Borders.radiusSmall,paddingHorizontal:10,paddingVertical:15,marginBottom:5},
    card:{borderWidth:1,borderLeftWidth:3,borderRadius:4,padding:12,marginBottom:5},
    cardTop:{flexDirection:'row',alignItems:'center'},
    name:{fontSize:13,fontFamily:'SemiBold'},
    subText:{fontSize:10,fontFamily:'Regular',marginTop:2},
    amountContainer:{alignItems:'flex-end',marginLeft:8},
    amount:{fontSize:13,fontFamily:'SemiBold'},
    moreButton:{width:32,height:32,borderRadius:16,alignItems:'center',justifyContent:'center',marginLeft:8},
    cardBottom:{flexDirection:'row',justifyContent:'space-between',borderTopWidth:1,marginTop:9,paddingTop:8},
    label:{fontSize:9,fontFamily:'Regular',marginBottom:2},
    value:{fontSize:10,fontFamily:'Medium'},
    serviceBadge:{flexDirection:'row',alignItems:'center',alignSelf:'flex-start',gap:5,paddingHorizontal:7,paddingVertical:4,borderRadius:10,marginTop:8},
    emptyContainer:{alignItems:'center',paddingVertical:70,paddingHorizontal:30},
    emptyIcon:{width:65,height:65,borderRadius:33,alignItems:'center',justifyContent:'center',marginBottom:15},
    emptyTitle:{fontSize:17,fontFamily:'SemiBold',marginBottom:5},
    emptyText:{fontSize:12,fontFamily:'Regular',textAlign:'center',lineHeight:18},
    sheetTitle:{fontFamily:'SemiBold',fontSize:20,marginBottom:20,textAlign:'center',marginTop:10},
    sheetOption:{padding:20,borderRadius:5,marginBottom:5},
    sheetOptionRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}
});

export default EmployeeCompensationListScreen;