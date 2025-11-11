import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { supabase } from '@/lib/supabase'

type VetForm = {
  name: string
  clinic_name: string
  phone: string
  email: string
  notes: string
}

const INITIAL_FORM: VetForm = {
  name: '',
  clinic_name: '',
  phone: '',
  email: '',
  notes: '',
}

export default function EditVetScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const [form, setForm] = useState<VetForm>(INITIAL_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('Missing vet id.')
      return
    }

    async function loadVet() {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('doghealthy_vets')
        .select('name, clinic_name, phone, email, notes')
        .eq('id', id)
        .maybeSingle()

      if (fetchError) {
        setError(fetchError.message)
      } else if (!data) {
        setError('Vet not found.')
      } else {
        setForm({
          name: data.name ?? '',
          clinic_name: data.clinic_name ?? '',
          phone: data.phone ?? '',
          email: data.email ?? '',
          notes: data.notes ?? '',
        })
      }

      setLoading(false)
    }

    loadVet()
  }, [id])

  function updateField<Key extends keyof VetForm>(key: Key, value: VetForm[Key]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  async function handleSave() {
    if (!id) return
    if (!form.name.trim()) {
      Alert.alert('Update vet', 'Please enter the veterinarian’s name.')
      return
    }

    setSaving(true)

    const { error: updateError } = await supabase
      .from('doghealthy_vets')
      .update({
        name: form.name || null,
        clinic_name: form.clinic_name || null,
        phone: form.phone || null,
        email: form.email || null,
        notes: form.notes || null,
      })
      .eq('id', id)

    setSaving(false)

    if (updateError) {
      Alert.alert('Update vet', updateError.message)
      return
    }

    Alert.alert('Vet updated', 'Changes saved successfully.', [
      {
        text: 'Done',
        onPress: () => router.back(),
      },
    ])
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={24}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Edit Veterinarian</Text>
        <Text style={styles.subtitle}>Update your vet’s contact details.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Vet name</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(text) => updateField('name', text)}
            placeholder="Dr Jane Doe"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Clinic</Text>
          <TextInput
            style={styles.input}
            value={form.clinic_name}
            onChangeText={(text) => updateField('clinic_name', text)}
            placeholder="Clinic name"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={form.phone}
            onChangeText={(text) => updateField('phone', text)}
            placeholder="Contact number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={form.email}
            onChangeText={(text) => updateField('email', text)}
            placeholder="Email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={form.notes}
            onChangeText={(text) => updateField('notes', text)}
            placeholder="Additional details"
            multiline
            numberOfLines={4}
          />
        </View>

        <Pressable style={[styles.button, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.buttonLabel}>{saving ? 'Saving…' : 'Save Changes'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FBFF',
  },
  content: {
    padding: 24,
    gap: 16,
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
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  error: {
    color: '#BC4749',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#2C6E49',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
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

