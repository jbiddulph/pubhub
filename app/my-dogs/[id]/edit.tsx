import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { getPublicDogPhotoUrl, uploadDogPhoto } from '@/lib/storage'
import { supabase } from '@/lib/supabase'

type Dog = {
  name?: string | null
  breed?: string | null
  gender?: string | null
  birth_date?: string | null
  weight_kg?: number | null
  color?: string | null
  microchip_number?: string | null
  notes?: string | null
  photo_url?: string | null
}

export default function EditDogScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [dog, setDog] = useState<Dog | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [newPhotoUri, setNewPhotoUri] = useState<string | null>(null)
  const [existingPhotoPath, setExistingPhotoPath] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    async function loadDog() {
      const { data, error } = await supabase
        .from('doghealthy_dogs')
        .select(
          'name, breed, gender, birth_date, weight_kg, color, microchip_number, notes, photo_url'
        )
        .eq('id', id)
        .maybeSingle()

      if (error) {
        Alert.alert('Error loading dog', error.message)
      } else {
        setDog(data ?? {})
        const photoPath = data?.photo_url ?? null
        setExistingPhotoPath(photoPath)
        setPhotoPreview(getPublicDogPhotoUrl(photoPath))
      }
      setLoading(false)
    }

    loadDog()
  }, [id])

  async function requestMediaPermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to update your dog image.')
      return false
    }
    return true
  }

  async function handlePickPhoto() {
    const granted = await requestMediaPermissions()
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
    setNewPhotoUri(asset.uri)
    setPhotoPreview(asset.uri)
  }

  async function handleSave() {
    if (!id || !dog) {
      return
    }
    setSaving(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setSaving(false)
      Alert.alert('Session expired', 'Please sign in again to update your dog.')
      return
    }

    let photoPath = existingPhotoPath ?? null

    if (newPhotoUri) {
      const upload = await uploadDogPhoto(session.user.id, newPhotoUri, {
        previousPath: existingPhotoPath,
      })

      if (upload.error) {
        setSaving(false)
        Alert.alert('Photo upload failed', 'Unable to update the photo. Please try again.')
        return
      }

      photoPath = upload.data?.path ?? photoPath
    }

    const payload = {
      name: dog.name ?? null,
      breed: dog.breed ?? null,
      gender: dog.gender ?? null,
      birth_date: dog.birth_date ? dog.birth_date : null,
      weight_kg: typeof dog.weight_kg === 'number' ? dog.weight_kg : null,
      color: dog.color ?? null,
      microchip_number: dog.microchip_number ?? null,
      notes: dog.notes ?? null,
      photo_url: photoPath,
    }

    const { error } = await supabase.from('doghealthy_dogs').update(payload).eq('id', id)

    setSaving(false)

    if (error) {
      Alert.alert('Update failed', error.message)
      return
    }

    setExistingPhotoPath(photoPath)
    if (!photoPath) {
      setPhotoPreview(null)
    }
    setNewPhotoUri(null)

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
        <Text style={styles.label}>Photo</Text>
        <Pressable style={styles.photoButton} onPress={handlePickPhoto}>
          <Text style={styles.photoButtonLabel}>{photoPreview ? 'Change Photo' : 'Select Photo'}</Text>
        </Pressable>
        {photoPreview ? (
          <Image source={photoPreview} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.photoPlaceholderText}>No photo selected</Text>
          </View>
        )}
      </View>
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
        <Text style={styles.label}>Gender</Text>
        <TextInput
          style={styles.input}
          value={dog.gender ?? ''}
          onChangeText={(text) => updateField('gender', text)}
          placeholder="Male / Female"
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Birth date</Text>
        <TextInput
          style={styles.input}
          value={dog.birth_date ?? ''}
          onChangeText={(text) => updateField('birth_date', text)}
          placeholder="YYYY-MM-DD"
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
        <Text style={styles.label}>Coat colour</Text>
        <TextInput
          style={styles.input}
          value={dog.color ?? ''}
          onChangeText={(text) => updateField('color', text)}
          placeholder="Colour"
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Microchip number</Text>
        <TextInput
          style={styles.input}
          value={dog.microchip_number ?? ''}
          onChangeText={(text) => updateField('microchip_number', text)}
          placeholder="Microchip number"
          autoCapitalize="characters"
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
  photoPlaceholder: {
    borderWidth: 1,
    borderColor: '#CCE3DE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    color: '#6B9080',
    fontSize: 14,
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

