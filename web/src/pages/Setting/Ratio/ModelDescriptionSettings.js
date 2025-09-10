import React, { useEffect, useState, useRef } from 'react';
import {
  Button,
  Col,
  Form,
  Popconfirm,
  Row,
  Space,
  Spin,
} from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
  verifyJSON,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

export default function ModelDescriptionSettings(props) {
  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    ModelDescription: '',
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);
  const { t } = useTranslation();

  async function onSubmit() {
    try {
      await refForm.current
        .validate()
        .then(() => {
          const updateArray = compareObjects(inputs, inputsRow);
          if (!updateArray.length)
            return showWarning(t('你似乎并没有修改什么'));

          const requestQueue = updateArray.map((item) => {
            const value =
              typeof inputs[item.key] === 'boolean'
                ? String(inputs[item.key])
                : inputs[item.key];
            return API.put('/api/option/', { key: item.key, value });
          });

          setLoading(true);
          Promise.all(requestQueue)
            .then((res) => {
              if (res.includes(undefined)) {
                return showError(
                  requestQueue.length > 1
                    ? t('部分保存失败，请重试')
                    : t('保存失败')
                );
              }

              for (let i = 0; i < res.length; i++) {
                if (!res[i].data.success) {
                  return showError(res[i].data.message);
                }
              }

              showSuccess(t('保存成功'));
              props.refresh();
            })
            .catch((error) => {
              console.error('Unexpected error:', error);
              showError(t('保存失败，请重试'));
            })
            .finally(() => {
              setLoading(false);
            });
        })
        .catch(() => {
          showError(t('请检查输入'));
        });
    } catch (error) {
      showError(t('请检查输入'));
      console.error(error);
    }
  }

  async function resetModelDescription() {
    try {
      let res = await API.put('/api/option/', {
        key: 'ModelDescription',
        value: '{}',
      });
      if (res.data.success) {
        showSuccess(t('重置成功'));
        props.refresh();
      } else {
        showError(res.data.message);
      }
    } catch (error) {
      showError(error);
    }
  }

  useEffect(() => {
    const currentInputs = {};
    for (let key in props.options) {
      if (Object.keys(inputs).includes(key)) {
        currentInputs[key] = props.options[key];
      }
    }
    setInputs(currentInputs);
    setInputsRow(structuredClone(currentInputs));
    refForm.current.setValues(currentInputs);
  }, [props.options]);

  return (
    <Spin spinning={loading}>
      <Form
        values={inputs}
        getFormApi={(formAPI) => (refForm.current = formAPI)}
        style={{ marginBottom: 15 }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={16}>
            <Form.TextArea
              label={t('模型描述')}
              extraText={t('为一个 JSON 文本，键为模型名称，值为模型描述')}
              placeholder={t(
                '为一个 JSON 文本，键为模型名称，值为模型描述，比如 "gpt-4": "最强大的GPT-4模型，适合复杂任务"'
              )}
              field={'ModelDescription'}
              autosize={{ minRows: 6, maxRows: 12 }}
              trigger="blur"
              stopValidateWithError
              rules={[
                {
                  validator: (rule, value) => verifyJSON(value),
                  message: '不是合法的 JSON 字符串',
                },
              ]}
              onChange={(value) => setInputs({ ...inputs, ModelDescription: value })}
            />
          </Col>
        </Row>
      </Form>
      <Space>
        <Button onClick={onSubmit}>{t('保存模型描述设置')}</Button>
        <Popconfirm
          title={t('确定重置模型描述吗？')}
          content={t('此修改将不可逆')}
          okType={'danger'}
          position={'top'}
          onConfirm={resetModelDescription}
        >
          <Button type={'danger'}>{t('重置模型描述')}</Button>
        </Popconfirm>
      </Space>
    </Spin>
  );
}