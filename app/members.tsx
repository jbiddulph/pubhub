import { StyleSheet, Text, View } from 'react-native'

export default function MembersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>DogHealthy Members</Text>
      <Text style={styles.body}>
        Explore premium wellness tools, community perks, and expert support tailored for proactive
        dog owners. Member benefits will be revealed soon.
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

