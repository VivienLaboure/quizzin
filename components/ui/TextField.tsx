import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import { colors, radius, spacing } from '../../lib/theme';

type Props = TextInputProps & {
  centered?: boolean;
};

export default function TextField({ style, centered, ...rest }: Props) {
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      style={[styles.input, centered && styles.centered, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  centered: {
    textAlign: 'center',
  },
});
