/**
 * Document Storage Modal — Store and manage vehicle documents.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Brand, Spacing, FontSizes, Radius } from '@/constants/theme';
import {
  useThemeColors, Card, GlassCard, Button, Input,
  SectionHeader, EmptyState, Badge, Divider, ListItem,
} from '@/components/ui';
import { useData } from '@/contexts/DataContext';
import { formatDate, daysUntil, todayISO } from '@/utils/formatters';
import type { DocumentType } from '@/types';

const docTypes: { key: DocumentType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'registration', label: 'Registration', icon: 'car', color: Brand.primary },
  { key: 'insurance', label: 'Insurance', icon: 'shield-checkmark', color: Brand.info },
  { key: 'inspection', label: 'Inspection', icon: 'search', color: Brand.accent },
  { key: 'license', label: 'License', icon: 'id-card', color: Brand.warning },
  { key: 'receipt', label: 'Receipt', icon: 'receipt', color: Brand.success },
  { key: 'other', label: 'Other', icon: 'document', color: Brand.gig },
];

export default function DocumentsModal() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeVehicle, vehicleDocuments, addDocument, deleteDocument } = useData();

  const [showAdd, setShowAdd] = useState(false);
  const [docType, setDocType] = useState<DocumentType>('registration');
  const [docName, setDocName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [fileUri, setFileUri] = useState('');

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
      if (!result.canceled && result.assets[0]) {
        setFileUri(result.assets[0].uri);
        if (!docName) setDocName(result.assets[0].name);
      }
    } catch (e) {
      console.error('Document picker error:', e);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        mediaTypes: ['images'],
      });
      if (!result.canceled && result.assets[0]) {
        setFileUri(result.assets[0].uri);
        if (!docName) setDocName('Scanned Document');
      }
    } catch (e) {
      console.error('Camera error:', e);
    }
  };

  const handleSave = async () => {
    if (!activeVehicle || !docName.trim() || !fileUri) return;
    await addDocument({
      vehicleId: activeVehicle.id,
      type: docType,
      name: docName.trim(),
      uri: fileUri,
      expiryDate: expiryDate || undefined,
    });
    setShowAdd(false);
    setDocName('');
    setExpiryDate('');
    setFileUri('');
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Document', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDocument(id) },
    ]);
  };

  // Documents with expiry alerts
  const expiringDocs = vehicleDocuments.filter(d => d.expiryDate && daysUntil(d.expiryDate) <= 30);

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      <View
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: insets.top + Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={c.text} />
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: FontSizes.lg, fontWeight: '700' }}>Documents</Text>
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)}>
          <Ionicons name={showAdd ? 'close-circle' : 'add-circle'} size={28} color={Brand.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: Spacing['5xl'] }}
        showsVerticalScrollIndicator={false}
      >
        {/* Expiry Alerts */}
        {expiringDocs.map((doc) => {
          const days = daysUntil(doc.expiryDate!);
          return (
            <View key={`alert-${doc.id}`} style={{ marginBottom: Spacing.sm }}>
              <Card
                style={{
                  borderColor: days <= 0 ? Brand.danger + '50' : Brand.warning + '50',
                  borderWidth: 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <Ionicons
                    name={days <= 0 ? 'alert-circle' : 'time'}
                    size={24}
                    color={days <= 0 ? Brand.danger : Brand.warning}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '600' }}>
                      {doc.name}
                    </Text>
                    <Text style={{ color: days <= 0 ? Brand.danger : Brand.warning, fontSize: FontSizes.sm }}>
                      {days <= 0 ? `Expired ${Math.abs(days)} days ago!` : `Expires in ${days} days`}
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
          );
        })}

        {/* Add Form */}
        {showAdd && (
          <GlassCard style={{ marginBottom: Spacing.xl }}>
            <SectionHeader title="Add Document" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md }}>
              {docTypes.map((dt) => (
                <TouchableOpacity
                  key={dt.key}
                  onPress={() => setDocType(dt.key)}
                  style={{
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: 4,
                    borderRadius: Radius.full,
                    backgroundColor: docType === dt.key ? dt.color + '20' : c.surfaceElevated,
                    borderWidth: 1,
                    borderColor: docType === dt.key ? dt.color : c.border,
                  }}
                >
                  <Text
                    style={{
                      color: docType === dt.key ? dt.color : c.textSecondary,
                      fontSize: FontSizes.xs, fontWeight: '600',
                    }}
                  >
                    {dt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input label="Document Name" value={docName} onChangeText={setDocName} placeholder="e.g. Car Insurance 2026" />
            <Input label="Expiry Date (optional)" value={expiryDate} onChangeText={setExpiryDate} placeholder="YYYY-MM-DD" />

            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
              <Button title="📎 File" onPress={handlePickDocument} variant="secondary" size="sm" style={{ flex: 1 }} />
              <Button title="📷 Scan" onPress={handlePickImage} variant="secondary" size="sm" style={{ flex: 1 }} />
            </View>

            {fileUri ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
                <Ionicons name="checkmark-circle" size={16} color={Brand.success} />
                <Text style={{ color: Brand.success, fontSize: FontSizes.sm }}>File attached</Text>
              </View>
            ) : null}

            <Button title="Save Document" onPress={handleSave} disabled={!docName.trim() || !fileUri} />
          </GlassCard>
        )}

        {/* Document List */}
        <SectionHeader title="Stored Documents" />
        {vehicleDocuments.length === 0 ? (
          <EmptyState
            icon="document-text"
            title="No Documents"
            subtitle="Store your registration, insurance, and other vehicle documents here"
            actionLabel="Add Document"
            onAction={() => setShowAdd(true)}
          />
        ) : (
          vehicleDocuments.map((doc) => {
            const dt = docTypes.find((t) => t.key === doc.type);
            return (
              <Card key={doc.id} style={{ marginBottom: Spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <View
                    style={{
                      width: 44, height: 44, borderRadius: Radius.md,
                      backgroundColor: (dt?.color || Brand.primary) + '15',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={dt?.icon || 'document'} size={22} color={dt?.color || Brand.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontSize: FontSizes.md, fontWeight: '600' }}>
                      {doc.name}
                    </Text>
                    <Text style={{ color: c.textTertiary, fontSize: FontSizes.xs }}>
                      {dt?.label || doc.type} · Added {formatDate(doc.createdAt)}
                    </Text>
                    {doc.expiryDate && (
                      <Badge
                        text={`Expires: ${formatDate(doc.expiryDate)}`}
                        color={daysUntil(doc.expiryDate) <= 14 ? Brand.danger : Brand.info}
                      />
                    )}
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(doc.id, doc.name)}>
                    <Ionicons name="trash-outline" size={18} color={c.textTertiary} />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
