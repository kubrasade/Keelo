import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Button, StyleSheet, Alert, ActivityIndicator, Image, ScrollView } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/api';

const MEAL_TYPES = [
  { label: 'Breakfast', value: 1 },
  { label: 'Noon', value: 2 },
  { label: 'Night', value: 3 },
  { label: 'Snack', value: 4 },
  { label: 'Dessert', value: 5},
];

const DietitianDietPlanScreen = () => {
  const [matchings, setMatchings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [day, setDay] = useState('');
  const [mealType, setMealType] = useState('');
  const [recipeId, setRecipeId] = useState('');
  const [date, setDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [weeklyModalVisible, setWeeklyModalVisible] = useState(false);
  const [weeklyPlans, setWeeklyPlans] = useState<{ [day: number]: { [mealType: number]: string } }>({});
  const [weeklyStartDate, setWeeklyStartDate] = useState('');
  const [weeklySubmitting, setWeeklySubmitting] = useState(false);
  const [dateError, setDateError] = useState('');
  const [selectedWeeklyClient, setSelectedWeeklyClient] = useState<any>(null);

  useEffect(() => {
    fetchMatchings();
    fetchRecipes();
  }, []);

  const fetchMatchings = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await axios.get(`${BASE_URL}/api/match/matchings/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatchings((res.data as any[]).filter((m: any) => m.status === 2));
    } catch (err) {
      Alert.alert('Error', 'No matches were retrieved.');
    }
    setLoading(false);
  };

  const fetchRecipes = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await axios.get(`${BASE_URL}/api/meal/recipes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecipes(res.data);
    } catch (err) {
      Alert.alert('Error', 'Could not get recipes.');
    }
  };

  const openModal = (client: any) => {
    setSelectedClient(client);
    setModalVisible(true);
    setDay('');
    setMealType('');
    setRecipeId('');
    setDate('');
  };

  const handleAddMealPlan = async () => {
    if (!day || !mealType || !recipeId || !date) {
      Alert.alert('Warning', 'Fill in all fields.');
      return;
    }
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      await axios.post(`${BASE_URL}/api/meal/meal-plans/`, {
        user_id: selectedClient.user.id,
        day: Number(day),
        meal_type: Number(mealType),
        recipe_id: Number(recipeId),
        date,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert('Success', 'Diet plan added.');
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', 'Could not add plan.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clients</Text>
      <TouchableOpacity style={{ backgroundColor: '#2E7D32', padding: 10, borderRadius: 8, marginBottom: 10 }} onPress={() => setWeeklyModalVisible(true)}>
        <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>Add Weekly Plan</Text>
      </TouchableOpacity>
      <FlatList
        data={matchings}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openModal(item.client)}>
            <Text style={styles.name}>{item.client.user.first_name} {item.client.user.last_name}</Text>
            <Text style={styles.email}>{item.client.user.email}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40 }}>There are no matches.</Text>}
      />
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Diet Plan</Text>
            <Text>Day (1-7):</Text>
            <TextInput value={day} onChangeText={setDay} keyboardType="numeric" style={styles.input} />
            <Text>Meal Type:</Text>
            <FlatList
              data={MEAL_TYPES}
              horizontal
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.mealTypeBtn, mealType == String(item.value) && styles.mealTypeBtnActive]}
                  onPress={() => setMealType(String(item.value))}
                >
                  <Text style={mealType == String(item.value) ? { color: '#fff' } : {}}>{item.label}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.value.toString()}
              style={{ marginVertical: 8 }}
            />
            <Text>Recipes:</Text>
            <FlatList
              data={Array.isArray(recipes) ? recipes.filter(r => {
                if (Array.isArray(r.meal_types)) {
                  return r.meal_types.includes(Number(mealType));
                }
                return r.meal_type === Number(mealType);
              }) : []}
              horizontal
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.mealTypeBtn,
                    recipeId == String(item.id) && styles.mealTypeBtnActive,
                  ]}
                  onPress={() => setRecipeId(String(item.id))}
                >
                  {item.image && (
                    <Image
                      source={{ uri: item.image }}
                      style={{ width: 40, height: 40, borderRadius: 8, marginBottom: 4 }}
                    />
                  )}
                  <Text
                    style={
                      recipeId == String(item.id)
                        ? { color: '#fff', fontWeight: 'bold', textAlign: 'center' }
                        : { textAlign: 'center' }
                    }
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => (item?.id ? item.id.toString() : Math.random().toString())}
              style={{ marginVertical: 8 }}
            />
            <Text>Date (YYYY-MM-DD):</Text>
            <TextInput value={date} onChangeText={text => {
              setDate(text);
              if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
                setDateError('Format: YYYY-MM-DD');
              } else {
                setDateError('');
              }
            }} placeholder="2025-04-30" style={styles.input} />
            {dateError ? <Text style={{ color: 'red', marginBottom: 4 }}>{dateError}</Text> : null}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <Button title="Cancel" onPress={() => setModalVisible(false)} color="#888" />
              <Button title={submitting ? 'Adding...' : 'Add'} onPress={handleAddMealPlan} disabled={submitting} />
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={weeklyModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}> 
            <Text style={styles.modalTitle}>Add Weekly Plan</Text>
            
            <Text style={{ marginBottom: 8 }}>Select Client:</Text>
            <ScrollView style={{ maxHeight: 150, marginBottom: 16 }}>
              {matchings.map(matching => (
                <TouchableOpacity
                  key={matching.id}
                  style={{
                    padding: 10,
                    backgroundColor: selectedWeeklyClient?.id === matching.client.id ? '#43e97b' : '#eee',
                    borderRadius: 8,
                    marginBottom: 5
                  }}
                  onPress={() => setSelectedWeeklyClient(matching.client)}
                >
                  <Text style={{ 
                    color: selectedWeeklyClient?.id === matching.client.id ? '#fff' : '#222',
                    fontWeight: 'bold'
                  }}>
                    {matching.client.user.first_name} {matching.client.user.last_name}
                  </Text>
                  <Text style={{ 
                    color: selectedWeeklyClient?.id === matching.client.id ? '#fff' : '#666',
                    fontSize: 12 
                  }}>
                    {matching.client.user.email}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text>Start Date (YYYY-MM-DD):</Text>
            <TextInput 
              value={weeklyStartDate} 
              onChangeText={setWeeklyStartDate} 
              placeholder="2025-05-06" 
              style={styles.input} 
            />
            
            <ScrollView style={{ maxHeight: 350 }}>
              {[1,2,3,4,5,6,7].map(dayNum => (
                <View key={dayNum} style={{ marginBottom: 10 }}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Day {dayNum}</Text>
                  {MEAL_TYPES.map(meal => (
                    <View key={meal.value} style={{ marginBottom: 8 }}>
                      <Text style={{ marginBottom: 4 }}>{meal.label}:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {recipes
                          .filter(r => {
                            if (Array.isArray(r.meal_types)) {
                              return r.meal_types.includes(meal.value);
                            }
                            return r.meal_type === meal.value;
                          })
                          .map(r => (
                            <TouchableOpacity
                              key={r.id}
                              style={{
                                width: 120,
                                marginRight: 8,
                                backgroundColor: (weeklyPlans[dayNum]?.[meal.value] == String(r.id)) ? '#43e97b' : '#fff',
                                borderRadius: 8,
                                padding: 8,
                                borderWidth: 1,
                                borderColor: (weeklyPlans[dayNum]?.[meal.value] == String(r.id)) ? '#43e97b' : '#ddd',
                                alignItems: 'center'
                              }}
                              onPress={() => setWeeklyPlans(prev => ({
                                ...prev,
                                [dayNum]: { ...prev[dayNum], [meal.value]: String(r.id) }
                              }))}
                            >
                              {r.image ? (
                                <Image 
                                  source={{ uri: r.image }} 
                                  style={{ 
                                    width: 80, 
                                    height: 80, 
                                    borderRadius: 8,
                                    marginBottom: 4
                                  }} 
                                />
                              ) : (
                                <View style={{ 
                                  width: 80, 
                                  height: 80, 
                                  borderRadius: 8,
                                  backgroundColor: '#eee',
                                  marginBottom: 4,
                                  justifyContent: 'center',
                                  alignItems: 'center'
                                }}>
                                  <Text style={{ color: '#666' }}>No Image</Text>
                                </View>
                              )}
                              <Text 
                                style={{ 
                                  color: (weeklyPlans[dayNum]?.[meal.value] == String(r.id)) ? '#fff' : '#222',
                                  textAlign: 'center',
                                  fontSize: 12
                                }}
                                numberOfLines={2}
                              >
                                {r.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                      </ScrollView>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <Button title="Cancel" onPress={() => {
                setWeeklyModalVisible(false);
                setSelectedWeeklyClient(null);
                setWeeklyPlans({});
                setWeeklyStartDate('');
              }} color="#888" />
              <Button 
                title={weeklySubmitting ? 'Adding...' : 'Add Weekly Plan'} 
                onPress={async () => {
                  if (!selectedWeeklyClient) {
                    Alert.alert('Warning', 'Please select a client.');
                    return;
                  }
                  if (!weeklyStartDate || !/^\d{4}-\d{2}-\d{2}$/.test(weeklyStartDate)) {
                    Alert.alert('Warning', 'The start date format is incorrect.');
                    return;
                  }

                  const hasAnyRecipe = Object.values(weeklyPlans).some(dayPlans => 
                    Object.values(dayPlans).some(recipeId => recipeId)
                  );
                  
                  if (!hasAnyRecipe) {
                    Alert.alert('Warning', 'You must select a recipe for at least one meal.');
                    return;
                  }

                  setWeeklySubmitting(true);
                  try {
                    const token = await AsyncStorage.getItem('access_token');
                    const start = new Date(weeklyStartDate);
                    
                    const promises = [];
                    
                    for (let i = 0; i < 7; i++) {
                      const dateStr = new Date(start.getTime() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
                      for (const meal of MEAL_TYPES) {
                        const recipeId = weeklyPlans[i+1]?.[meal.value];
                        if (recipeId) {
                          promises.push(
                            axios.post(`${BASE_URL}/api/meal/meal-plans/`, {
                              user_id: selectedWeeklyClient.user.id,
                              day: i+1,
                              meal_type: meal.value,
                              recipe_id: Number(recipeId),
                              date: dateStr,
                            }, {
                              headers: { Authorization: `Bearer ${token}` },
                            })
                          );
                        }
                      }
                    }

                    await Promise.all(promises);
                    Alert.alert('Success', 'Weekly plan added.');
                    setWeeklyModalVisible(false);
                    setSelectedWeeklyClient(null);
                    setWeeklyPlans({});
                    setWeeklyStartDate('');
                    fetchMatchings(); 
                  } catch (err) {
                    console.error('Error adding weekly plan:', err);
                    Alert.alert('Error', 'Could not add weekly plan.');
                  }
                  setWeeklySubmitting(false);
                }} 
                disabled={weeklySubmitting} 
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 18, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 18 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  name: { fontWeight: 'bold', fontSize: 17, color: '#222' },
  email: { color: '#888', fontSize: 14, marginTop: 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '90%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, marginVertical: 6 },
  mealTypeBtn: {
    borderWidth: 1,
    borderColor: '#43e97b',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 4,
    backgroundColor: '#fff',
  },
  mealTypeBtnActive: {
    backgroundColor: '#43e97b',
    borderColor: '#43e97b',
  },
});

export default DietitianDietPlanScreen;
