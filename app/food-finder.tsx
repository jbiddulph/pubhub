import { StyleSheet, Text, View } from 'react-native'

export default function FoodFinderScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>DogHealthy Food Finder</Text>
      <Text style={styles.body}>
        Discover personalised nutrition plans, trusted brands, and feeding guides tailored to your
        dog. This section is coming soon—stay tuned!
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

