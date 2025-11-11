import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, View, Pressable } from 'react-native'

import { uploadDogPhoto } from '@/lib/storage'
import { supabase } from '@/lib/supabase'

type DogForm = {
  name: string
  breed: string
  gender?: string
  birth_date?: string
  weight_kg?: number | null
  color?: string
  microchip_number?: string
  notes?: string
}

const INITIAL_FORM: DogForm = {
  name: '',
  breed: '',
  gender: '',
  birth_date: '',
  weight_kg: undefined,
  color: '',
  microchip_number: '',
  notes: '',
}

export default function NewDogScreen() {
  const router = useRouter()
  const [form, setForm] = useState<DogForm>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoUri, setPhotoUri] = useState<string | null>(null)

  async function requestImagePermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to upload a picture of your dog.')
      return false
    }
    return true
  }

  async function handlePickPhoto() {
    const granted = await requestImagePermissions()
    if (!granted) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: false,
    })

    if (result.canceled || !result.assets?.length) {
      return
    }

    const asset = result.assets[0]
    setPhotoUri(asset.uri)
    setPhotoPreview(asset.uri)
  }

  function updateField<Key extends keyof DogForm>(key: Key, value: DogForm[Key]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  async function handleCreate() {
    setSaving(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setSaving(false)
      Alert.alert('Sign-in required', 'Please sign in before creating a dog profile.')
      return
    }

    let photoPath: string | null = null

    if (photoUri) {
      const upload = await uploadDogPhoto(session.user.id, photoUri)
      if (upload.error) {
        Alert.alert('Photo upload failed', 'Please try choosing a different image.')
        setSaving(false)
        return
      }
      photoPath = upload.data?.path ?? null
    }

    const { data, error } = await supabase
      .from('doghealthy_dogs')
      .insert({
        user_id: session.user.id,
        name: form.name || null,
        breed: form.breed || null,
        gender: form.gender || null,
        birth_date: form.birth_date || null,
        weight_kg: form.weight_kg ?? null,
        color: form.color || null,
        microchip_number: form.microchip_number || null,
        notes: form.notes || null,
        photo_url: photoPath,
      })
      .select('id')
      .maybeSingle()

    setSaving(false)

    if (error) {
      Alert.alert('Could not create dog', error.message)
      return
    }

    Alert.alert('Dog added', 'Your companion has been added to DogHealthy!', [
      { text: 'View', onPress: () => router.replace(`/my-dogs/${data?.id}` as any) },
      { text: 'Close', style: 'cancel', onPress: () => router.back() },
    ])
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Add your dog</Text>
      <Text style={styles.subtitle}>Create a DogHealthy profile to track wellbeing and care.</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(text) => updateField('name', text)}
          placeholder="Dog name"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Breed</Text>
        <TextInput
          style={styles.input}
          value={form.breed}
          onChangeText={(text) => updateField('breed', text)}
          placeholder="Breed"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Gender</Text>
        <TextInput
          style={styles.input}
          value={form.gender ?? ''}
          onChangeText={(text) => updateField('gender', text)}
          placeholder="Male / Female"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Birth date</Text>
        <TextInput
          style={styles.input}
          value={form.birth_date ?? ''}
          onChangeText={(text) => updateField('birth_date', text)}
          placeholder="YYYY-MM-DD"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={form.weight_kg?.toString() ?? ''}
          keyboardType="numeric"
          onChangeText={(text) => updateField('weight_kg', text ? Number(text) : undefined)}
          placeholder="Weight"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Coat colour</Text>
        <TextInput
          style={styles.input}
          value={form.color ?? ''}
          onChangeText={(text) => updateField('color', text)}
          placeholder="Colour"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Microchip number</Text>
        <TextInput
          style={styles.input}
          value={form.microchip_number ?? ''}
          onChangeText={(text) => updateField('microchip_number', text)}
          placeholder="Microchip number"
          autoCapitalize="characters"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Photo</Text>
        <Pressable style={styles.photoButton} onPress={handlePickPhoto}>
          <Text style={styles.photoButtonLabel}>{photoPreview ? 'Change Photo' : 'Select Photo'}</Text>
        </Pressable>
        {photoPreview ? (
          <Image source={photoPreview} style={styles.photo} contentFit="cover" />
        ) : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Care Notes</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={form.notes ?? ''}
          onChangeText={(text) => updateField('notes', text)}
          placeholder="Behaviour, health, and wellbeing notes"
          multiline
          numberOfLines={4}
        />
      </View>

      <Pressable style={[styles.button, saving && styles.buttonDisabled]} onPress={handleCreate} disabled={saving}>
        <Text style={styles.buttonLabel}>{saving ? 'Saving…' : 'Create Dog Profile'}</Text>
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
  photoButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2C6E49',
    paddingVertical: 10,
    alignItems: 'center',
  },
  photoButtonLabel: {
    color: '#2C6E49',
    fontWeight: '600',
  },
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: '#E0E5EC',
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
})

