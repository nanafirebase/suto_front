import React from 'react'
import { View } from 'react-native'
import { useAuthStore } from '../../utils/stores/useAuthStore'
import RootNavigator from '../../configuration/navigation/RootNavigator'

export function AuthGuard() {
    const { loading } = useAuthStore()

    if (loading) {
        return <View style={{ flex: 1, backgroundColor: '#fff' }} />
    }

    return <RootNavigator />
}
