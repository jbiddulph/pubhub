import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

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

export default function NewVetScreen() {
  const router = useRouter()
  const [form, setForm] = useState<VetForm>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)

  function updateField<Key extends keyof VetForm>(key: Key, value: VetForm[Key]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  async function handleCreate() {
    if (!form.name.trim()) {
      Alert.alert('Add vet', 'Please enter the veterinarian’s name.')
      return
    }

    setSaving(true)

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      setSaving(false)
      Alert.alert('Add vet', sessionError.message)
      return
    }

    if (!session) {
      setSaving(false)
      Alert.alert('Add vet', 'Please sign in before adding a veterinarian.')
      return
    }

    const { error } = await supabase.from('doghealthy_vets').insert({
      user_id: session.user.id,
      name: form.name || null,
      clinic_name: form.clinic_name || null,
      phone: form.phone || null,
      email: form.email || null,
      notes: form.notes || null,
    })

    setSaving(false)

    if (error) {
      Alert.alert('Add vet', error.message)
      return
    }

    Alert.alert('Vet added', 'Your veterinarian has been saved.', [
      {
        text: 'Go back',
        onPress: () => router.back(),
      },
      {
        text: 'Add another',
        onPress: () => setForm(INITIAL_FORM),
      },
    ])
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={24}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Add Veterinarian</Text>
        <Text style={styles.subtitle}>Keep your care team handy for quick updates.</Text>

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

        <Pressable style={[styles.button, saving && styles.buttonDisabled]} onPress={handleCreate} disabled={saving}>
          <Text style={styles.buttonLabel}>{saving ? 'Saving…' : 'Save Vet'}</Text>
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

