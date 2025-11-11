import { Image } from 'expo-image'
import { useLocalSearchParams } from 'expo-router'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'

import { getPublicDogPhotoUrl } from '@/lib/storage'
import { supabase } from '@/lib/supabase'

type Dog = {
  id: string
  name?: string | null
  breed?: string | null
  gender?: string | null
  birth_date?: string | null
  weight_kg?: number | string | null
  color?: string | null
  microchip_number?: string | null
  notes?: string | null
  user_id?: string | null
  photo_url?: string | null
}

type HealthRecord = {
  id: string
  record_date?: string | null
  record_type?: string | null
  title?: string | null
  description?: string | null
  diagnosis?: string | null
  treatment?: string | null
  veterinarian_name?: string | null
  clinic_name?: string | null
  cost?: number | string | null
  notes?: string | null
}

type Vaccination = {
  id: string
  vaccine_name?: string | null
  vaccine_type?: string | null
  vaccination_date?: string | null
  next_due_date?: string | null
  veterinarian_name?: string | null
  clinic_name?: string | null
  notes?: string | null
  cost?: number | string | null
}

type Medication = {
  id: string
  medication_name?: string | null
  dosage?: string | null
  frequency?: string | null
  start_date?: string | null
  end_date?: string | null
  prescribed_by?: string | null
  purpose?: string | null
  side_effects?: string | null
  instructions?: string | null
  notes?: string | null
  is_active?: boolean | null
}

type Appointment = {
  id: string
  appointment_date?: string | null
  appointment_type?: string | null
  title?: string | null
  description?: string | null
  location?: string | null
  veterinarian_name?: string | null
  clinic_name?: string | null
  clinic_phone?: string | null
  status?: string | null
  notes?: string | null
}

type WeightLog = {
  id: string
  weight_kg: number | string
  measurement_date?: string | null
  notes?: string | null
}

type DogOwner = {
  id: string
  email?: string | null
  full_name?: string | null
  phone?: string | null
  avatar_url?: string | null
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

function formatDateTime(dateString?: string | null) {
  if (!dateString) return null
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString()
}

function parseNumeric(value?: number | string | null) {
  if (value === null || value === undefined) return null
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : null
}

function formatCurrency(value?: number | string | null) {
  const numeric = parseNumeric(value)
  if (numeric === null) return null
  return `£${numeric.toFixed(2)}`
}

function toNullableNumber(input: string) {
  const trimmed = input.trim()
  if (!trimmed) return null
  const numeric = Number(trimmed)
  return Number.isFinite(numeric) ? numeric : null
}

function toNullableString(input: string) {
  const trimmed = input.trim()
  return trimmed.length ? trimmed : null
}

type SectionKey = 'health' | 'vaccinations' | 'medications' | 'appointments' | 'weight'

type HealthFormState = {
  record_date: string
  record_type: string
  title: string
  description: string
  diagnosis: string
  treatment: string
  veterinarian_name: string
  clinic_name: string
  cost: string
  notes: string
}

type VaccinationFormState = {
  vaccine_name: string
  vaccine_type: string
  vaccination_date: string
  next_due_date: string
  veterinarian_name: string
  clinic_name: string
  cost: string
  notes: string
}

type MedicationFormState = {
  medication_name: string
  dosage: string
  frequency: string
  start_date: string
  end_date: string
  prescribed_by: string
  purpose: string
  side_effects: string
  instructions: string
  notes: string
  is_active: boolean
}

type AppointmentFormState = {
  appointment_date: string
  appointment_type: string
  title: string
  description: string
  location: string
  veterinarian_name: string
  clinic_name: string
  clinic_phone: string
  status: string
  notes: string
}

type WeightFormState = {
  measurement_date: string
  weight_kg: string
  notes: string
}

const INITIAL_HEALTH_FORM: HealthFormState = {
  record_date: '',
  record_type: '',
  title: '',
  description: '',
  diagnosis: '',
  treatment: '',
  veterinarian_name: '',
  clinic_name: '',
  cost: '',
  notes: '',
}

const INITIAL_VACCINATION_FORM: VaccinationFormState = {
  vaccine_name: '',
  vaccine_type: '',
  vaccination_date: '',
  next_due_date: '',
  veterinarian_name: '',
  clinic_name: '',
  cost: '',
  notes: '',
}

const INITIAL_MEDICATION_FORM: MedicationFormState = {
  medication_name: '',
  dosage: '',
  frequency: '',
  start_date: '',
  end_date: '',
  prescribed_by: '',
  purpose: '',
  side_effects: '',
  instructions: '',
  notes: '',
  is_active: true,
}

const INITIAL_APPOINTMENT_FORM: AppointmentFormState = {
  appointment_date: '',
  appointment_type: '',
  title: '',
  description: '',
  location: '',
  veterinarian_name: '',
  clinic_name: '',
  clinic_phone: '',
  status: '',
  notes: '',
}

const INITIAL_WEIGHT_FORM: WeightFormState = {
  measurement_date: '',
  weight_kg: '',
  notes: '',
}

type SectionAccordionProps = {
  title: string
  expanded: boolean
  onToggle: () => void
  onAdd: () => void
  children: ReactNode
  error?: string | null
  emptyMessage?: string
  isEmpty: boolean
}

function SectionAccordion({
  title,
  expanded,
  onToggle,
  onAdd,
  children,
  error,
  emptyMessage,
  isEmpty,
}: SectionAccordionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Pressable style={styles.sectionHeaderMain} onPress={onToggle}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionChevron}>{expanded ? '−' : '+'}</Text>
        </Pressable>
        <Pressable style={styles.addButton} onPress={onAdd}>
          <Text style={styles.addButtonLabel}>+ Add</Text>
        </Pressable>
      </View>

      {expanded ? (
        <>
          {error ? <Text style={styles.sectionError}>{error}</Text> : null}
          {!error && isEmpty && emptyMessage ? (
            <Text style={styles.sectionEmpty}>{emptyMessage}</Text>
          ) : null}
          {!error && !isEmpty ? children : null}
        </>
      ) : null}
    </View>
  )
}

export default function DogDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [dog, setDog] = useState<Dog | null>(null)
  const [owner, setOwner] = useState<DogOwner | null>(null)
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([])
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [medications, setMedications] = useState<Medication[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [vaccinationError, setVaccinationError] = useState<string | null>(null)
  const [medicationError, setMedicationError] = useState<string | null>(null)
  const [appointmentError, setAppointmentError] = useState<string | null>(null)
  const [weightError, setWeightError] = useState<string | null>(null)
  const [ownerError, setOwnerError] = useState<string | null>(null)
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>('health')

  const [showHealthModal, setShowHealthModal] = useState(false)
  const [healthForm, setHealthForm] = useState<HealthFormState>(INITIAL_HEALTH_FORM)
  const [savingHealth, setSavingHealth] = useState(false)

  const [showVaccinationModal, setShowVaccinationModal] = useState(false)
  const [vaccinationForm, setVaccinationForm] = useState<VaccinationFormState>(INITIAL_VACCINATION_FORM)
  const [savingVaccination, setSavingVaccination] = useState(false)

  const [showMedicationModal, setShowMedicationModal] = useState(false)
  const [medicationForm, setMedicationForm] = useState<MedicationFormState>(INITIAL_MEDICATION_FORM)
  const [savingMedication, setSavingMedication] = useState(false)

  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormState>(INITIAL_APPOINTMENT_FORM)
  const [savingAppointment, setSavingAppointment] = useState(false)

  const [showWeightModal, setShowWeightModal] = useState(false)
  const [weightForm, setWeightForm] = useState<WeightFormState>(INITIAL_WEIGHT_FORM)
  const [savingWeight, setSavingWeight] = useState(false)

  const fetchData = useCallback(async () => {
    if (!id) {
      setLoading(false)
      setError('No dog id supplied.')
      return
    }

    setLoading(true)
    setError(null)
    setHealthError(null)
    setVaccinationError(null)
    setMedicationError(null)
    setAppointmentError(null)
    setWeightError(null)
    setOwner(null)
    setOwnerError(null)

    const { data: dogData, error: dogFetchError } = await supabase
      .from('doghealthy_dogs')
      .select(
        'id, name, breed, gender, birth_date, weight_kg, color, microchip_number, notes, user_id, photo_url'
      )
      .eq('id', id)
      .maybeSingle()

    if (dogFetchError) {
      setError(dogFetchError.message)
      setLoading(false)
      return
    }

    setDog(dogData)

    if (dogData?.user_id) {
      const { data: ownerData, error: ownerFetchError } = await supabase
        .from('doghealthy_users')
        .select('id, email, full_name, phone, avatar_url')
        .eq('id', dogData.user_id)
        .maybeSingle()

      if (ownerFetchError) {
        setOwnerError(ownerFetchError.message)
      } else {
        setOwner(ownerData)
      }
    }

    const [
      healthResponse,
      vaccinationResponse,
      medicationResponse,
      appointmentResponse,
      weightResponse,
    ] = await Promise.all([
      supabase
        .from('doghealthy_health_records')
        .select(
          'id, record_date, record_type, title, description, diagnosis, treatment, veterinarian_name, clinic_name, cost, notes'
        )
        .eq('dog_id', id)
        .order('record_date', { ascending: false }),
      supabase
        .from('doghealthy_vaccinations')
        .select(
          'id, vaccine_name, vaccine_type, vaccination_date, next_due_date, veterinarian_name, clinic_name, notes, cost'
        )
        .eq('dog_id', id)
        .order('vaccination_date', { ascending: false }),
      supabase
        .from('doghealthy_medications')
        .select(
          'id, medication_name, dosage, frequency, start_date, end_date, prescribed_by, purpose, side_effects, instructions, notes, is_active'
        )
        .eq('dog_id', id)
        .order('start_date', { ascending: false }),
      supabase
        .from('doghealthy_appointments')
        .select(
          'id, appointment_date, appointment_type, title, description, location, veterinarian_name, clinic_name, clinic_phone, status, notes'
        )
        .eq('dog_id', id)
        .order('appointment_date', { ascending: false }),
      supabase
        .from('doghealthy_weight_logs')
        .select('id, weight_kg, measurement_date, notes')
        .eq('dog_id', id)
        .order('measurement_date', { ascending: false }),
    ])

    if (healthResponse.error) {
      setHealthError(healthResponse.error.message)
    } else {
      setHealthRecords(healthResponse.data ?? [])
    }

    if (vaccinationResponse.error) {
      setVaccinationError(vaccinationResponse.error.message)
    } else {
      setVaccinations(vaccinationResponse.data ?? [])
    }

    if (medicationResponse.error) {
      setMedicationError(medicationResponse.error.message)
    } else {
      setMedications(medicationResponse.data ?? [])
    }

    if (appointmentResponse.error) {
      setAppointmentError(appointmentResponse.error.message)
    } else {
      setAppointments(appointmentResponse.data ?? [])
    }

    if (weightResponse.error) {
      setWeightError(weightResponse.error.message)
    } else {
      setWeightLogs(weightResponse.data ?? [])
    }

    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function toggleSection(key: SectionKey) {
    setExpandedSection((current) => (current === key ? null : key))
  }

  function openHealthModal() {
    setHealthForm({ ...INITIAL_HEALTH_FORM })
    setShowHealthModal(true)
  }

  function openVaccinationModal() {
    setVaccinationForm({ ...INITIAL_VACCINATION_FORM })
    setShowVaccinationModal(true)
  }

  function openMedicationModal() {
    setMedicationForm({ ...INITIAL_MEDICATION_FORM })
    setShowMedicationModal(true)
  }

  function openAppointmentModal() {
    setAppointmentForm({ ...INITIAL_APPOINTMENT_FORM })
    setShowAppointmentModal(true)
  }

  function openWeightModal() {
    setWeightForm({ ...INITIAL_WEIGHT_FORM })
    setShowWeightModal(true)
  }

  async function handleSubmitHealth() {
    if (!id) return
    if (!healthForm.title.trim()) {
      Alert.alert('Add health record', 'Please enter a title before saving.')
      return
    }

    try {
      setSavingHealth(true)
      const { error: insertError } = await supabase.from('doghealthy_health_records').insert({
        dog_id: id,
        record_date: toNullableString(healthForm.record_date),
        record_type: toNullableString(healthForm.record_type),
        title: toNullableString(healthForm.title),
        description: toNullableString(healthForm.description),
        diagnosis: toNullableString(healthForm.diagnosis),
        treatment: toNullableString(healthForm.treatment),
        veterinarian_name: toNullableString(healthForm.veterinarian_name),
        clinic_name: toNullableString(healthForm.clinic_name),
        cost: toNullableNumber(healthForm.cost),
        notes: toNullableString(healthForm.notes),
      })

      if (insertError) {
        Alert.alert('Could not add health record', insertError.message)
        return
      }

      setShowHealthModal(false)
      setHealthForm({ ...INITIAL_HEALTH_FORM })
      await fetchData()
      setExpandedSection('health')
      Alert.alert('Health record added', 'The health record has been saved.')
    } catch (formError) {
      const message = formError instanceof Error ? formError.message : 'Something went wrong.'
      Alert.alert('Could not add health record', message)
    } finally {
      setSavingHealth(false)
    }
  }

  async function handleSubmitVaccination() {
    if (!id) return
    if (!vaccinationForm.vaccine_name.trim()) {
      Alert.alert('Add vaccination', 'Please enter the vaccination name.')
      return
    }

    try {
      setSavingVaccination(true)
      const { error: insertError } = await supabase.from('doghealthy_vaccinations').insert({
        dog_id: id,
        vaccine_name: toNullableString(vaccinationForm.vaccine_name),
        vaccine_type: toNullableString(vaccinationForm.vaccine_type),
        vaccination_date: toNullableString(vaccinationForm.vaccination_date),
        next_due_date: toNullableString(vaccinationForm.next_due_date),
        veterinarian_name: toNullableString(vaccinationForm.veterinarian_name),
        clinic_name: toNullableString(vaccinationForm.clinic_name),
        cost: toNullableNumber(vaccinationForm.cost),
        notes: toNullableString(vaccinationForm.notes),
      })

      if (insertError) {
        Alert.alert('Could not add vaccination', insertError.message)
        return
      }

      setShowVaccinationModal(false)
      setVaccinationForm({ ...INITIAL_VACCINATION_FORM })
      await fetchData()
      setExpandedSection('vaccinations')
      Alert.alert('Vaccination added', 'The vaccination record has been saved.')
    } catch (formError) {
      const message = formError instanceof Error ? formError.message : 'Something went wrong.'
      Alert.alert('Could not add vaccination', message)
    } finally {
      setSavingVaccination(false)
    }
  }

  async function handleSubmitMedication() {
    if (!id) return
    if (!medicationForm.medication_name.trim()) {
      Alert.alert('Add medication', 'Please enter the medication name.')
      return
    }

    try {
      setSavingMedication(true)
      const { error: insertError } = await supabase.from('doghealthy_medications').insert({
        dog_id: id,
        medication_name: toNullableString(medicationForm.medication_name),
        dosage: toNullableString(medicationForm.dosage),
        frequency: toNullableString(medicationForm.frequency),
        start_date: toNullableString(medicationForm.start_date),
        end_date: toNullableString(medicationForm.end_date),
        prescribed_by: toNullableString(medicationForm.prescribed_by),
        purpose: toNullableString(medicationForm.purpose),
        side_effects: toNullableString(medicationForm.side_effects),
        instructions: toNullableString(medicationForm.instructions),
        notes: toNullableString(medicationForm.notes),
        is_active: medicationForm.is_active,
      })

      if (insertError) {
        Alert.alert('Could not add medication', insertError.message)
        return
      }

      setShowMedicationModal(false)
      setMedicationForm({ ...INITIAL_MEDICATION_FORM })
      await fetchData()
      setExpandedSection('medications')
      Alert.alert('Medication added', 'The medication record has been saved.')
    } catch (formError) {
      const message = formError instanceof Error ? formError.message : 'Something went wrong.'
      Alert.alert('Could not add medication', message)
    } finally {
      setSavingMedication(false)
    }
  }

  async function handleSubmitAppointment() {
    if (!id) return
    if (!appointmentForm.title.trim()) {
      Alert.alert('Add appointment', 'Please enter the appointment title.')
      return
    }

    try {
      setSavingAppointment(true)
      const { error: insertError } = await supabase.from('doghealthy_appointments').insert({
        dog_id: id,
        appointment_date: toNullableString(appointmentForm.appointment_date),
        appointment_type: toNullableString(appointmentForm.appointment_type),
        title: toNullableString(appointmentForm.title),
        description: toNullableString(appointmentForm.description),
        location: toNullableString(appointmentForm.location),
        veterinarian_name: toNullableString(appointmentForm.veterinarian_name),
        clinic_name: toNullableString(appointmentForm.clinic_name),
        clinic_phone: toNullableString(appointmentForm.clinic_phone),
        status: toNullableString(appointmentForm.status),
        notes: toNullableString(appointmentForm.notes),
      })

      if (insertError) {
        Alert.alert('Could not add appointment', insertError.message)
        return
      }

      setShowAppointmentModal(false)
      setAppointmentForm({ ...INITIAL_APPOINTMENT_FORM })
      await fetchData()
      setExpandedSection('appointments')
      Alert.alert('Appointment added', 'The appointment has been saved.')
    } catch (formError) {
      const message = formError instanceof Error ? formError.message : 'Something went wrong.'
      Alert.alert('Could not add appointment', message)
    } finally {
      setSavingAppointment(false)
    }
  }

  async function handleSubmitWeight() {
    if (!id) return
    const weightValue = toNullableNumber(weightForm.weight_kg)
    if (weightValue === null) {
      Alert.alert('Add weight log', 'Please enter your dog’s weight in kilograms.')
      return
    }

    try {
      setSavingWeight(true)
      const { error: insertError } = await supabase.from('doghealthy_weight_logs').insert({
        dog_id: id,
        measurement_date: toNullableString(weightForm.measurement_date),
        weight_kg: weightValue,
        notes: toNullableString(weightForm.notes),
      })

      if (insertError) {
        Alert.alert('Could not add weight entry', insertError.message)
        return
      }

      setShowWeightModal(false)
      setWeightForm({ ...INITIAL_WEIGHT_FORM })
      await fetchData()
      setExpandedSection('weight')
      Alert.alert('Weight entry added', 'The weight entry has been saved.')
    } catch (formError) {
      const message = formError instanceof Error ? formError.message : 'Something went wrong.'
      Alert.alert('Could not add weight entry', message)
    } finally {
      setSavingWeight(false)
    }
  }

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

  const dogWeight = parseNumeric(dog.weight_kg)
  const photoUri = getPublicDogPhotoUrl(dog.photo_url)

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
      {photoUri ? <Image source={photoUri} style={styles.photo} contentFit="cover" /> : null}
      <Text style={styles.title}>{dog.name ?? 'Unnamed Friend'}</Text>
      {dog.breed ? <Text style={styles.meta}>Breed: {dog.breed}</Text> : null}
      {dog.gender ? <Text style={styles.meta}>Gender: {dog.gender}</Text> : null}
      {computeDogAgeLabel(dog.birth_date) ? (
        <Text style={styles.meta}>Age: {computeDogAgeLabel(dog.birth_date)}</Text>
      ) : null}
      {formatDate(dog.birth_date) ? (
        <Text style={styles.meta}>Birth date: {formatDate(dog.birth_date)}</Text>
      ) : null}
      {dogWeight !== null ? (
        <Text style={styles.meta}>Weight: {dogWeight} kg</Text>
      ) : null}
      {dog.color ? <Text style={styles.meta}>Coat: {dog.color}</Text> : null}
      {dog.microchip_number ? (
        <Text style={styles.meta}>Microchip: {dog.microchip_number}</Text>
      ) : null}
      {dog.notes ? <Text style={styles.notes}>{dog.notes}</Text> : null}

      {owner || ownerError ? (
        <View style={styles.ownerCard}>
          <Text style={styles.sectionTitle}>Owner</Text>
          {ownerError ? <Text style={styles.sectionError}>{ownerError}</Text> : null}
          {owner ? (
            <>
              {owner.full_name ? (
                <Text style={styles.cardMeta}>Name: {owner.full_name}</Text>
              ) : null}
              {owner.email ? <Text style={styles.cardMeta}>Email: {owner.email}</Text> : null}
              {owner.phone ? <Text style={styles.cardMeta}>Phone: {owner.phone}</Text> : null}
            </>
          ) : (
            !ownerError && <Text style={styles.sectionEmpty}>Owner details unavailable.</Text>
          )}
        </View>
      ) : null}

      <SectionAccordion
        title="Health Records"
        expanded={expandedSection === 'health'}
        onToggle={() => toggleSection('health')}
        onAdd={openHealthModal}
        error={healthError}
        emptyMessage="No health records yet."
        isEmpty={healthRecords.length === 0}
      >
        {healthRecords.map((record) => (
          <View key={record.id} style={styles.card}>
            <Text style={styles.cardTitle}>{record.title ?? 'Health record'}</Text>
            <Text style={styles.cardMeta}>
              {formatDate(record.record_date) ?? 'Date unknown'} · {record.record_type ?? 'General'}
            </Text>
            {record.clinic_name || record.veterinarian_name ? (
              <Text style={styles.cardMeta}>
                {record.clinic_name ?? 'Clinic'} • {record.veterinarian_name ?? 'Vet'}
              </Text>
            ) : null}
            {record.diagnosis ? (
              <Text style={styles.cardMeta}>Diagnosis: {record.diagnosis}</Text>
            ) : null}
            {record.treatment ? (
              <Text style={styles.cardMeta}>Treatment: {record.treatment}</Text>
            ) : null}
            {formatCurrency(record.cost) ? (
              <Text style={styles.cardMeta}>Cost: {formatCurrency(record.cost)}</Text>
            ) : null}
            {record.description ? (
              <Text style={styles.cardNotes}>{record.description}</Text>
            ) : null}
            {record.notes ? <Text style={styles.cardNotes}>{record.notes}</Text> : null}
          </View>
        ))}
      </SectionAccordion>

      <SectionAccordion
        title="Vaccinations"
        expanded={expandedSection === 'vaccinations'}
        onToggle={() => toggleSection('vaccinations')}
        onAdd={openVaccinationModal}
        error={vaccinationError}
        emptyMessage="No vaccination history yet."
        isEmpty={vaccinations.length === 0}
      >
        {vaccinations.map((vaccination) => (
          <View key={vaccination.id} style={styles.card}>
            <Text style={styles.cardTitle}>{vaccination.vaccine_name ?? 'Vaccination'}</Text>
            <Text style={styles.cardMeta}>
              {formatDate(vaccination.vaccination_date) ?? 'Date unknown'}
              {vaccination.vaccine_type ? ` • ${vaccination.vaccine_type}` : ''}
            </Text>
            {formatDate(vaccination.next_due_date) ? (
              <Text style={styles.cardMeta}>
                Next due: {formatDate(vaccination.next_due_date)}
              </Text>
            ) : null}
            {vaccination.clinic_name || vaccination.veterinarian_name ? (
              <Text style={styles.cardMeta}>
                {vaccination.clinic_name ?? 'Clinic'} • {vaccination.veterinarian_name ?? 'Vet'}
              </Text>
            ) : null}
            {formatCurrency(vaccination.cost) ? (
              <Text style={styles.cardMeta}>Cost: {formatCurrency(vaccination.cost)}</Text>
            ) : null}
            {vaccination.notes ? (
              <Text style={styles.cardNotes}>{vaccination.notes}</Text>
            ) : null}
          </View>
        ))}
      </SectionAccordion>

      <SectionAccordion
        title="Medications"
        expanded={expandedSection === 'medications'}
        onToggle={() => toggleSection('medications')}
        onAdd={openMedicationModal}
        error={medicationError}
        emptyMessage="No medications recorded."
        isEmpty={medications.length === 0}
      >
        {medications.map((medication) => (
          <View key={medication.id} style={styles.card}>
            <Text style={styles.cardTitle}>{medication.medication_name ?? 'Medication'}</Text>
            <Text style={styles.cardMeta}>
              {medication.dosage ?? 'Dosage n/a'}
              {medication.frequency ? ` • ${medication.frequency}` : ''}
            </Text>
            <Text style={styles.cardMeta}>
              {formatDate(medication.start_date) ?? 'Start n/a'} –{' '}
              {formatDate(medication.end_date) ?? 'Ongoing'}
            </Text>
            {medication.prescribed_by ? (
              <Text style={styles.cardMeta}>Prescribed by {medication.prescribed_by}</Text>
            ) : null}
            {medication.purpose ? (
              <Text style={styles.cardNotes}>Purpose: {medication.purpose}</Text>
            ) : null}
            {medication.side_effects ? (
              <Text style={styles.cardNotes}>Side effects: {medication.side_effects}</Text>
            ) : null}
            {medication.instructions ? (
              <Text style={styles.cardNotes}>Instructions: {medication.instructions}</Text>
            ) : null}
            {medication.notes ? <Text style={styles.cardNotes}>{medication.notes}</Text> : null}
            {medication.is_active === false ? (
              <Text style={styles.cardMeta}>Status: Completed</Text>
            ) : null}
          </View>
        ))}
      </SectionAccordion>

      <SectionAccordion
        title="Appointments"
        expanded={expandedSection === 'appointments'}
        onToggle={() => toggleSection('appointments')}
        onAdd={openAppointmentModal}
        error={appointmentError}
        emptyMessage="No appointments scheduled."
        isEmpty={appointments.length === 0}
      >
        {appointments.map((appointment) => (
          <View key={appointment.id} style={styles.card}>
            <Text style={styles.cardTitle}>{appointment.title ?? 'Appointment'}</Text>
            <Text style={styles.cardMeta}>
              {formatDateTime(appointment.appointment_date) ?? 'Date/time n/a'}
            </Text>
            {appointment.appointment_type ? (
              <Text style={styles.cardMeta}>Type: {appointment.appointment_type}</Text>
            ) : null}
            {appointment.location ? (
              <Text style={styles.cardMeta}>Location: {appointment.location}</Text>
            ) : null}
            {appointment.clinic_name || appointment.veterinarian_name ? (
              <Text style={styles.cardMeta}>
                {appointment.clinic_name ?? 'Clinic'} • {appointment.veterinarian_name ?? 'Vet'}
              </Text>
            ) : null}
            {appointment.clinic_phone ? (
              <Text style={styles.cardMeta}>Phone: {appointment.clinic_phone}</Text>
            ) : null}
            {appointment.status ? (
              <Text style={styles.cardMeta}>Status: {appointment.status}</Text>
            ) : null}
            {appointment.description ? (
              <Text style={styles.cardNotes}>{appointment.description}</Text>
            ) : null}
            {appointment.notes ? <Text style={styles.cardNotes}>{appointment.notes}</Text> : null}
          </View>
        ))}
      </SectionAccordion>

      <SectionAccordion
        title="Weight Logs"
        expanded={expandedSection === 'weight'}
        onToggle={() => toggleSection('weight')}
        onAdd={openWeightModal}
        error={weightError}
        emptyMessage="No weight entries yet."
        isEmpty={weightLogs.length === 0}
      >
        {weightLogs.map((log) => {
          const weightValue = parseNumeric(log.weight_kg)
          return (
            <View key={log.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {formatDate(log.measurement_date) ?? 'Measurement date n/a'}
              </Text>
              <Text style={styles.cardMeta}>
                Weight: {weightValue !== null ? `${weightValue} kg` : 'Unknown'}
              </Text>
              {log.notes ? <Text style={styles.cardNotes}>{log.notes}</Text> : null}
            </View>
          )
        })}
      </SectionAccordion>
      </ScrollView>
      {/* Modals */}
      <Modal
        visible={showHealthModal}
        animationType="slide"
        onRequestClose={() => setShowHealthModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Add Health Record</Text>
            <TextInput
              style={styles.modalInput}
              value={healthForm.title}
              onChangeText={(text) => setHealthForm((prev) => ({ ...prev, title: text }))}
              placeholder="Title"
            />
            <TextInput
              style={styles.modalInput}
              value={healthForm.record_type}
              onChangeText={(text) => setHealthForm((prev) => ({ ...prev, record_type: text }))}
              placeholder="Record type"
            />
            <TextInput
              style={styles.modalInput}
              value={healthForm.record_date}
              onChangeText={(text) => setHealthForm((prev) => ({ ...prev, record_date: text }))}
              placeholder="Record date (YYYY-MM-DD)"
            />
            <TextInput
              style={styles.modalInput}
              value={healthForm.veterinarian_name}
              onChangeText={(text) => setHealthForm((prev) => ({ ...prev, veterinarian_name: text }))}
              placeholder="Veterinarian name"
            />
            <TextInput
              style={styles.modalInput}
              value={healthForm.clinic_name}
              onChangeText={(text) => setHealthForm((prev) => ({ ...prev, clinic_name: text }))}
              placeholder="Clinic name"
            />
            <TextInput
              style={styles.modalInput}
              value={healthForm.cost}
              onChangeText={(text) => setHealthForm((prev) => ({ ...prev, cost: text }))}
              placeholder="Cost (£)"
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.modalInput, styles.modalMultiline]}
              value={healthForm.diagnosis}
              onChangeText={(text) => setHealthForm((prev) => ({ ...prev, diagnosis: text }))}
              placeholder="Diagnosis"
              multiline
            />
            <TextInput
              style={[styles.modalInput, styles.modalMultiline]}
              value={healthForm.treatment}
              onChangeText={(text) => setHealthForm((prev) => ({ ...prev, treatment: text }))}
              placeholder="Treatment"
              multiline
            />
            <TextInput
              style={[styles.modalInput, styles.modalMultiline]}
              value={healthForm.description}
              onChangeText={(text) => setHealthForm((prev) => ({ ...prev, description: text }))}
              placeholder="Description"
              multiline
            />
            <TextInput
              style={[styles.modalInput, styles.modalMultiline]}
              value={healthForm.notes}
              onChangeText={(text) => setHealthForm((prev) => ({ ...prev, notes: text }))}
              placeholder="Notes"
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalButton, styles.modalCancel]} onPress={() => setShowHealthModal(false)}>
                <Text style={styles.modalCancelLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalPrimary, savingHealth && styles.buttonDisabled]}
                onPress={handleSubmitHealth}
                disabled={savingHealth}
              >
                <Text style={styles.modalPrimaryLabel}>{savingHealth ? 'Saving…' : 'Save Record'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showVaccinationModal}
        animationType="slide"
        onRequestClose={() => setShowVaccinationModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Add Vaccination</Text>
            <TextInput
              style={styles.modalInput}
              value={vaccinationForm.vaccine_name}
              onChangeText={(text) => setVaccinationForm((prev) => ({ ...prev, vaccine_name: text }))}
              placeholder="Vaccine name"
            />
            <TextInput
              style={styles.modalInput}
              value={vaccinationForm.vaccine_type}
              onChangeText={(text) => setVaccinationForm((prev) => ({ ...prev, vaccine_type: text }))}
              placeholder="Vaccine type"
            />
            <TextInput
              style={styles.modalInput}
              value={vaccinationForm.vaccination_date}
              onChangeText={(text) => setVaccinationForm((prev) => ({ ...prev, vaccination_date: text }))}
              placeholder="Vaccination date (YYYY-MM-DD)"
            />
            <TextInput
              style={styles.modalInput}
              value={vaccinationForm.next_due_date}
              onChangeText={(text) => setVaccinationForm((prev) => ({ ...prev, next_due_date: text }))}
              placeholder="Next due date (YYYY-MM-DD)"
            />
            <TextInput
              style={styles.modalInput}
              value={vaccinationForm.veterinarian_name}
              onChangeText={(text) => setVaccinationForm((prev) => ({ ...prev, veterinarian_name: text }))}
              placeholder="Veterinarian name"
            />
            <TextInput
              style={styles.modalInput}
              value={vaccinationForm.clinic_name}
              onChangeText={(text) => setVaccinationForm((prev) => ({ ...prev, clinic_name: text }))}
              placeholder="Clinic name"
            />
            <TextInput
              style={styles.modalInput}
              value={vaccinationForm.cost}
              onChangeText={(text) => setVaccinationForm((prev) => ({ ...prev, cost: text }))}
              placeholder="Cost (£)"
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.modalInput, styles.modalMultiline]}
              value={vaccinationForm.notes}
              onChangeText={(text) => setVaccinationForm((prev) => ({ ...prev, notes: text }))}
              placeholder="Notes"
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setShowVaccinationModal(false)}
              >
                <Text style={styles.modalCancelLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalPrimary, savingVaccination && styles.buttonDisabled]}
                onPress={handleSubmitVaccination}
                disabled={savingVaccination}
              >
                <Text style={styles.modalPrimaryLabel}>{savingVaccination ? 'Saving…' : 'Save Record'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showMedicationModal}
        animationType="slide"
        onRequestClose={() => setShowMedicationModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Add Medication</Text>
            <TextInput
              style={styles.modalInput}
              value={medicationForm.medication_name}
              onChangeText={(text) => setMedicationForm((prev) => ({ ...prev, medication_name: text }))}
              placeholder="Medication name"
            />
            <TextInput
              style={styles.modalInput}
              value={medicationForm.dosage}
              onChangeText={(text) => setMedicationForm((prev) => ({ ...prev, dosage: text }))}
              placeholder="Dosage"
            />
            <TextInput
              style={styles.modalInput}
              value={medicationForm.frequency}
              onChangeText={(text) => setMedicationForm((prev) => ({ ...prev, frequency: text }))}
              placeholder="Frequency"
            />
            <TextInput
              style={styles.modalInput}
              value={medicationForm.start_date}
              onChangeText={(text) => setMedicationForm((prev) => ({ ...prev, start_date: text }))}
              placeholder="Start date (YYYY-MM-DD)"
            />
            <TextInput
              style={styles.modalInput}
              value={medicationForm.end_date}
              onChangeText={(text) => setMedicationForm((prev) => ({ ...prev, end_date: text }))}
              placeholder="End date (YYYY-MM-DD)"
            />
            <TextInput
              style={styles.modalInput}
              value={medicationForm.prescribed_by}
              onChangeText={(text) => setMedicationForm((prev) => ({ ...prev, prescribed_by: text }))}
              placeholder="Prescribed by"
            />
            <TextInput
              style={styles.modalInput}
              value={medicationForm.purpose}
              onChangeText={(text) => setMedicationForm((prev) => ({ ...prev, purpose: text }))}
              placeholder="Purpose"
            />
            <TextInput
              style={styles.modalInput}
              value={medicationForm.instructions}
              onChangeText={(text) => setMedicationForm((prev) => ({ ...prev, instructions: text }))}
              placeholder="Instructions"
            />
            <TextInput
              style={styles.modalInput}
              value={medicationForm.side_effects}
              onChangeText={(text) => setMedicationForm((prev) => ({ ...prev, side_effects: text }))}
              placeholder="Side effects"
            />
            <TextInput
              style={[styles.modalInput, styles.modalMultiline]}
              value={medicationForm.notes}
              onChangeText={(text) => setMedicationForm((prev) => ({ ...prev, notes: text }))}
              placeholder="Notes"
              multiline
            />
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Active medication</Text>
              <Switch
                value={medicationForm.is_active}
                onValueChange={(value) =>
                  setMedicationForm((prev) => ({
                    ...prev,
                    is_active: value,
                  }))
                }
              />
            </View>
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setShowMedicationModal(false)}
              >
                <Text style={styles.modalCancelLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalPrimary, savingMedication && styles.buttonDisabled]}
                onPress={handleSubmitMedication}
                disabled={savingMedication}
              >
                <Text style={styles.modalPrimaryLabel}>{savingMedication ? 'Saving…' : 'Save Record'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showAppointmentModal}
        animationType="slide"
        onRequestClose={() => setShowAppointmentModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Add Appointment</Text>
            <TextInput
              style={styles.modalInput}
              value={appointmentForm.title}
              onChangeText={(text) => setAppointmentForm((prev) => ({ ...prev, title: text }))}
              placeholder="Title"
            />
            <TextInput
              style={styles.modalInput}
              value={appointmentForm.appointment_type}
              onChangeText={(text) => setAppointmentForm((prev) => ({ ...prev, appointment_type: text }))}
              placeholder="Appointment type"
            />
            <TextInput
              style={styles.modalInput}
              value={appointmentForm.appointment_date}
              onChangeText={(text) => setAppointmentForm((prev) => ({ ...prev, appointment_date: text }))}
              placeholder="Appointment date & time"
            />
            <TextInput
              style={styles.modalInput}
              value={appointmentForm.location}
              onChangeText={(text) => setAppointmentForm((prev) => ({ ...prev, location: text }))}
              placeholder="Location"
            />
            <TextInput
              style={styles.modalInput}
              value={appointmentForm.veterinarian_name}
              onChangeText={(text) => setAppointmentForm((prev) => ({ ...prev, veterinarian_name: text }))}
              placeholder="Veterinarian name"
            />
            <TextInput
              style={styles.modalInput}
              value={appointmentForm.clinic_name}
              onChangeText={(text) => setAppointmentForm((prev) => ({ ...prev, clinic_name: text }))}
              placeholder="Clinic name"
            />
            <TextInput
              style={styles.modalInput}
              value={appointmentForm.clinic_phone}
              onChangeText={(text) => setAppointmentForm((prev) => ({ ...prev, clinic_phone: text }))}
              placeholder="Clinic phone"
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.modalInput}
              value={appointmentForm.status}
              onChangeText={(text) => setAppointmentForm((prev) => ({ ...prev, status: text }))}
              placeholder="Status"
            />
            <TextInput
              style={[styles.modalInput, styles.modalMultiline]}
              value={appointmentForm.description}
              onChangeText={(text) => setAppointmentForm((prev) => ({ ...prev, description: text }))}
              placeholder="Description"
              multiline
            />
            <TextInput
              style={[styles.modalInput, styles.modalMultiline]}
              value={appointmentForm.notes}
              onChangeText={(text) => setAppointmentForm((prev) => ({ ...prev, notes: text }))}
              placeholder="Notes"
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setShowAppointmentModal(false)}
              >
                <Text style={styles.modalCancelLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalPrimary, savingAppointment && styles.buttonDisabled]}
                onPress={handleSubmitAppointment}
                disabled={savingAppointment}
              >
                <Text style={styles.modalPrimaryLabel}>{savingAppointment ? 'Saving…' : 'Save Appointment'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showWeightModal}
        animationType="slide"
        onRequestClose={() => setShowWeightModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Add Weight Entry</Text>
            <TextInput
              style={styles.modalInput}
              value={weightForm.weight_kg}
              onChangeText={(text) => setWeightForm((prev) => ({ ...prev, weight_kg: text }))}
              placeholder="Weight (kg)"
              keyboardType="decimal-pad"
            />
            <TextInput
              style={styles.modalInput}
              value={weightForm.measurement_date}
              onChangeText={(text) => setWeightForm((prev) => ({ ...prev, measurement_date: text }))}
              placeholder="Measurement date (YYYY-MM-DD)"
            />
            <TextInput
              style={[styles.modalInput, styles.modalMultiline]}
              value={weightForm.notes}
              onChangeText={(text) => setWeightForm((prev) => ({ ...prev, notes: text }))}
              placeholder="Notes"
              multiline
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setShowWeightModal(false)}
              >
                <Text style={styles.modalCancelLabel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalPrimary, savingWeight && styles.buttonDisabled]}
                onPress={handleSubmitWeight}
                disabled={savingWeight}
              >
                <Text style={styles.modalPrimaryLabel}>{savingWeight ? 'Saving…' : 'Save Entry'}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 20,
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
  photo: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#E0E5EC',
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
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E0E5EC',
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionHeaderMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B4332',
  },
  sectionChevron: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2C6E49',
    marginLeft: 12,
  },
  sectionEmpty: {
    fontSize: 14,
    color: '#6B9080',
  },
  sectionError: {
    fontSize: 14,
    color: '#BC4749',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E5EC',
    padding: 16,
    gap: 6,
  },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2C6E49',
  },
  addButtonLabel: {
    color: '#2C6E49',
    fontWeight: '600',
    fontSize: 14,
  },
  cardTitle: {
    fontSize: 16,
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
  ownerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E0E5EC',
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  error: {
    color: '#BC4749',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F7FBFF',
  },
  modalContent: {
    padding: 24,
    gap: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1B4332',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCE3DE',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1B4332',
  },
  modalMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancel: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6B9080',
  },
  modalPrimary: {
    backgroundColor: '#2C6E49',
  },
  modalCancelLabel: {
    color: '#6B9080',
    fontWeight: '600',
    fontSize: 15,
  },
  modalPrimaryLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 16,
    color: '#2C6E49',
    fontWeight: '500',
  },
})
