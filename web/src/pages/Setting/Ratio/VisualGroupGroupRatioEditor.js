import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  InputNumber,
  Space,
  Typography,
  Card,
  Tag,
  Tooltip,
  Empty,
  Form,
  Modal
} from '@douyinfe/semi-ui';
import { IconInfoCircle, IconSetting, IconSave, IconClose } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';

const { Text, Title } = Typography;

const VisualGroupGroupRatioEditor = ({ value, onChange, disabled = false }) => {
  const { t } = useTranslation();
  const [data, setData] = useState({});
  const [userGroups, setUserGroups] = useState([]);
  const [tokenGroups, setTokenGroups] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUserGroup, setEditingUserGroup] = useState('');
  const [formApi, setFormApi] = useState(null);

  // 从其他配置中提取分组列表
  const extractGroupsFromOtherConfigs = () => {
    // 这里可以从全局状态或props中获取其他配置的分组
    // 暂时使用默认分组
    const defaultUserGroups = ['default', 'vip', 'svip', 'trial'];
    const defaultTokenGroups = ['default', 'vip', 'svip', 'trial'];
    setUserGroups(defaultUserGroups);
    setTokenGroups(defaultTokenGroups);
  };

  // 将JSON字符串转换为嵌套对象数据
  useEffect(() => {
    try {
      if (value && value.trim()) {
        const parsed = JSON.parse(value);
        setData(parsed || {});
      } else {
        setData({});
      }
    } catch (error) {
      console.error('解析分组特殊倍率JSON失败:', error);
      setData({});
    }
    extractGroupsFromOtherConfigs();
  }, [value]);

  // 将嵌套对象数据转换为JSON字符串
  const updateValue = (newData) => {
    onChange(JSON.stringify(newData, null, 2));
  };

  const getRatio = (userGroup, tokenGroup) => {
    return data[userGroup]?.[tokenGroup] || null;
  };

  const setRatio = (userGroup, tokenGroup, ratio) => {
    const newData = { ...data };
    if (!newData[userGroup]) {
      newData[userGroup] = {};
    }
    if (ratio === null || ratio === undefined || ratio === '') {
      delete newData[userGroup][tokenGroup];
      // 如果用户分组下没有任何令牌分组配置，删除整个用户分组
      if (Object.keys(newData[userGroup]).length === 0) {
        delete newData[userGroup];
      }
    } else {
      newData[userGroup][tokenGroup] = parseFloat(ratio);
    }
    setData(newData);
    updateValue(newData);
  };

  const openEditModal = (userGroup) => {
    setEditingUserGroup(userGroup);
    const currentRatios = {};
    tokenGroups.forEach(tokenGroup => {
      const ratio = getRatio(userGroup, tokenGroup);
      if (ratio !== null) {
        currentRatios[tokenGroup] = ratio;
      }
    });
    if (formApi) {
      formApi.setValues(currentRatios);
    }
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!formApi) return;
    
    try {
      // 先验证表单
      await formApi.validate();
      // 获取表单值
      const values = formApi.getValues();
      const newData = { ...data };
      
      if (!newData[editingUserGroup]) {
        newData[editingUserGroup] = {};
      }
      
      // 更新所有倍率
      tokenGroups.forEach(tokenGroup => {
        const ratio = values[tokenGroup];
        if (ratio !== null && ratio !== undefined && ratio !== '') {
          newData[editingUserGroup][tokenGroup] = parseFloat(ratio);
        } else if (newData[editingUserGroup][tokenGroup] !== undefined) {
          delete newData[editingUserGroup][tokenGroup];
        }
      });
      
      // 如果用户分组下没有任何配置，删除整个用户分组
      if (Object.keys(newData[editingUserGroup]).length === 0) {
        delete newData[editingUserGroup];
      }
      
      setData(newData);
      updateValue(newData);
      setShowEditModal(false);
      setEditingUserGroup('');
    } catch (error) {
      console.error('保存失败:', error);
    }
  };

  const getRatioColor = (ratio) => {
    if (!ratio) return 'grey';
    if (ratio < 1) return 'green';
    if (ratio === 1) return 'blue';
    return 'orange';
  };

  const getRatioText = (ratio) => {
    if (!ratio) return '默认';
    return `×${ratio}`;
  };

  const hasAnyConfig = () => {
    return Object.keys(data).length > 0;
  };

  const getUserGroupConfigCount = (userGroup) => {
    return Object.keys(data[userGroup] || {}).length;
  };

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Title heading={6}>{t('分组特殊倍率可视化配置')}</Title>
            <Tooltip content={t('配置特定用户分组使用特定令牌分组时的特殊倍率，未配置则使用默认倍率')}>
              <IconInfoCircle size='small' />
            </Tooltip>
          </div>
        </div>
        <Text type='secondary' size='small'>
          {t('配置不同用户分组使用不同令牌分组时的特殊价格倍率，空白表示使用默认倍率')}
        </Text>
      </div>

      {!hasAnyConfig() ? (
        <Empty
          image={<IconSetting size={48} />}
          title={t('暂无特殊倍率配置')}
          description={t('点击下方用户分组的"配置"按钮开始设置特殊倍率')}
        />
      ) : (
        <div style={{ marginBottom: 16 }}>
          <Title heading={6}>{t('当前配置概览')}</Title>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {Object.keys(data).map(userGroup => (
              <Tag key={userGroup} color='blue' size='large'>
                {userGroup}: {getUserGroupConfigCount(userGroup)}个配置
              </Tag>
            ))}
          </div>
        </div>
      )}

      <div>
        <Title heading={6}>{t('用户分组配置')}</Title>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginTop: 12 }}>
          {userGroups.map(userGroup => (
            <Card 
              key={userGroup} 
              style={{ 
                border: '1px solid var(--semi-color-border)',
                borderRadius: '8px',
                backgroundColor: hasAnyConfig() && data[userGroup] ? 'var(--semi-color-success-light-default)' : 'var(--semi-color-bg-2)'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <Tag color='cyan' size='large' style={{ marginBottom: 8 }}>
                  {userGroup}
                </Tag>
                <div style={{ marginBottom: 12 }}>
                  <Text type='secondary' size='small'>
                    {getUserGroupConfigCount(userGroup) > 0 
                      ? `已配置 ${getUserGroupConfigCount(userGroup)} 个特殊倍率`
                      : '使用默认倍率'
                    }
                  </Text>
                </div>
                <Button
                  theme='solid'
                  type='primary'
                  size='small'
                  icon={<IconSetting />}
                  onClick={() => openEditModal(userGroup)}
                  disabled={disabled}
                  style={{ width: '100%' }}
                >
                  {getUserGroupConfigCount(userGroup) > 0 ? t('编辑配置') : t('添加配置')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Modal
        title={`${t('配置用户分组')} "${editingUserGroup}" ${t('的特殊倍率')}`}
        visible={showEditModal}
        onCancel={() => {
          setShowEditModal(false);
          setEditingUserGroup('');
        }}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button
              onClick={() => {
                setShowEditModal(false);
                setEditingUserGroup('');
              }}
              style={{ marginRight: 8 }}
            >
              {t('取消')}
            </Button>
            <Button
              theme='solid'
              type='primary'
              icon={<IconSave />}
              onClick={handleSave}
            >
              {t('保存')}
            </Button>
          </div>
        }
        width={600}
      >
        <Form 
          getFormApi={(api) => setFormApi(api)} 
          labelPosition='left' 
          labelWidth={150}
        >
          <div style={{ marginBottom: 16 }}>
            <Text type='secondary' size='small'>
              {t('配置用户分组')} <Tag color='cyan'>{editingUserGroup}</Tag> {t('使用不同令牌分组时的特殊倍率，留空表示使用默认倍率')}
            </Text>
          </div>
          
          {tokenGroups.map(tokenGroup => (
            <Form.InputNumber
              key={tokenGroup}
              field={tokenGroup}
              label={`${t('令牌分组')} ${tokenGroup}`}
              placeholder={t('留空使用默认倍率')}
              min={0}
              max={100}
              step={0.1}
              precision={2}
              style={{ width: '100%' }}
              suffix={
                <Tooltip content={`${t('当前值')}: ${getRatioText(getRatio(editingUserGroup, tokenGroup))}`}>
                  <Tag color={getRatioColor(getRatio(editingUserGroup, tokenGroup))} size='small'>
                    {getRatio(editingUserGroup, tokenGroup) ? `×${getRatio(editingUserGroup, tokenGroup)}` : '默认'}
                  </Tag>
                </Tooltip>
              }
            />
          ))}
          
          <div style={{ marginTop: 16, padding: 12, backgroundColor: 'var(--semi-color-info-light-default)', borderRadius: 4 }}>
            <Text type='secondary' size='small'>
              <strong>{t('说明')}:</strong><br/>
              • {t('设置该用户分组使用不同令牌分组时的价格倍率')}<br/>
              • {t('留空的令牌分组将使用该分组的默认倍率')}<br/>
              • {t('此配置优先级高于基础分组倍率配置')}
            </Text>
          </div>
        </Form>
      </Modal>
    </Card>
  );
};

export default VisualGroupGroupRatioEditor;
