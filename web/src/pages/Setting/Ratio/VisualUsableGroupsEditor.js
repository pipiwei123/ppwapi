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
  Form,
  Modal,
  Tag,
  Tooltip,
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconDelete,
  IconEdit,
  IconSave,
  IconClose,
  IconInfoCircle,
} from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

const VisualUsableGroupsEditor = ({ value, onChange, disabled = false }) => {
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
        const tableData = Object.entries(parsed).map(([group, info], index) => {
          // 兼容新旧格式
          if (typeof info === 'string') {
            // 旧格式：{"vip": "VIP用户"}
            return {
              key: index.toString(),
              group,
              description: info,
              priority: 999, // 默认优先级
              originalGroup: group,
            };
          } else {
            // 新格式：{"vip": {"Description": "VIP用户", "Priority": 5}}
            return {
              key: index.toString(),
              group,
              description: info.Description || info.description || '',
              priority: info.Priority || info.priority || 999,
              originalGroup: group,
            };
          }
        });
        setData(tableData);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('解析用户可选分组JSON失败:', error);
      setData([]);
    }
  }, [value]);

  // 将表格数据转换为JSON字符串
  const updateValue = (newData) => {
    const groupsObj = {};
    newData.forEach((item) => {
      if (item.group && item.description !== undefined) {
        groupsObj[item.group] = {
          Description: item.description,
          Priority: item.priority || 999,
        };
      }
    });
    onChange(JSON.stringify(groupsObj, null, 2));
  };

  const isEditing = (record) => record.key === editingKey;

  const edit = (record) => {
    if (formApi) {
      formApi.setValues({
        group: record.group,
        description: record.description,
        priority: record.priority,
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
          description: formValues.description,
          priority: formValues.priority,
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
    const newData = data.filter((item) => item.key !== key);
    setData(newData);
    updateValue(newData);
  };

  const handleAdd = (values) => {
    const newKey = Date.now().toString();
    const newData = [
      ...data,
      {
        key: newKey,
        group: values.group,
        description: values.description,
        priority: values.priority || 999,
        originalGroup: values.group,
      },
    ];
    setData(newData);
    updateValue(newData);
    setShowAddModal(false);
    // 重置添加表单
    if (addFormApi) {
      addFormApi.reset();
    }
  };

  const getPriorityColor = (priority) => {
    if (priority <= 1) return 'red';
    if (priority <= 5) return 'orange';
    if (priority <= 10) return 'yellow';
    return 'grey';
  };

  const getPriorityText = (priority) => {
    if (priority <= 1) return '最高优先级';
    if (priority <= 5) return '高优先级';
    if (priority <= 10) return '中优先级';
    return '低优先级';
  };

  const columns = [
    {
      title: t('分组名称'),
      dataIndex: 'group',
      width: '25%',
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
                      const exists = data.some(
                        (item) =>
                          item.key !== record.key && item.group === value
                      );
                      if (exists) {
                        return Promise.reject(t('分组名称已存在'));
                      }
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            />
          );
        }
        return (
          <Tag color="cyan" size="large">
            {text}
          </Tag>
        );
      },
    },
    {
      title: t('分组描述'),
      dataIndex: 'description',
      width: '35%',
      render: (text, record) => {
        if (isEditing(record)) {
          return (
            <Form.Input
              field="description"
              initValue={record.description}
              placeholder={t('请输入分组描述')}
              style={{ margin: 0 }}
              rules={[{ required: true, message: t('分组描述不能为空') }]}
            />
          );
        }
        return <Text>{text}</Text>;
      },
    },
    {
      title: (
        <Space>
          {t('优先级')}
          <Tooltip
            content={t('数字越小优先级越高，影响分组在下拉列表中的排序')}
          >
            <IconInfoCircle size="small" />
          </Tooltip>
        </Space>
      ),
      dataIndex: 'priority',
      width: '20%',
      render: (text, record) => {
        if (isEditing(record)) {
          return (
            <Form.InputNumber
              field="priority"
              initValue={record.priority}
              placeholder={t('优先级')}
              min={1}
              max={999}
              step={1}
              style={{ width: '100%', margin: 0 }}
              rules={[
                { required: true, message: t('优先级不能为空') },
                { type: 'number', min: 1, message: t('优先级不能小于1') },
              ]}
            />
          );
        }
        return (
          <Space>
            <Tag color={getPriorityColor(text)} size="small">
              #{text}
            </Tag>
            <Text type="secondary" size="small">
              {getPriorityText(text)}
            </Text>
          </Space>
        );
      },
    },
    {
      title: t('操作'),
      dataIndex: 'operation',
      width: '20%',
      render: (_, record) => {
        const editable = isEditing(record);
        if (editable) {
          return (
            <Space>
              <Button
                theme="solid"
                type="primary"
                size="small"
                icon={<IconSave />}
                onClick={() => save(record.key)}
                disabled={disabled}
              >
                {t('保存')}
              </Button>
              <Button
                theme="light"
                type="tertiary"
                size="small"
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
              theme="light"
              type="primary"
              size="small"
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
                theme="light"
                type="danger"
                size="small"
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Title heading={6}>{t('用户可选分组可视化配置')}</Title>
          <Button
            theme="solid"
            type="primary"
            icon={<IconPlus />}
            onClick={() => setShowAddModal(true)}
            disabled={disabled || editingKey !== ''}
          >
            {t('添加分组')}
          </Button>
        </div>
        <Text type="secondary" size="small">
          {t(
            '配置用户创建令牌时可以选择的分组，优先级影响分组在下拉列表中的排序'
          )}
        </Text>
      </div>

      <Form
        getFormApi={(api) => setFormApi(api)}
        component={false}
        initValues={{}}
      >
        <Table
          dataSource={data.sort(
            (a, b) => (a.priority || 999) - (b.priority || 999)
          )}
          columns={columns}
          pagination={false}
          size="small"
          empty={
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <Text type="secondary">
                {t('暂无用户可选分组配置，点击"添加分组"开始配置')}
              </Text>
            </div>
          }
        />
      </Form>

      <Modal
        title={t('添加用户可选分组')}
        visible={showAddModal}
        onCancel={() => {
          setShowAddModal(false);
          if (addFormApi) {
            addFormApi.reset();
          }
        }}
        footer={null}
        width={520}
      >
        <Form
          onSubmit={handleAdd}
          labelPosition="left"
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
                    const exists = data.some((item) => item.group === value);
                    if (exists) {
                      return Promise.reject(t('分组名称已存在'));
                    }
                  }
                  return Promise.resolve();
                },
              },
            ]}
          />
          <Form.Input
            field="description"
            label={t('分组描述')}
            placeholder={t('请输入分组描述，如：VIP用户、超级VIP用户')}
            rules={[{ required: true, message: t('分组描述不能为空') }]}
          />
          <Form.InputNumber
            field="priority"
            label={t('优先级')}
            placeholder={t('请输入优先级，数字越小优先级越高')}
            min={1}
            max={999}
            step={1}
            initValue={999}
            style={{ width: '100%' }}
            rules={[
              { required: true, message: t('优先级不能为空') },
              { type: 'number', min: 1, message: t('优先级不能小于1') },
            ]}
          />
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Button
              onClick={() => {
                setShowAddModal(false);
                if (addFormApi) {
                  addFormApi.reset();
                }
              }}
              style={{ marginRight: 8 }}
            >
              {t('取消')}
            </Button>
            <Button theme="solid" type="primary" htmlType="submit">
              {t('添加')}
            </Button>
          </div>
        </Form>
      </Modal>
    </Card>
  );
};

export default VisualUsableGroupsEditor;
