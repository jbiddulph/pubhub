import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'

import { supabase } from '@/lib/supabase'

type Dog = {
  id: string
  name?: string | null
  breed?: string | null
  gender?: string | null
  birth_date?: string | null
  weight_kg?: number | null
  color?: string | null
  microchip_number?: string | null
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

function formatDate(dateString?: string | null) {
  if (!dateString) return null
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString()
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
        .select(
          'id, name, breed, gender, birth_date, weight_kg, color, microchip_number, notes'
        )
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
      {dog.gender ? <Text style={styles.meta}>Gender: {dog.gender}</Text> : null}
      {computeDogAgeLabel(dog.birth_date) ? (
        <Text style={styles.meta}>Age: {computeDogAgeLabel(dog.birth_date)}</Text>
      ) : null}
      {formatDate(dog.birth_date) ? (
        <Text style={styles.meta}>Birth date: {formatDate(dog.birth_date)}</Text>
      ) : null}
      {typeof dog.weight_kg === 'number' ? (
        <Text style={styles.meta}>Weight: {dog.weight_kg} kg</Text>
      ) : null}
      {dog.color ? <Text style={styles.meta}>Coat: {dog.color}</Text> : null}
      {dog.microchip_number ? (
        <Text style={styles.meta}>Microchip: {dog.microchip_number}</Text>
      ) : null}
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

