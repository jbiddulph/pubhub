import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { supabase } from '@/lib/supabase'

type Dog = {
  name?: string | null
  breed?: string | null
  age?: number | null
  weight_kg?: number | null
  notes?: string | null
  diet?: string | null
}

export default function EditDogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [dog, setDog] = useState<Dog | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    async function loadDog() {
      const { data, error } = await supabase
        .from('doghealthy_dogs')
        .select('name, breed, age, weight_kg, notes, diet')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        Alert.alert('Error loading dog', error.message)
      } else {
        setDog(data ?? {})
      }
      setLoading(false)
    }

    loadDog()
  }, [id])

  async function handleSave() {
    if (!id || !dog) {
      return
    }
    setSaving(true)
    const { error } = await supabase.from('doghealthy_dogs').update(dog).eq('id', id)

    setSaving(false)

    if (error) {
      Alert.alert('Update failed', error.message)
      return
    }

    Alert.alert('Dog updated', 'Details saved successfully.', [
      { text: 'View details', onPress: () => router.replace(`/my-dogs/${id}` as any) },
      { text: 'Stay here' },
    ])
  }

  function updateField<Key extends keyof Dog>(key: Key, value: Dog[Key]) {
    setDog((prev) => ({
      ...(prev ?? {}),
      [key]: value,
    }))
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.helper}>Loading dog...</Text>
      </View>
    )
  }

  if (!dog) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Dog not found.</Text>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Dog</Text>
      <View style={styles.field}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={dog.name ?? ''}
          onChangeText={(text) => updateField('name', text)}
          placeholder="Dog name"
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Breed</Text>
        <TextInput
          style={styles.input}
          value={dog.breed ?? ''}
          onChangeText={(text) => updateField('breed', text)}
          placeholder="Breed"
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Age (years)</Text>
        <TextInput
          style={styles.input}
          value={dog.age?.toString() ?? ''}
          keyboardType="numeric"
          onChangeText={(text) => updateField('age', text ? Number(text) : null)}
          placeholder="Age"
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={dog.weight_kg?.toString() ?? ''}
          keyboardType="numeric"
          onChangeText={(text) => updateField('weight_kg', text ? Number(text) : null)}
          placeholder="Weight"
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Diet</Text>
        <TextInput
          style={styles.input}
          value={dog.diet ?? ''}
          onChangeText={(text) => updateField('diet', text)}
          placeholder="Diet notes"
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={dog.notes ?? ''}
          onChangeText={(text) => updateField('notes', text)}
          placeholder="Care notes"
          multiline
          numberOfLines={4}
        />
      </View>
      <Pressable style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonLabel}>{saving ? 'Saving…' : 'Save Changes'}</Text>
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
  field: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    color: '#2C6E49',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCE3DE',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1B4332',
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#2C6E49',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  helper: {
    color: '#6B9080',
  },
  error: {
    color: '#BC4749',
    fontWeight: '600',
  },
})

