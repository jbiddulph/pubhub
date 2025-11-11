import { Session } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import 'react-native-url-polyfill/auto'

import Auth from '@/components/Auth'
import { supabase } from '@/lib/supabase'

export default function Index() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (!session) {
    return (
      <View>
        <Auth />
      </View>
    )
  }

  return (
    <View>
      <Text>Signed in as {session.user.email}</Text>
      {/* render your tab navigator or redirect here */}
    </View>
  )
}