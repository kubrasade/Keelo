import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Image, Modal, TextInput, Platform } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { Calendar } from 'react-native-calendars';

type Recipe = {
  id: number;
  title: string;
  image?: string;
  ingredients?: string | string[] | object;
  instructions?: string | string[] | object;
  description?: string | string[] | object;
};

type MealPlanItem = {
  id: number;
  day: number;
  meal_type: number;
  recipe: Recipe;
  date: string;
  notes?: string;
  user: number;
};

const mealTypeMap: { [key: number]: string } = {
  1: 'Breakfast',
  2: 'Lunch',
  3: 'Dinner',
  4: 'Snack 1',
};

const dayNameMap: { [key: number]: string } = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

const toDisplayString = (val: any) => {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (Array.isArray(val)) {
      return val.map((item: any) => {
        if (item.ingredient) {
          const ingredientName = item.ingredient.name;
          const quantity = item.quantity || '';
          const unit = item.unit_display || '';
          const notes = item.notes ? `(${item.notes})` : ''; 
  
          return `${ingredientName} - ${quantity} ${unit} ${notes}`;
        }
        return item;
      }).join(', ');
    }
    if (typeof val === 'object') return JSON.stringify(val, null, 2);
    return String(val);
  };

const DietPlanScreen: React.FC = () => {
  const [mealPlans, setMealPlans] = useState<MealPlanItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay() || 1);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const { theme, isDark } = useTheme();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [addDay, setAddDay] = useState<number>(selectedDay);
  const [addMealType, setAddMealType] = useState<number>(1);
  const [addDate, setAddDate] = useState('');
  const [addRecipeId, setAddRecipeId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [weeklyModalVisible, setWeeklyModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(getToday());

  useEffect(() => {
    fetchMealPlans();
  }, []);

  const fetchMealPlans = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userRes = await axios.get(`${BASE_URL}/api/users/me/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userId = (userRes.data as any).id;
      setUserId(userId);

      const planRes = await axios.get(`${BASE_URL}/api/meal/meal-plans/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { user: userId },
      });
      setMealPlans(planRes.data as MealPlanItem[]);
    } catch (error) {
      console.error('Meal plan fetch error:', error);
      Alert.alert('Error', 'Unable to fetch diet plan');
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeSelect = async (recipeId: number) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await axios.get(`${BASE_URL}/api/meal/recipes/${recipeId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data) {
        setSelectedRecipe(response.data as Recipe);
      } else {
        Alert.alert('Error', 'Unable to fetch recipe details');
      }
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      Alert.alert('Error', 'Unable to fetch recipe details');
    }
  };

  const fetchRecipes = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await axios.get(`${BASE_URL}/api/meal/recipes/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecipes(response.data as Recipe[]);
    } catch {
      Alert.alert('Error', 'Failed to fetch recipes');
    }
  };

  const handleAddMealPlan = async () => {
    if (!addDay || !addMealType || !addRecipeId || !addDate) {
      Alert.alert('Uyarı', 'Lütfen tüm alanları doldurun.');
      return;
    }
    try {
      const token = await AsyncStorage.getItem('access_token');
      await axios.post(
        `${BASE_URL}/api/meal/meal-plans/`,
        {
          user_id: userId,
          day: addDay,
          meal_type: addMealType,
          recipe_id: addRecipeId,
          date: addDate
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      Alert.alert('Başarılı', 'Meal plan başarıyla eklendi.');
      setAddModalVisible(false);
      setAddDay(new Date(addDate).getDay() === 0 ? 7 : new Date(addDate).getDay());
      setAddMealType(1);
      setAddDate('');
      setAddRecipeId(null);
      fetchMealPlans();
    } catch (error: any) {
      Alert.alert('Hata', error?.response?.data?.detail || 'Meal plan eklenemedi.');
    }
  };

  const handleDeleteMealPlan = async (mealPlanId: number) => {
    Alert.alert(
      'Delete Meal Plan',
      'Are you sure you want to delete this meal plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('access_token');
              await axios.delete(
                `${BASE_URL}/api/meal/meal-plans/${mealPlanId}/`,
                {
                  headers: { Authorization: `Bearer ${token}` }
                }
              );
              Alert.alert('Success', 'Meal plan deleted.');
              fetchMealPlans();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error?.response?.data?.detail ||
                error?.response?.data ||
                'Failed to delete meal plan.'
              );
            }
          }
        }
      ]
    );
  };

  const mealsForSelectedDay = mealPlans
    .filter(item => item.day === selectedDay)
    .sort((a, b) => a.meal_type - b.meal_type);

  const weekPlan: { [key: number]: MealPlanItem[] } = {};
  mealPlans.forEach(item => {
    if (!weekPlan[item.day]) weekPlan[item.day] = [];
    weekPlan[item.day].push(item);
  });

  const handleDateChange = (dateStr: string) => {
    setAddDate(dateStr);
    const dateObj = new Date(dateStr);
    let jsDay = dateObj.getDay();
    let ourDay = jsDay === 0 ? 7 : jsDay; 
    setAddDay(ourDay);
  };

  function getToday() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  function getWeekRange(dateStr: string) {
    const d = new Date(dateStr);
    const day = d.getDay() === 0 ? 7 : d.getDay(); 
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().slice(0, 10),
      end: sunday.toISOString().slice(0, 10),
    };
  }

  const { start: weekStart, end: weekEnd } = getWeekRange(getToday());
  const weekMealPlans = mealPlans.filter(mp => mp.date >= weekStart && mp.date <= weekEnd);

  const markedDates: any = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    markedDates[dateStr] = {
      selected: selectedDate === dateStr,
      selectedColor: selectedDate === dateStr ? theme.primary : '#43e97b',
      marked: weekMealPlans.some(mp => mp.date === dateStr),
      dotColor: '#43e97b',
      disabled: false,
    };
  }

  const mealsForSelectedDate = weekMealPlans.filter(mp => mp.date === selectedDate);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Calendar
        current={selectedDate}
        markedDates={markedDates}
        onDayPress={day => setSelectedDate(day.dateString)}
        minDate={weekStart}
        maxDate={weekEnd}
        hideExtraDays
        theme={{
          backgroundColor: theme.background,
          calendarBackground: theme.background,
          textSectionTitleColor: theme.text,
          dayTextColor: theme.text,
          todayTextColor: theme.primary,
          selectedDayBackgroundColor: theme.primary,
          selectedDayTextColor: '#fff',
          dotColor: '#43e97b',
          arrowColor: theme.primary,
        }}
        style={{ borderRadius: 12, margin: 16, elevation: 2 }}
      />
      <ScrollView style={{ flex: 1, padding: 20 }}>
        <TouchableOpacity onPress={() => setWeeklyModalVisible(true)} style={{ alignSelf: 'flex-end', marginBottom: 10, backgroundColor: theme.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Haftalık Planı Gör</Text>
        </TouchableOpacity>
        {!weekMealPlans.length ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: theme.text }}>No meal plans found for this week.</Text>
        ) : mealsForSelectedDate.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: theme.text }}>No plan for this day.</Text>
        ) : (
          <View style={styles.mealCardContainer}>
            {mealsForSelectedDate.map(meal => (
              <View
                key={meal.id}
                style={styles.productCard}
              >
                <TouchableOpacity style={styles.deleteIcon} onPress={() => handleDeleteMealPlan(meal.id)}>
                  <Text style={styles.deleteIconText}>✕</Text>
                </TouchableOpacity>
                <Image
                  source={meal.recipe && meal.recipe.image ? { uri: meal.recipe.image } : require('../../assets/images/login.png')}
                  style={styles.productImage}
                />
                <TouchableOpacity onPress={() => meal.recipe && handleRecipeSelect(meal.recipe.id)}>
                  <Text style={styles.productTitle}>{meal.recipe ? meal.recipe.title : 'No Title'}</Text>
                </TouchableOpacity>
                <Text style={styles.productDesc}>{mealTypeMap[meal.meal_type]} - {meal.date}</Text>
                {meal.notes ? (
                  <Text style={styles.productDesc}>Note: {meal.notes}</Text>
                ) : null}
                <TouchableOpacity style={styles.productButton} onPress={() => meal.recipe && handleRecipeSelect(meal.recipe.id)}>
                  <Text style={styles.productButtonText}>View Details</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Modal
          visible={!!selectedRecipe}
          animationType="slide"
          transparent
          onRequestClose={() => setSelectedRecipe(null)}
        >
          <View style={styles.detailModalOverlay}>
            <View style={styles.detailModalContent}>
              <TouchableOpacity onPress={() => setSelectedRecipe(null)} style={styles.detailCloseButton}>
                <Text style={{ fontSize: 22, color: theme.primary }}>✕</Text>
              </TouchableOpacity>
              {selectedRecipe && (
                <ScrollView>
                  <Image source={selectedRecipe.image ? { uri: selectedRecipe.image } : require('../../assets/images/login.png')} style={styles.detailImage} />
                  <Text style={styles.detailTitle}>{selectedRecipe.title}</Text>
                  {selectedRecipe.description && (
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ fontWeight: 'bold', color: theme.primary, marginBottom: 2 }}>Description:</Text>
                      <Text style={{ color: theme.text }}>{toDisplayString(selectedRecipe.description)}</Text>
                    </View>
                  )}
                  {selectedRecipe.ingredients && (
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ fontWeight: 'bold', color: theme.primary, marginBottom: 2 }}>Ingredients:</Text>
                      <Text style={{ color: theme.text }}>{toDisplayString(selectedRecipe.ingredients)}</Text>
                    </View>
                  )}
                  {selectedRecipe.instructions && (
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ fontWeight: 'bold', color: theme.primary, marginBottom: 2 }}>Instructions:</Text>
                      <Text style={{ color: theme.text }}>{toDisplayString(selectedRecipe.instructions)}</Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </ScrollView>

      <TouchableOpacity
        style={{
          position: 'absolute',
          right: 24,
          bottom: 32,
          backgroundColor: theme.primary,
          paddingVertical: 14,
          paddingHorizontal: 24,
          borderRadius: 32,
          elevation: 4,
        }}
        onPress={() => {
          fetchRecipes();
          setAddModalVisible(true);
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.primary }]}> + </Text>
            <Text style={{ marginBottom: 8, color: theme.text }}>Day</Text>
            <ScrollView horizontal style={{ marginBottom: 8 }}>
              {[1,2,3,4,5,6,7].map(dayNum => (
                <TouchableOpacity
                  key={dayNum}
                  style={{
                    padding: 10,
                    backgroundColor: addDay === dayNum ? theme.primary : theme.background,
                    borderRadius: 8,
                    marginRight: 5
                  }}
                  onPress={() => setAddDay(dayNum)}
                >
                  <Text style={{ color: addDay === dayNum ? '#fff' : theme.text }}>{dayNameMap[dayNum]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={{ color: theme.text }}>Meal Type</Text>
            <ScrollView horizontal style={{ marginBottom: 8 }}>
              {Object.entries(mealTypeMap).map(([key, value]) => (
                <TouchableOpacity
                  key={key}
                  style={{
                    padding: 10,
                    backgroundColor: addMealType === Number(key) ? theme.primary : theme.background,
                    borderRadius: 8,
                    marginRight: 5
                  }}
                  onPress={() => setAddMealType(Number(key))}
                >
                  <Text style={{ color: addMealType === Number(key) ? '#fff' : theme.text }}>{value}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={{ marginTop: 10, color: theme.text }}>Date (YYYY-MM-DD)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: isDark ? '#333' : '#ddd' }]}
              value={addDate}
              onChangeText={handleDateChange}
              placeholder="2025-04-30"
              placeholderTextColor={isDark ? '#bbb' : '#999'}
            />
            <Text style={{ color: theme.text }}>Recipe</Text>
            <ScrollView style={{ maxHeight: 120 }}>
              {recipes.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={{
                    padding: 10,
                    backgroundColor: addRecipeId === r.id ? theme.primary : theme.background,
                    borderRadius: 8,
                    marginBottom: 5
                  }}
                  onPress={() => setAddRecipeId(r.id)}
                >
                  <Text style={{ color: addRecipeId === r.id ? '#fff' : theme.text }}>{r.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: theme.background }]}
                onPress={() => setAddModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.completeButton, { backgroundColor: theme.primary }]}
                onPress={handleAddMealPlan}
              >
                <Text style={[styles.modalButtonText, styles.completeButtonText]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Haftalık Plan Modalı */}
      <Modal visible={weeklyModalVisible} animationType="slide" transparent onRequestClose={() => setWeeklyModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 18, padding: 18, width: '95%', maxHeight: '90%' }}>
            <TouchableOpacity onPress={() => setWeeklyModalVisible(false)} style={{ alignSelf: 'flex-end', marginBottom: 8 }}>
              <Text style={{ fontSize: 22, color: theme.primary }}>✕</Text>
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[1,2,3,4,5,6,7].map(dayNum => (
                <View key={dayNum} style={{ minWidth: 160, marginRight: 16 }}>
                  <Text style={{ fontWeight: 'bold', color: theme.primary, fontSize: 16, marginBottom: 6 }}>{dayNameMap[dayNum]}</Text>
                  {(weekMealPlans.filter(mp => mp.day === dayNum) || []).length === 0 ? (
                    <Text style={{ color: theme.text, fontSize: 13 }}>No meal</Text>
                  ) : (
                    weekMealPlans.filter(mp => mp.day === dayNum).map((meal, idx) => (
                      <View key={meal.id || idx} style={{ marginBottom: 8, backgroundColor: '#f3f3f3', borderRadius: 8, padding: 8 }}>
                        <TouchableOpacity onPress={() => handleRecipeSelect(meal.recipe.id)}>
                          <Text style={{ color: '#222', fontWeight: 'bold', textDecorationLine: 'underline' }}>{meal.recipe?.title || 'No Title'}</Text>
                        </TouchableOpacity>
                        <Text style={{ color: '#666', fontSize: 12 }}>{mealTypeMap[meal.meal_type]} - {meal.date}</Text>
                      </View>
                    ))
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  daySelector: { flexDirection: 'row', marginBottom: 20 },
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginRight: 10,
    elevation: 3,
  },
  dayButtonSelected: {
    backgroundColor: '#2E7D32',
  },
  dayButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  dayButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  mealCardContainer: {
    marginTop: 10,
  },
  productCard: {
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    marginVertical: 18,
    alignItems: 'center',
    paddingVertical: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    position: 'relative',
  },
  productImage: {
    width: 140,
    height: 140,
    resizeMode: 'contain',
    marginBottom: 18,
  },
  productTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
  },
  productDesc: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  productButton: {
    backgroundColor: '#111',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 36,
    marginTop: 4,
    marginBottom: 8,
  },
  productButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  deleteIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#ff5252',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    elevation: 6,
  },
  deleteIconText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 10,
  },
  modalSection: {
    fontWeight: 'bold',
    marginTop: 10,
    color: '#2E7D32',
  },
  modalText: {
    color: '#333',
    marginBottom: 10,
    fontSize: 14,
  },
  input: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    padding: 10,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#ddd',
  },
  completeButton: {
    backgroundColor: '#2E7D32',
  },
  modalButtonText: {
    fontWeight: 'bold',
  },
  completeButtonText: {
    color: '#fff',
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxHeight: '85%',
    alignItems: 'center',
  },
  detailCloseButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  detailImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10,
    textAlign: 'center',
  },
  detailSection: {
    fontWeight: 'bold',
    marginTop: 10,
    color: '#2E7D32',
    fontSize: 16,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
});

export default DietPlanScreen;