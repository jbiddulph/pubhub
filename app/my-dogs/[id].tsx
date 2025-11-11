import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'

import { supabase } from '@/lib/supabase'

type Dog = {
  id: string
  name?: string | null
  breed?: string | null
  age?: number | null
  weight_kg?: number | null
  notes?: string | null
  diet?: string | null
}

export default function DogDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [dog, setDog] = useState<Dog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('No dog id supplied.')
      return
    }

    async function fetchDog() {
      setLoading(true)
      const { data, error } = await supabase
        .from('doghealthy_dogs')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        setError(error.message)
      } else {
        setDog(data)
      }

      setLoading(false)
    }

    fetchDog()
  }, [id])

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    )
  }

  if (error || !dog) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error ?? 'Dog not found.'}</Text>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{dog.name ?? 'Unnamed Friend'}</Text>
      {dog.breed ? <Text style={styles.meta}>Breed: {dog.breed}</Text> : null}
      {typeof dog.age === 'number' ? <Text style={styles.meta}>Age: {dog.age} years</Text> : null}
      {typeof dog.weight_kg === 'number' ? (
        <Text style={styles.meta}>Weight: {dog.weight_kg} kg</Text>
      ) : null}
      {dog.diet ? <Text style={styles.meta}>Diet: {dog.diet}</Text> : null}
      {dog.notes ? <Text style={styles.notes}>{dog.notes}</Text> : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 12,
    backgroundColor: '#F7FBFF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F7FBFF',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1B4332',
  },
  meta: {
    fontSize: 16,
    color: '#2C6E49',
  },
  notes: {
    fontSize: 16,
    color: '#2C6E49',
    marginTop: 12,
  },
  error: {
    color: '#BC4749',
    fontWeight: '600',
  },
})

