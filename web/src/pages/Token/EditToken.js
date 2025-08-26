import React, { useEffect, useState, useContext, useRef } from 'react';
import {
  API,
  showError,
  showSuccess,
  timestamp2string,
  renderGroupOption,
  renderQuotaWithPrompt,
  getModelCategories,
} from '../../helpers';
import { useIsMobile } from '../../hooks/useIsMobile.js';
import {
  Button,
  SideSheet,
  Space,
  Spin,
  Typography,
  Card,
  Tag,
  Avatar,
  Form,
  Col,
  Row,
} from '@douyinfe/semi-ui';
import {
  IconCreditCard,
  IconLink,
  IconSave,
  IconClose,
  IconKey,
} from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { StatusContext } from '../../context/Status';

const { Text, Title } = Typography;

const EditToken = (props) => {
  const { t } = useTranslation();
  const [statusState, statusDispatch] = useContext(StatusContext);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile();
  const formApiRef = useRef(null);
  const [models, setModels] = useState([]);
  const [groups, setGroups] = useState([]);
  const isEdit = props.editingToken.id !== undefined;

  const getInitValues = () => ({
    name: '',
    remain_quota: 500000,
    expired_time: -1,
    unlimited_quota: false,
    model_limits_enabled: false,
    model_limits: [],
    allow_ips: '',
    group: '',
    is_multi_group: false,
    multi_group_list: [],
    tokenCount: 1,
  });

  const handleCancel = () => {
    props.handleClose();
  };

  const setExpiredTime = (month, day, hour, minute) => {
    let now = new Date();
    let timestamp = now.getTime() / 1000;
    let seconds = month * 30 * 24 * 60 * 60;
    seconds += day * 24 * 60 * 60;
    seconds += hour * 60 * 60;
    seconds += minute * 60;
    if (!formApiRef.current) return;
    if (seconds !== 0) {
      timestamp += seconds;
      formApiRef.current.setValue('expired_time', timestamp2string(timestamp));
    } else {
      formApiRef.current.setValue('expired_time', -1);
    }
  };

  const loadModels = async () => {
    let res = await API.get(`/api/user/models`);
    const { success, message, data } = res.data;
    if (success) {
      const categories = getModelCategories(t);
      let localModelOptions = data.map((model) => {
        let icon = null;
        for (const [key, category] of Object.entries(categories)) {
          if (key !== 'all' && category.filter({ model_name: model })) {
            icon = category.icon;
            break;
          }
        }
        return {
          label: (
            <span className="flex items-center gap-1">
              {icon}
              {model}
            </span>
          ),
          value: model,
        };
      });
      setModels(localModelOptions);
    } else {
      showError(t(message));
    }
  };

  const loadGroups = async () => {
    let res = await API.get(`/api/user/self/groups`);
    const { success, message, data } = res.data;
    if (success) {
      // 新的API返回按优先级排序的数组，直接转换为所需格式
      let localGroupOptions = data.map((groupInfo) => ({
        label: groupInfo.desc,
        value: groupInfo.name,
        ratio: groupInfo.ratio,
        priority: groupInfo.priority,
      }));

      // 如果启用了自动选择分组，但数据中没有auto分组，则添加
      if (statusState?.status?.default_use_auto_group) {
        const hasAutoGroup = localGroupOptions.some(
          (group) => group.value === 'auto'
        );
        if (!hasAutoGroup) {
          localGroupOptions.unshift({
            label: t('自动选择'),
            value: 'auto',
            ratio: '自动',
            priority: 0,
          });
        }
      }

      setGroups(localGroupOptions);

      // 如果启用了默认使用自动分组，设置默认值
      if (statusState?.status?.default_use_auto_group && formApiRef.current) {
        formApiRef.current.setValue('group', 'auto');
      }
    } else {
      showError(t(message));
    }
  };

  const loadToken = async () => {
    setLoading(true);
    let res = await API.get(`/api/token/${props.editingToken.id}`);
    const { success, message, data } = res.data;
    if (success) {
      if (data.expired_time !== -1) {
        data.expired_time = timestamp2string(data.expired_time);
      }
      if (data.model_limits !== '') {
        data.model_limits = data.model_limits.split(',');
      } else {
        data.model_limits = [];
      }

      // 处理多分组数据
      if (data.group_info && data.group_info.is_multi_group) {
        data.is_multi_group = data.group_info.is_multi_group;
        data.multi_group_list = Array.isArray(data.group_info.multi_group_list)
          ? data.group_info.multi_group_list
          : [];
      } else if (data.group && data.group.includes(',')) {
        // 兼容逗号分隔的group字段（历史数据或手动修改的数据）
        data.is_multi_group = true;
        data.multi_group_list = data.group
          .split(',')
          .map((g) => g.trim())
          .filter((g) => g);
      } else {
        data.is_multi_group = false;
        // 单分组模式下，multi_group_list应该为空数组，而不是包含单个分组
        data.multi_group_list = [];
      }

      console.log('Loading token data:', {
        is_multi_group: data.is_multi_group,
        multi_group_list: data.multi_group_list,
        group: data.group,
        group_info: data.group_info,
      });

      if (formApiRef.current) {
        // 确保所有数据都已准备就绪再设置表单值
        const formData = { ...getInitValues(), ...data };
        console.log('Setting form values:', formData);

        // 等待下一个事件循环，确保组件已完全渲染
        setTimeout(() => {
          formApiRef.current.setValues(formData);
          // 强制触发表单重新渲染
          setTimeout(() => {
            formApiRef.current.setValue(
              'is_multi_group',
              formData.is_multi_group
            );
            if (
              formData.is_multi_group &&
              Array.isArray(formData.multi_group_list)
            ) {
              formApiRef.current.setValue('multi_group_list', [
                ...formData.multi_group_list,
              ]);
            }
          }, 50);
        }, 100);
      }
    } else {
      showError(message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (formApiRef.current) {
      if (!isEdit) {
        formApiRef.current.setValues(getInitValues());
      }
    }
    loadModels();
    loadGroups();
  }, [props.editingToken.id]);

  useEffect(() => {
    if (props.visiable) {
      if (isEdit) {
        // 确保分组数据加载完成后再加载token数据
        const loadTokenWithDelay = async () => {
          if (groups.length === 0) {
            await loadGroups();
          }
          await loadToken();
        };
        loadTokenWithDelay();
      } else {
        formApiRef.current?.setValues(getInitValues());
      }
    } else {
      formApiRef.current?.reset();
    }
  }, [props.visiable, props.editingToken.id]);

  const generateRandomSuffix = () => {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  const submit = async (values) => {
    setLoading(true);
    if (isEdit) {
      let { tokenCount: _tc, ...localInputs } = values;
      localInputs.remain_quota = parseInt(localInputs.remain_quota);
      if (localInputs.expired_time !== -1) {
        let time = Date.parse(localInputs.expired_time);
        if (isNaN(time)) {
          showError(t('过期时间格式错误！'));
          setLoading(false);
          return;
        }
        localInputs.expired_time = Math.ceil(time / 1000);
      }
      localInputs.model_limits = localInputs.model_limits.join(',');
      localInputs.model_limits_enabled = localInputs.model_limits.length > 0;

      // 处理多分组数据
      if (
        localInputs.is_multi_group &&
        Array.isArray(localInputs.multi_group_list) &&
        localInputs.multi_group_list.length > 0
      ) {
        localInputs.group_info = {
          is_multi_group: true,
          multi_group_size: localInputs.multi_group_list.length,
          multi_group_list: localInputs.multi_group_list,
          multi_group_status_list: {},
          current_group_index: 0,
        };
        // 将多分组用逗号连接存储到group字段
        localInputs.group = localInputs.multi_group_list.join(',');
      } else {
        localInputs.group_info = {
          is_multi_group: false,
          multi_group_size: 0,
          multi_group_list: [],
          multi_group_status_list: {},
          current_group_index: 0,
        };
        // 单分组模式保持原格式
      }

      let res = await API.put(`/api/token/`, {
        ...localInputs,
        id: parseInt(props.editingToken.id),
      });
      const { success, message } = res.data;
      if (success) {
        showSuccess(t('令牌更新成功！'));
        props.refresh();
        props.handleClose();
      } else {
        showError(t(message));
      }
    } else {
      const count = parseInt(values.tokenCount, 10) || 1;
      let successCount = 0;
      for (let i = 0; i < count; i++) {
        let { tokenCount: _tc, ...localInputs } = values;
        const baseName =
          values.name.trim() === '' ? 'default' : values.name.trim();
        if (i !== 0 || values.name.trim() === '') {
          localInputs.name = `${baseName}-${generateRandomSuffix()}`;
        } else {
          localInputs.name = baseName;
        }
        localInputs.remain_quota = parseInt(localInputs.remain_quota);

        if (localInputs.expired_time !== -1) {
          let time = Date.parse(localInputs.expired_time);
          if (isNaN(time)) {
            showError(t('过期时间格式错误！'));
            setLoading(false);
            break;
          }
          localInputs.expired_time = Math.ceil(time / 1000);
        }
        localInputs.model_limits = localInputs.model_limits.join(',');
        localInputs.model_limits_enabled = localInputs.model_limits.length > 0;

        // 处理多分组数据
        if (
          localInputs.is_multi_group &&
          Array.isArray(localInputs.multi_group_list) &&
          localInputs.multi_group_list.length > 0
        ) {
          localInputs.group_info = {
            is_multi_group: true,
            multi_group_size: localInputs.multi_group_list.length,
            multi_group_list: localInputs.multi_group_list,
            multi_group_status_list: {},
            current_group_index: 0,
          };
          // 将多分组用逗号连接存储到group字段
          localInputs.group = localInputs.multi_group_list.join(',');
        } else {
          localInputs.group_info = {
            is_multi_group: false,
            multi_group_size: 0,
            multi_group_list: [],
            multi_group_status_list: {},
            current_group_index: 0,
          };
          // 单分组模式保持原格式
        }

        let res = await API.post(`/api/token/`, localInputs);
        const { success, message } = res.data;
        if (success) {
          successCount++;
        } else {
          showError(t(message));
          break;
        }
      }
      if (successCount > 0) {
        showSuccess(t('令牌创建成功，请在列表页面点击复制获取令牌！'));
        props.refresh();
        props.handleClose();
      }
    }
    setLoading(false);
    formApiRef.current?.setValues(getInitValues());
  };

  return (
    <SideSheet
      placement={isEdit ? 'right' : 'left'}
      title={
        <Space>
          {isEdit ? (
            <Tag color="blue" shape="circle">
              {t('更新')}
            </Tag>
          ) : (
            <Tag color="green" shape="circle">
              {t('新建')}
            </Tag>
          )}
          <Title heading={4} className="m-0">
            {isEdit ? t('更新令牌信息') : t('创建新的令牌')}
          </Title>
        </Space>
      }
      bodyStyle={{ padding: '0' }}
      visible={props.visiable}
      width={isMobile ? '100%' : 600}
      footer={
        <div className="flex justify-end bg-white">
          <Space>
            <Button
              theme="solid"
              className="!rounded-lg"
              onClick={() => formApiRef.current?.submitForm()}
              icon={<IconSave />}
              loading={loading}
            >
              {t('提交')}
            </Button>
            <Button
              theme="light"
              className="!rounded-lg"
              type="primary"
              onClick={handleCancel}
              icon={<IconClose />}
            >
              {t('取消')}
            </Button>
          </Space>
        </div>
      }
      closeIcon={null}
      onCancel={() => handleCancel()}
    >
      <Spin spinning={loading}>
        <Form
          key={isEdit ? 'edit' : 'new'}
          initValues={getInitValues()}
          getFormApi={(api) => (formApiRef.current = api)}
          onSubmit={submit}
        >
          {({ values }) => (
            <div className="p-2">
              {/* 基本信息 */}
              <Card className="!rounded-2xl shadow-sm border-0">
                <div className="flex items-center mb-2">
                  <Avatar size="small" color="blue" className="mr-2 shadow-md">
                    <IconKey size={16} />
                  </Avatar>
                  <div>
                    <Text className="text-lg font-medium">{t('基本信息')}</Text>
                    <div className="text-xs text-gray-600">
                      {t('设置令牌的基本信息')}
                    </div>
                  </div>
                </div>
                <Row gutter={12}>
                  <Col span={24}>
                    <Form.Input
                      field="name"
                      label={t('名称')}
                      placeholder={t('请输入名称')}
                      rules={[{ required: true, message: t('请输入名称') }]}
                      showClear
                    />
                  </Col>
                  <Col span={24}>
                    <Form.Switch
                      field="is_multi_group"
                      label={
                        <div className="flex items-center gap-2">
                          <span>{t('多分组模式')}</span>
                          <Tag color="blue" size="small">
                            {t('高级功能')}
                          </Tag>
                        </div>
                      }
                      size="large"
                      extraText={
                        <div className="text-sm text-gray-600 mt-1">
                          <div className="mb-1">
                            {t(
                              '启用后可为令牌配置多个分组，支持按优先级自动切换'
                            )}
                          </div>
                          <div className="text-xs text-blue-600">
                            {t(
                              '示例：优先使用VIP分组（折扣价），不可用时自动切换到默认分组'
                            )}
                          </div>
                        </div>
                      }
                    />
                  </Col>
                  {!values.is_multi_group ? (
                    <Col span={24}>
                      {groups.length > 0 ? (
                        <div className="space-y-3">
                          <Form.Select
                            field="group"
                            label={
                              <div className="flex items-center gap-2">
                                <span>{t('令牌分组')}</span>
                                <Tag color="grey" size="small">
                                  {t('单分组')}
                                </Tag>
                                {values.group && (
                                  <Tag color="blue" size="small">
                                    {values.group}
                                  </Tag>
                                )}
                              </div>
                            }
                            placeholder={t('请选择分组，默认为用户的分组')}
                            optionList={groups}
                            renderOptionItem={renderGroupOption}
                            showClear
                            filter
                            value={values.group}
                            style={{ width: '100%' }}
                            extraText={t('传统模式：令牌固定使用一个分组')}
                          />

                          {/* 单分组预览 */}
                          {values.group && (
                            <Card className="!rounded-lg border-0 bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <Text className="text-sm font-medium text-gray-800">
                                  {t('当前分组信息')}
                                </Text>
                              </div>
                              <div className="flex items-center gap-2 p-2 bg-white rounded-md border">
                                {(() => {
                                  const group = groups.find(
                                    (g) => g.value === values.group
                                  );
                                  return (
                                    <div className="flex items-center gap-2">
                                      <Text strong size="small">
                                        {values.group}
                                      </Text>
                                      {group?.label && (
                                        <Text type="tertiary" size="small">
                                          ({group.label})
                                        </Text>
                                      )}
                                      {group?.ratio && (
                                        <Tag
                                          size="small"
                                          color={
                                            group.ratio < 1
                                              ? 'green'
                                              : group.ratio === 1
                                                ? 'blue'
                                                : 'orange'
                                          }
                                        >
                                          ×{group.ratio}
                                        </Tag>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>
                            </Card>
                          )}
                        </div>
                      ) : (
                        <Form.Select
                          placeholder={t('管理员未设置用户可选分组')}
                          disabled
                          label={t('令牌分组')}
                          style={{ width: '100%' }}
                        />
                      )}
                    </Col>
                  ) : (
                    <Col span={24}>
                      {groups.length > 0 ? (
                        <div className="space-y-3">
                          <Form.Select
                            field="multi_group_list"
                            label={
                              <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                  <span>{t('多分组配置')}</span>
                                  <Tag color="green" size="small">
                                    {t('智能切换')}
                                  </Tag>
                                  {Array.isArray(values.multi_group_list) &&
                                    values.multi_group_list.length > 0 && (
                                      <Tag color="blue" size="small">
                                        {values.multi_group_list.length}个已选择
                                      </Tag>
                                    )}
                                </div>
                                {/* 全选操作按钮 */}
                                <div className="flex items-center gap-1">
                                  <Button
                                    theme="borderless"
                                    size="small"
                                    type="tertiary"
                                    onClick={() => {
                                      const availableGroups = groups
                                        .filter((g) => g.value !== 'auto')
                                        .map((g) => g.value);
                                      const currentList =
                                        values.multi_group_list || [];
                                      const isAllSelected =
                                        availableGroups.length > 0 &&
                                        availableGroups.every((group) =>
                                          currentList.includes(group)
                                        );

                                      if (isAllSelected) {
                                        // 取消全选
                                        formApiRef.current?.setValue(
                                          'multi_group_list',
                                          []
                                        );
                                      } else {
                                        // 全选，按优先级排序
                                        const sortedGroups = [
                                          ...availableGroups,
                                        ].sort((a, b) => {
                                          const groupA = groups.find(
                                            (g) => g.value === a
                                          );
                                          const groupB = groups.find(
                                            (g) => g.value === b
                                          );
                                          return (
                                            (groupA?.priority || 999) -
                                            (groupB?.priority || 999)
                                          );
                                        });
                                        formApiRef.current?.setValue(
                                          'multi_group_list',
                                          sortedGroups
                                        );
                                      }
                                    }}
                                    style={{
                                      fontSize: '12px',
                                      padding: '2px 6px',
                                      color: (() => {
                                        const availableGroups = groups
                                          .filter((g) => g.value !== 'auto')
                                          .map((g) => g.value);
                                        const currentList =
                                          values.multi_group_list || [];
                                        const isAllSelected =
                                          availableGroups.length > 0 &&
                                          availableGroups.every((group) =>
                                            currentList.includes(group)
                                          );
                                        return isAllSelected
                                          ? '#ff4d4f'
                                          : '#1890ff';
                                      })(),
                                    }}
                                  >
                                    {(() => {
                                      const availableGroups = groups
                                        .filter((g) => g.value !== 'auto')
                                        .map((g) => g.value);
                                      const currentList =
                                        values.multi_group_list || [];
                                      const isAllSelected =
                                        availableGroups.length > 0 &&
                                        availableGroups.every((group) =>
                                          currentList.includes(group)
                                        );
                                      return isAllSelected
                                        ? t('取消全选')
                                        : t('全选');
                                    })()}
                                  </Button>
                                  <Text type="tertiary" size="small">
                                    {
                                      groups.filter((g) => g.value !== 'auto')
                                        .length
                                    }
                                    个分组
                                  </Text>
                                </div>
                              </div>
                            }
                            placeholder={t(
                              '按优先级选择多个分组，第一个最优先'
                            )}
                            optionList={groups.filter(
                              (g) => g.value !== 'auto'
                            )}
                            renderOptionItem={renderGroupOption}
                            multiple
                            maxTagCount={3}
                            showRestTagsPopover
                            restTagsPopoverProps={{ showArrow: true }}
                            filter
                            searchPosition="dropdown"
                            value={values.multi_group_list || []}
                            style={{ width: '100%' }}
                            extraText={
                              <div className="text-sm space-y-1">
                                <div className="text-gray-600">
                                  {t(
                                    '分组将按选择顺序调用，第一个分组不可用时自动切换到下一个'
                                  )}
                                </div>
                                <div className="text-blue-600 text-xs">
                                  {t('建议：将折扣分组放在前面，可以节省成本')}
                                </div>
                                <div className="text-red-600 text-xs">
                                  {t(
                                    '注意：多分组模式不支持auto分组，如需使用auto分组请切换为单分组模式'
                                  )}
                                </div>
                                <div className="text-orange-600 text-xs">
                                  {t(
                                    '提示：最多建议配置3-5个分组，避免过于复杂'
                                  )}
                                </div>
                                <div className="text-green-600 text-xs">
                                  {t(
                                    '快捷：点击右上角"全选"可一键选择所有分组，按优先级自动排序'
                                  )}
                                </div>
                              </div>
                            }
                          />

                          {/* 优先级预览 */}
                          {Array.isArray(values.multi_group_list) &&
                            values.multi_group_list.length > 0 && (
                              <Card className="!rounded-lg border-0 bg-blue-50">
                                <div className="flex items-center justify-between mb-3">
                                  <Text className="text-sm font-medium text-blue-800">
                                    {t('调用优先级预览')}
                                  </Text>
                                  <div className="flex items-center gap-2">
                                    <Text
                                      type="tertiary"
                                      size="small"
                                      className="text-blue-600"
                                    >
                                      {values.multi_group_list.length}{' '}
                                      {t('个分组')}
                                    </Text>
                                    {(() => {
                                      const availableGroups = groups
                                        .filter((g) => g.value !== 'auto')
                                        .map((g) => g.value);
                                      const currentList =
                                        values.multi_group_list || [];
                                      const isAllSelected =
                                        availableGroups.length > 0 &&
                                        availableGroups.every((group) =>
                                          currentList.includes(group)
                                        );

                                      if (
                                        isAllSelected &&
                                        currentList.length ===
                                          availableGroups.length
                                      ) {
                                        return (
                                          <Tag color="green" size="small">
                                            {t('已全选')}
                                          </Tag>
                                        );
                                      } else if (
                                        currentList.length >
                                        availableGroups.length * 0.5
                                      ) {
                                        return (
                                          <Tag color="orange" size="small">
                                            {t('多数已选')}
                                          </Tag>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </div>
                                {/* 紧凑展示模式 - 自动换行 */}
                                <div className="flex flex-wrap gap-2 p-2 bg-white rounded-md border border-blue-100">
                                  {(values.multi_group_list || []).map(
                                    (groupValue, index) => {
                                      const group = groups.find(
                                        (g) => g.value === groupValue
                                      );
                                      return (
                                        <div
                                          key={`${groupValue}-${index}`}
                                          className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-md border relative group hover:bg-gray-100 transition-colors"
                                        >
                                          <span className="bg-blue-500 text-white px-2 py-1 rounded-full font-mono text-xs min-w-[20px] h-[20px] flex items-center justify-center">
                                            {index + 1}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            <Text strong size="small">
                                              {groupValue}
                                            </Text>
                                            {group?.label && (
                                              <Text
                                                type="tertiary"
                                                size="small"
                                              >
                                                ({group.label})
                                              </Text>
                                            )}
                                            {group?.ratio && (
                                              <Tag
                                                size="small"
                                                color={
                                                  group.ratio < 1
                                                    ? 'green'
                                                    : group.ratio === 1
                                                      ? 'blue'
                                                      : 'orange'
                                                }
                                              >
                                                ×{group.ratio}
                                              </Tag>
                                            )}
                                            {index === 0 && (
                                              <Tag size="small" color="red">
                                                {t('优先')}
                                              </Tag>
                                            )}
                                          </div>
                                          {/* 快速移除按钮 */}
                                          <Button
                                            theme="borderless"
                                            size="small"
                                            type="danger"
                                            className="!p-0 !min-w-0 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                            style={{
                                              width: '16px',
                                              height: '16px',
                                              fontSize: '10px',
                                            }}
                                            onClick={() => {
                                              const currentList =
                                                values.multi_group_list || [];
                                              const newList =
                                                currentList.filter(
                                                  (g) => g !== groupValue
                                                );
                                              formApiRef.current?.setValue(
                                                'multi_group_list',
                                                newList
                                              );
                                            }}
                                          >
                                            ×
                                          </Button>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>

                                {/* 快捷操作区域 */}
                                <div className="mt-3 pt-3 border-t border-blue-200 flex items-center justify-between">
                                  <Text
                                    type="tertiary"
                                    size="small"
                                    className="text-blue-600"
                                  >
                                    {t(
                                      '成本预估：API调用将优先使用折扣更高的分组，有效降低使用成本'
                                    )}
                                  </Text>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      theme="borderless"
                                      size="small"
                                      type="tertiary"
                                      onClick={() => {
                                        // 按优先级重新排序
                                        const currentList =
                                          values.multi_group_list || [];
                                        const sortedList = [
                                          ...currentList,
                                        ].sort((a, b) => {
                                          const groupA = groups.find(
                                            (g) => g.value === a
                                          );
                                          const groupB = groups.find(
                                            (g) => g.value === b
                                          );
                                          return (
                                            (groupA?.priority || 999) -
                                            (groupB?.priority || 999)
                                          );
                                        });
                                        formApiRef.current?.setValue(
                                          'multi_group_list',
                                          sortedList
                                        );
                                      }}
                                      style={{
                                        fontSize: '11px',
                                        padding: '1px 4px',
                                      }}
                                    >
                                      {t('重排序')}
                                    </Button>
                                    <Button
                                      theme="borderless"
                                      size="small"
                                      type="danger"
                                      onClick={() => {
                                        formApiRef.current?.setValue(
                                          'multi_group_list',
                                          []
                                        );
                                      }}
                                      style={{
                                        fontSize: '11px',
                                        padding: '1px 4px',
                                      }}
                                    >
                                      {t('清空')}
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            )}
                        </div>
                      ) : (
                        <Form.Select
                          placeholder={t('管理员未设置用户可选分组')}
                          disabled
                          label={t('多分组配置')}
                          style={{ width: '100%' }}
                        />
                      )}
                    </Col>
                  )}
                  <Col xs={24} sm={24} md={24} lg={10} xl={10}>
                    <Form.DatePicker
                      field="expired_time"
                      label={t('过期时间')}
                      type="dateTime"
                      placeholder={t('请选择过期时间')}
                      rules={[
                        { required: true, message: t('请选择过期时间') },
                        {
                          validator: (rule, value) => {
                            // 允许 -1 表示永不过期，也允许空值在必填校验时被拦截
                            if (value === -1 || !value)
                              return Promise.resolve();
                            const time = Date.parse(value);
                            if (isNaN(time)) {
                              return Promise.reject(t('过期时间格式错误！'));
                            }
                            if (time <= Date.now()) {
                              return Promise.reject(
                                t('过期时间不能早于当前时间！')
                              );
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                      showClear
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col xs={24} sm={24} md={24} lg={14} xl={14}>
                    <Form.Slot label={t('过期时间快捷设置')}>
                      <Space wrap>
                        <Button
                          theme="light"
                          type="primary"
                          onClick={() => setExpiredTime(0, 0, 0, 0)}
                        >
                          {t('永不过期')}
                        </Button>
                        <Button
                          theme="light"
                          type="tertiary"
                          onClick={() => setExpiredTime(1, 0, 0, 0)}
                        >
                          {t('一个月')}
                        </Button>
                        <Button
                          theme="light"
                          type="tertiary"
                          onClick={() => setExpiredTime(0, 1, 0, 0)}
                        >
                          {t('一天')}
                        </Button>
                        <Button
                          theme="light"
                          type="tertiary"
                          onClick={() => setExpiredTime(0, 0, 1, 0)}
                        >
                          {t('一小时')}
                        </Button>
                      </Space>
                    </Form.Slot>
                  </Col>
                  {!isEdit && (
                    <Col span={24}>
                      <Form.InputNumber
                        field="tokenCount"
                        label={t('新建数量')}
                        min={1}
                        extraText={t('批量创建时会在名称后自动添加随机后缀')}
                        rules={[
                          { required: true, message: t('请输入新建数量') },
                        ]}
                        style={{ width: '100%' }}
                      />
                    </Col>
                  )}
                </Row>
              </Card>

              {/* 额度设置 */}
              <Card className="!rounded-2xl shadow-sm border-0">
                <div className="flex items-center mb-2">
                  <Avatar size="small" color="green" className="mr-2 shadow-md">
                    <IconCreditCard size={16} />
                  </Avatar>
                  <div>
                    <Text className="text-lg font-medium">{t('额度设置')}</Text>
                    <div className="text-xs text-gray-600">
                      {t('设置令牌可用额度和数量')}
                    </div>
                  </div>
                </div>
                <Row gutter={12}>
                  <Col span={24}>
                    <Form.AutoComplete
                      field="remain_quota"
                      label={t('额度')}
                      placeholder={t('请输入额度')}
                      type="number"
                      disabled={values.unlimited_quota}
                      extraText={renderQuotaWithPrompt(values.remain_quota)}
                      rules={
                        values.unlimited_quota
                          ? []
                          : [{ required: true, message: t('请输入额度') }]
                      }
                      data={[
                        { value: 500000, label: '1$' },
                        { value: 5000000, label: '10$' },
                        { value: 25000000, label: '50$' },
                        { value: 50000000, label: '100$' },
                        { value: 250000000, label: '500$' },
                        { value: 500000000, label: '1000$' },
                      ]}
                    />
                  </Col>
                  <Col span={24}>
                    <Form.Switch
                      field="unlimited_quota"
                      label={t('无限额度')}
                      size="large"
                      extraText={t(
                        '令牌的额度仅用于限制令牌本身的最大额度使用量，实际的使用受到账户的剩余额度限制'
                      )}
                    />
                  </Col>
                </Row>
              </Card>

              {/* 访问限制 */}
              <Card className="!rounded-2xl shadow-sm border-0">
                <div className="flex items-center mb-2">
                  <Avatar
                    size="small"
                    color="purple"
                    className="mr-2 shadow-md"
                  >
                    <IconLink size={16} />
                  </Avatar>
                  <div>
                    <Text className="text-lg font-medium">{t('访问限制')}</Text>
                    <div className="text-xs text-gray-600">
                      {t('设置令牌的访问限制')}
                    </div>
                  </div>
                </div>
                <Row gutter={12}>
                  <Col span={24}>
                    <Form.Select
                      field="model_limits"
                      label={t('模型限制列表')}
                      placeholder={t(
                        '请选择该令牌支持的模型，留空支持所有模型'
                      )}
                      multiple
                      optionList={models}
                      extraText={t('非必要，不建议启用模型限制')}
                      filter
                      searchPosition="dropdown"
                      showClear
                      style={{ width: '100%' }}
                    />
                  </Col>
                  <Col span={24}>
                    <Form.TextArea
                      field="allow_ips"
                      label={t('IP白名单')}
                      placeholder={t('允许的IP，一行一个，不填写则不限制')}
                      autosize
                      rows={1}
                      extraText={t('请勿过度信任此功能，IP可能被伪造')}
                      showClear
                      style={{ width: '100%' }}
                    />
                  </Col>
                </Row>
              </Card>
            </div>
          )}
        </Form>
      </Spin>
    </SideSheet>
  );
};

export default EditToken;
