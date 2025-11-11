import 'react-native-url-polyfill/auto'

import { Session } from '@supabase/supabase-js'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Auth from '@/components/Auth'
import { supabase } from '@/lib/supabase'

type MenuItem = {
  id: string
  label: string
  route?: string
  action?: 'logout' | 'login' | 'register'
}

type Dog = {
  id: string
  name?: string | null
  breed?: string | null
  birth_date?: string | null
}

const LOGGED_OUT_MENU: MenuItem[] = [
  { id: 'food', label: 'Food Finder', route: '/food-finder' },
  { id: 'classifieds', label: 'Classifieds', route: '/classifieds' },
  { id: 'members', label: 'Members', route: '/members' },
  { id: 'login', label: 'Login', action: 'login' },
  { id: 'register', label: 'Register', action: 'register' },
]

const LOGGED_IN_MENU: MenuItem[] = [
  { id: 'food', label: 'Food Finder', route: '/food-finder' },
  { id: 'classifieds', label: 'Classifieds', route: '/classifieds' },
  { id: 'members', label: 'Members', route: '/members' },
  { id: 'dogs', label: 'My Dogs', route: '/my-dogs' },
  { id: 'logout', label: 'Logout', action: 'logout' },
]

function computeDogAgeLabel(birthDate: string) {
  const date = new Date(birthDate)
  if (Number.isNaN(date.getTime())) {
    return 'Age unavailable'
  }

  const now = new Date()
  let years = now.getFullYear() - date.getFullYear()
  let months = now.getMonth() - date.getMonth()

  if (months < 0 || (months === 0 && now.getDate() < date.getDate())) {
    years -= 1
    months += 12
  }

  if (years < 0) {
    return 'Age unavailable'
  }

  if (years === 0) {
    return months <= 1 ? 'Less than a month old' : `${months} months old`
  }

  if (months === 0) {
    return years === 1 ? '1 year old' : `${years} years old`
  }

  return `${years}y ${months}m old`
}

function formatBirthDate(dateString?: string | null) {
  if (!dateString) return null
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString()
}

export default function Index() {
  const [session, setSession] = useState<Session | null>(null)
  const [isAuthExpanded, setIsAuthExpanded] = useState(false)
  const [isMenuVisible, setIsMenuVisible] = useState(false)
  const [dogs, setDogs] = useState<Dog[]>([])
  const [dogsLoading, setDogsLoading] = useState(false)
  const [dogsError, setDogsError] = useState<string | null>(null)

  const router = useRouter()
  const insets = useSafeAreaInsets()
  const isMountedRef = useRef(true)
  const dogsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      if (dogsChannelRef.current) {
        supabase.removeChannel(dogsChannelRef.current)
        dogsChannelRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const fetchDogs = useCallback(async () => {
    if (!isMountedRef.current) {
      return
    }

    const userId = session?.user.id
    if (!userId) {
      setDogs([])
      return
    }

    setDogsLoading(true)
    setDogsError(null)

    const { data, error } = await supabase
      .from('doghealthy_dogs')
      .select('id, name, breed, birth_date')
      .eq('user_id', userId)
      .order('name', { ascending: true })

    if (!isMountedRef.current) {
      return
    }

    if (error) {
      setDogsError(error.message)
      setDogs([])
    } else {
      setDogs(data ?? [])
    }

    setDogsLoading(false)
  }, [session?.user.id])

  useEffect(() => {
    if (!session) {
      setDogs([])
      setIsMenuVisible(false)
      if (dogsChannelRef.current) {
        supabase.removeChannel(dogsChannelRef.current)
        dogsChannelRef.current = null
      }
      return
    }

    fetchDogs()

    if (dogsChannelRef.current) {
      supabase.removeChannel(dogsChannelRef.current)
      dogsChannelRef.current = null
    }

    const channel = supabase
      .channel('doghealthy-dogs-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'doghealthy_dogs',
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          fetchDogs()
        },
      )
      .subscribe()

    dogsChannelRef.current = channel

    return () => {
      if (dogsChannelRef.current) {
        supabase.removeChannel(dogsChannelRef.current)
        dogsChannelRef.current = null
      }
    }
  }, [session, fetchDogs])

  const menuItems = useMemo(() => (session ? LOGGED_IN_MENU : LOGGED_OUT_MENU), [session])

  async function handleMenuItemPress(item: MenuItem) {
    if (item.action === 'logout') {
      await supabase.auth.signOut()
      setIsMenuVisible(false)
      return
    }

    if (item.action === 'login' || item.action === 'register') {
      setIsAuthExpanded(true)
      setIsMenuVisible(false)
      return
    }

    if (item.route) {
      router.push(item.route as any)
      setIsMenuVisible(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: 24 + insets.top }]}>
      <View style={styles.hero}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.brand}>DogHealthy</Text>
            <Text style={styles.tagline}>Wellness for every wag.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isMenuVisible ? 'Hide menu' : 'Show menu'}
            accessibilityHint="Toggle the DogHealthy navigation menu"
            onPress={() => setIsMenuVisible((prev) => !prev)}
            style={styles.menuToggle}>
            <View style={styles.menuToggleBar} />
            <View style={styles.menuToggleBar} />
            <View style={styles.menuToggleBar} />
          </Pressable>
        </View>
      </View>

      {isMenuVisible && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu</Text>
          <FlatList
            data={menuItems}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable onPress={() => handleMenuItemPress(item)} style={styles.menuItem}>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      )}

      {!session && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sign in to DogHealthy</Text>
          {isAuthExpanded ? (
            <Auth />
          ) : (
            <Pressable style={styles.authPrompt} onPress={() => setIsAuthExpanded(true)}>
              <Text style={styles.authPromptText}>Tap to sign in or register</Text>
            </Pressable>
          )}
        </View>
      )}

      {session && (
        <View style={styles.section}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sectionTitle}>Welcome back</Text>
            <Pressable style={styles.logoutButton} onPress={() => supabase.auth.signOut()}>
              <Text style={styles.logoutLabel}>Logout</Text>
            </Pressable>
          </View>
          <Text style={styles.sessionSubhead}>{session.user.email}</Text>
        </View>
      )}

      {session && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Dogs</Text>
          {dogsLoading && <ActivityIndicator />}
          {dogsError && <Text style={styles.errorText}>{dogsError}</Text>}
          {!dogsLoading && !dogsError && dogs.length === 0 && (
            <Text style={styles.helperText}>
              No dogs found yet. Add your first companion from the My Dogs section.
            </Text>
          )}
          {dogs.map((dog) => (
            <View key={dog.id} style={styles.dogCard}>
              <View style={styles.dogInfo}>
                <Text style={styles.dogName}>{dog.name ?? 'Unnamed Friend'}</Text>
                {dog.breed ? <Text style={styles.dogBreed}>{dog.breed}</Text> : null}
                {dog.birth_date ? (
                  <>
                    <Text style={styles.dogAge}>{computeDogAgeLabel(dog.birth_date)}</Text>
                    {formatBirthDate(dog.birth_date) ? (
                      <Text style={styles.dogMeta}>Born {formatBirthDate(dog.birth_date)}</Text>
                    ) : null}
                  </>
                ) : null}
              </View>
              <View style={styles.dogActions}>
                <Pressable
                  style={[styles.actionButton, styles.viewButton]}
                  onPress={() => router.push(`/my-dogs/${dog.id}` as any)}>
                  <Text style={styles.actionLabel}>View Details</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.editButton]}
                  onPress={() => router.push(`/my-dogs/${dog.id}/edit` as any)}>
                  <Text style={styles.actionLabel}>Edit</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 24,
    backgroundColor: '#F7FBFF',
  },
  hero: {
    backgroundColor: '#2C6E49',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tagline: {
    marginTop: 8,
    fontSize: 16,
    color: '#F3F7F0',
  },
  menuToggle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F7F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  menuToggleBar: {
    width: 24,
    height: 2,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B4332',
  },
  menuItem: {
    paddingVertical: 12,
  },
  menuLabel: {
    fontSize: 16,
    color: '#2C6E49',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E5EC',
  },
  authPrompt: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCE3DE',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authPromptText: {
    color: '#2C6E49',
    fontWeight: '500',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionSubhead: {
    fontSize: 16,
    color: '#2C6E49',
  },
  logoutButton: {
    backgroundColor: '#BC4749',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  logoutLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 14,
    color: '#6B9080',
  },
  errorText: {
    color: '#BC4749',
    fontWeight: '500',
  },
  dogCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E5EC',
    padding: 16,
    marginTop: 12,
    gap: 12,
  },
  dogInfo: {
    gap: 4,
  },
  dogName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B4332',
  },
  dogBreed: {
    fontSize: 14,
    color: '#6B9080',
  },
  dogAge: {
    fontSize: 14,
    color: '#6B9080',
  },
  dogMeta: {
    fontSize: 12,
    color: '#839788',
  },
  dogActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: '#2C6E49',
  },
  editButton: {
    backgroundColor: '#1B998B',
  },
})