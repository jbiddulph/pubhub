import { StyleSheet, Text, View } from 'react-native'

export default function ClassifiedsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>DogHealthy Classifieds</Text>
      <Text style={styles.body}>
        Find trusted services, trainers, and community listings for everything your dog needs.
        Listings will appear here shortly.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FBFF',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1B4332',
  },
  body: {
    fontSize: 16,
    color: '#2C6E49',
  },
})

