import React, { useCallback, useState, memo } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CITIZEN_FONTS } from '../../styles/citizenTheme';

/**
 * Bottom-sheet select, themed for the citizen screens (Dashboard / My
 * Activity / Submit). Mirrors SelectDropdown's behavior but pulls its
 * palette from the citizen theme object instead of ThemeContext.
 */
function SelectField({ t, label, value, placeholder, options = [], onSelect, error, disabled, style }) {
  const styles = getStyles(t);
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => {
    if (!disabled) setOpen(true);
  }, [disabled]);

  const handleClose = useCallback(() => setOpen(false), []);

  const handleSelect = useCallback(
    (option) => {
      onSelect(option);
      setOpen(false);
    },
    [onSelect]
  );

  return (
    <View style={style}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.trigger, error && styles.triggerError, disabled && styles.triggerDisabled]}
        onPress={handleOpen}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]} numberOfLines={1}>
          {value || placeholder || 'Select an option'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={t.textMuted} />
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal transparent visible={open} animationType="fade" onRequestClose={handleClose}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View style={styles.sheet}>
                {options.map((option) => (
                  <TouchableOpacity key={option} style={styles.option} onPress={() => handleSelect(option)}>
                    <Text style={[styles.optionText, value === option && styles.optionTextActive]}>{option}</Text>
                    {value === option ? <Ionicons name="checkmark" size={16} color={t.primary} /> : null}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

export default memo(SelectField);

const getStyles = (t) =>
  StyleSheet.create({
    fieldLabel: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansBold,
      fontSize: 12.5,
      marginBottom: 8,
    },
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: t.surfaceHover,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: t.borderLight,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },
    triggerError: {
      borderColor: t.danger,
    },
    triggerDisabled: {
      opacity: 0.55,
    },
    triggerText: {
      flex: 1,
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sansMedium,
      fontSize: 14,
    },
    triggerPlaceholder: {
      color: t.textMuted,
      fontFamily: CITIZEN_FONTS.sans,
    },
    errorText: {
      color: t.danger,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 11.5,
      marginTop: 6,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(4,18,31,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    sheet: {
      width: '100%',
      backgroundColor: t.surface,
      borderWidth: 1,
      borderColor: t.borderLight,
      borderRadius: 18,
      paddingVertical: 10,
      paddingHorizontal: 8,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 13,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: t.borderLight,
    },
    optionText: {
      color: t.textMain,
      fontFamily: CITIZEN_FONTS.sans,
      fontSize: 14.5,
    },
    optionTextActive: {
      color: t.primary,
      fontFamily: CITIZEN_FONTS.sansBold,
    },
  });
