import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, ScrollView } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RecipesScreen = () => {
  const { theme, isDark } = useTheme();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const [recipesRes, ingredientsRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/meal/recipes/`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${BASE_URL}/api/meal/ingredients/`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setRecipes(recipesRes.data);
      setIngredients(ingredientsRes.data);
      setFiltered(recipesRes.data);
    } catch (e) {
      setRecipes([]);
      setIngredients([]);
      setFiltered([]);
    }
    setLoading(false);
  };

  const handleSearch = () => {
    const q = search.trim().toLowerCase();
    if (!q) {
      setFiltered(recipes);
      return;
    }
    setFiltered(
      recipes.filter(r =>
        r.title.toLowerCase().includes(q) ||
        (Array.isArray(r.ingredients)
          ? r.ingredients.some((ing: any) =>
              (typeof ing === 'string' ? ing : ing.ingredient?.name || '').toLowerCase().includes(q)
            )
          : false)
      )
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <TextInput
          style={[styles.searchBox, { backgroundColor: theme.card, color: theme.text, flex: 1 }]}
          placeholder="Search by recipe or ingredient..."
          placeholderTextColor={isDark ? '#bbb' : '#888'}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity onPress={handleSearch} style={{ marginLeft: 8, backgroundColor: theme.primary, borderRadius: 8, padding: 10 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Search</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => { setSelectedRecipe(item); setModalVisible(true); }}>
              <View style={styles.recipeCard}>
                <Image source={item.image ? { uri: item.image } : require('../../assets/images/recipes.png')} style={styles.recipeImage} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.recipeTitle, { color: theme.text }]}>{item.title}</Text>
                  <Text style={[styles.recipeDesc, { color: theme.text }]} numberOfLines={2}>{item.description || ''}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ color: theme.text, textAlign: 'center', marginTop: 40 }}>No recipes found.</Text>}
        />
      )}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: theme.card, borderRadius: 18, padding: 24, width: '90%', maxHeight: '85%' }}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ alignSelf: 'flex-end', marginBottom: 8 }}>
              <Text style={{ fontSize: 22, color: theme.primary }}>✕</Text>
            </TouchableOpacity>
            <ScrollView>
              <Text style={{ fontWeight: 'bold', fontSize: 22, color: theme.primary, marginBottom: 10 }}>{selectedRecipe?.title}</Text>
              {selectedRecipe?.description && (
                <Text style={{ color: theme.text, marginBottom: 10 }}>{selectedRecipe.description}</Text>
              )}
              {selectedRecipe?.ingredients && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontWeight: 'bold', color: theme.primary, marginBottom: 4 }}>Ingredients:</Text>
                  {Array.isArray(selectedRecipe.ingredients)
                    ? selectedRecipe.ingredients.map((ing: any, idx: number) => (
                        <Text key={idx} style={{ color: theme.text }}>
                          - {(typeof ing === 'string' ? ing : ing.ingredient?.name || '')}
                        </Text>
                      ))
                    : <Text style={{ color: theme.text }}>{typeof selectedRecipe.ingredients === 'string' ? selectedRecipe.ingredients : JSON.stringify(selectedRecipe.ingredients)}</Text>
                  }
                </View>
              )}
              {selectedRecipe?.instructions && (
                <View style={{ marginBottom: 10 }}>
                  <Text style={{ fontWeight: 'bold', color: theme.primary, marginBottom: 4 }}>Instructions:</Text>
                  <Text style={{ color: theme.text }}>{typeof selectedRecipe.instructions === 'string' ? selectedRecipe.instructions : JSON.stringify(selectedRecipe.instructions)}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  searchBox: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 14,
    backgroundColor: '#eee',
  },
  recipeTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  recipeDesc: {
    fontSize: 13,
    color: '#666',
  },
});

export default RecipesScreen; 