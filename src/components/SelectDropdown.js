import React, { useCallback, memo } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * A reusable select / dropdown component backed by a bottom-sheet-style modal.
 *
 * Props:
 *  - label        {string}   Field label rendered above the trigger
 *  - value        {string}   Currently selected value (shown in trigger)
 *  - placeholder  {string}   Placeholder text when nothing is selected
 *  - options      {string[]} Array of option strings
 *  - onSelect     {fn}       Called with the chosen option string
 *  - error        {string}   Optional validation error message
 *  - disabled     {bool}     Disable opening the dropdown
 *  - style        {object}   Extra style for the outer wrapper
 */
function SelectDropdown({ label, value, placeholder, options = [], onSelect, error, disabled, style }) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [open, setOpen] = React.useState(false);

  const handleOpen = useCallback(() => {
    if (!disabled) setOpen(true);
  }, [disabled]);

  const handleClose = useCallback(() => setOpen(false), []);

  const handleSelect = useCallback((option) => {
    onSelect(option);
    setOpen(false);
  }, [onSelect]);

  return (
    <View style={style}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.trigger, error && styles.triggerError, disabled && styles.triggerDisabled]}
        onPress={handleOpen}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <Text style={[styles.triggerText, !value && styles.triggerPlaceholder]}>
          {value || placeholder || 'Select an option'}
        </Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal transparent visible={open} animationType="fade" onRequestClose={handleClose}>
        <TouchableWithoutFeedback onPress={handleClose}>
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={styles.option}
                  onPress={() => handleSelect(option)}
                >
                  <Text style={[styles.optionText, value === option && styles.optionTextActive]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

export default memo(SelectDropdown);

const getStyles = (theme) =>
  StyleSheet.create({
    fieldLabel: {
      color: theme.colors.textMain,
      marginBottom: 10,
      fontWeight: '600'
    },
    trigger: {
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 16,
      paddingVertical: 16,
      marginBottom: 14
    },
    triggerError: {
      borderColor: '#ef4444',
      borderWidth: 1.5
    },
    triggerDisabled: {
      opacity: 0.55
    },
    triggerText: {
      color: theme.colors.textMain,
      fontWeight: '600'
    },
    triggerPlaceholder: {
      color: theme.colors.textMuted
    },
    errorText: {
      color: '#ef4444',
      fontSize: 12,
      marginTop: -8,
      marginBottom: 10,
      marginLeft: 4,
      fontWeight: '600'
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24
    },
    sheet: {
      width: '100%',
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      paddingVertical: 16,
      paddingHorizontal: 12
    },
    option: {
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border
    },
    optionText: {
      color: theme.colors.textMain,
      fontSize: 15
    },
    optionTextActive: {
      color: theme.colors.primary,
      fontWeight: '700'
    }
  });
