import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert, SafeAreaView, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import axios from 'axios';
import { BASE_URL } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const METRIC_TYPE_LABELS: Record<number, { label: string; icon: string; color: string }> = {
  1: { label: 'Weight', icon: 'barbell-outline', color: '#1976D2' },
  2: { label: 'Body Fat', icon: 'body-outline', color: '#E53935' },
  3: { label: 'Muscle Mass', icon: 'fitness-outline', color: '#43A047' },
  4: { label: 'BMI', icon: 'analytics-outline', color: '#FBC02D' },
  5: { label: 'Waist', icon: 'resize-outline', color: '#8E24AA' },
  6: { label: 'Hip', icon: 'resize-outline', color: '#8E24AA' },
  7: { label: 'Chest', icon: 'resize-outline', color: '#8E24AA' },
  8: { label: 'Arm', icon: 'resize-outline', color: '#8E24AA' },
  9: { label: 'Thigh', icon: 'resize-outline', color: '#8E24AA' },
  10: { label: 'Water', icon: 'water-outline', color: '#039BE5' },
  11: { label: 'Sleep', icon: 'moon-outline', color: '#3949AB' },
  12: { label: 'Steps', icon: 'walk-outline', color: '#FFA726' },
};

interface HealthMetric {
  id: number;
  client: number;
  metric_type: number;
  metric_type_display?: string;
  value: string;
  unit: string;
  date_recorded: string;
  notes?: string;
}

type HealthMetricForm = Partial<HealthMetric> & {
  weight?: string | number;
  height?: string | number;
};

const HealthMetricsScreen: React.FC = () => {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMetric, setEditingMetric] = useState<HealthMetric | null>(null);
  const [form, setForm] = useState<HealthMetricForm>({});
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState<number | null>(null);
  const { theme, isDark } = useTheme();

  useEffect(() => {
    fetchClientId();
    fetchMetrics();
  }, []);

  const fetchClientId = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const userEmail = await AsyncStorage.getItem('user_email');
      const response = await axios.get(`${BASE_URL}/api/clients/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const client = response.data.find((c: any) => c.user.email === userEmail);
      if (client) {
        setClientId(client.id);
      }
    } catch (err) {
    }
  };

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await axios.get(`${BASE_URL}/api/health-metrics/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMetrics(response.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load health metrics.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingMetric(null);
    setForm({ date_recorded: new Date().toISOString().slice(0, 10) });
    setModalVisible(true);
  };

  const openEditModal = (metric: HealthMetric) => {
    setEditingMetric(metric);
    setForm({ ...metric });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setForm({});
    setEditingMetric(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (editingMetric) {
        await axios.put(
          `${BASE_URL}/api/health-metrics/${editingMetric.id}/`,
          {
            metric_type: form.metric_type,
            value: form.value,
            unit: form.unit,
            date_recorded: form.date_recorded,
            notes: form.notes,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert('Success', 'Metric updated.');
      } else {
        let payload: any;
        if (form.metric_type === 4) {
          payload = {
            metric_type: form.metric_type,
            weight: form.weight,
            height: form.height,
            date_recorded: form.date_recorded,
            notes: form.notes,
          };
        } else {
          payload = {
            metric_type: form.metric_type,
            value: form.value,
            unit: form.unit,
            date_recorded: form.date_recorded,
            notes: form.notes,
          };
        }
        await axios.post(
          `${BASE_URL}/api/health-metrics/`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Alert.alert('Success', 'Metric added.');
      }
      fetchMetrics();
      closeModal();
    } catch (err: any) {
      const msg = err?.response?.data
        ? JSON.stringify(err.response.data)
        : 'Failed to save metric.';
      Alert.alert('Error', msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert('Delete', 'Are you sure you want to delete this metric?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('access_token');
            await axios.delete(`${BASE_URL}/api/health-metrics/${id}/`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            fetchMetrics();
          } catch {
            Alert.alert('Error', 'Failed to delete metric.');
          }
        }
      }
    ]);
  };

  const renderMetric = ({ item }: { item: HealthMetric }) => {
    const meta = METRIC_TYPE_LABELS[item.metric_type] || { label: 'Other', icon: 'help-outline', color: '#888' };
    return (
      <TouchableOpacity
        style={[
          styles.metricCard,
          { backgroundColor: theme.card, borderLeftColor: meta.color }
        ]}
        onPress={() => openEditModal(item)}
      >
        <View style={styles.metricCardHeader}>
          <Ionicons name={meta.icon} size={28} color={meta.color} style={{ marginRight: 20 }} />
          <Text style={[styles.metricType, { color: theme.text }]}>{meta.label}</Text>
          <View style={[styles.metricDateBox, { backgroundColor: isDark ? '#23262F' : '#F3F3F3' }]}>
            <Ionicons name="calendar-outline" size={14} color={theme.text} />
            <Text style={[styles.metricDate, { color: theme.text }]}>{item.date_recorded}</Text>
          </View>
        </View>
        <View style={styles.metricValueRow}>
          <Text style={[styles.metricValue, { color: theme.primary }]}>{item.value} {item.unit}</Text>
        </View>
        {item.notes ? <Text style={[styles.metricNotes, { color: theme.text }]}>{item.notes}</Text> : null}
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.headerRow, { backgroundColor: theme.card }]}>
        <Text style={[styles.headerTitle, { color: theme.primary }]}>Health Metrics</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={openAddModal}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>
      {clientId && (
        <Text style={{ color: '#000', fontSize: 12, textAlign: 'center', marginBottom: 4 }}>
          Client ID: {clientId}
        </Text>
      )}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={metrics}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMetric}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No health metrics found.</Text>}
        />
      )}
      <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.primary }]} onPress={openAddModal}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>{editingMetric ? 'Edit Metric' : 'Add Metric'}</Text>
              <Text style={styles.label}>Type</Text>
              <View style={styles.pickerRow}>
                {Object.entries(METRIC_TYPE_LABELS).map(([key, label]) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.pickerBtn, form.metric_type === Number(key) && styles.pickerBtnActive]}
                    onPress={() => setForm({ ...form, metric_type: Number(key) })}
                  >
                    <Text style={form.metric_type === Number(key) ? styles.pickerBtnTextActive : styles.pickerBtnText}>{label.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {form.metric_type === 4 ? (
                <>
                  <Text style={styles.label}>Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    value={form.weight?.toString() || ''}
                    onChangeText={(text) => setForm({ ...form, weight: text })}
                    keyboardType="numeric"
                    placeholder="Enter your weight"
                  />
                  <Text style={styles.label}>Height (cm)</Text>
                  <TextInput
                    style={styles.input}
                    value={form.height?.toString() || ''}
                    onChangeText={(text) => setForm({ ...form, height: text })}
                    keyboardType="numeric"
                    placeholder="Enter your height"
                  />
                </>
              ) : (
                <>
                  <Text style={styles.label}>Value</Text>
                  <TextInput
                    style={styles.input}
                    value={form.value?.toString() || ''}
                    onChangeText={(text) => setForm({ ...form, value: text })}
                    keyboardType="numeric"
                  />
                  <Text style={styles.label}>Unit</Text>
                  <TextInput
                    style={styles.input}
                    value={form.unit || ''}
                    onChangeText={(text) => setForm({ ...form, unit: text })}
                  />
                </>
              )}
              <Text style={styles.label}>Date</Text>
              <TextInput
                style={styles.input}
                value={form.date_recorded || ''}
                onChangeText={(text) => setForm({ ...form, date_recorded: text })}
                placeholder="YYYY-MM-DD"
              />
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                value={form.notes || ''}
                onChangeText={(text) => setForm({ ...form, notes: text })}
                multiline
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000', margin: 20, marginBottom: 0 },
  addBtn: { backgroundColor: '#2E7D32', borderRadius: 18, paddingVertical: 8, paddingHorizontal: 8 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    position: 'relative'
  },
  metricCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  metricType: { fontWeight: 'bold', fontSize: 18, color: '#222', flex: 1 },
  metricDateBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F3F3', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  metricDate: { color: '#888', fontSize: 13, marginLeft: 4 },
  metricValueRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  metricValue: { fontSize: 20, color: '#2E7D32', fontWeight: 'bold' },
  metricNotes: { color: '#666', fontSize: 13, marginTop: 6 },
  deleteBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#E53935',
    borderRadius: 16,
    padding: 8,
    zIndex: 2,
  },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 40, fontSize: 16 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    backgroundColor: '#1976D2',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1976D2',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 18, padding: 22, width: '90%', maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1976D2', marginBottom: 16, textAlign: 'center' },
  label: { fontWeight: 'bold', color: '#1976D2', marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 10, fontSize: 15, marginBottom: 6 },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  pickerBtn: { backgroundColor: '#E3F2FD', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, margin: 3 },
  pickerBtnActive: { backgroundColor: '#1976D2' },
  pickerBtnText: { color: '#1976D2', fontWeight: 'bold' },
  pickerBtnTextActive: { color: '#fff', fontWeight: 'bold' },
  saveBtn: { backgroundColor: '#1976D2', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { backgroundColor: '#eee', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 24 },
  cancelBtnText: { color: '#1976D2', fontWeight: 'bold', fontSize: 16 },
});

export default HealthMetricsScreen; 