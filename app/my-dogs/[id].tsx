import { Image } from 'expo-image'
import { useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'

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

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('No dog id supplied.')
      return
    }

    async function fetchData() {
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
    }

    fetchData()
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

  const dogWeight = parseNumeric(dog.weight_kg)
  const photoUri = getPublicDogPhotoUrl(dog.photo_url)

  return (
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

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Records</Text>
        {healthError ? <Text style={styles.sectionError}>{healthError}</Text> : null}
        {!healthError && healthRecords.length === 0 ? (
          <Text style={styles.sectionEmpty}>No health records yet.</Text>
        ) : null}
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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vaccinations</Text>
        {vaccinationError ? <Text style={styles.sectionError}>{vaccinationError}</Text> : null}
        {!vaccinationError && vaccinations.length === 0 ? (
          <Text style={styles.sectionEmpty}>No vaccination history yet.</Text>
        ) : null}
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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medications</Text>
        {medicationError ? <Text style={styles.sectionError}>{medicationError}</Text> : null}
        {!medicationError && medications.length === 0 ? (
          <Text style={styles.sectionEmpty}>No medications recorded.</Text>
        ) : null}
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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appointments</Text>
        {appointmentError ? <Text style={styles.sectionError}>{appointmentError}</Text> : null}
        {!appointmentError && appointments.length === 0 ? (
          <Text style={styles.sectionEmpty}>No appointments scheduled.</Text>
        ) : null}
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
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weight Logs</Text>
        {weightError ? <Text style={styles.sectionError}>{weightError}</Text> : null}
        {!weightError && weightLogs.length === 0 ? (
          <Text style={styles.sectionEmpty}>No weight entries yet.</Text>
        ) : null}
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
      </View>
    </ScrollView>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1B4332',
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
})
