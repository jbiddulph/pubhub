import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { supabase } from '@/lib/supabase'

type Vet = {
  id: string
  name?: string | null
  clinic_name?: string | null
  phone?: string | null
  email?: string | null
  notes?: string | null
}

export default function VetDirectoryScreen() {
  const router = useRouter()
  const [vets, setVets] = useState<Vet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadVets = useCallback(async () => {
    setLoading(true)
    setError(null)

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      setError(sessionError.message)
      setLoading(false)
      return
    }

    if (!session) {
      setVets([])
      setLoading(false)
      return
    }

    const { data, error: vetsError } = await supabase
      .from('doghealthy_vets')
      .select('id, name, clinic_name, phone, email, notes')
      .eq('user_id', session.user.id)
      .order('name', { ascending: true })

    if (vetsError) {
      setError(vetsError.message)
    } else {
      setVets(data ?? [])
    }

    setLoading(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadVets()
    }, [loadVets]),
  )

  function handleAddVet() {
    router.push('/my-dogs/vets/new' as any)
  }

  function handleEditVet(id: string) {
    router.push(`/my-dogs/vets/${id}/edit` as any)
  }

  function handleDeleteVet(id: string) {
    Alert.alert('Delete vet', 'Are you sure you want to remove this vet?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error: deleteError } = await supabase.from('doghealthy_vets').delete().eq('id', id)
          if (deleteError) {
            Alert.alert('Could not delete vet', deleteError.message)
            return
          }
          loadVets()
        },
      },
    ])
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>My Veterinarians</Text>
      <Text style={styles.subtitle}>Manage the clinics and professionals who care for your dog.</Text>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && !error && vets.length === 0 ? (
        <Text style={styles.helper}>No vets saved yet. Tap “Add Vet” to get started.</Text>
      ) : null}

      {vets.map((vet) => (
        <View key={vet.id} style={styles.card}>
          <Text style={styles.cardTitle}>{vet.name ?? 'Veterinarian'}</Text>
          {vet.clinic_name ? <Text style={styles.cardMeta}>{vet.clinic_name}</Text> : null}
          {vet.phone ? <Text style={styles.cardMeta}>Phone: {vet.phone}</Text> : null}
          {vet.email ? <Text style={styles.cardMeta}>Email: {vet.email}</Text> : null}
          {vet.notes ? <Text style={styles.cardNotes}>{vet.notes}</Text> : null}
          <View style={styles.actions}>
            <Pressable style={[styles.actionButton, styles.editButton]} onPress={() => handleEditVet(vet.id)}>
              <Text style={styles.actionLabel}>Edit</Text>
            </Pressable>
            <Pressable style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDeleteVet(vet.id)}>
              <Text style={styles.actionLabel}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}

      <Pressable style={[styles.actionButton, styles.addButton]} onPress={handleAddVet}>
        <Text style={styles.actionLabel}>Add Vet</Text>
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1B4332',
  },
  subtitle: {
    fontSize: 16,
    color: '#2C6E49',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
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
    gap: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B4332',
  },
  cardMeta: {
    fontSize: 14,
    color: '#2C6E49',
  },
  cardNotes: {
    fontSize: 14,
    color: '#6B9080',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
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
  editButton: {
    backgroundColor: '#1B998B',
  },
  deleteButton: {
    backgroundColor: '#BC4749',
  },
  addButton: {
    marginTop: 24,
    backgroundColor: '#2C6E49',
  },
})

