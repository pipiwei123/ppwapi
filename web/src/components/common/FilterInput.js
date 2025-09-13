import React from 'react';
import { Input, Select } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

const FilterInput = ({
  value = { operator: 'eq', text: '' },
  onChange,
  placeholder,
  prefix,
  showClear = true,
  pure = true,
  size = 'small',
  style,
  disabled,
}) => {
  const { t } = useTranslation();

  const handleOperatorChange = (operator) => {
    onChange && onChange({ ...value, operator });
  };

  const handleTextChange = (text) => {
    onChange && onChange({ ...value, text });
  };

  return (
    <div style={{ display: 'flex', gap: '8px', width: '100%', ...style }}>
      <Select
        value={value.operator}
        onChange={handleOperatorChange}
        style={{ width: 80 }}
        size={size}
        disabled={disabled}
        pure={pure}
        showClear={false}
      >
        <Select.Option value="eq">{t('等于')}</Select.Option>
        <Select.Option value="ne">{t('不等于')}</Select.Option>
      </Select>
      <Input
        value={value.text}
        onChange={handleTextChange}
        placeholder={placeholder}
        prefix={prefix}
        showClear={showClear}
        pure={pure}
        size={size}
        disabled={disabled}
        style={{ flex: 1 }}
      />
    </div>
  );
};

export default FilterInput;
