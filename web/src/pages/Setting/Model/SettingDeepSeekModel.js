import React, { useEffect, useState, useRef } from 'react';
import { Button, Col, Form, Row, Spin } from '@douyinfe/semi-ui';
import {
  compareObjects,
  API,
  showError,
  showSuccess,
  showWarning,
  verifyJSON,
} from '../../../helpers';
import { useTranslation } from 'react-i18next';

const CHANNEL_TIMEOUT_EXAMPLE = {
  "deepseek-chat": {
    "100": {
      "enable": false,
      "timeout_window": 300,
      "timeout_frt_time_ms": 2000,
      "timeout_use_time": 6000,
      "disable_recovery_time": 600
    },
    "101": {
      "enable": false,
      "timeout_window": 300,
      "timeout_frt_time_ms": 2000,
      "timeout_use_time": 6000,
      "disable_recovery_time": 600
    }
  },
  "deepseek-coder": {
    "100": {
      "enable": false,
      "timeout_window": 300,
      "timeout_frt_time_ms": 3000,
      "timeout_use_time": 8000,
      "disable_recovery_time": 600
    }
  },
  "claude-3-opus": {
    "200": {
      "enable": false,
      "timeout_window": 300,
      "timeout_frt_time_ms": 3000,
      "timeout_use_time": 8000,
      "disable_recovery_time": 600
    }
  }
}

export default function SettingDeepSeekModel(props) {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [inputs, setInputs] = useState({
    'channel.timeout_disable_config': '',
  });
  const refForm = useRef();
  const [inputsRow, setInputsRow] = useState(inputs);

  async function onSubmit() {
    await refForm.current
      .validate()
      .then(() => {
        const updateArray = compareObjects(inputs, inputsRow);
        if (!updateArray.length) return showWarning(t('你似乎并没有修改什么'));
        const requestQueue = updateArray.map((item) => {
          let value = String(inputs[item.key]);
          return API.put('/api/option/', {
            key: item.key,
            value,
          });
        });
        setLoading(true);
        Promise.all(requestQueue)
          .then((res) => {
            if (requestQueue.length === 1) {
              if (res.includes(undefined)) return;
            } else if (requestQueue.length > 1) {
              if (res.includes(undefined))
                return showError(t('部分保存失败，请重试'));
            }
            showSuccess(t('保存成功'));
            props.refresh();
          })
          .catch(() => {
            showError(t('保存失败，请重试'));
          })
          .finally(() => {
            setLoading(false);
          });
      })
      .catch((error) => {
        console.error('Validation failed:', error);
        showError(t('请检查输入'));
      });
  }

  useEffect(() => {
    const currentInputs = {};
    for (let key in inputs) {
      if (props.options && props.options[key] !== undefined) {
        currentInputs[key] = props.options[key];
      } else {
        currentInputs[key] = '';
      }
    }
    setInputs(currentInputs);
    setInputsRow(structuredClone(currentInputs));
    if (refForm.current) {
      refForm.current.setValues(currentInputs);
    }
  }, [props.options]);

  return (
    <>
      <Spin spinning={loading}>
        <Form
          values={inputs}
          getFormApi={(formAPI) => (refForm.current = formAPI)}
          style={{ marginBottom: 15 }}
        >
          <Form.Section text={t('渠道超时设置')}>
            <Row>
              <Col xs={24} sm={12} md={8} lg={8} xl={8}>
                <Form.TextArea
                  label={t('渠道超时禁用配置')}
                  placeholder={
                    t('为一个 JSON 文本，例如：') +
                    '\n' +
                    JSON.stringify(CHANNEL_TIMEOUT_EXAMPLE, null, 2)
                  }
                  field={'channel.timeout_disable_config'}
                  extraText={t(
                    ''
                  )}
                  autosize={{ minRows: 6, maxRows: 12 }}
                  trigger="blur"
                  stopValidateWithError
                  rules={[
                    {
                      validator: (rule, value) => verifyJSON(value),
                      message: t('不是合法的 JSON 字符串'),
                    },
                  ]}
                  onChange={(value) =>
                    setInputs({ ...inputs, 'channel.timeout_disable_config': value })
                  }
                />
              </Col>
            </Row>
          </Form.Section>

          <Row>
            <Button size="default" onClick={onSubmit}>
              {t('保存')}
            </Button>
          </Row>
        </Form>
      </Spin>
    </>
  );
}