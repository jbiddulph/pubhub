import { ReactNode, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Image } from 'expo-image'

import { supabase } from '@/lib/supabase'

type FoodProduct = {
  id: string
  name: string
  brand: string
  type: 'dry' | 'wet' | 'raw' | 'freeze-dried'
  breedSizes: Array<'small' | 'medium' | 'large'>
  lifeStage: 'puppy' | 'adult' | 'senior'
  diets: string[]
  rating: number
  price: number | null
  description: string
  imageUrl: string | null
  affiliateUrl: string | null
}

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
  const [products, setProducts] = useState<FoodProduct[]>([])
  const [selectedType, setSelectedType] = useState('all')
  const [selectedSize, setSelectedSize] = useState('all')
  const [selectedLifeStage, setSelectedLifeStage] = useState('all')
  const [selectedPrice, setSelectedPrice] = useState('all')
  const [selectedDiet, setSelectedDiet] = useState('all')
  const [sortOption, setSortOption] = useState('rating-desc')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    async function loadProducts() {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('doghealthy_dog_food_products')
        .select(
          'id, name, brand, food_type, breed_sizes, breed_size, life_stage, price_gbp, diets, rating, description, affiliate_url, image_url',
        )

      if (!isMounted) return

      if (fetchError) {
        setError(fetchError.message)
        setProducts([])
      } else {
        const mapped: FoodProduct[] = (data ?? []).map((item: any) => {
          const type = (item.food_type ?? 'dry').toString().toLowerCase()
          const rawBreedSizesSource = item.breed_sizes ?? item.breed_size ?? ''
          const breedSizesRaw: string[] = Array.isArray(rawBreedSizesSource)
            ? rawBreedSizesSource
            : typeof rawBreedSizesSource === 'string'
            ? rawBreedSizesSource.split(/[,/]/).map((value: string) => value.trim())
            : []
          const lifeStage = (item.life_stage ?? 'adult').toString().toLowerCase()
          const dietsRaw: string[] =
            Array.isArray(item.diets) || item.diets === null || item.diets === undefined
              ? (item.diets ?? [])
              : typeof item.diets === 'string'
              ? item.diets.split(',').map((value: string) => value.trim())
              : []

          const normalisedDiets = dietsRaw
            .map((diet) =>
              diet
                .toString()
                .toLowerCase()
                .replace(/\s+/g, '-'),
            )
            .filter(Boolean)

          return {
            id:
              (item.id ? String(item.id) : null) ??
              `${(item.name ?? 'product').toString().toLowerCase().replace(/\s+/g, '-')}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,
            name: item.name ?? 'Dog food',
            brand: item.brand ?? 'DogHealthy',
            type: (type === 'freeze dried' ? 'freeze-dried' : type) as FoodProduct['type'],
            breedSizes:
              breedSizesRaw.length === 0
                ? (['small', 'medium', 'large'] as Array<'small' | 'medium' | 'large'>)
                : (breedSizesRaw
                    .map((size) => size.toLowerCase())
                    .flatMap((size) =>
                      size.includes('all') ? ['small', 'medium', 'large'] : [size],
                    )
                    .filter((size) => ['small', 'medium', 'large'].includes(size)) as Array<
                    'small' | 'medium' | 'large'
                  >),
            lifeStage: (['puppy', 'adult', 'senior'].includes(lifeStage)
              ? lifeStage
              : 'adult') as FoodProduct['lifeStage'],
            diets: normalisedDiets,
            rating: Number(item.rating) || 0,
            price:
              item.price_gbp === null || item.price_gbp === undefined
                ? null
                : typeof item.price_gbp === 'number'
                ? item.price_gbp
                : Number(item.price_gbp) || null,
            description: item.description ?? 'Delicious meal for happy, healthy dogs.',
            imageUrl: item.image_url ?? null,
            affiliateUrl: item.affiliate_url ?? null,
          }
        })
        setProducts(mapped)
      }

      setLoading(false)
    }

    loadProducts()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredProducts = useMemo(() => {
    let items = products.slice()

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
      items = items.filter((item) => {
        if (item.price === null) return false
        switch (selectedPrice) {
          case 'under-30':
            return item.price < 30
          case '30-50':
            return item.price >= 30 && item.price < 50
          case '50-100':
            return item.price >= 50 && item.price < 100
          case '100-plus':
            return item.price >= 100
          default:
            return true
        }
      })
    }
    if (selectedDiet !== 'all') {
      items = items.filter((item) => item.diets.includes(selectedDiet))
    }

    switch (sortOption) {
      case 'price-asc':
        items.sort((a, b) => {
          if (a.price === null && b.price === null) return 0
          if (a.price === null) return 1
          if (b.price === null) return -1
          return a.price - b.price
        })
        break
      case 'price-desc':
        items.sort((a, b) => {
          if (a.price === null && b.price === null) return 0
          if (a.price === null) return 1
          if (b.price === null) return -1
          return b.price - a.price
        })
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
  }, [products, selectedType, selectedSize, selectedLifeStage, selectedPrice, selectedDiet, sortOption])

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

  function handleBuy(url: string) {
    Linking.openURL(url).catch((linkError) => {
      Alert.alert('Open link', 'Unable to open the retailer link right now.')
      console.warn('Failed to open affiliate link', linkError)
    })
  }

  function renderProduct(product: FoodProduct): ReactNode {
    return (
      <View key={product.id} style={styles.productCard}>
        {product.imageUrl ? (
          <Image source={product.imageUrl} style={styles.productImage} contentFit="cover" />
        ) : null}
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
            ⭐ {product.rating.toFixed(1)} ·{' '}
            {product.price !== null ? `£${product.price.toFixed(2)}` : 'Price not listed'}
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
        {product.affiliateUrl ? (
          <Pressable style={styles.buyButton} onPress={() => handleBuy(product.affiliateUrl!)}>
            <Text style={styles.buyButtonLabel}>Buy Now</Text>
          </Pressable>
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

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
  errorText: {
    fontSize: 14,
    color: '#BC4749',
    marginTop: -4,
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
  productImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    backgroundColor: '#E6F0EB',
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
  buyButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#BC4749',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buyButtonLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
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