import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface TextFieldProps extends TextInputProps {
  label?: string;
}

export function TextField({ label, ...inputProps }: TextFieldProps) {
  return (
    <View className="gap-1">
      {label ? <Text className="text-sm font-medium text-ledger-gray">{label}</Text> : null}
      <TextInput
        placeholderTextColor="#8E8E93"
        className="rounded-xl border border-ledger-gray/30 px-4 py-3 text-base text-black dark:text-white"
        {...inputProps}
      />
    </View>
  );
}
