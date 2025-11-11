import { ReactNode, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

type FoodProduct = {
  id: string
  name: string
  brand: string
  type: 'dry' | 'wet' | 'raw' | 'freeze-dried'
  breedSizes: Array<'small' | 'medium' | 'large'>
  lifeStage: 'puppy' | 'adult' | 'senior'
  priceRange: 'under-30' | '30-50' | '50-100' | '100-plus'
  diets: string[]
  rating: number
  price: number
  description: string
}

const PRODUCTS: FoodProduct[] = [
  {
    id: 'wild-harvest',
    name: 'Wild Harvest Grain Free Salmon',
    brand: 'Wild Harvest',
    type: 'dry',
    breedSizes: ['medium', 'large'],
    lifeStage: 'adult',
    priceRange: '30-50',
    diets: ['grain-free'],
    rating: 4.8,
    price: 42,
    description: 'High-protein salmon recipe with sweet potato and botanicals for active dogs.',
  },
  {
    id: 'gentle-puppy',
    name: 'Gentle Start Chicken & Rice',
    brand: 'Gentle Start',
    type: 'dry',
    breedSizes: ['small', 'medium'],
    lifeStage: 'puppy',
    priceRange: '30-50',
    diets: ['sensitive-stomach'],
    rating: 4.6,
    price: 38,
    description: 'Easily digestible kibble with prebiotics to support developing stomachs.',
  },
  {
    id: 'peak-wet',
    name: 'Peak Nutrition Turkey Stew',
    brand: 'Peak Nutrition',
    type: 'wet',
    breedSizes: ['small', 'medium', 'large'],
    lifeStage: 'adult',
    priceRange: 'under-30',
    diets: ['weight-management'],
    rating: 4.4,
    price: 28,
    description: 'Slow-cooked turkey with veg in gravy for dogs watching their weight.',
  },
  {
    id: 'heritage-raw',
    name: 'Heritage Raw Feast',
    brand: 'Heritage Kitchen',
    type: 'raw',
    breedSizes: ['medium', 'large'],
    lifeStage: 'adult',
    priceRange: '50-100',
    diets: ['grain-free'],
    rating: 4.9,
    price: 68,
    description: 'Complete raw diet with 80/10/10 blend, ideal for experienced raw feeders.',
  },
  {
    id: 'velvet-senior',
    name: 'Velvet Senior Lamb & Veg',
    brand: 'Velvet Care',
    type: 'dry',
    breedSizes: ['small', 'medium', 'large'],
    lifeStage: 'senior',
    priceRange: '30-50',
    diets: ['hypoallergenic'],
    rating: 4.5,
    price: 44,
    description: 'Joint-supporting recipe with green-lipped mussel and gentle lamb protein.',
  },
  {
    id: 'air-dried-gourmet',
    name: 'Air-Dried Gourmet Chicken Bites',
    brand: 'Tailwind',
    type: 'freeze-dried',
    breedSizes: ['small', 'medium'],
    lifeStage: 'adult',
    priceRange: '50-100',
    diets: ['grain-free', 'sensitive-stomach'],
    rating: 4.7,
    price: 72,
    description: 'Lightweight, high-value bites perfect as toppers or training food.',
  },
  {
    id: 'budget-wet',
    name: 'Budget Bites Beef Casserole',
    brand: 'Budget Bites',
    type: 'wet',
    breedSizes: ['small', 'medium', 'large'],
    lifeStage: 'adult',
    priceRange: 'under-30',
    diets: [],
    rating: 4.2,
    price: 24,
    description: 'Affordable, hearty beef casserole with added vitamins and minerals.',
  },
  {
    id: 'absolute-lite',
    name: 'Absolute Balance Lite',
    brand: 'Absolute Balance',
    type: 'dry',
    breedSizes: ['small', 'medium', 'large'],
    lifeStage: 'adult',
    priceRange: '30-50',
    diets: ['weight-management'],
    rating: 4.3,
    price: 36,
    description: 'Lower calorie chicken recipe designed for dogs prone to weight gain.',
  },
]

const FOOD_TYPE_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'Dry', value: 'dry' },
  { label: 'Wet', value: 'wet' },
  { label: 'Raw', value: 'raw' },
  { label: 'Freeze-Dried', value: 'freeze-dried' },
]

const BREED_SIZE_OPTIONS = [
  { label: 'All Sizes', value: 'all' },
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
]

const LIFE_STAGE_OPTIONS = [
  { label: 'All Life Stages', value: 'all' },
  { label: 'Puppy', value: 'puppy' },
  { label: 'Adult', value: 'adult' },
  { label: 'Senior', value: 'senior' },
]

const PRICE_OPTIONS = [
  { label: 'Any Price', value: 'all' },
  { label: 'Under £30', value: 'under-30' },
  { label: '£30 - £50', value: '30-50' },
  { label: '£50 - £100', value: '50-100' },
  { label: '£100+', value: '100-plus' },
]

const DIET_OPTIONS = [
  { label: 'Any Diet', value: 'all' },
  { label: 'Grain Free', value: 'grain-free' },
  { label: 'Hypoallergenic', value: 'hypoallergenic' },
  { label: 'Weight Management', value: 'weight-management' },
  { label: 'Sensitive Stomach', value: 'sensitive-stomach' },
]

const SORT_OPTIONS = [
  { label: 'Highest Rated', value: 'rating-desc' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Name A-Z', value: 'name-asc' },
]

type FilterPillProps = {
  label: string
  selected: boolean
  onPress: () => void
}

function FilterPill({ label, selected, onPress }: FilterPillProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterPill, selected && styles.filterPillSelected]}
    >
      <Text style={[styles.filterPillLabel, selected && styles.filterPillLabelSelected]}>
        {label}
      </Text>
    </Pressable>
  )
}

export default function FoodFinderScreen() {
  const [selectedType, setSelectedType] = useState('all')
  const [selectedSize, setSelectedSize] = useState('all')
  const [selectedLifeStage, setSelectedLifeStage] = useState('all')
  const [selectedPrice, setSelectedPrice] = useState('all')
  const [selectedDiet, setSelectedDiet] = useState('all')
  const [sortOption, setSortOption] = useState('rating-desc')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  const filteredProducts = useMemo(() => {
    let items = PRODUCTS.slice()

    if (selectedType !== 'all') {
      items = items.filter((item) => item.type === selectedType)
    }
    if (selectedSize !== 'all') {
      items = items.filter((item) => item.breedSizes.includes(selectedSize as 'small' | 'medium' | 'large'))
    }
    if (selectedLifeStage !== 'all') {
      items = items.filter((item) => item.lifeStage === selectedLifeStage)
    }
    if (selectedPrice !== 'all') {
      items = items.filter((item) => item.priceRange === selectedPrice)
    }
    if (selectedDiet !== 'all') {
      items = items.filter((item) => item.diets.includes(selectedDiet))
    }

    switch (sortOption) {
      case 'price-asc':
        items.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        items.sort((a, b) => b.price - a.price)
        break
      case 'name-asc':
        items.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'rating-desc':
      default:
        items.sort((a, b) => b.rating - a.rating)
        break
    }

    return items
  }, [selectedType, selectedSize, selectedLifeStage, selectedPrice, selectedDiet, sortOption])

  const hasActiveFilters =
    selectedType !== 'all' ||
    selectedSize !== 'all' ||
    selectedLifeStage !== 'all' ||
    selectedPrice !== 'all' ||
    selectedDiet !== 'all'

  function handleClearFilters() {
    setSelectedType('all')
    setSelectedSize('all')
    setSelectedLifeStage('all')
    setSelectedPrice('all')
    setSelectedDiet('all')
    setSortOption('rating-desc')
  }

  function renderProduct(product: FoodProduct): ReactNode {
    return (
      <View key={product.id} style={styles.productCard}>
        <View style={styles.productHeader}>
          <View style={styles.productTitleRow}>
            <Text style={styles.productTitle}>{product.name}</Text>
            <Text style={styles.productBadge}>{product.type.replace('-', ' ')}</Text>
          </View>
          <Text style={styles.productBrand}>{product.brand}</Text>
        </View>
        <Text style={styles.productDescription}>{product.description}</Text>
        <View style={styles.productMetaRow}>
          <Text style={styles.productMeta}>
            ⭐ {product.rating.toFixed(1)} · £{product.price.toFixed(2)}
          </Text>
          <Text style={styles.productMeta}>
            {product.lifeStage.charAt(0).toUpperCase() + product.lifeStage.slice(1)} ·{' '}
            {product.breedSizes.map((size) => size.charAt(0).toUpperCase() + size.slice(1)).join(', ')}
          </Text>
        </View>
        {product.diets.length ? (
          <View style={styles.dietRow}>
            {product.diets.map((diet) => (
              <View key={diet} style={styles.dietPill}>
                <Text style={styles.dietPillLabel}>
                  {diet
                    .split('-')
                    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                    .join(' ')}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>DogHealthy Food Finder</Text>
      <Text style={styles.subtitle}>
        Browse hand-picked dog foods by diet, budget, and life stage. Tap a filter to tailor the list
        for your companion.
      </Text>

      <View style={styles.filtersContainer}>
        <Text style={styles.filterHeading}>Food Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FOOD_TYPE_OPTIONS.map((option) => (
            <FilterPill
              key={option.value}
              label={option.label}
              selected={selectedType === option.value}
              onPress={() => setSelectedType(option.value)}
            />
          ))}
        </ScrollView>

        <Text style={styles.filterHeading}>Breed Size</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {BREED_SIZE_OPTIONS.map((option) => (
            <FilterPill
              key={option.value}
              label={option.label}
              selected={selectedSize === option.value}
              onPress={() => setSelectedSize(option.value)}
            />
          ))}
        </ScrollView>

        <Text style={styles.filterHeading}>Life Stage</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {LIFE_STAGE_OPTIONS.map((option) => (
            <FilterPill
              key={option.value}
              label={option.label}
              selected={selectedLifeStage === option.value}
              onPress={() => setSelectedLifeStage(option.value)}
            />
          ))}
        </ScrollView>

        <Text style={styles.filterHeading}>Price</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {PRICE_OPTIONS.map((option) => (
            <FilterPill
              key={option.value}
              label={option.label}
              selected={selectedPrice === option.value}
              onPress={() => setSelectedPrice(option.value)}
            />
          ))}
        </ScrollView>

        <Text style={styles.filterHeading}>Special Diets</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {DIET_OPTIONS.map((option) => (
            <FilterPill
              key={option.value}
              label={option.label}
              selected={selectedDiet === option.value}
              onPress={() => setSelectedDiet(option.value)}
            />
          ))}
        </ScrollView>

        <Text style={styles.filterHeading}>Sort</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {SORT_OPTIONS.map((option) => (
            <FilterPill
              key={option.value}
              label={option.label}
              selected={sortOption === option.value}
              onPress={() => setSortOption(option.value)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsHeadline}>
          {loading
            ? 'Loading recommendations…'
            : `${filteredProducts.length} food option${filteredProducts.length === 1 ? '' : 's'} found`}
        </Text>
        {hasActiveFilters ? (
          <Pressable onPress={handleClearFilters}>
            <Text style={styles.clearFilters}>Clear filters</Text>
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color="#2C6E49" style={styles.loadingIndicator} />
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No matches just yet</Text>
          <Text style={styles.emptyBody}>
            Try relaxing a filter or choose “Any Diet” to explore more meals that could suit your dog.
          </Text>
        </View>
      ) : (
        <View style={styles.productList}>
          {filteredProducts.map((product) => renderProduct(product))}
        </View>
      )}

      <View style={styles.disclosure}>
        <Text style={styles.disclosureTitle}>Affiliate Disclosure</Text>
        <Text style={styles.disclosureBody}>
          DogHealthy earns a commission from qualifying purchases made through featured links at no
          extra cost to you. Your support keeps wellness tracking free for every wagging tail. 🐕
        </Text>
      </View>

      <View style={styles.quickLinks}>
        <Text style={styles.quickLinksTitle}>Quick Links</Text>
        <View style={styles.quickLinkRow}>
          <Text style={styles.quickLink}>• Home</Text>
          <Text style={styles.quickLink}>• My Dogs</Text>
          <Text style={styles.quickLink}>• Food Finder</Text>
          <Text style={styles.quickLink}>• Food Quiz</Text>
        </View>
      </View>

      <View style={styles.features}>
        <Text style={styles.featuresTitle}>What’s inside DogHealthy</Text>
        <View style={styles.featuresList}>
          <Text style={styles.featureItem}>📋 Health Records</Text>
          <Text style={styles.featureItem}>💉 Vaccinations</Text>
          <Text style={styles.featureItem}>💊 Medications</Text>
          <Text style={styles.featureItem}>📅 Appointments</Text>
          <Text style={styles.featureItem}>🏥 Vet Contacts</Text>
          <Text style={styles.featureItem}>🍖 Food Finder</Text>
        </View>
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1B4332',
  },
  subtitle: {
    fontSize: 16,
    color: '#2C6E49',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E5EC',
    padding: 20,
    gap: 16,
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  filterHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C6E49',
    marginBottom: 6,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CCE3DE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  filterPillSelected: {
    backgroundColor: '#2C6E49',
    borderColor: '#2C6E49',
  },
  filterPillLabel: {
    color: '#2C6E49',
    fontWeight: '500',
  },
  filterPillLabelSelected: {
    color: '#FFFFFF',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultsHeadline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B4332',
  },
  clearFilters: {
    fontSize: 14,
    color: '#BC4749',
    fontWeight: '600',
  },
  loadingIndicator: {
    marginTop: 24,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E0E5EC',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1B4332',
  },
  emptyBody: {
    fontSize: 15,
    color: '#2C6E49',
  },
  productList: {
    gap: 16,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E5EC',
    padding: 20,
    gap: 12,
    shadowColor: '#1B4332',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  productHeader: {
    gap: 4,
  },
  productTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B4332',
    flex: 1,
    marginRight: 12,
  },
  productBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C6E49',
    backgroundColor: '#E6F0EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    textTransform: 'capitalize',
  },
  productBrand: {
    fontSize: 14,
    color: '#6B9080',
  },
  productDescription: {
    fontSize: 15,
    color: '#2C6E49',
  },
  productMetaRow: {
    gap: 4,
  },
  productMeta: {
    fontSize: 14,
    color: '#2C6E49',
  },
  dietRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietPill: {
    borderRadius: 999,
    backgroundColor: '#E6F0EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dietPillLabel: {
    fontSize: 12,
    color: '#2C6E49',
    fontWeight: '600',
  },
  disclosure: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E5EC',
    padding: 20,
    gap: 8,
  },
  disclosureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B4332',
  },
  disclosureBody: {
    fontSize: 14,
    color: '#2C6E49',
  },
  quickLinks: {
    backgroundColor: '#E6F0EB',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  quickLinksTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B4332',
  },
  quickLinkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickLink: {
    fontSize: 14,
    color: '#2C6E49',
  },
  features: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E5EC',
    padding: 20,
    gap: 10,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B4332',
  },
  featuresList: {
    gap: 6,
  },
  featureItem: {
    fontSize: 14,
    color: '#2C6E49',
  },
})