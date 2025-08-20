import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Popconfirm,
  Space,
  Typography,
  Card,
  Form,
  Modal,
  Tag,
  List,
  Empty,
  Tooltip
} from '@douyinfe/semi-ui';
import { IconPlus, IconDelete, IconHandle, IconInfoCircle, IconArrowUp, IconArrowDown } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

const VisualAutoGroupsEditor = ({ value, onChange, disabled = false }) => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGroup, setNewGroup] = useState('');

  // 将JSON字符串转换为数组数据
  useEffect(() => {
    try {
      if (value && value.trim()) {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setData(parsed.map((group, index) => ({
            key: index.toString(),
            group: group,
            order: index + 1
          })));
        } else {
          setData([]);
        }
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('解析自动分组JSON失败:', error);
      setData([]);
    }
  }, [value]);

  // 将数组数据转换为JSON字符串
  const updateValue = (newData) => {
    const groupsArray = newData.map(item => item.group);
    onChange(JSON.stringify(groupsArray, null, 2));
  };

  const handleAdd = () => {
    if (!newGroup.trim()) return;
    
    // 检查是否已存在
    if (data.some(item => item.group === newGroup.trim())) {
      return;
    }

    const newKey = Date.now().toString();
    const newData = [...data, {
      key: newKey,
      group: newGroup.trim(),
      order: data.length + 1
    }];
    setData(newData);
    updateValue(newData);
    setNewGroup('');
    setShowAddModal(false);
  };

  const handleDelete = (key) => {
    const newData = data.filter(item => item.key !== key)
      .map((item, index) => ({
        ...item,
        order: index + 1
      }));
    setData(newData);
    updateValue(newData);
  };

  const moveUp = (index) => {
    if (index === 0) return;
    const newData = [...data];
    [newData[index], newData[index - 1]] = [newData[index - 1], newData[index]];
    // 重新分配order
    newData.forEach((item, idx) => {
      item.order = idx + 1;
    });
    setData(newData);
    updateValue(newData);
  };

  const moveDown = (index) => {
    if (index === data.length - 1) return;
    const newData = [...data];
    [newData[index], newData[index + 1]] = [newData[index + 1], newData[index]];
    // 重新分配order
    newData.forEach((item, idx) => {
      item.order = idx + 1;
    });
    setData(newData);
    updateValue(newData);
  };

  const getOrderColor = (order) => {
    if (order === 1) return 'red';
    if (order === 2) return 'orange';
    if (order === 3) return 'yellow';
    return 'blue';
  };

  const getOrderText = (order) => {
    if (order === 1) return '最优先';
    if (order === 2) return '次优先';
    if (order === 3) return '第三优先';
    return `第${order}优先`;
  };

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Title heading={6}>{t('自动分组降级顺序配置')}</Title>
            <Tooltip content={t('当令牌选择auto分组时，系统会按此顺序依次尝试各分组的渠道')}>
              <IconInfoCircle size='small' />
            </Tooltip>
          </div>
          <Button
            theme='solid'
            type='primary'
            icon={<IconPlus />}
            onClick={() => setShowAddModal(true)}
            disabled={disabled}
          >
            {t('添加分组')}
          </Button>
        </div>
        <Text type='secondary' size='small'>
          {t('配置auto分组的降级顺序，系统会从第一个分组开始尝试，失败后依次切换到下一个分组')}
        </Text>
      </div>

      {data.length === 0 ? (
        <Empty
          image={<IconHandle size={48} />}
          title={t('暂无自动分组配置')}
          description={t('点击"添加分组"开始配置auto分组的降级顺序')}
        />
      ) : (
        <List
          dataSource={data}
          renderItem={(item, index) => (
            <List.Item
              key={item.key}
              style={{
                padding: '12px 16px',
                border: '1px solid var(--semi-color-border)',
                borderRadius: '6px',
                marginBottom: '8px',
                backgroundColor: 'var(--semi-color-bg-2)'
              }}
              main={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Tag color={getOrderColor(item.order)} size='large'>
                    #{item.order}
                  </Tag>
                  <Tag color='cyan' size='large'>
                    {item.group}
                  </Tag>
                  <Text type='secondary' size='small'>
                    {getOrderText(item.order)}
                  </Text>
                </div>
              }
              extra={
                <Space>
                  <Button
                    theme='light'
                    type='primary'
                    size='small'
                    icon={<IconArrowUp />}
                    onClick={() => moveUp(index)}
                    disabled={disabled || index === 0}
                  >
                    {t('上移')}
                  </Button>
                  <Button
                    theme='light'
                    type='primary'
                    size='small'
                    icon={<IconArrowDown />}
                    onClick={() => moveDown(index)}
                    disabled={disabled || index === data.length - 1}
                  >
                    {t('下移')}
                  </Button>
                  <Popconfirm
                    title={t('确定删除这个分组吗？')}
                    onConfirm={() => handleDelete(item.key)}
                    disabled={disabled}
                  >
                    <Button
                      theme='light'
                      type='danger'
                      size='small'
                      icon={<IconDelete />}
                      disabled={disabled}
                    >
                      {t('删除')}
                    </Button>
                  </Popconfirm>
                </Space>
              }
            />
          )}
        />
      )}

      <Modal
        title={t('添加自动分组')}
        visible={showAddModal}
        onCancel={() => {
          setShowAddModal(false);
          setNewGroup('');
        }}
        footer={null}
        width={480}
      >
        <Form
          onSubmit={handleAdd}
          labelPosition='left'
          labelWidth={100}
        >
          <Form.Input
            field="group"
            label={t('分组名称')}
            placeholder={t('请输入分组名称，如：default, vip, svip')}
            value={newGroup}
            onChange={setNewGroup}
            rules={[
              { required: true, message: t('分组名称不能为空') },
              { 
                validator: (rule, value) => {
                  if (value) {
                    const exists = data.some(item => item.group === value);
                    if (exists) {
                      return Promise.reject(t('分组名称已存在'));
                    }
                  }
                  return Promise.resolve();
                }
              }
            ]}
          />
          <div style={{ marginTop: 24 }}>
            <Text type='secondary' size='small'>
              {t('新添加的分组将排在列表末尾，可通过上移/下移调整顺序')}
            </Text>
          </div>
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Button
              onClick={() => {
                setShowAddModal(false);
                setNewGroup('');
              }}
              style={{ marginRight: 8 }}
            >
              {t('取消')}
            </Button>
            <Button
              theme='solid'
              type='primary'
              onClick={handleAdd}
              disabled={!newGroup.trim() || data.some(item => item.group === newGroup.trim())}
            >
              {t('添加')}
            </Button>
          </div>
        </Form>
      </Modal>
    </Card>
  );
};

export default VisualAutoGroupsEditor;
