import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { MAX_NOTE_LENGTH } from '../../utils/recipeNotes';
import { Recipe } from '../../types';
import { RecipeDetailTheme } from './types';
import { styles } from './styles';

interface NotesCardProps {
  recipe: Recipe;
  theme: RecipeDetailTheme;
  recipeNotes: Record<string, string>;
  setRecipeNote: (recipeId: string, text: string) => void;
}

export const NotesCard: React.FC<NotesCardProps> = ({
  recipe,
  theme,
  recipeNotes,
  setRecipeNote,
}) => (
  <View style={[styles.cardSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
    <Text style={[styles.sectionHeading, { color: theme.text }]}>
      📝 Notițele tale pentru această rețetă
    </Text>
    <TextInput
      style={[
        styles.notesInput,
        {
          backgroundColor: theme.inputBg,
          color: theme.text,
          borderColor: theme.border,
        },
      ]}
      placeholder="Ex: Adaugă mai mult ardei iute data viitoare, iese perfect la 200°C..."
      placeholderTextColor={theme.textMuted}
      accessibilityLabel="Notițele tale pentru această rețetă"
      multiline
      numberOfLines={3}
      maxLength={MAX_NOTE_LENGTH}
      // Read from the store by recipe id: kept after closing, and never carried
      // over to the next recipe opened.
      value={recipeNotes[recipe.id] ?? ''}
      onChangeText={(text) => setRecipeNote(recipe.id, text)}
    />
  </View>
);
