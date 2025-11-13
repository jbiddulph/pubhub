import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { supabase } from '@/lib/supabase'

type Dog = {
  id: string
  name?: string | null
  breed?: string | null
  birth_date?: string | null
  notes?: string | null
}

function computeDogAgeLabel(birthDate?: string | null) {
  if (!birthDate) return null
  const date = new Date(birthDate)
  if (Number.isNaN(date.getTime())) return null

  const now = new Date()
  let years = now.getFullYear() - date.getFullYear()
  let months = now.getMonth() - date.getMonth()

  if (months < 0 || (months === 0 && now.getDate() < date.getDate())) {
    years -= 1
    months += 12
  }

  if (years < 0) return null

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

export default function MyDogsScreen() {
  const router = useRouter()
  const [dogs, setDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDogs() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setDogs([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('doghealthy_dogs')
        .select('id, name, breed, birth_date, notes')
        .eq('user_id', session.user.id)
        .order('name', { ascending: true })

      if (error) {
        setError(error.message)
      } else {
        setDogs(data ?? [])
      }

      setLoading(false)
    }

    loadDogs()
  }, [])

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Dogs</Text>
        <Pressable style={styles.addChip} onPress={() => router.push('/my-dogs/new' as any)}>
          <Text style={styles.addChipLabel}>+ Add Dog</Text>
        </Pressable>
      </View>
      <Text style={styles.subtitle}>Manage your DogHealthy companions in one place.</Text>

      {loading && <ActivityIndicator />}
      {error && <Text style={styles.error}>{error}</Text>}

      {!loading && !error && dogs.length === 0 && (
        <Text style={styles.helper}>No dogs yet. Tap “Add Dog” to create a profile.</Text>
      )}

      {dogs.map((dog) => (
        <View key={dog.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{dog.name ?? 'Unnamed Friend'}</Text>
            {dog.breed ? <Text style={styles.cardMeta}>{dog.breed}</Text> : null}
            {computeDogAgeLabel(dog.birth_date) ? (
              <Text style={styles.cardMeta}>{computeDogAgeLabel(dog.birth_date)}</Text>
            ) : null}
            {formatBirthDate(dog.birth_date) ? (
              <Text style={styles.cardMeta}>Born {formatBirthDate(dog.birth_date)}</Text>
            ) : null}
          </View>
          {dog.notes ? <Text style={styles.notes}>{dog.notes}</Text> : null}

          <View style={styles.actions}>
            <Pressable
              onPress={() => router.push(`/my-dogs/${dog.id}` as any)}
              style={[styles.actionButton, styles.viewButton]}>
              <Text style={styles.actionLabel}>View Details</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push(`/my-dogs/${dog.id}/edit` as any)}
              style={[styles.actionButton, styles.editButton]}>
              <Text style={styles.actionLabel}>Edit</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Pressable
        style={[styles.actionButton, styles.addButton]}
        onPress={() => router.push('/my-dogs/new' as any)}>
        <Text style={styles.actionLabel}>Add Dog</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
    backgroundColor: '#F7FBFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1B4332',
  },
  addChip: {
    backgroundColor: '#BC4749',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  addChipLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  subtitle: {
    fontSize: 16,
    color: '#2C6E49',
  },
  error: {
    color: '#BC4749',
    fontWeight: '600',
  },
  helper: {
    color: '#6B9080',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E5EC',
    gap: 12,
  },
  cardHeader: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B4332',
  },
  cardMeta: {
    fontSize: 14,
    color: '#6B9080',
  },
  notes: {
    fontSize: 14,
    color: '#2C6E49',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
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
  addButton: {
    marginTop: 24,
    backgroundColor: '#BC4749',
  },
})

