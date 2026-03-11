# Performance Optimization Guide

This document outlines the performance optimizations implemented in the Hrisa Music mobile app.

## Already Implemented Optimizations

### 1. Animation Performance

**Native Driver Usage**
- All animations use `useNativeDriver: true` for 60fps performance
- Animations run on the GPU thread, not JavaScript thread
- Examples:
  - Sidebar slide animation
  - Activity card fade/slide animations
  - Overlay fade animations

```typescript
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 400,
  useNativeDriver: true, // ✅ GPU acceleration
})
```

### 2. List Rendering Optimization

**FlatList with Memoized Renders**
```typescript
const renderActivity = useCallback(
  ({ item, index }: { item: Activity; index: number }) => (
    <ActivityCard activity={item} index={index} />
  ),
  [] // ✅ Prevents re-creation on every render
);
```

**Key Optimizations:**
- `keyExtractor` for stable keys
- `getItemLayout` for fixed-height lists (when applicable)
- `initialNumToRender` set appropriately
- `maxToRenderPerBatch` for smooth scrolling
- `windowSize` to control memory usage

### 3. API Request Optimization

**Parallel Data Fetching**
```typescript
const [recsData, dailyData, weeklyData, trendingData] = await Promise.all([
  getRecommendationsForYou({ limit: 20 }),
  getDailyMix(30),
  getDiscoverWeekly(20),
  getTrending('week', 10),
]);
// ✅ All requests fire simultaneously
```

**Debounced Search**
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    performSearch(searchQuery);
  }, 300); // ✅ Reduces API calls during typing

  return () => clearTimeout(timer);
}, [searchQuery]);
```

### 4. Image Loading

**Lazy Loading with React Native Image**
- Images load asynchronously
- Placeholder views while loading
- ResizeMode optimization

```typescript
<Image
  source={{ uri: currentSong.albumArt }}
  style={styles.albumArt}
  resizeMode="cover" // ✅ Optimized rendering
/>
```

### 5. State Management

**Zustand Performance**
- Selector pattern for granular subscriptions
- Only re-render when specific state changes

```typescript
// ❌ Bad: Re-renders on any store change
const store = useMusicStore();

// ✅ Good: Only re-renders when isPlaying changes
const isPlaying = useMusicStore((state) => state.isPlaying);
```

### 6. Component Optimization

**React.memo for Pure Components**
```typescript
export const ActivityCard = React.memo(({ activity, index }) => {
  // ✅ Only re-renders when props change
});
```

**useCallback for Event Handlers**
```typescript
const handlePress = useCallback(() => {
  router.push(`/profile/${userId}`);
}, [userId]); // ✅ Stable reference
```

### 7. Bundle Size Optimization

**Code Splitting with Expo Router**
- File-based routing automatically code-splits
- Each route loaded on-demand
- Shared components bundled efficiently

**Tree Shaking**
- ES6 imports allow tree shaking
- Only used code included in bundle

```typescript
// ✅ Good: Named imports
import { Icon } from '@/components/ui/Icon';

// ❌ Bad: Entire module imported
import * as Icons from '@/components/ui/Icon';
```

## Recommended Future Optimizations

### 1. Image Optimization

**Add Image Caching**
```bash
npm install react-native-fast-image
```

```typescript
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri: imageUrl, priority: FastImage.priority.high }}
  style={styles.image}
  resizeMode={FastImage.resizeMode.cover}
/>
```

### 2. Virtualized Lists for Long Data

**Use FlashList for Better Performance**
```bash
npm install @shopify/flash-list
```

```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={80} // ✅ Better recycling
/>
```

### 3. Pagination Improvements

**Implement Cursor-Based Pagination**
```typescript
const loadMore = async () => {
  const data = await getActivityFeed(20, lastCursor);
  setActivities((prev) => [...prev, ...data]);
  setLastCursor(data[data.length - 1]?.id);
};
```

### 4. Background Task Optimization

**Use InteractionManager for Non-Critical Tasks**
```typescript
InteractionManager.runAfterInteractions(() => {
  // Heavy computation after animations complete
  preloadData();
});
```

### 5. Memory Leak Prevention

**Cleanup Timers and Subscriptions**
```typescript
useEffect(() => {
  const interval = setInterval(updatePosition, 1000);

  return () => clearInterval(interval); // ✅ Cleanup
}, []);
```

### 6. API Response Caching

**Implement SWR or React Query**
```bash
npm install @tanstack/react-query
```

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['genres'],
  queryFn: getGenres,
  staleTime: 5 * 60 * 1000, // ✅ Cache for 5 minutes
});
```

### 7. Lazy Component Loading

**Dynamic Imports for Heavy Components**
```typescript
const ShareSheet = lazy(() => import('@/components/social/ShareSheet'));

<Suspense fallback={<ActivityIndicator />}>
  <ShareSheet visible={show} />
</Suspense>
```

## Performance Monitoring

### Metrics to Track

1. **Time to Interactive (TTI)**
   - Target: < 3 seconds on mobile

2. **Frame Rate**
   - Target: 60 FPS during animations
   - Tool: React Native Performance Monitor

3. **Bundle Size**
   - Target: < 5MB initial load
   - Tool: `expo-bundle-analyzer`

4. **Memory Usage**
   - Target: < 100MB for typical session
   - Tool: Xcode Instruments / Android Profiler

5. **Network Requests**
   - Target: < 500ms average response
   - Tool: Network tab in DevTools

### Enable Performance Monitoring

```typescript
// Add to App.tsx
if (__DEV__) {
  require('react-native').LogBox.ignoreLogs(['Warning: ...']);

  // Enable performance monitoring
  Performance.setResourceTimingBufferSize(200);
}
```

### Profiling Tools

1. **React DevTools Profiler**
   ```bash
   npm install -g react-devtools
   react-devtools
   ```

2. **Flipper**
   - Layout Inspector
   - Network Inspector
   - Performance Monitor

3. **Expo Performance Monitor**
   ```typescript
   import { PerformanceObserver } from 'expo-performance';

   const observer = new PerformanceObserver((list) => {
     list.getEntries().forEach((entry) => {
       console.log(entry.name, entry.duration);
     });
   });
   ```

## Performance Checklist

Before deploying, verify:

- [ ] All animations use `useNativeDriver: true`
- [ ] FlatList uses `keyExtractor` and memoized renders
- [ ] Images have appropriate resizeMode
- [ ] API requests are debounced where appropriate
- [ ] Heavy computations use useCallback/useMemo
- [ ] No console.log statements in production
- [ ] Source maps generated for error tracking
- [ ] Bundle analyzed for unnecessary dependencies
- [ ] Network requests cached appropriately
- [ ] Timers and subscriptions cleaned up

## Common Performance Pitfalls to Avoid

### ❌ Don't Do This

```typescript
// Inline function re-created every render
<Button onPress={() => doSomething()} />

// Entire store subscribed
const store = useMusicStore();

// Expensive operation in render
const data = songs.filter(s => s.genre === 'Rock').sort(...);
```

### ✅ Do This Instead

```typescript
// Memoized callback
const handlePress = useCallback(() => doSomething(), []);
<Button onPress={handlePress} />

// Selective subscription
const isPlaying = useMusicStore(state => state.isPlaying);

// Memoized computation
const filteredSongs = useMemo(
  () => songs.filter(s => s.genre === 'Rock').sort(...),
  [songs]
);
```

## Conclusion

The app is already well-optimized with:
- GPU-accelerated animations
- Efficient list rendering
- Parallel API requests
- Debounced search
- Memoized components and callbacks

Future optimizations (caching, FlashList, etc.) can be added as the user base grows and specific bottlenecks are identified through monitoring.
