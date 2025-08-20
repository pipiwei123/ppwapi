import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Input,
  InputNumber,
  Popconfirm,
  Space,
  Typography,
  Card,
  Switch,
  Divider,
  Form,
  Modal,
  Tag
} from '@douyinfe/semi-ui';
import { IconPlus, IconDelete, IconEdit, IconSave, IconClose } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

const VisualGroupRatioEditor = ({ value, onChange, disabled = false }) => {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [editingKey, setEditingKey] = useState('');
  const [formApi, setFormApi] = useState(null);
  const [addFormApi, setAddFormApi] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // 将JSON字符串转换为表格数据
  useEffect(() => {
    try {
      if (value && value.trim()) {
        const parsed = JSON.parse(value);
        const tableData = Object.entries(parsed).map(([group, ratio], index) => ({
          key: index.toString(),
          group,
          ratio: parseFloat(ratio),
          originalGroup: group // 用于编辑时的原始组名
        }));
        setData(tableData);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('解析分组倍率JSON失败:', error);
      setData([]);
    }
  }, [value]);

  // 将表格数据转换为JSON字符串
  const updateValue = (newData) => {
    const ratioObj = {};
    newData.forEach(item => {
      if (item.group && item.ratio !== undefined) {
        ratioObj[item.group] = item.ratio;
      }
    });
    onChange(JSON.stringify(ratioObj, null, 2));
  };

  const isEditing = (record) => record.key === editingKey;

  const edit = (record) => {
    if (formApi) {
      formApi.setValues({
        group: record.group,
        ratio: record.ratio,
      });
    }
    setEditingKey(record.key);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (key) => {
    if (!formApi) return;
    
    try {
      // 先验证表单
      await formApi.validate();
      // 获取表单值
      const formValues = formApi.getValues();
      const newData = [...data];
      const index = newData.findIndex((item) => key === item.key);
      
      if (index > -1) {
        const item = newData[index];
        newData.splice(index, 1, {
          ...item,
          group: formValues.group,
          ratio: formValues.ratio,
        });
        setData(newData);
        updateValue(newData);
        setEditingKey('');
      }
    } catch (errInfo) {
      console.log('保存失败:', errInfo);
    }
  };

  const handleDelete = (key) => {
    const newData = data.filter(item => item.key !== key);
    setData(newData);
    updateValue(newData);
  };

  const handleAdd = (values) => {
    const newKey = Date.now().toString();
    const newData = [...data, {
      key: newKey,
      group: values.group,
      ratio: values.ratio,
      originalGroup: values.group
    }];
    setData(newData);
    updateValue(newData);
    setShowAddModal(false);
    // 重置添加表单
    if (addFormApi) {
      addFormApi.reset();
    }
  };

  const getRatioColor = (ratio) => {
    if (ratio < 1) return 'green';
    if (ratio === 1) return 'blue'; 
    return 'orange';
  };

  const getRatioText = (ratio) => {
    return `×${ratio}`;
  };

  const columns = [
    {
      title: t('分组名称'),
      dataIndex: 'group',
      width: '40%',
      render: (text, record) => {
        if (isEditing(record)) {
          return (
            <Form.Input
              field="group"
              initValue={record.group}
              placeholder={t('请输入分组名称')}
              style={{ margin: 0 }}
              rules={[
                { required: true, message: t('分组名称不能为空') },
                { 
                  validator: (rule, value) => {
                    if (value && value !== record.originalGroup) {
                      const exists = data.some(item => 
                        item.key !== record.key && item.group === value
                      );
                      if (exists) {
                        return Promise.reject(t('分组名称已存在'));
                      }
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            />
          );
        }
        return (
          <Tag color='cyan' size='large'>
            {text}
          </Tag>
        );
      },
    },
    {
      title: t('倍率设置'),
      dataIndex: 'ratio',
      width: '30%',
      render: (text, record) => {
        if (isEditing(record)) {
          return (
            <Form.InputNumber
              field="ratio"
              initValue={record.ratio}
              placeholder={t('请输入倍率')}
              min={0}
              max={100}
              step={0.1}
              precision={2}
              style={{ width: '100%', margin: 0 }}
              rules={[
                { required: true, message: t('倍率不能为空') },
                { type: 'number', min: 0, message: t('倍率不能小于0') }
              ]}
            />
          );
        }
        return (
          <Space>
            <Tag color={getRatioColor(text)} size='large'>
              ×{text}
            </Tag>
            <Text type='secondary' size='small'>
              {getRatioText(text)}
            </Text>
          </Space>
        );
      },
    },
    {
      title: t('操作'),
      dataIndex: 'operation',
      width: '30%',
      render: (_, record) => {
        const editable = isEditing(record);
        if (editable) {
          return (
            <Space>
              <Button
                theme='solid'
                type='primary'
                size='small'
                icon={<IconSave />}
                onClick={() => save(record.key)}
                disabled={disabled}
              >
                {t('保存')}
              </Button>
              <Button
                theme='light'
                type='tertiary'
                size='small'
                icon={<IconClose />}
                onClick={cancel}
              >
                {t('取消')}
              </Button>
            </Space>
          );
        }
        return (
          <Space>
            <Button
              theme='light'
              type='primary'
              size='small'
              icon={<IconEdit />}
              onClick={() => edit(record)}
              disabled={disabled || editingKey !== ''}
            >
              {t('编辑')}
            </Button>
            <Popconfirm
              title={t('确定删除这个分组吗？')}
              onConfirm={() => handleDelete(record.key)}
              disabled={disabled}
            >
              <Button
                theme='light'
                type='danger'
                size='small'
                icon={<IconDelete />}
                disabled={disabled || editingKey !== ''}
              >
                {t('删除')}
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title heading={6}>{t('分组倍率可视化配置')}</Title>
          <Button
            theme='solid'
            type='primary'
            icon={<IconPlus />}
            onClick={() => setShowAddModal(true)}
            disabled={disabled || editingKey !== ''}
          >
            {t('添加分组')}
          </Button>
        </div>
        <Text type='secondary' size='small'>
          {t('配置不同分组的价格倍率')}
        </Text>
      </div>

      <Form 
        getFormApi={(api) => setFormApi(api)} 
        component={false}
        initValues={{}}
      >
        <Table
          dataSource={data}
          columns={columns}
          pagination={false}
          size='small'
          empty={
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <Text type='secondary'>
                {t('暂无分组倍率配置，点击"添加分组"开始配置')}
              </Text>
            </div>
          }
        />
      </Form>

      <Modal
        title={t('添加新分组')}
        visible={showAddModal}
        onCancel={() => {
          setShowAddModal(false);
          if (addFormApi) {
            addFormApi.reset();
          }
        }}
        footer={null}
        width={480}
      >
        <Form
          onSubmit={handleAdd}
          labelPosition='left'
          labelWidth={100}
          getFormApi={(api) => setAddFormApi(api)}
        >
          <Form.Input
            field="group"
            label={t('分组名称')}
            placeholder={t('请输入分组名称，如：vip, svip, trial')}
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
          <Form.InputNumber
            field="ratio"
            label={t('倍率')}
            placeholder={t('请输入倍率，如：0.8, 1.0, 1.5')}
            min={0}
            max={100}
            step={0.1}
            precision={2}
            style={{ width: '100%' }}
            rules={[
              { required: true, message: t('倍率不能为空') },
              { type: 'number', min: 0, message: t('倍率不能小于0') }
            ]}
          />
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Button
              onClick={() => {
                setShowAddModal(false);
              }}
              style={{ marginRight: 8 }}
            >
              {t('取消')}
            </Button>
            <Button
              theme='solid'
              type='primary'
              htmlType='submit'
            >
              {t('添加')}
            </Button>
          </div>
        </Form>
      </Modal>
    </Card>
  );
};

export default VisualGroupRatioEditor;
